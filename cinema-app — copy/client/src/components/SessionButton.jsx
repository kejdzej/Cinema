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

  return (
    <button className="session-btn" onClick={handleClick}>
      {new Date(session.datetime).toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit"
      })}
    </button>
  )
}
