import { IconFlame } from "@tabler/icons-react";

export default function HomeFooter() {
  return (
    <footer
      className="home-footer"
      style={{
        position: "relative",
        zIndex: 1,
        marginTop: 60,
        borderTop: "1px solid var(--ts-border, rgba(255,107,26,0.18))",
        padding: 32,
        textAlign: "center",
        color: "var(--ts-text-dim, #9b94b3)",
        fontSize: 13,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-orbitron, 'Orbitron', sans-serif)",
          fontWeight: 900,
          color: "var(--ts-orange, #ff6b1a)",
          marginBottom: 8,
          fontSize: 16,
          letterSpacing: "1px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <IconFlame size={18} />
        TYPESTRIKE
      </div>
      <div>
        Built for speed. Forged in fire. &copy; 2025 &mdash; Press any key to begin.
      </div>
    </footer>
  );
}
