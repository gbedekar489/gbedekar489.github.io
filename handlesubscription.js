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
