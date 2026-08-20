# Developer Guidelines & Available Custom Skills (AGENTS.md)

Welcome! This repository is designed for building HubSpot Custom Modules for the Asset / Extension Marketplace. This document contains guidelines, requirements, and reference skills available on this machine to assist in local HubSpot CMS development.

---

## 🛠️ Available HubSpot Custom Skills

The following specialized custom skills have been permanently installed in the global config directory (`~/.gemini/config/skills/`). You can read them using `view_file` to access deep cheatsheets and rules:

1. **`hubspot-cms-modules`**: Deep guide on module structures, fields.json syntax, style tabs, repeaters, scoping CSS, and locales.
2. **`hubl`**: HubL templating reference, filters, tags, escaping, and expression syntax.
3. **`hubspot-cli`** & **`hubspot-cms-local-dev`**: Managing auth, watch mode, fetch, upload, and CLI command flags.
4. **`hubspot-cms-themes`** & **`hubspot-cms-templates`**: Theme configuration, JSON schema, DND sections, and template inheritance.
5. **`hubspot-public-api`** & **`hubspot-crm-objects`**: Reference for integrating HubSpot's REST APIs, private apps, batching, search, and CRM models.
6. **`hubspot-ui-extensions`**: Development guide for React-based CRM cards and user interface overlays.

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
