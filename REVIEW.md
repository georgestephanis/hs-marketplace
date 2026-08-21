# Code Review — HubSpot Marketplace Custom Modules

**Date:** 2026-08-21
**Reviewer:** Claude (Opus 5)
**Scope:** `src/custom-promo-card.module/`, `src/custom-pillbox-input.module/`, and root-level tooling/config.
**Out of scope:** `preview/` (actively being reworked at time of review).

---

## Summary

Both modules are structurally sound. Class prefixing is consistent and correct per marketplace rules, `scope_css` is used properly inside `require_css`, and output escaping is applied consistently (`escape_html`, `escape_attr`, `escape_url`, `sanitize_html`). The pillbox JS routes all user-supplied data through `textContent` — there are no `innerHTML` injection sinks.

The defects cluster in three areas:

1. A CSS-generation bug in the HubL that silently breaks a shipped style option in **both** modules.
2. An unguarded crash path in the pillbox JS triggered by a plausible editor action.
3. Accessibility gaps that contradict claims made in the module READMEs.

**Recommended fix order:** §1 → §5 (blocking), then §6 → §11 (accessibility), then the remainder.

---

## Severity Index

| #   | Severity     | Area        | Finding                                                  |
| --- | ------------ | ----------- | -------------------------------------------------------- |
| 1   | **Blocking** | HubL / CSS  | Invalid `rgba()` output wherever opacity is interpolated |
| 2   | **Blocking** | JS          | Pillbox crashes when custom color rows are left unset    |
| 3   | **Blocking** | fields.json | `custom_colors` missing `inherited_value`                |
| 4   | **Blocking** | Tooling     | Pillbox module is never validated                        |
| 5   | **Blocking** | JS          | Promo card ships a `console.log` on every CTA click      |
| 6   | High         | A11y        | Combobox has no ARIA whatsoever                          |
| 7   | High         | A11y        | No visible keyboard focus on remove buttons              |
| 8   | High         | A11y        | No announcement on state change                          |
| 9   | High         | Docs        | WCAG AAA claim is unsubstantiated                        |
| 10  | High         | A11y        | Promo card has no contrast handling                      |
| 11  | Medium       | A11y        | No `prefers-reduced-motion` guard                        |
| 12  | High         | UX          | Disabling input at max pills traps the user              |
| 13  | Medium       | JS          | Blur timeout is never cancelled                          |
| 14  | Medium       | JS          | Two dropdown state bugs                                  |
| 15  | Medium       | Perf        | Layout thrash in `renderPills`                           |
| 16  | Low          | JS          | Case-sensitive duplicate detection                       |
| 17  | Medium       | HubL        | Hardcoded `select` name collides across instances        |
| 18  | Low          | HubL        | Fragile JSON-in-attribute construction                   |
| 19  | Medium       | CSS         | Missing `var()` fallbacks                                |
| 20  | Medium       | JS          | `DOMContentLoaded`-only initialization                   |
| 21  | Low          | CSS         | Assorted smaller CSS issues                              |
| 22  | Low          | Hygiene     | Repo/doc cleanup items                                   |

---

## Blocking

### 1. Invalid `rgba()` output wherever opacity is interpolated

**Files:**

- `src/custom-promo-card.module/module.html:7`
- `src/custom-promo-card.module/module.html:11`
- `src/custom-pillbox-input.module/module.html:7`

**Current:**

```hubl
--card-bg: rgba({{ module.styles.primary_color.color|convert_rgb }}
{{ module.styles.primary_color.opacity / 100 }});
```

`convert_rgb` emits a bare triple (`59, 130, 246`), so this renders as:

```css
--card-bg: rgba(59, 130, 246 1);
```

CSS Color 4 permits `rgb(R, G, B, A)` (legacy, comma-separated) or `rgb(R G B / A)` (modern, slash-delimited). It does **not** permit mixing them. The custom property parses successfully — custom properties accept arbitrary token streams — but is invalid at substitution time, so `var(--card-bg)` and `var(--text-color)` resolve to nothing.

**Observable impact:**

- Promo card "Solid Color" background mode renders no background.
- The editor-configured Text Color is silently ignored in both modules.

