let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const prev = document.querySelector('.prev');
const next = document.querySelector('.next');
const titleEl = document.getElementById('movie-title');
const descEl = document.getElementById('movie-description');

const movieData = [                                   //to mozna potem do bazy
  {
    title: "Oppenheimer",
    genre: "Biograficzny, Dramat",
    director: "Christopher Nolan",
    actors: "Cillian Murphy, Emily Blunt, Matt Damon",
    duration: "180 min",
    premiere: "21.07.2023",
    description: "Epicka historia człowieka, który wynalazł bombę atomową i musiał żyć z jej skutkami."
  },
  {
    title: "Lilo & Stitch",
    genre: "Animacja, Komedia",
    director: "Dean DeBlois",
    actors: "Daveigh Chase, Chris Sanders",
    duration: "85 min",
    premiere: "21.06.2002",
    description: "Historia dziewczynki i jej kosmicznego przyjaciela, pełna humoru i emocji."
  },
  {
    title: "Aladdin",
    genre: "Fantasy, Musical",
    director: "Guy Ritchie",
    actors: "Mena Massoud, Naomi Scott, Will Smith",
    duration: "128 min",
    premiere: "24.05.2019",
    description: "Magiczna opowieść o miłości, przygodzie i zaczarowanej lampie."
  },
  {
    title: "Marvel Avengers",
    genre: "Akcja, Sci-Fi",
    director: "Joss Whedon",
    actors: "Robert Downey Jr., Chris Evans, Scarlett Johansson",
    duration: "143 min",
    premiere: "11.04.2012",
    description: "Superbohaterowie łączą siły, by uratować świat przed zagładą."
  },
  {
    title: "Venom",
    genre: "Sci-Fi, Thriller",
    director: "Ruben Fleischer",
    actors: "Tom Hardy, Michelle Williams",
    duration: "112 min",
    premiere: "05.10.2018",
    description: "Dziennikarz staje się gospodarzem symbionta o mrocznej mocy."
  }
];


const genreEl = document.getElementById('movie-genre');
const directorEl = document.getElementById('movie-director');
const actorsEl = document.getElementById('movie-actors');
const durationEl = document.getElementById('movie-duration');
const premiereEl = document.getElementById('movie-premiere');

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    dots[i].classList.toggle('active', i === index);
  });

  const movie = movieData[index];
  titleEl.textContent = movie.title;
  genreEl.textContent = movie.genre;
  directorEl.textContent = movie.director;
  actorsEl.textContent = movie.actors;
  durationEl.textContent = movie.duration;
  premiereEl.textContent = movie.premiere;
  descEl.textContent = movie.description;

  currentSlide = index;
}


function nextSlide() {
  let newIndex = (currentSlide + 1) % slides.length;
  showSlide(newIndex);
}

function prevSlide() {
  let newIndex = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(newIndex);
}

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => showSlide(i));
});

prev.addEventListener('click', prevSlide);
next.addEventListener('click', nextSlide);
document.addEventListener('DOMContentLoaded', () => {
  showSlide(0); // pokazuje pierwszy slajd z opisem
});
setInterval(nextSlide, 4000); // karusel slajdow co 4 sek


// Sparawdzenie przykladowego logowania (bazy nie mamy, wprowadz jakiekolwiek dane)
let isLoggedIn = localStorage.getItem("loggedIn") === "true";

// kliikniecie na wybrany seans
document.querySelectorAll(".showtimes button").forEach(button => {
  button.addEventListener("click", () => {
    if (!isLoggedIn) {
      alert("Musisz się zalogować, aby wybrać miejsce.");
      window.location.href = "dashboard.html"; 
    } else {
      
      const movieTitle = button.closest(".movie-info").querySelector("h4").textContent;
      const time = button.textContent;

      const params = new URLSearchParams({
        title: movieTitle,
        time: time
      });

      window.location.href = `booking.html?${params.toString()}`;
    }
  });
});

//wyszykaj...

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const movieCards = document.querySelectorAll(".repertoire-section .movie-card");

  searchInput.addEventListener("input", function () {
    const query = searchInput.value.toLowerCase();

    movieCards.forEach(card => {
      const title = card.querySelector("h4").textContent.toLowerCase();
      if (title.includes(query)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
});

//chatbot

function toggleChat() {
  const chat = document.getElementById('chat-window');
  chat.style.display = (chat.style.display === 'flex') ? 'none' : 'flex';
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  const box = document.getElementById("chat-box");
  const message = input.value.trim();
  if (!message) return;

  // Додати повідомлення користувача
  const userMsg = document.createElement("div");
  userMsg.className = "user-msg";
  userMsg.textContent = "Ty: " + message;
  box.appendChild(userMsg);

  // Відповідь бота
  const botMsg = document.createElement("div");
  botMsg.className = "bot-msg";

  if (message.toLowerCase().includes("bilet")) {
    botMsg.textContent = "Możesz sprawdzić historię biletów w zakładce poniżej.";
  } else if (message.toLowerCase().includes("popcorn")) {
    botMsg.textContent = "Ceny popcornu znajdziesz w zakładce POPCORN BAR.";
  } else {
    botMsg.textContent = "Dziękuję za wiadomość! Wkrótce się z Tobą skontaktujemy.";
  }

  box.appendChild(botMsg);
  box.scrollTop = box.scrollHeight;
  input.value = "";
}

