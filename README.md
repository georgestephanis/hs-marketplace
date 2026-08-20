# HubSpot Extension Marketplace - Custom Promo Card Module

A premium, learning-focused HubSpot custom module designed to showcase how to build modern, highly custom UI components for the HubSpot Asset Marketplace.

This module is constructed using **modern CSS (back-drop blur, variables, container queries, and `:has()` selectors)** and integrates seamlessly with HubSpot's **fields.json** and **HubL template engine**.

---

## Features

- **Size-Aware Container Queries**: Automatically scales and shifts layouts (e.g. from stacked card to inline row) depending on the width of the container it's dropped into.
- **Glassmorphism Backdrop styling**: Modern frosted glass backdrop styling options with color presets, CSS gradient configurations, and opacity sliders.
- **Interactive States**: Dynamic card glow and float animations on hover.
- **Dynamic Content Detection**: Employs modern CSS parent styling via `:has()` to automatically change card styling depending on whether Optional Badge elements are present.
- **Marketplace Standard Layout**: Complies fully with HubSpot's CLI-based local development flow and folder structure.

---

## File Structure

```text
.
├── .gitignore
├── README.md
└── src/
    ├── icons/
    │   └── promo-card-icon.svg         # Custom SVG icon representing the module
    └── custom-promo-card.module/
        ├── meta.json                    # Module manifest (labels, content types, icon configuration)
        ├── fields.json                  # Editor customization fields (Content & Style tabs)
        ├── module.html                  # HubL template for rendering HTML & scoped CSS
        ├── module.css                   # Responsive layout stylesheet
        └── module.js                    # Client-side interactive script
```

---

## Local Development Workflow

### 1. Installation & Authentication
Ensure you have the HubSpot CLI installed and authenticated with your developer or sandbox account:
```bash
npm install -g @hubspot/cli
hs auth
```

### 2. Auto-sync (Watch Mode)
Deploy your local edits to your HubSpot account in real time:
```bash
hs watch src/ custom-promo-card
```

### 3. Marketplace Validation
Before submitting the module to the Extension Marketplace, run the built-in validation suite:
```bash
hs cms module marketplace-validate src/custom-promo-card.module
```

---

## Code Walkthrough & Connecting the Dots

### The Fields Schema (`fields.json`)
The options shown in the page editor's left sidebar are defined in `fields.json`.
- **Content tab**: Handles texts, rich text elements, and links.
- **Style tab** (`"tab": "STYLE"`): Groups parameters for background style type, background colors, and border widths, hiding complex design controls from content editors while giving them full brand flexibility.

### Styling with Container Queries (`module.css`)
To support dragging this module into a multi-column sidebar or a full-bleed footer, we define the container:
```css
.promo-card-wrapper {
  container-type: inline-size;
}

@container (min-width: 500px) {
  .promo-card {
    flex-direction: row;
    align-items: center;
    text-align: left;
  }
}
```

### Scoped styling (`module.html`)
To prevent styles from bleeding into the rest of the page, we wrap CSS variables and overrides inside HubSpot's `scope_css` block:
```html
{% require_css %}
  <style>
    {% scope_css %}
      .promo-card {
        --card-bg: {{ module.styles.bg_color.css }};
        --card-text: {{ module.styles.text_color.css }};
      }
    {% end_scope_css %}
  </style>
{% end_require_css %}
```
