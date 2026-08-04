import { globals } from '../modules/state.js';
import { ABILITIES, STANDARD_ARRAY } from '../modules/constants.js';
import { esc, abilName, abilityMod, modStr } from '../modules/helpers.js';
import { finalScores, bgBonus } from '../modules/compute.js';
import { findBackground } from '../modules/data.js';

export function renderAbilities() {
  const scores = finalScores();
  const bgb = bgBonus();
  let html = `<p class="step-sub">Assign each value from the standard array (${STANDARD_ARRAY.join(', ')}) once. The background +2/+1 bonus is applied automatically later.</p>
  <div class="ab-grid">`;
  for (const a of ABILITIES) {
    const v = globals.state.assign[a];
    const mod = abilityMod(scores[a]);
    const bonus = bgb[a];
    html += `<div class="ab-card ${isDup(a) ? 'invalid' : ''}">
      <h4>${abilName(a)}</h4>
      <select id="ab-${a}" onchange="API.assign('${a}', this.value)">
        <option value="">—</option>
        ${STANDARD_ARRAY.map(vv => {
          const used = ABILITIES.some(x => x !== a && globals.state.assign[x] === vv);
          return `<option value="${vv}" ${v === vv ? 'selected' : ''} ${used ? 'disabled' : ''}>${vv}${used ? ' (used)' : ''}</option>`;
        }).join('')}
      </select>
      <div class="value">${v !== null ? scores[a] : '–'}</div>
      <div class="ab-mod">modifier ${modStr(mod)}${bonus ? ` <span style="color:var(--gold)">(+${bonus} bg)</span>` : ''}</div>
    </div>`;
  }
  html += '</div>';
  if (globals.state.bgMode === 'bg' && globals.state.bg) {
    const bg = findBackground(globals.state.bg);
    html += `<div class="info">Background <b>${esc(bg.name)}</b> grants +2 and +1: assign them below (background step).</div>`;
  }
  return html;
}

function isDup(a) {
  if (globals.state.assign[a] === null) return false;
  return ABILITIES.some(x => x !== a && globals.state.assign[x] === globals.state.assign[a]);
}
