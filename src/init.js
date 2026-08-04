import { globals, freshState, LOAD } from './modules/state.js';
import { $ } from './modules/helpers.js';
import { render } from './steps/renderNav.js';
import './api.js';

const DATA_FILES = [
  'abilities', 'backgrounds', 'classes', 'classFeatures', 'classSpellLists', 'subclassFeatures',
  'feats', 'meta', 'originFeatCategories', 'skills', 'species', 'spells'
];

async function init() {
  globals.DATA = {};
  const results = await Promise.all(
    DATA_FILES.map(k => fetch(`src/data/${k}.json`).then(r => r.json()))
  );
  for (let i = 0; i < DATA_FILES.length; i++) {
    globals.DATA[DATA_FILES[i]] = results[i];
  }

  for (const cls of globals.DATA.classes) {
    if (globals.DATA.classFeatures[cls.id]) cls.features = globals.DATA.classFeatures[cls.id];
    for (const sub of cls.subclasses || []) {
      if (globals.DATA.subclassFeatures[sub.id]) sub.features = globals.DATA.subclassFeatures[sub.id];
    }
  }

  globals.DATA.toolsList = [
    'Alchemist\'s Supplies', 'Brewer\'s Supplies', 'Calligrapher\'s Supplies', 'Carpenter\'s Tools',
    'Cartographer\'s Tools', 'Cobbler\'s Tools', 'Cook\'s Utensils', 'Glassblower\'s Tools',
    'Jeweler\'s Tools', 'Leatherworker\'s Tools', 'Mason\'s Tools', 'Painter\'s Supplies',
    'Potter\'s Tools', 'Smith\'s Tools', 'Tinker\'s Tools', 'Weaver\'s Tools', 'Woodcarver\'s Tools',
    'Disguise Kit', 'Forgery Kit', 'Herbalism Kit', 'Navigator\'s Tools', 'Poisoner\'s Kit',
    'Thieves\' Tools', 'Dice Set', 'Dragonchess Set', 'Playing Card Set', 'Three-Dragon Ante Set',
    'Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Lute', 'Lyre', 'Pan Flute', 'Shawm', 'Viol'
  ];

  const saved = LOAD();
  if (saved) {
    const base = freshState();
    globals.state = {
      ...base, ...saved,
      assign: { ...base.assign, ...(saved.assign || {}) },
      custom: { ...base.custom, ...(saved.custom || {}) },
      spells: { ...base.spells, ...(saved.spells || {}) },
      equipment: { ...base.equipment, ...(saved.equipment || {}) },
      details: { ...base.details, ...(saved.details || {}) }
    };
  }
  if (!globals.state) globals.state = freshState();

  $('btn-level-down').onclick = () => API.levelDown();
  $('btn-level-up').onclick = () => API.openLevelUp();
  render();
}

init();
