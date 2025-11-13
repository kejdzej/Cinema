import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import NotFound from './pages/NotFound.jsx'
import { api, setAuthToken, getToken, clearToken } from './services/api.js'
import Reservation from "./pages/Reservation.jsx"
import TicketDetails from "./pages/TicketDetails.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import Orders from "./pages/Orders.jsx";

import ChatBot from "./components/ChatBot.jsx";

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
  const location = useLocation()

  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(()=> setToast(null), 2500)
  }

  useEffect(()=>{
    const token = getToken()
    if (token){
      setAuthToken(token)
      const stored = localStorage.getItem('cinema_user')
      if (stored) setUser(JSON.parse(stored))
    }
  }, [])

  // Smooth scroll to section when navigating with hash (/#cennik etc.)
  useEffect(()=>{
    if (location.hash){
      const el = document.querySelector(location.hash)
      if (el){
        setTimeout(()=> el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      }
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [location.pathname, location.hash])

  const login = (payload)=>{
    setUser(payload.user)
    localStorage.setItem('cinema_user', JSON.stringify(payload.user))
    setAuthToken(payload.token)
    
    // Jeśli użytkownik ma rolę admin, dodaj ją do localStorage
    if (payload.user && payload.user.role) {
      const updatedUser = { ...payload.user, role: payload.user.role }
      setUser(updatedUser)
      localStorage.setItem('cinema_user', JSON.stringify(updatedUser))
    }
  }

  const logout = ()=>{
    clearToken()
    setUser(null)
    localStorage.removeItem('cinema_user')
    navigate('/login')
  }

  // ✅ список страниц где Navbar не нужен
  const noNavbarRoutes = ["/reservation", "/ticket"] 
  const hideNavbar = noNavbarRoutes.some(r => location.pathname.startsWith(r))

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      <AuthContext.Provider value={{ user, login, logout }}>
        
        {!hideNavbar && <Navbar />}


        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard/></ProtectedRoute>} />
          <Route path="/reservation/:id" element={<Reservation />} />
          <Route path="/ticket/:id" element={<ProtectedRoute><TicketDetails/></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders/></ProtectedRoute>} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatBot />

        {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      </AuthContext.Provider>
    </ToastContext.Provider>
  )
}