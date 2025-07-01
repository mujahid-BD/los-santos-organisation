// DOM References
let houseListElement = document.getElementById("house-list");
let modal = document.getElementById("booking-modal");
let modalContent = document.getElementById("modal-content");

// Load house data from JSON
fetch("houses.json")
  .then(res => res.json())
  .then(houses => {
    houses.forEach(house => {
      let houseCard = document.createElement("div");
      houseCard.className = "house-type-card";
      houseCard.innerHTML = `
        <img src="${house.image}" alt="${house.type}" />
        <h2>${house.type}</h2>
      `;
      houseCard.addEventListener("click", () => showCategories(house));
      houseListElement.appendChild(houseCard);
    });
  });

// Show categories in modal
function showCategories(house) {
  modal.style.display = "flex";
  modalContent.innerHTML = `
    <span class="close" onclick="modal.style.display='none'">&times;</span>
    <h2>${house.type}</h2>
    <div class="category-list">
      ${house.categories.map((cat, i) => `
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

// Show booking form
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

// Submit form to Google Sheet (change URL to your Apps Script)
function submitBooking(houseType, categoryName) {
  const username = document.getElementById("username").value;
  const discord = document.getElementById("discord").value;
  const message = document.getElementById("message").value;

  if (!username || !discord) {
    alert("Please fill all required fields.");
    return;
  }

  const payload = {
    house: houseType,
    category: categoryName,
    name: username,
    discord: discord,
    message: message
  };

  // Replace with your Apps Script URL
  const scriptURL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec";

  fetch(scriptURL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" }
  })
  .then(response => {
    if (response.ok) {
      alert("Request submitted successfully!");
      modal.style.display = "none";
    } else {
      alert("Something went wrong!");
    }
  });
}

// ESC to close modal
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.style.display = "none";
});
