import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useToast, useAuth } from '../App.jsx';
import { useNavigate } from 'react-router-dom';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations');
      setRecommendations(res.data);
    } catch (error) {
      showToast('error', 'Błąd ładowania rekomendacji');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <h1>🔒 Wymagane logowanie</h1>
        <p>Zaloguj się aby zobaczyć rekomendacje.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="container">Ładowanie rekomendacji...</div>;
  }

  if (!recommendations) {
    return <div className="container">Brak rekomendacji</div>;
  }

  return (
    <div className="container">
      <h1>🎬 Rekomendacje dla Ciebie</h1>
      
      <div className="card" style={{ marginBottom: '20px', background: 'rgba(255, 215, 0, 0.1)' }}>
        <p><b>{recommendations.message}</b></p>
        {recommendations.type === 'recommended' && recommendations.watched > 0 && (
          <p style={{ opacity: 0.8, fontSize: '0.9em' }}>
            Oglądałeś już {recommendations.watched} {recommendations.watched === 1 ? 'film' : 'filmów'}
          </p>
        )}
      </div>

      {recommendations.movies && recommendations.movies.length > 0 ? (
        <div className="grid">
          {recommendations.movies.map((movie, idx) => (
            <div key={idx} className="card movie-card">
              <h3>{movie.title}</h3>
              {movie.description && <p>{movie.description.substring(0, 150)}...</p>}
              {movie.datetime && (
                <p style={{ opacity: 0.8 }}>
                  📅 {new Date(movie.datetime).toLocaleString('pl-PL')}
                </p>
              )}
              {movie.hall_name && (
                <p style={{ opacity: 0.8 }}>
                  🎭 Sala: {movie.hall_name}
                </p>
              )}
              {movie.price && (
                <p><b>💰 {parseFloat(movie.price).toFixed(2)} zł</b></p>
              )}
              {movie.duration && (
                <p>⏱️ {movie.duration} min</p>
              )}
              {movie.session_id && (
                <button 
                  className="btn" 
                  onClick={() => navigate(`/reservation/${movie.session_id}`)}
                  style={{ marginTop: '10px' }}
                >
                  Zarezerwuj bilet
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="muted">Brak dostępnych rekomendacji</div>
      )}

      <button className="btn btn-ghost" onClick={loadRecommendations} style={{ marginTop: '20px' }}>
        🔄 Odśwież rekomendacje
      </button>
    </div>
  );
}

