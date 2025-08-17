import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const MovieSlider = ({ movies }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <Slider {...settings}>
      {movies.map((movie) => (
        <div key={movie.id} className="flex p-6 bg-dark">
          <img src={movie.poster} alt={movie.title} className="w-1/2 rounded-xl" />
          <div className="w-1/2 p-4 bg-white rounded-xl">
            <h2 className="text-xl font-bold">{movie.title}</h2>
            <p><b>Gatunek:</b> {movie.genre}</p>
            <p><b>Reżyser:</b> {movie.director}</p>
            <p><b>Aktorzy:</b> {movie.actors}</p>
            <p><b>Czas trwania:</b> {movie.duration} min</p>
            <p><b>Premiera:</b> {movie.release_date}</p>
            <p>{movie.description}</p>
            <button className="mt-4 bg-yellow-400 px-4 py-2 rounded-lg font-bold hover:bg-yellow-500">
              Kup bilet
            </button>
          </div>
        </div>
      ))}
    </Slider>
  );
};

export default MovieSlider;
