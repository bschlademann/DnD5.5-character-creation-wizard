import { globals } from './state.js';
import { ABILITIES, AVG_HD } from './constants.js';
import { $, esc, jsStr, abilName } from './helpers.js';
import { findSpell } from './data.js';
import { charClass, hdSize, isAsiLevel, arcanumSpellLv, resolveFeatBonusList } from './compute.js';
import { featName, featText, resolveFeatRef } from './feats.js';
import { renderFeatSpellChoices } from './sharedComponents.js';
import { render } from './../steps/renderNav.js';

const LUP = {
  target: 1,
  hpChoice: null,
  hpRoll: null,
  subclass: null,
  asi: null,
  cantrips: [],
  prepared: [],
  arcanum: {},
  asiPicks: {}
};

const ord = n => n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
const countAt = (arr, lvl) => (arr && arr[lvl - 1]) || 0;

function maxLevelAt(cls, lvl) {
  const slots = (cls.spellcasting.slots && cls.spellcasting.slots[lvl - 1]) || [];
  if (!slots.length) return 0;
  if (cls.spellcasting.type === 'pact') return (slots[1] || 0) + 1;
  let max = 0;
  slots.forEach((n, i) => { if (n > 0) max = i + 1; });
  return max;
}

function spellsNeeded() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.ability) return false;
  const t = LUP.target, o = t - 1;
  if (countAt(cls.spellcasting.cantrips, t) > countAt(cls.spellcasting.cantrips, o)) return true;
  if (countAt(cls.spellcasting.prepared, t) > countAt(cls.spellcasting.prepared, o)) return true;
  return maxLevelAt(cls, t) > maxLevelAt(cls, o);
}

function asiNeeded() {
  const cls = charClass();
  if (!cls) return false;
  if (LUP.target === 19) return true;
  return isAsiLevel(LUP.target);
}

function arcanumNeeded() {
  const cls = charClass();
  const sk = cls && cls.spellcasting.spellsKnown;
  return !!(sk && sk[LUP.target]);
}

function sectionsOk() {
  if (LUP.hpChoice == null) return false;
  if (LUP.target === 3 && !LUP.subclass) return false;
  if (asiNeeded()) {
    if (!LUP.asi) return false;
    if (LUP.asi.type === 'asi') {
      const total = Object.values(LUP.asi.values || {}).reduce((a, b) => a + b, 0);
      if (total !== 2) return false;
    } else if (!LUP.asi.id) return false;
    if (LUP.asi.type === 'feat' && LUP.asi.id) {
      const f = resolveFeatRef(LUP.asi.id);
      const bonuses = resolveFeatBonusList(f);
      const picks = LUP.asiPicks[LUP.asi.id] || {};
      if (!bonuses.every((b, idx) => !b.choose || (picks[idx] || []).length >= (b.count || 1))) return false;
    }
  }
  if (spellsNeeded()) {
    const cls = charClass();
    if (LUP.cantrips.length !== countAt(cls.spellcasting.cantrips, LUP.target)) return false;
    if (LUP.prepared.length !== countAt(cls.spellcasting.prepared, LUP.target)) return false;
  }
  if (arcanumNeeded() && !LUP.arcanum[LUP.target]) return false;
  return true;
}

function spellLabel(cls) {
  return cls.spellcasting.type === 'pact' ? 'Spells Known' : 'Spells to Prepare';
}

function featPool(lvl) {
  const pool = [];
  for (const f of globals.DATA.feats) {
    if (f.source !== 'XPHB' && f.source !== 'EFA') continue;
    if (f.category === 'G' && f.id !== 'abilityscoreimprovement-xphb') pool.push(f);
    else if (lvl === 19 && f.category === 'EB') pool.push(f);
  }
  pool.sort((a, b) => a.name.localeCompare(b.name));
  return pool;
}

// ---------- sections ----------

