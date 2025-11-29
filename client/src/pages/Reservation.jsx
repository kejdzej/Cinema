import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../services/api.js"
import PaymentForm from "../components/PaymentForm.jsx"
import { useToast } from "../App.jsx"

export default function Reservation() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [bookedSeats, setBookedSeats] = useState([]) // miejsca juz zajete
  const [clientSecret, setClientSecret] = useState(null)
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
    // Stwórz PaymentIntent po zakupie biletu
    const amountPln = response.data.amount
    const amountCents = Math.round(Number(amountPln) * 100)
    const pi = await api.post('/payments/create-payment-intent', {
      amount: amountCents,
      currency: 'pln',
      ticketId: response.data.ticket_id
    })
    setClientSecret(pi.data.clientSecret)
    showToast("success", "Bilet utworzony, przejdź do płatności");
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
      <p>{new Date(session.datetime).toLocaleString("pl-PL")}</p>
      {session.hall_name && (
        <p style={{marginTop: '8px', opacity: 0.8}}>
          🎭 Sala: <strong>{session.hall_name}</strong>
          {session.hall_capacity && ` (${session.hall_capacity} miejsc)`}
        </p>
      )}

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
      <p>Cena: {selectedSeats.length * session.price} zł</p>
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
      {clientSecret && (
        <div style={{marginTop: 16}}>
          <PaymentForm
            clientSecret={clientSecret}
            amountPln={selectedSeats.length * session.price}
            onSuccess={() => {
              showToast('success', 'Płatność zakończona!')
              navigate('/dashboard')
            }}
          />
        </div>
      )}
    </div>
  </div>
)
}
