import fs from "fs";
import { build } from "esbuild";

// Clean the output directory
const outDir = "./dist";
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}

// Build configuration
build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node16",
  outfile: `${outDir}/index.js`,
  sourcemap: true,
  minify: true,
  external: [
    "playwright",
  ],
}).then(() => {
  console.log("Build successful!");
}).catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
