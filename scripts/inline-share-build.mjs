import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const buildDir = join(rootDir, "shared-build");
const indexPath = join(buildDir, "index.html");

let html = await readFile(indexPath, "utf8");

const stylesheetPattern = /<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/;
const scriptPattern = /<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/;

const stylesheetMatch = html.match(stylesheetPattern);
if (stylesheetMatch) {
  const css = await readFile(join(buildDir, stylesheetMatch[1]), "utf8");
  html = html.replace(stylesheetPattern, () => `<style>\n${css}\n</style>`);
}

const scriptMatch = html.match(scriptPattern);
if (scriptMatch) {
  const js = await readFile(join(buildDir, scriptMatch[1]), "utf8");
  const scriptBlock = `<script>\n${js.replaceAll("</script", "<\\/script")}\n</script>`;
  html = html.replace(scriptPattern, "");
  html = html.replace("</body>", `${scriptBlock}\n  </body>`);
}

await writeFile(indexPath, html, "utf8");
