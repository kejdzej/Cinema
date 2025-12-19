import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast, useAuth } from '../App.jsx';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [orders, setOrders] = useState([]);
  const [qrInput, setQrInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [orderQrInput, setOrderQrInput] = useState('');
  const [orderVerificationResult, setOrderVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user && (user.role === 'employee' || user.role === 'admin')) {
      if (activeTab === 'orders') {
        loadOrders();
      }
    }
  }, [activeTab, user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employee/orders');
      setOrders(res.data);
    } catch (error) {
      showToast('error', 'Błąd ładowania zamówień');
    } finally {
      setLoading(false);
    }
  };

  const verifyTicket = async () => {
    if (!qrInput.trim()) {
      showToast('error', 'Wprowadź kod QR');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/employee/tickets/verify', { qrData: qrInput });
      setVerificationResult(res.data);
      showToast('success', 'Bilet zweryfikowany pomyślnie');
      setQrInput('');
    } catch (error) {
      setVerificationResult(null);
      showToast('error', error?.response?.data?.message || 'Błąd weryfikacji');
    } finally {
      setLoading(false);
    }
  };

  const verifyOrder = async () => {
    if (!orderQrInput.trim()) {
      showToast('error', 'Wprowadź kod QR zamówienia');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/employee/orders/verify', { qrData: orderQrInput });
      setOrderVerificationResult(res.data);
      showToast('success', 'Zamówienie odczytane');
      setOrderQrInput('');
    } catch (error) {
      setOrderVerificationResult(null);
      showToast('error', error?.response?.data?.message || 'Błąd weryfikacji zamówienia');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/employee/orders/${orderId}/status`, { status: newStatus });
      showToast('success', 'Status zaktualizowany');
      loadOrders();
    } catch (error) {
      showToast('error', 'Błąd aktualizacji statusu');
    }
  };

  if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
    return (
      <div className="container">
        <h1>🚫 Brak dostępu</h1>
        <p>Masz dostęp tylko dla pracowników kina.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'ready': return '#2196f3';
      case 'collected': return '#4caf50';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Oczekuje';
      case 'ready': return 'Gotowe';
      case 'collected': return 'Odebrane';
      default: return status;
    }
  };

  return (
    <div className="container">
      <h1>👔 Panel Pracownika Kina</h1>

      <div className="admin-tabs">
        {['tickets', 'orders'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? '' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'tickets' && '🎫 Weryfikacja biletów'}
            {tab === 'orders' && '🍿 Zamówienia z baru'}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Ładowanie...</div>}

      {/* WERYFIKACJA BILETÓW */}
      {activeTab === 'tickets' && (
        <div className="admin-section">
          <h2>🎫 Weryfikacja biletów QR</h2>
          
          <div className="card" style={{ maxWidth: '600px', margin: '20px auto' }}>
            <div className="form-group">
              <label>Wprowadź kod QR z biletu:</label>
              <input
                type="text"
                className="input"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="TICKET:123|Film|A1,A2|2025-12-01 18:00:00"
                onKeyDown={(e) => e.key === 'Enter' && verifyTicket()}
              />
            </div>
            <button className="btn" onClick={verifyTicket} disabled={loading}>
              Zweryfikuj bilet
            </button>
          </div>

          {verificationResult && (
            <div className="card" style={{ maxWidth: '600px', margin: '20px auto', background: '#4caf50' }}>
              <h3>✅ Bilet zweryfikowany</h3>
              <p><b>Film:</b> {verificationResult.ticket.title}</p>
              <p><b>Data seansu:</b> {new Date(verificationResult.ticket.datetime).toLocaleString('pl-PL')}</p>
              <p><b>Sala:</b> {verificationResult.ticket.hall_name || 'Brak sali'}</p>
              <p><b>Miejsca:</b> {verificationResult.ticket.seats}</p>
              <p><b>Klient:</b> {verificationResult.ticket.user_name}</p>
            </div>
          )}
        </div>
      )}

      {/* ZAMÓWIENIA Z BARU */}
      {activeTab === 'orders' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>🍿 Zamówienia z baru</h2>
            <button className="btn" onClick={loadOrders}>
              🔄 Odśwież
            </button>
          </div>

          {/* WERYFIKACJA ZAMÓWIENIA (QR) */}
          <div className="card" style={{ maxWidth: '700px', margin: '20px auto' }}>
            <h3 style={{ marginTop: 0 }}>📦 Odczyt zamówienia z QR</h3>
            <div className="form-group">
              <label>Wklej/zeskanuj kod QR z zamówienia:</label>
              <input
                type="text"
                className="input"
                value={orderQrInput}
                onChange={(e) => setOrderQrInput(e.target.value)}
                placeholder="ORDER:123 (albo stary JSON z QR)"
                onKeyDown={(e) => e.key === 'Enter' && verifyOrder()}
              />
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                Wskazówka: w QR zamówienia jest JSON — aplikacja pokaże go jako „kartę” zamiast surowego tekstu.
              </div>
            </div>
            <button className="btn" onClick={verifyOrder} disabled={loading}>
              Odczytaj zamówienie
            </button>
          </div>

          {orderVerificationResult?.order && (
            <div className="card" style={{ maxWidth: '700px', margin: '20px auto', border: '1px solid rgba(255,255,255,0.25)' }}>
              <h3 style={{ marginTop: 0 }}>✅ Zamówienie #{orderVerificationResult.order.id}</h3>
              <p><b>Klient:</b> {orderVerificationResult.order.user_name} ({orderVerificationResult.order.user_email})</p>
              <p><b>Data:</b> {new Date(orderVerificationResult.order.created_at).toLocaleString('pl-PL')}</p>
              <p><b>Status:</b> {orderVerificationResult.order.status}</p>
              <div style={{ marginTop: 12 }}>
                <b>Produkty:</b>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
                  {(orderVerificationResult.order.items || []).map((item, idx) => (
                    <div key={idx} className="card" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {item.img ? (
                          <img
                            src={item.img}
                            alt={item.name || 'Produkt'}
                            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : null}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{item.name || 'Produkt'}</div>
                          <div style={{ opacity: 0.85, fontSize: '0.95em' }}>
                            {(item.qty || 1)} × {item.price ? `${item.price} zł` : 'Gratis'}
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold' }}>
                          {item.price ? `${(item.price * (item.qty || 1)).toFixed(2)} zł` : '0.00 zł'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <hr />
              <p><b>Razem:</b> {Number(orderVerificationResult.order.total) === 0 ? <span style={{ color: 'var(--primary)' }}>Gratis (punkty)</span> : `${orderVerificationResult.order.total} zł`}</p>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {orderVerificationResult.order.status === 'pending' && (
                  <button className="btn" onClick={() => updateOrderStatus(orderVerificationResult.order.id, 'ready')}>
                    ✓ Oznacz jako gotowe
                  </button>
                )}
                {orderVerificationResult.order.status === 'ready' && (
                  <button className="btn" onClick={() => updateOrderStatus(orderVerificationResult.order.id, 'collected')}>
                    ✓ Oznacz jako odebrane
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid">
            {orders.map(order => (
              <div key={order.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3>Zamówienie #{order.id}</h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    background: getStatusColor(order.status),
                    color: 'white',
                    fontSize: '0.9em'
                  }}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                
                <p><b>Klient:</b> {order.user_name}</p>
                <p><b>Email:</b> {order.user_email}</p>
                <p><b>Data:</b> {new Date(order.created_at).toLocaleString('pl-PL')}</p>
                
                <div style={{ margin: '10px 0' }}>
                  <b>Produkty:</b>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ marginLeft: '10px' }}>
                      {item.qty} × {item.name} - {item.price * item.qty} zł
                    </div>
                  ))}
                </div>
                
                <p><b>Razem:</b> {order.total} zł</p>

                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  {order.status === 'pending' && (
                    <button className="btn" onClick={() => updateOrderStatus(order.id, 'ready')}>
                      ✓ Oznacz jako gotowe
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button className="btn" onClick={() => updateOrderStatus(order.id, 'collected')}>
                      ✓ Oznacz jako odebrane
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && !loading && (
            <div className="muted" style={{ textAlign: 'center', marginTop: '40px' }}>
              Brak zamówień do obsługi
            </div>
          )}
        </div>
      )}
    </div>
  );
}

