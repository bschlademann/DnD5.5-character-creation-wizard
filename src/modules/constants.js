export const STEPS = [
  { key: 'abilities', title: 'Ability Scores', short: 'Abilities' },
  { key: 'species', title: 'Species', short: 'Species' },
  { key: 'class', title: 'Class', short: 'Class' },
  { key: 'background', title: 'Background & Feat', short: 'Background' },
  { key: 'equipment', title: 'Weapons, Armor & Equipment', short: 'Equipment' },
  { key: 'spells', title: 'Spells & Preparation', short: 'Spells' },
  { key: 'details', title: 'Details & Personality', short: 'Details' },
  { key: 'summary', title: 'Summary & Character Sheet', short: 'Summary' }
];

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const ABIL_NAME = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const AVG_HD = { 6: 4, 8: 5, 10: 6, 12: 7 };

export const ASI_LEVELS = {
  default: [4, 8, 12, 16, 19],
  fighter: [4, 6, 8, 12, 14, 16, 19],
  rogue: [4, 8, 10, 12, 16, 19]
};

export const TOOL_GROUPS = {
  anyArtisansTool: [
    "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools",
    "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools",
    "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies",
    "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools"
  ],
  anyGamingSet: ['Dice Set', 'Dragonchess Set', 'Playing Card Set', 'Three-Dragon Ante Set'],
  anyMusicalInstrument: ['Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Lute', 'Lyre', 'Pan Flute', 'Shawm', 'Viol']
};

export const WEAPONS = [
  { name: 'Club', cat: 'simple', type: 'melee' },
  { name: 'Dagger', cat: 'simple', type: 'melee' },
  { name: 'Greatclub', cat: 'simple', type: 'melee' },
  { name: 'Handaxe', cat: 'simple', type: 'melee' },
  { name: 'Javelin', cat: 'simple', type: 'melee' },
  { name: 'Light Hammer', cat: 'simple', type: 'melee' },
  { name: 'Mace', cat: 'simple', type: 'melee' },
  { name: 'Quarterstaff', cat: 'simple', type: 'melee' },
  { name: 'Sickle', cat: 'simple', type: 'melee' },
  { name: 'Spear', cat: 'simple', type: 'melee' },
  { name: 'Dart', cat: 'simple', type: 'ranged' },
  { name: 'Light Crossbow', cat: 'simple', type: 'ranged' },
  { name: 'Shortbow', cat: 'simple', type: 'ranged' },
  { name: 'Sling', cat: 'simple', type: 'ranged' },
  { name: 'Battleaxe', cat: 'martial', type: 'melee' },
  { name: 'Flail', cat: 'martial', type: 'melee' },
  { name: 'Glaive', cat: 'martial', type: 'melee' },
  { name: 'Greataxe', cat: 'martial', type: 'melee' },
  { name: 'Greatsword', cat: 'martial', type: 'melee' },
  { name: 'Halberd', cat: 'martial', type: 'melee' },
  { name: 'Lance', cat: 'martial', type: 'melee' },
  { name: 'Light', cat: 'martial', type: 'melee' },
  { name: 'Longsword', cat: 'martial', type: 'melee' },
  { name: 'Maul', cat: 'martial', type: 'melee' },
  { name: 'Morningstar', cat: 'martial', type: 'melee' },
  { name: 'Pike', cat: 'martial', type: 'melee' },
  { name: 'Rapier', cat: 'martial', type: 'melee' },
  { name: 'Scimitar', cat: 'martial', type: 'melee' },
  { name: 'Shortsword', cat: 'martial', type: 'melee' },
  { name: 'Trident', cat: 'martial', type: 'melee' },
  { name: 'War Pick', cat: 'martial', type: 'melee' },
  { name: 'Warhammer', cat: 'martial', type: 'melee' },
  { name: 'Whip', cat: 'martial', type: 'melee' },
  { name: 'Blowgun', cat: 'martial', type: 'ranged' },
  { name: 'Hand Crossbow', cat: 'martial', type: 'ranged' },
  { name: 'Heavy Crossbow', cat: 'martial', type: 'ranged' },
  { name: 'Longbow', cat: 'martial', type: 'ranged' },
  { name: 'Musket', cat: 'martial', type: 'ranged' },
  { name: 'Net', cat: 'martial', type: 'ranged' },
  { name: 'Pistol', cat: 'martial', type: 'ranged' }
];

export const SKILL_ABILITY_MAP = {
  acrobatics: 'dex', 'animal handling': 'wis', arcana: 'int', athletics: 'str',
  deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha',
  investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int',
  'sleight of hand': 'dex', stealth: 'dex', survival: 'wis'
};

export const SKILL_DESC = {
  acrobatics: 'Dodge, tumble, and balance on precarious surfaces.',
  'animal handling': 'Calm, tame, or read the behavior of animals.',
  arcana: 'Recall lore about spells, magic items, and the planes.',
  athletics: 'Climb, jump, swim, and perform feats of raw strength.',
  deception: 'Lie convincingly and conceal the truth through speech.',
  history: 'Recall lore about history, kingdoms, and past events.',
  insight: 'Read a creature\'s intent, mood, and truthfulness.',
  intimidation: 'Coerce or frighten others through threats and force.',
  investigation: 'Find clues, deduce conclusions, and search for details.',
  medicine: 'Stabilize the dying and diagnose injuries and illnesses.',
  nature: 'Recall lore about terrain, plants, animals, and weather.',
  perception: 'Spot hidden creatures, objects, and signs of danger.',
  performance: 'Entertain an audience with music, dance, or oratory.',
  persuasion: 'Influence others through tact, courtesy, and logic.',
  religion: 'Recall lore about deities, rites, and religious practice.',
  'sleight of hand': 'Pick pockets, conceal objects, and perform legerdemain.',
  stealth: 'Move quietly and hide from sight.',
  survival: 'Track prey, navigate, forage, and endure in the wild.'
};
