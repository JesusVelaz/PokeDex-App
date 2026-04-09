import { AiOutlineClose } from "react-icons/ai";
import Pokeinfo from "./Pokeinfo";

const PokemonDetailPanel = ({ pokemon, onClose }) => {
  return (
    <div className={`right-column${pokemon ? "" : " right-column--empty"}`}>
      <div className="right-content">
        {pokemon ? (
          <>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <AiOutlineClose />
            </button>
            <Pokeinfo data={pokemon} />
          </>
        ) : (
          <p className="right-placeholder">Click a Pokémon to see details</p>
        )}
      </div>
    </div>
  );
};

export default PokemonDetailPanel;
