#!/usr/bin/env python3
"""Generate the published legal page templates from the repository Markdown.

    python3 scripts/build-legal-pages.py     # run from the repository root

TERMS-OF-SERVICE.md and PRIVACY-POLICY.md are the source of truth. This script
renders them into src/legal-pages/*.html for publication on the CMS, stripping
material written for maintainers rather than the public:

  * the "Not legal advice" banners addressed to the repository owner
  * the ToS note about the unresolved HubSpot redistribution-policy question,
    and the section 8 sentence that cross-referenced it
  * Privacy section 10's grep-based verification recipe, replaced with a
    public-facing equivalent that preserves the section numbering

Re-run this after editing either Markdown file, then upload with:

    hs cms upload src/legal-pages src/legal-pages --account=<account>

Publishing the pages themselves needs a personal access key with the `content`
scope; see POST /cms/v3/pages/site-pages.
"""
import re, html, io, os

def strip_internal(text, which):
    # Remove the author-facing "Not legal advice" banner
    text = re.sub(r'> \*\*Not legal advice\.\*\*.*?\n\n', '', text, flags=re.S)
    if which == 'tos':
        # The §11 note is stripped below, so remove the sentence pointing at it
        text = re.sub(r', and see §11 for an open question about paid GPL\s+listings on the marketplace', '', text)
        # Remove the unresolved HubSpot policy question (internal only)
        text = re.sub(r'> \*\*Open question to confirm with HubSpot before listing:\*\*.*?\n\n',
                      '', text, flags=re.S)
    else:
        # Replace the repo-verification section with a public-appropriate equivalent
        start = text.index('## 10. Verifying the claims in section 2')
        end = text.index('## 11. Changes to this policy')
        text = text[:start] + (
            "## 10. How to verify these claims\n\n"
            "The Assets are free software, distributed under the GNU General Public\n"
            "License. You do not have to take section 2 on trust: the complete source of\n"
            "each Asset is available to you, and you are free to inspect it for network\n"
            "requests, cookies, storage writes, or tracking code. Neither Asset references\n"
            "an external URL at render time.\n\n"
            "If a future release introduces any such behaviour, sections 2 and 3 of this\n"
            "policy will be updated before that release ships.\n\n"
        ) + text[end:]
    return text

def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)',
               r'<a href="\2" rel="noopener">\1</a>', s)
    return s

def md_to_html(md):
    out, i, lines = [], 0, md.split('\n')
    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1; continue
        if ln.startswith('---') and set(ln.strip()) == {'-'}:
            i += 1; continue
        m = re.match(r'^(#{1,3}) (.*)', ln)
        if m:
            lvl = len(m.group(1))
            out.append('<h%d>%s</h%d>' % (lvl, inline(m.group(2)), lvl)); i += 1; continue
        if ln.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(lines[i]); i += 1
            cells = [[c.strip() for c in r.strip('|').split('|')] for r in rows]
            body = [c for c in cells if not all(set(x) <= set('-: ') and x for x in c)]
            out.append('<div class="table-wrap"><table>')
            out.append('<thead><tr>' + ''.join('<th>%s</th>' % inline(c) for c in body[0]) + '</tr></thead><tbody>')
            for r in body[1:]:
                out.append('<tr>' + ''.join('<td>%s</td>' % inline(c) for c in r) + '</tr>')
            out.append('</tbody></table></div>'); continue
        if re.match(r'^- ', ln):
            items = []
            while i < len(lines) and (re.match(r'^- ', lines[i]) or re.match(r'^  \S', lines[i])):
                if re.match(r'^- ', lines[i]): items.append(lines[i][2:])
                else: items[-1] += ' ' + lines[i].strip()
                i += 1
            out.append('<ul>' + ''.join('<li>%s</li>' % inline(x) for x in items) + '</ul>'); continue
        if ln.startswith('> '):
            buf = []
            while i < len(lines) and lines[i].startswith('>'):
                buf.append(lines[i].lstrip('>').strip()); i += 1
            out.append('<blockquote><p>%s</p></blockquote>' % inline(' '.join(buf))); continue
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#|\||- |> |---)', lines[i]):
            buf.append(lines[i].strip()); i += 1
        # Label lines ("**Contact:** ...") and the contact block ("`Name`") are
        # discrete lines, not prose: keep the breaks and drop the code styling.
        if buf and all(re.match(r'^(\*\*|`)', b) for b in buf):
            plain = [b.replace('`', '') for b in buf]
            out.append('<p class="legal-doc__meta">%s</p>' % '<br>'.join(inline(x) for x in plain))
        else:
            out.append('<p>%s</p>' % inline(' '.join(buf)))
    return '\n'.join(out)

