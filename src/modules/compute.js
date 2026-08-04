import { globals } from './state.js';
import { ABILITIES, AVG_HD } from './constants.js';
import { cap, profBonus, abilityMod } from './helpers.js';
import { findRace, findClass, findBackground } from './data.js';
import { resolveFeatRef } from './feats.js';

export function baseScores() {
  const s = {};
  for (const a of ABILITIES) s[a] = globals.state.assign[a] || 8;
  return s;
}

export function bgBonus() {
  const out = {};
  if (globals.state.bgMode === 'custom') {
    if (globals.state.custom.p2) out[globals.state.custom.p2] = (out[globals.state.custom.p2] || 0) + 2;
    if (globals.state.custom.p1) out[globals.state.custom.p1] = (out[globals.state.custom.p1] || 0) + 1;
  } else {
    const bg = findBackground(globals.state.bg);
    if (bg && bg.ability.length >= 2) {
      if (globals.state.bgPlus2) out[globals.state.bgPlus2] = (out[globals.state.bgPlus2] || 0) + 2;
      if (globals.state.bgPlus1) out[globals.state.bgPlus1] = (out[globals.state.bgPlus1] || 0) + 1;
    }
  }
  return out;
}

export function finalScores() {
  const s = baseScores();
  const b = bgBonus();
  for (const a of ABILITIES) s[a] += b[a] || 0;
  return s;
}

export function charClass() { return globals.state.cls ? findClass(globals.state.cls) : null; }
export function charRace() { return globals.state.race ? findRace(globals.state.race) : null; }

export function charLineage() {
  if (!globals.state.race || !globals.state.lineage) return null;
  const r = findRace(globals.state.race);
  return (r.lineages || []).find(l => l.id === globals.state.lineage) || null;
}

export function grantedSkills() {
  const set = new Set();
  const cls = charClass();
  if (cls) for (const s of globals.state.classSkills) set.add(s);
  if (globals.state.bgMode === 'bg' && globals.state.bg) {
    const bg = findBackground(globals.state.bg);
    for (const s of bg.skills) set.add(s);
  } else if (globals.state.bgMode === 'custom') {
    for (const s of globals.state.custom.skills) set.add(s);
  }
  for (const s of globals.state.raceSkill) set.add(s);
  for (const p of globals.state.skilledPicks) {
    if (typeof p === 'string') set.add(p);
    else if (p && p.kind === 'skill') set.add(p.id);
  }
  return set;
}

export function otherSkillSources(sid, exclude) {
  const out = [];
  const cls = charClass();
  if (exclude !== 'class' && cls && globals.state.classSkills.includes(sid)) out.push('Class (' + cls.name + ')');
  if (exclude !== 'bg') {
    if (globals.state.bgMode === 'bg' && globals.state.bg) {
      const bg = findBackground(globals.state.bg);
      if (bg && bg.skills.includes(sid)) out.push('Background (' + bg.name + ')');
    } else if (globals.state.bgMode === 'custom' && globals.state.custom.skills.includes(sid)) {
      out.push('Background (custom)');
    }
  }
  if (exclude !== 'race' && globals.state.raceSkill.includes(sid)) out.push('Species');
  if (exclude !== 'feat') {
    for (const p of globals.state.skilledPicks) {
      if ((typeof p === 'string' && p === sid) || (p && p.kind === 'skill' && p.id === sid)) out.push('Skilled feat');
    }
  }
  return out;
}

export function takenChip(sid, exclude) {
  const src = otherSkillSources(sid, exclude);
  if (!src.length) return { taken: false, tip: '' };
  return { taken: true, tip: 'Already proficient: ' + src.join(', ') };
}

export function otherToolSources(tool, exclude) {
  const out = [];
  const cls = charClass();
  if (exclude !== 'class' && cls && cls.tools) {
    for (const t of cls.tools.split(',').map(x => x.trim()).filter(Boolean)) {
      if (t.toLowerCase() === tool.toLowerCase()) out.push('Class (' + cls.name + ')');
    }
  }
  if (exclude !== 'bg') {
    if (globals.state.bgMode === 'bg' && globals.state.bg) {
      const bg = findBackground(globals.state.bg);
      for (const t of (bg.tools || [])) {
        if (t.startsWith('any')) continue;
        if (t.toLowerCase() === tool.toLowerCase()) out.push('Background (' + bg.name + ')');
      }
    } else if (globals.state.bgMode === 'custom' && globals.state.custom.tool && globals.state.custom.tool.toLowerCase() === tool.toLowerCase()) {
      out.push('Background (custom)');
    }
  }
  if (exclude !== 'feat') {
    for (const p of globals.state.skilledPicks) {
      if (p && typeof p === 'object' && p.kind === 'tool' && p.id.toLowerCase() === tool.toLowerCase()) out.push('Skilled feat');
    }
  }
  return out;
}

