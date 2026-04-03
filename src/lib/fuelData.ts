// Shared fuel data and localStorage helpers for carburants page + optimizer

export interface Fuel {
  id: number;
  name: string;
  gauge: string;
  tier: string;
  size: string;
  durability: number;
  maxGauge: number;
  level: number;
  iconId: number;
  img: string;
}

export const GAUGES = ["Baffeur", "Caresseur", "Foudroyeur", "Abreuvoir", "Dragofesse", "Mangeoire"] as const;
export const TIERS = ["Extrait", "Philtre", "Potion", "Élixir"] as const;
export const SIZES = ["Minuscule", "Petit", "Normal", "Grand", "Gigantesque"] as const;

export const GAUGE_INFO: Record<string, { stat: string; color: string; emoji: string }> = {
  Baffeur: { stat: "Sérénité -", color: "text-red-500", emoji: "👊" },
  Caresseur: { stat: "Sérénité +", color: "text-pink-500", emoji: "🤗" },
  Foudroyeur: { stat: "Endurance", color: "text-yellow-500", emoji: "⚡" },
  Abreuvoir: { stat: "Maturité", color: "text-blue-500", emoji: "💧" },
  Dragofesse: { stat: "Amour", color: "text-rose-500", emoji: "❤️" },
  Mangeoire: { stat: "XP", color: "text-green-500", emoji: "🍽️" },
};

