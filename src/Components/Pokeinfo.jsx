const MAX_STAT = 255;

const Pokeinfo = ({ data }) => {
  if (!data) return null;

  const artwork =
    data.sprites.other?.["official-artwork"]?.front_default ||
    data.sprites.other?.dream_world?.front_default ||
    data.sprites.front_default ||
    null;

  return (
    <>
      <h1>{data.name}</h1>
      <div className="pokemon-image-frame">
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
    </>
  );
};

export default Pokeinfo;
