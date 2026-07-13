import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { AiOutlineClose } from "react-icons/ai";
import { MdAutoAwesome } from "react-icons/md";
import teamEmblems from "../images/team-emblems.png";

// ── Persistence ───────────────────────────────────────────────
const STORAGE_KEY = "pokedex-teams";
const SLOT_COUNT = 6;

const normalizeTeamPokemon = (pokemon) => {
  if (!pokemon) return null;

  return {
    ...pokemon,
    shinySprite:
      pokemon.shinySprite ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`,
    isShiny: Boolean(pokemon.isShiny),
  };
};

const loadTeams = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved)) return [];

    return saved.map((team) => ({
      ...team,
      pokemon: Array.from({ length: SLOT_COUNT }, (_, index) =>
        normalizeTeamPokemon(team.pokemon?.[index])
      ),
    }));
  } catch {
    return [];
  }
};

const saveTeams = (teams) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch {
    // Teams still remain available for the current session.
  }
};

const generateId = () =>
  `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const emptyTeam = (name = "New Team") => ({
  id: generateId(),
  name,
  pokemon: Array(SLOT_COUNT).fill(null),
});

const toTeamPokemon = (pokemon) => ({
  id: pokemon.id,
  name: pokemon.name,
  sprite: pokemon.sprites.front_default,
  shinySprite: pokemon.sprites.front_shiny,
  isShiny: false,
  types: pokemon.types.map((t) => t.type.name),
});

// ── PokémonSlot ───────────────────────────────────────────────
const PokemonSlot = ({
  pokemon,
  isActive,
  onClick,
  onRemove,
  onToggleShiny,
}) => (
  <div
    className={`team-slot${isActive ? " team-slot--active" : ""}${pokemon ? " team-slot--filled" : ""}`}
    onClick={onClick}
    title={
      pokemon
        ? `${pokemon.name} — click to select`
        : "Click to add a Pokémon"
    }
  >
    {pokemon ? (
      <>
        <img
          src={pokemon.isShiny && pokemon.shinySprite ? pokemon.shinySprite : pokemon.sprite}
          alt={`${pokemon.name}${pokemon.isShiny ? " shiny" : ""}`}
        />
        <span className="team-slot-name">{pokemon.name}</span>
        <div className="team-slot-actions">
          <button
            type="button"
            className={`team-slot-icon team-slot-shiny${pokemon.isShiny ? " is-active" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleShiny();
            }}
            disabled={!pokemon.shinySprite}
            aria-pressed={pokemon.isShiny}
            aria-label={`${pokemon.isShiny ? "Show standard" : "Show shiny"} ${pokemon.name}`}
            title={pokemon.isShiny ? "Show standard sprite" : "Show shiny sprite"}
          >
            <MdAutoAwesome />
          </button>
          {isActive && (
            <button
              type="button"
              className="team-slot-icon team-slot-delete"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              aria-label={`Remove ${pokemon.name} from team`}
              title="Remove from team"
            >
              <AiOutlineClose />
            </button>
          )}
        </div>
      </>
    ) : (
      <span className="team-slot-empty">+</span>
    )}
  </div>
);

// ── TeamCard ──────────────────────────────────────────────────
const TeamCard = ({
  team,
  isEditing,
  isRenaming,
  renameValue,
  activeSlot,
  allNames,
  onToggleEdit,
  onDelete,
  onStartRename,
  onRenameChange,
  onCommitRename,
  onSlotClick,
  onAddPokemon,
  onRemovePokemon,
  onToggleShiny,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [addingPoke, setAddingPoke] = useState(false);
  const inputRef = useRef(null);

  // Filter suggestions from pre-loaded names
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    setSuggestions(
      allNames
        .filter((p) => p.name.startsWith(q))
        .slice(0, 12)
        .map((p) => ({
          name: p.name,
          id: p.url.split("/").filter(Boolean).at(-1),
        }))
    );
  }, [query, allNames]);

  // Focus search when a slot opens
  useEffect(() => {
    if (activeSlot !== null && isEditing && !team.pokemon[activeSlot]) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
    setQuery("");
    setSuggestions([]);
  }, [activeSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = async (suggestion) => {
    setAddingPoke(true);
    try {
      const resp = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${suggestion.id}`
      );
      const d = resp.data;
      onAddPokemon({
        id: d.id,
        name: d.name,
        sprite: d.sprites.front_default,
        shinySprite: d.sprites.front_shiny,
        isShiny: false,
        types: d.types.map((t) => t.type.name),
      });
    } catch {
      /* silently ignore */
    } finally {
      setAddingPoke(false);
      setQuery("");
      setSuggestions([]);
    }
  };

  const filled = team.pokemon.filter(Boolean).length;

  return (
    <div className={`team-card${isEditing ? " team-card--open" : ""}`}>
      {/* ── Header row ── */}
      <div className="team-card-header" onClick={onToggleEdit}>
        <div className="team-card-title-row">
          {isRenaming ? (
            <input
              className="team-rename-input"
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onCommitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") onCommitRename();
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="team-card-name-row">
              <span className="team-card-name">{team.name}</span>
              <button
                className="team-name-edit-btn"
                aria-label="Rename team"
                title="Rename team"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartRename();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="16"
                  width="16"
                  viewBox="0 -960 960 960"
                  fill="currentColor"
                >
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
                </svg>
              </button>
            </div>
          )}

          <button
            className="team-action-btn team-action-btn--danger"
            aria-label="Delete team"
            title="Delete team"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="18"
              width="18"
              viewBox="0 -960 960 960"
              fill="currentColor"
            >
              <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
            </svg>
          </button>
        </div>

        <span className="team-card-count">
          <span
            className="team-count-pip"
            style={{ "--filled": filled }}
          />
          {filled}/{SLOT_COUNT} Pokémon
        </span>
      </div>

      {/* ── Pokémon slots ── */}
      <div className="team-pokemon-row">
        {team.pokemon.map((poke, i) => (
          <PokemonSlot
            key={i}
            pokemon={poke}
            isActive={isEditing && activeSlot === i}
            onClick={(e) => {
              e.stopPropagation();
              if (!isEditing) onToggleEdit();
              onSlotClick(i, poke);
            }}
            onRemove={() => onRemovePokemon(i)}
            onToggleShiny={() => onToggleShiny(i)}
          />
        ))}
      </div>

      {/* ── Editor (expanded) ── */}
      {isEditing && (
        <div className="team-editor">
          {activeSlot === null ? (
            <p className="team-editor-hint">
              ↑ Click a slot to add or remove a Pokémon
            </p>
          ) : team.pokemon[activeSlot] ? (
            /* Filled slot — show remove option */
            <div className="slot-remove-panel">
              <img
                src={
                  team.pokemon[activeSlot].isShiny && team.pokemon[activeSlot].shinySprite
                    ? team.pokemon[activeSlot].shinySprite
                    : team.pokemon[activeSlot].sprite
                }
                alt={`${team.pokemon[activeSlot].name}${team.pokemon[activeSlot].isShiny ? " shiny" : ""}`}
                className="slot-remove-sprite"
              />
              <div className="slot-remove-info">
                <span className="slot-remove-name">
                  {team.pokemon[activeSlot].name}
                </span>
                <div className="slot-remove-types">
                  {team.pokemon[activeSlot].types.map((t) => (
                    <span key={t} className={`type-badge ${t}`}>{t}</span>
                  ))}
                </div>
              </div>
              <button
                className="slot-remove-btn"
                onClick={() => onRemovePokemon(activeSlot)}
              >
                Remove
              </button>
            </div>
          ) : (
            /* Empty slot — show search */
            <div className="slot-search-panel">
              <p className="slot-search-label">
                Adding to slot {activeSlot + 1}
              </p>
              <input
                ref={inputRef}
                className="slot-search-input"
                placeholder="Type a Pokémon name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {addingPoke && (
                <p className="slot-search-loading">Loading…</p>
              )}
              {suggestions.length > 0 && !addingPoke && (
                <div className="slot-search-results">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      className="slot-search-result"
                      onClick={() => handleSelect(s)}
                    >
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png`}
                        alt={s.name}
                      />
                      <span className="slot-search-result-name">
                        {s.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── TeamsPage ─────────────────────────────────────────────────
const TeamsPage = ({ teamAddRequest, onTeamsChange }) => {
  const [teams, setTeams] = useState(loadTeams);
  const [editingId, setEditingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeSlots, setActiveSlots] = useState({}); // teamId → slotIndex | null
  const [allNames, setAllNames] = useState([]);
  const [lastHandledAddRequest, setLastHandledAddRequest] = useState(null);

  useEffect(() => {
    axios
      .get("https://pokeapi.co/api/v2/pokemon?limit=2000")
      .then((r) => setAllNames(r.data.results))
      .catch(() => {});
  }, []);

  const persist = (next) => {
    setTeams(next);
    saveTeams(next);
  };

  useEffect(() => {
    onTeamsChange?.(
      teams.map((team) => {
        const filledSlots = team.pokemon.filter(Boolean).length;
        return {
          id: team.id,
          name: team.name,
          filledSlots,
          totalSlots: SLOT_COUNT,
          isFull: filledSlots >= SLOT_COUNT,
        };
      })
    );
  }, [teams, onTeamsChange]);

  useEffect(() => {
    if (!teamAddRequest || teamAddRequest.id === lastHandledAddRequest) return;

    const pokemon = toTeamPokemon(teamAddRequest.pokemon);
    let targetTeamId = null;
    let targetSlot = -1;
    let nextTeams = [...teams];

    if (!teamAddRequest.createNewTeam) {
      nextTeams = teams.map((team) => {
        if (targetTeamId) return team;
        if (teamAddRequest.targetTeamId && team.id !== teamAddRequest.targetTeamId) {
          return team;
        }

        const emptySlot = team.pokemon.findIndex((slot) => !slot);
        if (emptySlot === -1) return team;

        targetTeamId = team.id;
        targetSlot = emptySlot;
        const nextPokemon = [...team.pokemon];
        nextPokemon[emptySlot] = pokemon;
        return { ...team, pokemon: nextPokemon };
      });
    }

    if (!targetTeamId) {
      const newTeam = emptyTeam("New Team");
      newTeam.pokemon[0] = pokemon;
      targetTeamId = newTeam.id;
      targetSlot = 0;
      nextTeams.push(newTeam);
    }

    persist(nextTeams);
    setEditingId(targetTeamId);
    setActiveSlots((slots) => ({ ...slots, [targetTeamId]: targetSlot }));
    setLastHandledAddRequest(teamAddRequest.id);
    document.getElementById("teams")?.scrollIntoView?.({ behavior: "smooth" });
  }, [teamAddRequest, lastHandledAddRequest, teams]);

  const createTeam = () => {
    const team = emptyTeam("New Team");
    const next = [...teams, team];
    persist(next);
    setEditingId(team.id);
    setRenamingId(team.id);
    setRenameValue("New Team");
  };

  const deleteTeam = (id) => {
    persist(teams.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const startRename = (team) => {
    setRenamingId(team.id);
    setRenameValue(team.name);
  };

  const commitRename = (id) => {
    persist(
      teams.map((t) =>
        t.id === id ? { ...t, name: renameValue.trim() || t.name } : t
      )
    );
    setRenamingId(null);
  };

  const handleSlotClick = (teamId, slotIndex, currentPoke) => {
    if (currentPoke) {
      // Toggle "remove" panel: if already active, close; else open
      const current = activeSlots[teamId];
      setActiveSlots((s) => ({
        ...s,
        [teamId]: current === slotIndex ? null : slotIndex,
      }));
    } else {
      // Toggle search panel
      const current = activeSlots[teamId];
      setActiveSlots((s) => ({
        ...s,
        [teamId]: current === slotIndex ? null : slotIndex,
      }));
    }
  };

  const removePokemonFromSlot = (teamId, slotIndex) => {
    persist(
      teams.map((t) => {
        if (t.id !== teamId) return t;
        const pokes = [...t.pokemon];
        pokes[slotIndex] = null;
        return { ...t, pokemon: pokes };
      })
    );
    setActiveSlots((s) => ({ ...s, [teamId]: null }));
  };

  const addPokemon = (teamId, pokemon) => {
    const slotIndex = activeSlots[teamId];
    if (slotIndex === null || slotIndex === undefined) return;
    persist(
      teams.map((t) => {
        if (t.id !== teamId) return t;
        const pokes = [...t.pokemon];
        pokes[slotIndex] = pokemon;
        return { ...t, pokemon: pokes };
      })
    );
    setActiveSlots((s) => ({ ...s, [teamId]: null }));
  };

  const togglePokemonShiny = (teamId, slotIndex) => {
    persist(
      teams.map((team) => {
        if (team.id !== teamId) return team;
        const pokemon = [...team.pokemon];
        const selected = pokemon[slotIndex];
        if (!selected?.shinySprite) return team;

        pokemon[slotIndex] = { ...selected, isShiny: !selected.isShiny };
        return { ...team, pokemon };
      })
    );
  };

  return (
    <>
      <div className="teams-page" id="teams">
        <div className="teams-page-header">
          <div>
            <h1 className="teams-page-title">My Teams</h1>
            <p className="teams-page-subtitle">
              {teams.length === 0
                ? "No teams yet"
                : `${teams.length} ${teams.length === 1 ? "team" : "teams"} saved`}
            </p>
          </div>
          <button className="btn-primary" onClick={createTeam}>
            + New Team
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="teams-empty">
            <div className="teams-empty-icon">
              <img src={teamEmblems} alt="Three team emblems" />
            </div>
            <p className="teams-empty-title">No teams yet</p>
            <p className="teams-empty-sub">
              Build your first team of 6 Pokémon and save it for later.
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: "1.5rem" }}
              onClick={createTeam}
            >
              + Create your first team
            </button>
          </div>
        ) : (
          <div className="teams-list">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isEditing={editingId === team.id}
                isRenaming={renamingId === team.id}
                renameValue={renameValue}
                activeSlot={activeSlots[team.id] ?? null}
                allNames={allNames}
                onToggleEdit={() => {
                  setEditingId(editingId === team.id ? null : team.id);
                  setActiveSlots((s) => ({ ...s, [team.id]: null }));
                }}
                onDelete={() => deleteTeam(team.id)}
                onStartRename={() => startRename(team)}
                onRenameChange={setRenameValue}
                onCommitRename={() => commitRename(team.id)}
                onSlotClick={(slotIndex, poke) => {
                  if (poke) {
                    handleSlotClick(team.id, slotIndex, poke);
                  } else {
                    handleSlotClick(team.id, slotIndex, null);
                  }
                }}
                onAddPokemon={(pokemon) => addPokemon(team.id, pokemon)}
                onRemovePokemon={(slotIndex) => removePokemonFromSlot(team.id, slotIndex)}
                onToggleShiny={(slotIndex) => togglePokemonShiny(team.id, slotIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TeamsPage;