export const TIER_INFO: Record<string, { maxGauge: number; color: string }> = {
  Extrait: { maxGauge: 40000, color: "bg-gray-500/10 text-gray-500 border-gray-500/30" },
  Philtre: { maxGauge: 70000, color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  Potion: { maxGauge: 90000, color: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  "Élixir": { maxGauge: 100000, color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
};

export const SIZE_DURABILITY: Record<string, number> = {
  Minuscule: 1000,
  Petit: 2000,
  Normal: 3000,
  Grand: 4000,
  Gigantesque: 5000,
};

// All 120 fuels (6 gauges × 4 tiers × 5 sizes) from DofusDB API typeId=326
export const ALL_FUELS: Fuel[] = [
  { id: 33309, name: "Minuscule Extrait de Baffeur", gauge: "Baffeur", tier: "Extrait", size: "Minuscule", durability: 1000, maxGauge: 40000, level: 5, iconId: 93198, img: "https://api.dofusdb.fr/img/items/93198.png" },
  { id: 33321, name: "Petit Extrait de Baffeur", gauge: "Baffeur", tier: "Extrait", size: "Petit", durability: 2000, maxGauge: 40000, level: 15, iconId: 93198, img: "https://api.dofusdb.fr/img/items/93198.png" },
  { id: 33333, name: "Extrait de Baffeur", gauge: "Baffeur", tier: "Extrait", size: "Normal", durability: 3000, maxGauge: 40000, level: 25, iconId: 93198, img: "https://api.dofusdb.fr/img/items/93198.png" },
  { id: 33345, name: "Grand Extrait de Baffeur", gauge: "Baffeur", tier: "Extrait", size: "Grand", durability: 4000, maxGauge: 40000, level: 35, iconId: 93198, img: "https://api.dofusdb.fr/img/items/93198.png" },
  { id: 33357, name: "Gigantesque Extrait de Baffeur", gauge: "Baffeur", tier: "Extrait", size: "Gigantesque", durability: 5000, maxGauge: 40000, level: 45, iconId: 93198, img: "https://api.dofusdb.fr/img/items/93198.png" },
  { id: 33369, name: "Minuscule Philtre de Baffeur", gauge: "Baffeur", tier: "Philtre", size: "Minuscule", durability: 1000, maxGauge: 70000, level: 55, iconId: 93210, img: "https://api.dofusdb.fr/img/items/93210.png" },
  { id: 33381, name: "Petit Philtre de Baffeur", gauge: "Baffeur", tier: "Philtre", size: "Petit", durability: 2000, maxGauge: 70000, level: 65, iconId: 93210, img: "https://api.dofusdb.fr/img/items/93210.png" },
  { id: 33393, name: "Philtre de Baffeur", gauge: "Baffeur", tier: "Philtre", size: "Normal", durability: 3000, maxGauge: 70000, level: 75, iconId: 93210, img: "https://api.dofusdb.fr/img/items/93210.png" },
  { id: 33405, name: "Grand Philtre de Baffeur", gauge: "Baffeur", tier: "Philtre", size: "Grand", durability: 4000, maxGauge: 70000, level: 85, iconId: 93210, img: "https://api.dofusdb.fr/img/items/93210.png" },
  { id: 33417, name: "Gigantesque Philtre de Baffeur", gauge: "Baffeur", tier: "Philtre", size: "Gigantesque", durability: 5000, maxGauge: 70000, level: 95, iconId: 93210, img: "https://api.dofusdb.fr/img/items/93210.png" },
  { id: 33429, name: "Minuscule Potion de Baffeur", gauge: "Baffeur", tier: "Potion", size: "Minuscule", durability: 1000, maxGauge: 90000, level: 105, iconId: 93222, img: "https://api.dofusdb.fr/img/items/93222.png" },
  { id: 33441, name: "Petit Potion de Baffeur", gauge: "Baffeur", tier: "Potion", size: "Petit", durability: 2000, maxGauge: 90000, level: 115, iconId: 93222, img: "https://api.dofusdb.fr/img/items/93222.png" },
  { id: 33453, name: "Potion de Baffeur", gauge: "Baffeur", tier: "Potion", size: "Normal", durability: 3000, maxGauge: 90000, level: 125, iconId: 93222, img: "https://api.dofusdb.fr/img/items/93222.png" },
  { id: 33465, name: "Grand Potion de Baffeur", gauge: "Baffeur", tier: "Potion", size: "Grand", durability: 4000, maxGauge: 90000, level: 135, iconId: 93222, img: "https://api.dofusdb.fr/img/items/93222.png" },
  { id: 33477, name: "Gigantesque Potion de Baffeur", gauge: "Baffeur", tier: "Potion", size: "Gigantesque", durability: 5000, maxGauge: 90000, level: 145, iconId: 93222, img: "https://api.dofusdb.fr/img/items/93222.png" },
  { id: 33489, name: "Minuscule Élixir de Baffeur", gauge: "Baffeur", tier: "Élixir", size: "Minuscule", durability: 1000, maxGauge: 100000, level: 155, iconId: 93234, img: "https://api.dofusdb.fr/img/items/93234.png" },
  { id: 33497, name: "Petit Élixir de Baffeur", gauge: "Baffeur", tier: "Élixir", size: "Petit", durability: 2000, maxGauge: 100000, level: 165, iconId: 93234, img: "https://api.dofusdb.fr/img/items/93234.png" },
  { id: 33505, name: "Élixir de Baffeur", gauge: "Baffeur", tier: "Élixir", size: "Normal", durability: 3000, maxGauge: 100000, level: 175, iconId: 93234, img: "https://api.dofusdb.fr/img/items/93234.png" },
  { id: 33513, name: "Grand Élixir de Baffeur", gauge: "Baffeur", tier: "Élixir", size: "Grand", durability: 4000, maxGauge: 100000, level: 185, iconId: 93234, img: "https://api.dofusdb.fr/img/items/93234.png" },
  { id: 33521, name: "Gigantesque Élixir de Baffeur", gauge: "Baffeur", tier: "Élixir", size: "Gigantesque", durability: 5000, maxGauge: 100000, level: 195, iconId: 93234, img: "https://api.dofusdb.fr/img/items/93234.png" },
  { id: 33310, name: "Minuscule Extrait de Caresseur", gauge: "Caresseur", tier: "Extrait", size: "Minuscule", durability: 1000, maxGauge: 40000, level: 5, iconId: 93199, img: "https://api.dofusdb.fr/img/items/93199.png" },
  { id: 33322, name: "Petit Extrait de Caresseur", gauge: "Caresseur", tier: "Extrait", size: "Petit", durability: 2000, maxGauge: 40000, level: 15, iconId: 93199, img: "https://api.dofusdb.fr/img/items/93199.png" },
  { id: 33334, name: "Extrait de Caresseur", gauge: "Caresseur", tier: "Extrait", size: "Normal", durability: 3000, maxGauge: 40000, level: 25, iconId: 93199, img: "https://api.dofusdb.fr/img/items/93199.png" },
  { id: 33346, name: "Grand Extrait de Caresseur", gauge: "Caresseur", tier: "Extrait", size: "Grand", durability: 4000, maxGauge: 40000, level: 35, iconId: 93199, img: "https://api.dofusdb.fr/img/items/93199.png" },
  { id: 33358, name: "Gigantesque Extrait de Caresseur", gauge: "Caresseur", tier: "Extrait", size: "Gigantesque", durability: 5000, maxGauge: 40000, level: 45, iconId: 93199, img: "https://api.dofusdb.fr/img/items/93199.png" },
  { id: 33370, name: "Minuscule Philtre de Caresseur", gauge: "Caresseur", tier: "Philtre", size: "Minuscule", durability: 1000, maxGauge: 70000, level: 55, iconId: 93211, img: "https://api.dofusdb.fr/img/items/93211.png" },
  { id: 33382, name: "Petit Philtre de Caresseur", gauge: "Caresseur", tier: "Philtre", size: "Petit", durability: 2000, maxGauge: 70000, level: 65, iconId: 93211, img: "https://api.dofusdb.fr/img/items/93211.png" },
  { id: 33394, name: "Philtre de Caresseur", gauge: "Caresseur", tier: "Philtre", size: "Normal", durability: 3000, maxGauge: 70000, level: 75, iconId: 93211, img: "https://api.dofusdb.fr/img/items/93211.png" },
  { id: 33406, name: "Grand Philtre de Caresseur", gauge: "Caresseur", tier: "Philtre", size: "Grand", durability: 4000, maxGauge: 70000, level: 85, iconId: 93211, img: "https://api.dofusdb.fr/img/items/93211.png" },
  { id: 33418, name: "Gigantesque Philtre de Caresseur", gauge: "Caresseur", tier: "Philtre", size: "Gigantesque", durability: 5000, maxGauge: 70000, level: 95, iconId: 93211, img: "https://api.dofusdb.fr/img/items/93211.png" },
  { id: 33430, name: "Minuscule Potion de Caresseur", gauge: "Caresseur", tier: "Potion", size: "Minuscule", durability: 1000, maxGauge: 90000, level: 105, iconId: 93223, img: "https://api.dofusdb.fr/img/items/93223.png" },
  { id: 33442, name: "Petit Potion de Caresseur", gauge: "Caresseur", tier: "Potion", size: "Petit", durability: 2000, maxGauge: 90000, level: 115, iconId: 93223, img: "https://api.dofusdb.fr/img/items/93223.png" },
  { id: 33454, name: "Potion de Caresseur", gauge: "Caresseur", tier: "Potion", size: "Normal", durability: 3000, maxGauge: 90000, level: 125, iconId: 93223, img: "https://api.dofusdb.fr/img/items/93223.png" },
  { id: 33466, name: "Grand Potion de Caresseur", gauge: "Caresseur", tier: "Potion", size: "Grand", durability: 4000, maxGauge: 90000, level: 135, iconId: 93223, img: "https://api.dofusdb.fr/img/items/93223.png" },
  { id: 33478, name: "Gigantesque Potion de Caresseur", gauge: "Caresseur", tier: "Potion", size: "Gigantesque", durability: 5000, maxGauge: 90000, level: 145, iconId: 93223, img: "https://api.dofusdb.fr/img/items/93223.png" },
  { id: 33490, name: "Minuscule Élixir de Caresseur", gauge: "Caresseur", tier: "Élixir", size: "Minuscule", durability: 1000, maxGauge: 100000, level: 155, iconId: 93235, img: "https://api.dofusdb.fr/img/items/93235.png" },
  { id: 33498, name: "Petit Élixir de Caresseur", gauge: "Caresseur", tier: "Élixir", size: "Petit", durability: 2000, maxGauge: 100000, level: 165, iconId: 93235, img: "https://api.dofusdb.fr/img/items/93235.png" },
  { id: 33506, name: "Élixir de Caresseur", gauge: "Caresseur", tier: "Élixir", size: "Normal", durability: 3000, maxGauge: 100000, level: 175, iconId: 93235, img: "https://api.dofusdb.fr/img/items/93235.png" },
  { id: 33514, name: "Grand Élixir de Caresseur", gauge: "Caresseur", tier: "Élixir", size: "Grand", durability: 4000, maxGauge: 100000, level: 185, iconId: 93235, img: "https://api.dofusdb.fr/img/items/93235.png" },
  { id: 33522, name: "Gigantesque Élixir de Caresseur", gauge: "Caresseur", tier: "Élixir", size: "Gigantesque", durability: 5000, maxGauge: 100000, level: 195, iconId: 93235, img: "https://api.dofusdb.fr/img/items/93235.png" },
  { id: 33315, name: "Minuscule Extrait de Foudroyeur", gauge: "Foudroyeur", tier: "Extrait", size: "Minuscule", durability: 1000, maxGauge: 40000, level: 5, iconId: 93203, img: "https://api.dofusdb.fr/img/items/93203.png" },
  { id: 33327, name: "Petit Extrait de Foudroyeur", gauge: "Foudroyeur", tier: "Extrait", size: "Petit", durability: 2000, maxGauge: 40000, level: 15, iconId: 93203, img: "https://api.dofusdb.fr/img/items/93203.png" },
  { id: 33339, name: "Extrait de Foudroyeur", gauge: "Foudroyeur", tier: "Extrait", size: "Normal", durability: 3000, maxGauge: 40000, level: 25, iconId: 93203, img: "https://api.dofusdb.fr/img/items/93203.png" },
  { id: 33351, name: "Grand Extrait de Foudroyeur", gauge: "Foudroyeur", tier: "Extrait", size: "Grand", durability: 4000, maxGauge: 40000, level: 35, iconId: 93203, img: "https://api.dofusdb.fr/img/items/93203.png" },
  { id: 33363, name: "Gigantesque Extrait de Foudroyeur", gauge: "Foudroyeur", tier: "Extrait", size: "Gigantesque", durability: 5000, maxGauge: 40000, level: 45, iconId: 93203, img: "https://api.dofusdb.fr/img/items/93203.png" },
  { id: 33375, name: "Minuscule Philtre de Foudroyeur", gauge: "Foudroyeur", tier: "Philtre", size: "Minuscule", durability: 1000, maxGauge: 70000, level: 55, iconId: 93215, img: "https://api.dofusdb.fr/img/items/93215.png" },
  { id: 33387, name: "Petit Philtre de Foudroyeur", gauge: "Foudroyeur", tier: "Philtre", size: "Petit", durability: 2000, maxGauge: 70000, level: 65, iconId: 93215, img: "https://api.dofusdb.fr/img/items/93215.png" },
  { id: 33399, name: "Philtre de Foudroyeur", gauge: "Foudroyeur", tier: "Philtre", size: "Normal", durability: 3000, maxGauge: 70000, level: 75, iconId: 93215, img: "https://api.dofusdb.fr/img/items/93215.png" },
  { id: 33411, name: "Grand Philtre de Foudroyeur", gauge: "Foudroyeur", tier: "Philtre", size: "Grand", durability: 4000, maxGauge: 70000, level: 85, iconId: 93215, img: "https://api.dofusdb.fr/img/items/93215.png" },
  { id: 33423, name: "Gigantesque Philtre de Foudroyeur", gauge: "Foudroyeur", tier: "Philtre", size: "Gigantesque", durability: 5000, maxGauge: 70000, level: 95, iconId: 93215, img: "https://api.dofusdb.fr/img/items/93215.png" },
  { id: 33435, name: "Minuscule Potion de Foudroyeur", gauge: "Foudroyeur", tier: "Potion", size: "Minuscule", durability: 1000, maxGauge: 90000, level: 105, iconId: 93227, img: "https://api.dofusdb.fr/img/items/93227.png" },
  { id: 33447, name: "Petit Potion de Foudroyeur", gauge: "Foudroyeur", tier: "Potion", size: "Petit", durability: 2000, maxGauge: 90000, level: 115, iconId: 93227, img: "https://api.dofusdb.fr/img/items/93227.png" },
  { id: 33459, name: "Potion de Foudroyeur", gauge: "Foudroyeur", tier: "Potion", size: "Normal", durability: 3000, maxGauge: 90000, level: 125, iconId: 93227, img: "https://api.dofusdb.fr/img/items/93227.png" },
  { id: 33471, name: "Grand Potion de Foudroyeur", gauge: "Foudroyeur", tier: "Potion", size: "Grand", durability: 4000, maxGauge: 90000, level: 135, iconId: 93227, img: "https://api.dofusdb.fr/img/items/93227.png" },
  { id: 33483, name: "Gigantesque Potion de Foudroyeur", gauge: "Foudroyeur", tier: "Potion", size: "Gigantesque", durability: 5000, maxGauge: 90000, level: 145, iconId: 93227, img: "https://api.dofusdb.fr/img/items/93227.png" },
  { id: 33495, name: "Minuscule Élixir de Foudroyeur", gauge: "Foudroyeur", tier: "Élixir", size: "Minuscule", durability: 1000, maxGauge: 100000, level: 155, iconId: 93239, img: "https://api.dofusdb.fr/img/items/93239.png" },
  { id: 33501, name: "Petit Élixir de Foudroyeur", gauge: "Foudroyeur", tier: "Élixir", size: "Petit", durability: 2000, maxGauge: 100000, level: 165, iconId: 93239, img: "https://api.dofusdb.fr/img/items/93239.png" },
  { id: 33509, name: "Élixir de Foudroyeur", gauge: "Foudroyeur", tier: "Élixir", size: "Normal", durability: 3000, maxGauge: 100000, level: 175, iconId: 93239, img: "https://api.dofusdb.fr/img/items/93239.png" },
  { id: 33517, name: "Grand Élixir de Foudroyeur", gauge: "Foudroyeur", tier: "Élixir", size: "Grand", durability: 4000, maxGauge: 100000, level: 185, iconId: 93239, img: "https://api.dofusdb.fr/img/items/93239.png" },
  { id: 33525, name: "Gigantesque Élixir de Foudroyeur", gauge: "Foudroyeur", tier: "Élixir", size: "Gigantesque", durability: 5000, maxGauge: 100000, level: 195, iconId: 93239, img: "https://api.dofusdb.fr/img/items/93239.png" },
  { id: 33313, name: "Minuscule Extrait d'Abreuvoir", gauge: "Abreuvoir", tier: "Extrait", size: "Minuscule", durability: 1000, maxGauge: 40000, level: 5, iconId: 93201, img: "https://api.dofusdb.fr/img/items/93201.png" },
  { id: 33325, name: "Petit Extrait d'Abreuvoir", gauge: "Abreuvoir", tier: "Extrait", size: "Petit", durability: 2000, maxGauge: 40000, level: 15, iconId: 93201, img: "https://api.dofusdb.fr/img/items/93201.png" },
  { id: 33337, name: "Extrait d'Abreuvoir", gauge: "Abreuvoir", tier: "Extrait", size: "Normal", durability: 3000, maxGauge: 40000, level: 25, iconId: 93201, img: "https://api.dofusdb.fr/img/items/93201.png" },
  { id: 33349, name: "Grand Extrait d'Abreuvoir", gauge: "Abreuvoir", tier: "Extrait", size: "Grand", durability: 4000, maxGauge: 40000, level: 35, iconId: 93201, img: "https://api.dofusdb.fr/img/items/93201.png" },
  { id: 33361, name: "Gigantesque Extrait d'Abreuvoir", gauge: "Abreuvoir", tier: "Extrait", size: "Gigantesque", durability: 5000, maxGauge: 40000, level: 45, iconId: 93201, img: "https://api.dofusdb.fr/img/items/93201.png" },
  { id: 33373, name: "Minuscule Philtre d'Abreuvoir", gauge: "Abreuvoir", tier: "Philtre", size: "Minuscule", durability: 1000, maxGauge: 70000, level: 55, iconId: 93213, img: "https://api.dofusdb.fr/img/items/93213.png" },
  { id: 33385, name: "Petit Philtre d'Abreuvoir", gauge: "Abreuvoir", tier: "Philtre", size: "Petit", durability: 2000, maxGauge: 70000, level: 65, iconId: 93213, img: "https://api.dofusdb.fr/img/items/93213.png" },
  { id: 33397, name: "Philtre d'Abreuvoir", gauge: "Abreuvoir", tier: "Philtre", size: "Normal", durability: 3000, maxGauge: 70000, level: 75, iconId: 93213, img: "https://api.dofusdb.fr/img/items/93213.png" },
  { id: 33409, name: "Grand Philtre d'Abreuvoir", gauge: "Abreuvoir", tier: "Philtre", size: "Grand", durability: 4000, maxGauge: 70000, level: 85, iconId: 93213, img: "https://api.dofusdb.fr/img/items/93213.png" },
  { id: 33421, name: "Gigantesque Philtre d'Abreuvoir", gauge: "Abreuvoir", tier: "Philtre", size: "Gigantesque", durability: 5000, maxGauge: 70000, level: 95, iconId: 93213, img: "https://api.dofusdb.fr/img/items/93213.png" },
  { id: 33433, name: "Minuscule Potion d'Abreuvoir", gauge: "Abreuvoir", tier: "Potion", size: "Minuscule", durability: 1000, maxGauge: 90000, level: 105, iconId: 93225, img: "https://api.dofusdb.fr/img/items/93225.png" },
  { id: 33445, name: "Petit Potion d'Abreuvoir", gauge: "Abreuvoir", tier: "Potion", size: "Petit", durability: 2000, maxGauge: 90000, level: 115, iconId: 93225, img: "https://api.dofusdb.fr/img/items/93225.png" },
  { id: 33457, name: "Potion d'Abreuvoir", gauge: "Abreuvoir", tier: "Potion", size: "Normal", durability: 3000, maxGauge: 90000, level: 125, iconId: 93225, img: "https://api.dofusdb.fr/img/items/93225.png" },
  { id: 33469, name: "Grand Potion d'Abreuvoir", gauge: "Abreuvoir", tier: "Potion", size: "Grand", durability: 4000, maxGauge: 90000, level: 135, iconId: 93225, img: "https://api.dofusdb.fr/img/items/93225.png" },
  { id: 33481, name: "Gigantesque Potion d'Abreuvoir", gauge: "Abreuvoir", tier: "Potion", size: "Gigantesque", durability: 5000, maxGauge: 90000, level: 145, iconId: 93225, img: "https://api.dofusdb.fr/img/items/93225.png" },
  { id: 33493, name: "Minuscule Élixir d'Abreuvoir", gauge: "Abreuvoir", tier: "Élixir", size: "Minuscule", durability: 1000, maxGauge: 100000, level: 155, iconId: 93237, img: "https://api.dofusdb.fr/img/items/93237.png" },
  { id: 33499, name: "Petit Élixir d'Abreuvoir", gauge: "Abreuvoir", tier: "Élixir", size: "Petit", durability: 2000, maxGauge: 100000, level: 165, iconId: 93237, img: "https://api.dofusdb.fr/img/items/93237.png" },
  { id: 33507, name: "Élixir d'Abreuvoir", gauge: "Abreuvoir", tier: "Élixir", size: "Normal", durability: 3000, maxGauge: 100000, level: 175, iconId: 93237, img: "https://api.dofusdb.fr/img/items/93237.png" },
  { id: 33515, name: "Grand Élixir d'Abreuvoir", gauge: "Abreuvoir", tier: "Élixir", size: "Grand", durability: 4000, maxGauge: 100000, level: 185, iconId: 93237, img: "https://api.dofusdb.fr/img/items/93237.png" },
  { id: 33523, name: "Gigantesque Élixir d'Abreuvoir", gauge: "Abreuvoir", tier: "Élixir", size: "Gigantesque", durability: 5000, maxGauge: 100000, level: 195, iconId: 93237, img: "https://api.dofusdb.fr/img/items/93237.png" },
  { id: 33311, name: "Minuscule Extrait de Dragofesse", gauge: "Dragofesse", tier: "Extrait", size: "Minuscule", durability: 1000, maxGauge: 40000, level: 5, iconId: 93200, img: "https://api.dofusdb.fr/img/items/93200.png" },
  { id: 33323, name: "Petit Extrait de Dragofesse", gauge: "Dragofesse", tier: "Extrait", size: "Petit", durability: 2000, maxGauge: 40000, level: 15, iconId: 93200, img: "https://api.dofusdb.fr/img/items/93200.png" },
  { id: 33335, name: "Extrait de Dragofesse", gauge: "Dragofesse", tier: "Extrait", size: "Normal", durability: 3000, maxGauge: 40000, level: 25, iconId: 93200, img: "https://api.dofusdb.fr/img/items/93200.png" },
  { id: 33347, name: "Grand Extrait de Dragofesse", gauge: "Dragofesse", tier: "Extrait", size: "Grand", durability: 4000, maxGauge: 40000, level: 35, iconId: 93200, img: "https://api.dofusdb.fr/img/items/93200.png" },
  { id: 33359, name: "Gigantesque Extrait de Dragofesse", gauge: "Dragofesse", tier: "Extrait", size: "Gigantesque", durability: 5000, maxGauge: 40000, level: 45, iconId: 93200, img: "https://api.dofusdb.fr/img/items/93200.png" },
  { id: 33371, name: "Minuscule Philtre de Dragofesse", gauge: "Dragofesse", tier: "Philtre", size: "Minuscule", durability: 1000, maxGauge: 70000, level: 55, iconId: 93212, img: "https://api.dofusdb.fr/img/items/93212.png" },
  { id: 33383, name: "Petit Philtre de Dragofesse", gauge: "Dragofesse", tier: "Philtre", size: "Petit", durability: 2000, maxGauge: 70000, level: 65, iconId: 93212, img: "https://api.dofusdb.fr/img/items/93212.png" },
  { id: 33395, name: "Philtre de Dragofesse", gauge: "Dragofesse", tier: "Philtre", size: "Normal", durability: 3000, maxGauge: 70000, level: 75, iconId: 93212, img: "https://api.dofusdb.fr/img/items/93212.png" },
  { id: 33407, name: "Grand Philtre de Dragofesse", gauge: "Dragofesse", tier: "Philtre", size: "Grand", durability: 4000, maxGauge: 70000, level: 85, iconId: 93212, img: "https://api.dofusdb.fr/img/items/93212.png" },
  { id: 33419, name: "Gigantesque Philtre de Dragofesse", gauge: "Dragofesse", tier: "Philtre", size: "Gigantesque", durability: 5000, maxGauge: 70000, level: 95, iconId: 93212, img: "https://api.dofusdb.fr/img/items/93212.png" },
  { id: 33431, name: "Minuscule Potion de Dragofesse", gauge: "Dragofesse", tier: "Potion", size: "Minuscule", durability: 1000, maxGauge: 90000, level: 105, iconId: 93224, img: "https://api.dofusdb.fr/img/items/93224.png" },
  { id: 33443, name: "Petit Potion de Dragofesse", gauge: "Dragofesse", tier: "Potion", size: "Petit", durability: 2000, maxGauge: 90000, level: 115, iconId: 93224, img: "https://api.dofusdb.fr/img/items/93224.png" },
  { id: 33455, name: "Potion de Dragofesse", gauge: "Dragofesse", tier: "Potion", size: "Normal", durability: 3000, maxGauge: 90000, level: 125, iconId: 93224, img: "https://api.dofusdb.fr/img/items/93224.png" },
  { id: 33467, name: "Grand Potion de Dragofesse", gauge: "Dragofesse", tier: "Potion", size: "Grand", durability: 4000, maxGauge: 90000, level: 135, iconId: 93224, img: "https://api.dofusdb.fr/img/items/93224.png" },
  { id: 33479, name: "Gigantesque Potion de Dragofesse", gauge: "Dragofesse", tier: "Potion", size: "Gigantesque", durability: 5000, maxGauge: 90000, level: 145, iconId: 93224, img: "https://api.dofusdb.fr/img/items/93224.png" },
  { id: 33491, name: "Minuscule Élixir de Dragofesse", gauge: "Dragofesse", tier: "Élixir", size: "Minuscule", durability: 1000, maxGauge: 100000, level: 155, iconId: 93236, img: "https://api.dofusdb.fr/img/items/93236.png" },
  { id: 33500, name: "Petit Élixir de Dragofesse", gauge: "Dragofesse", tier: "Élixir", size: "Petit", durability: 2000, maxGauge: 100000, level: 165, iconId: 93236, img: "https://api.dofusdb.fr/img/items/93236.png" },
  { id: 33508, name: "Élixir de Dragofesse", gauge: "Dragofesse", tier: "Élixir", size: "Normal", durability: 3000, maxGauge: 100000, level: 175, iconId: 93236, img: "https://api.dofusdb.fr/img/items/93236.png" },
  { id: 33516, name: "Grand Élixir de Dragofesse", gauge: "Dragofesse", tier: "Élixir", size: "Grand", durability: 4000, maxGauge: 100000, level: 185, iconId: 93236, img: "https://api.dofusdb.fr/img/items/93236.png" },
  { id: 33524, name: "Gigantesque Élixir de Dragofesse", gauge: "Dragofesse", tier: "Élixir", size: "Gigantesque", durability: 5000, maxGauge: 100000, level: 195, iconId: 93236, img: "https://api.dofusdb.fr/img/items/93236.png" },
  { id: 33317, name: "Minuscule Extrait de Mangeoire", gauge: "Mangeoire", tier: "Extrait", size: "Minuscule", durability: 1000, maxGauge: 40000, level: 5, iconId: 93205, img: "https://api.dofusdb.fr/img/items/93205.png" },
  { id: 33329, name: "Petit Extrait de Mangeoire", gauge: "Mangeoire", tier: "Extrait", size: "Petit", durability: 2000, maxGauge: 40000, level: 15, iconId: 93205, img: "https://api.dofusdb.fr/img/items/93205.png" },
  { id: 33341, name: "Extrait de Mangeoire", gauge: "Mangeoire", tier: "Extrait", size: "Normal", durability: 3000, maxGauge: 40000, level: 25, iconId: 93205, img: "https://api.dofusdb.fr/img/items/93205.png" },
  { id: 33353, name: "Grand Extrait de Mangeoire", gauge: "Mangeoire", tier: "Extrait", size: "Grand", durability: 4000, maxGauge: 40000, level: 35, iconId: 93205, img: "https://api.dofusdb.fr/img/items/93205.png" },
  { id: 33365, name: "Gigantesque Extrait de Mangeoire", gauge: "Mangeoire", tier: "Extrait", size: "Gigantesque", durability: 5000, maxGauge: 40000, level: 45, iconId: 93205, img: "https://api.dofusdb.fr/img/items/93205.png" },
  { id: 33377, name: "Minuscule Philtre de Mangeoire", gauge: "Mangeoire", tier: "Philtre", size: "Minuscule", durability: 1000, maxGauge: 70000, level: 55, iconId: 93217, img: "https://api.dofusdb.fr/img/items/93217.png" },
  { id: 33389, name: "Petit Philtre de Mangeoire", gauge: "Mangeoire", tier: "Philtre", size: "Petit", durability: 2000, maxGauge: 70000, level: 65, iconId: 93217, img: "https://api.dofusdb.fr/img/items/93217.png" },
  { id: 33401, name: "Philtre de Mangeoire", gauge: "Mangeoire", tier: "Philtre", size: "Normal", durability: 3000, maxGauge: 70000, level: 75, iconId: 93217, img: "https://api.dofusdb.fr/img/items/93217.png" },
  { id: 33413, name: "Grand Philtre de Mangeoire", gauge: "Mangeoire", tier: "Philtre", size: "Grand", durability: 4000, maxGauge: 70000, level: 85, iconId: 93217, img: "https://api.dofusdb.fr/img/items/93217.png" },
  { id: 33425, name: "Gigantesque Philtre de Mangeoire", gauge: "Mangeoire", tier: "Philtre", size: "Gigantesque", durability: 5000, maxGauge: 70000, level: 95, iconId: 93217, img: "https://api.dofusdb.fr/img/items/93217.png" },
  { id: 33437, name: "Minuscule Potion de Mangeoire", gauge: "Mangeoire", tier: "Potion", size: "Minuscule", durability: 1000, maxGauge: 90000, level: 105, iconId: 93229, img: "https://api.dofusdb.fr/img/items/93229.png" },
  { id: 33449, name: "Petit Potion de Mangeoire", gauge: "Mangeoire", tier: "Potion", size: "Petit", durability: 2000, maxGauge: 90000, level: 115, iconId: 93229, img: "https://api.dofusdb.fr/img/items/93229.png" },
  { id: 33461, name: "Potion de Mangeoire", gauge: "Mangeoire", tier: "Potion", size: "Normal", durability: 3000, maxGauge: 90000, level: 125, iconId: 93229, img: "https://api.dofusdb.fr/img/items/93229.png" },
  { id: 33473, name: "Grand Potion de Mangeoire", gauge: "Mangeoire", tier: "Potion", size: "Grand", durability: 4000, maxGauge: 90000, level: 135, iconId: 93229, img: "https://api.dofusdb.fr/img/items/93229.png" },
  { id: 33485, name: "Gigantesque Potion de Mangeoire", gauge: "Mangeoire", tier: "Potion", size: "Gigantesque", durability: 5000, maxGauge: 90000, level: 145, iconId: 93229, img: "https://api.dofusdb.fr/img/items/93229.png" },
  { id: 33496, name: "Minuscule Élixir de Mangeoire", gauge: "Mangeoire", tier: "Élixir", size: "Minuscule", durability: 1000, maxGauge: 100000, level: 155, iconId: 93241, img: "https://api.dofusdb.fr/img/items/93241.png" },
  { id: 33502, name: "Petit Élixir de Mangeoire", gauge: "Mangeoire", tier: "Élixir", size: "Petit", durability: 2000, maxGauge: 100000, level: 165, iconId: 93241, img: "https://api.dofusdb.fr/img/items/93241.png" },
  { id: 33510, name: "Élixir de Mangeoire", gauge: "Mangeoire", tier: "Élixir", size: "Normal", durability: 3000, maxGauge: 100000, level: 175, iconId: 93241, img: "https://api.dofusdb.fr/img/items/93241.png" },
  { id: 33518, name: "Grand Élixir de Mangeoire", gauge: "Mangeoire", tier: "Élixir", size: "Grand", durability: 4000, maxGauge: 100000, level: 185, iconId: 93241, img: "https://api.dofusdb.fr/img/items/93241.png" },
  { id: 33526, name: "Gigantesque Élixir de Mangeoire", gauge: "Mangeoire", tier: "Élixir", size: "Gigantesque", durability: 5000, maxGauge: 100000, level: 195, iconId: 93241, img: "https://api.dofusdb.fr/img/items/93241.png" },
];

// localStorage keys
export const FUEL_PRICES_KEY = "dragodofus-fuel-prices";

export interface FuelPrices {
  [fuelId: number]: number;
}

export function loadFuelPrices(): FuelPrices {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(FUEL_PRICES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export function saveFuelPrices(prices: FuelPrices) {
  localStorage.setItem(FUEL_PRICES_KEY, JSON.stringify(prices));
}

// Compute best price per durability unit for each gauge type (legacy — cheapest across all tiers)
export function getBestPricePerGauge(fuelPrices: FuelPrices): Record<string, number> {
  const best: Record<string, number> = {};
  for (const gauge of GAUGES) {
    let bestPpd = Infinity;
    for (const f of ALL_FUELS.filter((f) => f.gauge === gauge)) {
      const price = fuelPrices[f.id];
      if (!price || price <= 0) continue;
      const ppd = price / f.durability;
      if (ppd < bestPpd) bestPpd = ppd;
    }
    best[gauge] = bestPpd === Infinity ? 0 : bestPpd;
  }
  return best;
}

// Tier thresholds: gauge ranges and their drain/gain rates
export const GAUGE_TIERS = [
  { name: "Extrait" as const, min: 0, max: 40_000, capacity: 40_000, ratePerSec: 1, fuelTier: "Extrait" },
  { name: "Philtre" as const, min: 40_000, max: 70_000, capacity: 30_000, ratePerSec: 2, fuelTier: "Philtre" },
  { name: "Potion" as const, min: 70_000, max: 90_000, capacity: 20_000, ratePerSec: 3, fuelTier: "Potion" },
  { name: "Élixir" as const, min: 90_000, max: 100_000, capacity: 10_000, ratePerSec: 4, fuelTier: "Élixir" },
] as const;

// Best price per durability for each gauge × fuel tier combination
export interface TieredGaugePrices {
  [gauge: string]: {
    [fuelTier: string]: number; // best price/durability for this gauge+tier combo
  };
}

export function getBestPricePerGaugeTier(fuelPrices: FuelPrices): TieredGaugePrices {
  const result: TieredGaugePrices = {};
  for (const gauge of GAUGES) {
    result[gauge] = {};
    for (const tier of TIERS) {
      let bestPpd = Infinity;
      for (const f of ALL_FUELS.filter((f) => f.gauge === gauge && f.tier === tier)) {
        const price = fuelPrices[f.id];
        if (!price || price <= 0) continue;
        const ppd = price / f.durability;
        if (ppd < bestPpd) bestPpd = ppd;
      }
      result[gauge][tier] = bestPpd === Infinity ? 0 : bestPpd;
    }
  }
  return result;
}

// Simulate gauge drain for a given amount of stat points needed.
// The user fills the gauge to the selected tier's max, then it drains down through the tiers.
// Returns: { time, fuelBreakdown: { Extrait: dur, Philtre: dur, ... }, totalDurability, totalCost }
export interface GaugeDrainResult {
  timeSeconds: number;
  fuelBreakdown: Record<string, number>; // tier → durability consumed
  totalDurability: number;
  totalCost: number;
}

/**
 * Simulate draining a gauge from a given fill level to provide `statNeeded` stat points.
 * The gauge drains from top tier downward. Each tier has its own drain rate.
 *
 * @param statNeeded - Total stat points needed from this gauge
 * @param maxTier - The highest tier the user will fill to (1-4, corresponding to Extrait/Philtre/Potion/Élixir)
 * @param gaugeTierPrices - Best price/durability for each fuel tier of this gauge
 * @param refillAllowed - If true, gauge can be refilled when empty (for large stat needs > gauge capacity)
 * @returns Drain simulation results
 */
export function simulateGaugeDrain(
  statNeeded: number,
  maxTier: number,
  gaugeTierPrices: Record<string, number>,
): GaugeDrainResult {
  if (statNeeded <= 0) {
    return { timeSeconds: 0, fuelBreakdown: {}, totalDurability: 0, totalCost: 0 };
  }

  // Tiers available up to maxTier (index 0=T1, 3=T4)
  const activeTiers = GAUGE_TIERS.slice(0, maxTier);

  // Total gauge capacity at this fill level
  const totalCapacity = activeTiers.reduce((s, t) => s + t.capacity, 0);

  // How many full fills needed?
  const fills = Math.ceil(statNeeded / totalCapacity);

  let remainingStat = statNeeded;
  const fuelBreakdown: Record<string, number> = {};
  let totalTime = 0;
  let totalCost = 0;
  let totalDurability = 0;

  for (let fill = 0; fill < fills; fill++) {
    // Drain from highest tier downward
    for (let i = activeTiers.length - 1; i >= 0 && remainingStat > 0; i--) {
      const tier = activeTiers[i];
      // How much stat this tier can provide in one drain
      const statFromTier = Math.min(tier.capacity, remainingStat);
      // Durability consumed = stat points (1 durability consumed = 1 stat point regardless of tier)
      // Actually: drain rate is tier.ratePerSec per second, consuming tier.ratePerSec durability per second
      // So statFromTier stat points takes statFromTier/tier.ratePerSec seconds
      // and consumes statFromTier durability
      const durability = statFromTier;
      const time = statFromTier / tier.ratePerSec;
      const price = gaugeTierPrices[tier.fuelTier] || 0;

      fuelBreakdown[tier.fuelTier] = (fuelBreakdown[tier.fuelTier] || 0) + durability;
      totalTime += time;
      totalCost += durability * price;
      totalDurability += durability;
      remainingStat -= statFromTier;
    }
  }

  return { timeSeconds: totalTime, fuelBreakdown, totalDurability, totalCost };
}
