# Developer Guidelines & Available Custom Skills (AGENTS.md)

Welcome! This repository is designed for building HubSpot Custom Modules for the Asset / Extension Marketplace. This document contains guidelines, requirements, and reference skills available on this machine to assist in local HubSpot CMS development.

---

## 🛠️ Available HubSpot Custom Skills

The following HubSpot skills are available on this machine. Invoke them by name
(e.g. `/hubspot-cms-modules`) rather than reading files — they are registered
skills, not documents on disk:

1. **`hubspot-cms-modules`**: module structures, fields.json syntax, style tabs, repeaters, scoping CSS, and locales.
2. **`hubl`**: HubL templating reference, filters, tags, escaping, and expression syntax.
3. **`hubspot-cli`** & **`hubspot-cms-local-dev`**: managing auth, watch mode, fetch, upload, and CLI command flags.
4. **`hubspot-cms-themes`** & **`hubspot-cms-templates`**: theme configuration, JSON schema, DND sections, and template inheritance.
5. **`hubspot-public-api`** & **`hubspot-crm-objects`**: integrating HubSpot's REST APIs, private apps, batching, search, and CRM models.
6. **`hubspot-ui-extensions`**: React-based CRM cards and user interface overlays.
7. **`hubspot-landing-pages-api`** & **`hubspot-private-apps`**: the Pages API and portal authentication options.

---

## 📐 Custom Module Guidelines for the Marketplace

To ensure all custom modules pass the HubSpot Asset Marketplace validator (`hs cms module marketplace-validate`), all AI agents must follow these rules:

### 1. CSS Class Prefixing

- **Rule**: Every CSS class in the module's HTML, CSS, and JS files **MUST** be prefixed with the module's folder base name (e.g. `custom-promo-card-` for `custom-promo-card.module`).
- **Reason**: The validator will reject any module containing standard, non-prefixed HTML elements (like `div`, `article`, etc.) that use generic class names.
- **Example**:
  - ❌ Incorrect: `<div class="promo-card">`
  - Correct: `<div class="custom-promo-card">`

### 2. Color Field inheritance

- **Rule**: Any field of `type: "color"` in `fields.json` **MUST** include an `inherited_value` linking it to standard theme colors.
- **Reason**: The marketplace validator requires color overrides to be mapped to global theme parameters.
- **Example**:
  ```json
  "inherited_value": {
    "default_value_path": "theme.primary_color",
    "property_value_paths": {
      "color": "theme.primary_color.color",
      "opacity": "theme.primary_color.opacity"
    }
  }
  ```

### 3. Safe Escaping & Sanitization

- **Rule**: Avoid raw output of editor fields. Always use HubL escaping filters:
  - **Plain Text / Attributes**: Use `{{ module.field_name|escape_html }}` or `{{ module.field_name|escape_attr }}`.
  - **URLs / Links**: Use `{{ module.link_field.url.href|escape_url }}`.
  - **Rich Text**: Use `{{ module.richtext_field|sanitize_html }}`.

### 4. Scoped Styling

- **Rule**: Emit module styles in `module.html` using the `scope_css` block inside `require_css` to restrict them to each instance of the module:
  ```html
  {% require_css %}
  <style>
    {% scope_css %}
      .custom-promo-card {
        /* styles namespace-restricted here */
      }
    {% end_scope_css %}
  </style>
  {% end_require_css %}
  ```

### 5. Prevent Git Diff Churn (Canonical Key Ordering)

- **Rule**: The keys inside `fields.json` must be written in canonical order:
  `id -> name -> label -> [inline_help_text] -> required -> locked -> [occurrence] -> [visibility] -> «type-specific» -> type -> display_width -> [default]`.
- **Workflow**:
  1. Author your initial changes or additions.
  2. Upload to the portal using: `hs cms upload src/<module-name>.module src/<module-name>.module`
  3. Fetch the files back down: `hs cms fetch src/<module-name>.module src/<module-name>.module --overwrite`
  4. Commit the fetched files. This pulls down server-assigned properties (like `module_id`) and Jackson-style JSON formatting automatically, keeping Git logs clean.

### 6. Style Tab Repeater Restrictions

- **Rule**: Repeater fields (any field containing `occurrence` configurations, such as custom text or color list repeaters) **MUST NOT** be placed inside the `styles` children list or configured with `"tab": "STYLE"`.
- **Reason**: The HubSpot CMS compiler strictly forbids repeater fields inside the design style tab. Attempting to upload them will trigger validation failures.
- **Solution**: Place all repeaters in the default `CONTENT` tab. Expose styling controls as content variables instead.

### 7. Non-Module File Isolation (`.hsignore`)

- **Rule**: Do not co-locate non-CMS files (e.g. `README.md`, `.png` preview screenshots, logs, mock files) inside a `.module` directory unless they are ignored.
- **Reason**: The HubSpot CLI upload command will fail with `Unknown file type for module file <name>`.
- **Critical**: The CLI does **not** read `.gitignore` or the global git ignore file. A file excluded from git is still an upload candidate and must be listed in `.hsignore` separately.
- **Current coverage**: `.hsignore` skips all Markdown, the root licence texts, `/preview/`, `*.jsonl`, `*.log`, Node tooling (`/node_modules/`, `package*.json`, `.prettierrc.json`), editor and agent state (`/.vscode/`, `/.serena/`, `/.idea/`, `/.continue/`), `/scripts/`, and OS cruft.
- **Do not ignore**: `src/marketplace-theme/license.txt`. It is not Markdown and `theme.json` references it via its `license` property, so it must ship with the theme.
- **Verifying a pattern**: `.hsignore` uses gitignore syntax, so you can dry-run a path with
  `git -c core.excludesFile=$PWD/.hsignore check-ignore --no-index -q <path>` (exit 0 means the CLI will skip it).

---

## ⚙️ Configured HubSpot Account

Subsequent agents must use the default active CLI account profile linked to George Stephanis:

- **Default Account Profile Name**: `george-stephanis`
- **Account ID**: `247114643`
- **Account type**: `STANDARD` — a normal production portal. This is **not** a developer account, and no developer API key is involved.
- **Auth type**: `personalaccesskey`. Verify with `hs account list`.
- **Connected domain**: `hubspot.stephanis.me` (primary site-page domain, HTTPS, resolving).

### Known scope ceiling

The personal access key holds CMS **read** scopes plus `cms.source_code.write`. It has **no page-write scope**. In practice:

| Operation | Works? |
| --- | --- |
| `hs cms upload` / `fetch` (templates, modules) | ✅ `cms.source_code.write` |
| `hs api GET /cms/v3/...` (domains, page listings) | ✅ read scopes |
| `hs api -X POST /cms/v3/pages/*` (create or publish a page) | ❌ `403 MISSING_SCOPES` |

The Pages API needs `content.landing_pages.write` **or** `content` for landing pages, and `content` for site pages. Neither is available in this portal's scope picker, and private apps and OAuth apps draw from the same entitlement set — so no credential type gets past it. This is most likely a subscription entitlement gate.

**Working practice**: build and upload templates via the CLI, then create and publish the page in the HubSpot UI. Templates need `isAvailableForNewContent: true` to be selectable there.

### Published pages

| URL | Template |
| --- | --- |
| `/pillbox-demo` | `/Pillbox.html` |
| `/terms-of-service` | `src/legal-pages/terms-of-service.html` |
| `/privacy-policy` | `src/legal-pages/privacy-policy.html` |

Uploaded but not yet published: `src/landing-pages/home.html` and `src/landing-pages/pillbox-instructions.html`.
