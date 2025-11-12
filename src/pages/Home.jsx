import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../services/api.js'
import MovieCard from '../components/MovieCard.jsx'
import PopcornBar from '../components/PopcornBar.jsx'
import Cennik from '../components/Cennik.jsx'
import Aktualnosci from '../components/Aktualnosci.jsx'

import SliderHero from "../components/Slider.jsx";


export default function Home() {
  const [movies, setMovies] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const location = useLocation()
  const search = location.state?.search?.toLowerCase() || ""

  useEffect(() => {
    api.get('/movies')
      .then(res => setMovies(res.data))
      .catch(() => {})

    api.get('/sessions')
      .then(res => setSessions(res.data))
      .catch(() => {})
  }, [])

  const getWeekDates = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }

  const filteredSessions = sessions.filter(s => {
    const sessionDate = new Date(s.datetime)
    return sessionDate.toDateString() === selectedDate.toDateString()
  })

  const filteredMovies = search
    ? movies.filter(m => m.title.toLowerCase().includes(search))
    : movies

  return (
      <div className="container">
      <SliderHero />  {/* 👈 Слайдер здесь */}
      {/* --- Repertuar --- */}
      <section id="repertuar">
        <h1>🎬 Repertuar</h1>
        {search && <p>Wyniki wyszukiwania dla: <b>{search}</b></p>}

        <div className="week-strip">
          {getWeekDates().map((d, idx) => (
            <button
              key={idx}
              className={`day-btn ${d.toDateString() === selectedDate.toDateString() ? "active" : ""}`}
              onClick={() => setSelectedDate(d)}
            >
              {d.toLocaleDateString("pl-PL", { weekday:"short", day:"2-digit", month:"2-digit" })}
            </button>
          ))}
        </div>

        <div className="grid">
          {filteredMovies.map(m => {
            const movieSessions = filteredSessions.filter(s => s.movie_id === m.id)
            if (!movieSessions.length) return null
            return (
              <MovieCard
                key={m.id}
                movie={{...m, times: movieSessions}}
              />
            )
          })}
        </div>
      </section>

      {/* --- Popcorn Bar --- */}
  <section id="popcorn">
    <h1>🍿 Popcorn Bar</h1>
    <PopcornBar />
  </section>

  {/* --- Cennik --- */}
  <section id="cennik">
    <h1>💳 Cennik</h1>
    <Cennik />
  </section>

  {/* --- Aktualności --- */}
  <section id="aktualnosci">
    <h1>📰 Aktualności</h1>
    <Aktualnosci />
  </section>
    </div>
  )
}
