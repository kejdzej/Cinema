import { useEffect, useState } from "react";
import { api, getToken, setAuthToken } from "../services/api.js";

export default function LoyaltyPoints() {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    // Если токен есть в localStorage, устанавливаем его в заголовки
    const token = getToken();
    if (token) setAuthToken(token);

    // Запрос к серверу за очками лояльности
    api.get("/loyalty/points")
      .then(res => setPoints(res.data.points))
      .catch(err => {
        console.error("Ошибка при получении очков:", err);
        setPoints(0); // если ошибка, показываем 0
      });
  }, []);

  return (
    <div className="container">
  <section className="loyalty-section">
    <h1 className="loyalty-title">Punkty lojalnościowe</h1>

    <div className="points-card">
      <p className="label">Masz:</p>
      <p className="value">{points}</p>
      <p className="sub">punktów</p>
    </div>
  </section>
</div>

  );
}
