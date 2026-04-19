import { PrismaClient, MountType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ============================================
// MULDOS (120 total)
// ============================================
const muldos = [
  // Generation 1 (5)
  { name: "Muldo Ebène", generation: 1, image: "ebene.png" },
  { name: "Muldo Indigo", generation: 1, image: "indigo.png" },
  { name: "Muldo Pourpre", generation: 1, image: "pourpre.png" },
  { name: "Muldo Orchidée", generation: 1, image: "orchidee.png" },
  { name: "Muldo Doré", generation: 1, image: "dore.png" },
  // Generation 2 (10)
  { name: "Muldo Doré et Pourpre", generation: 2, image: "dore-pourpre.png", parents: ["Muldo Doré", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Indigo et Pourpre", generation: 2, image: "indigo-pourpre.png", parents: ["Muldo Indigo", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Ebène et Pourpre", generation: 2, image: "ebene-pourpre.png", parents: ["Muldo Ebène", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Orchidée et Pourpre", generation: 2, image: "orchidee-pourpre.png", parents: ["Muldo Orchidée", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Doré et Orchidée", generation: 2, image: "dore-orchidee.png", parents: ["Muldo Doré", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Indigo et Orchidée", generation: 2, image: "indigo-orchidee.png", parents: ["Muldo Indigo", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Ebène et Orchidée", generation: 2, image: "ebene-orchidee.png", parents: ["Muldo Ebène", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Doré et Ebène", generation: 2, image: "dore-ebene.png", parents: ["Muldo Doré", "Muldo Ebène"] as [string, string] },
  { name: "Muldo Doré et Indigo", generation: 2, image: "dore-indigo.png", parents: ["Muldo Doré", "Muldo Indigo"] as [string, string] },
  { name: "Muldo Ebène et Indigo", generation: 2, image: "ebene-indigo.png", parents: ["Muldo Ebène", "Muldo Indigo"] as [string, string] },
  // Generation 3 (2)
  { name: "Muldo Roux", generation: 3, image: "roux.png", parents: ["Muldo Doré et Pourpre", "Muldo Doré et Indigo"] as [string, string],
    breedingCombinations: [["Muldo Doré et Pourpre", "Muldo Doré et Indigo"]] as [string, string][] },
  { name: "Muldo Amande", generation: 3, image: "amande.png", parents: ["Muldo Indigo et Pourpre", "Muldo Ebène et Orchidée"] as [string, string],
    breedingCombinations: [
      ["Muldo Indigo et Pourpre", "Muldo Ebène et Orchidée"],
      ["Muldo Ebène et Pourpre", "Muldo Indigo et Orchidée"],
      ["Muldo Orchidée et Pourpre", "Muldo Ebène et Indigo"],
    ] as [string, string][] },
  // Generation 4 (11)
  { name: "Muldo Doré et Amande", generation: 4, image: "dore-amande.png", parents: ["Muldo Doré", "Muldo Amande"] as [string, string] },
  { name: "Muldo Ebène et Amande", generation: 4, image: "ebene-amande.png", parents: ["Muldo Ebène", "Muldo Amande"] as [string, string] },
  { name: "Muldo Indigo et Amande", generation: 4, image: "indigo-amande.png", parents: ["Muldo Indigo", "Muldo Amande"] as [string, string] },
  { name: "Muldo Orchidée et Amande", generation: 4, image: "orchidee-amande.png", parents: ["Muldo Orchidée", "Muldo Amande"] as [string, string] },
  { name: "Muldo Pourpre et Amande", generation: 4, image: "pourpre-amande.png", parents: ["Muldo Pourpre", "Muldo Amande"] as [string, string] },
  { name: "Muldo Roux et Amande", generation: 4, image: "roux-amande.png", parents: ["Muldo Roux", "Muldo Amande"] as [string, string] },
  { name: "Muldo Roux et Doré", generation: 4, image: "roux-dore.png", parents: ["Muldo Roux", "Muldo Doré"] as [string, string] },
  { name: "Muldo Roux et Ebène", generation: 4, image: "roux-ebene.png", parents: ["Muldo Roux", "Muldo Ebène"] as [string, string] },
  { name: "Muldo Roux et Indigo", generation: 4, image: "roux-indigo.png", parents: ["Muldo Roux", "Muldo Indigo"] as [string, string] },
  { name: "Muldo Roux et Orchidée", generation: 4, image: "roux-orchidee.png", parents: ["Muldo Roux", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Roux et Pourpre", generation: 4, image: "roux-pourpre.png", parents: ["Muldo Roux", "Muldo Pourpre"] as [string, string] },
  // Generation 5 (2)
  { name: "Muldo Ivoire", generation: 5, image: "ivoire.png", parents: ["Muldo Roux et Doré", "Muldo Ebène et Amande"] as [string, string],
    breedingCombinations: [["Muldo Roux et Doré", "Muldo Ebène et Amande"]] as [string, string][] },
  { name: "Muldo Turquoise", generation: 5, image: "turquoise.png", parents: ["Muldo Doré et Amande", "Muldo Roux et Ebène"] as [string, string],
    breedingCombinations: [["Muldo Doré et Amande", "Muldo Roux et Ebène"]] as [string, string][] },
  // Generation 6 (15)
  { name: "Muldo Pourpre et Ivoire", generation: 6, image: "pourpre-ivoire.png", parents: ["Muldo Pourpre", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Orchidée et Ivoire", generation: 6, image: "orchidee-ivoire.png", parents: ["Muldo Orchidée", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Indigo et Ivoire", generation: 6, image: "indigo-ivoire.png", parents: ["Muldo Indigo", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Ebène et Ivoire", generation: 6, image: "ebene-ivoire.png", parents: ["Muldo Ebène", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Doré et Ivoire", generation: 6, image: "dore-ivoire.png", parents: ["Muldo Doré", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Roux et Ivoire", generation: 6, image: "roux-ivoire.png", parents: ["Muldo Roux", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Amande et Ivoire", generation: 6, image: "amande-ivoire.png", parents: ["Muldo Amande", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Turquoise et Ivoire", generation: 6, image: "turquoise-ivoire.png", parents: ["Muldo Turquoise", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Turquoise et Pourpre", generation: 6, image: "turquoise-pourpre.png", parents: ["Muldo Turquoise", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Turquoise et Orchidée", generation: 6, image: "turquoise-orchidee.png", parents: ["Muldo Turquoise", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Turquoise et Indigo", generation: 6, image: "turquoise-indigo.png", parents: ["Muldo Turquoise", "Muldo Indigo"] as [string, string] },
  { name: "Muldo Turquoise et Ebène", generation: 6, image: "turquoise-ebene.png", parents: ["Muldo Turquoise", "Muldo Ebène"] as [string, string] },
  { name: "Muldo Turquoise et Roux", generation: 6, image: "turquoise-roux.png", parents: ["Muldo Turquoise", "Muldo Roux"] as [string, string] },
  { name: "Muldo Turquoise et Amande", generation: 6, image: "turquoise-amande.png", parents: ["Muldo Turquoise", "Muldo Amande"] as [string, string] },
  { name: "Muldo Turquoise et Doré", generation: 6, image: "turquoise-dore.png", parents: ["Muldo Turquoise", "Muldo Doré"] as [string, string] },
  // Generation 7 (2)
  { name: "Muldo Prune", generation: 7, image: "prune.png", parents: ["Muldo Ebène et Ivoire", "Muldo Turquoise et Pourpre"] as [string, string],
    breedingCombinations: [["Muldo Ebène et Ivoire", "Muldo Turquoise et Pourpre"]] as [string, string][] },
  { name: "Muldo Emeraude", generation: 7, image: "emeraude.png", parents: ["Muldo Turquoise et Ivoire", "Muldo Turquoise et Doré"] as [string, string],
    breedingCombinations: [["Muldo Turquoise et Ivoire", "Muldo Turquoise et Doré"]] as [string, string][] },
  // Generation 8 (19)
  { name: "Muldo Prune et Pourpre", generation: 8, image: "prune-pourpre.png", parents: ["Muldo Prune", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Prune et Orchidée", generation: 8, image: "prune-orchidee.png", parents: ["Muldo Prune", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Prune et Indigo", generation: 8, image: "prune-indigo.png", parents: ["Muldo Prune", "Muldo Indigo"] as [string, string] },
  { name: "Muldo Prune et Ebène", generation: 8, image: "prune-ebene.png", parents: ["Muldo Prune", "Muldo Ebène"] as [string, string] },
  { name: "Muldo Prune et Doré", generation: 8, image: "prune-dore.png", parents: ["Muldo Prune", "Muldo Doré"] as [string, string] },
  { name: "Muldo Prune et Roux", generation: 8, image: "prune-roux.png", parents: ["Muldo Prune", "Muldo Roux"] as [string, string] },
  { name: "Muldo Prune et Amande", generation: 8, image: "prune-amande.png", parents: ["Muldo Prune", "Muldo Amande"] as [string, string] },
  { name: "Muldo Prune et Ivoire", generation: 8, image: "prune-ivoire.png", parents: ["Muldo Prune", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Prune et Turquoise", generation: 8, image: "prune-turquoise.png", parents: ["Muldo Prune", "Muldo Turquoise"] as [string, string] },
  { name: "Muldo Prune et Emeraude", generation: 8, image: "prune-emeraude.png", parents: ["Muldo Prune", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Pourpre et Emeraude", generation: 8, image: "pourpre-emeraude.png", parents: ["Muldo Pourpre", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Orchidée et Emeraude", generation: 8, image: "orchidee-emeraude.png", parents: ["Muldo Orchidée", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Indigo et Emeraude", generation: 8, image: "indigo-emeraude.png", parents: ["Muldo Indigo", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Ebène et Emeraude", generation: 8, image: "ebene-emeraude.png", parents: ["Muldo Ebène", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Doré et Emeraude", generation: 8, image: "dore-emeraude.png", parents: ["Muldo Doré", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Roux et Emeraude", generation: 8, image: "roux-emeraude.png", parents: ["Muldo Roux", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Amande et Emeraude", generation: 8, image: "amande-emeraude.png", parents: ["Muldo Amande", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Ivoire et Emeraude", generation: 8, image: "ivoire-emeraude.png", parents: ["Muldo Ivoire", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Turquoise et Emeraude", generation: 8, image: "turquoise-emeraude.png", parents: ["Muldo Turquoise", "Muldo Emeraude"] as [string, string] },
  // Generation 9 (4)
  { name: "Muldo Ambre", generation: 9, image: "ambre.png", parents: ["Muldo Pourpre et Emeraude", "Muldo Roux et Emeraude"] as [string, string],
    breedingCombinations: [["Muldo Pourpre et Emeraude", "Muldo Roux et Emeraude"]] as [string, string][] },
  { name: "Muldo Corail", generation: 9, image: "corail.png", parents: ["Muldo Prune et Pourpre", "Muldo Prune et Roux"] as [string, string],
    breedingCombinations: [["Muldo Prune et Pourpre", "Muldo Prune et Roux"]] as [string, string][] },
  { name: "Muldo Azur", generation: 9, image: "azur.png", parents: ["Muldo Pourpre et Emeraude", "Muldo Prune et Roux"] as [string, string],
    breedingCombinations: [["Muldo Pourpre et Emeraude", "Muldo Prune et Roux"]] as [string, string][] },
  { name: "Muldo Aigue-marine", generation: 9, image: "aigue-marine.png", parents: ["Muldo Prune et Pourpre", "Muldo Roux et Emeraude"] as [string, string],
    breedingCombinations: [["Muldo Prune et Pourpre", "Muldo Roux et Emeraude"]] as [string, string][] },
  // Generation 10 (50)
  { name: "Muldo Ambre et Doré", generation: 10, image: "ambre-dore.png", parents: ["Muldo Ambre", "Muldo Doré"] as [string, string] },
  { name: "Muldo Ambre et Ebène", generation: 10, image: "ambre-ebene.png", parents: ["Muldo Ambre", "Muldo Ebène"] as [string, string] },
  { name: "Muldo Ambre et Indigo", generation: 10, image: "ambre-indigo.png", parents: ["Muldo Ambre", "Muldo Indigo"] as [string, string] },
  { name: "Muldo Ambre et Pourpre", generation: 10, image: "ambre-pourpre.png", parents: ["Muldo Ambre", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Ambre et Orchidée", generation: 10, image: "ambre-orchidee.png", parents: ["Muldo Ambre", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Ambre et Amande", generation: 10, image: "ambre-amande.png", parents: ["Muldo Ambre", "Muldo Amande"] as [string, string] },
  { name: "Muldo Ambre et Roux", generation: 10, image: "ambre-roux.png", parents: ["Muldo Ambre", "Muldo Roux"] as [string, string] },
  { name: "Muldo Ambre et Ivoire", generation: 10, image: "ambre-ivoire.png", parents: ["Muldo Ambre", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Ambre et Turquoise", generation: 10, image: "ambre-turquoise.png", parents: ["Muldo Ambre", "Muldo Turquoise"] as [string, string] },
  { name: "Muldo Ambre et Emeraude", generation: 10, image: "ambre-emeraude.png", parents: ["Muldo Ambre", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Ambre et Prune", generation: 10, image: "ambre-prune.png", parents: ["Muldo Ambre", "Muldo Prune"] as [string, string] },
  { name: "Muldo Ambre et Corail", generation: 10, image: "ambre-corail.png", parents: ["Muldo Ambre", "Muldo Corail"] as [string, string] },
  { name: "Muldo Ambre et Azur", generation: 10, image: "ambre-azur.png", parents: ["Muldo Ambre", "Muldo Azur"] as [string, string] },
  { name: "Muldo Ambre et Aigue-marine", generation: 10, image: "ambre-aigue-marine.png", parents: ["Muldo Ambre", "Muldo Aigue-marine"] as [string, string] },
  { name: "Muldo Corail et Doré", generation: 10, image: "corail-dore.png", parents: ["Muldo Corail", "Muldo Doré"] as [string, string] },
  { name: "Muldo Corail et Ebène", generation: 10, image: "corail-ebene.png", parents: ["Muldo Corail", "Muldo Ebène"] as [string, string] },
  { name: "Muldo Corail et Indigo", generation: 10, image: "corail-indigo.png", parents: ["Muldo Corail", "Muldo Indigo"] as [string, string] },
  { name: "Muldo Corail et Pourpre", generation: 10, image: "corail-pourpre.png", parents: ["Muldo Corail", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Corail et Orchidée", generation: 10, image: "corail-orchidee.png", parents: ["Muldo Corail", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Corail et Amande", generation: 10, image: "corail-amande.png", parents: ["Muldo Corail", "Muldo Amande"] as [string, string] },
  { name: "Muldo Corail et Roux", generation: 10, image: "corail-roux.png", parents: ["Muldo Corail", "Muldo Roux"] as [string, string] },
  { name: "Muldo Corail et Ivoire", generation: 10, image: "corail-ivoire.png", parents: ["Muldo Corail", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Corail et Turquoise", generation: 10, image: "corail-turquoise.png", parents: ["Muldo Corail", "Muldo Turquoise"] as [string, string] },
  { name: "Muldo Corail et Emeraude", generation: 10, image: "corail-emeraude.png", parents: ["Muldo Corail", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Corail et Prune", generation: 10, image: "corail-prune.png", parents: ["Muldo Corail", "Muldo Prune"] as [string, string] },
  { name: "Muldo Corail et Azur", generation: 10, image: "corail-azur.png", parents: ["Muldo Corail", "Muldo Azur"] as [string, string] },
  { name: "Muldo Corail et Aigue-marine", generation: 10, image: "corail-aigue-marine.png", parents: ["Muldo Corail", "Muldo Aigue-marine"] as [string, string] },
  { name: "Muldo Azur et Doré", generation: 10, image: "azur-dore.png", parents: ["Muldo Azur", "Muldo Doré"] as [string, string] },
  { name: "Muldo Azur et Ebène", generation: 10, image: "azur-ebene.png", parents: ["Muldo Azur", "Muldo Ebène"] as [string, string] },
  { name: "Muldo Azur et Indigo", generation: 10, image: "azur-indigo.png", parents: ["Muldo Azur", "Muldo Indigo"] as [string, string] },
  { name: "Muldo Azur et Pourpre", generation: 10, image: "azur-pourpre.png", parents: ["Muldo Azur", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Azur et Orchidée", generation: 10, image: "azur-orchidee.png", parents: ["Muldo Azur", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Azur et Amande", generation: 10, image: "azur-amande.png", parents: ["Muldo Azur", "Muldo Amande"] as [string, string] },
  { name: "Muldo Azur et Roux", generation: 10, image: "azur-roux.png", parents: ["Muldo Azur", "Muldo Roux"] as [string, string] },
  { name: "Muldo Azur et Ivoire", generation: 10, image: "azur-ivoire.png", parents: ["Muldo Azur", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Azur et Turquoise", generation: 10, image: "azur-turquoise.png", parents: ["Muldo Azur", "Muldo Turquoise"] as [string, string] },
  { name: "Muldo Azur et Emeraude", generation: 10, image: "azur-emeraude.png", parents: ["Muldo Azur", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Azur et Prune", generation: 10, image: "azur-prune.png", parents: ["Muldo Azur", "Muldo Prune"] as [string, string] },
  { name: "Muldo Azur et Aigue-marine", generation: 10, image: "azur-aigue-marine.png", parents: ["Muldo Azur", "Muldo Aigue-marine"] as [string, string] },
  { name: "Muldo Aigue-marine et Doré", generation: 10, image: "aigue-marine-dore.png", parents: ["Muldo Aigue-marine", "Muldo Doré"] as [string, string] },
  { name: "Muldo Aigue-marine et Ebène", generation: 10, image: "aigue-marine-ebene.png", parents: ["Muldo Aigue-marine", "Muldo Ebène"] as [string, string] },
  { name: "Muldo Aigue-marine et Indigo", generation: 10, image: "aigue-marine-indigo.png", parents: ["Muldo Aigue-marine", "Muldo Indigo"] as [string, string] },
  { name: "Muldo Aigue-marine et Pourpre", generation: 10, image: "aigue-marine-pourpre.png", parents: ["Muldo Aigue-marine", "Muldo Pourpre"] as [string, string] },
  { name: "Muldo Aigue-marine et Orchidée", generation: 10, image: "aigue-marine-orchidee.png", parents: ["Muldo Aigue-marine", "Muldo Orchidée"] as [string, string] },
  { name: "Muldo Aigue-marine et Amande", generation: 10, image: "aigue-marine-amande.png", parents: ["Muldo Aigue-marine", "Muldo Amande"] as [string, string] },
  { name: "Muldo Aigue-marine et Roux", generation: 10, image: "aigue-marine-roux.png", parents: ["Muldo Aigue-marine", "Muldo Roux"] as [string, string] },
  { name: "Muldo Aigue-marine et Ivoire", generation: 10, image: "aigue-marine-ivoire.png", parents: ["Muldo Aigue-marine", "Muldo Ivoire"] as [string, string] },
  { name: "Muldo Aigue-marine et Turquoise", generation: 10, image: "aigue-marine-turquoise.png", parents: ["Muldo Aigue-marine", "Muldo Turquoise"] as [string, string] },
  { name: "Muldo Aigue-marine et Emeraude", generation: 10, image: "aigue-marine-emeraude.png", parents: ["Muldo Aigue-marine", "Muldo Emeraude"] as [string, string] },
  { name: "Muldo Aigue-marine et Prune", generation: 10, image: "aigue-marine-prune.png", parents: ["Muldo Aigue-marine", "Muldo Prune"] as [string, string] },
];

// ============================================
// DRAGODINDES (66 total)
// ============================================
const dragodindes = [
  // Generation 1 (3)
  { name: "Dragodinde Amande", generation: 1, image: "amande.png" },
  { name: "Dragodinde Dorée", generation: 1, image: "doree.png" },
  { name: "Dragodinde Rousse", generation: 1, image: "rousse.png" },
  // Generation 2 (3)
  { name: "Dragodinde Amande et Rousse", generation: 2, image: "amande-rousse.png", parents: ["Dragodinde Amande", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Dorée et Rousse", generation: 2, image: "doree-rousse.png", parents: ["Dragodinde Dorée", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Amande et Dorée", generation: 2, image: "amande-doree.png", parents: ["Dragodinde Amande", "Dragodinde Dorée"] as [string, string] },
  // Generation 3 (2)
  { name: "Dragodinde Ebène", generation: 3, image: "ebene.png", parents: ["Dragodinde Amande et Dorée", "Dragodinde Dorée et Rousse"] as [string, string] },
  { name: "Dragodinde Indigo", generation: 3, image: "indigo.png", parents: ["Dragodinde Amande et Dorée", "Dragodinde Amande et Rousse"] as [string, string] },
  // Generation 4 (7)
  { name: "Dragodinde Indigo et Rousse", generation: 4, image: "indigo-rousse.png", parents: ["Dragodinde Indigo", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Ebène et Rousse", generation: 4, image: "ebene-rousse.png", parents: ["Dragodinde Ebène", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Amande et Indigo", generation: 4, image: "amande-indigo.png", parents: ["Dragodinde Amande", "Dragodinde Indigo"] as [string, string] },
  { name: "Dragodinde Amande et Ebène", generation: 4, image: "amande-ebene.png", parents: ["Dragodinde Amande", "Dragodinde Ebène"] as [string, string] },
  { name: "Dragodinde Dorée et Indigo", generation: 4, image: "doree-indigo.png", parents: ["Dragodinde Dorée", "Dragodinde Indigo"] as [string, string] },
  { name: "Dragodinde Dorée et Ebène", generation: 4, image: "doree-ebene.png", parents: ["Dragodinde Dorée", "Dragodinde Ebène"] as [string, string] },
  { name: "Dragodinde Ebène et Indigo", generation: 4, image: "ebene-indigo.png", parents: ["Dragodinde Ebène", "Dragodinde Indigo"] as [string, string] },
  // Generation 5 (2)
  { name: "Dragodinde Pourpre", generation: 5, image: "pourpre.png", parents: ["Dragodinde Ebène et Indigo", "Dragodinde Amande et Rousse"] as [string, string] },
  { name: "Dragodinde Orchidée", generation: 5, image: "orchidee.png", parents: ["Dragodinde Ebène et Indigo", "Dragodinde Dorée et Rousse"] as [string, string] },
  // Generation 6 (11)
  { name: "Dragodinde Pourpre et Rousse", generation: 6, image: "pourpre-rousse.png", parents: ["Dragodinde Pourpre", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Orchidée et Rousse", generation: 6, image: "orchidee-rousse.png", parents: ["Dragodinde Orchidée", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Amande et Pourpre", generation: 6, image: "amande-pourpre.png", parents: ["Dragodinde Amande", "Dragodinde Pourpre"] as [string, string] },
  { name: "Dragodinde Amande et Orchidée", generation: 6, image: "amande-orchidee.png", parents: ["Dragodinde Amande", "Dragodinde Orchidée"] as [string, string] },
  { name: "Dragodinde Dorée et Pourpre", generation: 6, image: "doree-pourpre.png", parents: ["Dragodinde Dorée", "Dragodinde Pourpre"] as [string, string] },
  { name: "Dragodinde Dorée et Orchidée", generation: 6, image: "doree-orchidee.png", parents: ["Dragodinde Dorée", "Dragodinde Orchidée"] as [string, string] },
  { name: "Dragodinde Indigo et Pourpre", generation: 6, image: "indigo-pourpre.png", parents: ["Dragodinde Indigo", "Dragodinde Pourpre"] as [string, string] },
  { name: "Dragodinde Indigo et Orchidée", generation: 6, image: "indigo-orchidee.png", parents: ["Dragodinde Indigo", "Dragodinde Orchidée"] as [string, string] },
  { name: "Dragodinde Ebène et Pourpre", generation: 6, image: "ebene-pourpre.png", parents: ["Dragodinde Ebène", "Dragodinde Pourpre"] as [string, string] },
  { name: "Dragodinde Ebène et Orchidée", generation: 6, image: "ebene-orchidee.png", parents: ["Dragodinde Ebène", "Dragodinde Orchidée"] as [string, string] },
  { name: "Dragodinde Orchidée et Pourpre", generation: 6, image: "orchidee-pourpre.png", parents: ["Dragodinde Orchidée", "Dragodinde Pourpre"] as [string, string] },
  // Generation 7 (2)
  { name: "Dragodinde Ivoire", generation: 7, image: "ivoire.png", parents: ["Dragodinde Orchidée et Pourpre", "Dragodinde Indigo et Pourpre"] as [string, string] },
  { name: "Dragodinde Turquoise", generation: 7, image: "turquoise.png", parents: ["Dragodinde Orchidée et Pourpre", "Dragodinde Ebène et Orchidée"] as [string, string] },
  // Generation 8 (15)
  { name: "Dragodinde Ivoire et Rousse", generation: 8, image: "ivoire-rousse.png", parents: ["Dragodinde Ivoire", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Turquoise et Rousse", generation: 8, image: "turquoise-rousse.png", parents: ["Dragodinde Turquoise", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Amande et Ivoire", generation: 8, image: "amande-ivoire.png", parents: ["Dragodinde Amande", "Dragodinde Ivoire"] as [string, string] },
  { name: "Dragodinde Amande et Turquoise", generation: 8, image: "amande-turquoise.png", parents: ["Dragodinde Amande", "Dragodinde Turquoise"] as [string, string] },
  { name: "Dragodinde Dorée et Ivoire", generation: 8, image: "doree-ivoire.png", parents: ["Dragodinde Dorée", "Dragodinde Ivoire"] as [string, string] },
  { name: "Dragodinde Dorée et Turquoise", generation: 8, image: "doree-turquoise.png", parents: ["Dragodinde Dorée", "Dragodinde Turquoise"] as [string, string] },
  { name: "Dragodinde Indigo et Ivoire", generation: 8, image: "indigo-ivoire.png", parents: ["Dragodinde Indigo", "Dragodinde Ivoire"] as [string, string] },
  { name: "Dragodinde Indigo et Turquoise", generation: 8, image: "indigo-turquoise.png", parents: ["Dragodinde Indigo", "Dragodinde Turquoise"] as [string, string] },
  { name: "Dragodinde Ebène et Ivoire", generation: 8, image: "ebene-ivoire.png", parents: ["Dragodinde Ebène", "Dragodinde Ivoire"] as [string, string] },
  { name: "Dragodinde Ebène et Turquoise", generation: 8, image: "ebene-turquoise.png", parents: ["Dragodinde Ebène", "Dragodinde Turquoise"] as [string, string] },
  { name: "Dragodinde Ivoire et Pourpre", generation: 8, image: "ivoire-pourpre.png", parents: ["Dragodinde Ivoire", "Dragodinde Pourpre"] as [string, string] },
  { name: "Dragodinde Turquoise et Pourpre", generation: 8, image: "turquoise-pourpre.png", parents: ["Dragodinde Turquoise", "Dragodinde Pourpre"] as [string, string] },
  { name: "Dragodinde Ivoire et Orchidée", generation: 8, image: "ivoire-orchidee.png", parents: ["Dragodinde Ivoire", "Dragodinde Orchidée"] as [string, string] },
  { name: "Dragodinde Turquoise et Orchidée", generation: 8, image: "turquoise-orchidee.png", parents: ["Dragodinde Turquoise", "Dragodinde Orchidée"] as [string, string] },
  { name: "Dragodinde Ivoire et Turquoise", generation: 8, image: "ivoire-turquoise.png", parents: ["Dragodinde Ivoire", "Dragodinde Turquoise"] as [string, string] },
  // Generation 9 (2)
  { name: "Dragodinde Emeraude", generation: 9, image: "emeraude.png", parents: ["Dragodinde Ivoire et Turquoise", "Dragodinde Ivoire et Pourpre"] as [string, string] },
  { name: "Dragodinde Prune", generation: 9, image: "prune.png", parents: ["Dragodinde Ivoire et Turquoise", "Dragodinde Turquoise et Orchidée"] as [string, string] },
  // Generation 10 (19)
  { name: "Dragodinde Emeraude et Rousse", generation: 10, image: "emeraude-rousse.png", parents: ["Dragodinde Emeraude", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Prune et Rousse", generation: 10, image: "prune-rousse.png", parents: ["Dragodinde Prune", "Dragodinde Rousse"] as [string, string] },
  { name: "Dragodinde Amande et Emeraude", generation: 10, image: "amande-emeraude.png", parents: ["Dragodinde Amande", "Dragodinde Emeraude"] as [string, string] },
  { name: "Dragodinde Prune et Amande", generation: 10, image: "prune-amande.png", parents: ["Dragodinde Prune", "Dragodinde Amande"] as [string, string] },
  { name: "Dragodinde Dorée et Emeraude", generation: 10, image: "doree-emeraude.png", parents: ["Dragodinde Dorée", "Dragodinde Emeraude"] as [string, string] },
  { name: "Dragodinde Prune et Dorée", generation: 10, image: "prune-doree.png", parents: ["Dragodinde Prune", "Dragodinde Dorée"] as [string, string] },
  { name: "Dragodinde Emeraude et Indigo", generation: 10, image: "emeraude-indigo.png", parents: ["Dragodinde Emeraude", "Dragodinde Indigo"] as [string, string] },
  { name: "Dragodinde Prune et Indigo", generation: 10, image: "prune-indigo.png", parents: ["Dragodinde Prune", "Dragodinde Indigo"] as [string, string] },
  { name: "Dragodinde Ebène et Emeraude", generation: 10, image: "ebene-emeraude.png", parents: ["Dragodinde Ebène", "Dragodinde Emeraude"] as [string, string] },
  { name: "Dragodinde Prune et Ebène", generation: 10, image: "prune-ebene.png", parents: ["Dragodinde Prune", "Dragodinde Ebène"] as [string, string] },
  { name: "Dragodinde Emeraude et Pourpre", generation: 10, image: "emeraude-pourpre.png", parents: ["Dragodinde Emeraude", "Dragodinde Pourpre"] as [string, string] },
  { name: "Dragodinde Prune et Pourpre", generation: 10, image: "prune-pourpre.png", parents: ["Dragodinde Prune", "Dragodinde Pourpre"] as [string, string] },
  { name: "Dragodinde Emeraude et Orchidée", generation: 10, image: "emeraude-orchidee.png", parents: ["Dragodinde Emeraude", "Dragodinde Orchidée"] as [string, string] },
  { name: "Dragodinde Prune et Orchidée", generation: 10, image: "prune-orchidee.png", parents: ["Dragodinde Prune", "Dragodinde Orchidée"] as [string, string] },
  { name: "Dragodinde Emeraude et Ivoire", generation: 10, image: "emeraude-ivoire.png", parents: ["Dragodinde Emeraude", "Dragodinde Ivoire"] as [string, string] },
  { name: "Dragodinde Prune et Ivoire", generation: 10, image: "prune-ivoire.png", parents: ["Dragodinde Prune", "Dragodinde Ivoire"] as [string, string] },
  { name: "Dragodinde Emeraude et Turquoise", generation: 10, image: "emeraude-turquoise.png", parents: ["Dragodinde Emeraude", "Dragodinde Turquoise"] as [string, string] },
  { name: "Dragodinde Prune et Turquoise", generation: 10, image: "prune-turquoise.png", parents: ["Dragodinde Prune", "Dragodinde Turquoise"] as [string, string] },
  { name: "Dragodinde Prune et Emeraude", generation: 10, image: "prune-emeraude.png", parents: ["Dragodinde Prune", "Dragodinde Emeraude"] as [string, string] },
];

// ============================================
// VOLKORNES (120 total)
// ============================================
const volkornes = [
  // Generation 1 (4)
  { name: "Volkorne Ebène", generation: 1, image: "ebene.png" },
  { name: "Volkorne Indigo", generation: 1, image: "indigo.png" },
  { name: "Volkorne Pourpre", generation: 1, image: "pourpre.png" },
  { name: "Volkorne Orchidée", generation: 1, image: "orchidee.png" },
  // Generation 2 (6)
  { name: "Volkorne Pourpre et Orchidée", generation: 2, image: "pourpre-orchidee.png", parents: ["Volkorne Pourpre", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Pourpre et Indigo", generation: 2, image: "pourpre-indigo.png", parents: ["Volkorne Pourpre", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Pourpre et Ebène", generation: 2, image: "pourpre-ebene.png", parents: ["Volkorne Pourpre", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Orchidée et Indigo", generation: 2, image: "orchidee-indigo.png", parents: ["Volkorne Orchidée", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Orchidée et Ebène", generation: 2, image: "orchidee-ebene.png", parents: ["Volkorne Orchidée", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Indigo et Ebène", generation: 2, image: "indigo-ebene.png", parents: ["Volkorne Indigo", "Volkorne Ebène"] as [string, string] },
  // Generation 3 (4)
  { name: "Volkorne Roux", generation: 3, image: "roux.png", parents: ["Volkorne Pourpre et Orchidée", "Volkorne Pourpre et Indigo"] as [string, string] },
  { name: "Volkorne Amande", generation: 3, image: "amande.png", parents: ["Volkorne Pourpre et Ebène", "Volkorne Orchidée et Ebène"] as [string, string] },
  { name: "Volkorne Ivoire", generation: 3, image: "ivoire.png", parents: ["Volkorne Pourpre et Indigo", "Volkorne Indigo et Ebène"] as [string, string] },
  { name: "Volkorne Turquoise", generation: 3, image: "turquoise.png", parents: ["Volkorne Pourpre et Orchidée", "Volkorne Orchidée et Ebène"] as [string, string] },
  // Generation 4 (22)
  { name: "Volkorne Amande et Pourpre", generation: 4, image: "amande-pourpre.png", parents: ["Volkorne Amande", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Amande et Orchidée", generation: 4, image: "amande-orchidee.png", parents: ["Volkorne Amande", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Amande et Indigo", generation: 4, image: "amande-indigo.png", parents: ["Volkorne Amande", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Amande et Ebène", generation: 4, image: "amande-ebene.png", parents: ["Volkorne Amande", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Amande et Roux", generation: 4, image: "amande-roux.png", parents: ["Volkorne Amande", "Volkorne Roux"] as [string, string] },
  { name: "Volkorne Amande et Ivoire", generation: 4, image: "amande-ivoire.png", parents: ["Volkorne Amande", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Amande et Turquoise", generation: 4, image: "amande-turquoise.png", parents: ["Volkorne Amande", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Roux et Pourpre", generation: 4, image: "roux-pourpre.png", parents: ["Volkorne Roux", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Roux et Orchidée", generation: 4, image: "roux-orchidee.png", parents: ["Volkorne Roux", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Roux et Indigo", generation: 4, image: "roux-indigo.png", parents: ["Volkorne Roux", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Roux et Ebène", generation: 4, image: "roux-ebene.png", parents: ["Volkorne Roux", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Roux et Ivoire", generation: 4, image: "roux-ivoire.png", parents: ["Volkorne Roux", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Roux et Turquoise", generation: 4, image: "roux-turquoise.png", parents: ["Volkorne Roux", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Ivoire et Pourpre", generation: 4, image: "ivoire-pourpre.png", parents: ["Volkorne Ivoire", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Ivoire et Orchidée", generation: 4, image: "ivoire-orchidee.png", parents: ["Volkorne Ivoire", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Ivoire et Indigo", generation: 4, image: "ivoire-indigo.png", parents: ["Volkorne Ivoire", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Ivoire et Ebène", generation: 4, image: "ivoire-ebene.png", parents: ["Volkorne Ivoire", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Ivoire et Turquoise", generation: 4, image: "ivoire-turquoise.png", parents: ["Volkorne Ivoire", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Turquoise et Pourpre", generation: 4, image: "turquoise-pourpre.png", parents: ["Volkorne Turquoise", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Turquoise et Orchidée", generation: 4, image: "turquoise-orchidee.png", parents: ["Volkorne Turquoise", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Turquoise et Indigo", generation: 4, image: "turquoise-indigo.png", parents: ["Volkorne Turquoise", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Turquoise et Ebène", generation: 4, image: "turquoise-ebene.png", parents: ["Volkorne Turquoise", "Volkorne Ebène"] as [string, string] },
  // Generation 5 (2)
  { name: "Volkorne Prune", generation: 5, image: "prune.png", parents: ["Volkorne Amande et Roux", "Volkorne Amande et Pourpre"] as [string, string] },
  { name: "Volkorne Emeraude", generation: 5, image: "emeraude.png", parents: ["Volkorne Ivoire et Turquoise", "Volkorne Ivoire et Orchidée"] as [string, string] },
  // Generation 6 (17)
  { name: "Volkorne Prune et Pourpre", generation: 6, image: "prune-pourpre.png", parents: ["Volkorne Prune", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Prune et Orchidée", generation: 6, image: "prune-orchidee.png", parents: ["Volkorne Prune", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Prune et Indigo", generation: 6, image: "prune-indigo.png", parents: ["Volkorne Prune", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Prune et Ebène", generation: 6, image: "prune-ebene.png", parents: ["Volkorne Prune", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Prune et Amande", generation: 6, image: "prune-amande.png", parents: ["Volkorne Prune", "Volkorne Amande"] as [string, string] },
  { name: "Volkorne Prune et Roux", generation: 6, image: "prune-roux.png", parents: ["Volkorne Prune", "Volkorne Roux"] as [string, string] },
  { name: "Volkorne Prune et Ivoire", generation: 6, image: "prune-ivoire.png", parents: ["Volkorne Prune", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Prune et Turquoise", generation: 6, image: "prune-turquoise.png", parents: ["Volkorne Prune", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Prune et Emeraude", generation: 6, image: "prune-emeraude.png", parents: ["Volkorne Prune", "Volkorne Emeraude"] as [string, string] },
  { name: "Volkorne Emeraude et Pourpre", generation: 6, image: "emeraude-pourpre.png", parents: ["Volkorne Emeraude", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Emeraude et Orchidée", generation: 6, image: "emeraude-orchidee.png", parents: ["Volkorne Emeraude", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Emeraude et Indigo", generation: 6, image: "emeraude-indigo.png", parents: ["Volkorne Emeraude", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Emeraude et Ebène", generation: 6, image: "emeraude-ebene.png", parents: ["Volkorne Emeraude", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Emeraude et Amande", generation: 6, image: "emeraude-amande.png", parents: ["Volkorne Emeraude", "Volkorne Amande"] as [string, string] },
  { name: "Volkorne Emeraude et Roux", generation: 6, image: "emeraude-roux.png", parents: ["Volkorne Emeraude", "Volkorne Roux"] as [string, string] },
  { name: "Volkorne Emeraude et Ivoire", generation: 6, image: "emeraude-ivoire.png", parents: ["Volkorne Emeraude", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Emeraude et Turquoise", generation: 6, image: "emeraude-turquoise.png", parents: ["Volkorne Emeraude", "Volkorne Turquoise"] as [string, string] },
  // Generation 7 (1)
  { name: "Volkorne Doré", generation: 7, image: "dore.png", parents: ["Volkorne Prune et Pourpre", "Volkorne Emeraude et Roux"] as [string, string] },
  // Generation 8 (10)
  { name: "Volkorne Doré et Pourpre", generation: 8, image: "dore-pourpre.png", parents: ["Volkorne Doré", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Doré et Orchidée", generation: 8, image: "dore-orchidee.png", parents: ["Volkorne Doré", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Doré et Indigo", generation: 8, image: "dore-indigo.png", parents: ["Volkorne Doré", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Doré et Ebène", generation: 8, image: "dore-ebene.png", parents: ["Volkorne Doré", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Doré et Roux", generation: 8, image: "dore-roux.png", parents: ["Volkorne Doré", "Volkorne Roux"] as [string, string] },
  { name: "Volkorne Doré et Amande", generation: 8, image: "dore-amande.png", parents: ["Volkorne Doré", "Volkorne Amande"] as [string, string] },
  { name: "Volkorne Doré et Ivoire", generation: 8, image: "dore-ivoire.png", parents: ["Volkorne Doré", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Doré et Turquoise", generation: 8, image: "dore-turquoise.png", parents: ["Volkorne Doré", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Doré et Prune", generation: 8, image: "dore-prune.png", parents: ["Volkorne Doré", "Volkorne Prune"] as [string, string] },
  { name: "Volkorne Doré et Emeraude", generation: 8, image: "dore-emeraude.png", parents: ["Volkorne Doré", "Volkorne Emeraude"] as [string, string] },
  // Generation 9 (4)
  { name: "Volkorne Jade", generation: 9, image: "jade.png", parents: ["Volkorne Doré et Pourpre", "Volkorne Prune et Emeraude"] as [string, string] },
  { name: "Volkorne Rubis", generation: 9, image: "rubis.png", parents: ["Volkorne Doré et Orchidée", "Volkorne Prune et Emeraude"] as [string, string] },
  { name: "Volkorne Saphir", generation: 9, image: "saphir.png", parents: ["Volkorne Doré et Indigo", "Volkorne Prune et Emeraude"] as [string, string] },
  { name: "Volkorne Améthyste", generation: 9, image: "amethyste.png", parents: ["Volkorne Doré et Ebène", "Volkorne Prune et Emeraude"] as [string, string] },
  // Generation 10 (50)
  { name: "Volkorne Jade et Pourpre", generation: 10, image: "jade-pourpre.png", parents: ["Volkorne Jade", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Jade et Orchidée", generation: 10, image: "jade-orchidee.png", parents: ["Volkorne Jade", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Jade et Indigo", generation: 10, image: "jade-indigo.png", parents: ["Volkorne Jade", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Jade et Ebène", generation: 10, image: "jade-ebene.png", parents: ["Volkorne Jade", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Jade et Amande", generation: 10, image: "jade-amande.png", parents: ["Volkorne Jade", "Volkorne Amande"] as [string, string] },
  { name: "Volkorne Jade et Roux", generation: 10, image: "jade-roux.png", parents: ["Volkorne Jade", "Volkorne Roux"] as [string, string] },
  { name: "Volkorne Jade et Ivoire", generation: 10, image: "jade-ivoire.png", parents: ["Volkorne Jade", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Jade et Turquoise", generation: 10, image: "jade-turquoise.png", parents: ["Volkorne Jade", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Jade et Prune", generation: 10, image: "jade-prune.png", parents: ["Volkorne Jade", "Volkorne Prune"] as [string, string] },
  { name: "Volkorne Jade et Emeraude", generation: 10, image: "jade-emeraude.png", parents: ["Volkorne Jade", "Volkorne Emeraude"] as [string, string] },
  { name: "Volkorne Jade et Doré", generation: 10, image: "jade-dore.png", parents: ["Volkorne Jade", "Volkorne Doré"] as [string, string] },
  { name: "Volkorne Jade et Rubis", generation: 10, image: "jade-rubis.png", parents: ["Volkorne Jade", "Volkorne Rubis"] as [string, string] },
  { name: "Volkorne Jade et Saphir", generation: 10, image: "jade-saphir.png", parents: ["Volkorne Jade", "Volkorne Saphir"] as [string, string] },
  { name: "Volkorne Jade et Améthyste", generation: 10, image: "jade-amethyste.png", parents: ["Volkorne Jade", "Volkorne Améthyste"] as [string, string] },
  { name: "Volkorne Rubis et Pourpre", generation: 10, image: "rubis-pourpre.png", parents: ["Volkorne Rubis", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Rubis et Orchidée", generation: 10, image: "rubis-orchidee.png", parents: ["Volkorne Rubis", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Rubis et Indigo", generation: 10, image: "rubis-indigo.png", parents: ["Volkorne Rubis", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Rubis et Ebène", generation: 10, image: "rubis-ebene.png", parents: ["Volkorne Rubis", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Rubis et Amande", generation: 10, image: "rubis-amande.png", parents: ["Volkorne Rubis", "Volkorne Amande"] as [string, string] },
  { name: "Volkorne Rubis et Roux", generation: 10, image: "rubis-roux.png", parents: ["Volkorne Rubis", "Volkorne Roux"] as [string, string] },
  { name: "Volkorne Rubis et Ivoire", generation: 10, image: "rubis-ivoire.png", parents: ["Volkorne Rubis", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Rubis et Turquoise", generation: 10, image: "rubis-turquoise.png", parents: ["Volkorne Rubis", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Rubis et Prune", generation: 10, image: "rubis-prune.png", parents: ["Volkorne Rubis", "Volkorne Prune"] as [string, string] },
  { name: "Volkorne Rubis et Emeraude", generation: 10, image: "rubis-emeraude.png", parents: ["Volkorne Rubis", "Volkorne Emeraude"] as [string, string] },
  { name: "Volkorne Rubis et Doré", generation: 10, image: "rubis-dore.png", parents: ["Volkorne Rubis", "Volkorne Doré"] as [string, string] },
  { name: "Volkorne Rubis et Saphir", generation: 10, image: "rubis-saphir.png", parents: ["Volkorne Rubis", "Volkorne Saphir"] as [string, string] },
  { name: "Volkorne Rubis et Améthyste", generation: 10, image: "rubis-amethyste.png", parents: ["Volkorne Rubis", "Volkorne Améthyste"] as [string, string] },
  { name: "Volkorne Saphir et Pourpre", generation: 10, image: "saphir-pourpre.png", parents: ["Volkorne Saphir", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Saphir et Orchidée", generation: 10, image: "saphir-orchidee.png", parents: ["Volkorne Saphir", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Saphir et Indigo", generation: 10, image: "saphir-indigo.png", parents: ["Volkorne Saphir", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Saphir et Ebène", generation: 10, image: "saphir-ebene.png", parents: ["Volkorne Saphir", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Saphir et Amande", generation: 10, image: "saphir-amande.png", parents: ["Volkorne Saphir", "Volkorne Amande"] as [string, string] },
  { name: "Volkorne Saphir et Roux", generation: 10, image: "saphir-roux.png", parents: ["Volkorne Saphir", "Volkorne Roux"] as [string, string] },
  { name: "Volkorne Saphir et Ivoire", generation: 10, image: "saphir-ivoire.png", parents: ["Volkorne Saphir", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Saphir et Turquoise", generation: 10, image: "saphir-turquoise.png", parents: ["Volkorne Saphir", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Saphir et Prune", generation: 10, image: "saphir-prune.png", parents: ["Volkorne Saphir", "Volkorne Prune"] as [string, string] },
  { name: "Volkorne Saphir et Emeraude", generation: 10, image: "saphir-emeraude.png", parents: ["Volkorne Saphir", "Volkorne Emeraude"] as [string, string] },
  { name: "Volkorne Saphir et Doré", generation: 10, image: "saphir-dore.png", parents: ["Volkorne Saphir", "Volkorne Doré"] as [string, string] },
  { name: "Volkorne Saphir et Améthyste", generation: 10, image: "saphir-amethyste.png", parents: ["Volkorne Saphir", "Volkorne Améthyste"] as [string, string] },
  { name: "Volkorne Améthyste et Pourpre", generation: 10, image: "amethyste-pourpre.png", parents: ["Volkorne Améthyste", "Volkorne Pourpre"] as [string, string] },
  { name: "Volkorne Améthyste et Orchidée", generation: 10, image: "amethyste-orchidee.png", parents: ["Volkorne Améthyste", "Volkorne Orchidée"] as [string, string] },
  { name: "Volkorne Améthyste et Indigo", generation: 10, image: "amethyste-indigo.png", parents: ["Volkorne Améthyste", "Volkorne Indigo"] as [string, string] },
  { name: "Volkorne Améthyste et Ebène", generation: 10, image: "amethyste-ebene.png", parents: ["Volkorne Améthyste", "Volkorne Ebène"] as [string, string] },
  { name: "Volkorne Améthyste et Amande", generation: 10, image: "amethyste-amande.png", parents: ["Volkorne Améthyste", "Volkorne Amande"] as [string, string] },
  { name: "Volkorne Améthyste et Roux", generation: 10, image: "amethyste-roux.png", parents: ["Volkorne Améthyste", "Volkorne Roux"] as [string, string] },
  { name: "Volkorne Améthyste et Ivoire", generation: 10, image: "amethyste-ivoire.png", parents: ["Volkorne Améthyste", "Volkorne Ivoire"] as [string, string] },
  { name: "Volkorne Améthyste et Turquoise", generation: 10, image: "amethyste-turquoise.png", parents: ["Volkorne Améthyste", "Volkorne Turquoise"] as [string, string] },
  { name: "Volkorne Améthyste et Prune", generation: 10, image: "amethyste-prune.png", parents: ["Volkorne Améthyste", "Volkorne Prune"] as [string, string] },
  { name: "Volkorne Améthyste et Emeraude", generation: 10, image: "amethyste-emeraude.png", parents: ["Volkorne Améthyste", "Volkorne Emeraude"] as [string, string] },
  { name: "Volkorne Améthyste et Doré", generation: 10, image: "amethyste-dore.png", parents: ["Volkorne Améthyste", "Volkorne Doré"] as [string, string] },
];

type MountData = {
  name: string;
  generation: number;
  image: string;
  parents?: [string, string];
  breedingCombinations?: [string, string][];
};

async function seedMounts(
  data: MountData[],
  type: MountType,
  imageFolder: string
) {
  console.log(`\n📦 Insertion des ${data.length} ${type}s...`);
  const nameToId = new Map<string, number>();

  // Sort by generation to ensure parents are created first
  const sorted = [...data].sort((a, b) => a.generation - b.generation);

  // Group by generation for display
  let currentGen = 0;

  for (const item of sorted) {
    if (item.generation !== currentGen) {
      currentGen = item.generation;
      console.log(`\n=== Génération ${currentGen} ===`);
    }

    const parent1Id = item.parents ? nameToId.get(item.parents[0]) : null;
    const parent2Id = item.parents ? nameToId.get(item.parents[1]) : null;

    const breedingCombinations = item.breedingCombinations ?? null;

    const mount = await prisma.mount.upsert({
      where: { name_type: { name: item.name, type } },
      update: {
        generation: item.generation,
        imageUrl: `/${imageFolder}/${item.image}`,
        parent1Id,
        parent2Id,
        breedingCombinations,
      },
      create: {
        name: item.name,
        type,
        generation: item.generation,
        imageUrl: `/${imageFolder}/${item.image}`,
        parent1Id,
        parent2Id,
        breedingCombinations,
      },
    });

    nameToId.set(item.name, mount.id);
    console.log(`  ✓ ${item.name}`);
  }

  return nameToId.size;
}

async function main() {
  console.log("🌱 Début du seeding...");

  const muldoCount = await seedMounts(muldos, MountType.MULDO, "muldos");
  const dragodindeCount = await seedMounts(dragodindes, MountType.DRAGODINDE, "dragodindes");
  const volkorneCount = await seedMounts(volkornes, MountType.VOLKORNE, "volkornes");

  console.log(`\n✅ Seeding terminé!`);
  console.log(`   - ${muldoCount} Muldos`);
  console.log(`   - ${dragodindeCount} Dragodindes`);
  console.log(`   - ${volkorneCount} Volkornes`);
  console.log(`   Total: ${muldoCount + dragodindeCount + volkorneCount} montures`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
