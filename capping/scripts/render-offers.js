
function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;
  const cart = JSON.parse(localStorage.getItem("cartItems") || "[]");
  cartCountEl.textContent = cart.length;
}

// Handle "Add to Cart" button clicks
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

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

waitForAlloy(() => {
  alloy("sendEvent", {
    renderDecisions: true,
    personalization: {
      surfaces: [
        "web://gbedekar489.github.io/capping/custom-events.html#offerContainer"
      ]
    }
  }).then(response => {
    const container = document.getElementById("offerContainer");
    container.innerHTML = "";
    const offers = [];

    (response.propositions || []).forEach(p => {
      offers.push(...(p.items || []));
    });

    // Store the propositions globally so we can send them in impression event
    window.latestPropositions = response.propositions;

    if (!offers.length) {
      container.innerHTML = "<p>No offers available at the moment.</p>";
      return;
    }

    // Render offers
    offers.forEach(item => {
      const html = decodeHtml(item.data?.content || "");
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      [...tempDiv.children].forEach(child => {
        if (child.classList.contains("offer-item")) {
          container.appendChild(child);
        }
      });
    });

    // After rendering, send display event
    sendImpressionEvent();
  }).catch(err => {
    console.error("❌ Personalization failed:", err);
  });
});

function sendImpressionEvent() {
  const ecidValue = _satellite.getVar("ECID");
  if (!ecidValue) {
    console.warn("⚠️ ECID not found using _satellite.getVar.");
    return;
  }

  if (!window.latestPropositions) {
    console.warn("⚠️ No propositions found to send as impressions.");
    return;
  }

  alloy("sendEvent", {
    xdm: {
      _id: generateUUID(),
      timestamp: new Date().toISOString(),
      eventType: "decisioning.propositionDisplay",
      identityMap: {
        ECID: [{
          id: ecidValue,
          authenticatedState: "ambiguous",
          primary: true
        }]
      },
      _experience: {
        decisioning: {
          propositionEventType: {
            display: 1
          },
          propositions: window.latestPropositions
        }
      }
    }
  }).then(() => {
    console.log("✅ Impression event sent.");
  }).catch(err => {
    console.error("❌ Failed to send impression event:", err);
  });
}

