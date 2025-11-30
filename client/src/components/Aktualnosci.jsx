// Aktualnosci.jsx
export default function Aktualnosci() {
  const news = [
    { 
      date: "01.12.2025", 
      text: "🎉 Nowy program lojalnościowy! Zbieraj punkty za każdy zakup i wymieniaj je na nagrody. Dołącz już dziś!",
      highlight: true
    },
    { 
      date: "28.11.2025", 
      text: "🎬 Premiera już w ten weekend! Nie przegap najnowszych hitów kinowych. Rezerwuj bilety online i oszczędzaj czas!" 
    },
    { 
      date: "25.11.2025", 
      text: "🍿 Świąteczna promocja! Przy zakupie 2 biletów otrzymasz darmowy popcorn. Promocja ważna do końca grudnia!" 
    },
    { 
      date: "20.11.2025", 
      text: "🎭 Dzień cosplayu – przyjdź w stroju ulubionej postaci i odbierz darmowy popcorn! Najlepsze przebranie wygrywa nagrody!" 
    },
    { 
      date: "18.11.2025", 
      text: "🍿 W sprzedaży pojawił się różowy popcorn – limitowana edycja! Tylko w naszym kinie, dostępne w barze." 
    },
    { 
      date: "15.11.2025", 
      text: "🎬 Nadchodzi premiera długo wyczekiwanej nowości – Minecraft The Movie! Bilety już w sprzedaży." 
    },
    { 
      date: "10.11.2025", 
      text: "💳 Płatności online! Teraz możesz płacić kartą bezpośrednio na stronie. Szybko, bezpiecznie i wygodnie." 
    },
    { 
      date: "05.11.2025", 
      text: "🎁 Urodziny w kinie! Zorganizuj urodziny dla dziecka w naszym kinie. Specjalne pakiety i atrakcje dla najmłodszych." 
    }
  ]

  return (
    <div className="grid">
      {news.map((n, i) => (
        <div 
          key={i} 
          className={`card news-card ${n.highlight ? 'news-highlight' : ''}`}
          style={{
            animation: `fadeInUp 0.5s ease-out ${i * 0.1}s both`
          }}
        >
          <div className="muted" style={{ fontSize: '0.9em', marginBottom: '8px' }}>{n.date}</div>
          <p style={{ margin: 0, lineHeight: '1.6' }}>{n.text}</p>
        </div>
      ))}
    </div>
  )
}

