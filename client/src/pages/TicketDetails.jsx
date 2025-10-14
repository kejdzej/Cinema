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
      <div className="card big">
        <h2>{ticket.title}</h2>
        <p><b>Data seansu:</b> {new Date(ticket.datetime).toLocaleString("pl-PL")}</p>
        <p><b>Data zakupu:</b> {new Date(ticket.created_at).toLocaleString("pl-PL")}</p>
        <p><b>Miejsca:</b> {ticket.seats}</p>
        <p><b>Cena:</b> {ticket.price} zł</p>
        <div>
          <b>Twój kod QR:</b><br />
          <img src={ticket.qr} alt="QR Code" />
        </div>
      </div>
      <Link to="/dashboard" className="btn">← Powrót</Link>
    </div>
  );
}
