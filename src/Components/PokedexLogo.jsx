const PokedexLogo = () => (
  <div className="logo-wordmark">
    {/* ── Pokéball icon ── */}
    <svg
      width="38"
      height="38"
      viewBox="0 0 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Red-half gradient — depth + slight top-left light source */}
        <radialGradient id="pb-red" cx="38%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#F5606E" />
          <stop offset="100%" stopColor="#C5253A" />
        </radialGradient>

        {/* Subtle vignette on white half */}
        <radialGradient id="pb-white" cx="50%" cy="100%" r="80%">
          <stop offset="0%"   stopColor="#E8E4DC" />
          <stop offset="100%" stopColor="#D8D4CC" />
        </radialGradient>

        {/* Gold glow for center button */}
        <radialGradient id="pb-btn" cx="40%" cy="35%" r="70%">
          <stop offset="0%"   stopColor="#FFE050" />
          <stop offset="100%" stopColor="#E8A800" />
        </radialGradient>

        {/* Clip: top half */}
        <clipPath id="pb-top">
          <rect x="0" y="0" width="38" height="19" />
        </clipPath>

        {/* Clip: bottom half */}
        <clipPath id="pb-bot">
          <rect x="0" y="19" width="38" height="19" />
        </clipPath>
      </defs>

      {/* ── Outer glow ring ── */}
      <circle cx="19" cy="19" r="18.5" fill="rgba(255,203,5,0.07)" />

      {/* ── Dark base circle ── */}
      <circle cx="19" cy="19" r="17" fill="#0d1117" />

      {/* ── Red top half ── */}
      <circle cx="19" cy="19" r="17" fill="url(#pb-red)" clipPath="url(#pb-top)" />

      {/* ── White/cream bottom half ── */}
      <circle cx="19" cy="19" r="17" fill="url(#pb-white)" clipPath="url(#pb-bot)" />

      {/* ── Center band (dark) ── */}
      <rect x="2" y="17.5" width="34" height="3" fill="#0d1117" />

      {/* ── Outer ring ── */}
      <circle cx="19" cy="19" r="17" stroke="rgba(255,203,5,0.32)" strokeWidth="1" />

      {/* ── Button shadow ring ── */}
      <circle cx="19" cy="19" r="6.25" fill="#0d1117" />

      {/* ── Button gold ring ── */}
      <circle cx="19" cy="19" r="5.5"  stroke="rgba(255,203,5,0.55)" strokeWidth="1.5" fill="none" />

      {/* ── Button face ── */}
      <circle cx="19" cy="19" r="3.75" fill="url(#pb-btn)" />

      {/* ── Specular highlight on red half ── */}
      <ellipse
        cx="12.5" cy="11.5"
        rx="3.2"   ry="2"
        fill="rgba(255,255,255,0.22)"
        transform="rotate(-35 12.5 11.5)"
      />
    </svg>

    {/* ── Wordmark ── */}
    <span className="logo-text">
      Poké<em>dex</em>
    </span>
  </div>
);

export default PokedexLogo;
