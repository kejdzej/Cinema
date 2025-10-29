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

      <div className="card big" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "40px",
        flexWrap: "wrap"
      }}>
        {/* Левая колонка */}
        <div style={{ flex: "1 1 300px" }}>
          <h2>Zamówienie #{order.id}</h2>
          <p><b>Data:</b> {new Date(order.created_at).toLocaleString("pl-PL")}</p>
          <p><b>Status:</b> {order.status}</p>
          <h3>🛍 Produkty:</h3>
          <ul>
            {order.items.map((i, idx) => (
              <li key={idx}>{i.qty} × {i.name} — {i.price * i.qty} zł</li>
            ))}
          </ul>
          <hr />
          <p><b>Razem:</b> {order.total} zł</p>
        </div>

        {/* Правая колонка — QR */}
        <div style={{
          flex: "0 0 200px",
          textAlign: "center"
        }}>
          <b>Twój kod QR:</b><br />
          <img src={order.qr} alt="QR Code" style={{ width: "200px", marginTop: "10px" }} />
        </div>
      </div>

      <Link to="/" className="btn" style={{ marginTop: "20px" }}>← Powrót do strony głównej</Link>
    </div>
  );
}
