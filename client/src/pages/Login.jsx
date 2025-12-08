import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api, setAuthToken } from '../services/api.js' // <- добавили setAuthToken
import { useToast } from '../App.jsx'
import { useAuth } from '../App.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      
      const token = res.data.token
      setAuthToken(token) // <-- вот здесь добавили
      login(res.data) // сохраняем данные в контекст/стейт

      showToast('success', 'Zalogowano pomyślnie')
      navigate('/')
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Błąd logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1>Logowanie</h1>
      <div className="space"></div>
      <form onSubmit={onSubmit} className="card">
        <label>Email</label>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        <div className="space"></div>
        <label>Hasło</label>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        <div className="space"></div>
        <button className="btn" disabled={loading}>{loading ? 'Logowanie...' : 'Zaloguj się'}</button>
      </form>
      <div className="space"></div>
      <div className="card">Nie masz konto? <Link to="/register">Zarejestruj się</Link></div>
    </div>
  )
}