TPL = '''<!--
    templateType: page
    isAvailableForNewContent: true
-->
<!doctype html>
<html lang="{{ html_lang }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{%% if content.html_title %%}{{ content.html_title }}{%% else %%}__TITLE__{%% endif %%}</title>
    <meta name="description" content="{{ content.meta_description }}">
    {%% if brand_settings.primaryFavicon.src %%}
      <link rel="shortcut icon" href="{{ brand_settings.primaryFavicon.src }}" />
    {%% endif %%}
    {{ standard_header_includes }}
    {%% require_css %%}
      <style>
        body.legal-page {
          /* Committed dark palette. Painted explicitly so the background can
             never disagree with the text colour, whatever the viewer's
             colour-scheme preference or the parent theme's own styles. */
          background-color: #0f172a;
          color: #e5e7eb;
          margin: 0;
        }
        .legal-doc {
          --ink: #e5e7eb; --muted: #94a3b8; --rule: #334155; --accent: #93b4fd;
          --surface: #1e293b; --surface-soft: #172033;
          max-width: 46rem; margin: 0 auto; padding: 3rem 1.25rem 5rem;
          color: var(--ink); line-height: 1.65;
          font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        .legal-doc h1 { font-size: 2rem; line-height: 1.2; margin: 0 0 1.5rem;
                        letter-spacing: -0.02em; color: #ffffff; }
        .legal-doc h2 { font-size: 1.15rem; margin: 2.75rem 0 0.75rem; padding-top: 1.25rem;
                        border-top: 1px solid var(--rule); letter-spacing: -0.01em;
                        color: #f1f5f9; }
        .legal-doc h2:first-of-type { border-top: 0; padding-top: 0; }
        .legal-doc p, .legal-doc li { font-size: 1rem; color: var(--ink); }
        .legal-doc ul { padding-left: 1.25rem; }
        .legal-doc li { margin-bottom: 0.4rem; }
        .legal-doc a { color: var(--accent); }
        .legal-doc a:hover { color: #c7d8ff; }
        .legal-doc strong { color: #ffffff; }
        .legal-doc code { background: var(--surface); color: #e2e8f0;
                          padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.9em; }
        .legal-doc .table-wrap { overflow-x: auto; margin: 1.25rem 0; }
        .legal-doc table { border-collapse: collapse; width: 100%%; font-size: 0.95rem; }
        .legal-doc th, .legal-doc td { border: 1px solid var(--rule);
                                       padding: 0.55rem 0.7rem; text-align: left; vertical-align: top; }
        .legal-doc th { background: var(--surface); font-weight: 600; color: #f1f5f9; }
        .legal-doc td { background: var(--surface-soft); }
        .legal-doc blockquote { margin: 1.25rem 0; padding: 0.75rem 1rem;
                                border-left: 3px solid var(--accent); background: var(--surface-soft); }
        .legal-doc blockquote p { margin: 0; }
        .legal-doc__meta { color: var(--muted); font-size: 0.95rem; }
        .legal-doc__meta strong { color: #cbd5e1; }
      </style>
    {%% end_require_css %%}
  </head>
  <body class="legal-page">
    <main class="legal-doc">
__BODY__
    </main>
    {{ standard_footer_includes }}
  </body>
</html>
'''

for src, dest, title, which in [
    ("TERMS-OF-SERVICE.md", "src/legal-pages/terms-of-service.html", "Terms of Service", "tos"),
    ("PRIVACY-POLICY.md",  "src/legal-pages/privacy-policy.html",  "Privacy Policy",  "pp"),
]:
    md = strip_internal(open(src).read(), which)
    body = md_to_html(md)
    body = '\n'.join('      ' + l for l in body.split('\n'))
    out = (TPL % ()).replace('__TITLE__', title).replace('__BODY__', body)
    open(dest, 'w').write(out)
    print("wrote %s (%d bytes)" % (dest, len(out)))
