import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";

const IMG_BASE = "https://www.dofuspourlesnoobs.com/uploads/1/3/0/1/13010384/custom_themes/586567114324766674/files/mounts/muldos/";
const OUTPUT_DIR = path.join(process.cwd(), "public", "muldos");

// All image names from the seed data
const imageNames = [
  // Gen 1
  "ebene", "indigo", "pourpre", "orchidee", "dore",
  // Gen 2
  "dore-pourpre", "indigo-pourpre", "ebene-pourpre", "orchidee-pourpre",
  "dore-orchidee", "indigo-orchidee", "ebene-orchidee", "dore-ebene",
  "dore-indigo", "ebene-indigo",
  // Gen 3
  "roux", "amande",
  // Gen 4
  "dore-amande", "ebene-amande", "indigo-amande", "orchidee-amande",
  "pourpre-amande", "roux-amande", "roux-dore", "roux-ebene",
  "roux-indigo", "roux-orchidee", "roux-pourpre",
  // Gen 5
  "ivoire", "turquoise",
  // Gen 6
  "pourpre-ivoire", "orchidee-ivoire", "indigo-ivoire", "ebene-ivoire",
  "dore-ivoire", "roux-ivoire", "amande-ivoire", "turquoise-ivoire",
  "turquoise-pourpre", "turquoise-orchidee", "turquoise-indigo",
  "turquoise-ebene", "turquoise-roux", "turquoise-amande", "turquoise-dore",
  // Gen 7
  "prune", "emeraude",
  // Gen 8
  "prune-pourpre", "prune-orchidee", "prune-indigo", "prune-ebene",
  "prune-dore", "prune-roux", "prune-amande", "prune-ivoire",
  "prune-turquoise", "prune-emeraude", "pourpre-emeraude", "orchidee-emeraude",
  "indigo-emeraude", "ebene-emeraude", "dore-emeraude", "roux-emeraude",
  "amande-emeraude", "ivoire-emeraude", "turquoise-emeraude",
  // Gen 9
  "ambre", "corail", "azur", "aigue-marine",
  // Gen 10
  "ambre-dore", "ambre-ebene", "ambre-indigo", "ambre-pourpre", "ambre-orchidee",
  "ambre-amande", "ambre-roux", "ambre-ivoire", "ambre-turquoise", "ambre-emeraude",
  "ambre-prune", "ambre-corail", "ambre-azur", "ambre-aigue-marine",
  "corail-dore", "corail-ebene", "corail-indigo", "corail-pourpre", "corail-orchidee",
  "corail-amande", "corail-roux", "corail-ivoire", "corail-turquoise", "corail-emeraude",
  "corail-prune", "corail-azur", "corail-aigue-marine",
  "azur-dore", "azur-ebene", "azur-indigo", "azur-pourpre", "azur-orchidee",
  "azur-amande", "azur-roux", "azur-ivoire", "azur-turquoise", "azur-emeraude",
  "azur-prune", "azur-aigue-marine",
  "aigue-marine-dore", "aigue-marine-ebene", "aigue-marine-indigo", "aigue-marine-pourpre",
  "aigue-marine-orchidee", "aigue-marine-amande", "aigue-marine-roux", "aigue-marine-ivoire",
  "aigue-marine-turquoise", "aigue-marine-emeraude", "aigue-marine-prune",
];

function downloadImage(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `${IMG_BASE}${name}.png`;
    const outputPath = path.join(OUTPUT_DIR, `${name}.png`);

    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  ${name}.png (already exists)`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(outputPath);

    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.dofuspourlesnoobs.com/les-muldos.html",
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`  ✓ ${name}.png`);
          resolve();
        });
      } else {
        file.close();
        fs.unlinkSync(outputPath);
        console.log(`  ✗ ${name}.png (HTTP ${response.statusCode})`);
        resolve(); // Don't reject, continue with others
      }
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.log(`  ✗ ${name}.png (${err.message})`);
      resolve();
    });
  });
}

async function main() {
  console.log("📥 Téléchargement des images de Muldos...\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Download sequentially to avoid overwhelming the server
  for (const name of imageNames) {
    await downloadImage(name);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n✅ Terminé! ${imageNames.length} images traitées.`);
}

main().catch(console.error);
