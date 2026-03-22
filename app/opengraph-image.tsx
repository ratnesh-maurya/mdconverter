import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MD Converter – Paste any text, get beautiful Markdown instantly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "#0a0a0f",
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "-140px",
            left: "-100px",
            width: "560px",
            height: "560px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            right: "-80px",
            width: "480px",
            height: "480px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          }}
        />

        {/* grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* top content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(124,58,237,0.14)",
              border: "1px solid rgba(124,58,237,0.35)",
              borderRadius: "9999px",
              padding: "10px 24px",
              width: "fit-content",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "9999px",
                background: "#7c3aed",
              }}
            />
            <span
              style={{ color: "#a78bfa", fontSize: "20px", fontWeight: 500 }}
            >
              Free online developer tool · No account needed
            </span>
          </div>

          {/* headline */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                fontSize: "96px",
                fontWeight: 800,
                letterSpacing: "-4px",
                lineHeight: 0.95,
                display: "flex",
                alignItems: "baseline",
                gap: "0px",
              }}
            >
              <span style={{ color: "#ffffff" }}>MD&nbsp;</span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #6366f1 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                Converter
              </span>
            </div>
            <div
              style={{
                fontSize: "28px",
                color: "rgba(255,255,255,0.42)",
                fontWeight: 400,
                letterSpacing: "-0.3px",
                maxWidth: "680px",
                lineHeight: 1.45,
              }}
            >
              Paste any text. Get clean, structured Markdown in real time.
            </div>
          </div>
        </div>

        {/* bottom section */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            width: "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* feature pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              maxWidth: "700px",
            }}
          >
            {[
              "Smart headings",
              "Code detection",
              "Tables",
              "Lists & blockquotes",
              "Live split preview",
              "Dark & light theme",
              "Download .md",
            ].map((feat) => (
              <div
                key={feat}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "17px",
                  fontWeight: 500,
                }}
              >
                {feat}
              </div>
            ))}
          </div>

          {/* author */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                color: "#a78bfa",
                fontSize: "24px",
                fontWeight: 600,
              }}
            >
              Ratnesh Maurya
            </div>
            <div
              style={{ color: "rgba(255,255,255,0.22)", fontSize: "16px" }}
            >
              mdconverter.ratnesh-maurya.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
