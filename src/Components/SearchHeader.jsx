import { useEffect, useRef, useState } from "react";
import { MdFavorite, MdKeyboardArrowDown } from "react-icons/md";
import PokedexLogo from "./PokedexLogo";

const formatName = (name = "") =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const SearchHeader = ({
  favorites = [],
  onSelectFavorite,
  onRemoveFavorite,
}) => {
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isFavoritesOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsFavoritesOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsFavoritesOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isFavoritesOpen]);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a href="#trainer-dashboard-title" className="header-logo" aria-label="Go to Trainer Field Desk">
          <PokedexLogo />
        </a>

        <div className="header-actions">
          <div className="header-console">
          <nav className="nav-tabs" aria-label="Primary navigation">
            <a href="#pokedex" className="nav-tab"><span aria-hidden="true">◉</span> Pokédex</a>
            <a href="#teams" className="nav-tab"><span aria-hidden="true">▦</span> My Teams</a>
          </nav>
          </div>

          <div className="header-favorites" ref={menuRef}>
            <button
              type="button"
              className={`header-favorites-toggle${isFavoritesOpen ? " is-open" : ""}`}
              aria-label={`Favorites, ${favorites.length} saved`}
              aria-expanded={isFavoritesOpen}
              aria-controls="header-favorites-list"
              onClick={() => setIsFavoritesOpen((open) => !open)}
            >
              <MdFavorite />
              <span className="header-favorites-label">Favorites</span>
              <small>{favorites.length}</small>
              <MdKeyboardArrowDown className="header-favorites-arrow" />
            </button>

            {isFavoritesOpen && (
              <div className="header-favorites-dropdown" id="header-favorites-list">
                <div className="header-favorites-heading">
                  <strong>Favorite Pokémon</strong>
                  <small>Saved on this device</small>
                </div>
                {favorites.length === 0 ? (
                  <p className="header-favorites-empty">Use a heart to add a Pokémon.</p>
                ) : (
                  <div className="header-favorites-list">
                    {favorites.map((pokemon) => (
                      <div className="header-favorite-item" key={pokemon.id}>
                        <button
                          type="button"
                          className="header-favorite-open"
                          onClick={() => {
                            onSelectFavorite?.(pokemon.name);
                            setIsFavoritesOpen(false);
                          }}
                          aria-label={`View ${formatName(pokemon.name)}`}
                        >
                          {pokemon.artwork || pokemon.sprite ? (
                            <img src={pokemon.artwork || pokemon.sprite} alt="" />
                          ) : (
                            <span className="header-favorite-placeholder">?</span>
                          )}
                          <span>{formatName(pokemon.name)}</span>
                        </button>
                        <button
                          type="button"
                          className="header-favorite-remove"
                          onClick={() => onRemoveFavorite?.(pokemon)}
                          aria-label={`Remove ${formatName(pokemon.name)} from favorites`}
                          title="Remove favorite"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SearchHeader;
