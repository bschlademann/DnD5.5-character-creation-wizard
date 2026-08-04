import { globals } from './state.js';
import { ABILITIES, AVG_HD, ASI_LEVELS, WEAPONS } from './constants.js';
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
  for (const lvl of Object.keys(globals.state.asiSelections)) {
    const sel = globals.state.asiSelections[lvl];
    if (sel && sel.type === 'asi' && sel.values) {
      for (const a of ABILITIES) s[a] += sel.values[a] || 0;
    }
  }
  for (const a of ABILITIES) s[a] = Math.min(s[a], 20);
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
  for (const s of (globals.state.extraSkills || [])) set.add(s);
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
  for (const lvl of Object.keys(globals.state.asiSelections)) {
    const sel = globals.state.asiSelections[lvl];
    if (sel && sel.type === 'feat' && sel.id) {
      const f = resolveFeatRef(sel.id);
      if (f) out.push(f);
    }
  }
  return out;
}

export function hdSize() {
  const cls = charClass();
  if (!cls) return 0;
  return parseInt(cls.hd.slice(1));
}

export function hp() {
  const cls = charClass();
  if (!cls) return null;
  const con = abilityMod(finalScores().con);
  const faces = hdSize();
  const hpArr = globals.state.hpPerLevel;
  let hp = 0;
  for (let lv = 0; lv < globals.state.level; lv++) {
    if (lv === 0) {
      hp += faces + con;
    } else {
      const choice = hpArr[lv - 1];
      const gained = (choice === 'average' || choice == null) ? AVG_HD[faces] : choice;
      hp += gained + con;
    }
  }
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

export function arcanumLevels() {
  const cls = charClass();
  const sk = cls && cls.spellcasting.spellsKnown;
  if (!sk) return [];
  return Object.keys(sk).map(Number).sort((a, b) => a - b);
}

export function arcanumSpellLv(level) {
  const cls = charClass();
  const slot = cls && cls.spellcasting.spellsKnown && cls.spellcasting.spellsKnown[level];
  if (!slot) return 0;
  return Math.max(0, ...Object.keys(slot).map(Number));
}

export function arcanumReached() {
  return arcanumLevels().filter(l => globals.state.level >= l);
}

export function arcanumPicks() {
  return (globals.state.spells && globals.state.spells.arcanum) || {};
}

export function cantripCount() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.cantrips) return 0;
  return cls.spellcasting.cantrips[globals.state.level - 1] || 0;
}

export function isPreparedCaster() {
  const cls = charClass();
  if (!cls) return false;
  return cls.spellcasting.type === 'full' || cls.spellcasting.type === 'artificer';
}

export function spellSystemLabel() {
  const cls = charClass();
  if (!cls) return '';
  if (cls.spellcasting.type === 'pact') return 'Spells Known (Pact Magic)';
  if (cls.spellcasting.type === 'full' || cls.spellcasting.type === 'artificer') return 'Spells to Prepare';
  return 'Spells Known';
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

function mergeSourceEntry(list, entry) {
  const existing = list.find(item => item.name === entry.name);
  if (!existing) {
    list.push(entry);
    return;
  }
  const sources = new Set([existing.source, entry.source].filter(Boolean));
  existing.source = [...sources].join(', ');
  existing.always = existing.always || entry.always;
  if (entry.level != null) existing.level = entry.level;
  if (entry.expanded) existing.expanded = true;
  if (entry.innate) existing.innate = true;
  const types = new Set([existing.srcType, entry.srcType].filter(Boolean));
  existing.srcType = types.size > 1 ? 'mixed' : entry.srcType || existing.srcType || 'class';
}

export function resolveFeatBonusList(f) {
  if (f.bonus) return f.bonus;
  if (f.base) {
    const b = globals.DATA.feats.find(x => x.id === f.base);
    if (b && b.bonus) {
      if (f.list) return b.bonus.filter(e => !e.choose || new RegExp('class=' + f.list, 'i').test(e.choose));
      return b.bonus;
    }
  }
  return [];
}

export function parseChoose(str) {
  const out = { levels: [], class: null, school: null, ritual: false };
  for (const part of String(str || '').split('|')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === 'level') out.levels = v.split(';').map(Number);
    else if (k === 'class') out.class = v.toLowerCase();
    else if (k === 'school') out.school = v.split(';').map(s => s.toUpperCase());
    else if (/components/i.test(k) && /ritual/i.test(v)) out.ritual = true;
  }
  return out;
}

export function featSpellPool(chooseStr) {
  const q = parseChoose(chooseStr);
  if (q.class) {
    const list = globals.DATA.classSpellLists[q.class];
    const set = new Set();
    for (const lv of q.levels) for (const n of (list && list[lv]) || []) set.add(n);
    return [...set];
  }
  const pool = [];
  for (const sp of globals.DATA.spells || []) {
    if (!q.levels.includes(sp.level)) continue;
    if (q.school && !q.school.includes(sp.schoolCode)) continue;
    if (q.ritual && !sp.ritual) continue;
    pool.push(sp.name);
  }
  return pool;
}

