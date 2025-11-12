import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { useState, useEffect } from "react";
import { api } from "../services/api.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length > 1) {
      const timeout = setTimeout(async () => {
        try {
          const res = await api.get(`/movies/search?q=${query}`);
          setResults(res.data);
          setShowResults(true);
        } catch (err) {
          console.error("Search error:", err);
          setResults([]);
          setShowResults(false);
        }
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const handleSelect = async (movie) => {
    setQuery("");
    setShowResults(false);

    try {
      // 🔹 Получаем ближайший сеанс по movie_id
      const res = await api.get(`/sessions/by-movie/${movie.id}`);
      if (res.data?.id) {
        navigate(`/reservation/${res.data.id}`);
      } else {
        alert("Brak dostępnych seansów dla tego filmu 😔");
      }
    } catch (err) {
      console.error("Nie udało się pobrać seansu:", err);
      alert("Błąd ładowania seansu");
    }
  };

  return (
    <nav className="navbar relative">
      <div className="navbar-left">
        <a href="#repertuar" className="brand">🎬 Cinema</a>
        <a href="#repertuar">Repertuar</a>
        <a href="#popcorn">Popcorn Bar</a>
        <a href="#cennik">Cennik</a>
        <a href="#aktualnosci">Aktualności</a>
        {user && <Link to="/dashboard">Moje zamówienia</Link>}
      </div>

      {/* 🔍 wyszukiwarka */}
      <div className="navbar-center relative">
        <input
          type="text"
          placeholder="Szukaj filmu..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />

        {showResults && results.length > 0 && (
          <div className="search-results">
            {results.map((m) => (
              <div
                key={m.id}
                className="search-item"
                onClick={() => handleSelect(m)}
              >
                <img src={m.poster} alt={m.title} width="40" />
                <span>{m.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="navbar-right">
        {!user && <Link to="/login" className="btn-ghost">Logowanie</Link>}
        {!user && <Link to="/register" className="btn">Rejestracja</Link>}
        {user && <button onClick={logout} className="btn-ghost">Wyloguj</button>}
      </div>
    </nav>
  );
}
