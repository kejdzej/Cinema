import SessionButton from "./SessionButton.jsx"

const posters = {
  "Interstellar": "/posters/interstellar.jpeg",
  "The Matrix": "/posters/matrix.jpg",    
  "Gladiator": "/posters/gladiator.jpg",   
}

export default function MovieCard({ movie }) {
  const poster = posters[movie.title] || "/posters/placeholder.jpg"

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
