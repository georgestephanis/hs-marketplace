// HubSpot Module: Custom Pillbox Input
// Manages pill/tag creation, deletions, auto-suggestions, and form synchronization.

function initPillboxInput() {
  const containers = document.querySelectorAll(
    ".custom-pillbox-input-container",
  );

  containers.forEach((container) => {
    const box = container.querySelector(".custom-pillbox-input__box");
    const pillsWrapper = container.querySelector(
      ".custom-pillbox-input__pills-wrapper",
    );
    const textField = container.querySelector(
      ".custom-pillbox-input__text-field",
    );
    const dropdown = container.querySelector(
      ".custom-pillbox-input__suggestions-dropdown",
    );
    const list = container.querySelector(
      ".custom-pillbox-input__suggestions-list",
    );
    const selectField = container.querySelector(
      ".custom-pillbox-input__select-field",
    );
    const announceEl = container.querySelector(
      ".custom-pillbox-input__sr-only",
    );

    const maxPills = parseInt(
      container.getAttribute("data-max-pills") || "10",
      10,
    );

    // Parse custom color palette if provided, otherwise default to a high-contrast palette
    let customColors = [];
    try {
      customColors = JSON.parse(
        container.getAttribute("data-custom-colors") || "[]",
      );
    } catch (e) {
      console.warn("Pillbox: Could not parse custom colors array", e);
    }

    const hexToRgb = (hex) => {
      if (!hex) return null;
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(
        shorthandRegex,
        (m, r, g, b) => r + r + g + g + b + b,
      );
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : null;
    };

    const DEFAULT_PALETTE = [
      "59, 130, 246", // Blue
      "168, 85, 247", // Purple
      "34, 197, 94", // Green
      "249, 115, 22", // Orange
      "236, 72, 153", // Pink
      "6, 182, 212", // Teal
    ];

    // Mitigate §2: Filter out null/empty color values defensively
    const resolvedColors = customColors.map((c) => hexToRgb(c)).filter(Boolean);
    const palette =
      resolvedColors.length > 0 ? resolvedColors : DEFAULT_PALETTE;

    function getPillRgb(value) {
      let hash = 0;
      for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
      }
      const idx = Math.abs(hash) % palette.length;
      return palette[idx];
    }

    function getBgColor(element) {
      let el = element;
      while (el) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
          return bg;
        }
        el = el.parentElement;
      }

      // Check native browser preferences if no explicit background is set
      const isDarkPreferred =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      return isDarkPreferred ? "rgb(15, 23, 42)" : "rgb(255, 255, 255)";
    }

    function parseRgb(colorStr) {
      const matches = colorStr.match(/\d+(\.\d+)?/g);
      if (!matches || matches.length < 3) return [255, 255, 255];
      return [
        parseFloat(matches[0]),
        parseFloat(matches[1]),
        parseFloat(matches[2]),
      ];
    }

    function getLuminance(r, g, b) {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    // Mitigate §15: Cache container background color once at init to avoid layout thrashing
    const containerBgColor = getBgColor(container);

    // Mitigate §21: Setup dynamic dropdown background/text colors based on background mode
    const [r_bg, g_bg, b_bg] = parseRgb(containerBgColor);
    const containerLuminance = getLuminance(r_bg, g_bg, b_bg);
    const isDark = containerLuminance < 0.45;
    if (isDark) {
      container.style.setProperty(
        "--pillbox-dropdown-bg",
        "rgba(30, 41, 59, 0.95)",
      );
      container.style.setProperty(
        "--pillbox-dropdown-text",
        "rgba(255, 255, 255, 0.9)",
      );
    } else {
      container.style.setProperty(
        "--pillbox-dropdown-bg",
        "rgba(255, 255, 255, 0.98)",
      );
      container.style.setProperty(
        "--pillbox-dropdown-text",
        "rgba(15, 23, 42, 0.9)",
      );
    }

    // Mitigate §9: Compute true contrast ratio against white and dark slate backgrounds
    function getContrastColor(rgbStr) {
      const [r_src, g_src, b_src] = parseRgb(rgbStr);
      const [r_dst, g_dst, b_dst] = parseRgb(containerBgColor);

      // Blend 15% opacity src color over dst background
      const r_out = Math.round(0.15 * r_src + 0.85 * r_dst);
      const g_out = Math.round(0.15 * g_src + 0.85 * g_dst);
      const b_out = Math.round(0.15 * b_src + 0.85 * b_dst);

      const luminance = getLuminance(r_out, g_out, b_out);
      const contrastWhite = (1.0 + 0.05) / (luminance + 0.05);
      const contrastDark = (luminance + 0.05) / (0.012 + 0.05); // Slate (#0f172a) luminance
      return contrastWhite >= contrastDark ? "#ffffff" : "#0f172a";
    }

    const limitReachedText =
      container.getAttribute("data-limit-reached-text") || "Limit reached";
    const removeBtnLabel =
      container.getAttribute("data-remove-button-label") || "Remove";
    const noMatchesText =
      container.getAttribute("data-no-matches-text") || "No suggestions found";

    // Store original placeholder to restore it when input is enabled
    textField.setAttribute(
      "data-original-placeholder",
      textField.placeholder || "",
    );

    // Store all initial suggestions from the HubL list
    const originalSuggestions = Array.from(
      container.querySelectorAll(".custom-pillbox-input__suggestion-item"),
    ).map((item) => ({
      value: item.getAttribute("data-value") || "",
      text: item.textContent.trim(),
    }));

    let activePills = [];
    let focusedSuggestionIndex = -1;
    let blurTimeout = null; // Mitigate §13: store timeout handle

    // Focus the text field when clicking anywhere inside the input box boundary
    box.addEventListener("click", (e) => {
      if (
        e.target !== textField &&
        !e.target.closest(".custom-pillbox-input__pill")
      ) {
        textField.focus();
      }
    });

    // Mitigate §8: Helper function for screen reader live-region alerts
    function announce(msg) {
      if (announceEl) {
        announceEl.textContent = msg;
      }
    }

    // Mitigate §13, §14: Manage focus behaviors defensively
    textField.addEventListener("focus", () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      container.classList.add("is-focused");
      if (originalSuggestions.length > 0) {
        filterSuggestions();
      }
    });

    textField.addEventListener("blur", () => {
      // Small timeout to allow click actions on dropdown suggestions to fire first
      blurTimeout = setTimeout(() => {
        container.classList.remove("is-focused");
        hideDropdown();
      }, 200);
    });

    // Keystroke handlers on text input
    textField.addEventListener("keydown", (e) => {
      const value = textField.value.trim();

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();

        // If there's an active suggestion focused via arrows, add that instead
        if (focusedSuggestionIndex >= 0 && dropdown.style.display !== "none") {
          const visibleItems = dropdown.querySelectorAll(
            ".custom-pillbox-input__suggestion-item",
          );
          if (visibleItems[focusedSuggestionIndex]) {
            addPill(
              visibleItems[focusedSuggestionIndex].getAttribute("data-value"),
            );
            return;
          }
        }

        // Otherwise, add what is typed
        if (value) {
          addPill(value);
        }
      } else if (e.key === "Backspace" && !textField.value) {
        // Remove the last pill if input is empty
        if (activePills.length > 0) {
          removePill(activePills.length - 1);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateSuggestions(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateSuggestions(-1);
      } else if (e.key === "Escape") {
        hideDropdown();
      }
    });

    textField.addEventListener("input", () => {
      filterSuggestions();
    });

    // Add a pill to the selection
    function addPill(value) {
      const cleanValue = value.replace(/,/g, "").trim();
      if (!cleanValue) return;

      // Mitigate §16: Case-insensitive duplicate detection
      const lowercasePills = activePills.map((p) => p.toLowerCase());
      if (lowercasePills.includes(cleanValue.toLowerCase())) {
        announce(`Tag already added: ${cleanValue}`);
        shakeInput();
        return;
      }
      if (activePills.length >= maxPills) {
        announce(limitReachedText);
        shakeInput();
        return;
      }

      activePills.push(cleanValue);
      textField.value = "";
      announce(`Added tag ${cleanValue}`);
      renderPills();
      filterSuggestions();
    }

    // Remove a pill by index
    function removePill(index) {
      const removedVal = activePills[index];
      activePills.splice(index, 1);
      announce(`Removed tag ${removedVal}`);
      renderPills();
      filterSuggestions();
    }

    // Render the active tag chips in the UI
    function renderPills() {
      pillsWrapper.innerHTML = "";

      activePills.forEach((pill, idx) => {
        const pillEl = document.createElement("span");
        pillEl.className = "custom-pillbox-input__pill";
        pillEl.setAttribute("data-value", pill);

        // Apply dynamic color variables
        const rgb = getPillRgb(pill);
        pillEl.style.setProperty("--pill-accent-rgb", rgb);

        // Apply WCAG AAA compliant text color based on background luminance
        pillEl.style.color = getContrastColor(rgb);

        const textEl = document.createElement("span");
        textEl.textContent = pill;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "custom-pillbox-input__remove-btn";
        removeBtn.innerHTML = "&times;";
        removeBtn.setAttribute("aria-label", `${removeBtnLabel} ${pill}`);

        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removePill(idx);
        });

        pillEl.appendChild(textEl);
        pillEl.appendChild(removeBtn);
        pillsWrapper.appendChild(pillEl);
      });

      // Update the select element options for form integration and trigger change events
      selectField.innerHTML = "";
      activePills.forEach((pill) => {
        const option = document.createElement("option");
        option.value = pill;
        option.selected = true;
        option.textContent = pill;
        selectField.appendChild(option);
      });
      selectField.dispatchEvent(new Event("change", { bubbles: true }));

      // Set data-pill-count on the main container
      container.setAttribute("data-pill-count", activePills.length);

      // Mitigate §12: Toggles readOnly instead of disabled when limit is met
      if (activePills.length >= maxPills) {
        textField.readOnly = true;
        textField.placeholder = limitReachedText;
        hideDropdown();
      } else {
        textField.readOnly = false;
        textField.placeholder =
          textField.getAttribute("data-original-placeholder") || "";
      }
    }

    // Filter autocomplete dropdown options
    function filterSuggestions() {
      if (originalSuggestions.length === 0) return; // Skip if no predefined suggestions

      const query = textField.value.toLowerCase().trim();

      // Exclude values that are already active pills
      const available = originalSuggestions.filter((item) => {
        return (
          !activePills.includes(item.value) &&
          (!query || item.value.toLowerCase().includes(query))
        );
      });

      // Mitigate §14: Reset focused index when suggestion filter yields zero results
      if (available.length === 0) {
        list.innerHTML = "";
        focusedSuggestionIndex = -1;
        const li = document.createElement("li");
        li.className = "custom-pillbox-input__no-matches";
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        li.textContent = noMatchesText;
        list.appendChild(li);
        showDropdown();
        return;
      }

      // Render suggestion elements
      list.innerHTML = "";
      focusedSuggestionIndex = -1;

      available.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "custom-pillbox-input__suggestion-item";
        li.setAttribute("data-value", item.value);
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");

        // Dynamic element ID mapping to satisfy §6 ARIA activedescendant
        const textId = textField.getAttribute("id");
        li.id = `${textId}-opt-${idx}`;

        li.textContent = item.text;

        li.addEventListener("mousedown", (e) => {
          e.preventDefault(); // Prevent text field blur
          addPill(item.value);
        });

        list.appendChild(li);
      });

      showDropdown();
    }

    // Navigate suggestion options via arrow keys
    function navigateSuggestions(direction) {
      const items = list.querySelectorAll(
        ".custom-pillbox-input__suggestion-item",
      );
      if (items.length === 0) return;

      if (focusedSuggestionIndex >= 0 && items[focusedSuggestionIndex]) {
        items[focusedSuggestionIndex].classList.remove("is-active");
        items[focusedSuggestionIndex].setAttribute("aria-selected", "false");
      }

      focusedSuggestionIndex += direction;

      if (focusedSuggestionIndex >= items.length) {
        focusedSuggestionIndex = 0;
      } else if (focusedSuggestionIndex < 0) {
        focusedSuggestionIndex = items.length - 1;
      }

      const activeItem = items[focusedSuggestionIndex];
      activeItem.classList.add("is-active");
      activeItem.setAttribute("aria-selected", "true");
      activeItem.scrollIntoView({ block: "nearest" });

      // Mitigate §6: Update aria-activedescendant with option element's ID
      textField.setAttribute("aria-activedescendant", activeItem.id);
    }

    function showDropdown() {
      if (originalSuggestions.length === 0) return; // Skip if no predefined suggestions
      dropdown.style.display = "block";
      textField.setAttribute("aria-expanded", "true");
    }

    function hideDropdown() {
      dropdown.style.display = "none";
      focusedSuggestionIndex = -1;
      textField.setAttribute("aria-expanded", "false");
      textField.setAttribute("aria-activedescendant", "");
    }

    // Simple visual error feedback (shake input box)
    function shakeInput() {
      box.classList.add("shake");
      setTimeout(() => {
        box.classList.remove("shake");
      }, 500);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPillboxInput);
} else {
  initPillboxInput();
}
