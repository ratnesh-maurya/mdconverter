/**
 * Build-time OG image generator
 * Runs before `next build` via the `prebuild` npm script.
 * Outputs: public/og-image.png (1200×630)
 *
 * Satori constraints (v0.10+):
 *  - No position:absolute / z-index
 *  - All containers must have display:flex
 *  - At least one font must be provided
 *  - No CSS shorthand (use paddingTop etc.)
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "og-image.png");

const W = 1200;
const H = 630;

// ── Load a system font (Arial on macOS; fallback to fetching Inter) ───────────

let fontData;
const macFont = "/System/Library/Fonts/Supplemental/Arial.ttf";
const macFontBold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

try {
  fontData = readFileSync(macFont);
  console.log("Using local Arial font");
} catch {
  // CI / Linux — fetch Inter from Google Fonts bunny mirror
  console.log("Local font not found, fetching Inter...");
  const res = await fetch(
    "https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff"
  );
  fontData = Buffer.from(await res.arrayBuffer());
}

let fontDataBold;
try {
  fontDataBold = readFileSync(macFontBold);
} catch {
  fontDataBold = fontData; // fallback to same font
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const pill = (text) => ({
  type: "div",
  props: {
    style: {
      display: "flex",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 18,
      paddingRight: 18,
      color: "rgba(255,255,255,0.55)",
      fontSize: 17,
      fontWeight: 500,
    },
    children: text,
  },
});

// ── VNode tree ────────────────────────────────────────────────────────────────

const node = {
  type: "div",
  props: {
    style: {
      width: W,
      height: H,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      background: "#0d0a18",
      paddingTop: 72,
      paddingBottom: 60,
      paddingLeft: 80,
      paddingRight: 80,
    },
    children: [
      // ── TOP ───────────────────────────────────────────────────────────────
      {
        type: "div",
        props: {
          style: { display: "flex", flexDirection: "column", gap: 30 },
          children: [
            // badge
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(124,58,237,0.18)",
                  border: "1px solid rgba(124,58,237,0.40)",
                  borderRadius: 9999,
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingLeft: 22,
                  paddingRight: 22,
                  alignSelf: "flex-start",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        width: 10,
                        height: 10,
                        borderRadius: 9999,
                        background: "#7c3aed",
                        marginRight: 4,
                      },
                    },
                  },
                  {
                    type: "span",
                    props: {
                      style: {
                        color: "#a78bfa",
                        fontSize: 19,
                        fontWeight: 600,
                      },
                      children: "Free online developer tool · No account needed",
                    },
                  },
                ],
              },
            },

            // headline
            {
              type: "div",
              props: {
                style: { display: "flex", flexDirection: "column", gap: 16 },
                children: [
                  // title "MD Converter"
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "baseline",
                        gap: 0,
                      },
                      children: [
                        {
                          type: "span",
                          props: {
                            style: {
                              color: "#ffffff",
                              fontSize: 92,
                              fontWeight: 800,
                              lineHeight: 1,
                              letterSpacing: -3,
                            },
                            children: "MD ",
                          },
                        },
                        {
                          type: "span",
                          props: {
                            style: {
                              color: "#a855f7",
                              fontSize: 92,
                              fontWeight: 800,
                              lineHeight: 1,
                              letterSpacing: -3,
                            },
                            children: "Converter",
                          },
                        },
                      ],
                    },
                  },
                  // subtitle
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        fontSize: 27,
                        color: "rgba(255,255,255,0.40)",
                        fontWeight: 400,
                        maxWidth: 680,
                        lineHeight: 1.45,
                      },
                      children:
                        "Paste any text. Get clean, structured Markdown in real time.",
                    },
                  },
                ],
              },
            },
          ],
        },
      },

      // ── BOTTOM ────────────────────────────────────────────────────────────
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          },
          children: [
            // feature pills
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  maxWidth: 680,
                },
                children: [
                  "Smart headings",
                  "Code detection",
                  "Tables",
                  "Lists & blockquotes",
                  "Live split preview",
                  "Dark & light theme",
                  "Download .md",
                ].map(pill),
              },
            },

            // author
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                  flexShrink: 0,
                  marginLeft: 32,
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        color: "#a78bfa",
                        fontSize: 23,
                        fontWeight: 700,
                      },
                      children: "Ratnesh Maurya",
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 15,
                        fontWeight: 400,
                      },
                      children: "mdconverter.ratnesh-maurya.com",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  },
};

// ── Render ────────────────────────────────────────────────────────────────────

const svg = await satori(node, {
  width: W,
  height: H,
  fonts: [
    {
      name: "Arial",
      data: fontData,
      weight: 400,
      style: "normal",
    },
    {
      name: "Arial",
      data: fontDataBold,
      weight: 700,
      style: "normal",
    },
    {
      name: "Arial",
      data: fontDataBold,
      weight: 800,
      style: "normal",
    },
  ],
});

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: W } });
const png = resvg.render().asPng();

mkdirSync(join(__dirname, "..", "public"), { recursive: true });
writeFileSync(OUT, png);

const kb = (png.length / 1024).toFixed(1);
console.log(`✓  OG image written → public/og-image.png  (${kb} kB)`);