Note that the very next line in the promo card uses the correct form (`rgba(R, G, B, 0.15)`), confirming this is an oversight rather than an intentional convention.

**Fix:**

```hubl
--card-bg: rgba({{ module.styles.primary_color.color|convert_rgb }},
{{ module.styles.primary_color.opacity|default(100) / 100 }});
```

The `|default(100)` is load-bearing: a theme-inherited color can arrive with a null opacity, which currently emits an empty token and produces `rgba(59, 130, 246, )`.

---

### 2. Pillbox crashes when custom color rows are left unset

**File:** `src/custom-pillbox-input.module/module.js:63-75`, `:112-123`

An editor who adds `custom_colors` repeater rows without picking colors produces `["", ""]` in the `data-custom-colors` attribute. That array is non-empty, so the custom-palette branch is taken, but `.map(hexToRgb).filter(Boolean)` reduces it to `[]`.

Failure chain:

1. `Math.abs(hash) % palette.length` → `% 0` → `NaN`
2. `palette[NaN]` → `undefined`
3. `getContrastColor(undefined)` → `parseRgb(undefined)` → `undefined.match(...)` → **TypeError**

The exception is raised inside `renderPills`, so pill rendering dies on the first tag added. The widget appears completely broken to the site visitor.

**Fix:**

```js
const resolved = customColors.map((c) => hexToRgb(c)).filter(Boolean);
const palette = resolved.length > 0 ? resolved : DEFAULT_PALETTE;
```

---

### 3. `custom_colors` missing `inherited_value`

**File:** `src/custom-pillbox-input.module/fields.json`

The `custom_colors` field is `"type": "color"` but has no `inherited_value` block. `AGENTS.md` rule #2 states that every color field **must** include one or the marketplace validator rejects the module. The two color fields inside the `styles` group comply; this one was missed.

Secondary issue in the same field: `default` is an object (`{"color": null, "opacity": null, ...}`) where a repeater expects an array. Compare `predefined_suggestions`, which correctly defaults to a list. Currently harmless because `occurrence.default` is `0`, but the shape is inconsistent.

---

### 4. Pillbox module is never validated

**File:** `package.json`

```json
"validate": "hs cms module marketplace-validate src/custom-promo-card.module"
```

The root README instructs the developer to run `npm run validate` prior to submission, but the script only covers the promo card. Given finding §3, the pillbox has almost certainly never been through `marketplace-validate`.

**Fix:** validate both modules, e.g.

```json
"validate": "hs cms module marketplace-validate src/custom-promo-card.module && hs cms module marketplace-validate src/custom-pillbox-input.module"
```

---

### 5. Promo card JS ships a `console.log`

**File:** `src/custom-promo-card.module/module.js`

The entire file does nothing but log to the browser console on every CTA click. In a paid marketplace module this is console noise in a customer's production site and dead weight in the page bundle.

**Fix:** delete the file, or replace the log with something customers can actually use — dispatching a `CustomEvent` on the card element that host-page scripts can subscribe to.

---

## Accessibility

The pillbox README claims _"Fully accessible arrow-key selections"_ and _"WCAG AAA Compliance Contrast."_ Neither claim currently holds.

### 6. Combobox has no ARIA whatsoever

**File:** `src/custom-pillbox-input.module/module.html:41-66`

Missing across the board:

- Text input: no `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete`, or `aria-activedescendant`
- Dropdown `<ul>`: no `role="listbox"`
- Suggestion `<li>` items: no `role="option"` or `aria-selected`
- Text input: no accessible name — a `placeholder` is not a label

Arrow-key navigation moves a purely visual `.is-active` class. A screen reader user gets no indication that a dropdown opened, how many options exist, or which one is highlighted.

