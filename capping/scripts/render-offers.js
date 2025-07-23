<script>
function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  const cart = JSON.parse(localStorage.getItem("cartItems") || "[]");
  cartCountEl.textContent = cart.length;
}

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

// 🔧 Generate a UUID for event _id
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0,
      v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 🔄 Get ECID from Alloy identity
function getEcidFromAlloy(callback) {
  alloy("getIdentity").then(result => {
    const ecid = result.identityMap?.ECID?.[0]?.id;
    if (ecid) callback(ecid);
    else console.warn("⚠️ ECID not found.");
  }).catch(err => {
    console.error("❌ Failed to get ECID:", err);
  });
}

// 🔄 Main logic
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

    // Save propositions globally for impression event
    window.latestPropositions = response.propositions || [];

    window.latestPropositions.forEach(p => {
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

      [...tempDiv.children].forEach(child => {
        if (child.classList.contains("offer-item")) {
          container.appendChild(child);
        }
      });
    });

    // ✅ Trigger the impression event
    getEcidFromAlloy(ecidValue => {
      alloy("sendEvent", {
        xdm: {
          _id: generateUUID(),
          timestamp: new Date().toISOString(),
          eventType: "decisioning.propositionDisplay",
          identityMap: {
            ECID: [{
              id: _satellite.getVar("ECID"),
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
</script>
