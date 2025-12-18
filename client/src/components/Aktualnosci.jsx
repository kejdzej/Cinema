import { useEffect, useState } from "react";
import { api } from "../services/api.js";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Aktualnosci() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    api.get("/news")
      .then((res) => setNews(res.data || []))
      .catch(() => setNews([]));
  }, []);

  return (
    <div className="grid">
      {(!news || news.length === 0) ? (
        <div className="card" style={{ opacity: 0.85 }}>
          Brak aktualności.
        </div>
      ) : (
        news.map((n, i) => (
          <div
            key={n.id ?? i}
            className={`card news-card ${n.highlight ? 'news-highlight' : ''}`}
            style={{ animation: `fadeInUp 0.5s ease-out ${i * 0.1}s both` }}
          >
            <div className="muted" style={{ fontSize: '0.9em', marginBottom: '8px' }}>
              {formatDate(n.published_at || n.created_at)}
            </div>
            {n.title && <h3 style={{ margin: '0 0 8px' }}>{n.title}</h3>}
            <p style={{ margin: 0, lineHeight: '1.6' }}>{n.body}</p>
          </div>
        ))
      )}
    </div>
  )
}

