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

  const pricesVIP = useMemo(() => {
    return upcoming
      .filter((s) => {
        const hallName = (s.hall_name || '').toLowerCase();
        const hallDesc = (s.hall_description || '').toLowerCase();
        return hallName.includes('vip') || hallDesc.includes('vip');
      })
      .map((s) => (typeof s.price === "number" ? s.price : parseFloat(String(s.price).replace(",", "."))));
  }, [upcoming]);

  const prices = [
    {
      type: "Bilety 2D",
      price: priceRangeLabel(prices2D),
      description: "Cena zależy od konkretnego seansu.",
      isVip: false
    },
    {
      type: "Bilety 3D",
      price: priceRangeLabel(prices3D),
      description: "Cena zależy od konkretnego seansu.",
      isVip: false
    },
    {
      type: " Bilety VIP ",
      price: priceRangeLabel(pricesVIP),
      description: "Ekskluzywna sala z fotelami i kanapami VIP.",
      isVip: true
    },
  ];

  return (
    <>
      <div className="grid">
        {prices.map((p, i) => (
          <div
            key={i}
            className={`card ${p.isVip ? 'vip-card' : ''}`}
            style={{
              border: p.isVip ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
              background: p.isVip ? 'rgba(255, 215, 0, 0.05)' : 'transparent',
              position: 'relative',
              boxShadow: p.isVip ? '0 0 20px rgba(255, 215, 0, 0.3)' : 'none'
            }}
          >
            <h3 style={{ color: p.isVip ? 'var(--primary)' : 'inherit' }}>{p.type}</h3>
            <p style={{ fontSize: '1.3em', margin: '10px 0', color: 'var(--primary)' }}><b>{p.price}</b></p>
            {p.description && <p style={{ fontSize: '0.9em', opacity: 0.7, marginTop: '8px' }}>{p.description}</p>}
          </div>
        ))}
      </div>
    </>
  )
}
