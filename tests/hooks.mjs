// Resolve hook so plain Node can import the project's TypeScript modules:
//   "@/x" -> <project>/x.ts,  "server-only" -> empty module.
import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs";

const root = process.cwd();

export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
  if (specifier.startsWith("@/")) {
    const base = path.join(root, specifier.slice(2));
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      if (fs.existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}
