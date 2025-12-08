import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useToast } from "../App.jsx";
import { useNavigate } from "react-router-dom";
import StatsCard from "../components/StatsCard.jsx";

export default function Dashboard() {
  const [myTickets, setMyTickets] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  // Деструктуризация showToast из объекта, предоставленного хуком useToast
  const { showToast } = useToast(); 
  const navigate = useNavigate();

  useEffect(() => {
    // 🎟 Загружаем билеты
    api.get("/tickets/mine")
      .then(res => setMyTickets(res.data))
      .catch(() => showToast("error", "Błąd ładowania biletów"));

    // 🍿 Загружаем продукты (tylko te które nie są collected)
    api.get("/orders")
      .then(res => {
        // если items в БД строка → парсим (z obsługą błędów)
        const fixed = res.data.map(o => {
          try {
            return {
              ...o,
              items: typeof o.items === "string" ? JSON.parse(o.items) : o.items
            };
          } catch (error) {
            console.error('Error parsing order items:', error, o);
            // Jeśli błąd parsowania, użyj pustej tablicy
            return {
              ...o,
              items: []
            };
          }
        });
        // Filtruj tylko zamówienia które nie są collected
        const notCollected = fixed.filter(o => o.status !== 'collected');
        setMyOrders(notCollected);
      })
      .catch(() => showToast("error", "Błąd ładowania zamówień"));
  }, []); // Usunięto showToast z dependencies (funkcja z kontekstu)

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>🧾 Moje zamówienia</h1>
        <button 
          className="btn" 
          onClick={() => navigate('/history')}
          style={{ fontSize: '0.9em' }}
        >
          📜 Historia zamówień i biletów
        </button>
      </div>
      
      <StatsCard />

      {/* 🎟 СЕКЦИЯ БИЛЕТОВ */}
      <h2>🎟 Kupione bilety</h2>
      {!myTickets.length && <div className="muted">Brak biletów</div>}
      <div className="grid">
        {myTickets.map(t => {
          const sessionDate = new Date(t.datetime);
          const now = new Date();
          const hoursUntilSession = (sessionDate - now) / (1000 * 60 * 60);
          const canCancel = hoursUntilSession >= 1;

          return (
            <div
              key={t.id}
              className="card"
              style={{ position: "relative" }}
            >
              <div 
                onClick={() => navigate(`/ticket/${t.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div><b>{t.title}</b></div>
                <div style={{ opacity: .8 }}>
                  {new Date(t.datetime).toLocaleString("pl-PL")}
                </div>
                <div>Miejsca: {t.seats}</div>
                <div>
                  Cena: {t.is_free ? <span style={{ color: 'var(--primary)' }}>Gratis</span> : `${t.price} zł`}
                </div>
              </div>
              {canCancel && (
                <button
                  className="btn-danger"
                  style={{ marginTop: "10px", width: "100%" }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm("Czy na pewno chcesz anulować ten bilet? Punkty lojalnościowe zostaną zwrócone.")) {
                      return;
                    }
                    try {
                      await api.delete(`/tickets/${t.id}`);
                      showToast("success", "Bilet anulowany");
                      // Przeładuj bilety
                      const res = await api.get("/tickets/mine");
                      setMyTickets(res.data);
                    } catch (error) {
                      showToast("error", error?.response?.data?.message || "Błąd anulowania biletu");
                    }
                  }}
                >
                  ❌ Anuluj bilet
                </button>
              )}
              {!canCancel && (
                <div style={{ marginTop: "10px", fontSize: "0.9em", opacity: 0.7 }}>
                  Nie można anulować (seans za mniej niż 1 godzinę)
                </div>
              )}
            </div>
          );
        })}
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