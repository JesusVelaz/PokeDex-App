import { useState, useEffect, useRef } from "react";
import axios from "axios";
import SearchHeader from "../Components/SearchHeader";

// ── Persistence ───────────────────────────────────────────────
const STORAGE_KEY = "pokedex-teams";
const SLOT_COUNT = 6;

const loadTeams = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTeams = (teams) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));

const generateId = () =>
  `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const emptyTeam = (name = "New Team") => ({
  id: generateId(),
  name,
  pokemon: Array(SLOT_COUNT).fill(null),
});

// ── PokémonSlot ───────────────────────────────────────────────
const PokemonSlot = ({ pokemon, isActive, onClick }) => (
  <div
    className={`team-slot${isActive ? " team-slot--active" : ""}${pokemon ? " team-slot--filled" : ""}`}
    onClick={onClick}
    title={
      pokemon
        ? `${pokemon.name} — click to remove`
        : "Click to add a Pokémon"
    }
  >
    {pokemon ? (
      <>
        <img src={pokemon.sprite} alt={pokemon.name} />
        {isActive && <div className="team-slot-remove">✕</div>}
        <span className="team-slot-name">{pokemon.name}</span>
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
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [addingPoke, setAddingPoke] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

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

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

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
        <div className="team-card-meta">
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
            <span className="team-card-name">{team.name}</span>
          )}
          <span className="team-card-count">
            <span
              className="team-count-pip"
              style={{ "--filled": filled }}
            />
            {filled}/{SLOT_COUNT} Pokémon
          </span>
        </div>

        <div className="team-card-actions" ref={menuRef}>
          <button
            className="team-action-btn"
            aria-label="Team options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            ⚙
          </button>
          {menuOpen && (
            <div className="team-menu">
              <button
                className="team-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartRename();
                  setMenuOpen(false);
                }}
              >
                ✏ Rename
              </button>
              <button
                className="team-menu-item team-menu-item--danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setMenuOpen(false);
                }}
              >
                🗑 Delete team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Pokémon slots ── */}
      <div className="team-pokemon-row">
        {team.pokemon.map((poke, i) => (
          <PokemonSlot
            key={i}
            pokemon={poke}
            isActive={isEditing && activeSlot === i}
            onClick={(e) => {
              if (!isEditing) { onToggleEdit(); return; }
              e.stopPropagation();
              onSlotClick(i, poke);
            }}
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
                src={team.pokemon[activeSlot].sprite}
                alt={team.pokemon[activeSlot].name}
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
const TeamsPage = () => {
  const [teams, setTeams] = useState(loadTeams);
  const [editingId, setEditingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeSlots, setActiveSlots] = useState({}); // teamId → slotIndex | null
  const [allNames, setAllNames] = useState([]);

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

  return (
    <>
      <SearchHeader showSearch={false} />

      <div className="teams-page">
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
              <svg viewBox="0 0 100 100" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                {/* Bottom half - light gray */}
                <path d="M 5,50 A 45,45 0 0,0 95,50 Z" fill="#D0D0D8" />
                {/* Top half - purple */}
                <path d="M 5,50 A 45,45 0 0,1 95,50 Z" fill="#7B4F9E" />
                {/* Pink/red upper-left panel */}
                <path d="M 5,50 A 45,45 0 0,1 28,13 L 50,50 Z" fill="#C1547A" />
                {/* Pink/red upper-right panel */}
                <path d="M 72,13 A 45,45 0 0,1 95,50 L 50,50 Z" fill="#C1547A" />
                {/* Black divider band */}
                <rect x="5" y="46" width="90" height="8" fill="#222" />
                {/* Outer button ring */}
                <circle cx="50" cy="50" r="13" fill="#333" />
                {/* Inner button */}
                <circle cx="50" cy="50" r="9" fill="#E8E8E8" />
                {/* M letter */}
                <text x="50" y="37" textAnchor="middle" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif" fill="white" letterSpacing="-1">M</text>
              </svg>
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
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TeamsPage;
