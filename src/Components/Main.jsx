import { useEffect, useState } from "react";
import Card from "./Card";
import axios from "axios";
import SearchHeader from "./SearchHeader";
import FilterToolbar from "./FilterToolbar";
import PaginationControls from "./PaginationControls";
import PokemonDetailPanel from "./PokemonDetailPanel";

const POKEMON_API = "https://pokeapi.co/api/v2/pokemon";
const TYPE_API = "https://pokeapi.co/api/v2/type";
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

const Main = () => {
  const [pokeData, setPokeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pokeDex, setPokeDex] = useState(null);
  const [pokemonName, setPokemonName] = useState("");
  const [allPokemonNames, setAllPokemonNames] = useState([]);
  const [error, setError] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [typeOptions, setTypeOptions] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [typePokemonRefs, setTypePokemonRefs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPokemonCount, setTotalPokemonCount] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const handleChange = (e) => {
    setPokemonName(e.target.value.toLowerCase());
    setSearchError(null);
  };

  const closePokemon = () => setPokeDex(null);

  const searchPokemon = async (nameOverride) => {
    const query = typeof nameOverride === "string" ? nameOverride : pokemonName;
    if (!query.trim()) return;
    try {
      const resp = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query}`);
      setPokeDex(resp.data);
      setSearchError(null);
    } catch {
      setSearchError(`Pokémon "${query}" not found.`);
      setPokeDex(null);
    }
  };

  const handleSuggestionSelect = (name) => {
    setPokemonName(name);
    setSearchError(null);
    searchPokemon(name);
  };

  useEffect(() => {
    axios
      .get(`${POKEMON_API}?limit=2000&offset=0`)
      .then((res) => setAllPokemonNames(res.data.results.map((p) => p.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTypes = async () => {
      try {
        const res = await axios.get(TYPE_API);
        if (!isMounted) return;

        const filteredTypes = res.data.results.filter(
          ({ name }) => name !== "unknown" && name !== "shadow"
        );
        setTypeOptions(filteredTypes);
      } catch {
        if (!isMounted) return;
        setError("Failed to load Pokémon types. Please refresh and try again.");
      }
    };

    loadTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTypePokemon = async () => {
      if (selectedType === "all") {
        setTypePokemonRefs([]);
        setCurrentPage(1);
        return;
      }

      setLoading(true);
      setError(null);
      setTypePokemonRefs(null);
      setCurrentPage(1);

      try {
        const res = await axios.get(`${TYPE_API}/${selectedType}`);
        if (!isMounted) return;

        const refs = res.data.pokemon.map(({ pokemon }) => pokemon);
        setTypePokemonRefs(refs);
        setTotalPokemonCount(refs.length);
        setTotalPages(Math.max(1, Math.ceil(refs.length / pageSize)));
      } catch {
        if (!isMounted) return;
        setError("Failed to load Pokémon for that type. Please try another filter.");
        setTypePokemonRefs([]);
        setTotalPokemonCount(0);
        setPokeData([]);
        setLoading(false);
      }
    };

    loadTypePokemon();

    return () => {
      isMounted = false;
    };
  }, [selectedType, pageSize]);

  useEffect(() => {
    let isMounted = true;

    const loadPokemonPage = async () => {
      if (selectedType !== "all" && typePokemonRefs === null) return;

      setLoading(true);
      setError(null);

      try {
        let pageEntries = [];

        if (selectedType === "all") {
          const offset = (currentPage - 1) * pageSize;
          const res = await axios.get(`${POKEMON_API}?offset=${offset}&limit=${pageSize}`);
          if (!isMounted) return;

          setTotalPokemonCount(res.data.count);
          setTotalPages(Math.max(1, Math.ceil(res.data.count / pageSize)));
          pageEntries = res.data.results;
        } else {
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          setTotalPokemonCount(typePokemonRefs.length);
          setTotalPages(Math.max(1, Math.ceil(typePokemonRefs.length / pageSize)));
          pageEntries = typePokemonRefs.slice(start, end);
        }

        const details = await Promise.all(pageEntries.map((item) => axios.get(item.url)));
        if (!isMounted) return;

        const sorted = details.map((response) => response.data).sort((a, b) => a.id - b.id);
        setPokeData(sorted);
      } catch {
        if (!isMounted) return;
        setError("Failed to load Pokémon. Please try again.");
        setPokeData([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPokemonPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedType, typePokemonRefs, pageSize]);

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    if (safePage === currentPage) return;

    setPokeData([]);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTypeChange = (e) => {
    const nextType = e.target.value;

    setSelectedType(nextType);
    setTypePokemonRefs(nextType === "all" ? [] : null);
    setCurrentPage(1);
    setPokeDex(null);
    setPokeData([]);
  };

  const handlePageSizeChange = (e) => {
    const nextPageSize = Number(e.target.value);

    setPageSize(nextPageSize);
    setCurrentPage(1);
    setPokeData([]);
  };

  return (
    <>
      <SearchHeader
        pokemonName={pokemonName}
        onPokemonNameChange={handleChange}
        onSearch={searchPokemon}
        allPokemonNames={allPokemonNames}
        onSuggestionSelect={handleSuggestionSelect}
      />

      {searchError && <div className="error-banner">{searchError}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="container">
        <div className="left-content">
          <FilterToolbar
            selectedType={selectedType}
            currentPage={currentPage}
            totalPages={totalPages}
            totalPokemonCount={totalPokemonCount}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            typeOptions={typeOptions}
            onTypeChange={handleTypeChange}
            onPageSizeChange={handlePageSizeChange}
          />

          <Card
            pokemon={pokeData}
            loading={loading}
            infoPokemon={(poke) => setPokeDex(poke)}
            pageSize={pageSize}
          />

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onGoToPage={goToPage}
          />
        </div>

        <PokemonDetailPanel pokemon={pokeDex} onClose={closePokemon} />
      </div>
    </>
  );
};

export default Main;