export function featPicks(fid) {
  return (globals.state.miPicks && globals.state.miPicks[fid]) || {};
}

export function featSpellChoicesComplete(f) {
  const bonuses = resolveFeatBonusList(f);
  const picks = featPicks(f.id);
  return bonuses.every((b, idx) => {
    if (!b.choose) return true;
    return (picks[idx] || []).length >= (b.count || 1);
  });
}

export function featChoicesComplete() {
  return chosenFeats().every(f => featSpellChoicesComplete(f));
}

export function classSpellsKnownFromSources() {
  const out = { spells: [], cantrips: [] };
  const cls = charClass();
  if (cls) {
    for (const b of cls.bonusSpells) {
      const entry = b.kind === 'innate' && b.name.endsWith('#c')
        ? { name: b.name.replace('#c', ''), source: cls.name + ' class', always: true, srcType: 'class' }
        : { name: b.name, level: Math.max(1, b.atLevel), source: cls.name + ' class', always: true, srcType: 'class' };
      if (entry.name.endsWith('#c')) {
        mergeSourceEntry(out.cantrips, entry);
      } else {
        mergeSourceEntry(out.spells, entry);
      }
    }
  }
  const race = charRace();
  if (race) {
    const lin = charLineage();
    const collect = (list, src, srcType) => {
      for (const sp of list || []) {
        if (sp.charLevel > globals.state.level) continue;
        if (sp.kind === 'cantrip') {
          mergeSourceEntry(out.cantrips, { name: sp.name, source: src, always: true, srcType });
        } else if (sp.kind === 'expanded') {
          for (const n of sp.names) mergeSourceEntry(out.spells, { name: n, level: 0, source: src + ' (expanded list)', expanded: true, srcType });
        } else {
          mergeSourceEntry(out.spells, { name: sp.name, level: 0, source: src, always: true, innate: sp.kind === 'innate', srcType });
        }
      }
    };
    if (lin && race.lineages && race.lineages.length) {
      collect(lin.spells, race.name + ' (' + lin.name + ')', 'species');
    } else if (race.spells && race.spells.length) {
      const unique = {};
      for (const sp of race.spells) unique[sp.name + '|' + sp.kind] = sp;
      collect(Object.values(unique), race.name, 'species');
    }
  }
  for (const f of chosenFeats()) {
    const bonuses = resolveFeatBonusList(f);
    const picks = featPicks(f.id);
    bonuses.forEach((b, idx) => {
      if (b.choose) {
        const q = parseChoose(b.choose);
        for (const name of picks[idx] || []) {
          const isCantrip = q.levels.includes(0);
          const entry = { name, level: q.levels.find(l => l !== 0) || 1, source: (f.name || f.label), always: true, srcType: 'feat' };
          if (isCantrip) mergeSourceEntry(out.cantrips, entry);
          else mergeSourceEntry(out.spells, entry);
        }
        return;
      }
      if (b.kind === 'known' || b.kind === 'prepared' || b.kind === 'innate') {
        mergeSourceEntry(out.spells, { name: b.name, level: 0, source: (f.name || f.label), always: true, srcType: 'feat' });
      } else if (b.kind === 'expanded') {
        for (const n of b.names) mergeSourceEntry(out.spells, { name: n, level: 0, source: (f.name || f.label) + ' (expanded)', expanded: true, srcType: 'feat' });
      }
    });
  }
  return out;
}

export function isAsiLevel(level) {
  const cls = charClass();
  if (!cls) return false;
  const key = cls.id === 'fighter' ? 'fighter' : cls.id === 'rogue' ? 'rogue' : 'default';
  return ASI_LEVELS[key].includes(level);
}

export function classGrantsFeature(cls, name, level) {
  if (!cls) return false;
  return (cls.features || []).some(f => f.name === name && f.level <= level);
}

export function fightingStyleGranted(cls, level) {
  return classGrantsFeature(cls, 'Fighting Style', level);
}

export function fightingStylePool(cls) {
  const cats = ['FS'];
  if (cls && cls.id === 'paladin') cats.push('FS:P');
  if (cls && cls.id === 'ranger') cats.push('FS:R');
  return globals.DATA.feats.filter(f => cats.includes(f.category) && f.source === 'XPHB').sort((a, b) => a.name.localeCompare(b.name));
}

export function weaponMasteryGranted(cls, level) {
  return classGrantsFeature(cls, 'Weapon Mastery', level);
}

const MASTERY_COUNT = {
  barbarian: [[1, 2], [9, 3], [13, 4], [17, 5]],
  fighter: [[1, 3], [4, 5], [9, 6], [13, 7], [17, 8], [20, 9]],
  paladin: [[1, 2]],
  ranger: [[1, 2]],
  rogue: [[1, 2]]
};

export function weaponMasteryCount(cls, level) {
  const list = MASTERY_COUNT[cls && cls.id] || [];
  let count = 0;
  for (const [lv, n] of list) if (level >= lv) count = n;
  return count;
}

export function weaponMasteryPool(cls) {
  const meleeOnly = !!(cls && cls.id === 'barbarian');
  return WEAPONS.filter(w => meleeOnly ? w.type === 'melee' : true);
}
