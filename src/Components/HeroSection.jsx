import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FEATURED = [
  { id: 6,   name: "Charizard",  type: "fire",    bg: "#F08030" },
  { id: 149, name: "Dragonite",  type: "dragon",  bg: "#7038F8" },
  { id: 150, name: "Mewtwo",     type: "psychic", bg: "#F85888" },
  { id: 445, name: "Garchomp",   type: "dragon",  bg: "#7038F8" },
  { id: 384, name: "Rayquaza",   type: "dragon",  bg: "#7038F8" },
  { id: 248, name: "Tyranitar",  type: "rock",    bg: "#B8A038" },
];

const artworkUrl = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const HeroSection = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % FEATURED.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const current = FEATURED[index];

  const navigate = useNavigate();
  const goToPokedex = () => navigate("/pokedex");
  const goToTeams = () => navigate("/teams");

  return (
    <section className="hero-section">
      <div className="hero-bg" />
      <div className="hero-pokeball hero-pokeball-1" />
      <div className="hero-pokeball hero-pokeball-2" />

      <div className="hero-content">
        {/* ── Left copy ── */}
        <div className="hero-left">
          <span className="hero-eyebrow">★ The Complete Pokémon Database</span>

          <h1 className="hero-title">
            Explore
            <br />
            The&nbsp;<em>Pokédex</em>
          </h1>

          <p className="hero-subtitle">
            Discover every Pokémon across all generations. Browse stats,
            abilities, and types — from Bulbasaur to the latest legends.
          </p>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <span className="hero-stat-number">1,025+</span>
              <span className="hero-stat-label">Pokémon</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">18</span>
              <span className="hero-stat-label">Types</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">9</span>
              <span className="hero-stat-label">Generations</span>
            </div>
          </div>

          <div className="hero-cta">
            <button className="btn-primary" onClick={goToPokedex}>
              Browse Pokédex ↓
            </button>
            <button className="btn-secondary" onClick={goToTeams}>
              Create teams →
            </button>
          </div>
        </div>

        {/* ── Right showcase ── */}
        <div className="hero-right">
          {/* Dot indicators */}
          <div className="hero-dots">
            {FEATURED.map((_, i) => (
              <button
                key={i}
                className={`hero-dot${i === index ? " active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Show ${FEATURED[i].name}`}
              />
            ))}
          </div>

          <div className="hero-pokemon-ring" />
          <div className="hero-pokemon-ring" />

          <img
            key={current.id}
            src={artworkUrl(current.id)}
            alt={current.name}
            className="hero-pokemon-image"
          />

          <div className="hero-pokemon-info">
            <span className="hero-pokemon-info-name">{current.name}</span>
            <span
              className="hero-pokemon-info-type"
              style={{ backgroundColor: current.bg }}
            >
              {current.type}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
