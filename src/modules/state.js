export const globals = {
  DATA: null,
  state: null,
  currentStep: 0
};

export const SAVE = (state) => { try { localStorage.setItem('dnd5e24-char', JSON.stringify(state)); } catch (e) {} };
export const LOAD = () => { try {
  const raw = JSON.parse(localStorage.getItem('dnd5e24-char'));
  if (Array.isArray(raw)) return raw[0];
  return raw;
} catch (e) { return null; } };

export function freshState() {
  return {
    step: 0, level: 1, finalized: false,
    assign: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    race: null, lineage: null, raceSkill: [], humanFeat: null,
    cls: null, subclass: null, classSkills: [],
    fightingStyle: null, weaponMasteries: [],
    bgMode: 'bg', bg: null, bgPlus2: null, bgPlus1: null, bgTool: null, bgFeat: null,
    custom: { p2: null, p1: null, feat: null, skills: [], tool: null },
    miPicks: {}, skilledPicks: [],
    equipment: { class: 'A', bg: 'A' }, wearArmor: null,
    spells: { cantrips: [], prepared: [], arcanum: {} },
    expertise: {},
    extraSkills: [],
    hpPerLevel: [],
    asiSelections: {},
    details: { name: '', alignment: '', age: '', height: '', weight: '', eyes: '', hair: '', skin: '', deity: '', traits: '', ideals: '', bonds: '', flaws: '', backstory: '', portrait: '' }
  };
}
