import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const slides = [
  {
    title: "Lilo & Stitch",
    desc: "Pełna humoru i ciepła opowieść o przyjaźni między dziewczynką i kosmitą.",
    img: "/posters/lilo-stitch.jpg",
    button: "Kup bilet"
  },
  {
    title: "Venom",
    desc: "Ekscytująca opowieść o antybohaterze, który łączy się z symbiontem.",
    img: "/posters/venom.jpg",
    button: "Kup bilet"
  },
  {
    title: "Super oferta Popcorn Bar",
    desc: "Tylko teraz! Duży popcorn + napój w promocyjnej cenie.",
    img: "/posters/popcorn.jpg",
    button: "Sprawdź ofertę"
  }
];

export default function SliderHero() {
  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1
  };

  return (
    <div className="slider-container">
      <Slider {...settings}>
        {slides.map((s, i) => (
          <div key={i} className="slide">
            <img src={s.img} alt={s.title} className="slide-img" />
            <div className="slide-overlay">
              <h2>{s.title}</h2>
              <p>{s.desc}</p>
              <button className="btn">{s.button}</button>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}
