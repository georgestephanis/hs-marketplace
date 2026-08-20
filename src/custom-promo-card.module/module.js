// HubSpot Module: Scoped Client-side JavaScript
// This file executes once per page load if the module is included on the page.

document.addEventListener('DOMContentLoaded', () => {
  const promoCards = document.querySelectorAll('.custom-promo-card');
  
  promoCards.forEach(card => {
    const button = card.querySelector('.custom-promo-card__button');
    const title = card.querySelector('.custom-promo-card__title');
    
    if (button && title) {
      button.addEventListener('click', () => {
        // Example integration: logging interaction or triggering custom analytics
        console.log(`[Promo Card Interaction] CTA Clicked: "${title.textContent.trim()}"`);
      });
    }
  });
});
