import { useCallback, useState } from "react";
import Main from "./Components/Main";
import TeamsPage from "./pages/TeamsPage";
import { getPokemonArtwork } from "./Components/pokemonArtwork";
import "./Components/style.css";

const FAVORITES_STORAGE_KEY = "pokedex-favorites:v1";

const loadFavorites = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Favorites still remain available for the current session.
  }
};

const toFavoritePokemon = (pokemon) => ({
  id: pokemon.id,
  name: pokemon.name,
  artwork: getPokemonArtwork(pokemon),
  sprite: pokemon.sprites?.front_default ?? null,
  types: pokemon.types?.map(({ type }) => type.name) ?? [],
});

function App() {
  const [teamAddRequest, setTeamAddRequest] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [favorites, setFavorites] = useState(loadFavorites);

  const handleAddPokemonToTeam = (pokemon, target = {}) => {
    setTeamAddRequest({
      id: `${pokemon.id}-${Date.now()}`,
      pokemon,
      targetTeamId: target.teamId,
      createNewTeam: target.createNewTeam,
    });
  };

  const handleTeamsChange = useCallback((teams) => {
    setTeamOptions(teams);
  }, []);

  const handleToggleFavorite = useCallback((pokemon) => {
    setFavorites((current) => {
      const exists = current.some((favorite) => favorite.id === pokemon.id);
      const next = exists
        ? current.filter((favorite) => favorite.id !== pokemon.id)
        : [...current, toFavoritePokemon(pokemon)];
      saveFavorites(next);
      return next;
    });
  }, []);

  return (
    <>
      <Main
        onAddPokemonToTeam={handleAddPokemonToTeam}
        teamOptions={teamOptions}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />
      <TeamsPage
        teamAddRequest={teamAddRequest}
        onTeamsChange={handleTeamsChange}
      />
    </>
  );
}

export default App;
