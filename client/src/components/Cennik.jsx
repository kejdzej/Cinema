// Cennik.jsx
export default function Cennik() {
  const prices = [
    { type: "Bilet ulgowy (uczniowie/studenci)", price: "18 zł", description: "Wymagana ważna legitymacja" },
    { type: "Bilet normalny 2D", price: "22 zł", description: "Standardowy bilet na seans 2D" },
    { type: "Bilet 3D", price: "28 zł", description: "Seans w technologii 3D" },
    { type: "Kanapa (2 miejsca)", price: "2x cena biletu", description: "Podwójne miejsce dla dwóch osób" },
    { type: "Fotel VIP", price: "35 zł", description: "Sala VIP - fotele z regulacją elektryczną" },
    { type: "Kanapa VIP (2 miejsca)", price: "70 zł", description: "Sala VIP - podwójne miejsce VIP" },
  ]

  return (
    <>
      <div className="grid">
        {prices.map((p, i) => (
          <div key={i} className="card" style={{ 
            border: p.type.includes('VIP') ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
            background: p.type.includes('VIP') ? 'rgba(250, 204, 21, 0.1)' : 'transparent'
          }}>
            <h3>{p.type}</h3>
            <p style={{ fontSize: '1.3em', margin: '10px 0', color: 'var(--primary)' }}><b>{p.price}</b></p>
            {p.description && <p style={{ fontSize: '0.9em', opacity: 0.7, marginTop: '8px' }}>{p.description}</p>}
          </div>
        ))}
      </div>
      
      {/* Wzmianka o sali VIP */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'rgba(250, 204, 21, 0.1)',
        border: '1px solid var(--primary)',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '1.1em', margin: 0, color: 'var(--primary)' }}>
          <strong>⭐ Sala VIP:</strong> Fotele z regulacją elektryczną i więcej miejsca na nogi dla maksymalnego komfortu
        </p>
      </div>
    </>
  )
}
