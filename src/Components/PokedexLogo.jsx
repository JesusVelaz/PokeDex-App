const PokedexLogo = () => (
  <div className="logo-wordmark">
    <svg
      width="32"
      height="32"
      viewBox="0 0 34 34"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="17" cy="17" r="15" fill="#FFF9EC" stroke="#2B2B3A" strokeWidth="3" />
      <path d="M 2 17 A 15 15 0 0 1 32 17 Z" fill="#E3350D" stroke="#2B2B3A" strokeWidth="3" />
      <rect x="3" y="15.5" width="28" height="3" fill="#2B2B3A" />
      <circle cx="17" cy="17" r="5" fill="#FFF9EC" stroke="#2B2B3A" strokeWidth="3" />
    </svg>

    <span className="logo-text">
      Poké<em>dex</em>
    </span>
  </div>
);

export default PokedexLogo;
