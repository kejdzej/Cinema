import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../App.jsx";
import * as QRCode from "qrcode.react";

export default function Loyalty() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [history, setHistory] = useState([]);
  const [loyaltyCode, setLoyaltyCode] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [busyReward, setBusyReward] = useState(null);

  const fetchLoyaltyData = useCallback(async () => {
    try {
      const [pointsRes, rewardsRes, historyRes, codeRes] = await Promise.all([ 
        api.get("/loyalty/balance").catch(e => {
          console.error("Failed to fetch balance:", e);
          return { data: { points: 0 } }; 
        }),
        api.get("/loyalty/rewards").catch(e => {
          console.error("Failed to fetch rewards:", e);
          return { data: [] }; 
        }),
        api.get("/loyalty/history").catch(e => {
          console.error("Failed to fetch history:", e);
          return { data: [] }; 
        }),
        api.get("/loyalty/code").catch(e => {
          console.error("Failed to fetch loyalty code, possibly 404:", e);
          return { data: { loyalty_code: null } }; 
        }), 
      ]);

      setPoints(pointsRes.data?.points || 0);
      setRewards(rewardsRes.data || []);
      setHistory(historyRes.data || []);
      setLoyaltyCode(codeRes.data?.loyalty_code || null); 
    } catch (e) {
      showToast("error", "Błąd ładowania danych lojalnościowych");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

 useEffect(() => {
    fetchLoyaltyData();
 }, [fetchLoyaltyData]);


  const redeemReward = async (reward) => {
    if (reward.requiresSession) {
      sessionStorage.setItem("loyaltyReward", reward.id);
      showToast("info", "Wybierz film i miejsca – płatność zostanie pominięta.");
      navigate("/?reward=free-ticket#repertuar");
      return;
    }

    setBusyReward(reward.id);
    try {
      const res = await api.post("/loyalty/redeem", { reward: reward.id });
      showToast("success", res.data.message || "Nagroda dodana do zamówień");
      fetchLoyaltyData();
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Błąd wymiany punktów");
    } finally {
      setBusyReward(null);
    }
  };
  

 if (loading) return (
        <div className="container p-8 h-screen flex justify-center items-center">
             <div className="text-xl font-semibold text-gray-400">Ładowanie...</div>
        </div>
    );


return (
<div className="container p-8">
 <h1 className="text-3xl font-bold mb-6 text-yellow-400">🌟 Panel Stałego Klienta</h1>
 
 <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
    <div className="loyalty-header flex flex-col md:flex-row gap-8 items-start md:items-center">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">💰 Twój stan konta</h2>
        <p className="text-4xl text-green-400">Masz: <strong>{points}</strong> punktów</p>
      </div>

      {/*  QR-kod */}
      {loyaltyCode && (
        <div className="loyalty-code-card bg-gray-700 p-4 rounded-lg text-center shadow-inner ml-auto">
          <h3 className="text-lg font-medium text-yellow-300 mb-2">Twój kod lojalnościowy</h3>
          <p className="text-sm text-gray-400 mb-4">Pokaż go kasjerowi, aby zebrać punkty.</p>
          <div className="p-2 bg-white rounded-lg inline-block">
            <QRCode value={loyaltyCode} size={128} level="H" />
          </div>
          <p className="mt-4 text-white text-lg">Kod: <strong>{loyaltyCode}</strong></p>
        </div>
      )}
    </div>
 </div>
 
 <h2 className="text-2xl font-bold mb-4 text-white">🎁 Dostępne nagrody</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {rewards.map((reward) => (
      <div key={reward.id} className="bg-gray-700 p-5 rounded-xl shadow-md flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-semibold text-yellow-400 mb-2">{reward.name}</h3>
          <p className="text-gray-300 mb-4">{reward.description}</p>
          {reward.requiresSession && (
            <p className="text-sm text-purple-300">Wymaga wyboru seansu i miejsc.</p>
          )}
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-lg font-bold text-red-400">{reward.cost} pkt</span>
          <button 
            onClick={() => redeemReward(reward)} 
            disabled={points < reward.cost || busyReward === reward.id}
            className={`py-2 px-4 rounded-full text-white font-medium transition-colors ${
              points >= reward.cost && busyReward !== reward.id 
              ? 'bg-indigo-600 hover:bg-indigo-700' 
              : 'bg-gray-500 cursor-not-allowed'
            }`}
          >
            {reward.requiresSession ? 'Wybierz seans' : 'Wymień'}
          </button>
        </div>
      </div>
    ))}
 </div>

 <h2 className="text-2xl font-bold mb-4 text-white">📊 Historia punktów</h2>
 <div className="bg-gray-800 p-4 rounded-lg shadow-xl">
    <table className="min-w-full divide-y divide-gray-700">
      <thead className="bg-gray-700">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Opis</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Zmiana</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700 text-white">
        {history.length === 0 ? (
          <tr>
            <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-center text-gray-400">Brak historii punktów.</td>
          </tr>
        ) : (
          history.map((item, index) => (
            <tr key={index} className={item.change_amount > 0 ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-900 hover:bg-gray-800'}>
              <td className="px-6 py-4 whitespace-nowrap">{item.description}</td>
              <td className={`px-6 py-4 whitespace-nowrap font-bold ${item.change_amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.change_amount > 0 ? '+' : ''}{item.change_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(item.created_at).toLocaleDateString()} — saldo: {item.points ?? '—'} pkt
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
 </div>

</div>
);
}