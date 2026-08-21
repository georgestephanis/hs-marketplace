// HubSpot Module: Custom Pillbox Input
// Manages pill/tag creation, deletions, auto-suggestions, and form synchronization.

document.addEventListener("DOMContentLoaded", () => {
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

    const palette =
      customColors.length > 0
        ? customColors.map((c) => hexToRgb(c)).filter(Boolean)
        : DEFAULT_PALETTE;

    function getPillRgb(value) {
      let hash = 0;
      for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
      }
      const idx = Math.abs(hash) % palette.length;
      return palette[idx];
    }

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

    // Focus the text field when clicking anywhere inside the input box boundary
    box.addEventListener("click", (e) => {
      if (
        e.target !== textField &&
        !e.target.closest(".custom-pillbox-input__pill")
      ) {
        textField.focus();
      }
    });

    textField.addEventListener("focus", () => {
      container.classList.add("is-focused");
      filterSuggestions();
    });

    textField.addEventListener("blur", () => {
      // Small timeout to allow click actions on dropdown suggestions to fire first
      setTimeout(() => {
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

      // Validation checks
      if (activePills.includes(cleanValue)) {
        shakeInput();
        return;
      }
      if (activePills.length >= maxPills) {
        shakeInput();
        return;
      }

      activePills.push(cleanValue);
      textField.value = "";
      renderPills();
      filterSuggestions();
    }

    // Remove a pill by index
    function removePill(index) {
      activePills.splice(index, 1);
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

        const textEl = document.createElement("span");
        textEl.textContent = pill;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "custom-pillbox-input__remove-btn";
        removeBtn.innerHTML = "&times;";
        removeBtn.setAttribute("aria-label", `Remove ${pill}`);

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

      // Disable/enable input and modify placeholder when limit is reached
      if (activePills.length >= maxPills) {
        textField.disabled = true;
        textField.placeholder = "Limit reached";
        hideDropdown();
      } else {
        textField.disabled = false;
        textField.placeholder =
          textField.getAttribute("data-original-placeholder") || "";
      }
    }

    // Filter autocomplete dropdown options
    function filterSuggestions() {
      const query = textField.value.toLowerCase().trim();

      // Exclude values that are already active pills
      const available = originalSuggestions.filter((item) => {
        return (
          !activePills.includes(item.value) &&
          (!query || item.value.toLowerCase().includes(query))
        );
      });

      if (available.length === 0) {
        hideDropdown();
        return;
      }

      // Render suggestion elements
      list.innerHTML = "";
      focusedSuggestionIndex = -1;

      available.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "custom-pillbox-input__suggestion-item";
        li.setAttribute("data-value", item.value);
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

      if (focusedSuggestionIndex >= 0) {
        items[focusedSuggestionIndex].classList.remove("is-active");
      }

      focusedSuggestionIndex += direction;

      if (focusedSuggestionIndex >= items.length) {
        focusedSuggestionIndex = 0;
      } else if (focusedSuggestionIndex < 0) {
        focusedSuggestionIndex = items.length - 1;
      }

      items[focusedSuggestionIndex].classList.add("is-active");
      items[focusedSuggestionIndex].scrollIntoView({ block: "nearest" });
    }

    function showDropdown() {
      dropdown.style.display = "block";
    }

    function hideDropdown() {
      dropdown.style.display = "none";
      focusedSuggestionIndex = -1;
    }

    // Simple visual error feedback (shake input box)
    function shakeInput() {
      box.classList.add("shake");
      setTimeout(() => {
        box.classList.remove("shake");
      }, 500);
    }
  });
});
