import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { api } from "../services/api.js"
import PaymentForm from "../components/PaymentForm.jsx"
import { useToast } from "../App.jsx"

export default function Reservation() {
  const { id } = useParams()
  const location = useLocation();
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [bookedSeats, setBookedSeats] = useState([]) // miejsca juz zajete
  const [clientSecret, setClientSecret] = useState(null)
  const { showToast } = useToast()
  const navigate = useNavigate();
  const rewardParam = new URLSearchParams(location.search).get('reward');
  const storedReward = typeof window !== "undefined" ? sessionStorage.getItem("loyaltyReward") : null;
  const activeReward = rewardParam || storedReward || null;
  const isRewardMode = activeReward === 'free-ticket';

  useEffect(() => {
    if (isRewardMode) {
      setClientSecret(null);
    }
  }, [isRewardMode]);

  // ladowanie seansu i miejsc zajetych 
  useEffect(() => {
    Promise.all([
      api.get(`/sessions/${id}`),
      api.get(`/tickets/session/${id}`)
    ])
      .then(([sRes, tRes]) => {
        setSession(sRes.data)
        // Bezpieczne parsowanie miejsc - obsługa stringów i tablic
        try {
          const allSeats = [];
          tRes.data.forEach(ticket => {
            if (ticket.seats) {
              if (typeof ticket.seats === 'string') {
                // Jeśli string, podziel po przecinku
                const seats = ticket.seats.split(',').map(s => s.trim()).filter(s => s);
                allSeats.push(...seats);
              } else if (Array.isArray(ticket.seats)) {
                // Jeśli już tablica, dodaj bezpośrednio
                allSeats.push(...ticket.seats);
              }
            }
          });
          setBookedSeats(allSeats);
        } catch (error) {
          console.error('Error parsing seats:', error);
          setBookedSeats([]);
        }
      })
      .catch(() => showToast("error", "Ошибка загрузки сеанса"))
      .finally(() => setLoading(false))
  }, [id])

  const toggleSeat = (seat) => {
    if (bookedSeats.includes(seat)) return // mie mozesz kupic wybrane miejsce
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat))
    } else {
      setSelectedSeats([...selectedSeats, seat])
    }
  }

 const purchase = async () => {
  // Sprawdź czy seans nie minął
  if (session && new Date(session.datetime) < new Date()) {
    showToast("error", "Nie można kupić biletu na seans który już się odbył");
    return;
  }
  
  if (selectedSeats.length === 0) {
    showToast("error", "Wybierz przynajmniej jedno miejsce");
    return;
  }
  
  try {
    setClientSecret(null);
    if (isRewardMode) {
      const response = await api.post("/loyalty/redeem/free-ticket", {
        session_id: session.id,
        seats: selectedSeats
      });
      showToast("success", "Darmowy bilet został zapisany!");
      sessionStorage.removeItem("loyaltyReward");
      navigate(`/ticket/${response.data.ticket_id}`);
      return;
    }

    const response = await api.post("/tickets/purchase", {
      session_id: session.id,
      seats: selectedSeats
    });

    console.log("purchase() RESPONSE", response.data);
    // Stwórz PaymentIntent po zakupie biletu
    const amountPln = response.data.amount
    const amountCents = Math.round(Number(amountPln) * 100)
    const pi = await api.post('/payments/create-payment-intent', {
      amount: amountCents,
      currency: 'pln',
      ticketId: response.data.ticket_id
    })
    setClientSecret(pi.data.clientSecret)
    showToast("success", "Bilet utworzony, przejdź do płatności");
  } catch (e) {
    console.error("purchase() ERROR", e);
    showToast("error", e?.response?.data?.message || "Błąd zakupu");
  }
};

  const cancelRewardMode = () => {
    sessionStorage.removeItem("loyaltyReward");
    if (rewardParam) {
      navigate(`/reservation/${id}`, { replace: true });
    } else {
      showToast("info", "Darmowy bilet został wyłączony.");
    }
  };


  if (loading) return <div className="container">Ładowanie...</div>
  if (!session) return <div className="container">Brak seansu</div>

  // Generowanie miejsc - sztywne układy dla konkretnych sal
  const capacity = session.hall_capacity || 40;
  const hallType = session.hall_type || 'standard';
  const hallName = session.hall_name || '';
  
  const seats = [];
  const seatsByRow = {};
  
  // Sala 1: 72 miejsca - 9 rzędów po 8 miejsc
  // Sala 2: 50 miejsc - 5 rzędów po 10 foteli
  // Sala 3: 144 miejsca fizyczne - 8 rzędów foteli po 8 + 4 rzędy kanap po 10
  // Sala 4: 56 miejsc fizycznych VIP - 4 rzędy foteli VIP po 10 + 1 rząd kanap VIP (8 kanap)
  
  if (hallName.includes('Sala 1') || (capacity === 72 && hallType === 'standard')) {
    // Sala 1: 9 rzędów po 8 miejsc
    const rows = 9;
    const seatsPerRow = 8;
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= seatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
  } else if (hallName.includes('Sala 2') || (capacity === 50 && hallType === 'standard')) {
    // Sala 2: 5 rzędów po 10 - ostatnie 2 rzędy (D-E) to kanapy
    const normalRows = 3; // Rzędy A-C to fotele
    const couchRows = 2; // Rzędy D-E to kanapy
    const seatsPerRow = 10;
    
    // Zwykłe rzędy (A-C)
    for (let r = 0; r < normalRows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= seatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
    
    // Rzędy kanap (D-E)
    for (let r = 0; r < couchRows; r++) {
      const rowLetter = String.fromCharCode(65 + normalRows + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= seatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
  } else if (hallName.includes('Sala 3') || (hallType === 'mixed')) {
    // Sala 3: 8 rzędów foteli po 8 + 2 rzędy kanap po 10
    // Rzędy foteli (A-H): 8 rzędów po 8 foteli = 64 miejsca
    const normalRows = 8;
    const normalSeatsPerRow = 8;
    for (let r = 0; r < normalRows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= normalSeatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
    // Rzędy kanap (I-J): 2 rzędy po 8 kanap = 16 miejsc w bazie (32 fizycznie)
    const couchRows = 2;
    const couchSeatsPerRow = 8; // 8 kanap na rząd
    for (let r = 0; r < couchRows; r++) {
      const rowLetter = String.fromCharCode(65 + normalRows + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= couchSeatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
    // Razem: 64 + 32 = 96 miejsc fizyczne
  } else if (hallName.includes('Sala 4') || (hallType === 'vip')) {
    // Sala 4 VIP: 5 rzędów foteli VIP (A-E) po 8 + 2 rzędy kanap VIP (F-G) po 8
    // Rzędy foteli VIP (A-E): 5 rzędów po 8 = 40 miejsc
    const vipRows = 5;
    const vipSeatsPerRow = 8;
    for (let r = 0; r < vipRows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= vipSeatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
    // Rzędy kanap VIP (F-G): 2 rzędy po 8 kanap = 16 miejsc w bazie (32 fizycznie)
    const vipCouchRows = 2;
    const vipCouchSeatsPerRow = 8;
    for (let r = 0; r < vipCouchRows; r++) {
      const rowLetter = String.fromCharCode(65 + vipRows + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= vipCouchSeatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
    // Razem: 40 + 32 = 72 miejsca fizyczne
  } else if (hallName.includes('Sala 1') || (capacity === 72 && hallType === 'standard')) {
    // Sala 1: 72 miejsca - 9 rzędów po 8 miejsc
    const rows = 9;
    const seatsPerRow = 8;
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= seatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
  } else {
    // Domyślny układ: 5 rzędów zwykłych + 2 rzędy kanap (40 miejsc)
    const rows = 5;
    const couchRows = 2;
    const seatsPerRow = 8;
    
    // Zwykłe rzędy (A-E)
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= seatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
    
    // Rzędy kanap (F-G)
    for (let r = 0; r < couchRows; r++) {
      const rowLetter = String.fromCharCode(65 + rows + r);
      seatsByRow[rowLetter] = [];
      for (let c = 1; c <= seatsPerRow; c++) {
        const seat = rowLetter + c;
        seats.push(seat);
        seatsByRow[rowLetter].push(seat);
      }
    }
  }

  return (
  <div className="container reservation">
    <div className="reservation-left">
      <h1>{session.title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <p style={{ margin: 0 }}>{new Date(session.datetime).toLocaleString("pl-PL")}</p>
        {session.format === '3D' && (
          <span style={{
            padding: '4px 12px',
            background: 'var(--primary)',
            color: '#000',
            borderRadius: '6px',
            fontSize: '0.9em',
            fontWeight: 'bold'
          }}>
            3D
          </span>
        )}
      </div>
      {session.hall_name && (
        <p style={{marginTop: '8px', opacity: 0.8}}>
          🎭 Sala: <strong>{session.hall_name}</strong>
          {session.hall_capacity && ` (${session.hall_capacity} miejsc)`}
        </p>
      )}

      {/* Ekran na górze */}
      <div className="screen">🎬 EKRAN</div>

      {/* Układ miejsc - wszystkie w jednym rzędzie */}
      <div className="seats-layout">
        {Object.entries(seatsByRow).map(([rowLetter, rowSeats]) => {
                  // Określ czy to kanapa na podstawie typu sali i rzędu
                  let isCouch = false;
                  if (hallType === 'vip' && hallName.includes('Sala 4')) {
                    // Sala 4 VIP: rzędy F-G to kanapy VIP
                    isCouch = ['F', 'G'].includes(rowLetter);
                  } else if (hallType === 'mixed' && hallName.includes('Sala 3')) {
                    // Sala 3: rzędy I-J to kanapy (po 8 rzędach foteli A-H)
                    isCouch = ['I', 'J'].includes(rowLetter);
                  } else {
                    // Standardowy układ: ostatnie 2 rzędy to kanapy (dla sali 1, 2 i innych)
                    const rowNumber = rowLetter.charCodeAt(0) - 65;
                    const totalRows = Object.keys(seatsByRow).length;
                    isCouch = rowNumber >= totalRows - 2;
                  }
          
          return (
            <div key={rowLetter} className="seats-row">
              <div className="row-label">{rowLetter}</div>
              
              <div className="seats-container">
                {rowSeats.map(seat => {
                  const isBooked = bookedSeats.includes(seat);
                  const isSelected = selectedSeats.includes(seat);
                  
                  return (
                    <button
                      key={seat}
                      className={`seat 
                        ${isBooked ? "booked" : ""} 
                        ${isSelected ? "selected" : ""}
                        ${isCouch ? "couch" : ""}
                        ${hallType === 'vip' ? "vip" : ""}`}
                      onClick={() => toggleSeat(seat)}
                      disabled={isBooked}
                      title={isCouch ? (hallType === 'vip' ? "Kanapa VIP (2 miejsca = 70 zł)" : "Kanapa (2 miejsca = 2x cena)") : (hallType === 'vip' ? "Fotel VIP (35 zł)" : seat)}
                    >
                      {isCouch ? (
                        <img 
                          src="https://cdn-icons-png.flaticon.com/512/1203/1203087.png" 
                          alt="Kanapa" 
                          className="seat-icon-couch"
                        />
                      ) : (
                        <img 
                          src="https://static.thenounproject.com/png/2049821-200.png" 
                          alt="Fotel" 
                          className="seat-icon-chair"
                        />
                      )}
                      <span className="seat-number">{seat.slice(1)}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="row-label">{rowLetter}</div>
            </div>
          );
        })}
      </div>
      
      {/* Legenda na dole */}
      <div className="screen-bottom">
        {/* Legenda miejsc */}
        <div className="seats-legend">
          <div className="legend-item">
            <div className="legend-icon seat-available">
              <img 
                src="https://static.thenounproject.com/png/2049821-200.png" 
                alt="Fotel" 
                className="seat-icon-chair"
              />
            </div>
            <span>Miejsca wolne</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon seat-selected">
              <img 
                src="https://static.thenounproject.com/png/2049821-200.png" 
                alt="Fotel" 
                className="seat-icon-chair"
              />
            </div>
            <span>Wybrane miejsca</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon seat-booked">
              <img 
                src="https://static.thenounproject.com/png/2049821-200.png" 
                alt="Fotel" 
                className="seat-icon-chair"
              />
            </div>
            <span>Miejsca zajęte</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon seat-couch">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/1203/1203087.png" 
                alt="Kanapa" 
                className="seat-icon-couch"
              />
            </div>
            <span>{hallType === 'vip' ? 'Kanapa VIP' : 'Kanapa'}</span>
          </div>
          {hallType === 'vip' && (
            <div className="legend-item">
              <div className="legend-icon seat-available vip-seat">
                <img 
                  src="https://static.thenounproject.com/png/2049821-200.png" 
                  alt="Fotel VIP" 
                  className="seat-icon-chair"
                />
              </div>
              <span>Fotel VIP</span>
            </div>
          )}
        </div>
      </div>
      
      <p style={{ textAlign: 'center', marginTop: '20px', opacity: 0.7, fontSize: '0.9em' }}>
        Nie pozostawiaj pustego miejsca między wybranymi miejscami.
      </p>
    </div>

    {/* Panel wyboru - ulepszony design */}
    <div className="reservation-right">
      <div className="reservation-summary-card">
        <h2 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '10px' }}>
          Twój wybór
        </h2>
        
        <div className="summary-section">
          {isRewardMode && (
            <div className="summary-item" style={{ background: 'rgba(34,197,94,0.15)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
              <strong style={{ color: '#34d399' }}>Używasz darmowego biletu lojalnościowego.</strong>
              <p style={{ marginTop: '6px', fontSize: '0.9em', opacity: 0.85 }}>
                Po potwierdzeniu rezerwacji cena wyniesie 0 zł, a bilet trafi prosto do zakładki „Moje bilety”.
              </p>
              <button
                className="btn"
                style={{ marginTop: '10px', background: 'rgba(244,63,94,0.2)', color: '#f87171' }}
                onClick={cancelRewardMode}
              >
                Anuluj darmowy bilet
              </button>
            </div>
          )}

          <div className="summary-item">
            <span className="summary-label">Film:</span>
            <span className="summary-value">{session.title}</span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">Data:</span>
            <span className="summary-value">{new Date(session.datetime).toLocaleString("pl-PL")}</span>
          </div>
          
          {session.hall_name && (
            <div className="summary-item">
              <span className="summary-label">Sala:</span>
              <span className="summary-value">{session.hall_name}</span>
            </div>
          )}
        </div>

        <div className="seats-summary">
          <div className="summary-item">
            <span className="summary-label">Wybrane miejsca:</span>
            <div className="selected-seats-list">
              {selectedSeats.length > 0 ? (
                selectedSeats.map(seat => (
                  <span key={seat} className="seat-badge">{seat}</span>
                ))
              ) : (
                <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Nie wybrano miejsc</span>
              )}
            </div>
          </div>
        </div>

        <div className="price-summary">
          <div className="price-row">
            <span>Liczba miejsc:</span>
            <strong>{selectedSeats.length}</strong>
          </div>
          {selectedSeats.length > 0 && (
            <>
              {(() => {
                // Funkcja pomocnicza do określania czy miejsce to kanapa
                const isSeatCouch = (seat) => {
                  const rowLetter = seat[0];
                  if (hallType === 'vip' && hallName.includes('Sala 4')) {
                    // Sala 4 VIP: rzędy F-G to kanapy VIP
                    return ['F', 'G'].includes(rowLetter);
                  } else if (hallType === 'mixed' && hallName.includes('Sala 3')) {
                    return ['I', 'J'].includes(rowLetter);
                  } else {
                    // Standardowy układ: ostatnie 2 rzędy to kanapy
                    const rowNumber = rowLetter.charCodeAt(0) - 65;
                    const totalRows = Object.keys(seatsByRow).length;
                    return rowNumber >= totalRows - 2;
                  }
                };
                
                const couchSeats = selectedSeats.filter(isSeatCouch);
                const normalSeats = selectedSeats.filter(s => !isSeatCouch(s));
                
                return (
                  <>
                    {couchSeats.length > 0 && (
                      <div className="price-row" style={{ fontSize: '0.9em', opacity: 0.8 }}>
                        <span>{hallType === 'vip' ? 'Kanapy VIP (70 zł):' : 'Kanapy (2x cena):'}</span>
                        <span>
                          {couchSeats.length} × {hallType === 'vip' ? '70.00' : (parseFloat(session.price) * 2).toFixed(2)} zł
                        </span>
                      </div>
                    )}
                    {normalSeats.length > 0 && (
                      <div className="price-row" style={{ fontSize: '0.9em', opacity: 0.8 }}>
                        <span>{hallType === 'vip' ? 'Fotele VIP (35 zł):' : 'Zwykłe miejsca:'}</span>
                        <span>
                          {normalSeats.length} × {hallType === 'vip' ? '35.00' : parseFloat(session.price).toFixed(2)} zł
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
          <div className="price-total">
            <span>Razem:</span>
            <strong style={{ fontSize: '1.5em', color: 'var(--primary)' }}>
              {(() => {
                const isSeatCouch = (seat) => {
                  const rowLetter = seat[0];
                  if (hallType === 'vip' && hallName.includes('Sala 4')) {
                    // Sala 4 VIP: rzędy F-G to kanapy VIP
                    return ['F', 'G'].includes(rowLetter);
                  } else if (hallType === 'mixed' && hallName.includes('Sala 3')) {
                    return ['I', 'J'].includes(rowLetter);
                  } else {
                    // Standardowy układ: ostatnie 2 rzędy to kanapy
                    const rowNumber = rowLetter.charCodeAt(0) - 65;
                    const totalRows = Object.keys(seatsByRow).length;
                    return rowNumber >= totalRows - 2;
                  }
                };
                
                const totalPrice = selectedSeats.reduce((sum, seat) => {
                  if (hallType === 'vip' && hallName.includes('Sala 4')) {
                    // Sala 4 VIP: fotele VIP = 35 zł, kanapy VIP = 70 zł
                    return sum + (isSeatCouch(seat) ? 70 : 35);
                  } else {
                    const isCouch = isSeatCouch(seat);
                    return sum + (isCouch ? parseFloat(session.price) * 2 : parseFloat(session.price));
                  }
                }, 0);
                return totalPrice.toFixed(2);
              })()} zł
            </strong>
          </div>
        </div>

        <button
          className="btn purchase-btn"
          disabled={!selectedSeats.length}
          onClick={purchase}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1.1em',
            marginTop: '20px',
            opacity: selectedSeats.length ? 1 : 0.5,
            cursor: selectedSeats.length ? 'pointer' : 'not-allowed'
          }}
        >
          {selectedSeats.length ? (
            isRewardMode
              ? `Odbierz darmowy bilet`
              : `Kup ${selectedSeats.length} ${selectedSeats.length === 1 ? 'bilet' : 'bilety'}`
          ) : 'Wybierz miejsca'}
        </button>

        {!isRewardMode && clientSecret && (
          <div style={{marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)'}}>
            <h3 style={{ fontSize: '1.1em', marginBottom: '10px' }}>Płatność</h3>
            <PaymentForm
              clientSecret={clientSecret}
              amountPln={(() => {
                const isSeatCouch = (seat) => {
                  const rowLetter = seat[0];
                  if (hallType === 'vip' && hallName.includes('Sala 4')) {
                    // Sala 4 VIP: rzędy F-G to kanapy VIP
                    return ['F', 'G'].includes(rowLetter);
                  } else if (hallType === 'mixed' && hallName.includes('Sala 3')) {
                    return ['I', 'J'].includes(rowLetter);
                  } else {
                    // Standardowy układ: ostatnie 2 rzędy to kanapy
                    const rowNumber = rowLetter.charCodeAt(0) - 65;
                    const totalRows = Object.keys(seatsByRow).length;
                    return rowNumber >= totalRows - 2;
                  }
                };
                
                const totalPrice = selectedSeats.reduce((sum, seat) => {
                  if (hallType === 'vip' && hallName.includes('Sala 4')) {
                    // Sala 4 VIP: fotele VIP = 35 zł, kanapy VIP = 70 zł
                    return sum + (isSeatCouch(seat) ? 70 : 35);
                  } else {
                    const isCouch = isSeatCouch(seat);
                    return sum + (isCouch ? parseFloat(session.price) * 2 : parseFloat(session.price));
                  }
                }, 0);
                return totalPrice;
              })()}
              onSuccess={() => {
                showToast('success', 'Płatność zakończona!')
                navigate('/dashboard')
              }}
            />
          </div>
        )}
      </div>
    </div>
  </div>
)
}