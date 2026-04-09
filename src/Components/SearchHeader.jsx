import { useRef, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const SearchHeader = ({
  pokemonName,
  onPokemonNameChange,
  onSearch,
  allPokemonNames,
  onSuggestionSelect,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  const suggestions =
    pokemonName.length > 0
      ? allPokemonNames.filter((name) => name.startsWith(pokemonName)).slice(0, 8)
      : [];

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        onSuggestionSelect(suggestions[activeIndex]);
      } else {
        onSearch();
      }
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (name) => {
    onSuggestionSelect(name);
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  return (
    <div className="app-header">
      <div className="header-logo">
        <img src={`${process.env.PUBLIC_URL}/images/headers.png`} alt="PokéDex" />
      </div>
      <div className="search-container">
        <div className="autocomplete-wrapper">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Pokémon"
            value={capitalize(pokemonName)}
            onChange={(e) => {
              onPokemonNameChange(e);
              setShowSuggestions(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="autocomplete-dropdown">
              {suggestions.map((name, i) => (
                <li
                  key={name}
                  className={`autocomplete-item${i === activeIndex ? " active" : ""}`}
                  onMouseDown={() => handleSelect(name)}
                >
                  {capitalize(name)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={onSearch} aria-label="Search">
          <AiOutlineSearch />
        </button>
      </div>
    </div>
  );
};

export default SearchHeader;
