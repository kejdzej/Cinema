import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useToast } from "../App.jsx";
import { useNavigate } from "react-router-dom";

export default function History() {
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/tickets/mine").catch(() => ({ data: [] })),
      api.get("/orders").catch(() => ({ data: [] }))
    ]).then(([ticketsRes, ordersRes]) => {
      // Wszystkie bilety (również przeszłe)
      setTickets(ticketsRes.data || []);
      
      // Wszystkie zamówienia (również collected)
      const fixed = (ordersRes.data || []).map(o => {
        try {
          return {
            ...o,
            items: typeof o.items === "string" ? JSON.parse(o.items) : o.items
          };
        } catch (error) {
          return { ...o, items: [] };
        }
      });
      setOrders(fixed);
      setLoading(false);
    }).catch(() => {
      showToast("error", "Błąd ładowania historii");
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="container">Ładowanie...</div>;
  }

  // Sortuj po dacie (najnowsze na górze)
  const sortedTickets = [...tickets].sort((a, b) => 
    new Date(b.datetime || b.created_at) - new Date(a.datetime || a.created_at)
  );
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>📜 Historia zamówień i biletów</h1>
        <button className="btn" onClick={() => navigate('/dashboard')}>
          ← Powrót do moich zamówień
        </button>
      </div>

      {/* Bilety */}
      <section style={{ marginBottom: '40px' }}>
        <h2>🎟 Wszystkie bilety ({sortedTickets.length})</h2>
        {sortedTickets.length === 0 ? (
          <div className="muted">Brak biletów w historii</div>
        ) : (
          <div className="grid">
            {sortedTickets.map(t => {
              const sessionDate = new Date(t.datetime);
              const now = new Date();
              const isPast = sessionDate < now;
              
              return (
                <div
                  key={t.id}
                  className="card"
                  style={{ 
                    opacity: isPast ? 0.7 : 1,
                    border: isPast ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.3)'
                  }}
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
                    <div>Cena: {t.price} zł</div>
                    {isPast && (
                      <div style={{ 
                        marginTop: '10px', 
                        fontSize: '0.9em', 
                        color: 'var(--primary)',
                        fontWeight: 'bold'
                      }}>
                        ✓ Seans już się odbył
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Zamówienia */}
      <section>
        <h2>🍿 Wszystkie zamówienia ({sortedOrders.length})</h2>
        {sortedOrders.length === 0 ? (
          <div className="muted">Brak zamówień w historii</div>
        ) : (
          <div className="grid">
            {sortedOrders.map(order => (
              <div
                key={order.id}
                className="card clickable"
                onClick={() => navigate(`/order/${order.id}`)}
                style={{ 
                  cursor: "pointer",
                  opacity: order.status === 'collected' ? 0.7 : 1,
                  border: order.status === 'collected' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.3)'
                }}
              >
                <div><b>Zamówienie #{order.id}</b></div>
                <div style={{ opacity: .8 }}>
                  {new Date(order.created_at).toLocaleString("pl-PL")}
                </div>
                <div>Razem: {order.total} zł</div>
                <div style={{ fontSize: "0.9em", opacity: 0.8, marginTop: '5px' }}>
                  Status: <strong style={{ 
                    color: order.status === 'collected' ? 'var(--primary)' : 
                           order.status === 'ready' ? '#4ade80' : 
                           order.status === 'pending' ? '#fbbf24' : '#fff'
                  }}>
                    {order.status === 'collected' ? 'Odebrane' :
                     order.status === 'ready' ? 'Gotowe' :
                     order.status === 'pending' ? 'Oczekujące' : order.status}
                  </strong>
                </div>
                <div style={{ fontSize: "0.9em", opacity: 0.8, marginTop: '5px' }}>
                  {order.items.map(i => `${i.qty} × ${i.name}`).join(", ")}
                </div>
                {order.status === 'collected' && (
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '0.9em', 
                    color: 'var(--primary)',
                    fontWeight: 'bold'
                  }}>
                    ✓ Zamówienie odebrane
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
