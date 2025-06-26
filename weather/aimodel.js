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

      // Personalization call
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
        const offerIds = [];
        const offerDiv = document.getElementById("offerContainer");
        offerDiv.innerHTML = "";

        (response.propositions || []).forEach(p => {
          const items = p.items || [];
          allOffers.push(...items);
          items.forEach(item => {
            if (item.id) offerIds.push(item.id);
          });
        });

        if (!allOffers.length) {
          offerDiv.innerHTML = "<p>No AJO offers returned.</p>";
          return;
        }

        allOffers.forEach(item => {
          let decoded = decodeHtml(item.data?.content || "");
          decoded = decoded.replace('{{item.id}}', item.id);
          const wrapper = document.createElement("div");
          wrapper.className = "offer";
          wrapper.innerHTML = decoded;

          // Add interaction tracking to <a> and <button>
          wrapper.querySelectorAll("a, button").forEach(el => {
            el.addEventListener("click", () => {
              alloy("sendEvent", {
                xdm: {
                  "_id": generateUUID(),
                  "xdm:timestamp": new Date().toISOString(),
                  "xdm:eventType": "decisioning.propositionInteract",
                  "https://ns.adobe.com/experience/decisioning/propositions": [
                    {
                      "xdm:scope": "web://gbedekar489.github.io/weather/weather-offers.html#offerContainer",
                      "xdm:items": [
                        {
                          "xdm:id": `personalized-offer:${item.id}`
                        }
                      ]
                    }
                  ]
                }
              });
            });
          });

          offerDiv.appendChild(wrapper);
        });

        // Send impression event for all offers
        if (offerIds.length > 0) {
          alloy("sendEvent", {
            xdm: {
              "_id": generateUUID(),
              "xdm:timestamp": new Date().toISOString(),
              "xdm:eventType": "decisioning.propositionDisplay",
              "https://ns.adobe.com/experience/decisioning/propositions": [
                {
                  "xdm:scope": "web://gbedekar489.github.io/weather/weather-offers.html#offerContainer",
                  "xdm:items": offerIds.map(id => ({ "xdm:id": `personalized-offer:${id}` }))
                }
              ]
            }
          });
        }
      }).catch(err => {
        console.error("\u274C Personalization failed:", err);
      });
    })
    .catch(error => {
      console.error("Failed to fetch weather data:", error);
    });
});

// Utility to decode encoded HTML
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// UUID generator for @id
function generateUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
