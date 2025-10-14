import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../services/api.js"
import { useToast } from "../App.jsx"

export default function Reservation() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [bookedSeats, setBookedSeats] = useState([]) // miejsca juz zajete
  const { showToast } = useToast()
  const navigate = useNavigate();

  // ladowanie seansu i miejsc zajetych 
  useEffect(() => {
    Promise.all([
      api.get(`/sessions/${id}`),
      api.get(`/tickets/session/${id}`)
    ])
      .then(([sRes, tRes]) => {
        setSession(sRes.data)
        setBookedSeats(tRes.data.map(t => t.seats).join(",").split(",")) // seats  "A1,A2"
      })
      .catch(() => showToast("error", "Ошибка загрузки сеанса"))
      .finally(() => setLoading(false))
  }, [id])

  const toggleSeat = (seat) => {
    if (bookedSeats.includes(seat)) return // mie mozesz kupic wybrane miejsce
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat))
    } else {
      setSelectedSeats([...selectedSeats, seat])
    }
  }

 const purchase = async () => {
  try {
    const response = await api.post("/tickets/purchase", {
      session_id: session.id,
      seats: selectedSeats
    });

    console.log("purchase() RESPONSE", response.data);

    showToast("success", "Bilet kupiony!");
    navigate("/dashboard");   // 👈 отправляем сразу на список билетов
  } catch (e) {
    console.error("purchase() ERROR", e);
    showToast("error", e?.response?.data?.message || "Błąd zakupu");
  }
};


  if (loading) return <div className="container">Ładowanie...</div>
  if (!session) return <div className="container">Brak seansu</div>

  // зал — 5 рядов × 8 мест
  const rows = 5
  const cols = 8
  const seats = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seats.push(String.fromCharCode(65 + r) + (c + 1)) // A1, A2...
    }
  }

  return (
  <div className="container reservation">
    <div className="reservation-left">
      <h1>{session.title}</h1>
      <p>{new Date(session.datetime).toLocaleString("ru-RU")}</p>

      <div className="screen">ekran</div>

      <div className="seats-grid">
        {seats.map(seat => {
          const isBooked = bookedSeats.includes(seat)
          const isSelected = selectedSeats.includes(seat)
          return (
            <button
              key={seat}
              className={`seat 
                ${isBooked ? "booked" : ""} 
                ${isSelected ? "selected" : ""}`}
              onClick={() => toggleSeat(seat)}
              disabled={isBooked}
            >
              {seat}
            </button>
          )
        })}
      </div>
    </div>

    {/* корзина */}
    <div className="reservation-right">
      <h2>Mój wybór</h2>
      <p>Miejsca: {selectedSeats.join(", ") || "nie wybrałeś"}</p>
      <p>Cena: {selectedSeats.length * session.price} $</p>
      <button
  className="btn"
  disabled={!selectedSeats.length}
  onClick={() => {
    console.log("Button clicked");   // DEBUG
    purchase();
  }}
>
  Kupić
</button>
    </div>
  </div>
)
}
