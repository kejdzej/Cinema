import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import MovieCard from '../components/MovieCard.jsx'

// słownik filmów
const movies = {
  1: { title: "Interstellar" },
  2: { title: "The Matrix" },
  3: { title: "Gladiator" },
}

export default function Home() {
  const [moviesData, setMoviesData] = useState([])

  useEffect(() => {
    api.get('/sessions')
      .then(res => {
        const sessions = res.data

        // grupowanie movie_id
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
