import { globals, freshState, LOAD } from './modules/state.js';
import { $ } from './modules/helpers.js';
import { render } from './steps/renderNav.js';
import './api.js';

const DATA_FILES = [
  'abilities', 'backgrounds', 'classes', 'classSpellLists',
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
  if (saved) globals.state = saved;
  if (!globals.state) globals.state = freshState();

  const lvlSel = $('char-level');
  lvlSel.innerHTML = Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">Level ${i + 1}</option>`).join('');
  lvlSel.value = globals.state.level;
  lvlSel.onchange = () => { globals.state.level = parseInt(lvlSel.value); if (globals.state.level < 3) globals.state.subclass = null; render(); };
  render();
}

init();
