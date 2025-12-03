import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../services/api.js'
import MovieCard from '../components/MovieCard.jsx'
import PopcornBar from '../components/PopcornBar.jsx'
import Cennik from '../components/Cennik.jsx'
import Aktualnosci from '../components/Aktualnosci.jsx'

import SliderHero from "../components/Slider.jsx";

const normalizeDate = (value) => {
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

export default function Home() {
  const [movies, setMovies] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedDate, setSelectedDate] = useState(() => normalizeDate(new Date()) || new Date())
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

  const calendarDates = useMemo(() => {
    const datesMap = new Map()

    const addDate = (value) => {
      const normalized = normalizeDate(value)
      if (!normalized) return
      datesMap.set(normalized.toDateString(), normalized)
    }

    // Domyślnie pokaż najbliższe 7 dni, żeby użytkownik mógł szybko zmieniać zakres
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      addDate(d)
    }

    // Dodaj wszystkie unikalne daty z seansami (również te poza tygodniem)
    sessions.forEach(session => {
      if (!session?.datetime) return
      addDate(session.datetime)
    })

    return Array.from(datesMap.values()).sort((a, b) => a - b)
  }, [sessions])

  useEffect(() => {
    if (!calendarDates.length || !selectedDate) return
    const hasSelected = calendarDates.some(
      (date) => date.toDateString() === selectedDate.toDateString()
    )

    if (!hasSelected) {
      const today = normalizeDate(new Date())
      const fallback =
        calendarDates.find((date) => today && date >= today) ||
        calendarDates[calendarDates.length - 1]
      if (fallback) {
        setSelectedDate(fallback)
      }
    }
  }, [calendarDates, selectedDate])

  const filteredSessions = sessions.filter(s => {
    // Sprawdź czy session i datetime istnieją
    if (!s || !s.datetime || !selectedDate) return false;
    
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
          {calendarDates.map((d, idx) => (
            <button
              key={idx}
              className={`day-btn ${selectedDate && d.toDateString() === selectedDate.toDateString() ? "active" : ""}`}
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
