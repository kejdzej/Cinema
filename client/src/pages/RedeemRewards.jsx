import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js"; 
import { useToast } from "../App.jsx"; 

export default function RedeemRewards() {
  const { showToast } = useToast(); 
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyReward, setBusyReward] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/loyalty/balance").catch(() => ({ data: { points: 0 } })),
      api.get("/loyalty/rewards").catch(() => ({ data: [] }))
    ]).then(([pointsRes, rewardsRes]) => {
      setPoints(pointsRes.data?.points || 0);
      setRewards(rewardsRes.data || []);
    }).catch(() => {
      showToast("error", "Nie udało się pobrać nagród.");
    }).finally(() => setLoading(false));
  }, [showToast]);

  const redeem = async (reward) => {
    if (reward.requiresSession) {
      sessionStorage.setItem("loyaltyReward", reward.id);
      showToast("info", "Wybierz film z repertuaru i zamów darmowy bilet.");
      navigate("/?reward=free-ticket#repertuar");
      return;
    }

    if (points < reward.cost) {
      showToast("error", "Nie masz wystarczająco punktów");
      return;
    }

    setBusyReward(reward.id);
    try {
      const res = await api.post("/loyalty/redeem", { reward: reward.id });
      showToast("success", res.data.message || "Nagroda odebrana!");
      const balanceRes = await api.get("/loyalty/balance");
      setPoints(balanceRes.data?.points || 0);
    } catch (e) {
      const errorMessage = e.response?.data?.message || 
        "Wystąpił nieznany błąd podczas odbierania nagrody.";
      showToast("error", errorMessage);
    } finally {
      setBusyReward(null);
    }
  };

  if (loading) {
    return <div className="container">Ładowanie...</div>;
  }

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
            <div className="reward-card" key={r.id}>
              <h3>{r.name}</h3>
              <p className="reward-cost">{r.cost} punktów</p>
              <p className="reward-desc">{r.description}</p>

              <button
                className={`reward-btn ${points < r.cost || busyReward === r.id ? "disabled" : ""}`}
                disabled={points < r.cost || busyReward === r.id}
                onClick={() => redeem(r)}
              >
                {r.requiresSession ? "Wybierz seans" : "Odbierz"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}