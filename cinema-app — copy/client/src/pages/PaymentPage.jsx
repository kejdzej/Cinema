import { useParams, useSearchParams } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../App';
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function PaymentPage() {
  const { seats } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [ticketId, setTicketId] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const selectedSeats = seats.split(',');
  const ticketPrice = 25; // Cena za bilet
  const totalAmount = selectedSeats.length * ticketPrice;
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Sprawdź ticketId
        const ticketIdFromUrl = searchParams.get('ticketId');
        if (!ticketIdFromUrl) {
          showToast('error', 'Brak ID biletu');
          navigate('/dashboard');
          return;
        }
        
        setTicketId(parseInt(ticketIdFromUrl));
        
        // Pobierz szczegóły biletu
        const ticketResponse = await api.get(`/tickets/${ticketIdFromUrl}`);
        const ticket = ticketResponse.data;
        
        // Pobierz szczegóły seansu
        const sessionResponse = await api.get(`/sessions/${ticket.session_id}`);
        setSession(sessionResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading payment data:', error);
        showToast('error', 'Błąd ładowania danych płatności');
        navigate('/dashboard');
      }
    };
    
    loadData();
  }, [searchParams, navigate, showToast]);
  
  const handlePaymentSuccess = () => {
    showToast('success', 'Płatność zakończona! Sprawdź swoje bilety.');
    navigate('/dashboard');
  };
  
  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Ładowanie danych płatności...</h2>
          <p>Proszę czekać</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <h1>💳 Płatność za bilety</h1>
      <div className="space"></div>
      
      {/* Szczegóły filmu */}
      {session && (
        <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
          <h3>🎬 Szczegóły seansu</h3>
          <div style={{ display: 'flex', gap: '20px', marginTop: '15px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#e6e8ef' }}>{session.title}</h4>
              <p style={{ margin: '0', color: '#9ca3af' }}>
                📅 {new Date(session.datetime).toLocaleDateString('pl-PL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p style={{ margin: '0', color: '#9ca3af' }}>
                🕒 {new Date(session.datetime).toLocaleTimeString('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#e6e8ef' }}>
                {session.price} zł / bilet
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Graficzna reprezentacja miejsc */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>🎭 Wybrane miejsca</h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          marginTop: '15px',
          justifyContent: 'center'
        }}>
          {selectedSeats.map((seat, index) => (
            <div key={index} style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(250, 204, 21, 0.3)'
            }}>
              {seat}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '15px', color: 'var(--muted)' }}>
          🪑 Wybrane miejsca: {selectedSeats.join(', ')}
        </div>
      </div>
      
      {/* Podsumowanie płatności */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, var(--primary), #fbbf24)', 
        color: '#111',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>📋 Podsumowanie zamówienia</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <p><strong>🎬 Film:</strong></p>
            <p>{session?.title || 'Ładowanie...'}</p>
          </div>
          <div>
            <p><strong>📅 Data:</strong></p>
            <p>{session ? new Date(session.datetime).toLocaleDateString('pl-PL') : 'Ładowanie...'}</p>
          </div>
          <div>
            <p><strong>🕒 Godzina:</strong></p>
            <p>{session ? new Date(session.datetime).toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Ładowanie...'}</p>
          </div>
          <div>
            <p><strong>🎫 Liczba biletów:</strong></p>
            <p>{selectedSeats.length} szt.</p>
          </div>
          <div>
            <p><strong>💰 Cena za bilet:</strong></p>
            <p>{ticketPrice} zł</p>
          </div>
          <div>
            <p><strong>🪑 Miejsca:</strong></p>
            <p>{selectedSeats.join(', ')}</p>
          </div>
        </div>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          textAlign: 'center',
          padding: '15px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}>
          💰 Łączna kwota: {totalAmount} zł
        </div>
      </div>
      
      {/* Formularz płatności */}
      <div className="card">
        <h3>💳 Dane płatności</h3>
        <div className="space"></div>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4>🧪 Karta testowa Stripe:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div><strong>Numer:</strong> 4242 4242 4242 4242</div>
            <div><strong>Data:</strong> 12/25</div>
            <div><strong>CVC:</strong> 123</div>
            <div><strong>Kod:</strong> 00-001</div>
          </div>
        </div>
        
        <PaymentForm 
          ticketId={ticketId}
          amount={totalAmount} 
          onSuccess={handlePaymentSuccess} 
        />
      </div>
    </div>
  );
}
