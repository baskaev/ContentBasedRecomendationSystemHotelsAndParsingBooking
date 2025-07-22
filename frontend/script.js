const API_HOST = ''; // API и фронт размещены вместе

function getRandomImage() {
  const index = Math.floor(Math.random() * 5) + 1; // от 1 до 5
  return `${index}.png`;
}

// Для index.html
if (location.pathname.endsWith("index.html") || location.pathname === "/") {
  fetch("hotels_data.json")
    .then(res => res.json())
    .then(hotels => {
      const container = document.getElementById("hotels-container");
      hotels.forEach((hotel) => {
        const card = document.createElement("a"); 
        card.className = "card";
        card.href = "hotel.html"; // ссылка для перехода
        const imgSrc = getRandomImage();
        hotel.imageSrc = imgSrc; // Сохраняем для передачи в hotel.html

        card.innerHTML = `
          <img src="${imgSrc}" alt="${hotel.name}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">
          <h3>${hotel.name}</h3>
          <p>${hotel.address}</p>
        `;

        card.addEventListener("click", () => {
          // Сохраняем данные при любом клике (включая средний)
          localStorage.setItem("selectedHotel", JSON.stringify(hotel));
        });

        container.appendChild(card);
      });
    });
}

// Для hotel.html
if (location.pathname.endsWith("hotel.html")) {
  const hotel = JSON.parse(localStorage.getItem("selectedHotel"));
  const detailsContainer = document.getElementById("hotel-details");

  if (!hotel) {
    detailsContainer.innerText = "Гостиница не выбрана.";
  } else {
    const mainImage = hotel.imageSrc || getRandomImage();

    let reviewsHTML = "";
    if (hotel.reviews) {
      reviewsHTML = "<ul>";
      for (const key in hotel.reviews) {
        reviewsHTML += `<li><strong>${key}:</strong> ${hotel.reviews[key]}</li>`;
      }
      reviewsHTML += "</ul>";
    }

    let conditionsHTML = "";
    if (hotel.conditions) {
      conditionsHTML = "<ul>";
      for (const key in hotel.conditions) {
        conditionsHTML += `<li><strong>${key}:</strong> ${hotel.conditions[key]}</li>`;
      }
      conditionsHTML += "</ul>";
    }

    let notesHTML = "";
    if (hotel.notes && hotel.notes.length > 0) {
      notesHTML = "<ul>" + hotel.notes.map(note => `<li>${note}</li>`).join("") + "</ul>";
    }

    let landmarksHTML = "";
    if (hotel.landmarks) {
      for (const category in hotel.landmarks) {
        landmarksHTML += `<h4>${category}:</h4><ul>`;
        hotel.landmarks[category].forEach(l => {
          landmarksHTML += `<li>${l.name} — ${l.distance}</li>`;
        });
        landmarksHTML += "</ul>";
      }
    }

    detailsContainer.innerHTML = `
      <img src="${mainImage}" alt="${hotel.name}" style="display: block; margin: 0 auto 20px auto; width: 300px; border-radius: 10px;">
      <h1>${hotel.name}</h1>
      <p><strong>Адрес:</strong> ${hotel.address}</p>
      <p><strong>Описание:</strong> ${hotel.description}</p>
      <p><strong>Удобства:</strong> ${hotel.amenities_text}</p>
      <h3>Отзывы:</h3>${reviewsHTML}
      <h3>Условия проживания:</h3>${conditionsHTML}
      <h3>Заметки:</h3>${notesHTML}
      <h3>Достопримечательности поблизости:</h3>${landmarksHTML}
      <p><a href="${hotel.url}" target="_blank">Ссылка на оригинал на Booking.com</a></p>
    `;

    fetch(`${API_HOST}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hotel)
    })
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("similar-hotels");
        data.recommendations.forEach(h => {
          const imgSrc = getRandomImage();
          h.imageSrc = imgSrc;
          const card = document.createElement("a"); // тоже ссылки
          card.className = "card";
          card.href = "hotel.html";
          card.innerHTML = `
            <img src="${imgSrc}" alt="${h.name}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">
            <h3>${h.name}</h3>
            <p>${h.address}</p>
          `;
          card.addEventListener("click", () => {
            localStorage.setItem("selectedHotel", JSON.stringify(h));
          });
          container.appendChild(card);
        });
      });
  }
}

