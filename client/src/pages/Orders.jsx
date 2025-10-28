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

      {orders.map(order => (
        <div key={order.id} className="card my-4">
          <h3>Zamówienie #{order.id}</h3>
          <p>Data: {new Date(order.created_at).toLocaleString()}</p>
          <ul>
            {order.items.map(i => (
              <li key={i.id}>
                {i.qty} × {i.name} = {(i.price * i.qty).toFixed(2)} zł
              </li>
            ))}
          </ul>
          <h4>Razem: {order.total} zł</h4>
        </div>
      ))}
    </div>
  );
}
