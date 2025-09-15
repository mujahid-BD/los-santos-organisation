let houseListElement = document.querySelector("#house-list .house-grid");
let topRatedListElement = document.querySelector("#top-rated-list");
let modal = document.getElementById("booking-modal");
let modalContent = document.getElementById("modal-content");

// Optional: Google Sheet API
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyFUDtuBSpvkaXXDVzYHscL8GWdDEjj8SYd-3rr7jVA3hpxUzRId_6guqVqjwHm_F8/exec";

// Discord Webhook URL
const DISCORD_WEBHOOK_URL = "your_discord_webhook_url_here"; // Update here

// Load house data
fetch("houses.json")
  .then(res => res.json())
  .then(houses => {
    houses.forEach((house, houseIndex) => {
      renderHouseCard(house, houseListElement, houseIndex);
      house.categories.forEach((cat, catIndex) => {
        const avgRating = getAverageRating(house.type, cat.name);
        if (avgRating >= 4.5) {
          renderHouseCard(house, topRatedListElement, houseIndex, catIndex);
        }
      });
    });

    sendHouseStatusToDiscord(houses); // Discord post
  });

// Load and render employees
fetch("employees.json")
  .then(res => res.json())
  .then(employees => {
    renderEmployees(employees);
  });

// === House UI rendering ===
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
    <div class="category-grid">
      ${house.categories.map((cat) => `
        <div class="category-card">
          <img src="${cat.image}" alt="${cat.name}" />
          <h3>${cat.name}</h3>
          <p>Storage: ${cat.storage}</p>
          <p>Status: ${cat.available ? "✅ Available" : "<span class='not-available'>❌ Not Available</span>"}</p>
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
    .then(res => {
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

// === Rating ===
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

// === Discord Reporter ===
function sendHouseStatusToDiscord(houses) {
  let message = "**🏠 House Availability List**\n\n";
  houses.forEach(house => {
    house.categories.forEach(cat => {
      message += `**${house.type} - ${cat.name}**: ${cat.available ? "✅ Available" : "❌ Not Available"}\n`;
    });
  });

  fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });
}

// === Employee Rendering ===
function renderEmployees(employees) {
  const container = document.getElementById("employees-container");
  container.innerHTML = "";

  const roles = {
    "Owner": [],
    "Manager": [],
    "Assistant Manager": [],
    "Agent Head": [],
    "Agent": []
  };

  employees.forEach(emp => {
    if (roles[emp.role]) {
      roles[emp.role].push(emp);
    }
  });

  // Owner
  roles["Owner"].forEach(emp => {
    container.appendChild(createEmployeeCard(emp, "full-width"));
  });

  // Manager + Assistant Manager
  const managerRow = document.createElement("div");
  managerRow.className = "employee-row";
  [...roles["Manager"], ...roles["Assistant Manager"]].forEach(emp => {
    managerRow.appendChild(createEmployeeCard(emp));
  });
  if (managerRow.children.length > 0) container.appendChild(managerRow);

  // Agent Head
  roles["Agent Head"].forEach(emp => {
    container.appendChild(createEmployeeCard(emp, "full-width"));
  });

  // Agent: 3 per row
  for (let i = 0; i < roles["Agent"].length; i += 3) {
    const row = document.createElement("div");
    row.className = "employee-row";
    roles["Agent"].slice(i, i + 3).forEach(emp => {
      row.appendChild(createEmployeeCard(emp));
    });
    container.appendChild(row);
  }
}

function createEmployeeCard(emp, type = "normal") {
  const card = document.createElement("div");
  card.className = type === "full-width" ? "employee-card full-width" : "employee-card";
  card.innerHTML = `
    <img src="${emp.image}" alt="${emp.name}">
    <h3>${emp.name}</h3>
    <p>${emp.role}</p>
    <p>📞 ${emp.number}</p>
    <p>💬 ${emp.discord}</p>
    ${emp.employeeOfTheMonth ? `<span class="badge">🏅 Employee of the Month</span>` : ""}
  `;
  return card;
}
