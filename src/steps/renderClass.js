import { globals } from '../modules/state.js';
import { esc, abilName, skillName } from '../modules/helpers.js';
import { charClass, takenChip, spellDC, spellAtk } from '../modules/compute.js';

export function renderClass() {
  const cls = charClass();
  let html = `<p class="step-sub">Choose your class and pick your class skill proficiencies.</p>
  <div class="grid grid-3">`;
  for (const c of globals.DATA.classes) {
    const sel = c.id === globals.state.cls;
    html += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickClass('${c.id}')">
      <h4>${esc(c.name)} <span class="badge">${c.source}</span></h4>
      <div class="sub">Hit Die d${c.hd.slice(1)} &middot; ${esc(c.primaryAbility)}</div>
      <div class="sub">Saves: ${c.savingThrows.map(abilName).join(' / ')}</div>
      <div class="desc">${esc(c.features.filter(f => f.level === 1).map(f => f.name).join(', '))}</div>
    </div>`;
  }
  html += '</div>';

  if (cls) {
    html += `<h3>${esc(cls.name)} Overview</h3>`;
    html += `<div class="card">
      <div><b>Hit Points:</b> d${cls.hd.slice(1)} &nbsp; <b>Primary Ability:</b> ${esc(cls.primaryAbility)} &nbsp; <b>Saving Throws:</b> ${cls.savingThrows.map(abilName).join(', ')}</div>
      <div><b>Armor:</b> ${esc(cls.armor || '—')} &nbsp; <b>Weapons:</b> ${esc(cls.weapons || '—')}</div>
      ${cls.tools ? `<div><b>Tools:</b> ${esc(cls.tools)}</div>` : ''}
      ${cls.spellcasting.ability ? `<div><b>Spellcasting:</b> ${abilName(cls.spellcasting.ability)} &middot; DC ${spellDC() ?? '—'} &middot; Attack +${spellAtk() ?? '—'}</div>` : ''}
      <div><b>Starting Equipment:</b> <button class="btn" onclick="API.toggleEqPreview()">Show</button></div>
      <div id="eq-preview" style="display:none" class="eq-list">
        ${cls.equipment[0] ? Object.entries(cls.equipment[0]).map(([k, v]) => `<div class="eq-item"><b>${k}:</b> ${v.map(it => it.value !== undefined ? (it.value / 100) + ' gp' : it.name + (it.quantity > 1 ? ' ×' + it.quantity : '')).join(', ')}</div>`).join('') : ''}
      </div>
    </div>`;

    html += `<h3>Skill Proficiencies (choose from class)</h3>`;
    for (const sc of cls.skillChoices) {
      const opts = sc.any ? globals.DATA.skills.map(s => s.id) : sc.from;
      html += `<div class="choice-list">`;
      for (const s of opts) {
        const on = globals.state.classSkills.includes(s);
        const tk = takenChip(s, 'class');
        const chipCls = ['chip', on ? 'on' : '', tk.taken ? 'taken' : ''].join(' ');
        const click = tk.taken ? '' : ` onclick="API.toggleClassSkill('${s}')"`;
        const tip = tk.taken ? ` title="${esc(tk.tip)}"` : '';
        html += `<span class="${chipCls}"${click}${tip}>${skillName(s)}</span>`;
      }
      html += `</div>`;
    }
    const need = cls.skillChoices.reduce((n, c) => n + c.count, 0);
    html += `<div class="counter">Selected ${globals.state.classSkills.length} of ${need}</div>`;

    if (cls.subclasses.length) {
      html += `<h3>${cls.subclassTitle || 'Subclass'} (gained at level 3)</h3><div class="grid grid-3">`;
      for (const s of cls.subclasses) {
        const sel = s.id === globals.state.subclass;
        html += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickSubclass('${s.id}')">
          <h4>${esc(s.name)}</h4>
          ${s.features ? `<div class="desc">${s.features.filter(f => f.level <= 3).map(f => f.name).join(', ')}</div>` : ''}
        </div>`;
      }
      html += '</div>';
    }

    html += `<h3>Class Features</h3><div class="card">`;
    for (const f of cls.features) {
      if (f.level > globals.state.level) break;
      html += `<details ${f.level <= 3 ? 'open' : ''}><summary>${esc(f.name)} <span class="sub">(level ${f.level})</span></summary><div class="entry">${f.text}</div></details>`;
    }
    html += '</div>';
  }
  return html;
}
