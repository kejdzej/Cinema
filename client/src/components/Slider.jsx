import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { api } from "../services/api.js";

export default function SliderHero() {
  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Pobierz filmy i seanse z bazy
    Promise.all([
      api.get('/movies').catch(() => ({ data: [] })),
      api.get('/sessions').catch(() => ({ data: [] }))
    ]).then(([moviesRes, sessionsRes]) => {
      setMovies(moviesRes.data || []);
      setSessions(sessionsRes.data || []);
    });
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplaySpeed: 4000
  };

  // Reklamy Popcorn Baru
  const promotions = [
    {
      id: 'popcorn-promo',
      title: "Super oferta Popcorn Bar",
      desc: "Tylko teraz! Duży popcorn + napój w promocyjnej cenie.",
      img: "/posters/popcorn.jpg",
      button: "Sprawdź ofertę",
      type: 'promotion',
      link: '#popcorn'
    },
    {
      id: 'loyalty-promo',
      title: "Program lojalnościowy",
      desc: "Zbieraj punkty i wymieniaj je na nagrody!",
      img: "/posters/zestaw.jpg", // Użyj zestaw.jpg jako okładka (zestaw produktów = nagrody)
      // Alternatywy: "/posters/popcorn.jpg" lub gradient (patrz poniżej)
      button: "Dowiedz się więcej",
      type: 'promotion',
      link: '/loyalty',
      useGradient: false // Ustaw na true jeśli chcesz użyć gradientu zamiast obrazu
    }
  ];

  // Przygotuj slajdy z wszystkich filmów z bazy
  const movieSlides = movies.map(movie => {
    // Znajdź najbliższy seans (jeśli istnieje)
    const upcomingSessions = sessions
      .filter(s => s.movie_id === movie.id && new Date(s.datetime) >= new Date())
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    const nextSession = upcomingSessions[0];
    
    return {
      id: movie.id,
      title: movie.title,
      desc: movie.description ? movie.description.substring(0, 100) + '...' : 'Zobacz ten film w naszym kinie!',
      img: movie.poster || '/posters/default.jpg',
      button: nextSession ? "Kup bilet" : "Zobacz więcej",
      sessionId: nextSession?.id,
      type: 'movie'
    };
  });

  // Połącz filmy z reklamami (co 3-4 filmy dodaj reklamę)
  const allSlides = [];
  movieSlides.forEach((movie, index) => {
    allSlides.push(movie);
    // Dodaj reklamę co 3 filmy
    if ((index + 1) % 3 === 0 && promotions.length > 0) {
      const promoIndex = Math.floor((index / 3) % promotions.length);
      allSlides.push(promotions[promoIndex]);
    }
  });

  // Jeśli brak filmów, pokaż tylko reklamy
  if (allSlides.length === 0 && promotions.length > 0) {
    allSlides.push(...promotions);
  }

  // Jeśli nadal brak slajdów, zwróć null
  if (allSlides.length === 0) {
    return null;
  }

  const handleSlideClick = (slide) => {
    if (slide.type === 'promotion') {
      if (slide.link.startsWith('#')) {
        // Scroll do sekcji na stronie
        const element = document.querySelector(slide.link);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Nawigacja do strony
        navigate(slide.link);
      }
    } else if (slide.sessionId) {
      navigate(`/reservation/${slide.sessionId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="slider-container" style={{ marginBottom: '40px' }}>
      <Slider {...settings}>
        {allSlides.map((s, i) => (
          <div key={s.id || i} className="slide">
            {s.useGradient ? (
              // Gradient dla programu lojalnościowego
              <div 
                className="slide-img"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <img 
                src={s.img} 
                alt={s.title} 
                className="slide-img"
                onError={(e) => {
                  // Fallback do gradientu jeśli obraz nie istnieje
                  if (s.type === 'promotion' && s.id === 'loyalty-promo') {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';
                  } else {
                    e.target.src = '/posters/default.jpg';
                  }
                }}
              />
            )}
            <div className="slide-overlay">
              <h2>{s.title}</h2>
              <p>{s.desc}</p>
              <button 
                className="btn" 
                onClick={() => handleSlideClick(s)}
              >
                {s.button}
              </button>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}
