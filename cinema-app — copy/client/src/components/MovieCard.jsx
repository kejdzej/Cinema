import SessionButton from "./SessionButton.jsx"

const posters = {
  "Openheimer": "/posters/oppenheimer.jpeg",
  "Barbie": "/posters/barbie.webp",
  "Lilo&Stitch": "/posters/lilo-stitch.jpg",
  "Minecraft movie": "/posters/minecraft.jpg",
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
