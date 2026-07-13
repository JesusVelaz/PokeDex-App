import { useEffect, useState } from "react";
import { getLocalDateKey } from "./dailyEncounter";
import PokemonSearchBar from "./PokemonSearchBar";
import { AiOutlineCheck } from "react-icons/ai";
import { IoIosArrowForward } from "react-icons/io";

const ARTWORK_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const formatName = (name = "") =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth" });
};

const Hero = ({
  totalSpeciesCount = 0,
  teamOptions = [],
  heroPokemon = [],
  allPokemonNames = [],
  onSelectPokemon,
}) => {
  const teamCount = teamOptions.length;
  const filledSlots = teamOptions.reduce((sum, team) => sum + team.filledSlots, 0);
  const totalSlots = teamOptions.reduce((sum, team) => sum + team.totalSlots, 0);
  const featuredPokemon = heroPokemon[0];
  const featuredPokemonName = featuredPokemon?.name;
  const nearbyPokemon = heroPokemon.slice(1, 5);
  const dateKey = getLocalDateKey();
  const scoutStorageKey = featuredPokemon
    ? `pokedex-mystery-guess:v1:${dateKey}:${featuredPokemon.id}`
    : null;
  const [hasScoutedEncounter, setHasScoutedEncounter] = useState(false);
  const [isEncounterReady, setIsEncounterReady] = useState(false);
  const [encounterGuess, setEncounterGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState("");
  const [guessStatus, setGuessStatus] = useState("idle");
  const [isGuessShaking, setIsGuessShaking] = useState(false);
  const bestPreparedSlots = teamOptions.reduce(
    (best, team) => Math.max(best, team.filledSlots),
    0
  );
  const hasPreparedTeam = teamOptions.some(
    (team) => team.totalSlots > 0 && team.filledSlots >= team.totalSlots
  );
  const hasSyncedRecords = totalSpeciesCount > 0;
  const completedTasks = [hasSyncedRecords, hasScoutedEncounter, hasPreparedTeam].filter(Boolean).length;
  const researchProgress = (completedTasks / 3) * 100;

  useEffect(() => {
    if (!scoutStorageKey) {
      setHasScoutedEncounter(false);
      setIsEncounterReady(false);
      return;
    }

    try {
      const isComplete = localStorage.getItem(scoutStorageKey) === "guessed";
      setHasScoutedEncounter(isComplete);
      setEncounterGuess(isComplete ? featuredPokemonName : "");
      setGuessFeedback("");
      setGuessStatus(isComplete ? "correct" : "idle");
      setIsGuessShaking(false);
    } catch {
      setHasScoutedEncounter(false);
      setEncounterGuess("");
    } finally {
      setIsEncounterReady(true);
    }
  }, [scoutStorageKey, featuredPokemonName]);

  const scoutEncounter = (openEntry = true) => {
    if (!featuredPokemon) return;

    setHasScoutedEncounter(true);
    try {
      localStorage.setItem(scoutStorageKey, "guessed");
    } catch {
      // Progress still works for this session if storage is unavailable.
    }
    if (openEntry) {
      onSelectPokemon(featuredPokemon.name);
    }
  };

  const submitEncounterGuess = (guessOverride) => {
    if (!featuredPokemon) return;

    const guess = (guessOverride ?? encounterGuess).trim().toLowerCase();
    if (typeof guessOverride === "string") {
      setEncounterGuess(guess);
    }
    if (guess === featuredPokemon.name.toLowerCase()) {
      setEncounterGuess(featuredPokemon.name);
      setGuessFeedback(`Correct! It's ${formatName(featuredPokemon.name)}.`);
      setGuessStatus("correct");
      setIsGuessShaking(false);
      scoutEncounter(false);
      return;
    }

    setGuessFeedback(guess ? "Not quite — try another species." : "Choose or enter a Pokémon first.");
    setGuessStatus("wrong");
    setIsGuessShaking(true);
  };

  const handleResearchScout = () => {
    if (hasScoutedEncounter) {
      scoutEncounter();
      return;
    }

    document.getElementById("encounter-guess")?.focus();
  };

  return (
    <section className="hero" aria-labelledby="trainer-dashboard-title">
      <div className="hero-copy">
        <div>
          <span className="hero-eyebrow">Professor Oak's field terminal</span>
          <h1 id="trainer-dashboard-title" className="hero-title">Trainer Field Desk</h1>
          <p className="hero-subtitle">
            Track your research, scout new species, and prepare your next team.
          </p>
        </div>
        <span className="hero-status"><i /> Field system online</span>
      </div>

      <div className="trainer-dashboard">
        <article className="wild-encounter-card">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-kicker">Who's that Pokémon?</span>
              <h2>{featuredPokemon && isEncounterReady ? (hasScoutedEncounter ? formatName(featuredPokemon.name) : "Mystery species") : "Scanning…"}</h2>
            </div>
            <span className="encounter-signal">Daily challenge</span>
          </div>

          <div className="encounter-stage">
            {featuredPokemon && (
              <img
                className={hasScoutedEncounter ? "encounter-pokemon--revealed" : "encounter-pokemon--hidden"}
                src={`${ARTWORK_BASE}/${featuredPokemon.id}.png`}
                alt={hasScoutedEncounter ? formatName(featuredPokemon.name) : "Mystery Pokémon silhouette"}
              />
            )}
          </div>

          {isEncounterReady ? (
            <div className="encounter-guess-panel">
              <PokemonSearchBar
                pokemonName={encounterGuess}
                onPokemonNameChange={(event) => {
                  setEncounterGuess(event.target.value.toLowerCase());
                  setGuessFeedback("");
                  setGuessStatus("idle");
                  setIsGuessShaking(false);
                }}
                onSearch={() => hasScoutedEncounter ? scoutEncounter() : submitEncounterGuess()}
                allPokemonNames={allPokemonNames}
                onSuggestionSelect={(name) => submitEncounterGuess(name)}
                placeholder={hasScoutedEncounter ? "Pokémon identified" : "Guess the Pokémon…"}
                inputLabel="Guess today's mystery Pokémon"
                buttonLabel={hasScoutedEncounter ? `View ${formatName(featuredPokemon?.name)} in Pokédex` : "Check Pokémon answer"}
                inputId="encounter-guess"
                inputAutoComplete="off"
                className={`encounter-guess-search is-${guessStatus}${isGuessShaking ? " is-shaking" : ""}`}
                ButtonIcon={hasScoutedEncounter ? AiOutlineCheck : IoIosArrowForward}
                inputDisabled={hasScoutedEncounter}
                onAnimationEnd={() => setIsGuessShaking(false)}
              />
              <small
                className={`encounter-guess-feedback${guessFeedback ? " is-visible" : ""}${hasScoutedEncounter ? " is-success" : ""}`}
                aria-live="polite"
              >
                {hasScoutedEncounter
                  ? `Correct — ${formatName(featuredPokemon?.name)} identified. Select the check to view its entry.`
                  : guessFeedback || "Type a species name or choose a recommendation"}
              </small>
            </div>
          ) : (
            <div className="encounter-guess-loading" aria-live="polite">Preparing today's mystery…</div>
          )}
        </article>

        <article className="research-board">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-kicker">Field research</span>
              <h2>Today's objectives</h2>
            </div>
            <span className="research-stamp" aria-label={`${completedTasks} of 3 objectives complete`}>
              {completedTasks}/3
            </span>
          </div>

          <div className="research-task-list">
            <div className={`research-task${hasSyncedRecords ? " research-task--complete" : ""}`}>
              <span className="task-check">{hasSyncedRecords ? "✓" : "1"}</span>
              <div><strong>Sync regional records</strong><small>{totalSpeciesCount || "…"} species indexed</small></div>
            </div>
            <button
              type="button"
              className={`research-task research-task--action${hasScoutedEncounter ? " research-task--complete" : ""}`}
              disabled={!featuredPokemon}
              onClick={handleResearchScout}
            >
              <span className="task-check">{hasScoutedEncounter ? "✓" : "2"}</span>
              <div>
                <strong>Scout today's encounter</strong>
                <small>{hasScoutedEncounter ? `${formatName(featuredPokemon?.name)} identified` : "Identify the mystery silhouette"}</small>
              </div>
              <span className="task-action-label">{hasScoutedEncounter ? "Review" : "Scout"}</span>
            </button>
            <button
              type="button"
              className={`research-task research-task--action${hasPreparedTeam ? " research-task--complete" : ""}`}
              onClick={() => scrollToId("teams")}
            >
              <span className="task-check">{hasPreparedTeam ? "✓" : "3"}</span>
              <div>
                <strong>Prepare an expedition team</strong>
                <small>{hasPreparedTeam ? "A six-partner team is ready" : `Fill all 6 slots in one team · ${bestPreparedSlots}/6 ready`}</small>
              </div>
              <span className="task-action-label">{hasPreparedTeam ? "Review" : "Prepare"}</span>
            </button>
          </div>

          <div className="research-progress">
            <span><b>Daily progress</b><small>{completedTasks}/3 complete</small></span>
            <div><i style={{ width: `${researchProgress}%` }} /></div>
          </div>
        </article>

        <aside className="trainer-summary">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-kicker">Trainer report</span>
              <h2>Adventure log</h2>
            </div>
          </div>

          <div className="trainer-stat-grid">
            <div><strong>{totalSpeciesCount || "—"}</strong><span>Pokédex records</span></div>
            <div><strong>{teamCount}</strong><span>Active teams</span></div>
            <div><strong>{filledSlots}</strong><span>Partners ready</span></div>
          </div>

          <div className="dashboard-quick-actions">
            <button type="button" aria-label="Go to Pokédex section" onClick={() => scrollToId("pokedex")}>
              Browse Pokédex <span>→</span>
            </button>
            <button type="button" aria-label="Go to My Teams section" onClick={() => scrollToId("teams")}>
              Manage teams <span>→</span>
            </button>
          </div>

          <div className="team-status-copy">
            {teamCount > 0
              ? `${teamCount} ${teamCount === 1 ? "team" : "teams"} · ${filledSlots}/${totalSlots} slots filled`
              : "No teams yet — start building"}
          </div>
        </aside>

        <div className="nearby-sightings">
          <div className="sightings-copy">
            <span className="dashboard-kicker">Nearby sightings</span>
            <p>Fresh signals from across the region</p>
          </div>
          <div className="sighting-list">
            {nearbyPokemon.map((pokemon) => (
              <button
                type="button"
                key={pokemon.id}
                onClick={() => onSelectPokemon(pokemon.name)}
                aria-label={`View ${formatName(pokemon.name)}`}
              >
                <img src={`${ARTWORK_BASE}/${pokemon.id}.png`} alt="" />
                <span>{formatName(pokemon.name)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <a href="#pokedex" className="hero-scroll-cue" aria-label="Scroll to the Pokédex">
        ↓
      </a>
    </section>
  );
};

export default Hero;
