import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

export default function History(){
  const [tickets, setTickets] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(()=>{
    api.get('/tickets/mine').then(res => setTickets(res.data)).catch(()=>{})
    api.get('/orders').then(res => setOrders(res.data)).catch(()=>{})
  }, [])

  const pastTickets = tickets.filter(t => new Date(t.datetime) < new Date())
  const completedOrders = orders.filter(o => o.status === 'completed')

  return (
    <div className="container">
      <h1>📜 Historia</h1>

      <h2>🎟 Bilety archiwalne</h2>
      {!pastTickets.length && <div className="muted">Brak archiwalnych biletów</div>}
      <div className="grid">
        {pastTickets.map(t => (
          <div key={t.id} className="card">
            <div><b>{t.title}</b></div>
            <div style={{ opacity: .8 }}>{new Date(t.datetime).toLocaleString('pl-PL')}</div>
            <div>Miejsca: {t.seats}</div>
            <div>Cena: {t.price} zł</div>
          </div>
        ))}
      </div>

      <hr style={{margin: '30px 0'}} />

      <h2>🍿 Zamówienia archiwalne</h2>
      {!completedOrders.length && <div className="muted">Brak zamówień</div>}
      <div className="grid">
        {completedOrders.map(o => (
          <div key={o.id} className="card">
            <div><b>Zamówienie #{o.id}</b></div>
            <div style={{ opacity: .8 }}>{new Date(o.created_at).toLocaleString('pl-PL')}</div>
            <div>Razem: {o.total} zł</div>
          </div>
        ))}
      </div>
    </div>
  )
}


