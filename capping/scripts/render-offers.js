
 function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return; // Avoid null error if cart-count is missing

  const cart = JSON.parse(localStorage.getItem("cartItems") || "[]");
  cartCountEl.textContent = cart.length;
}


// Add event delegation for dynamically added "Add to Cart" buttons
document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("add-to-cart")) {
    const offerElement = e.target.closest(".offer-item");
    const title = offerElement.querySelector("h2")?.innerText || "Unnamed Offer";
    const description = offerElement.querySelector("p")?.innerText || "";

    const newItem = { title, description };
    const cart = JSON.parse(localStorage.getItem("cartItems") || "[]");
    cart.push(newItem);
    localStorage.setItem("cartItems", JSON.stringify(cart));
    updateCartCount();
  }
});

// Initialize count on page load
updateCartCount();
function waitForAlloy(callback, interval = 100, retries = 50) {
  if (typeof alloy === "function") {
    callback();
  } else if (retries > 0) {
    setTimeout(() => waitForAlloy(callback, interval, retries - 1), interval);
  } else {
    console.error("❌ Alloy is not available after multiple attempts.");
  }
}

waitForAlloy(() => {
  alloy("sendEvent", {
    renderDecisions: true,
    personalization: {
      surfaces: [
        "web://gbedekar489.github.io/capping/custom-events.html#offerContainer"
        // 🔁 Update this to your actual domain/path if needed
      ]
    }
  }).then(response => {
    const container = document.getElementById("offerContainer");
    container.innerHTML = ""; // Clear previous offers
    const offers = [];

    (response.propositions || []).forEach(p => {
      offers.push(...(p.items || []));
    });

    if (!offers.length) {
      container.innerHTML = "<p>No offers available at the moment.</p>";
      return;
    }

    offers.forEach(item => {
      const html = decodeHtml(item.data?.content || "");
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Append only valid .offer-item divs
      [...tempDiv.children].forEach(child => {
        if (child.classList.contains("offer-item")) {
          container.appendChild(child);
        }
      });
    });
  }).catch(err => {
    console.error("❌ Personalization failed:", err);
  });
});

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
