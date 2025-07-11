// === script.js ===

let houseListElement = document.querySelector("#house-list .house-grid");
let topRatedListElement = document.querySelector("#top-rated-list");
let modal = document.getElementById("booking-modal");
let modalContent = document.getElementById("modal-content");

// Google Apps Script URL (optional)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyFUDtuBSpvkaXXDVzYHscL8GWdDEjj8SYd-3rr7jVA3hpxUzRId_6guqVqjwHm_F8/exec";

// Discord Webhook (Replace with your own if needed)
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1393344900476698795/ZBwAegNGJ8Oo5hG0FYu99fwR002mfQ16MrL2d31pSz1OkrywFC9QKwPIRouuj9ptWoRJ";

// Load JSON data
fetch("houses.json")
  .then((res) => res.json())
  .then((houses) => {
    houses.forEach((house, houseIndex) => {
      renderHouseCard(house, houseListElement, houseIndex);

      house.categories.forEach((cat, catIndex) => {
        const avgRating = getAverageRating(house.type, cat.name);
        if (avgRating >= 4.5) {
          renderHouseCard(house, topRatedListElement, houseIndex, catIndex);
        }
      });
    });

    // Optional: Send data to Discord once loaded
     sendHouseStatusToDiscord(houses);
  });

function renderHouseCard(house, container, houseIndex, catIndex = null) {
  let card = document.createElement("div");
  card.className = "house-type-card";
  card.innerHTML = `<img src="${house.image}" alt="${house.type}" />
    <h2>${house.type}</h2>`;
  card.addEventListener("click", () => showCategories(house, houseIndex));

  if (catIndex !== null) {
    const cat = house.categories[catIndex];
    card.innerHTML += `
      <p>🏷️ ${cat.name}</p>
      <p>⭐ Rating: ${getAverageRating(house.type, cat.name).toFixed(1)}</p>`;
  }

  container.appendChild(card);
}

function showCategories(house, houseIndex) {
  modal.style.display = "block";
  modalContent.innerHTML = `<span class="close" id="close-modal">&times;</span>
    <h2>${house.type}</h2>
    <div class="category-list">
      ${house.categories.map((cat, index) => `
        <div class="category-card">
          <img src="${cat.image}" alt="${cat.name}" />
          <h3>${cat.name}</h3>
          <p>Storage: ${cat.storage}</p>
          <p>Status: ${cat.available ? "Available" : "<span class='not-available'>Not Available</span>"}</p>
          ${renderRatingStars(house.type, cat.name)}
          ${cat.available ? `<button onclick="openBooking('${house.type}', '${cat.name}')">Request to Book</button>` : ""}
        </div>
      `).join("")}
    </div>
  `;

  document.getElementById("close-modal").onclick = () => {
    modal.style.display = "none";
  };

  document.querySelectorAll('.rating-star').forEach(star => {
    star.addEventListener('click', function () {
      const houseType = this.dataset.house;
      const category = this.dataset.category;
      const rating = parseInt(this.dataset.value);
      saveRating(houseType, category, rating);
      showCategories(house, houseIndex);
    });
  });
}

function openBooking(houseType, categoryName) {
  let formHTML = `
    <h3>Request Booking - ${houseType} / ${categoryName}</h3>
    <input type="text" id="username" placeholder="Your Name" required />
    <input type="text" id="discord" placeholder="Discord ID" required />
    <textarea id="message" placeholder="Extra Info"></textarea>
    <button onclick="submitBooking('${houseType}', '${categoryName}')">Submit</button>
  `;
  modalContent.innerHTML = formHTML;
}

function submitBooking(houseType, categoryName) {
  const username = document.getElementById("username").value;
  const discord = document.getElementById("discord").value;
  const message = document.getElementById("message").value;

  if (!username || !discord) {
    alert("Please fill in all required fields.");
    return;
  }

  const formData = new URLSearchParams();
  formData.append("house", houseType);
  formData.append("category", categoryName);
  formData.append("name", username);
  formData.append("discord", discord);
  formData.append("message", message);

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      if (res.ok) {
        alert("Booking request sent successfully!");
        modal.style.display = "none";
      } else {
        alert("Failed to send request.");
      }
    })
    .catch(() => {
      alert("Error sending request.");
    });
}

function renderRatingStars(houseType, category) {
  const avg = getAverageRating(houseType, category);
  let html = '<div class="rating-stars">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="rating-star ${i <= avg ? 'filled' : ''}" data-house="${houseType}" data-category="${category}" data-value="${i}">&#9733;</span>`;
  }
  html += ` <small>(${avg.toFixed(1)})</small></div>`;
  return html;
}

function getAverageRating(houseType, category) {
  const key = `${houseType}-${category}`;
  const data = JSON.parse(localStorage.getItem("ratings") || "{}");
  if (!data[key]) return 0;
  return data[key].total / data[key].count;
}

function saveRating(houseType, category, rating) {
  const key = `${houseType}-${category}`;
  const data = JSON.parse(localStorage.getItem("ratings") || "{}");
  if (!data[key]) {
    data[key] = { total: 0, count: 0 };
  }
  data[key].total += rating;
  data[key].count += 1;
  localStorage.setItem("ratings", JSON.stringify(data));
}

// 🚀 Optional: Send current house list to Discord
function sendHouseStatusToDiscord(houses) {
  let message = "**🏠 House Availability List**\n\n";
  houses.forEach(house => {
    house.categories.forEach(cat => {
      message += `**${house.type} - ${cat.name}**: ${cat.available ? "✅ Available" : "❌ Not Available"}\n`;
    });
  });

  fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content: message })
  });
}
