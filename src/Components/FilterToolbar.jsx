import TYPE_COLORS from "./typeColors";

const DEFAULT_PILL = { bg: "#b74555", text: "#fff6d9" };

const FilterToolbar = ({
  selectedType,
  currentPage,
  totalPages,
  totalPokemonCount,
  pageSize,
  pageSizeOptions,
  typeOptions,
  onTypeChange,
  onPageSizeChange,
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

        <label className="type-filter">
          <span>Cards per page</span>
          <select value={pageSize} onChange={onPageSizeChange}>
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default FilterToolbar;
