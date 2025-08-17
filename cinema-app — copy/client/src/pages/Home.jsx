import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import MovieCard from '../components/MovieCard.jsx'

// słownik filmów
const movies = {
  1: { title: "Openheimer" },
  2: { title: "Barbie" },
  3: { title: "Lilo&Stitch" },
  4: { title: "Minecraft" },
}

export default function Home() {
  const [moviesData, setMoviesData] = useState([])

  useEffect(() => {
    api.get('/sessions')
      .then(res => {
        const sessions = res.data

        // gupowanie movie_id
        const grouped = {}
        sessions.forEach(s => {
          if (!grouped[s.movie_id]) {
            grouped[s.movie_id] = {
              title: movies[s.movie_id]?.title || "Nieznany film",
              times: [],
            }
          }
          grouped[s.movie_id].times.push({
            id: s.id,
            datetime: s.datetime,
            price: s.price,
          })
        })

        setMoviesData(Object.values(grouped))
      })
      .catch(() => {})
  }, [])

  return (
    <div className="container">
      <h1>Repertuar</h1>
      <div className="grid">
        {moviesData.map(m => (
          <MovieCard key={m.title} movie={m} />
        ))}
      </div>
    </div>
  )
}
