export const getPokemonArtwork = (pokemon) =>
  pokemon.sprites.other?.["official-artwork"]?.front_default ||
  pokemon.sprites.other?.dream_world?.front_default ||
  pokemon.sprites.front_default ||
  null;

export const getPokemonFallbackSprite = (pokemon) =>
  pokemon.sprites.front_default || getPokemonArtwork(pokemon);
