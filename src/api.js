import { globals } from './modules/state.js';
import { $, esc, jsStr, toggleIn, download } from './modules/helpers.js';
import { findRace, findClass, findBackground, findSpell } from './modules/data.js';
import { charClass, grantedSkills, otherSkillSources, otherToolSources } from './modules/compute.js';
import { resolveFeatRef, featName, featText } from './modules/feats.js';
import { render } from './steps/renderNav.js';

window.API = {
  assign(a, v) { globals.state.assign[a] = v === '' ? null : parseInt(v); render(); },
  pickRace(id) { globals.state.race = id; globals.state.lineage = null; globals.state.raceSkill = []; globals.state.humanFeat = null; render(); },
  pickLineage(id) { globals.state.lineage = id; render(); },
  toggleRaceSkill(s) {
    if (otherSkillSources(s, 'race').length) return;
    const r = findRace(globals.state.race);
    const max = (r && r.skillChoice && r.skillChoice.count) || 1;
    toggleIn(globals.state.raceSkill, s, max);
    render();
  },
  pickClass(id) { globals.state.cls = id; globals.state.classSkills = []; globals.state.subclass = null; globals.state.spells = { cantrips: [], prepared: [] }; render(); },
  toggleClassSkill(s) {
    if (otherSkillSources(s, 'class').length) return;
    const cls = charClass();
    const need = cls ? cls.skillChoices.reduce((n, c) => n + c.count, 0) : 1;
    toggleIn(globals.state.classSkills, s, need);
    render();
  },
  pickSubclass(id) { globals.state.subclass = id; render(); },
  toggleEqPreview() { const el = $('eq-preview'); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; },
  setBgMode(m) { globals.state.bgMode = m; render(); },
  pickBg(id) { globals.state.bg = id; globals.state.bgPlus2 = null; globals.state.bgPlus1 = null; globals.state.bgTool = null; render(); },
  pickBonus(which, a) {
    if (globals.state.bgMode === 'custom') {
      if (which === 'p1' && globals.state.custom.p2 === a) return;
      if (which === 'p2' && globals.state.custom.p1 === a) return;
      globals.state.custom[which] = a;
    } else {
      if (which === 'p1' && globals.state.bgPlus2 === a) return;
      if (which === 'p2' && globals.state.bgPlus1 === a) return;
      globals.state[which === 'p2' ? 'bgPlus2' : 'bgPlus1'] = a;
    }
    render();
  },
  toggleCustomSkill(s) { if (otherSkillSources(s, 'bg').length) return; toggleIn(globals.state.custom.skills, s, 2); render(); },
  pickCustomTool(t) { globals.state.custom.tool = t; render(); },
  pickBgTool(t) { globals.state.bgTool = t; render(); },
  pickFeat(kind, featId) {
    const prev = kind === 'customFeat' ? globals.state.custom.feat : kind === 'humanFeat' ? globals.state.humanFeat : globals.state.bgFeat;
    const prevFeat = resolveFeatRef(prev);
    if (prevFeat && prevFeat.id === 'skilled-xphb') globals.state.skilledPicks = [];
    if (kind === 'customFeat') globals.state.custom.feat = featId;
    else if (kind === 'humanFeat') globals.state.humanFeat = featId;
    else globals.state.bgFeat = featId;
    render();
  },
  previewFeat(id) {
    const el = $('feat-desc');
    if (!el) return;
    el.innerHTML = `<h4>${esc(featName(id))}</h4><div class="entry">${featText(id)}</div>`;
  },
  toggleSkilled(kind, id) {
    if (kind === 'skill' && otherSkillSources(id, 'feat').length) return;
    if (kind === 'tool' && otherToolSources(id, 'feat').length) return;
    const i = globals.state.skilledPicks.findIndex(p => p && typeof p === 'object' && p.kind === kind && p.id === id);
    if (i >= 0) globals.state.skilledPicks.splice(i, 1);
    else {
      if (globals.state.skilledPicks.length >= 3) { alert('Only 3 can be selected.'); return; }
      globals.state.skilledPicks.push({ kind, id });
    }
    render();
  },
  pickClassEquip(k) { globals.state.equipment.class = k; render(); },
  pickBgEquip(k) { globals.state.equipment.bg = k; render(); },
  toggleCantrip(n) { toggleIn(globals.state.spells.cantrips, n); render(); },
  togglePrepared(n) { toggleIn(globals.state.spells.prepared, n); render(); },
  previewSpell(name) {
    const el = $('spell-desc');
    if (!el) return;
    const sp = findSpell(name);
    if (!sp) return;
    const ord = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    const lvl = sp.level === 0 ? 'Cantrip' : (ord[sp.level] || sp.level) + '-level';
    let h = `<h4>${esc(sp.name)}</h4>`;
    h += `<div class="sub">${lvl} ${esc(sp.school)}${sp.ritual ? ' &middot; Ritual' : ''}${sp.concentration ? ' &middot; Concentration' : ''}</div>`;
    h += `<div class="sub" style="font-size:12px;color:var(--muted)">Casting Time: ${esc(sp.time)} &middot; Range: ${esc(sp.range)} &middot; Components: ${esc(sp.components)} &middot; Duration: ${esc(sp.duration)}</div>`;
    h += `<div class="entry">${sp.text}</div>`;
    if (sp.higher) h += `<div class="entry">${sp.higher}</div>`;
    el.innerHTML = h;
  },
  cycleSkill(id) {
    const base = grantedSkills().has(id);
    const exp = !!globals.state.expertise[id];
    if (base && !exp) globals.state.expertise[id] = true;
    else if (exp) globals.state.expertise[id] = false;
    else globals.state.expertise[id] = true;
    render();
  },
  detail(k, v) { globals.state.details[k] = v; },
  portrait(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = e => { globals.state.details.portrait = e.target.result; };
    r.readAsDataURL(f);
  },
  saveJson() {
    const blob = new Blob([JSON.stringify({ app: 'dnd5e24-builder', version: 1, state: globals.state }, null, 2)], { type: 'application/json' });
    download(blob, (globals.state.details.name || 'character') + '.json');
  },
  loadJson() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ev => {
        try {
          const obj = JSON.parse(ev.target.result);
          if (obj.state) globals.state = obj.state;
          render();
        } catch (err) { alert('Could not read character file.'); }
      };
      r.readAsText(f);
    };
    inp.click();
  },
  duplicate() {
    const copy = JSON.parse(JSON.stringify(globals.state));
    copy.details = { ...copy.details, name: (copy.details.name || 'Character') + ' (copy)' };
    globals.state = copy;
    render();
    alert('Duplicate created.');
  },
  print() { window.print(); }
};
