import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function LoyaltyPoints() {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    api.get("/loyalty/points").then((res) => {
      setPoints(res.data.points);
    });
  }, []);

  return (
    <div className="container">
      <h1>Twoje punkty lojalnościowe</h1>
      <p>Masz: <strong>{points}</strong> punktów</p>
    </div>
  );
}
