// HubSpot Module: Scoped Client-side JavaScript
// This file executes once per page load if the module is included on the page.

function initPromoCards() {
  const promoCards = document.querySelectorAll(".custom-promo-card");

  function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(
      shorthandRegex,
      (m, r, g, b) => r + r + g + g + b + b,
    );
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : null;
  }

  function parseRgb(colorStr) {
    const matches = colorStr.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length < 3) return null;
    return [
      parseFloat(matches[0]),
      parseFloat(matches[1]),
      parseFloat(matches[2]),
    ];
  }

  function getRgb(colorStr) {
    if (!colorStr) return null;
    const clean = colorStr.trim();
    if (clean.startsWith("#")) return hexToRgb(clean);
    return parseRgb(clean);
  }

  function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  promoCards.forEach((card) => {
    const button = card.querySelector(".custom-promo-card__button");
    const title = card.querySelector(".custom-promo-card__title");

    // Dynamic contrast ratio check for accent color backgrounds (§10)
    const accentColor = window
      .getComputedStyle(card)
      .getPropertyValue("--primary-accent");
    const accent = getRgb(accentColor);
    if (accent) {
      const [r, g, b] = accent;
      const luminance = getLuminance(r, g, b);
      const contrastWhite = (1.0 + 0.05) / (luminance + 0.05);
      const contrastDark = (luminance + 0.05) / (0.012 + 0.05); // Slate (#0f172a) luminance
      const textColor = contrastWhite >= contrastDark ? "#ffffff" : "#0f172a";
      card.style.setProperty("--accent-text-color", textColor);
    }

    if (button && title) {
      button.addEventListener("click", () => {
        // Dispatch CustomEvent instead of console.log to support host page subscriptions (§5)
        card.dispatchEvent(
          new CustomEvent("promo-card-click", {
            bubbles: true,
            detail: {
              title: title.textContent.trim(),
              url: button.getAttribute("href") || "",
            },
          }),
        );
      });
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPromoCards);
} else {
  initPromoCards();
}
