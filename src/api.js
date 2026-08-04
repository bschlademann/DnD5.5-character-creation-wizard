import { globals } from './modules/state.js';
import { $, esc, jsStr, toggleIn, download } from './modules/helpers.js';
import { findRace, findClass, findBackground, findSpell } from './modules/data.js';
import { charClass, grantedSkills, otherSkillSources, otherToolSources, hdSize, isAsiLevel, cantripCount, preparedCount, resolveFeatBonusList, weaponMasteryCount } from './modules/compute.js';
import { AVG_HD } from './modules/constants.js';
import { resolveFeatRef, featName, featText } from './modules/feats.js';
import { openLevelUp, rollHpDie, acceptHp, pickModalSubclass, pickModalFighting, toggleModalMastery, pickAsiMode, asiAdjust, pickAsiFeat, toggleModalFeatSpell, toggleModalCantrip, toggleModalPrepared, toggleModalArcanum, confirmLevelUp, levelDown } from './modules/levelUp.js';
import { render, goTo } from './steps/renderNav.js';

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
  pickClass(id) { globals.state.cls = id; globals.state.classSkills = []; globals.state.subclass = null; globals.state.fightingStyle = null; globals.state.weaponMasteries = []; globals.state.spells = { cantrips: [], prepared: [], arcanum: {} }; render(); },
  pickClassFighting(id) { globals.state.fightingStyle = id; render(); },
  toggleClassMastery(name) { toggleIn(globals.state.weaponMasteries, name, weaponMasteryCount(charClass(), globals.state.level)); render(); },
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
    if (prevFeat && globals.state.miPicks) delete globals.state.miPicks[prevFeat.id];
    if (kind === 'customFeat') globals.state.custom.feat = featId;
    else if (kind === 'humanFeat') globals.state.humanFeat = featId;
    else globals.state.bgFeat = featId;
    render();
  },
  toggleFeatSpell(fid, idx, name) {
    const f = resolveFeatRef(fid);
    const bonuses = resolveFeatBonusList(f);
    const count = (bonuses[idx] && bonuses[idx].count) || 1;
    const map = globals.state.miPicks[fid] || (globals.state.miPicks[fid] = {});
    const arr = map[idx] || [];
    const i = arr.indexOf(name);
    if (i >= 0) arr.splice(i, 1);
    else {
      if (arr.length >= count) { alert(`Only ${count} can be selected.`); return; }
      arr.push(name);
    }
    if (arr.length) map[idx] = arr; else delete map[idx];
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
  toggleCantrip(n) { toggleIn(globals.state.spells.cantrips, n, cantripCount()); render(); },
  togglePrepared(n) { toggleIn(globals.state.spells.prepared, n, preparedCount()); render(); },
  toggleArcanum(level, name) {
    const map = globals.state.spells.arcanum || (globals.state.spells.arcanum = {});
    if (map[level] === name) delete map[level];
    else map[level] = name;
    render();
  },
  previewSpell(name) {
    const el = document.querySelector('#feat-spell-desc') || document.querySelector('.modal-overlay #spell-desc') || $('spell-desc');
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
    const extra = globals.state.extraSkills || (globals.state.extraSkills = []);
    const fromExtra = extra.includes(id);
    if (base && !exp) {
      globals.state.expertise[id] = true;
    } else if (exp) {
      delete globals.state.expertise[id];
      if (fromExtra) extra.splice(extra.indexOf(id), 1);
    } else if (fromExtra) {
      extra.splice(extra.indexOf(id), 1);
    } else {
      extra.push(id);
    }
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
  print() { window.print(); },
  showHpDialog() {
    const faces = hdSize();
    if (!faces) { render(); return; }
    const avg = AVG_HD[faces];
    const existing = globals.state.hpPerLevel;
    const curLevel = globals.state.level;
    let html = `<div class="modal-overlay" onclick="if(event.target===this)API.closeModal()">
      <div class="modal" style="max-width:420px">
        <h3>Hit Points – Level ${curLevel}</h3>
        <p style="margin:8px 0 14px;color:var(--muted)">Your class hit die is <b>d${faces}</b>.</p>`;
    for (let lv = 1; lv < curLevel; lv++) {
      const prev = existing[lv - 1];
      const label = prev === 'average' ? `Average (${avg})` : (prev != null ? `Rolled (${prev})` : `Average (${avg})`);
      html += `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)">
        <span>Level ${lv + 1}</span><span style="color:var(--muted)">${label}</span></div>`;
    }
    const newLv = curLevel;
    html += `<div style="margin-top:14px"><b>Level ${newLv + 1} HP</b></div>
      <p style="margin:6px 0 12px;color:var(--muted)">Choose how to determine HP for this level:</p>
      <div style="display:flex;gap:10px">
        <button onclick="API.chooseHp(${newLv},'average')" style="flex:1;padding:10px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:var(--chip);color:var(--fg)">Take Average (${avg})</button>
        <button onclick="API.chooseHp(${newLv},'roll')" style="flex:1;padding:10px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:var(--chip);color:var(--fg)">Roll (d${faces})</button>
      </div>
      <div id="hp-roll-result" style="margin-top:10px;text-align:center;font-size:15px"></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  chooseHp(level, choice) {
    const faces = hdSize();
    if (choice === 'average') {
      globals.state.hpPerLevel[level - 1] = 'average';
    } else {
      const roll = Math.floor(Math.random() * faces) + 1;
      globals.state.hpPerLevel[level - 1] = roll;
      const el = document.getElementById('hp-roll-result');
      if (el) el.innerHTML = `You rolled a <b>${roll}</b>! <button onclick="API.chooseHp(${level},'roll')" style="margin-left:8px;padding:4px 10px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:var(--chip);color:var(--fg)">Re-roll</button>`;
      return;
    }
    this.closeModal();
    render();
  },
  closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
  },
  openLevelUp, rollHpDie, acceptHp, pickModalSubclass, pickModalFighting, toggleModalMastery, pickAsiMode, asiAdjust, pickAsiFeat, toggleModalFeatSpell, toggleModalCantrip, toggleModalPrepared, toggleModalArcanum, confirmLevelUp, levelDown,
  gotoStep(i) { goTo(i); },
  finalize() {
    globals.state.finalized = true;
    render();
  },
  showAsiDialog(level) {
    const existing = globals.state.asiSelections[level] || null;
    let html = `<div class="modal-overlay" onclick="if(event.target===this)API.closeModal()">
      <div class="modal" style="max-width:480px">
        <h3>Ability Score Improvement or Feat – Level ${level}</h3>
        <p style="margin:8px 0 14px;color:var(--muted)">Choose an Ability Score Improvement (+2 to one or +1 to two) or a Feat.</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button onclick="API.pickAsiType(${level},'asi')" style="padding:10px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:${existing && existing.type === 'asi' ? 'var(--accent)' : 'var(--chip)'};color:var(--fg);text-align:left">
            <b>Ability Score Improvement</b><br><span style="color:var(--muted);font-size:13px">+2 to one ability or +1 to two abilities</span>
          </button>
          <button onclick="API.pickAsiType(${level},'feat')" style="padding:10px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:${existing && existing.type === 'feat' ? 'var(--accent)' : 'var(--chip)'};color:var(--fg);text-align:left">
            <b>Feat</b><br><span style="color:var(--muted);font-size:13px">Choose a feat instead of ability scores</span>
          </button>
        </div>
        <div id="asi-detail"></div>
      </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    if (existing) this.pickAsiType(level, existing.type);
  },
  pickAsiType(level, type) {
    const det = document.getElementById('asi-detail');
    if (!det) return;
    if (type === 'asi') {
      const prev = globals.state.asiSelections[level];
      const vals = (prev && prev.type === 'asi') ? (prev.values || {}) : {};
      let html = `<div style="margin-top:14px"><b>+2 to one ability or +1 to two:</b></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">`;
      for (const a of ['str','dex','con','int','wis','cha']) {
        const v = vals[a] || 0;
        html += `<div style="display:flex;align-items:center;gap:6px">
          <span style="width:30px;text-transform:uppercase;font-weight:600">${a}</span>
          <button onclick="API.asiAdj('${a}',${level},-1)" style="width:28px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:var(--chip);color:var(--fg)">−</button>
          <span style="width:20px;text-align:center">${v}</span>
          <button onclick="API.asiAdj('${a}',${level},1)" style="width:28px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:var(--chip);color:var(--fg)">+</button>
        </div>`;
      }
      html += `</div><div id="asi-err" style="color:#e55;margin-top:6px;font-size:13px"></div>
        <button onclick="API.confirmAsi(${level},'asi')" style="margin-top:10px;padding:8px 18px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:var(--accent);color:#fff">Confirm</button>`;
      det.innerHTML = html;
    } else {
      det.innerHTML = `<div style="margin-top:14px;color:var(--muted)">Feat selection will be available in the Feat step.</div>
        <button onclick="API.confirmAsi(${level},'feat')" style="margin-top:10px;padding:8px 18px;cursor:pointer;border:1px solid var(--border);border-radius:var(--rad);background:var(--accent);color:#fff">Confirm Feat Choice</button>`;
    }
  },
  asiAdj(abil, level, delta) {
    const prev = globals.state.asiSelections[level];
    const vals = (prev && prev.type === 'asi') ? { ...(prev.values || {}) } : {};
    vals[abil] = (vals[abil] || 0) + delta;
    if (vals[abil] < 0) vals[abil] = 0;
    const total = Object.values(vals).reduce((a, b) => a + b, 0);
    const hasTwo = Object.values(vals).filter(v => v > 0).length >= 2;
    if (total > 2 || (total === 2 && hasTwo && Object.values(vals).some(v => v > 1))) {
      vals[abil] = (vals[abil] || 0) - delta;
    }
    globals.state.asiSelections[level] = { type: 'asi', values: vals };
    this.pickAsiType(level, 'asi');
  },
  confirmAsi(level, type) {
    if (type === 'asi') {
      const sel = globals.state.asiSelections[level];
      if (!sel || sel.type !== 'asi') return;
      const total = Object.values(sel.values || {}).reduce((a, b) => a + b, 0);
      if (total !== 2) {
        const err = document.getElementById('asi-err');
        if (err) err.textContent = 'Must assign exactly +2 total.';
        return;
      }
    } else {
      globals.state.asiSelections[level] = { type: 'feat' };
    }
    this.closeModal();
    render();
  }
};
