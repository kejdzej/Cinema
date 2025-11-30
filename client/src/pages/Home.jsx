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
    // Sprawdź czy session i datetime istnieją
    if (!s || !s.datetime) return false;
    
    try {
      const sessionDate = new Date(s.datetime);
      // Sprawdź czy data jest poprawna
      if (isNaN(sessionDate.getTime())) return false;
      
      return sessionDate.toDateString() === selectedDate.toDateString();
    } catch (error) {
      console.error('Error filtering session:', error, s);
      return false;
    }
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

        {filteredSessions.length === 0 ? (
          <div className="card" style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '2px dashed rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '4em', marginBottom: '20px' }}>📅</div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Brak seansów na wybrany dzień</h3>
            <p style={{ opacity: 0.8, marginTop: '10px', fontSize: '1.1em' }}>
              Wybierz inny dzień z paska powyżej lub sprawdź repertuar później.
            </p>
            <p style={{ opacity: 0.6, marginTop: '10px', fontSize: '0.9em' }}>
              Możesz również sprawdzić seanse na inne dni tygodnia.
            </p>
          </div>
        ) : (
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
        )}
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