function hpSection(faces) {
  const avg = AVG_HD[faces];
  const chosen = LUP.hpChoice;
  let resultHtml = '';
  if (chosen === 'average') resultHtml = `<div class="hp-result">Hit points gained: <b>${avg}</b> (average) + Con modifier</div>`;
  else if (typeof chosen === 'number') resultHtml = `<div class="hp-result">Hit points gained: <b>${chosen}</b> (rolled) + Con modifier</div>`;
  return `<section class="levelup-sec" data-sec="hp">
    <h3>1. Hit Points <span class="sub">d${faces}</span></h3>
    ${resultHtml || `<div class="hp-roll">
      <div class="hp-die" id="hp-die-face">d${faces}</div>
      <div class="hp-roll-actions">
        <button class="btn" onclick="API.rollHpDie()">Roll d${faces}</button>
        <button class="btn" onclick="API.acceptHp('average')">Take Average (${avg})</button>
      </div>
    </div>`}
    ${LUP.hpRoll != null && !resultHtml ? `<div class="hp-reroll"><button class="btn ghost" onclick="API.acceptHp('roll')">Accept Roll (${LUP.hpRoll})</button> <button class="btn ghost" onclick="API.rollHpDie()">Re-roll</button></div>` : ''}
  </section>`;
}

function featuresSection(cls, lvl) {
  const feats = (cls.features || []).filter(f => f.level === lvl);
  if (!feats.length) return '';
  return `<section class="levelup-sec" data-sec="features">
    <h3>2. Class Features</h3>
    ${feats.map(f => `<details open><summary>${esc(f.name)}</summary><div class="entry">${f.text}</div></details>`).join('')}
  </section>`;
}

function subclassSection(cls, lvl) {
  if (lvl !== 3 || globals.state.subclass) return '';
  return `<section class="levelup-sec" data-sec="subclass">
    <h3>3. ${esc(cls.subclassTitle || 'Subclass')}</h3>
    <div class="sub-grid">${cls.subclasses.map(s => {
      const sel = s.id === LUP.subclass;
      return `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickModalSubclass('${s.id}')">
        <h4>${esc(s.name)}</h4>
        ${s.features ? `<div class="desc">${s.features.filter(f => f.level === 3).map(f => f.name).join(', ')}</div>` : ''}
      </div>`;
    }).join('')}</div>
  </section>`;
}

function subclassFeaturesSection(cls, lvl) {
  if (lvl < 3) return '';
  const sub = cls.subclasses.find(s => s.id === LUP.subclass);
  if (!sub || !sub.features) return '';
  const feats = sub.features.filter(f => f.level === lvl);
  if (!feats.length) return '';
  return `<section class="levelup-sec" data-sec="subfeatures">
    <h3>${esc(sub.name)} Features</h3>
    ${feats.map(f => `<details open><summary>${esc(f.name)}</summary><div class="entry">${f.text}</div></details>`).join('')}
  </section>`;
}

function renderAsiDetail(asi, lvl) {
  if (asi.type === 'asi') {
    const vals = asi.values || {};
    const total = Object.values(vals).reduce((a, b) => a + b, 0);
    return `<div class="asi-steppers">
      ${ABILITIES.map(a => {
        const v = vals[a] || 0;
        return `<div class="asi-row">
          <span class="asi-label">${abilName(a)}</span>
          <button class="stepper-btn" ${v > 0 ? '' : 'disabled'} onclick="API.asiAdjust('${a}', -1)">−</button>
          <span class="asi-val">${v}</span>
          <button class="stepper-btn" ${total >= 2 ? 'disabled' : ''} onclick="API.asiAdjust('${a}', 1)">+</button>
        </div>`;
      }).join('')}
    </div>
    <div class="asi-total">Points assigned: <b>${total}</b> of 2</div>`;
  }
  return `<div class="feat-grid">
    ${featPool(lvl).map(f => {
      const sel = asi.id === f.id;
      return `<div class="feat-opt ${sel ? 'selected' : ''}" onclick="API.pickAsiFeat('${f.id}')">
        <b>${esc(f.name)}</b>
      </div>`;
    }).join('')}
  </div>
  <div class="feat-desc-box">${asi.id ? `<h4>${esc(featName(asi.id))}</h4><div class="entry">${featText(asi.id)}</div>${renderFeatSpellChoices(asi.id, {
    getPicks: (fid, idx) => (LUP.asiPicks[fid] || {})[idx] || [],
    toggleFn: 'API.toggleModalFeatSpell'
  })}` : '<div class="info">Select a feat to preview it.</div>'}</div>`;
}

