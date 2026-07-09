import { useEffect, useState } from "react";
import { getPokemonArtwork, getPokemonFallbackSprite } from "./pokemonArtwork";

const MAX_STAT = 255;
const NEW_TEAM_VALUE = "__new_team__";

const Pokeinfo = ({ data, onAddToTeam, teamOptions = [] }) => {
  const [artworkStatus, setArtworkStatus] = useState("loading");
  const [selectedTeamId, setSelectedTeamId] = useState(NEW_TEAM_VALUE);

  useEffect(() => {
    if (!data) return;

    const highResArtwork = getPokemonArtwork(data);
    const fallbackArtwork = getPokemonFallbackSprite(data);

    if (!highResArtwork || highResArtwork === fallbackArtwork) {
      setArtworkStatus("ready");
      return;
    }

    setArtworkStatus("loading");
    const image = new Image();
    image.src = highResArtwork;
    image.onload = () => setArtworkStatus("ready");
    image.onerror = () => setArtworkStatus("failed");

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [data]);

  useEffect(() => {
    const firstOpenTeam = teamOptions.find((team) => !team.isFull);
    setSelectedTeamId(firstOpenTeam?.id ?? NEW_TEAM_VALUE);
  }, [teamOptions, data?.id]);

  if (!data) return null;

  const highResArtwork = getPokemonArtwork(data);
  const fallbackArtwork = getPokemonFallbackSprite(data);
  const artwork = artworkStatus === "ready" ? highResArtwork : fallbackArtwork;
  const isArtworkLoading = artworkStatus === "loading" && highResArtwork !== fallbackArtwork;

  return (
    <>
      <h1>{data.name}</h1>
      <div className={`pokemon-image-frame${isArtworkLoading ? " pokemon-image-frame--loading" : ""}`}>
        {artwork ? (
          <img src={artwork} alt={data.name} className="pokemon-detail-image" />
        ) : (
          <div className="sprite-placeholder" style={{ width: "100%", height: "180px", fontSize: "3rem" }}>?</div>
        )}
      </div>
      <div className="poke-meta">
        <span>Height: {(data.height / 10).toFixed(1)}m</span>
        <span>Weight: {(data.weight / 10).toFixed(1)}kg</span>
      </div>
      <div className="abilities">
        {data.abilities.map((poke) => (
          <div
            key={poke.ability.name}
            className={`group ${data.types[0].type.name}`}
          >
            <h2>{poke.ability.name}</h2>
          </div>
        ))}
      </div>
      <div className="base-stat">
        {data.stats.map((poke) => (
          <div key={poke.stat.name}>
            <h3 className="pokemon-stat-display">
              {poke.stat.name}: {poke.base_stat}
            </h3>
            <div className="stat-bar-container">
              <div
                className="stat-bar"
                style={{ width: `${(poke.base_stat / MAX_STAT) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {onAddToTeam && (
        <div className="add-to-team-actions">
          {teamOptions.length > 0 && (
            <label className="team-select-label">
              Select Team
              <select
                className="team-select"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id} disabled={team.isFull}>
                    {team.name} ({team.filledSlots}/{team.totalSlots})
                  </option>
                ))}
                <option value={NEW_TEAM_VALUE}>New Team</option>
              </select>
            </label>
          )}
          <button
            type="button"
            className="add-to-team-button"
            onClick={() =>
              onAddToTeam(
                data,
                selectedTeamId === NEW_TEAM_VALUE
                  ? { createNewTeam: true }
                  : { teamId: selectedTeamId }
              )
            }
          >
            + Add to Team
          </button>
        </div>
      )}
    </>
  );
};

export default Pokeinfo;
