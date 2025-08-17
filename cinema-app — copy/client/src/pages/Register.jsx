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
    setLoading(true)
    try {
      await api.post('/auth/register', { name, email, password })
      showToast('success', 'Успешно зарегистрировались')
      navigate('/login')
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{maxWidth:520}}>
      <h1>Регистрация</h1>
      <div className="space"></div>
      <form onSubmit={onSubmit} className="card">
        <label>Имя</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Иван" />
        <div className="space"></div>
        <label>Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        <div className="space"></div>
        <label>Пароль</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Минимум 6 символов" />
        <div className="space"></div>
        <button className="btn" disabled={loading}>{loading ? 'Создаём...' : 'Зарегистрироваться'}</button>
      </form>
      <div className="space"></div>
      <div className="card">Уже есть аккаунт? <Link to="/login">Войти</Link></div>
    </div>
  )
}
