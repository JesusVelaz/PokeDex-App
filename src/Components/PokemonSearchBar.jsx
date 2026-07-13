import { useRef, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

// Rank a name against the query: 0 = prefix, 1 = substring,
// 2 = subsequence (letters appear in order), -1 = no match.
const fuzzyRank = (name, query) => {
  if (name.startsWith(query)) return 0;
  if (name.includes(query)) return 1;
  let qi = 0;
  for (let i = 0; i < name.length && qi < query.length; i++) {
    if (name[i] === query[qi]) qi++;
  }
  return qi === query.length ? 2 : -1;
};

const PokemonSearchBar = ({
  pokemonName = "",
  onPokemonNameChange,
  onSearch,
  allPokemonNames = [],
  onSuggestionSelect,
  placeholder = "Search Pokémon",
  inputLabel = "Search Pokémon",
  buttonLabel = "Search",
  inputId,
  className = "",
  ButtonIcon = AiOutlineSearch,
  inputDisabled = false,
  suggestionsEnabled = true,
  inputAutoComplete = "off",
  onAnimationEnd,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  const suggestions =
    suggestionsEnabled && pokemonName.length > 0
      ? allPokemonNames
          .map((name) => ({ name, rank: fuzzyRank(name, pokemonName) }))
          .filter(({ rank }) => rank !== -1)
          .sort((a, b) => a.rank - b.rank || a.name.length - b.name.length)
          .slice(0, 8)
          .map(({ name }) => name)
      : [];

  const handleKeyDown = (e) => {
    if (suggestionsEnabled && e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (suggestionsEnabled && e.key === "ArrowUp") {
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

  const handleSubmit = () => {
    onSearch();
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  return (
    <div
      className={`search-container${className ? ` ${className}` : ""}`}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="autocomplete-wrapper">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          disabled={inputDisabled}
          autoComplete={inputAutoComplete}
          placeholder={placeholder}
          aria-label={inputLabel}
          value={capitalize(pokemonName)}
          onChange={(e) => {
            onPokemonNameChange(e);
            setShowSuggestions(suggestionsEnabled);
            setActiveIndex(-1);
          }}
          onFocus={() => setShowSuggestions(suggestionsEnabled)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
        />
        {suggestionsEnabled && showSuggestions && suggestions.length > 0 && (
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
      <button type="button" onClick={handleSubmit} aria-label={buttonLabel}>
        <ButtonIcon />
      </button>
    </div>
  );
};

export default PokemonSearchBar;
