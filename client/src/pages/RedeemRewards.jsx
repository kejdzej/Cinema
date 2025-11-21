import { useState, useEffect } from "react";
import { api, getToken, setAuthToken } from "../services/api.js"; 
import { useToast } from "../App.jsx"; 

export default function RedeemRewards() {
  const { showToast } = useToast(); 
  const [points, setPoints] = useState(0);

  const rewards = [
    { name: "Bilet gratis", cost: 500 },
    { name: "Popcorn", cost: 300 },
    { name: "Cola", cost: 100 },
  ];

  // Устанавливаем токен из localStorage при монтировании компонента
  useEffect(() => {
    const token = getToken();
    if (token) setAuthToken(token);

    // Получаем актуальное количество очков
    api.get("/loyalty/points")
      .then(res => setPoints(res.data.points))
      .catch(err => {
        console.error("Ошибка при получении очков:", err);
        setPoints(0);
      });
  }, []);

  const redeem = async (cost) => {
    if (points < cost) {
      showToast("error", "Nie masz wystarczająco punktów");
      return;
    }

    try {
      await api.post("/loyalty/spend", { amount: cost });
      showToast("success", "Nagroda odebrana!");
      
      // Обновляем локальные очки после списания
      setPoints(prev => prev - cost);
    } catch (e) {
      const errorMessage = e.response?.data?.message || 
        "Wystąpił nieznany błąd podczas odbierania nagrody.";
      showToast("error", errorMessage);
    }
  };

  return (
    <div className="container">
  <section className="loyalty-section">
    <h1 className="loyalty-title">Wymiana punktów</h1>

    <div className="points-card">
      <p className="label">Masz:</p>
      <p className="value">{points}</p>
      <p className="sub">punktów</p>
    </div>

    <div className="rewards-grid">
      {rewards.map((r) => (
        <div className="reward-card" key={r.name}>
          <h3>{r.name}</h3>
          <p className="reward-cost">{r.cost} punktów</p>

          <button
            className={`reward-btn ${points < r.cost ? "disabled" : ""}`}
            disabled={points < r.cost}
            onClick={() => redeem(r.cost)}
          >
            Odbierz
          </button>
        </div>
      ))}
    </div>
  </section>
</div>

  );
}
