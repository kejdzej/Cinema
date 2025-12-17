import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../App.jsx';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadMovie();
  }, [id]);

  const loadMovie = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/movies/${id}`);
      setMovie(res.data);
    } catch (error) {
      showToast('error', 'Błąd ładowania filmu');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Ładowanie...</div>;
  }

  if (!movie) {
    return (
      <div className="container">
        <h1>Film nie znaleziony</h1>
        <button className="btn" onClick={() => navigate('/')}>
          ← Powrót do strony głównej
        </button>
      </div>
    );
  }

  // Extract YouTube video ID from URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;

    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }

    // If already an embed URL
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    return null;
  };

  const trailerEmbedUrl = getYouTubeEmbedUrl(movie.trailer_url);

  return (
    <div className="container">
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        ← Powrót
      </button>

      <div className="movie-details">
        {/* Tytuł filmu */}
        <h1 style={{ fontSize: '2.5em', marginBottom: '20px' }}>
          {movie.title}
          {movie.release_year && <span style={{ opacity: 0.6, fontSize: '0.7em', marginLeft: '15px' }}>({movie.release_year})</span>}
        </h1>

        {/* Trailer na górze */}
        {trailerEmbedUrl && (
          <div className="movie-trailer" style={{ marginBottom: '40px' }}>
            <div className="video-container" style={{
              position: 'relative',
              paddingBottom: '56.25%', // 16:9 aspect ratio
              height: 0,
              overflow: 'hidden',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
            }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '12px'
                }}
                src={trailerEmbedUrl}
                title={`${movie.title} - zwiastun`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Informacje o filmie pod trailerem */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {/* Mały poster po lewej */}
          <div style={{ width: '200px', minWidth: '200px' }}>
            <img
              src={movie.omdb?.poster || movie.poster || '/posters/placeholder.jpg'}
              alt={movie.title}
              style={{
                width: '100%',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
              }}
              onError={(e) => { e.target.src = '/posters/placeholder.jpg'; }}
            />
          </div>

          {/* Informacje tekstowe */}
          <div style={{ flex: 1 }}>
            {/* IMDb Rating */}
            {movie.omdb?.imdbRating && movie.omdb.imdbRating !== 'N/A' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <div className="rating-badge">
                  <span style={{ color: 'var(--primary)', fontSize: '2em', fontWeight: 'bold' }}>
                    ⭐ {movie.omdb.imdbRating}
                  </span>
                  <span style={{ opacity: 0.7, fontSize: '0.9em', marginLeft: '8px' }}>IMDb</span>
                </div>
                {movie.omdb.imdbVotes && (
                  <span style={{ opacity: 0.6, fontSize: '0.9em' }}>
                    ({movie.omdb.imdbVotes} głosów)
                  </span>
                )}
              </div>
            )}

            {/* Meta info */}
            <div className="movie-meta" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {movie.duration && (
                <span>⏱️ {movie.duration} min</span>
              )}
              {(movie.genre || movie.omdb?.genre) && (
                <span>🎭 {movie.genre || movie.omdb.genre}</span>
              )}
              {movie.omdb?.rated && movie.omdb.rated !== 'N/A' && (
                <span>📋 {movie.omdb.rated}</span>
              )}
            </div>

            {/* Description */}
            <div className="movie-description" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>Opis</h3>
              <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                {movie.omdb?.plot && movie.omdb.plot !== 'N/A' ? movie.omdb.plot : movie.description || 'Brak opisu'}
              </p>
            </div>

            {/* Credits */}
            <div className="movie-credits">
              {(movie.director || movie.omdb?.director) && movie.omdb?.director !== 'N/A' && (
                <p><strong>Reżyseria:</strong> {movie.director || movie.omdb.director}</p>
              )}
              {(movie.cast || movie.omdb?.actors) && movie.omdb?.actors !== 'N/A' && (
                <p><strong>Obsada:</strong> {movie.cast || movie.omdb.actors}</p>
              )}
              {movie.omdb?.awards && movie.omdb.awards !== 'N/A' && (
                <p><strong>Nagrody:</strong> {movie.omdb.awards}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="movie-sessions" style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>📅 Dostępne seanse</h2>

          {movie.hasSessions ? (
            <div className="grid">
              {movie.sessions.map((session) => (
                <div key={session.id} className="card session-card">
                  <p style={{ fontSize: '1.2em', marginBottom: '8px' }}>
                    📅 {new Date(session.datetime).toLocaleString('pl-PL')}
                  </p>
                  <p style={{ opacity: 0.8, marginBottom: '8px' }}>
                    🎭 {session.hall_name || 'Sala'}
                    {session.format && session.format === '3D' && (
                      <span style={{
                        marginLeft: '10px',
                        padding: '4px 8px',
                        background: 'var(--primary)',
                        color: '#000',
                        borderRadius: '4px',
                        fontSize: '0.8em',
                        fontWeight: 'bold'
                      }}>
                        3D
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: '1.3em', color: 'var(--primary)', marginBottom: '15px' }}>
                    <strong>{parseFloat(session.price).toFixed(2)} zł</strong>
                  </p>
                  <button
                    className="btn"
                    onClick={() => navigate(`/reservation/${session.id}`)}
                    style={{ width: '100%' }}
                  >
                    Zarezerwuj bilet
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{
              textAlign: 'center',
              padding: '40px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px dashed rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '3em', marginBottom: '15px' }}>😔</div>
              <h3 style={{ marginBottom: '10px' }}>Brak dostępnych seansów</h3>
              <p style={{ opacity: 0.7 }}>
                Aktualnie nie ma zaplanowanych seansów tego filmu. Sprawdź ponownie wkrótce!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
