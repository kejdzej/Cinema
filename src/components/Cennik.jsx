// Cennik.jsx
export default function Cennik() {
  const prices = [
    { type: "Bilet ulgowy (uczniowie/studenci)", price: "18 zł" },
    { type: "Bilet normalny 2D", price: "25 zł" },
    { type: "Bilet 3D", price: "30 zł" },
    { type: "Bilet 4D", price: "45 zł" },
    { type: "Karta klienta (abonament miesięczny)", price: "99 zł" },
  ]

  return (
    <div className="grid">
      {prices.map((p, i) => (
        <div key={i} className="card">
          <h3>{p.type}</h3>
          <p><b>{p.price}</b></p>
        </div>
      ))}
    </div>
  )
}
