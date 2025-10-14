import SessionButton from "./SessionButton.jsx";

export default function MovieCard({ movie }) {
  const poster = movie.poster || "/posters/placeholder.jpg";

  return (
    <div className="card movie-card">
      <img src={poster} alt={movie.title} className="poster" />
      <div className="movie-info">
        <h2>{movie.title}</h2>
        <div className="sessions">
          {movie.times.map(t => (
            <SessionButton key={t.id} session={t} />
          ))}
        </div>
      </div>
    </div>
  )
}
