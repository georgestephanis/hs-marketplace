# HubSpot Asset Marketplace Custom Modules

This repository serves as a workspace for preparing custom modules to offer on the HubSpot Asset Marketplace. It contains premium, learning-focused components illustrating how to connect fields, HTML, CSS, and JS using modern web standards.

---

## Included Modules Index

We have implemented two highly modular custom components:

1. **[Custom Promo Card Module](file:///Users/georgestephanis/code/hs-marketplace/src/custom-promo-card.module/README.md)** (`src/custom-promo-card.module`)
   - **Purpose**: A visually premium promotional banner card with Glassmorphism, animations, and container queries.
   - **Key Tech**: Size-aware `@container` layouts, content-adaptive `:has()` styling rules, and theme brand color overrides.

2. **[Custom Pillbox Input Module](file:///Users/georgestephanis/code/hs-marketplace/src/custom-pillbox-input.module/README.md)** (`src/custom-pillbox-input.module`)
   - **Purpose**: A front-end interactive tag/chip input element with autocomplete dropdown search and key navigation.
   - **Key Tech**: Semantic `<select multiple>` backend with event dispatchers, validation shake feedback, and repeater lists suggestions.

---

## Local Development Workflow

All modules follow a local CMS development workflow via the HubSpot CLI.

### 1. Install & Authenticate

Ensure you have the HubSpot CLI installed globally and authenticated:

```bash
npm install -g @hubspot/cli
hs auth
```

### 2. Auto-Sync on Save (Watch Mode)

Watch the `src/` directory to deploy local edits to your Design Manager automatically:

```bash
hs watch src/ custom-promo-card-repo
```

### 3. Prettier Code Formatting

Format files (HTML, CSS, JS, JSON, Markdown) using Prettier + HubL syntax parser plugin:

```bash
npm run format
```

### 4. Marketplace Validation

Prior to submission, run the built-in validation command on your remote assets to verify compliance:

```bash
npm run validate
```

---

## Tooling & Configuration Details

- **[.prettierrc.json](file:///Users/georgestephanis/code/hs-marketplace/.prettierrc.json)**: Runs Prettier configured with the official `@hubspot/prettier-plugin-hubl` plugin.
- **[.vscode/settings.json](file:///Users/georgestephanis/code/hs-marketplace/.vscode/settings.json)**: Maps HTML and CSS files inside VS Code to the custom `html-hubl` and `css-hubl` syntax highlighting modes.
- **[.hsignore](file:///Users/georgestephanis/code/hs-marketplace/.hsignore)**: Instructs the HubSpot CLI to ignore all `README.md` documentation files inside module folders so they do not cause upload errors.
- **[AGENTS.md](file:///Users/georgestephanis/code/hs-marketplace/AGENTS.md)**: Workspace developer guide detailing repository guidelines and available custom skills on this machine.
