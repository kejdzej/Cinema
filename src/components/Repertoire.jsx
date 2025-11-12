import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Repertoire = ({ movies }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSelectSession = (sessionId) => {
    if (!user) {
      toast.warning("🔐 Aby kupić bilet, zaloguj się lub zarejestruj!");
      navigate("/login");
      return;
    }

    navigate(`/buy/${sessionId}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-yellow-400 mb-4 text-center">🎬 REPERTUAR</h2>

      {movies.length === 0 ? (
        <p className="text-gray-300 text-center">Brak dostępnych seansów.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-yellow-400/20 transition-all"
            >
              <img
                src={movie.poster}
                alt={movie.title}
                className="rounded-xl mb-3 w-full h-64 object-cover"
              />
              <h3 className="text-lg font-bold text-white text-center mb-2">
                {movie.title}
              </h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {movie.sessions && movie.sessions.length > 0 ? (
                  movie.sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        user
                          ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                          : "bg-gray-600 text-gray-300 cursor-not-allowed"
                      }`}
                      disabled={!user}
                    >
                      {s.time}
                    </button>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">Brak seansów</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Repertoire;
