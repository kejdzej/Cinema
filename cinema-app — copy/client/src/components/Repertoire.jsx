import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Repertoire = ({ movies }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSelectSession = (sessionId) => {
    if (!user) {
      toast.error("Нужно войти в систему");
      navigate("/login");
    } else {
      navigate(`/buy/${sessionId}`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-yellow-400 mb-4">REPERTUAR</h2>
      <div className="grid grid-cols-4 gap-6">
        {movies.map((movie) => (
          <div key={movie.id} className="bg-gray-800 p-4 rounded-xl">
            <img src={movie.poster} alt={movie.title} className="rounded-xl mb-3" />
            <h3 className="text-lg font-bold text-white">{movie.title}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {movie.sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className="bg-yellow-400 px-3 py-1 rounded-lg font-bold hover:bg-yellow-500"
                >
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Repertoire;
