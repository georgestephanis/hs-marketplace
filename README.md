# HubSpot Asset Marketplace Custom Modules

This repository serves as a workspace for preparing custom modules to offer on the HubSpot Asset Marketplace. It contains free, GPL-licensed components illustrating how to connect fields, HTML, CSS, and JS using modern web standards.

---

## Included Modules Index

We have implemented two highly modular custom components:

1. **[Custom Promo Card Module](./src/custom-promo-card.module/README.md)** (`src/custom-promo-card.module`)
   - **Purpose**: A polished promotional banner card with Glassmorphism, animations, and container queries.
   - **Key Tech**: Size-aware `@container` layouts, content-adaptive `:has()` styling rules, and theme brand color overrides.

2. **[Custom Pillbox Input Module](./src/custom-pillbox-input.module/README.md)** (`src/custom-pillbox-input.module`)
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

## Licensing

Both modules are original works licensed **GPL-2.0-or-later**, and are offered
free of charge on the HubSpot Asset Marketplace.

The CMS theme under `src/marketplace-theme/` is derived from the HubSpot CMS
Theme Boilerplate (Apache-2.0, Copyright 2020 HubSpot, Inc.). Apache-2.0 is
compatible with GPLv3 but not GPLv2, so the theme carries
**GPL-3.0-or-later**. The theme is not offered on the marketplace.

- **[LICENSE](./LICENSE)** — GNU GPL v3 text
- **[LICENSE-GPL-2.0.txt](./LICENSE-GPL-2.0.txt)** — GNU GPL v2 text
- **[TERMS-OF-SERVICE.md](./TERMS-OF-SERVICE.md)** — listing Terms of Service
- **[PRIVACY-POLICY.md](./PRIVACY-POLICY.md)** — listing Privacy Policy

---

## Tooling & Configuration Details

- **[.prettierrc.json](./.prettierrc.json)**: Runs Prettier configured with the official `@hubspot/prettier-plugin-hubl` plugin.
- **[.vscode/settings.json](./.vscode/settings.json)**: Maps HTML and CSS files inside VS Code to the custom `html-hubl` and `css-hubl` syntax highlighting modes.
- **[.hsignore](./.hsignore)**: Instructs the HubSpot CLI to skip repository files that are not CMS assets — documentation, licence texts, the local preview harness, tooling config, and editor cruft — so they are never uploaded to the Design Manager.
- **[AGENTS.md](./AGENTS.md)**: Workspace developer guide detailing repository guidelines and available custom skills on this machine.
