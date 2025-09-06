import { useEffect, useState } from "react"
import { api } from "../services/api.js"
import { useToast } from "../App.jsx"

export default function Dashboard() {
  const [myTickets, setMyTickets] = useState([])
  const { showToast } = useToast()

  useEffect(() => {
    api.get("/tickets/mine")
      .then(res => setMyTickets(res.data))
      .catch(() => showToast("error", "Błąd ładowania biletów"))
  }, [])

  return (
    <div className="container">
      <h1>Moje bilety</h1>
      <div className="space"></div>

      {!myTickets.length && (
        <div className="muted">Brak biletów</div>
      )}

      <div className="grid">
        {myTickets.map(t => (
          <div key={t.id} className="card">
            <div><b>{t.title}</b></div>
            <div style={{ opacity: .8 }}>
              {new Date(t.datetime).toLocaleString("pl-PL")}
            </div>
            <div>Miejsca: {t.seats}</div>
            <div>Cena: {t.price} zł</div>
          </div>
        ))}
      </div>
    </div>
  )
}
