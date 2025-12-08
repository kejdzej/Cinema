import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../App.jsx';

export default function StatsCard() {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [ticketsRes, ordersRes, pointsRes] = await Promise.all([
        api.get('/tickets/mine').catch(() => ({ data: [] })),
        api.get('/orders').catch(() => ({ data: [] })),
        api.get('/loyalty/balance').catch(() => ({ data: { points: 0 } }))
      ]);

      setStats({
        tickets: ticketsRes.data.length,
        orders: ordersRes.data.length,
        points: pointsRes.data.points || 0
      });
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  if (!user || !stats) return null;

  return (
    <div className="card" style={{ 
      background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(250, 204, 21, 0.05) 100%)',
      border: '1px solid rgba(250, 204, 21, 0.3)',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>Twoje statystyki</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
        <div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--primary)' }}>
            {stats.tickets}
          </div>
          <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Bilety</div>
        </div>
        <div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--primary)' }}>
            {stats.orders}
          </div>
          <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Zamówienia</div>
        </div>
        <div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--primary)' }}>
            {stats.points}
          </div>
          <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Punkty</div>
        </div>
      </div>
    </div>
  );
}