export function grantedTools() {
  const list = [];
  if (globals.state.bgMode === 'bg' && globals.state.bg) {
    const bg = findBackground(globals.state.bg);
    for (const t of bg.tools) {
      if (t === 'anyArtisansTool') list.push(globals.state.bgTool || 'Artisan\'s Tools (choice)');
      else if (t === 'anyGamingSet') list.push(globals.state.bgTool || 'Gaming Set (choice)');
      else if (t === 'anyMusicalInstrument') list.push(globals.state.bgTool || 'Musical Instrument (choice)');
      else list.push(cap(t));
    }
  } else if (globals.state.bgMode === 'custom') {
    list.push(globals.state.custom.tool || '');
  }
  const cls = charClass();
  if (cls && cls.tools) for (const t of cls.tools.split(',').map(x => x.trim()).filter(Boolean)) list.push(t);
  for (const p of globals.state.skilledPicks) {
    if (p && typeof p === 'object' && p.kind === 'tool') list.push(p.id);
  }
  return list.filter(Boolean);
}

export function chosenFeats() {
  const out = [];
  if (globals.state.bgMode === 'bg' && globals.state.bg) {
    const bg = findBackground(globals.state.bg);
    for (const ref of bg.feats) {
      const f = resolveFeatRef(ref);
      if (f) out.push(f);
    }
  } else if (globals.state.bgMode === 'custom' && globals.state.custom.feat) {
    const f = resolveFeatRef(globals.state.custom.feat);
    if (f) out.push(f);
  }
  if (globals.state.humanFeat) {
    const f = resolveFeatRef(globals.state.humanFeat);
    if (f) out.push(f);
  }
  return out;
}

export function hp() {
  const cls = charClass();
  if (!cls) return null;
  const con = abilityMod(finalScores().con);
  const faces = parseInt(cls.hd.slice(1));
  let hp = faces + con;
  hp += (globals.state.level - 1) * (AVG_HD[faces] + con);
  for (const f of chosenFeats()) if (f.id === 'tough-xphb') hp += 2 * globals.state.level;
  if (globals.state.race === 'dwarf') hp += globals.state.level;
  return hp;
}

export function ac() {
  const cls = charClass();
  const dex = abilityMod(finalScores().dex);
  let base = 10 + dex;
  const armorNames = [];
  const eq = equipmentItems();
  for (const it of eq) armorNames.push(it.name || '');
  const has = (...kw) => armorNames.some(n => kw.some(k => n.includes(k)));
  let armor = null;
  const MAP = [
    ['padded', 'leather', 11, 'dex'], ['studded', 12, 'dex'],
    ['hide', 12, 'min2'], ['chain shirt', 13, 'min2'], ['scale', 14, 'min2'],
    ['breastplate', 14, 'min2'], ['half plate', 'splint', 15, 'min2'],
    ['ring mail', 14, 'none'], ['chain mail', 16, 'none'], ['splint', 17, 'none'], ['plate', 18, 'none']
  ];
  for (const m of MAP) {
    const names = m.slice(0, -2);
    const val = m[m.length - 2];
    const mode = m[m.length - 1];
    if (names.some(n => has(n))) { armor = { val, mode }; break; }
  }
  let wearing = globals.state.wearArmor;
  if (armor) {
    if (wearing !== false) {
      if (armor.mode === 'dex') base = armor.val + dex;
      else if (armor.mode === 'min2') base = armor.val + Math.min(dex, 2);
      else base = armor.val;
    }
  } else {
    if (cls && cls.id === 'monk') base = 10 + dex + abilityMod(finalScores().wis);
    else if (cls && cls.id === 'barbarian') base = 10 + dex + abilityMod(finalScores().con);
  }
  if (wearing !== false && has('shield')) base += 2;
  return { total: base, armorName: armor ? armorNames.find(n => armorNames.some(x => x === n)) : null, hasArmor: !!armor };
}

