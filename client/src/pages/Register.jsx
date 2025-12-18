import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { useToast } from '../App.jsx'

export default function Register(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  const onSubmit = async (e)=>{
    e.preventDefault()

    // Walidacja po stronie klienta
    if (!name.trim()) {
      showToast('error', 'Imię jest wymagane')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showToast('error', 'Nieprawidłowy format email')
      return
    }

    if (password.length < 6) {
      showToast('error', 'Hasło musi mieć minimum 6 znaków')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', { name, email, password })
      showToast('success', 'Rejestracja zakończona sukcesem')
      navigate('/login')
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Błąd rejestracji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{maxWidth:520}}>
      <h1>Rejestracja</h1>
      <div className="space"></div>
      <form onSubmit={onSubmit} className="card">
        <label>Imię</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Jan" />
        <div className="space"></div>
        <label>Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        <div className="space"></div>
        <label>Hasło</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 6 znaków" />
        <div className="space"></div>
        <button className="btn" disabled={loading}>{loading ? 'Tworzenie...' : 'Zarejestruj się'}</button>
      </form>
      <div className="space"></div>
      <div className="card">Masz już konto? <Link to="/login">Zaloguj się</Link></div>
    </div>
  )
}
