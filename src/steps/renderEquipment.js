import { globals } from '../modules/state.js';
import { esc } from '../modules/helpers.js';
import { charClass, ac, money } from '../modules/compute.js';
import { findBackground } from '../modules/data.js';

export function renderEquipment() {
  const cls = charClass();
  if (!cls) return `<div class="info">Choose a class first.</div>`;
  let html = `<p class="step-sub">Pick the standard equipment layouts. Equipment value is included in your money.</p>`;
  html += `<h3>${esc(cls.name)} Starting Equipment</h3><div class="grid grid-3">`;
  if (cls.equipment && cls.equipment[0]) {
    for (const k of ['A', 'B', 'C']) {
      const items = cls.equipment[0][k];
      if (!items) continue;
      const sel = globals.state.equipment.class === k;
      html += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickClassEquip('${k}')">
        <h4>Layout ${k}</h4>
        <div class="eq-list">${items.map(it => it.value !== undefined ? `<span class="eq-item">${(it.value / 100)} gp</span>` : `<span class="eq-item">${esc(it.name)}${it.quantity > 1 ? ' ×' + it.quantity : ''}</span>`).join('')}</div>
      </div>`;
    }
  }
  html += '</div>';
  const bg = globals.state.bgMode === 'bg' && globals.state.bg ? findBackground(globals.state.bg) : null;
  if (bg && bg.equipment && bg.equipment[0]) {
    html += `<h3>${esc(bg.name)} Background Equipment</h3><div class="grid grid-3">`;
    for (const k of ['A', 'B']) {
      const items = bg.equipment[0][k];
      if (!items) continue;
      const sel = globals.state.equipment.bg === k;
      html += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickBgEquip('${k}')">
        <h4>Layout ${k}</h4>
        <div class="eq-list">${items.map(it => it.value !== undefined ? `<span class="eq-item">${(it.value / 100)} gp</span>` : `<span class="eq-item">${esc(it.name)}${it.quantity > 1 ? ' ×' + it.quantity : ''}</span>`).join('')}</div>
      </div>`;
    }
    html += '</div>';
  }
  const a = ac();
  html += `<div class="info"><b>AC:</b> ${a.total}${a.hasArmor ? '' : ' (unarmored)'} &nbsp; <b>Money:</b> ${money().gp} gp ${money().sp} sp ${money().c} cp</div>`;
  return html;
}
