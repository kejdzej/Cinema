import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useToast } from "../App.jsx";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [myTickets, setMyTickets] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 🎟 Загружаем билеты
    api.get("/tickets/mine")
      .then(res => setMyTickets(res.data))
      .catch(() => showToast("error", "Błąd ładowania biletów"));

    // 🍿 Загружаем продукты
    api.get("/orders")
      .then(res => {
        // если items в БД строка → парсим
        const fixed = res.data.map(o => ({
          ...o,
          items: typeof o.items === "string" ? JSON.parse(o.items) : o.items
        }));
        setMyOrders(fixed);
      })
      .catch(() => showToast("error", "Błąd ładowania zamówień"));
  }, []);

  return (
    <div className="container">
      <h1>🧾 Moje zamówienia</h1>

      {/* 🎟 СЕКЦИЯ БИЛЕТОВ */}
      <h2>🎟 Kupione bilety</h2>
      {!myTickets.length && <div className="muted">Brak biletów</div>}
      <div className="grid">
        {myTickets.map(t => (
          <div
            key={t.id}
            className="card clickable"
            onClick={() => navigate(`/ticket/${t.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div><b>{t.title}</b></div>
            <div style={{ opacity: .8 }}>
              {new Date(t.datetime).toLocaleString("pl-PL")}
            </div>
            <div>Miejsca: {t.seats}</div>
            <div>Cena: {t.price} zł</div>
          </div>
        ))}
      </div>

      <hr style={{ margin: "30px 0" }} />

      {/* 🍿 СЕКЦИЯ ПРОДУКТОВ */}
      <h2>🍿 Kupione produkty</h2>
      {!myOrders.length && <div className="muted">Brak produktów</div>}
      <div className="grid">
        {myOrders.map(order => (
          <div
            key={order.id}
            className="card clickable"
            onClick={() => navigate(`/order/${order.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div><b>Zamówienie #{order.id}</b></div>
            <div style={{ opacity: .8 }}>
              {new Date(order.created_at).toLocaleString("pl-PL")}
            </div>
            <div>Razem: {order.total} zł</div>
            <div style={{ fontSize: "0.9em", opacity: 0.8 }}>
              {order.items.map(i => `${i.qty} × ${i.name}`).join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
