import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

function priceRangeLabel(prices) {
  if (!prices.length) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return "—";
  if (min === max) return `${min.toFixed(2)} zł`;
  return `${min.toFixed(2)}–${max.toFixed(2)} zł`;
}

export default function Cennik() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.get("/sessions")
      .then((res) => setSessions(res.data || []))
      .catch(() => setSessions([]));
  }, []);

  const upcoming = useMemo(() => {
    const now = new Date();
    return (sessions || []).filter((s) => {
      if (!s || s.price === null || s.price === undefined) return false;
      const dt = new Date(s.datetime);
      if (Number.isNaN(dt.getTime())) return false;
      if (dt < now) return false;
      const p = typeof s.price === "number" ? s.price : parseFloat(String(s.price).replace(",", "."));
      return Number.isFinite(p) && p > 0;
    });
  }, [sessions]);

  const prices2D = useMemo(() => {
    return upcoming
      .filter((s) => !s.format || s.format === "2D")
      .map((s) => (typeof s.price === "number" ? s.price : parseFloat(String(s.price).replace(",", "."))));
  }, [upcoming]);

  const prices3D = useMemo(() => {
    return upcoming
      .filter((s) => s.format === "3D")
      .map((s) => (typeof s.price === "number" ? s.price : parseFloat(String(s.price).replace(",", "."))));
  }, [upcoming]);

  const prices = [
    {
      type: "Bilety 2D",
      price: priceRangeLabel(prices2D),
      description: "Cena zależy od konkretnego seansu (ustawiana przez administratora).",
    },
    {
      type: "Bilety 3D",
      price: priceRangeLabel(prices3D),
      description: "Cena zależy od konkretnego seansu (ustawiana przez administratora).",
    },
  ];

  return (
    <>
      <div className="grid">
        {prices.map((p, i) => (
          <div key={i} className="card" style={{ 
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent'
          }}>
            <h3>{p.type}</h3>
            <p style={{ fontSize: '1.3em', margin: '10px 0', color: 'var(--primary)' }}><b>{p.price}</b></p>
            {p.description && <p style={{ fontSize: '0.9em', opacity: 0.7, marginTop: '8px' }}>{p.description}</p>}
          </div>
        ))}
      </div>
    </>
  )
}
