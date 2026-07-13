import TYPE_COLORS from "./typeColors";
import { getPokemonArtwork } from "./pokemonArtwork";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";

const Card = ({
  pokemon,
  loading,
  infoPokemon,
  pageSize = 10,
  favoriteIds = new Set(),
  onToggleFavorite,
}) => {
  if (loading && !pokemon.length) {
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
    <div className={`pokemon-grid${loading ? " pokemon-grid--loading" : ""}`}>
      {pokemon.map((item) => {
        const artwork = getPokemonArtwork(item);
        const isFavorite = favoriteIds.has(item.id);

        return (
          <div
            className={`card ${item.types[0].type.name}`}
            key={item.id}
            onClick={() => infoPokemon(item)}
          >
            <span className="pokemon-number">#{item.id}</span>
            {onToggleFavorite && (
              <button
                type="button"
                className={`card-favorite-button${isFavorite ? " is-favorite" : ""}`}
                aria-label={`${isFavorite ? "Remove" : "Add"} ${item.name} ${isFavorite ? "from" : "to"} favorites`}
                aria-pressed={isFavorite}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite(item);
                }}
              >
                {isFavorite ? <MdFavorite /> : <MdFavoriteBorder />}
              </button>
            )}
            {artwork ? (
              <img src={artwork} alt={item.name} />
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
        );
      })}
    </div>
  );
};

export default Card;
