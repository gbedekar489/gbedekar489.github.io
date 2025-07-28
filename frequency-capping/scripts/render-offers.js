function waitForAlloy(callback, interval = 100, retries = 50) {
  if (typeof alloy === "function") {
    callback();
  } else if (retries > 0) {
    setTimeout(() => waitForAlloy(callback, interval, retries - 1), interval);
  } else {
    console.error("❌ Alloy is not available after multiple attempts.");
  }
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
  }).catch(err => {
    console.error("❌ Personalization failed:", err);
  });
});
