import { useState } from "react"
import { useToast, useAuth } from "../App.jsx"
import { api } from "../services/api.js"
import PaymentForm from "./PaymentForm.jsx"

export default function PopcornBar() {
  const products = [
    { id: 1, name: "Popcorn klasyczny", price: 12, img: "/posters/popcorn.jpg" },
    { id: 2, name: "Nachosy z sosem", price: 15, img: "/posters/nachos.jpg" },
    { id: 3, name: "Cola 0.5l", price: 8, img: "/posters/cola.png" },
  ]

  const [cart, setCart] = useState([])
  const { showToast } = useToast()
  const { user } = useAuth()

  const addToCart = (p) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === p.id)
      if (exists) {
        return prev.map(i =>
          i.id === p.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { ...p, qty: 1 }]
    })
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const [clientSecret, setClientSecret] = useState(null)
  const [orderId, setOrderId] = useState(null)

  const checkout = async () => {
    if (!user) {
      showToast("error", "Musisz się zalogować aby kupić")
      return
    }
    try {
      const total = cart.reduce((sum, p) => sum + p.price * p.qty, 0)
      const orderRes = await api.post("/orders", { items: cart, total })
      setOrderId(orderRes.data.order_id)
      // Stripe PaymentIntent dla total (w groszach)
      const cents = Math.round(total * 100)
      const pi = await api.post('/payments/create-payment-intent', {
        amount: cents,
        currency: 'pln'
      })
      setClientSecret(pi.data.clientSecret)
      showToast("success", "Zamówienie utworzone, przejdź do płatności")
    } catch {
      showToast("error", "Błąd przy zakupie")
    }
  }

  const total = cart.reduce((sum, p) => sum + p.price * p.qty, 0)

  return (
    <>
      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="card movie-card">
            <img src={p.img} alt={p.name} className="poster" />
            <div className="movie-info">
              <h3>{p.name}</h3>
              <p className="muted">{p.price} zł</p>
              <button className="btn" onClick={() => addToCart(p)}>Kup</button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="card" style={{ marginTop: "30px" }}>
          <h2>🛒 Twój koszyk</h2>
          {cart.map(item => (
            <div key={item.id} className="row" style={{ justifyContent: "space-between", width:"100%" }}>
              <span>{item.qty} × {item.name}</span>
              <span>{item.price * item.qty} zł</span>
              <button className="btn-ghost" onClick={() => removeFromCart(item.id)}>❌</button>
            </div>
          ))}
          <hr />
          <h3>Razem: {total} zł</h3>
          <button className="btn" onClick={checkout}>Kup teraz</button>
          {clientSecret && (
            <div style={{marginTop:16}}>
              <PaymentForm
                clientSecret={clientSecret}
                amountPln={total}
                onSuccess={() => {
                  (async ()=>{
                    try {
                      if (orderId){
                        await api.patch(`/orders/${orderId}/status`, { status: 'completed' })
                      }
                      showToast('success', 'Płatność zakończona!')
                      setCart([])
                      setClientSecret(null)
                      setOrderId(null)
                    } catch (e) {
                      showToast('error', 'Nie udało się zaktualizować statusu zamówienia')
                    }
                  })()
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
