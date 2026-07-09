import { useCallback, useState } from "react";
import Main from "./Components/Main";
import TeamsPage from "./pages/TeamsPage";
import "./Components/style.css";

function App() {
  const [teamAddRequest, setTeamAddRequest] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);

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

  return (
    <>
      <Main
        onAddPokemonToTeam={handleAddPokemonToTeam}
        teamOptions={teamOptions}
      />
      <TeamsPage
        teamAddRequest={teamAddRequest}
        onTeamsChange={handleTeamsChange}
      />
    </>
  );
}

export default App;