export function equipmentItems() {
  const cls = charClass();
  const items = [];
  if (cls && cls.equipment && cls.equipment[0] && cls.equipment[0][globals.state.equipment.class]) {
    for (const it of cls.equipment[0][globals.state.equipment.class]) items.push(it);
  }
  const bg = globals.state.bgMode === 'bg' ? findBackground(globals.state.bg) : null;
  if (bg && bg.equipment && bg.equipment[0] && bg.equipment[0][globals.state.equipment.bg]) {
    for (const it of bg.equipment[0][globals.state.equipment.bg]) items.push(it);
  }
  return items;
}

export function money() {
  let cp = 0;
  const add = list => { for (const it of list || []) if (it.value !== undefined) cp += it.value; };
  const cls = charClass();
  if (cls && cls.equipment && cls.equipment[0] && cls.equipment[0][globals.state.equipment.class]) add(cls.equipment[0][globals.state.equipment.class]);
  const bg = globals.state.bgMode === 'bg' ? findBackground(globals.state.bg) : null;
  if (bg && bg.equipment && bg.equipment[0] && bg.equipment[0][globals.state.equipment.bg]) add(bg.equipment[0][globals.state.equipment.bg]);
  const gp = Math.floor(cp / 100), sp = Math.floor((cp % 100) / 10), c = cp % 10;
  return { gp, sp, c };
}

export function spellSlotsAt() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.slots) return null;
  return cls.spellcasting.slots[globals.state.level - 1] || [];
}

export function maxSpellLevel() {
  const cls = charClass();
  const slots = spellSlotsAt();
  if (!slots) return 0;
  if (cls && cls.spellcasting.type === 'pact') return Math.max(0, slots[1] || 0) + 1;
  let max = 0;
  slots.forEach((n, i) => { if (n > 0) max = i + 1; });
  return max;
}

export function slotSummaryTxt() {
  const cls = charClass();
  const slots = spellSlotsAt();
  if (!slots || !slots.some(n => n > 0)) return '';
  const ord = i => ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'][i];
  if (cls && cls.spellcasting.type === 'pact') return `Pact magic: ${slots[0]} × ${ord(slots[1])}-level slot${slots[0] > 1 ? 's' : ''}`;
  return slots.map((n, i) => n > 0 ? `${ord(i)}: ${n}` : null).filter(Boolean).join(', ') || '';
}

export function cantripCount() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.cantrips) return 0;
  return cls.spellcasting.cantrips[globals.state.level - 1] || 0;
}

export function preparedCount() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.prepared) return 0;
  return cls.spellcasting.prepared[globals.state.level - 1] || 0;
}

export function spellDC() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.ability) return null;
  return 8 + profBonus(globals.state.level) + abilityMod(finalScores()[cls.spellcasting.ability]);
}

export function spellAtk() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.ability) return null;
  return profBonus(globals.state.level) + abilityMod(finalScores()[cls.spellcasting.ability]);
}

export function classSpellsKnownFromSources() {
  const out = { spells: [], cantrips: [] };
  const cls = charClass();
  if (cls) {
    for (const b of cls.bonusSpells) {
      if (b.kind === 'innate' && b.name.endsWith('#c')) out.cantrips.push({ name: b.name.replace('#c', ''), source: cls.name + ' class', always: true });
      else out.spells.push({ name: b.name, level: Math.max(1, b.atLevel), source: cls.name + ' class', always: true });
    }
  }
  const race = charRace();
  if (race) {
    const lin = charLineage();
    const collect = list => {
      for (const sp of list || []) {
        if (sp.charLevel > globals.state.level) continue;
        if (sp.kind === 'cantrip') out.cantrips.push({ name: sp.name, source: race.name + (lin ? ' (' + lin.name + ')' : ''), always: true });
        else if (sp.kind === 'expanded') {
          for (const n of sp.names) out.spells.push({ name: n, level: 0, source: race.name + ' (expanded list)', expanded: true });
        } else out.spells.push({ name: sp.name, level: 0, source: race.name, always: true, innate: sp.kind === 'innate' });
      }
    };
    collect(race.spells);
    if (lin) collect(lin.spells);
  }
  for (const f of chosenFeats()) {
    for (const b of f.bonus || []) {
      if (b.choose) continue;
      if (b.kind === 'known' || b.kind === 'prepared' || b.kind === 'innate') {
        out.spells.push({ name: b.name, level: 0, source: (f.name || f.label), always: true });
      } else if (b.kind === 'expanded') {
        for (const n of b.names) out.spells.push({ name: n, level: 0, source: (f.name || f.label) + ' (expanded)', expanded: true });
      }
    }
  }
  return out;
}

export function featSpells(f) {
  const picks = globals.state.miPicks[f.id] || {};
  return { cantrips: picks.cantrips || [], spell: picks.spell || null };
}
