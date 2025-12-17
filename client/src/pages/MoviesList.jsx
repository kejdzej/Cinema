import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../App.jsx';

export default function MoviesList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/movies');
      setMovies(res.data);
    } catch (error) {
      showToast('error', 'Błąd ładowania filmów');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Ładowanie filmów...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px', fontSize: '2.5em' }}>🎬 Wszystkie filmy</h1>

      {movies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Brak filmów w bazie danych</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="card"
              onClick={() => navigate(`/movie/${movie.id}`)}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                display: 'flex',
                gap: '20px',
                padding: '15px',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.2)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {/* Mały poster po lewej */}
              <div style={{
                width: '120px',
                minWidth: '120px',
                height: '160px',
                overflow: 'hidden',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)'
              }}>
                <img
                  src={movie.poster || '/posters/placeholder.jpg'}
                  alt={movie.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => { e.target.src = '/posters/placeholder.jpg'; }}
                />
              </div>

              {/* Informacje o filmie */}
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '10px', fontSize: '1.5em' }}>
                  {movie.title}
                  {movie.release_year && (
                    <span style={{ opacity: 0.6, fontSize: '0.75em', marginLeft: '10px' }}>
                      ({movie.release_year})
                    </span>
                  )}
                </h3>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', opacity: 0.8, marginBottom: '10px' }}>
                  {movie.duration && (
                    <span style={{ fontSize: '1em' }}>
                      ⏱️ {movie.duration} min
                    </span>
                  )}
                  {movie.genre && (
                    <span style={{ fontSize: '1em' }}>
                      🎭 {movie.genre}
                    </span>
                  )}
                </div>

                {/* Krótki opis */}
                {movie.description && (
                  <p style={{
                    opacity: 0.7,
                    fontSize: '0.95em',
                    lineHeight: '1.5',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {movie.description}
                  </p>
                )}
              </div>

              {/* Strzałka wskazująca że można kliknąć */}
              <div style={{ fontSize: '1.5em', opacity: 0.5 }}>
                →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
