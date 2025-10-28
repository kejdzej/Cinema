// Navbar.jsx
import { Link } from "react-router-dom"
import { useAuth } from "../App"

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
  <div className="navbar-left">
    <Link to="/" className="brand">🎬 Cinema</Link>
    <Link to="/#repertuar">Repertuar</Link>
    <Link to="/#popcorn">Popcorn Bar</Link>
    <Link to="/#cennik">Cennik</Link>
    <Link to="/#aktualnosci">Aktualności</Link>
    {user && <Link to="/dashboard">Moje zamówienia</Link>}
  </div>

      <div className="navbar-right">
        {!user && <Link to="/login" className="btn-ghost">Logowanie</Link>}
        {!user && <Link to="/register" className="btn">Rejestracja</Link>}
        {user && <button onClick={logout} className="btn-ghost">Wyloguj</button>}
      </div>
    </nav>
  )
}