**Fix:** implement the ARIA 1.2 combobox pattern. Each `<li>` needs a stable unique `id` (generate per-instance, e.g. via HubL's `unique_string()` or a JS counter) so `aria-activedescendant` can reference it; update `aria-expanded` in `showDropdown`/`hideDropdown`.

---

### 7. No visible keyboard focus on remove buttons

**File:** `src/custom-pillbox-input.module/module.css:104`, and absent throughout

`outline: none` on `.custom-pillbox-input__text-field` is compensated by the JS-driven `.is-focused` ring on the container — acceptable, though it degrades if JS fails.

`.custom-pillbox-input__remove-btn` has **no** `:focus-visible` rule at all. Tabbing through pills provides zero indication of focus position. This is a WCAG 2.4.7 (Focus Visible) failure.

**Fix:**

```css
.custom-pillbox-input__remove-btn:focus-visible {
  outline: 2px solid var(--pillbox-accent, currentColor);
  outline-offset: 2px;
  opacity: 1;
}
```

---

### 8. No announcement on state change

Adding a pill, removing a pill, the duplicate-entry shake, and reaching the tag limit are all communicated purely visually. The limit message is delivered via the `placeholder` attribute of a **disabled** input — approximately the least announceable surface available.

**Fix:** add a visually-hidden `aria-live="polite"` region inside the container and write short status strings to it on add/remove/reject. The strings should be editor-configurable for localization, consistent with the existing text fields.

---

### 9. WCAG AAA claim is unsubstantiated

**File:** `src/custom-pillbox-input.module/module.js:104-123`; `src/custom-pillbox-input.module/README.md`

`getLuminance` implements the WCAG relative-luminance formula correctly. However, `getContrastColor` then selects text color by thresholding at `luminance > 0.45`. It never computes a contrast **ratio** and never tests against 7:1.

The README states the module will _"guarantee a minimum contrast ratio of at least 7:1."_ That is not what the code does.

Two accuracy problems feed the calculation:

- `parseRgb` (`:94-102`) discards the alpha channel, so the glassmorphic `rgba(15, 23, 42, 0.45)` backdrop is treated as fully opaque.
- `getBgColor` (`:77-92`) accepts any non-fully-transparent computed color as the effective backdrop, so an ancestor with `rgba(0, 0, 0, 0.1)` produces a mis-blend.

**Fix — pick one:**

- **Substantiate it:** compute the actual contrast ratio `(L1 + 0.05) / (L2 + 0.05)` for both `#ffffff` and `#0f172a` against the blended background and return whichever scores higher. Optionally log/flag when neither reaches 7:1.
- **Soften it:** reword the README to "automatic light/dark text selection based on background luminance" and drop the ratio guarantee. Also update the corresponding commit-message claim if the history is being rewritten.

---

### 10. Promo card has no contrast handling

**File:** `src/custom-promo-card.module/module.css:67`, `:132`, `:143-149`

The badge and button both hardcode `color: #ffffff` while their background is `var(--primary-accent)`. An editor selecting a light accent (yellow, pale green, light grey) produces unreadable white-on-light text.

The hover state compounds this: `background: rgba(255, 255, 255, 0.1)` paired with `color: #ffffff`.

This is inconsistent with the pillbox, which at least attempts luminance-aware text selection.

**Fix:** apply the same (corrected, per §9) contrast routine, or expose an explicit "Button Text Color" field with an `inherited_value` binding.

---

### 11. No `prefers-reduced-motion` guard

**Files:** `src/custom-pillbox-input.module/module.css:168-186`; `src/custom-promo-card.module/module.css:47-53`, `:75-77`

The shake keyframes, the promo card's `translateY(-4px)` hover lift, the badge `scale(1.05)`, and all transitions run unconditionally. Motion-sensitivity handling is expected for marketplace submissions.

**Fix:**

```css
@media (prefers-reduced-motion: reduce) {
  .custom-pillbox-input__box.shake {
    animation: none;
  }
  .custom-promo-card,
  .custom-promo-card__badge,
  .custom-promo-card__button {
    transition: none;
  }
  .custom-promo-card:hover {
    transform: none;
  }
}
```

Retain a non-motion error affordance for the shake (e.g. a brief border-color change), so the duplicate-entry feedback isn't lost entirely.

---

## Correctness and Robustness

### 12. Disabling the input at max pills traps the user

**File:** `src/custom-pillbox-input.module/module.js:294-302`

Setting `textField.disabled = true` stops the element receiving `keydown`. Consequences:

- **Backspace-to-remove-last-pill stops working at exactly the moment the user most needs it** — they've hit the cap and want to swap a tag out.
- The field drops out of the tab order entirely.
- The click-to-focus handler on `.custom-pillbox-input__box` becomes a silent no-op.
- `shakeInput()` can never fire from the max-pills branch of `addPill`, because typing is impossible.

**Fix:** use `readOnly` instead of `disabled` — it remains focusable and continues to receive key events, while blocking text entry. The `activePills.length >= maxPills` guard already exists in `addPill` and will reject additions on its own.

---

### 13. Blur timeout is never cancelled

**File:** `src/custom-pillbox-input.module/module.js:164-170`

Blurring and refocusing within the 200ms window leaves a pending timeout that strips `.is-focused` while the field is genuinely focused, killing the focus ring until the next focus event.

**Fix:** store the timeout handle and `clearTimeout` it in the `focus` listener.

Worth noting the timeout is largely redundant: the suggestion `mousedown` handler at `:337-340` already calls `preventDefault()` to suppress blur. The `setTimeout` is belt-and-braces that introduces its own bug.

---

### 14. Two dropdown state bugs

**File:** `src/custom-pillbox-input.module/module.js`

- **`:317-325`** — the zero-matches early return does not reset `focusedSuggestionIndex`, unlike the normal path at `:329`. Stale index survives into the next interaction.
- **`:159-162`** — `focus` unconditionally calls `filterSuggestions()`. A module configured with no `predefined_suggestions` therefore pops an empty "No suggestions found" panel on every single focus. Bail out early when `originalSuggestions.length === 0`.

---

### 15. Layout thrash in `renderPills`

**File:** `src/custom-pillbox-input.module/module.js:245-303`, `:77-92`

`getContrastColor` calls `getBgColor(container)`, which walks the entire ancestor chain invoking `getComputedStyle` — **once per pill, on every render**. At 10 pills and typical DOM depth this is on the order of 100 forced style resolutions per re-render, and `renderPills` runs on every add and every remove.

The container's effective background does not change between renders.

**Fix:** resolve the background color once at init (and optionally on resize / a `prefers-color-scheme` change listener), cache it, and pass it into `getContrastColor`.

---

### 16. Case-sensitive duplicate detection

**File:** `src/custom-pillbox-input.module/module.js:222` vs `:313`

`addPill` rejects duplicates with `activePills.includes(cleanValue)` (case-sensitive), while `filterSuggestions` matches case-insensitively. "Marketing" and "marketing" can therefore both be added as separate pills, while the suggestion list treats them as the same entry.

**Fix:** normalize case for the comparison while preserving the user's original casing for display.

---

### 17. Hardcoded `select` name collides across instances

**File:** `src/custom-pillbox-input.module/module.html:70`

`name="custom_pillbox_tags"` is hardcoded rather than field-driven. Two instances of the module on one page emit two identically-named selects, and the value cannot be adapted to a host form's expected field name.

**Fix:** add a text field (e.g. `field_name`, default `custom_pillbox_tags`) and emit `name="{{ module.field_name|escape_attr }}"`.

**Related documentation concern:** the pillbox README's "compatible with HubSpot forms libraries" framing warrants review. HubSpot forms render in an iframe or as JS-managed markup, so a `<select>` emitted by a separate module will not be picked up by HubSpot form submission. The `change`-event dispatch is genuinely useful for custom and third-party handlers, but the native-form serialization path described in the README's "Technical Integration" section only works for a hand-rolled `<form>` on the page.

---

### 18. Fragile JSON-in-attribute construction

**File:** `src/custom-pillbox-input.module/module.html:34`

```hubl
data-custom-colors='[{% for color_field in module.custom_colors %}"{{ color_field.color|escape_attr }}"{% if not loop.last %},{% endif %}{% endfor %}]'
```

Hand-building JSON inside a single-quoted attribute. `escape_attr` is not guaranteed to escape `'`. Picker-constrained hex values make exploitation implausible in practice, but it is an avoidable sharp edge and it silently emits `""` entries for unset rows (see §2).

**Fix:** filter empty values in the loop (`{% if color_field.color %}`), and prefer a JSON-encoding filter over manual bracket/quote assembly.

---

### 19. Missing `var()` fallbacks

**Files:**

- `src/custom-pillbox-input.module/module.html:11` — `--pillbox-accent: {{ module.styles.primary_color.color }};` with no default. An unset theme color yields the invalid declaration `--pillbox-accent: ;`.
- `src/custom-pillbox-input.module/module.css:113`, `:164` — `rgba(var(--pillbox-text-rgb), 0.5)` with no fallback triple.

**Fix:** supply HubL-side defaults (`|default('#3b82f6')`) and CSS-side fallbacks (`var(--pillbox-text-rgb, 255, 255, 255)`).

---

### 20. `DOMContentLoaded`-only initialization

**Files:** `src/custom-pillbox-input.module/module.js:4`; `src/custom-promo-card.module/module.js:4`

If the script resolves after DOM ready — async loading, a drag-and-drop editor re-render, AJAX-injected content — the listener never fires and the module stays inert.

**Fix:**

```js
function init() {
  /* ... */
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
```

---

### 21. Assorted smaller CSS issues

- **`src/custom-promo-card.module/module.css:148`** — `:hover` introduces `border: 1px solid` that does not exist in the base state, causing a 1px layout shift on hover. Add a transparent border to the base rule.
- **`src/custom-pillbox-input.module/module.css:125`, `:146`** — the suggestions dropdown hardcodes dark chrome (`rgba(15, 23, 42, 0.95)` background, `rgba(255, 255, 255, 0.9)` text) regardless of the selected Background Mode or configured Text Color. In "Solid Color" mode this produces an incongruous dark panel beneath a light input.
- **`src/custom-pillbox-input.module/module.css:54`** — `color: var(--pillbox-text)` on `.custom-pillbox-input__pill` is a dead rule; it is always overridden by the inline `pillEl.style.color` set in `renderPills`.

---

### 22. Repo hygiene and documentation

- **Shared icon.** Both `meta.json` files reference `../icons/promo-card-icon.svg`. The pillbox needs its own icon for the marketplace listing. Separately, confirm that a `../` path pointing outside the `.module` directory resolves correctly post-upload.
- **Broken README links.** The root `README.md` and both module READMEs use absolute `file:///Users/georgestephanis/...` URLs, which are broken for every other reader. Convert to repo-relative paths.
- **`.vscode/settings.json` is documented but gitignored.** `.gitignore` excludes `.vscode/`, so the root README describes a file that is not distributed with the repo. Either commit it via a negation rule or drop the reference.
- **`conversation-log.jsonl`** is neither tracked nor ignored — `.gitignore` covers `*.log` but not `*.jsonl`.
- **No `_locales` directory.** Several pillbox fields are described as "localizable" in its README. They are editor-overridable, which is a different capability. Either add locale files or adjust the wording.
- **Hardcoded `<h2>`** at `src/custom-promo-card.module/module.html:40`. A heading-level choice field (h1–h6) is standard for marketplace modules that emit headings, and matters for document outline correctness.

---

## Verified as Correct

Recorded so these are not re-litigated downstream:

- CSS class prefixing is consistent and compliant with `AGENTS.md` rule #1 across HTML, CSS, and JS in both modules.
- `scope_css` is correctly nested inside `require_css` in both modules, per `AGENTS.md` rule #4.
- Output escaping is applied consistently: `escape_html` for text, `escape_attr` for attributes, `escape_url` for the CTA href, `sanitize_html` for rich text.
- The pillbox JS assigns all user-supplied data via `textContent` and `setAttribute`. There are no `innerHTML` injection sinks — the sole `innerHTML` use is the static `&times;` glyph.
- The promo card's `rel` attribute logic is correct: `nofollow` and `noopener` are appended conditionally and joined properly.
- `AGENTS.md` rule #6 is respected — the `custom_colors` repeater is in the `CONTENT` tab, not `STYLE`.
- `bg_style` choices in `fields.json` (`solid` / `gradient` / `glassmorphism`) match the `{% if %}` / `{% elif %}` branches in the promo card template and the three options described in its README.
- The `{% if suggestion %}` guard in the pillbox template correctly filters blank repeater rows out of the rendered suggestion list.
- `.hsignore` correctly handles the `README.md`-inside-`.module` upload failure described in `AGENTS.md` rule #7.
