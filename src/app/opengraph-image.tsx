import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "ReImage — every pixel finds a new home";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#e8e5de";
const INK = "#0e0e10";

async function demo(name: string) {
  const buf = await readFile(join(process.cwd(), "public/demo", name));
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export default async function Image() {
  const [from, to] = await Promise.all([demo("evening.jpg"), demo("day.jpg")]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, color: INK, padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", opacity: 0.6 }}>pixel morph · webgl</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 120, letterSpacing: -4, lineHeight: 1 }}>
              <span style={{ opacity: 0.4 }}>Re</span>
              <span>Image</span>
            </div>
            <div style={{ fontSize: 40, marginTop: 24, lineHeight: 1.2, maxWidth: 520 }}>Every pixel finds a new home.</div>
          </div>
          <div style={{ fontSize: 24, opacity: 0.6 }}>nothing lost · nothing recolored</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={from} width={240} height={240} style={{ borderRadius: 8 }} />
          <div style={{ fontSize: 48 }}>→</div>
          <img src={to} width={240} height={240} style={{ borderRadius: 8 }} />
        </div>
      </div>
    ),
    size,
  );
}
