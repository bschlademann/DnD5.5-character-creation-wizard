import { globals } from '../modules/state.js';
import { esc, abilName, skillName, skillTooltip } from '../modules/helpers.js';
import { charClass, takenChip, spellDC, spellAtk } from '../modules/compute.js';
import { splitLayout } from '../modules/sharedComponents.js';

export function renderClass() {
  const cls = charClass();
  let list = `<div class="pick-list-head">Classes</div>`;
  for (const c of globals.DATA.classes) {
    const sel = c.id === globals.state.cls;
    list += `<div class="opt-row ${sel ? 'selected' : ''}" onclick="API.pickClass('${c.id}')">
      <h4>${esc(c.name)}</h4>
      <div class="sub">d${c.hd.slice(1)} &middot; ${esc(c.primaryAbility)}</div>
    </div>`;
  }

  let detail = '';
  if (cls) {
    detail += `<h3>${esc(cls.name)}</h3>`;
    detail += `<div class="card">
      <div><b>Hit Points:</b> d${cls.hd.slice(1)} &nbsp; <b>Primary Ability:</b> ${esc(cls.primaryAbility)} &nbsp; <b>Saving Throws:</b> ${cls.savingThrows.map(abilName).join(', ')}</div>
      <div><b>Armor:</b> ${esc(cls.armor || '—')} &nbsp; <b>Weapons:</b> ${esc(cls.weapons || '—')}</div>
      ${cls.tools ? `<div><b>Tools:</b> ${esc(cls.tools)}</div>` : ''}
      ${cls.spellcasting.ability ? `<div><b>Spellcasting:</b> ${abilName(cls.spellcasting.ability)} &middot; DC ${spellDC() ?? '—'} &middot; Attack +${spellAtk() ?? '—'}</div>` : ''}
      <div><b>Starting Equipment:</b> <button class="btn" onclick="API.toggleEqPreview()">Show</button></div>
      <div id="eq-preview" style="display:none" class="eq-list">
        ${cls.equipment[0] ? Object.entries(cls.equipment[0]).map(([k, v]) => `<div class="eq-item"><b>${k}:</b> ${v.map(it => it.value !== undefined ? (it.value / 100) + ' gp' : it.name + (it.quantity > 1 ? ' ×' + it.quantity : '')).join(', ')}</div>`).join('') : ''}
      </div>
    </div>`;

    detail += `<h3>Skill Proficiencies (choose from class)</h3>`;
    for (const sc of cls.skillChoices) {
      const opts = sc.any ? globals.DATA.skills.map(s => s.id) : sc.from;
      detail += `<div class="choice-list">`;
      for (const s of opts) {
        const on = globals.state.classSkills.includes(s);
        const tk = takenChip(s, 'class');
        const chipCls = ['chip', on ? 'on' : '', tk.taken ? 'taken' : ''].join(' ');
        const click = tk.taken ? '' : ` onclick="API.toggleClassSkill('${s}')"`;
        const tipText = tk.taken ? `${skillTooltip(s)} — ${tk.tip}` : skillTooltip(s);
        const tip = ` data-tip="${esc(tipText)}"`;
        detail += `<span class="${chipCls}"${click}${tip}>${skillName(s)}</span>`;
      }
      detail += `</div>`;
    }
    const need = cls.skillChoices.reduce((n, c) => n + c.count, 0);
    detail += `<div class="counter">Selected ${globals.state.classSkills.length} of ${need}</div>`;

    if (cls.subclasses.length) {
      detail += `<h3>${cls.subclassTitle || 'Subclass'} (gained at level 3)</h3>`;
      for (const s of cls.subclasses) {
        const sel = s.id === globals.state.subclass;
        detail += `<div class="opt-row ${sel ? 'selected' : ''}" onclick="API.pickSubclass('${s.id}')">
          <h4>${esc(s.name)}</h4>
          ${s.features ? `<div class="sub">${esc(s.features.filter(f => f.level <= 3).map(f => f.name).join(', '))}</div>` : ''}
        </div>`;
      }
    }

    detail += `<h3>Class Features</h3><div class="card">`;
    const subclass = cls.subclasses.find(s => s.id === globals.state.subclass);
    const clsFeats = (cls.features || []).filter(f => f.level <= globals.state.level);
    for (const f of clsFeats) {
      detail += `<details open><summary>${esc(f.name)} <span class="sub">(level ${f.level})</span></summary><div class="entry">${f.text}</div></details>`;
    }
    if (subclass && subclass.features) {
      for (const f of subclass.features) {
        if (f.level > globals.state.level) break;
        detail += `<details open><summary>${esc(f.name)} <span class="sub">(level ${f.level})</span></summary><div class="entry">${f.text}</div></details>`;
      }
    } else if (globals.state.level >= 3) {
      detail += `<div class="info">Choose a subclass above to see its features.</div>`;
    }
    detail += '</div>';
  } else {
    detail = `<div class="card"><div class="sub" style="font-style:italic;color:var(--muted)">Select a class to see its details and make your choices here.</div></div>`;
  }
  return `<p class="step-sub">Choose your class and pick your class skill proficiencies.</p>` + splitLayout(list, detail);
}
