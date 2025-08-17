import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotFound from './pages/NotFound.jsx'
import { api, setAuthToken, getToken, clearToken } from './services/api.js'
import Reservation from "./pages/Reservation.jsx"

const ToastContext = createContext(null)
export function useToast(){ return useContext(ToastContext) }

const AuthContext = createContext(null)
export function useAuth(){ return useContext(AuthContext) }

function ProtectedRoute({ children }){
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App(){
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(()=> setToast(null), 2500)
  }

  const [user, setUser] = useState(null)

  useEffect(()=>{
    const token = getToken()
    if (token){
      setAuthToken(token)
      const stored = localStorage.getItem('cinema_user')
      if (stored) setUser(JSON.parse(stored))
    }
  }, [])

  const login = (payload)=>{
    setUser(payload.user)
    localStorage.setItem('cinema_user', JSON.stringify(payload.user))
    setAuthToken(payload.token)
  }
  const logout = ()=>{
    clearToken()
    setUser(null)
    localStorage.removeItem('cinema_user')
    navigate('/login')
  }

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/reservation/:id" element={<Reservation />} />  {/* 🔥 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      </AuthContext.Provider>
    </ToastContext.Provider>
  )
}
