// === script.js ===

const houseListElement = document.getElementById("house-list");
const modal = document.getElementById("booking-modal");
const modalContent = document.getElementById("modal-content");

// Load house data from JSON
fetch("houses.json")
  .then(res => res.json())
  .then(houses => {
    houses.forEach(house => {
      const houseCard = document.createElement("div");
      houseCard.className = "house-type-card";
      houseCard.innerHTML = `
        <img src="${house.image}" alt="${house.type}" />
        <h2>${house.type}</h2>
      `;
      houseCard.addEventListener("click", () => showCategories(house));
      houseListElement.appendChild(houseCard);
    });
  });

// Show category list in modal
function showCategories(house) {
  modal.style.display = "flex";
  modalContent.innerHTML = `
    <span class="close" onclick="modal.style.display='none'">&times;</span>
    <h2>${house.type}</h2>
    <div class="category-list">
      ${house.categories.map((cat) => `
        <div class="category-card">
          <img src="${cat.image}" alt="${cat.name}" />
          <h3>${cat.name}</h3>
          <p>Storage: ${cat.storage}</p>
          <p>Status: ${cat.available ? "Available" : "<span class='not-available'>Not Available</span>"}</p>
          ${cat.available ? `<button onclick="openBooking('${house.type}', '${cat.name}')">Request to Book</button>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

// Open booking form
function openBooking(houseType, categoryName) {
  modalContent.innerHTML = `
    <span class="close" onclick="modal.style.display='none'">&times;</span>
    <h3>Request Booking - ${houseType} / ${categoryName}</h3>
    <input type="text" id="username" placeholder="Your Name" required />
    <input type="text" id="discord" placeholder="Discord ID" required />
    <textarea id="message" placeholder="Extra Info (optional)"></textarea>
    <button onclick="submitBooking('${houseType}', '${categoryName}')">Submit</button>
  `;
}

// Submit form with FormData (CORS-safe)
function submitBooking(houseType, categoryName) {
  const username = document.getElementById("username").value.trim();
  const discord = document.getElementById("discord").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!username || !discord) {
    alert("⚠️ Please fill in all required fields.");
    return;
  }

  const formData = new FormData();
  formData.append("token", "los_santos_secure_786"); // 🔐 Secure token
  formData.append("house", houseType);
  formData.append("category", categoryName);
  formData.append("name", username);
  formData.append("discord", discord);
  formData.append("message", message);

  const scriptURL = "https://script.google.com/macros/s/AKfycbx3xYAdQ1EfLJ3yCLjkd-OwHV-wwrGGTh9oir_tGeDV-jecuA1atvMaWTtKAjvIutU/exec";

  fetch(scriptURL, {
    method: "POST",
    body: formData
  })
    .then(res => res.text())
    .then(response => {
      if (response.includes("Success")) {
        alert("✅ Request submitted successfully!");
        modal.style.display = "none";
      } else {
        alert("❌ Submission failed: " + response);
      }
    })
    .catch(error => {
      console.error("Error submitting request:", error);
      alert("🚫 Something went wrong. Please try again.");
    });
}

// ESC key to close modal
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modal.style.display = "none";
  }
});

window.submitBooking = submitBooking;
window.openBooking = openBooking;
