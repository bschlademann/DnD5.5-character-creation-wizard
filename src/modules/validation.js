import { globals } from './state.js';
import { ABILITIES, STEPS } from './constants.js';
import { findRace, findClass, findBackground } from './data.js';
import { charClass, chosenFeats, cantripCount, preparedCount } from './compute.js';

export function validateStep(i) {
  const key = STEPS[i].key;
  if (key === 'abilities') {
    const vals = ABILITIES.map(a => globals.state.assign[a]);
    if (vals.some(v => v === null)) { alert('Assign all six ability scores before continuing.'); return false; }
    if (new Set(vals).size !== 6) { alert('Each standard-array value may only be used once.'); return false; }
  }
  if (key === 'species') {
    if (!globals.state.race) { alert('Choose a species.'); return false; }
    const r = findRace(globals.state.race);
    if (r.lineages && r.lineages.length && !globals.state.lineage) { alert('Choose a lineage for this species.'); return false; }
    if (r.skillChoice && globals.state.raceSkill.length < r.skillChoice.count) { alert('Choose your species skill proficiency.'); return false; }
  }
  if (key === 'class') {
    if (!globals.state.cls) { alert('Choose a class.'); return false; }
    const cls = findClass(globals.state.cls);
    const need = cls.skillChoices.reduce((n, c) => n + c.count, 0);
    if (globals.state.classSkills.length !== need) { alert(`Choose exactly ${need} skill proficiency${need === 1 ? '' : 'ies'} from your class.`); return false; }
    if (globals.state.level >= 3 && !globals.state.subclass) { alert('Choose a subclass (your class gains it at level 3).'); return false; }
  }
  if (key === 'background') {
    if (globals.state.bgMode === 'bg' && !globals.state.bg) { alert('Choose a background (or switch to custom).'); return false; }
    if (globals.state.bgMode === 'bg') {
      const bg = findBackground(globals.state.bg);
      if (bg.ability.length >= 2 && !(globals.state.bgPlus2 && globals.state.bgPlus1)) { alert('Assign the +2 and +1 ability score bonuses.'); return false; }
      if ((bg.tools || []).some(t => /any/.test(t)) && !globals.state.bgTool) { alert('Choose your tool proficiency.'); return false; }
    } else {
      if (!globals.state.custom.p2 || !globals.state.custom.p1) { alert('Assign the +2 and +1 ability score bonuses.'); return false; }
      if (globals.state.custom.p2 === globals.state.custom.p1) { alert('The +2 and +1 bonuses must go to different ability scores.'); return false; }
      if (!globals.state.custom.feat) { alert('Choose your origin feat.'); return false; }
      if (globals.state.custom.skills.length !== 2) { alert('Choose exactly 2 skill proficiencies.'); return false; }
      if (!globals.state.custom.tool) { alert('Choose a tool proficiency.'); return false; }
    }
    if (chosenFeats().some(f => f && f.id === 'skilled-xphb') && globals.state.skilledPicks.length !== 3) {
      alert('Choose 3 skill/tool proficiencies for the Skilled feat.');
      return false;
    }
  }
  if (key === 'equipment') {
    if (!globals.state.equipment.class) { alert('Choose an equipment layout.'); return false; }
  }
  if (key === 'spells') {
    const cls = charClass();
    if (cls && cls.spellcasting.ability) {
      if (globals.state.spells.cantrips.length !== cantripCount()) { alert(`Choose exactly ${cantripCount()} cantrip${cantripCount() === 1 ? '' : 's'}.`); return false; }
      if (globals.state.spells.prepared.length !== preparedCount()) { alert(`Choose exactly ${preparedCount()} spell${preparedCount() === 1 ? '' : 's'} to prepare.`); return false; }
    }
  }
  return true;
}
