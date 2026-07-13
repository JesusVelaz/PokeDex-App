import { AiOutlineClose } from "react-icons/ai";
import Pokeinfo from "./Pokeinfo";

const PokemonDetailPanel = ({
  pokemon,
  onClose,
  onAddToTeam,
  teamOptions,
}) => {
  const primaryType = pokemon?.types?.[0]?.type?.name;

  return (
    <aside
      className={`right-column${pokemon ? ` ${primaryType}` : " right-column--empty"}`}
      aria-label={pokemon ? `${pokemon.name} details` : "Pokémon details"}
    >
      <div className="right-content">
        {pokemon ? (
          <>
            <button type="button" className="close-button" onClick={onClose} aria-label="Close">
              <AiOutlineClose />
            </button>
            <Pokeinfo
              data={pokemon}
              onAddToTeam={onAddToTeam}
              teamOptions={teamOptions}
            />
          </>
        ) : (
          <p className="right-placeholder">Click a Pokémon to see details</p>
        )}
      </div>
    </aside>
  );
};

export default PokemonDetailPanel;
