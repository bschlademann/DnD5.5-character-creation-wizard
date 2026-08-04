import { globals } from './state.js';

export const findRace = id => globals.DATA.species.find(s => s.id === id);
export const findClass = id => globals.DATA.classes.find(c => c.id === id);
export const findBackground = id => globals.DATA.backgrounds.find(b => b.id === id);
export const findFeat = id => globals.DATA.feats.find(f => f.id === id);
export const findSpell = name => globals.DATA.spells.find(s => s.name === name);

export const spellClassesFor = cid => {
  const c = findClass(cid);
  return c ? c.spellList : null;
};
