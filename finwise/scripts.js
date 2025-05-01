function handleSubscription() {
  window.adobeDataLayer = window.adobeDataLayer || [];
  const selectedNewsletter = document.querySelector('input[name="newsletter"]:checked');
  if (!selectedNewsletter) {
    document.getElementById("error-message").textContent = "Please select a newsletter.";
    return;
  }
  document.getElementById("error-message").textContent = "";

  const subscriptionEvent = {
    event: "newsletterSubscription",
    xdm: {
      eventType: "newsletterSubscription",
      eventID: "newsletter_signup_event",
      timestamp: new Date().toISOString(),
      FinancialInterest: {
        PreferredFinancialInstrument: selectedNewsletter.value
      }
    }
  };

  console.log("📩 Sending data to AEP:", subscriptionEvent);
  window.adobeDataLayer.push(subscriptionEvent);

  setTimeout(() => {
    runPersonalization();
  }, 1000); // Slight delay to ensure data is ingested
}

function runPersonalization() {
  alloy("sendEvent", {
    personalization: {
      decisionScopes: [
        "ewogICJhY3Rpdml0eUlkIjogImRwczpvZmZlci1hY3Rpdml0eToxYTdmMzBkMzgyOWFkZGUyIiwKICAicGxhY2VtZW50SWQiOiAiZHBzOm9mZmVyLXBsYWNlbWVudDoxYTdmMmEyMmEyOTc5MTYxIgp9",
        "ewogICJhY3Rpdml0eUlkIjogImRwczpvZmZlci1hY3Rpdml0eToxYTdmMzBkMzgyOWFkZGUyIiwKICAicGxhY2VtZW50SWQiOiAiZHBzOm9mZmVyLXBsYWNlbWVudDoxYTdmMmEwYTc0NzdlOTYyIgp9",
        "ewogICJhY3Rpdml0eUlkIjogImRwczpvZmZlci1hY3Rpdml0eToxYTdmMzBkMzgyOWFkZGUyIiwKICAicGxhY2VtZW50SWQiOiAiZHBzOm9mZmVyLXBsYWNlbWVudDoxYTdmMjg5YWZjMzdlOTYxIgp9"
      ]
    }
  }).then(result => {
    console.log("📦 Full sendEvent response:", result);
    const decisions = result.propositions || result.handle?.find(h => h.type === "personalization:decisions")?.payload || [];
    const container = document.getElementById("form-container");
    const qualifiedOffers = [];
    const fallbackOffers = [];

    decisions.forEach(decision => {
      const item = decision.items?.[0];
      if (item) {
        if (item.id.startsWith("dps:fallback-offer")) {
          fallbackOffers.push(item);
        } else {
          qualifiedOffers.push(item);
        }
      }
    });

    container.style.opacity = 0;

    setTimeout(() => {
      if (qualifiedOffers.length > 0) {
        container.innerHTML = qualifiedOffers[0].data.content;
      } else if (fallbackOffers.length === 3) {
        container.innerHTML = fallbackOffers[0].data.content;
      } else {
        container.innerHTML = "<p>No personalized offers available at this time.</p>";
      }

      container.style.opacity = 1;
      container.scrollIntoView({ behavior: "smooth" });
    }, 300);

    if (result.errors?.length) {
      console.warn("⚠️ Errors occurred:", result.errors);
    }
  }).catch(error => {
    console.error("🚨 Error in sendEvent:", error);
  });
}

function waitForAlloy(callback) {
  if (typeof alloy === "function") {
    callback();
  } else {
    setTimeout(() => waitForAlloy(callback), 100);
  }
}

waitForAlloy(runPersonalization);
