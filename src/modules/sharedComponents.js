import { globals } from './state.js';
import { TOOL_GROUPS } from './constants.js';
import { esc, jsStr, abilName } from './helpers.js';
import { findBackground } from './data.js';
import { chosenFeats, otherSkillSources, otherToolSources } from './compute.js';
import { magicInitiateVariants, resolveFeatRef, originFeatPool, featText, featName, featSource } from './feats.js';

export function renderToolChoiceHtml() {
  const bg = globals.state.bg ? findBackground(globals.state.bg) : null;
  if (!bg) return '';
  const needsPick = (bg.tools || []).filter(t => /any/.test(t));
  if (!needsPick.length) return '';
  let html = '';
  for (const any of needsPick) {
    const opts = TOOL_GROUPS[any] || [];
    const label = any === 'anyArtisansTool' ? "Artisan's Tools" : any === 'anyGamingSet' ? 'Gaming Set' : 'Musical Instrument';
    html += `<h3>Tool Proficiency (choose one ${label})</h3><div class="choice-list">`;
    for (const t of opts) {
      const on = globals.state.bgTool === t;
      const tk = otherToolSources(t, 'bg');
      const chipCls = ['chip', on ? 'on' : '', tk.length ? 'taken' : ''].join(' ');
      const click = tk.length ? '' : ` onclick="API.pickBgTool('${jsStr(t)}')"`;
      const tip = tk.length ? ` title="${esc('Already proficient: ' + tk.join(', '))}"` : '';
      html += `<span class="${chipCls}"${click}${tip}>${esc(t)}</span>`;
    }
    html += '</div>';
  }
  return html;
}

export function renderAbilityBonusPicker(bg) {
  const pools = [];
  if (bg) {
    for (const a of bg.ability) pools.push(a.from);
  } else {
    pools.push(['str', 'dex', 'con', 'int', 'wis', 'cha']);
    pools.push(['str', 'dex', 'con', 'int', 'wis', 'cha']);
  }
  const p2 = globals.state.bgMode === 'custom' ? globals.state.custom.p2 : globals.state.bgPlus2;
  const p1 = globals.state.bgMode === 'custom' ? globals.state.custom.p1 : globals.state.bgPlus1;
  let html = `<div class="grid grid-2"><div class="card"><h4>+2 Bonus</h4><div class="choice-list">`;
  for (const a of pools[0]) {
    html += `<span class="chip ${p2 === a ? 'on' : ''}" onclick="API.pickBonus('p2', '${a}')">${abilName(a)}</span>`;
  }
  html += `</div></div><div class="card"><h4>+1 Bonus</h4><div class="choice-list">`;
  for (const a of pools[1]) {
    const taken = p2 === a;
    html += `<span class="chip ${p1 === a ? 'on' : ''} ${taken ? 'taken' : ''}" ${taken ? 'title="Already used for the +2 bonus"' : ''} onclick="API.pickBonus('p1', '${a}')">${abilName(a)}</span>`;
  }
  html += `</div></div></div>`;
  if (p2 && p2 === p1) html += `<div class="info" style="border-color:var(--warn)">The +2 and +1 bonuses must go to different ability scores.</div>`;
  return html;
}

export function featRefLabel(ref) {
  const f = resolveFeatRef(ref);
  if (!f) return ref;
  if (f.id.startsWith('mi-')) return magicInitiateVariants().find(v => v.id === f.id).label;
  return f.name;
}

export function featPicker(kind, current, count, hint, mode) {
  let html = `<div class="info">${esc(hint)}</div><div class="side-picker"><div class="pick-list">`;
  let descHTML = `<div class="pick-desc" id="feat-desc"></div>`;
  if (mode === 'locked' && kind === 'bgFeat') {
    const bg = globals.state.bg ? findBackground(globals.state.bg) : null;
    for (const ref of (bg ? bg.feats : [])) {
      const f = resolveFeatRef(ref);
      if (!f) continue;
      html += `<div class="feat-row locked selected">
        <span class="badge">${esc(featSource(ref))}</span>
        <h4>${esc(featName(ref))}</h4>
        <div class="sub">${esc(f.category === 'D' ? 'Dragonmark' : 'Origin feat')}</div>
      </div>`;
      descHTML = `<div class="pick-desc" id="feat-desc"><h4>${esc(featName(ref))}</h4><div class="entry">${featText(ref)}</div></div>`;
    }
  } else {
    for (const p of originFeatPool()) {
      const sel = current === p.id;
      if (sel) {
        descHTML = `<div class="pick-desc" id="feat-desc"><h4>${esc(p.label)}</h4><div class="entry">${featText(p.id)}</div></div>`;
      }
      html += `<div class="feat-row ${sel ? 'selected' : ''}" onclick="API.pickFeat('${kind}','${jsStr(p.id)}')" onmouseover="API.previewFeat('${jsStr(p.id)}')">
        <span class="badge">${esc(p.desc)}</span>
        <h4>${esc(p.label)}</h4>
      </div>`;
    }
  }
  html += '</div>' + descHTML + '</div>';
  return html;
}

export function renderSkilledPicker() {
  if (!globals.DATA) return '';
  if (!chosenFeats().some(f => f && f.id === 'skilled-xphb')) return '';
  const max = 3;
  const picks = globals.state.skilledPicks;
  const isOn = (kind, id) => picks.some(p => p && typeof p === 'object' && p.kind === kind && p.id === id);
  let html = `<h3>Skilled — Skill &amp; Tool Proficiencies (choose ${max})</h3><div class="counter">Selected ${picks.length} of ${max}</div>`;
  html += `<h4>Skills</h4><div class="choice-list">`;
  for (const s of globals.DATA.skills) {
    const on = isOn('skill', s.id);
    const tk = otherSkillSources(s.id, 'feat');
    const chipCls = ['chip', on ? 'on' : '', tk.length ? 'taken' : ''].join(' ');
    const click = tk.length ? '' : ` onclick="API.toggleSkilled('skill','${s.id}')"`;
    const tip = tk.length ? ` title="${esc('Already proficient: ' + tk.join(', '))}"` : '';
    html += `<span class="${chipCls}"${click}${tip}>${s.name}</span>`;
  }
  html += `</div><h4>Tools</h4><div class="choice-list">`;
  for (const t of globals.DATA.toolsList) {
    const on = isOn('tool', t);
    const tk = otherToolSources(t, 'feat');
    const chipCls = ['chip', on ? 'on' : '', tk.length ? 'taken' : ''].join(' ');
    const click = tk.length ? '' : ` onclick="API.toggleSkilled('tool','${jsStr(t)}')"`;
    const tip = tk.length ? ` title="${esc('Already proficient: ' + tk.join(', '))}"` : '';
    html += `<span class="${chipCls}"${click}${tip}>${esc(t)}</span>`;
  }
  html += '</div>';
  return html;
}
