import { globals } from './state.js';
import { TOOL_GROUPS } from './constants.js';
import { esc, jsStr, abilName, skillTooltip, cap } from './helpers.js';
import { findBackground, findSpell } from './data.js';
import { chosenFeats, otherSkillSources, otherToolSources, resolveFeatBonusList, parseChoose, featSpellPool, featPicks } from './compute.js';
import { magicInitiateVariants, resolveFeatRef, originFeatPool, featText, featName, featSource } from './feats.js';

export function renderFeatSpellChoices(featRef, opts = {}) {
  const f = resolveFeatRef(featRef);
  if (!f) return '';
  const bonuses = resolveFeatBonusList(f);
  const choosers = bonuses.map((b, idx) => ({ b, idx })).filter(x => x.b.choose);
  if (!choosers.length) return '';
  const getPicks = opts.getPicks || ((fid, idx) => (featPicks(fid)[idx] || []));
  const toggleFn = opts.toggleFn || 'API.toggleFeatSpell';
  let html = '';
  for (const { b, idx } of choosers) {
    const q = parseChoose(b.choose);
    const pool = featSpellPool(b.choose);
    const count = b.count || 1;
    const picks = getPicks(f.id, idx);
    const isCantrip = q.levels.includes(0);
    const label = isCantrip ? 'cantrip' : `level-${q.levels.find(l => l !== 0) || 1} spell`;
    const from = q.class ? cap(q.class) + ' spell list' : q.school ? 'school ' + q.school.join('/') : 'ritual spells';
    html += `<h3>${esc(f.name || f.label)} — choose ${count} ${label}${count > 1 ? 's' : ''} <span class="sub">from ${esc(from)}</span></h3>`;
    html += `<div class="counter">Selected ${picks.length} of ${count}</div>`;
    html += `<div class="spell-grid">`;
    for (const name of pool) {
      const sp = findSpell(name);
      const on = picks.includes(name);
      const maxed = !on && picks.length >= count;
      const itemCls = ['spell-item', on ? 'on' : '', maxed ? 'maxed' : ''].join(' ');
      const click = maxed ? '' : `onclick="${toggleFn}('${jsStr(f.id)}',${idx},'${jsStr(name)}')"`;
      html += `<div class="${itemCls}" ${click} onmouseover="API.previewSpell('${jsStr(name)}')">
        <div>${esc(name)}</div><div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) : ''}</div></div>`;
    }
    html += '</div>';
  }
  html += `<div class="pick-desc" id="feat-spell-desc"></div>`;
  return html;
}

export function renderToolChoiceHtml() {
  const bg = globals.state.bg ? findBackground(globals.state.bg) : null;
  if (!bg) return '';
  const needsPick = (bg.tools || []).filter(t => /any/.test(t));
  if (!needsPick.length) return '';
  let html = '';
  for (const any of needsPick) {
    const opts = TOOL_GROUPS[any] || [];
    const label = any === 'anyArtisansTool' ? "Artisan's Tools" : any === 'anyGamingSet' ? 'Gaming Set' : 'Musical Instrument';
    const selected = globals.state.bgTool;
    const selectedInfo = opts.find(t => t === selected);
    html += `<h3>Tool Proficiency (choose one ${label})</h3>`;
    html += `<div class="side-picker"><div class="pick-list">`;
    for (const t of opts) {
      const on = globals.state.bgTool === t;
      const tk = otherToolSources(t, 'bg');
      const rowCls = ['feat-row', on ? 'selected' : '', tk.length ? 'locked' : ''].join(' ');
      const click = tk.length ? '' : ` onclick="API.pickBgTool('${jsStr(t)}')"`;
      html += `<div class="${rowCls}"${click}>${esc(t)}${tk.length ? ` <span class="sub" style="text-decoration:line-through">(${esc(tk.join(', '))})</span>` : ''}</div>`;
    }
    html += '</div>';
    html += `<div class="pick-desc">${selectedInfo ? `<h4>${esc(selectedInfo)}</h4><div class="entry">This tool proficiency is granted by your background. Choose wisely — it can be useful for ability checks and crafting.</div>` : '<div class="entry" style="color:var(--muted);font-style:italic">Select a tool to see details.</div>'}</div>`;
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

export function featPicker(kind, current, count, hint, mode, compact) {
  let html = `<div class="info">${esc(hint)}</div>${compact ? '' : '<div class="side-picker">'}<div class="pick-list">`;
  const descWrap = (inner) => compact
    ? `<div class="feat-desc-box" id="feat-desc">${inner}</div>`
    : `<div class="pick-desc" id="feat-desc">${inner}</div>`;
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
      descHTML = descWrap(`<h4>${esc(featName(ref))}</h4><div class="entry">${featText(ref)}</div>`);
    }
  } else {
    for (const p of originFeatPool()) {
      const sel = current === p.id;
      if (sel) {
        descHTML = descWrap(`<h4>${esc(p.label)}</h4><div class="entry">${featText(p.id)}</div>`);
      }
      html += `<div class="feat-row ${sel ? 'selected' : ''}" onclick="API.pickFeat('${kind}','${jsStr(p.id)}')" onmouseover="API.previewFeat('${jsStr(p.id)}')">
        <span class="badge">${esc(p.desc)}</span>
        <h4>${esc(p.label)}</h4>
      </div>`;
    }
  }
  html += '</div>' + descHTML + (compact ? '' : '</div>');
  return html;
}

export function splitLayout(listHTML, detailHTML) {
  return `<div class="picker-split"><div class="pick-list-col">${listHTML}</div><div class="pick-detail-col">${detailHTML}</div></div>`;
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
    const tipText = tk.length ? `${skillTooltip(s.id)} — Already proficient: ${tk.join(', ')}` : skillTooltip(s.id);
    const tip = ` data-tip="${esc(tipText)}"`;
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
