import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../App.jsx";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api.get("/orders").then(res => setOrders(res.data));
  }, [user]);

  return (
    <div className="p-4">
      <h1>🧾 Moje zamówienia</h1>
      {orders.length === 0 && <p>Brak zamówień</p>}

      {orders.map(order => {
        const isFreeOrder = order.status === 'free' || Number(order.total) === 0;
        return (
        <div key={order.id} className="card my-4">
          <h3>Zamówienie #{order.id}</h3>
          <p>Data: {new Date(order.created_at).toLocaleString()}</p>
          <ul>
            {order.items.map((i, idx) => (
              <li key={i.id || idx}>
                {(i.qty || 1)} × {i.name} = {i.price ? (i.price * (i.qty || 1)).toFixed(2) + " zł" : "Gratis"}
              </li>
            ))}
          </ul>
          <h4>Razem: {isFreeOrder ? <span style={{ color: 'var(--primary)' }}>Gratis (punkty)</span> : `${order.total} zł`}</h4>
          <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
            Status: {isFreeOrder ? 'Nagroda' : order.status}
          </p>
        </div>
      )})}
    </div>
  );
}