
  function decodeHtmlEntities(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  
  function runPersonalization() {
    console.log("🚀 Sending personalization request to AJO...");
    alloy("sendEvent", {
      renderDecisions: true,
      personalization: {
        surfaces: ["#ajo-offer"]
      }
    }).then(result => {
      console.log("🔍 Web SDK decision response:", result);

      const decision = result.propositions?.[0];
      const html = decision?.items?.[0]?.data?.content;

      const container = document.getElementById("ajo-offer");
      if (html && container) {
        const decodedHtml = decodeHtmlEntities(html);
        console.log("✅ Offer HTML content (decoded):", decodedHtml);
        container.innerHTML = decodedHtml;
      } else {
        console.warn("⚠️ No personalized offer returned.");
      }

      
    }).catch(error => {
      console.error("❌ sendEvent failed:", error);
    });
  }

  function waitForAlloy(callback, retries = 20) {
    if (typeof alloy === "function") {
      callback();
    } else if (retries > 0) {
      console.log("⌛ Waiting for Alloy...");
      setTimeout(() => waitForAlloy(callback, retries - 1), 200);
    } else {
      console.error("❌ alloy is not loaded after waiting.");
    }
  }

  // Trigger initial personalization on page load
  document.addEventListener("DOMContentLoaded", function () {
    waitForAlloy(() => runPersonalization());
  });
