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

export const SKILL_ABILITY_MAP = {
  acrobatics: 'dex', 'animal handling': 'wis', arcana: 'int', athletics: 'str',
  deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha',
  investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int',
  'sleight of hand': 'dex', stealth: 'dex', survival: 'wis'
};
