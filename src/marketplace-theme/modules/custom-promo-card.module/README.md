# Custom Promo Card Module

![Promo Card Preview](../../preview/promo-card-preview.png)

A premium, learning-focused HubSpot custom module designed to showcase how to build modern, highly custom UI components for the HubSpot Asset Marketplace. It implements Glassmorphism styling, size-aware container queries, and hover micro-animations.

---

## Features

- **Responsive Glassmorphism**: Frosty glass style backdrop blur (`backdrop-filter`) with custom accent colors.
- **Container-Queries**: Responsive layouts transition from stacked to inline once the parent width is $\ge$ 550px.
- **Content-Based Styling (`:has()`)**: Automatically alters spacing/padding depending on whether the badge element is present.
- **Theme-Aware Colors**: Links color picks directly to `theme.primary_color` and `theme.secondary_color`.
- **Dynamic Title Heading Tag**: Allows editors to select the appropriate HTML tag (H1–H6) to ensure document outline accessibility.
- **AAA Color Contrast**: Dynamically calculates the relative luminance of the user-configured accent color, setting the badge and button overlay text to either `#ffffff` or `#0f172a` to prevent low-contrast text combinations.
- **Prefers-Reduced-Motion Guard**: Disables translate, scaling, and transition motions for visitors with motion sensitivities.
- **Analytics Event Dispatch**: Fires a native `CustomEvent("promo-card-click")` on the card container whenever a visitor clicks the CTA button, enabling seamless tracking in external analytics scripts.

---

## Editor Settings (Fields)

### Content Tab

1. **Badge Text** (`card_badge`): Optional badge tag displayed on the top left of the card.
2. **Card Title** (`card_title`): Main text title of the promo.
3. **Card Title Heading Level** (`card_heading_level`): Choice field (H1–H6, default: H2) to select the semantic title heading tag.
4. **Card Body Text** (`card_body`): Rich text element supporting inline bolding, lists, and links.
5. **Button Text** (`card_button_text`): Text label of the CTA.
6. **Button Link** (`card_button_link`): Target url with standard open-in-new-tab toggles.

### Style Tab

1. **Background Mode** (`bg_style`): Select between Solid Color, Gradient Glow, or Glassmorphic Frost.
2. **Primary Accent Color** (`primary_color`): Accents borders, background overlays, and button colors (inherits from `theme.primary_color`).
3. **Text Color** (`text_color`): Font color overlay (inherits from `theme.secondary_color`).

---

## CSS Architecture

To satisfy marketplace guidelines, all CSS classes start with the `custom-promo-card` prefix:

- `.custom-promo-card-container` (declares `container-type: inline-size;`)
- `.custom-promo-card`
- `.custom-promo-card__badge`
- `.custom-promo-card__main`
- `.custom-promo-card__title`
- `.custom-promo-card__body`
- `.custom-promo-card__actions`
- `.custom-promo-card__button`
