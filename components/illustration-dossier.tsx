import Image from 'next/image';

export function IllustrationDossier() {
  return (
    <figure
      className="illustration-dossier"
      aria-label="Schéma illustratif : des pièces, des chiffres et des preuves convergent dans un dossier, qui reçoit un horodatage puis une coche de vérification."
    >
      <div className="illustration-dossier__entete">
        <span>Le geste COMBINE</span>
        <span>Schéma d’interface</span>
      </div>

      <div className="illustration-dossier__scene">
        <svg
          className="illustration-dossier__svg"
          viewBox="0 0 600 440"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M92 92C171 103 196 161 273 218"
            className="illustration-dossier__route"
            stroke="#1BA899"
          />
          <path
            d="M508 92C429 103 404 161 327 218"
            className="illustration-dossier__route"
            stroke="#6B1F3B"
          />
          <path
            d="M92 338C171 326 196 285 273 244"
            className="illustration-dossier__route"
            stroke="#6B1F3B"
          />
          <path
            d="M508 338C429 326 404 285 327 244"
            className="illustration-dossier__route"
            stroke="#1BA899"
          />

          <g className="illustration-dossier__feuille">
            <path
              d="M226 112H354L380 138V338C380 345 375 350 368 350H232C225 350 220 345 220 338V118C220 115 223 112 226 112Z"
              fill="#fff"
              stroke="#D8CDC7"
              strokeWidth="2"
            />
            <path d="M354 112V138H380" fill="#F2ECE7" stroke="#D8CDC7" strokeWidth="2" />
            <path d="M246 302H354" stroke="#DED7D1" strokeWidth="2" strokeLinecap="round" />
            <path d="M246 316H330" stroke="#DED7D1" strokeWidth="2" strokeLinecap="round" />
            <text
              x="300"
              y="284"
              fill="#6D5F64"
              fontFamily="sans-serif"
              fontSize="11"
              fontWeight="600"
              letterSpacing="2"
              textAnchor="middle"
            >
              DOSSIER PUBLIÉ
            </text>
          </g>

          <g transform="translate(68 70)">
            <g className="illustration-dossier__signal illustration-dossier__signal--a">
              <rect width="52" height="34" rx="8" fill="#fff" stroke="#1BA899" strokeWidth="2" />
              <rect x="9" y="9" width="12" height="16" rx="2" fill="#1BA899" />
              <path d="M27 12H43M27 18H43M27 24H38" stroke="#6D5F64" strokeWidth="2" />
            </g>
          </g>

          <g transform="translate(480 70)">
            <g className="illustration-dossier__signal illustration-dossier__signal--b">
              <rect width="52" height="34" rx="8" fill="#fff" stroke="#6B1F3B" strokeWidth="2" />
              <circle cx="15" cy="17" r="7" fill="#6B1F3B" />
              <path d="M28 12H43M28 18H43M28 24H38" stroke="#6D5F64" strokeWidth="2" />
            </g>
          </g>

          <g transform="translate(68 320)">
            <g className="illustration-dossier__signal illustration-dossier__signal--c">
              <rect width="52" height="34" rx="8" fill="#fff" stroke="#6B1F3B" strokeWidth="2" />
              <path d="M10 24L17 17L22 21L31 11L42 18" stroke="#6B1F3B" strokeWidth="2" />
              <circle cx="42" cy="18" r="3" fill="#1BA899" />
            </g>
          </g>

          <g transform="translate(480 320)">
            <g className="illustration-dossier__signal illustration-dossier__signal--d">
              <rect width="52" height="34" rx="8" fill="#fff" stroke="#1BA899" strokeWidth="2" />
              <path d="M11 12H40M11 18H35M11 24H29" stroke="#1BA899" strokeWidth="2" />
            </g>
          </g>
        </svg>

        <Image
          className="illustration-dossier__marque"
          src="/brand/mark.svg"
          alt=""
          width={64}
          height={64}
          preload
        />

        <div className="illustration-dossier__cachet" aria-hidden="true">
          <span>HORODATAGE</span>
          <span className="illustration-dossier__check">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
              <path
                d="m3.5 8.5 3 3 6-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      <figcaption className="illustration-dossier__legende">
        <span>Les éléments convergent · le cachet se pose · l’historique se vérifie</span>
        <span>Aucune donnée réelle</span>
      </figcaption>
    </figure>
  );
}