function asiSection(cls, lvl) {
  if (!asiNeeded()) return '';
  const existing = LUP.asi;
  return `<section class="levelup-sec" data-sec="asi">
    <h3>${lvl === 19 ? 'Epic Boon or Feat' : 'Ability Score Improvement or Feat'}</h3>
    <div class="asi-tabs">
      <button class="btn ${existing && existing.type === 'asi' ? 'primary' : ''}" onclick="API.pickAsiMode('asi')">+2 / +1 Ability Scores</button>
      <button class="btn ${existing && existing.type === 'feat' ? 'primary' : ''}" onclick="API.pickAsiMode('feat')">Choose a Feat</button>
    </div>
    <div id="asi-detail">${existing ? renderAsiDetail(existing, lvl) : '<div class="info">Choose an option above.</div>'}</div>
  </section>`;
}

function spellsSection(cls) {
  if (!spellsNeeded() && !arcanumNeeded()) return '';
  const maxLv = maxLevelAt(cls, LUP.target);
  const cCount = countAt(cls.spellcasting.cantrips, LUP.target);
  const pCount = countAt(cls.spellcasting.prepared, LUP.target);
  const list = cls.spellList || {};
  let html = `<section class="levelup-sec" data-sec="spells">
    <h3>Spells <span class="sub">${esc(spellLabel(cls))}</span></h3>
    <div class="side-picker"><div class="pick-list">`;

  html += `<h4>Cantrips (choose ${cCount})</h4>`;
  html += `<div class="counter"><b>${LUP.cantrips.length}</b> / ${cCount} selected</div>`;
  html += `<div class="spell-grid">`;
  for (const name of list['0'] || []) {
    const sp = findSpell(name);
    const on = LUP.cantrips.includes(name);
    const maxed = !on && LUP.cantrips.length >= cCount;
    const itemCls = ['spell-item', on ? 'on' : '', maxed ? 'maxed' : ''].join(' ');
    const click = maxed ? '' : `onclick="API.toggleModalCantrip('${jsStr(name)}')"`;
    html += `<div class="${itemCls}" ${click} onmouseover="API.previewSpell('${jsStr(name)}')"><div>${esc(name)}</div><div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) : ''}</div></div>`;
  }
  html += `</div>`;

  html += `<h4>${esc(spellLabel(cls))} (choose ${pCount})</h4>`;
  html += `<div class="counter"><b>${LUP.prepared.length}</b> / ${pCount} selected &middot; up to level ${maxLv}</div>`;
  for (let lv = 1; lv <= maxLv; lv++) {
    const arr = list[lv] || [];
    if (!arr.length) continue;
    html += `<h4 style="margin:10px 0 4px">Level ${lv}${ord(lv)}</h4><div class="spell-grid">`;
    for (const name of arr) {
      const sp = findSpell(name);
      const on = LUP.prepared.includes(name);
      const maxed = !on && LUP.prepared.length >= pCount;
      const itemCls = ['spell-item', on ? 'on' : '', maxed ? 'maxed' : ''].join(' ');
      const click = maxed ? '' : `onclick="API.toggleModalPrepared('${jsStr(name)}')"`;
      const ritualTip = sp && sp.ritual ? ' title="Ritual: You can cast this spell using a ritual instead of a spell slot, but the casting time increases by 10 minutes."' : '';
      html += `<div class="${itemCls}" ${click} onmouseover="API.previewSpell('${jsStr(name)}')" ${ritualTip}>
        <div>${esc(name)}${sp && sp.ritual ? ' <span class="badge">[Ritual]</span>' : ''}</div>
        <div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) + ' · ' + esc(sp.components) : ''}</div></div>`;
    }
    html += '</div>';
  }

  if (arcanumNeeded()) {
    const spl = arcanumSpellLv(LUP.target);
    const cur = LUP.arcanum[LUP.target];
    html += `<h3>Mystic Arcanum <span class="sub">choose one level-${spl} spell</span></h3>`;
    html += `<div class="info">Cast this spell once per Long Rest without expending a spell slot.</div>`;
    html += `<div class="counter">${cur ? `Selected: <b>${esc(cur)}</b>` : 'No spell selected yet'}</div>`;
    html += `<div class="spell-grid">`;
    for (const name of list[spl] || []) {
      const sp = findSpell(name);
      const on = cur === name;
      html += `<div class="spell-item ${on ? 'on' : ''}" onclick="API.toggleModalArcanum('${jsStr(name)}')" onmouseover="API.previewSpell('${jsStr(name)}')">
        <div>${esc(name)}</div><div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) : ''}</div></div>`;
    }
    html += '</div>';
  }

  html += `</div><div class="pick-desc" id="spell-desc"></div></div></section>`;
  return html;
}
// ---------- modal assembly ----------

