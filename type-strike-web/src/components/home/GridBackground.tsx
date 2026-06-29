export default function GridBackground() {
  return (
    <div
      className="home-grid-bg"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: [
          "linear-gradient(rgba(255,107,26,0.05) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,107,26,0.05) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "50px 50px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        animation: "gridDrift 20s linear infinite",
      }}
      aria-hidden="true"
    />
  );
}
