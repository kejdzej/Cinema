const seatsContainer = document.getElementById("seats");
const selectedList = document.getElementById("selected-list");

const rows = 8;
const cols = 12;

// Генерація місць
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const seat = document.createElement("div");
    seat.classList.add("seat");

    // Додаємо класи (за бажанням можна зробити рандомно зайняті місця)
    if (r === 7) {
      seat.classList.add("sofa");
    } else if (r === 4) {
      seat.classList.add("vip");
    } else {
      seat.classList.add("free");
    }

    // Симуляція зайнятих місць
    if (Math.random() < 0.15 && !seat.classList.contains("sofa")) {
      seat.classList.remove("free");
      seat.classList.add("occupied");
    }

    seat.addEventListener("click", () => {
      if (seat.classList.contains("occupied")) return;

      seat.classList.toggle("selected");

      updateSelection();
    });

    seatsContainer.appendChild(seat);
  }
}

function updateSelection() {
  const selectedSeats = document.querySelectorAll(".seat.selected");
  selectedList.innerHTML = "";
  selectedSeats.forEach((seat, index) => {
    const li = document.createElement("li");
    li.textContent = `Miejsce ${index + 1}`;
    selectedList.appendChild(li);
  });
}


//=========
const params = new URLSearchParams(window.location.search);
const title = params.get("title");
const time = params.get("time");

document.querySelector(".movie-header").innerHTML = `
  <h2>${title || 'NAZWA FILMU'}</h2>
  <h2>${time || 'DATA I GODZINA FILMU'}</h2>
`;
