import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useToast } from "../App.jsx";

export default function TicketDetails() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    api.get(`/tickets/${id}`)
      .then(res => setTicket(res.data))
      .catch(() => showToast("error", "Błąd ładowania biletu"));
  }, [id]);

  if (!ticket) return <div className="container">Ładowanie...</div>;

  return (
    <div className="container">
      <h1>Szczegóły biletu</h1>

      <div className="card big" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "40px",
        flexWrap: "wrap"
      }}>
        {/* Левая часть — описание */}
        <div style={{ flex: "1 1 300px" }}>
          <h2>{ticket.title}</h2>
          {ticket.format === '3D' && (
            <p style={{ marginTop: '10px' }}>
              <span style={{
                padding: '4px 12px',
                background: 'var(--primary)',
                color: '#000',
                borderRadius: '6px',
                fontSize: '0.9em',
                fontWeight: 'bold'
              }}>
                3D
              </span>
            </p>
          )}
          <p><b>Data seansu:</b> {new Date(ticket.datetime).toLocaleString("pl-PL")}</p>
          <p><b>Data zakupu:</b> {new Date(ticket.created_at).toLocaleString("pl-PL")}</p>
          <p><b>Miejsca:</b> {ticket.seats}</p>
          <p>
            <b>Cena:</b>{" "}
            {ticket.is_free ? (
              <span style={{ color: 'var(--primary)' }}>Gratis (bilet lojalnościowy)</span>
            ) : (
              `${ticket.price} zł`
            )}
          </p>
        </div>

        {/* Правая часть — QR код */}
        <div style={{
          flex: "0 0 200px",
          textAlign: "center"
        }}>
          <b>Twój kod QR:</b><br />
          <img src={ticket.qr} alt="QR Code" style={{ width: "200px", marginTop: "10px" }} />
        </div>
      </div>
      <button
  onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/pdf/ticket/${ticket.id}`, "_blank")}

  className="btn btn-primary"
>
  📄 Pobierz bilet w PDF
</button>


      <Link to="/" className="btn" style={{ marginTop: "20px" }}>← Powrót do strony głównej</Link>
    </div>
  );
}