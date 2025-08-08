let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const prev = document.querySelector('.prev');
const next = document.querySelector('.next');
const titleEl = document.getElementById('movie-title');
const descEl = document.getElementById('movie-description');

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Fetch films from API
async function fetchFilms() {
  try {
    const response = await fetch(`${API_BASE_URL}/films`);
    const data = await response.json();
    
    if (data.films) {
      updateMovieCards(data.films);
      updateSliderData(data.films);
    }
  } catch (error) {
    console.error('Failed to fetch films:', error);
  }
}

// Update movie cards with API data
function updateMovieCards(films) {
  const repertoireGrid = document.querySelector('.repertoire-grid');
  if (!repertoireGrid) return;

  repertoireGrid.innerHTML = '';

  films.forEach(film => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    
    movieCard.innerHTML = `
      <img src="${film.poster_url}" alt="${film.title}" />
      <div class="movie-info">
        <h4>${film.title}</h4>
        <div class="showtimes">
          <button onclick="selectShowtime('${film.id}', '12:00')">12:00</button>
          <button onclick="selectShowtime('${film.id}', '15:30')">15:30</button>
          <button onclick="selectShowtime('${film.id}', '18:45')">18:45</button>
          <button onclick="selectShowtime('${film.id}', '21:00')">21:00</button>
        </div>
      </div>
    `;
    
    repertoireGrid.appendChild(movieCard);
  });
}

// Update slider with API data
function updateSliderData(films) {
  if (films.length === 0) return;
  
  // Update first slide data
  const firstFilm = films[0];
  titleEl.textContent = firstFilm.title;
  document.getElementById('movie-genre').textContent = firstFilm.genre || '';
  document.getElementById('movie-director').textContent = firstFilm.director || '';
  document.getElementById('movie-actors').textContent = firstFilm.actors || '';
  document.getElementById('movie-duration').textContent = `${firstFilm.duration_min} min`;
  document.getElementById('movie-premiere').textContent = firstFilm.premiere_date ? new Date(firstFilm.premiere_date).toLocaleDateString('pl-PL') : '';
  descEl.textContent = firstFilm.description || '';
}

// Select showtime function
function selectShowtime(filmId, time) {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  
  if (!isLoggedIn) {
    alert("Musisz się zalogować, aby wybrać miejsce.");
    window.location.href = "login.html";
    return;
  }

  // For now, redirect to booking with film ID
  const params = new URLSearchParams({
    filmId: filmId,
    time: time
  });

  window.location.href = `booking.html?${params.toString()}`;
}

const movieData = [                                   //to mozna potem do bazy
  {
    title: "Oppenheimer",
    genre: "Biograficzny, Dramat",
    director: "Christopher Nolan",
    actors: "Cillian Murphy, Emily Blunt, Matt Damon",
    duration: "180 min",
    premiere: "21.07.2023",
    description: "Epicka historia człowieka, który wynalazł bombę atomową i musiał żyć z jego skutkami."
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

// Logout function
function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
  isLoggedIn = false;
  updateAuthUI();
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  showSlide(0); // pokazuje pierwszy slajd z opisem
  
  // Update auth UI
  updateAuthUI();
  
  // Fetch films from API
  fetchFilms();
});

setInterval(nextSlide, 4000); // karusel slajdow co 4 sek

// Check if user is logged in
let isLoggedIn = localStorage.getItem("loggedIn") === "true";
const authToken = localStorage.getItem("authToken");

// Update UI based on login status
function updateAuthUI() {
  const authButtons = document.querySelector('.auth-buttons');
  if (authButtons) {
    // Re-check login status
    const currentLoginStatus = localStorage.getItem("loggedIn") === "true";
    const userEmail = localStorage.getItem("userEmail");
    
    if (currentLoginStatus) {
      authButtons.innerHTML = `
        <span style="color: gold; margin-right: 10px;">Zalogowany: ${userEmail || "Użytkownik"}</span>
        <a href="#" onclick="logout()" class="login">Wyloguj</a>
      `;
    } else {
      authButtons.innerHTML = `
        <a href="login.html" class="login">🔑 Zaloguj się</a>
        <a href="register.html" class="register">Zarejestruj się</a>
      `;
    }
  }
}

// kliikniecie na wybrany seans - nowa wersja z API
document.addEventListener('click', (e) => {
  if (e.target.matches('.showtimes button')) {
    if (!isLoggedIn) {
      alert("Musisz się zalogować, aby wybrać miejsce.");
      window.location.href = "login.html"; 
    } else {
      const movieCard = e.target.closest('.movie-card');
      const movieTitle = movieCard.querySelector("h4").textContent;
      const time = e.target.textContent;

      const params = new URLSearchParams({
        title: movieTitle,
        time: time
      });

      window.location.href = `booking.html?${params.toString()}`;
    }
  }
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

