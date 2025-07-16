
const apiKey = "02921f56f5e20476dfedbae7b43dfb58";

navigator.geolocation.getCurrentPosition(pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`)
    .then(res => res.json())
    .then(data => {
      const temp = Math.round(data.main.temp);
      const condition = data.weather[0].main;
      const city = data.name;

      document.getElementById("weatherStatus").textContent =
        `Current temperature in ${city} is ${temp}°F with ${condition}.`;

      alloy("sendEvent", {
        renderDecisions: true,
        personalization: {
          surfaces: [
            "web://gbedekar489.github.io/weather/weather-offers.html#offerContainer"
          ]
        },
        xdm: {
          eventType: "decisioning.request",
          _techmarketingdemos: {
            temperature: temp,
            weatherConditions: condition,
            cityName: city
          }
        }
      }).then(response => {
        const allOffers = [];
        const offerItems = [];
        const offerDiv = document.getElementById("offerContainer");
        offerDiv.innerHTML = "";
        window.latestPropositions = response.propositions || [];
        (response.propositions || []).forEach(p => {
          const items = p.items || [];
          allOffers.push(...items);
          items.forEach(item => {
            if (item.id) {
              offerItems.push({
                id: item.id,
                trackingToken: item.meta?.trackingToken
              });
            }
          });
        });

        if (!allOffers.length) {
          offerDiv.innerHTML = "<p>No AJO offers returned.</p>";
          return;
        }

        allOffers.forEach(item => {
          let decoded = decodeHtml(item.data?.content || "");
          //decoded = decoded.replace("{{item.id}}", item.id);
          //const wrapper = document.createElement("div");
          //wrapper.className = "offer";
          //wrapper.setAttribute("data-offer-id", item.id);
          //wrapper.setAttribute("data-tracking-token", item.meta?.trackingToken);
          //wrapper.innerHTML = decoded;
          const container = document.getElementById("offerContainer");
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = decoded;
           [...tempDiv.children].forEach(child => {
            if (child.classList.contains("offer-item")) {
            container.appendChild(child);
    }
  });

  // Append the offer-item directly without any wrapper
  //const offerItem = tempDiv.firstElementChild;
  //container.appendChild(offerItem);

          wrapper.querySelectorAll("a, button").forEach(el => {
            el.addEventListener("click", () => {
              const container = el.closest(".offer-item");
              const offerId = container.getAttribute("data-offer-id");
              const trackingToken = container.getAttribute("data-tracking-token");
              const ecidValue = getECID();

              if (!ecidValue) {
                console.error("❌ ECID not available. Cannot send interaction event.");
                return;
              }

              alloy("sendEvent", {
                xdm: {
                  _id: generateUUID(),
                  timestamp: new Date().toISOString(),
                  eventType: "decisioning.propositionInteract",
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
                        interact: 1
                      },
                      propositionAction: {
                        id: offerId,
                        tokens: [trackingToken]
                      },
                       propositions: window.latestPropositions
                    }
                  }
                }
              });
            });
          });

          offerDiv.appendChild(wrapper);
        });

        if (offerItems.length > 0) {
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
        }
      }).catch(err => {
        console.error("❌ Personalization failed:", err);
      });
    })
    .catch(error => {
      console.error("Failed to fetch weather data:", error);
    });
});

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function generateUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function getECID() {
  try {
    return _satellite.getVar("ECID");
  } catch (e) {
    console.warn("ECID not available via _satellite.");
    return null;
  }
}
