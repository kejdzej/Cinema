import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useToast } from "../App.jsx"; // Добавляем useToast
import { useState, useEffect } from "react";
import { api } from "../services/api.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast(); // Получаем функцию тоста
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  // Warunki dla różnych stron
  const isHomePage = location.pathname === '/';
  const isAdminPanel = location.pathname.startsWith('/admin');
  const isDashboard = location.pathname === '/dashboard';

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
      const res = await api.get(`/sessions/by-movie/${movie.id}`);
      if (res.data?.id) {
        navigate(`/reservation/${res.data.id}`);
      } else {
        // Заменяем alert() на showToast()
        showToast("error", "Brak dostępnych seansów dla tego filmu 😔");
      }
    } catch (err) {
      console.error("Nie udało się pobrać seansu:", err);
      // Заменяем alert() на showToast()
      showToast("error", "Błąd ładowania seansu");
    }
  };

  // Funkcja do przewijania do sekcji
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="navbar relative">
      <div className="navbar-left">
        <Link to="/" className="brand">🎬 Cinema</Link>
        
        {/* Linki do sekcji tylko na stronie głównej */}
        {isHomePage && (
          <>
            <span onClick={() => scrollToSection('repertuar')} style={{cursor: 'pointer'}}>Repertuar</span>
            <span onClick={() => scrollToSection('popcorn')} style={{cursor: 'pointer'}}>Popcorn Bar</span>
            <span onClick={() => scrollToSection('cennik')} style={{cursor: 'pointer'}}>Cennik</span>
            <span onClick={() => scrollToSection('aktualnosci')} style={{cursor: 'pointer'}}>Aktualności</span>
          </>
        )}
        
        {/* Na innych stronach (oprócz admin) pokaż link do strony głównej */}
        {!isHomePage && !isAdminPanel && (
          <Link to="/">Strona główna</Link>
        )}
        
        {/* W panelu admin przycisk powrotu */}
        {isAdminPanel && (
          <span style={{cursor: 'pointer'}} onClick={() => window.history.back()}>← Powrót</span>
        )}
        
        {/* Linki dla zalogowanych użytkowników - poprawiona kolejność */}
        {user && (
          <>
            {!isAdminPanel && !isDashboard && <Link to="/dashboard">Moje zamówienia</Link>}
            <Link to="/rewards">Punkty i Nagrody</Link>
            <Link to="/recommendations">Rekomendacje</Link>
          </>
        )}
        
        {/* Linki dla admina i pracownika */}
        {user && user.role === 'admin' && !isAdminPanel && (
          <Link to="/admin/dashboard" className="admin-link">⚙️ Admin</Link>
        )}
        {user && (user.role === 'employee' || user.role === 'admin') && (
          <Link to="/employee/dashboard" className="admin-link">👔 Pracownik</Link>
        )}

      </div>

      {/* Wyszukiwarka tylko na stronie głównej */}
      {isHomePage && (
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
      )}

      <div className="navbar-right">
        {!user && <Link to="/login" className="btn-ghost">Logowanie</Link>}
        {!user && <Link to="/register" className="btn">Rejestracja</Link>}
        {user && <button onClick={logout} className="btn-ghost">Wyloguj</button>}
      </div>
    </nav>
  );
}