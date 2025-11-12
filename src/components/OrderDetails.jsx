import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useToast } from "../App.jsx";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => showToast("error", "Błąd ładowania zamówienia"));
  }, [id]);

  if (!order) return <div className="container">Ładowanie...</div>;

  return (
    <div className="container">
      <h1>Szczegóły zamówienia</h1>
      <div className="card big">
        <h2>Zamówienie #{order.id}</h2>
        <p><b>Data zakupu:</b> {new Date(order.created_at).toLocaleString("pl-PL")}</p>
        <p><b>Status:</b> {order.status}</p>

        <h3>Produkty:</h3>
        <ul>
          {order.items.map((i, idx) => (
            <li key={idx}>
              {i.qty} × {i.name} = {i.price * i.qty} zł
            </li>
          ))}
        </ul>

        <h3>Razem: {order.total} zł</h3>

        <div>
          <b>Twój kod QR:</b><br />
          <img src={order.qr} alt="QR Code" />
        </div>
      </div>
      <Link to="/dashboard" className="btn">← Powrót</Link>
    </div>
  );
}
