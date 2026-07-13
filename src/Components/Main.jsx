import { useEffect, useRef, useState } from "react";
import Card from "./Card";
import axios from "axios";
import SearchHeader from "./SearchHeader";
import FilterToolbar from "./FilterToolbar";
import PaginationControls from "./PaginationControls";
import PokemonDetailPanel from "./PokemonDetailPanel";
import Hero from "./Hero";
import { getPokemonArtwork } from "./pokemonArtwork";
import { getDailyPokemon } from "./dailyEncounter";

const POKEMON_API = "https://pokeapi.co/api/v2/pokemon";
const TYPE_API = "https://pokeapi.co/api/v2/type";

export const getGridLayout = (
  width = window.innerWidth,
  height = window.innerHeight
) => {
  const columns = width > 1200 ? 4 : width > 900 ? 3 : 2;
  // Mobile browser chrome changes innerHeight while the user scrolls. Keep
  // phone pagination stable so Safari's toolbar cannot remove a grid row.
  const rows = width <= 600 ? 3 : height >= 820 ? 3 : height >= 620 ? 2 : 1;

  return { columns, rows, pageSize: columns * rows };
};

const Main = ({
  onAddPokemonToTeam,
  teamOptions = [],
  favorites = [],
  onToggleFavorite,
}) => {
  const [pokeData, setPokeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pokeDex, setPokeDex] = useState(null);
  const [pokemonName, setPokemonName] = useState("");
  const [allPokemonNames, setAllPokemonNames] = useState([]);
  const [heroPokemon, setHeroPokemon] = useState([]);
  const [error, setError] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [typeOptions, setTypeOptions] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [typePokemonRefs, setTypePokemonRefs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPokemonCount, setTotalPokemonCount] = useState(0);
  const [gridLayout, setGridLayout] = useState(getGridLayout);
  const previousPageSize = useRef(gridLayout.pageSize);
  const { pageSize } = gridLayout;
  const favoriteIds = new Set(favorites.map((favorite) => favorite.id));

  useEffect(() => {
    let resizeFrame;

    const updateGridLayout = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const nextLayout = getGridLayout();
        setGridLayout((currentLayout) =>
          currentLayout.columns === nextLayout.columns &&
          currentLayout.rows === nextLayout.rows
            ? currentLayout
            : nextLayout
        );
      });
    };

    window.addEventListener("resize", updateGridLayout);
    return () => {
      window.removeEventListener("resize", updateGridLayout);
      cancelAnimationFrame(resizeFrame);
    };
  }, []);

  useEffect(() => {
    const oldPageSize = previousPageSize.current;
    if (oldPageSize === pageSize) return;

    setCurrentPage((page) =>
      Math.floor(((page - 1) * oldPageSize) / pageSize) + 1
    );
    setPokeData([]);
    previousPageSize.current = pageSize;
  }, [pageSize]);

  const handleChange = (e) => {
    setPokemonName(e.target.value.toLowerCase());
    setSearchError(null);
  };

  const closePokemon = () => setPokeDex(null);

  const getPageForPokemon = (pokemon) => {
    const name = pokemon.name.toLowerCase();

    if (selectedType !== "all" && Array.isArray(typePokemonRefs)) {
      const typeIndex = typePokemonRefs.findIndex((item) => item.name === name);
      if (typeIndex !== -1) {
        return {
          page: Math.floor(typeIndex / pageSize) + 1,
          shouldResetType: false,
        };
      }
    }

    const allPokemonIndex = allPokemonNames.indexOf(name);
    if (allPokemonIndex !== -1) {
      return {
        page: Math.floor(allPokemonIndex / pageSize) + 1,
        shouldResetType: selectedType !== "all",
      };
    }

    return {
      page: Math.max(1, Math.ceil(pokemon.id / pageSize)),
      shouldResetType: selectedType !== "all",
    };
  };

  const searchPokemon = async (nameOverride) => {
    const query =
      typeof nameOverride === "string" ? nameOverride : pokemonName;
    if (!query.trim()) return;
    try {
      const normalizedQuery = query.trim().toLowerCase();
      const resp = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${normalizedQuery}`
      );
      const pageMatch = getPageForPokemon(resp.data);

      if (pageMatch.shouldResetType) {
        setSelectedType("all");
        setTypePokemonRefs([]);
      }

      setCurrentPage(pageMatch.page);
      setPokeDex(resp.data);
      setSearchError(null);
      document.getElementById("pokedex")?.scrollIntoView?.({ behavior: "smooth" });
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
      .then((res) => {
        const results = res.data.results;
        setAllPokemonNames(results.map((p) => p.name));

        setHeroPokemon(getDailyPokemon(results));
      })
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
  }, [selectedType]);

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

  useEffect(() => {
    pokeData.forEach((pokemon) => {
      const artwork = getPokemonArtwork(pokemon);
      if (!artwork) return;

      const image = new Image();
      image.src = artwork;
    });
  }, [pokeData]);

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    if (safePage === currentPage) return;

    setCurrentPage(safePage);
    document.getElementById("pokedex")?.scrollIntoView?.({ behavior: "smooth" });
  };

  const handleTypeChange = (e) => {
    const nextType = e.target.value;

    setSelectedType(nextType);
    setTypePokemonRefs(nextType === "all" ? [] : null);
    setCurrentPage(1);
    setPokeDex(null);
    setPokeData([]);
  };

  return (
    <>
      <SearchHeader
        favorites={favorites}
        onSelectFavorite={handleSuggestionSelect}
        onRemoveFavorite={onToggleFavorite}
      />

      <Hero
        totalSpeciesCount={allPokemonNames.length}
        teamOptions={teamOptions}
        heroPokemon={heroPokemon}
        allPokemonNames={allPokemonNames}
        onSelectPokemon={handleSuggestionSelect}
      />

      {searchError && <div className="error-banner">{searchError}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div id="pokedex" className="pokedex-section">
        <div className="pokedex-header">
          <h2 className="pokedex-title">Pokédex</h2>
        </div>

        <div className="container">
          <FilterToolbar
            selectedType={selectedType}
            currentPage={currentPage}
            totalPages={totalPages}
            totalPokemonCount={totalPokemonCount}
            typeOptions={typeOptions}
            onTypeChange={handleTypeChange}
            pokemonName={pokemonName}
            onPokemonNameChange={handleChange}
            onSearch={searchPokemon}
            allPokemonNames={allPokemonNames}
            onSuggestionSelect={handleSuggestionSelect}
          />

          <Card
            pokemon={pokeData}
            loading={loading}
            infoPokemon={(poke) => setPokeDex(poke)}
            pageSize={pageSize}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
          />

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onGoToPage={goToPage}
          />

          <PokemonDetailPanel
            pokemon={pokeDex}
            onClose={closePokemon}
            onAddToTeam={onAddPokemonToTeam}
            teamOptions={teamOptions}
          />
        </div>
      </div>

    </>
  );
};

export default Main;
