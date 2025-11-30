import { useAuth } from "../App.jsx"
import { useNavigate } from "react-router-dom"
import { useToast } from "../App.jsx"

export default function SessionButton({ session }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleClick = () => {
    if (!user) {
      showToast("error", "Musisz się zalogować")
      navigate("/login")
    } else {
      navigate(`/reservation/${session.id}`) 
    }
  }

  const timeStr = new Date(session.datetime).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <button className="session-btn" onClick={handleClick} title={session.hall_name ? `Sala: ${session.hall_name}` : ''}>
      {timeStr}
      {session.format === '3D' && (
        <span style={{ 
          marginLeft: '6px', 
          fontSize: '0.75em', 
          color: 'var(--primary)',
          fontWeight: 'bold',
          padding: '2px 6px',
          background: 'rgba(250, 204, 21, 0.2)',
          borderRadius: '4px'
        }}>3D</span>
      )}
      {session.format === '2D' && (
        <span style={{ 
          marginLeft: '6px', 
          fontSize: '0.75em', 
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: 'normal'
        }}>2D</span>
      )}
      {session.hall_name && <span className="hall-badge">{session.hall_name}</span>}
    </button>
  )
}
