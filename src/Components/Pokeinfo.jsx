import { useEffect, useRef, useState } from "react";
import {
  MdAutoAwesome,
  MdPause,
  MdVolumeUp,
} from "react-icons/md";
import { getPokemonFallbackSprite } from "./pokemonArtwork";
import TYPE_COLORS from "./typeColors";

const MAX_STAT = 255;
const NEW_TEAM_VALUE = "__new_team__";

const Pokeinfo = ({
  data,
  onAddToTeam,
  teamOptions = [],
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState(NEW_TEAM_VALUE);
  const [showShiny, setShowShiny] = useState(false);
  const [isCryPlaying, setIsCryPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const firstOpenTeam = teamOptions.find((team) => !team.isFull);
    setSelectedTeamId(firstOpenTeam?.id ?? NEW_TEAM_VALUE);
  }, [teamOptions, data?.id]);

  useEffect(() => {
    setShowShiny(false);
    setIsCryPlaying(false);

    return () => {
      const audio = audioRef.current;
      if (!audio) return;

      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, [data?.id]);

  if (!data) return null;

  const defaultSprite = getPokemonFallbackSprite(data);
  const statTotal = data.stats.reduce((total, stat) => total + stat.base_stat, 0);
  const shinySprite = data.sprites?.front_shiny;
  const cryUrl = data.cries?.latest ?? data.cries?.legacy;
  const displayedImage = showShiny && shinySprite ? shinySprite : defaultSprite;

  const toggleCry = () => {
    if (!cryUrl) return;

    if (audioRef.current && isCryPlaying) {
      const audio = audioRef.current;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
      setIsCryPlaying(false);
      return;
    }

    const audio = new Audio(cryUrl);
    audioRef.current = audio;
    audio.onended = () => {
      audioRef.current = null;
      setIsCryPlaying(false);
    };
    audio.onerror = () => {
      audioRef.current = null;
      setIsCryPlaying(false);
    };
    setIsCryPlaying(true);
    audio.play().catch(() => {
      audioRef.current = null;
      setIsCryPlaying(false);
    });
  };

  return (
    <div className="detail-dossier">
      <div className="detail-heading">
        <span className="detail-kicker">Pokédex entry</span>
        <span className="detail-number">#{String(data.id).padStart(4, "0")}</span>
        <h1>{data.name}</h1>
        <div className="detail-type-badges">
          {data.types.map(({ type }) => {
            const color = TYPE_COLORS[type.name];
            return (
              <span
                key={type.name}
                className="type-badge"
                style={color ? { backgroundColor: color.bg, color: color.text } : undefined}
              >
                {type.name}
              </span>
            );
          })}
        </div>
      </div>
      <div className="pokemon-image-frame">
        {displayedImage ? (
          <img
            src={displayedImage}
            alt={`${data.name}${showShiny ? " shiny" : ""}`}
            className="pokemon-detail-image"
          />
        ) : (
          <div className="sprite-placeholder" style={{ width: "100%", height: "180px", fontSize: "3rem" }}>?</div>
        )}
      </div>
      <div className="detail-media-actions" aria-label="Pokémon media controls">
        <button
          type="button"
          onClick={toggleCry}
          disabled={!cryUrl}
          aria-label={`${isCryPlaying ? "Stop" : "Play"} ${data.name} cry`}
        >
          {isCryPlaying ? <MdPause /> : <MdVolumeUp />}
          <span>{isCryPlaying ? "Stop cry" : "Hear cry"}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowShiny((current) => !current)}
          disabled={!shinySprite}
          aria-pressed={showShiny}
          aria-label={`${showShiny ? "Show standard artwork for" : "Show front shiny for"} ${data.name}`}
        >
          <MdAutoAwesome />
          <span>{showShiny ? "Standard" : "Shiny"}</span>
        </button>
      </div>
      <div className="poke-meta">
        <span><small>Height</small>{(data.height / 10).toFixed(1)}m</span>
        <span><small>Weight</small>{(data.weight / 10).toFixed(1)}kg</span>
      </div>
      <h2 className="detail-section-title">Known abilities</h2>
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
        <div className="detail-stat-heading">
          <h2 className="detail-section-title">Base stats</h2>
          <span>Total {statTotal}</span>
        </div>
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
    </div>
  );
};

export default Pokeinfo;
