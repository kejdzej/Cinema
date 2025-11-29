import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast, useAuth } from '../App.jsx';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [orders, setOrders] = useState([]);
  const [qrInput, setQrInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
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

