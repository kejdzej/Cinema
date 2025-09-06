import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { useToast } from '../App.jsx'

export default function SessionCard({ session }){
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const onSelect = ()=>{
    if (!user){
      showToast('error', 'Musisz się zalogować')
      navigate('/login')
      return
    }
    navigate('/dashboard', { state: { selectedSession: session } })
  }

  const dt = new Date(session.datetime).toLocaleString('pl-PL', { 
    hour: '2-digit', 
    minute: '2-digit', 
    day: '2-digit', 
    month: '2-digit' 
  })
  return (
    <div className="card">
      <h3 style={{margin:'8px 0'}}>{session.title}</h3>
      <div className="muted" style={{opacity:.8, marginBottom:8}}>🕒 {dt}</div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div><b>{session.price} zł</b></div>
        <button className="btn" onClick={onSelect}>Wybierz seans</button>
      </div>
    </div>
  )
}
