import TYPE_COLORS from "./typeColors";

const Card = ({ pokemon, loading, infoPokemon, pageSize = 10 }) => {
  if (loading) {
    return (
      <div className="pokemon-grid" role="status" aria-live="polite" aria-label="Loading Pokémon">
        {Array.from({ length: pageSize }).map((_, i) => (
          <div key={i} className="card card-skeleton">
            <div className="skeleton skeleton-number" />
            <div className="skeleton skeleton-image" />
            <div className="skeleton skeleton-name" />
            <div className="skeleton skeleton-badges" />
          </div>
        ))}
      </div>
    );
  }

  if (!pokemon.length) {
    return <p className="loading-text">No Pokémon match this filter.</p>;
  }

  return (
    <div className="pokemon-grid">
      {pokemon.map((item) => (
        <div
          className={`card ${item.types[0].type.name}`}
          key={item.id}
          onClick={() => infoPokemon(item)}
        >
          <span className="pokemon-number">#{item.id}</span>
          {item.sprites.front_default ? (
            <img src={item.sprites.front_default} alt={item.name} />
          ) : (
            <div className="sprite-placeholder" aria-label={`No image for ${item.name}`}>?</div>
          )}
          <h2 className="grid-pokemon-name">{item.name}</h2>
          <div className="type-badges">
            {item.types.map((t) => {
              const color = TYPE_COLORS[t.type.name];
              return (
                <span
                  key={t.type.name}
                  className="type-badge"
                  style={color ? { backgroundColor: color.bg, color: color.text } : undefined}
                >
                  {t.type.name}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Card;
