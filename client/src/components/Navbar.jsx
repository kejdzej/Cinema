// Navbar.jsx
import { Link } from "react-router-dom"
import { useAuth } from "../App"

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
  <div className="navbar-left">
    <a href="#repertuar" className="brand">🎬 Cinema</a>
    <a href="#repertuar">Repertuar</a>
    <a href="#popcorn">Popcorn Bar</a>
    <a href="#cennik">Cennik</a>
    <a href="#aktualnosci">Aktualności</a>
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

