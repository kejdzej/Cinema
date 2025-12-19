import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useToast } from "../App.jsx";
import { useState, useEffect } from "react";
import { api } from "../services/api.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  // Warunki dla różnych stron
  const isHomePage = location.pathname === '/';
  const isAdminPanel = location.pathname.startsWith('/admin');
  const isEmployeePanel = location.pathname.startsWith('/employee');
  const showSearchbar = !isAdminPanel && !isEmployeePanel && !location.pathname.startsWith('/reservation') && !location.pathname.startsWith('/ticket');

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

  const handleSelect = (movie) => {
    setQuery("");
    setShowResults(false);
    navigate(`/movie/${movie.id}`);
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

        {/* Zawsze pokazuj link do strony głównej */}
        {isHomePage ? (
          <span onClick={() => scrollToSection('repertuar')} style={{cursor: 'pointer'}}>Repertuar</span>
        ) : (
          <Link to="/">Strona główna</Link>
        )}

        <Link to="/movies">Filmy</Link>

        {/* Linki dla zalogowanych użytkowników - zawsze widoczne */}
        {user && (
          <>
            <Link to="/dashboard">Moje zamówienia</Link>
            <Link to="/rewards">Punkty i Nagrody</Link>
            <Link to="/recommendations">Rekomendacje</Link>
          </>
        )}

        {/* Linki dla admina i pracownika - zawsze widoczne */}
        {user && user.role === 'admin' && (
          <Link to="/admin/dashboard" className="admin-link">⚙️ Admin</Link>
        )}
        {user && (user.role === 'employee' || user.role === 'admin') && (
          <Link to="/employee/dashboard" className="admin-link">👔 Pracownik</Link>
        )}

      </div>

      {/* Wyszukiwarka (ukryta w admin panel i rezerwacji) */}
      {showSearchbar && (
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
