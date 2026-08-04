import { globals } from './state.js';
import { ABILITIES, STEPS } from './constants.js';
import { findRace, findClass, findBackground } from './data.js';
import { charClass, chosenFeats, cantripCount, preparedCount, arcanumReached, arcanumSpellLv, arcanumPicks, featChoicesComplete } from './compute.js';

export function validateStep(i) {
  const key = STEPS[i].key;
  if (key === 'abilities') {
    const vals = ABILITIES.map(a => globals.state.assign[a]);
    if (vals.some(v => v === null)) return { ok: false, message: 'Assign all six ability scores before continuing.' };
    if (new Set(vals).size !== 6) return { ok: false, message: 'Each standard-array value may only be used once.' };
  }
  if (key === 'species') {
    if (!globals.state.race) return { ok: false, message: 'Choose a species.' };
    const r = findRace(globals.state.race);
    if (r.lineages && r.lineages.length && !globals.state.lineage) return { ok: false, message: 'Choose a lineage for this species.' };
    if (r.skillChoice && globals.state.raceSkill.length < r.skillChoice.count) return { ok: false, message: 'Choose your species skill proficiency.' };
    if (!featChoicesComplete()) return { ok: false, message: 'Finish the spell choices granted by your origin feats.' };
  }
  if (key === 'class') {
    if (!globals.state.cls) return { ok: false, message: 'Choose a class.' };
    const cls = findClass(globals.state.cls);
    const need = cls.skillChoices.reduce((n, c) => n + c.count, 0);
    if (globals.state.classSkills.length !== need) return { ok: false, message: `Choose exactly ${need} skill proficiency${need === 1 ? '' : 'ies'} from your class.` };
    if (globals.state.level >= 3 && !globals.state.subclass) return { ok: false, message: 'Choose a subclass (your class gains it at level 3).' };
  }
  if (key === 'background') {
    if (globals.state.bgMode === 'bg' && !globals.state.bg) return { ok: false, message: 'Choose a background (or switch to custom).' };
    if (globals.state.bgMode === 'bg') {
      const bg = findBackground(globals.state.bg);
      if (bg.ability.length >= 2 && !(globals.state.bgPlus2 && globals.state.bgPlus1)) return { ok: false, message: 'Assign the +2 and +1 ability score bonuses.' };
      if ((bg.tools || []).some(t => /any/.test(t)) && !globals.state.bgTool) return { ok: false, message: 'Choose your tool proficiency.' };
    } else {
      if (!globals.state.custom.p2 || !globals.state.custom.p1) return { ok: false, message: 'Assign the +2 and +1 ability score bonuses.' };
      if (globals.state.custom.p2 === globals.state.custom.p1) return { ok: false, message: 'The +2 and +1 bonuses must go to different ability scores.' };
      if (!globals.state.custom.feat) return { ok: false, message: 'Choose your origin feat.' };
      if (globals.state.custom.skills.length !== 2) return { ok: false, message: 'Choose exactly 2 skill proficiencies.' };
      if (!globals.state.custom.tool) return { ok: false, message: 'Choose a tool proficiency.' };
    }
    if (chosenFeats().some(f => f && f.id === 'skilled-xphb') && globals.state.skilledPicks.length !== 3) {
      return { ok: false, message: 'Choose 3 skill/tool proficiencies for the Skilled feat.' };
    }
    if (!featChoicesComplete()) return { ok: false, message: 'Finish the spell choices granted by your origin feats.' };
  }
  if (key === 'equipment') {
    if (!globals.state.equipment.class) return { ok: false, message: 'Choose an equipment layout.' };
  }
  if (key === 'spells') {
    const cls = charClass();
    if (cls && cls.spellcasting.ability) {
      if (globals.state.spells.cantrips.length !== cantripCount()) return { ok: false, message: `Choose exactly ${cantripCount()} cantrip${cantripCount() === 1 ? '' : 's'}.` };
      if (globals.state.spells.prepared.length !== preparedCount()) return { ok: false, message: `Choose exactly ${preparedCount()} spell${preparedCount() === 1 ? '' : 's'} to prepare.` };
    }
    if (cls && cls.spellcasting.type === 'pact') {
      for (const L of arcanumReached()) {
        if (!arcanumPicks()[L]) return { ok: false, message: `Choose your Mystic Arcanum spell (warlock level ${L}).` };
      }
    }
  }
  return { ok: true, message: '' };
}
