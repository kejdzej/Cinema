// Aktualnosci.jsx
export default function Aktualnosci() {
  const news = [
    { date: "12.09.2025", text: "🎭 Dzień cosplayu – przyjdź w stroju ulubionej postaci i odbierz darmowy popcorn!" },
    { date: "18.09.2025", text: "🍿 W sprzedaży pojawił się różowy popcorn – limitowana edycja!" },
    { date: "25.09.2025", text: "🎬 Nadchodzi premiera długo wyczekiwanej nowości – Minecraft The Movie!" },
  ]

  return (
    <div className="grid">
      {news.map((n, i) => (
        <div key={i} className="card">
          <div className="muted">{n.date}</div>
          <p>{n.text}</p>
        </div>
      ))}
    </div>
  )
}

