function waitForAlloy(callback, interval = 100, retries = 50) {
  if (typeof alloy === "function") {
    callback();
  } else if (retries > 0) {
    setTimeout(() => waitForAlloy(callback, interval, retries - 1), interval);
  } else {
    console.error("❌ Alloy is not available.");
  }
}

waitForAlloy(() => {
  alloy("sendEvent", {
    renderDecisions: true,
    personalization: {
      surfaces: [
        "web://yourdomain.com/yourfolder/index.html#offerContainer"
      ]
    }
  }).then(response => {
    const container = document.getElementById("offerContainer");
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
      const wrapper = document.createElement("div");
      wrapper.className = "offer-item";
      wrapper.innerHTML = html;
      container.appendChild(wrapper);
    });
  });
});

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
