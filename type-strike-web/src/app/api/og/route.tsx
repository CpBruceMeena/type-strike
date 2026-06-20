import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

export const runtime = "edge";

// Inter font — fetched once and cached with a mutex to prevent duplicate fetches
let fontData: ArrayBuffer | null = null;
let fontPromise: Promise<ArrayBuffer> | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  if (fontPromise) return fontPromise;
  fontPromise = (async () => {
    const url =
      "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7SUc.woff2";
    const resp = await fetch(url);
    const data = await resp.arrayBuffer();
    fontData = data;
    return data;
  })();
  return fontPromise;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const wpm = searchParams.get("wpm");
  const accuracy = searchParams.get("accuracy");
  const stars = searchParams.get("stars");
  const mode = searchParams.get("mode");
  const title = searchParams.get("title"); // custom title (for feats)
  const featIcon = searchParams.get("feat"); // feat icon
  const isVictory = searchParams.get("victory") === "true";
  const isFeat = searchParams.get("feat") !== null;

  const font = await getFont();

  const primaryColor = isVictory ? "#FFCC00" : "#FF5020";

  let content: ReactElement;

  if (isFeat && title) {
    // ── Feat achievement card ──
    content = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0A0A14 0%, #1A0A28 50%, #0A0A14 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            top: "-40%",
            left: "10%",
            width: "80%",
            height: "80%",
            background: `radial-gradient(circle at 50% 0%, ${primaryColor}22, transparent 60%)`,
          }}
        />

        {/* Decorative grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            position: "relative",
          }}
        >
          <span style={{ fontSize: "80px" }}>{featIcon || "🏆"}</span>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 900,
              letterSpacing: "4px",
              color: primaryColor,
              margin: 0,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "240px",
            height: "2px",
            margin: "24px 0",
            background: `linear-gradient(90deg, transparent, ${primaryColor}55, transparent)`,
          }}
        />

        <p
          style={{
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "2px",
            color: "#888888",
            margin: 0,
            textAlign: "center",
          }}
        >
          TYPE STRIKE
        </p>

        {/* Bottom URL */}
        <p
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "3px",
            color: "#555555",
            margin: 0,
          }}
        >
          typestrike.app
        </p>
      </div>
    );
  } else if (isVictory && wpm) {
    // ── Victory / result card ──
    const wpmNum = parseInt(wpm, 10);
    const accNum = accuracy ? `${(parseFloat(accuracy) * 100).toFixed(0)}%` : "—";
    const starCount = stars ? parseInt(stars, 10) : 0;
    const modeLabel = mode
      ? mode
          .replace("timed_", "")
          .replace("level-", "LEVEL ")
          .toUpperCase()
      : "";

    content = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0A0A14 0%, #141020 50%, #0A0A14 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "25%",
            width: "50%",
            height: "60%",
            background: `radial-gradient(circle at 50% 50%, ${primaryColor}18, transparent 60%)`,
          }}
        />

        {/* Decorative grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Trophy */}
        <span style={{ fontSize: "72px", marginBottom: "8px" }}>🏆</span>

        {modeLabel && (
          <p
            style={{
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "4px",
              color: "#666666",
              margin: 0,
            }}
          >
            {modeLabel}
          </p>
        )}

        <h1
          style={{
            fontSize: "72px",
            fontWeight: 900,
            letterSpacing: "8px",
            color: primaryColor,
            margin: "8px 0",
            textShadow: `0 0 40px ${primaryColor}44`,
          }}
        >
          VICTORY
        </h1>

        {/* Stars */}
        {starCount > 0 && (
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "36px",
                  opacity: s <= starCount ? 1 : 0.15,
                }}
              >
                ⭐
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "24px",
            padding: "20px 40px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "48px", fontWeight: 900, letterSpacing: "2px", color: "#FF5020" }}>
              {wpm}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "2px", color: "#666666" }}>
              WPM
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "48px", fontWeight: 900, letterSpacing: "2px", color: "#FFCC00" }}>
              {accNum}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "2px", color: "#666666" }}>
              ACC
            </span>
          </div>
        </div>

        {/* Bottom */}
        <p
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "3px",
            color: "#555555",
            margin: 0,
          }}
        >
          typestrike.app
        </p>
      </div>
    );
  } else {
    // ── Default branded OG image ──
    content = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0a0a10",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow orbs */}
        <div
          style={{
            position: "absolute",
            left: "10%",
            top: "10%",
            width: "60%",
            height: "80%",
            background: "radial-gradient(circle at 30% 50%, rgba(255,80,32,0.12), transparent 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "10%",
            bottom: "10%",
            width: "40%",
            height: "60%",
            background: "radial-gradient(circle at 70% 50%, rgba(0,240,255,0.08), transparent 50%)",
          }}
        />

        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
          }}
        />

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          <h1
            style={{
              fontSize: "96px",
              fontWeight: 900,
              letterSpacing: "8px",
              color: "#FF5020",
              margin: 0,
              textShadow: "0 0 30px rgba(255,80,32,0.3)",
            }}
          >
            TYPE STRIKE
          </h1>
          <p
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "4px",
              color: "#888888",
              margin: "16px 0 0 0",
            }}
          >
            TYPE WITH FURY · STRIKE WITH FIRE
          </p>

          {/* Divider */}
          <div
            style={{
              width: "200px",
              height: "2px",
              margin: "28px 0",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
            }}
          />

          {/* Feature pills */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { text: "⚡ 100 LEVELS", color: "#FF5020" },
              { text: "🏆 CONTEST", color: "#CC44FF" },
              { text: "🔥 TIMED MODES", color: "#FFCC00" },
              { text: "🎯 ACCURACY", color: "#00F0FF" },
            ].map((feat) => (
              <div
                key={feat.text}
                style={{
                  padding: "8px 20px",
                  borderRadius: "20px",
                  background: `${feat.color}15`,
                  border: `1px solid ${feat.color}30`,
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  color: feat.color,
                }}
              >
                {feat.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom URL */}
        <p
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "3px",
            color: "#555555",
            margin: 0,
          }}
        >
          typestrike.app
        </p>
      </div>
    );
  }

  return new ImageResponse(content, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Inter",
        data: font,
        weight: 900,
        style: "normal",
      },
    ],
  });
}
