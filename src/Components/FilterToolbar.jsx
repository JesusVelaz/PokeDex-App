import TYPE_COLORS from "./typeColors";
import PokemonSearchBar from "./PokemonSearchBar";

const DEFAULT_PILL = { bg: "#b74555", text: "#fff6d9" };

const FilterToolbar = ({
  selectedType,
  currentPage,
  totalPages,
  totalPokemonCount,
  typeOptions,
  onTypeChange,
  pokemonName = "",
  onPokemonNameChange,
  onSearch,
  allPokemonNames = [],
  onSuggestionSelect,
}) => {
  const pillColor = TYPE_COLORS[selectedType] ?? DEFAULT_PILL;

  return (
    <div className="toolbar-strip">
      <div className="results-copy">
        <span
          className="summary-pill"
          style={{ backgroundColor: pillColor.bg, color: pillColor.text }}
        >
          {selectedType === "all" ? "All types" : `${selectedType} type`}
        </span>
        <p>
          Showing page {currentPage} of {totalPages} for {totalPokemonCount} Pokemon
        </p>
      </div>

      <div className="toolbar-search">
        <span className="toolbar-search-label">Search Pokémon</span>
        <PokemonSearchBar
          pokemonName={pokemonName}
          onPokemonNameChange={onPokemonNameChange}
          onSearch={onSearch}
          allPokemonNames={allPokemonNames}
          onSuggestionSelect={onSuggestionSelect}
        />
      </div>

      <div className="toolbar-controls">
        <label className="type-filter">
          <span>Filter by type</span>
          <select value={selectedType} onChange={onTypeChange}>
            <option value="all">All types</option>
            {typeOptions.map((type) => (
              <option key={type.name} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </label>

      </div>
    </div>
  );
};

export default FilterToolbar;
