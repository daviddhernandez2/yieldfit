// Logo de Yield Fit como componente reutilizable.
// El SVG va inline en lugar de importarse como imagen para poder controlar
// el tamaño con props y garantizar que la marca se sirva sin peticiones extra.
// La proporción es fija (aprox 5.9:1); solo se controla el ancho.
export default function Logo({ width = 200, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 293.1 49.7"
      width={width}
      height={width / 5.9}
      className={className}
      role="img"
      aria-label="Yield Fit"
    >
      <defs>
        <linearGradient
          id="logoGradient"
          x1="30.91"
          y1="10.41"
          x2="12.21"
          y2="47.91"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#41cb7e" />
          <stop offset=".8" stopColor="#3ef87e" />
        </linearGradient>
      </defs>
      {/* Símbolo (triángulo compuesto). El polígono interior aporta profundidad
          mediante el degradado, distinguiendo el logo de un simple triángulo plano. */}
      <g>
        <path fill="#3ef87e" d="M48,.6l26.6,48.4h-23.1l-14.3-27.9-14.1,27.9H0L26.5.6h21.5Z" />
        <polygon fill="url(#logoGradient)" points="37.2 21.1 26.5 .6 0 49.1 23.1 49.1 37.2 21.1" />
      </g>
      {/* Wordmark "Yield" en blanco. */}
      <g fill="#fff">
        <path d="M91.3,48.9v-18.7L74.6.8h11.4l10.5,19.4L106.9.8h11.4l-16.7,29.4v18.7h-10.3,0Z" />
        <path d="M120.7,8.1V0h10.5v8.1h-10.5ZM120.9,48.9V12.6h10.2v36.3h-10.2Z" />
        <path d="M155.6,49.7c-3.7,0-6.9-.8-9.6-2.3s-4.9-3.8-6.4-6.6c-1.5-2.8-2.3-6.2-2.3-10s.8-7.2,2.3-10,3.6-5,6.3-6.6c2.7-1.6,5.9-2.4,9.6-2.4s6.7.8,9.4,2.4c2.7,1.6,4.7,3.8,6.2,6.8s2.2,6.4,2.2,10.5v2h-25.5c0,2.9.9,5,2.3,6.4,1.4,1.4,3.3,2.1,5.7,2.1s3.1-.4,4.3-1.1c1.2-.7,2-1.8,2.5-3.3l10.2.6c-.9,3.6-3,6.4-6,8.5-3.1,2-6.8,3-11.2,3ZM147.8,27.2h15.1c0-2.7-.9-4.6-2.2-6-1.3-1.3-3.1-2-5.2-2s-3.9.7-5.2,2.1c-1.4,1.4-2.2,3.3-2.5,5.9h0Z" />
        <path d="M189.4,48.9c-3,0-5.3-.7-7-2.2-1.7-1.5-2.5-3.9-2.5-7.2V.9h10.2v37.5c0,1.1.2,1.9.7,2.3.5.5,1.2.7,2.2.7h2.4v7.6h-6v-.1Z" />
        <path d="M213.4,49.7c-3.1,0-5.7-.8-8-2.3-2.2-1.6-4-3.7-5.1-6.6-1.2-2.8-1.8-6.2-1.8-10.1s.6-7.2,1.8-10.1c1.2-2.9,2.9-5,5.2-6.6,2.2-1.6,4.9-2.3,7.9-2.3s4.8.5,6.7,1.6,3.3,2.5,4.2,4.4V.8h10.2v48.1h-9.7l-.2-5.3c-1,1.9-2.5,3.5-4.4,4.5s-4.2,1.6-6.7,1.6h-.1,0ZM216.7,41.9c1.6,0,3-.4,4.1-1.3s2-2.1,2.6-3.8c.6-1.6.9-3.7.9-6.1s-.3-4.5-.9-6.2c-.6-1.6-1.4-2.9-2.6-3.7-1.1-.8-2.5-1.3-4.1-1.3-2.4,0-4.3,1-5.7,3s-2.1,4.7-2.1,8.2.7,6.1,2.1,8.1c1.4,2,3.3,3,5.7,3h0v.1Z" />
      </g>
      {/* Sufijo "FIT" en blanco, más pequeño y posicionado como marca de categoría. */}
      <g fill="#fff">
        <path d="M245.1,25.6V0h17.1v4.1h-15l2.6-2.6v11.7l-2.6-2.1h14.3v4h-14.3l2.6-2.1v12.6h-4.7Z" />
        <path d="M266.1,25.6V0h4.7v25.6h-4.7Z" />
        <path d="M280.7,25.6V4.1h-7.8V0h20.2v4.1h-7.7v21.5h-4.7Z" />
      </g>
    </svg>
  );
}