function renderModal() {
  const old = document.querySelector('.modal-overlay');
  if (old) old.remove();
  const cls = charClass();
  const faces = hdSize();
  const lvl = LUP.target;
  let html = `<div class="modal-overlay" onclick="if(event.target===this)API.closeModal()">
    <div class="modal levelup-modal">
      <div class="levelup-head">
        <h2>Level Up &mdash; Level ${lvl}</h2>
        <button class="btn ghost" onclick="API.closeModal()">Close</button>
      </div>
      <div class="levelup-body">
        ${hpSection(faces)}
        ${featuresSection(cls, lvl)}
        ${subclassSection(cls, lvl)}
        ${subclassFeaturesSection(cls, lvl)}
        ${asiSection(cls, lvl)}
        ${spellsSection(cls)}
      </div>
      <div class="levelup-foot">
        <div id="levelup-err" class="validation-banner"></div>
        <button class="btn primary" id="levelup-confirm" onclick="API.confirmLevelUp()" ${sectionsOk() ? '' : 'disabled'}>Level Up to ${lvl}</button>
      </div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function refreshConfirm() {
  const btn = document.getElementById('levelup-confirm');
  if (btn) btn.disabled = !sectionsOk();
}

function replaceSection(key, html) {
  const el = document.querySelector('.levelup-modal');
  if (!el) return;
  const sec = el.querySelector(`.levelup-sec[data-sec="${key}"]`);
  if (!sec) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  sec.parentNode.replaceChild(tmp.firstChild, sec);
  refreshConfirm();
}

function renderHpSection() {
  replaceSection('hp', hpSection(hdSize()));
}

function renderAsiSection() {
  const el = document.getElementById('asi-detail');
  if (!el) return;
  el.innerHTML = LUP.asi ? renderAsiDetail(LUP.asi, LUP.target) : '';
  refreshConfirm();
}

function renderSpellsSection() {
  const cls = charClass();
  replaceSection('spells', spellsSection(cls));
  refreshConfirm();
}

// ---------- public API ----------

export function openLevelUp() {
  const cls = charClass();
  if (!cls) return;
  if (globals.state.level >= 20) return;
  LUP.target = globals.state.level + 1;
  LUP.hpChoice = null;
  LUP.hpRoll = null;
  LUP.subclass = globals.state.subclass;
  LUP.asi = globals.state.asiSelections[LUP.target] ? JSON.parse(JSON.stringify(globals.state.asiSelections[LUP.target])) : null;
  LUP.asiPicks = JSON.parse(JSON.stringify(globals.state.miPicks || {}));
  LUP.cantrips = [...globals.state.spells.cantrips];
  LUP.prepared = [...globals.state.spells.prepared];
  LUP.arcanum = { ...(globals.state.spells.arcanum || {}) };
  renderModal();
}

export function closeLevelUp() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
}

export function rollHpDie() {
  const faces = hdSize();
  const el = document.getElementById('hp-die-face');
  let ticks = 0;
  const iv = setInterval(() => {
    if (el) el.textContent = Math.floor(Math.random() * faces) + 1;
    if (++ticks >= 14) {
      clearInterval(iv);
      LUP.hpRoll = Math.floor(Math.random() * faces) + 1;
      renderHpSection();
    }
  }, 55);
}

export function acceptHp(choice) {
  LUP.hpChoice = choice === 'roll' ? (LUP.hpRoll ?? 'average') : 'average';
  renderHpSection();
}

export function pickModalSubclass(id) { LUP.subclass = id; renderModal(); }

export function pickAsiMode(mode) {
  LUP.asi = mode === 'asi' ? { type: 'asi', values: {} } : { type: 'feat', id: null };
  renderAsiSection();
}

export function asiAdjust(a, delta) {
  const vals = { ...(LUP.asi && LUP.asi.type === 'asi' ? LUP.asi.values || {} : {}) };
  vals[a] = (vals[a] || 0) + delta;
  if (vals[a] < 0) vals[a] = 0;
  const total = Object.values(vals).reduce((x, y) => x + y, 0);
  const count = Object.values(vals).filter(v => v > 0).length;
  if (total > 2 || (total === 2 && count >= 2 && Object.values(vals).some(v => v > 1))) {
    vals[a] = (vals[a] || 0) - delta;
  }
  LUP.asi = { type: 'asi', values: vals };
  renderAsiSection();
}

export function pickAsiFeat(id) {
  LUP.asi = { type: 'feat', id };
  renderAsiSection();
}

export function toggleModalFeatSpell(fid, idx, name) {
  const f = resolveFeatRef(fid);
  const bonuses = resolveFeatBonusList(f);
  const count = (bonuses[idx] && bonuses[idx].count) || 1;
  const map = LUP.asiPicks[fid] || (LUP.asiPicks[fid] = {});
  const arr = map[idx] || [];
  const i = arr.indexOf(name);
  if (i >= 0) arr.splice(i, 1);
  else {
    if (arr.length >= count) { alert(`Only ${count} can be selected.`); return; }
    arr.push(name);
  }
  if (arr.length) map[idx] = arr; else delete map[idx];
  renderAsiSection();
}

export function toggleModalCantrip(name) {
  const i = LUP.cantrips.indexOf(name);
  if (i >= 0) LUP.cantrips.splice(i, 1);
  else LUP.cantrips.push(name);
  renderSpellsSection();
}

export function toggleModalPrepared(name) {
  const i = LUP.prepared.indexOf(name);
  if (i >= 0) LUP.prepared.splice(i, 1);
  else LUP.prepared.push(name);
  renderSpellsSection();
}

export function toggleModalArcanum(name) {
  if (LUP.arcanum[LUP.target] === name) delete LUP.arcanum[LUP.target];
  else LUP.arcanum[LUP.target] = name;
  renderSpellsSection();
}

export function confirmLevelUp() {
  if (!sectionsOk()) return;
  const lvl = LUP.target;
  globals.state.level = lvl;
  globals.state.hpPerLevel[lvl - 1] = LUP.hpChoice;
  if (lvl >= 3) globals.state.subclass = LUP.subclass;
  if (asiNeeded()) globals.state.asiSelections[lvl] = LUP.asi;
  globals.state.spells.cantrips = LUP.cantrips;
  globals.state.spells.prepared = LUP.prepared;
  globals.state.miPicks = LUP.asiPicks;
  if (arcanumNeeded()) globals.state.spells.arcanum = LUP.arcanum;
  closeLevelUp();
  render();
}

export function levelDown() {
  if (globals.state.level <= 1) return;
  const lvl = globals.state.level;
  globals.state.level = lvl - 1;
  globals.state.hpPerLevel.splice(lvl - 1, 1);
  delete globals.state.asiSelections[lvl];
  if (globals.state.level < 3) globals.state.subclass = null;
  const cls = charClass();
  if (cls && cls.spellcasting.ability) {
    globals.state.spells.cantrips = globals.state.spells.cantrips.slice(0, countAt(cls.spellcasting.cantrips, globals.state.level));
    globals.state.spells.prepared = globals.state.spells.prepared.slice(0, countAt(cls.spellcasting.prepared, globals.state.level));
    if (cls.spellcasting.spellsKnown) {
      const map = globals.state.spells.arcanum || (globals.state.spells.arcanum = {});
      for (const L of Object.keys(cls.spellcasting.spellsKnown)) {
        if (Number(L) > globals.state.level) delete map[L];
      }
    }
  }
  render();
}
