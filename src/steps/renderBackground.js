import { globals } from '../modules/state.js';
import { esc, jsStr, skillName } from '../modules/helpers.js';
import { findBackground } from '../modules/data.js';
import { chosenFeats, otherSkillSources, otherToolSources } from '../modules/compute.js';
import { renderAbilityBonusPicker, renderToolChoiceHtml, featPicker, featRefLabel, renderSkilledPicker } from '../modules/sharedComponents.js';

export function renderBackground() {
  let html = `<p class="step-sub">Choose a published background, or build a custom one (free +2/+1, origin feat, 2 skills, 1 tool).</p>`;

  html += `<div class="choice-list" style="margin-bottom:14px">
    <span class="chip ${globals.state.bgMode === 'bg' ? 'on' : ''}" onclick="API.setBgMode('bg')">Published background</span>
    <span class="chip ${globals.state.bgMode === 'custom' ? 'on' : ''}" onclick="API.setBgMode('custom')">Custom background</span>
  </div>`;

  if (globals.state.bgMode === 'bg') {
    html += `<div class="grid grid-3">`;
    for (const bg of globals.DATA.backgrounds) {
      const sel = bg.id === globals.state.bg;
      html += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickBg('${bg.id}')">
        <h4>${esc(bg.name)} <span class="badge">${bg.source}</span></h4>
        <div class="sub">Feat: ${bg.feats.map(r => esc(featRefLabel(r))).join(', ')}</div>
        <div class="sub">Skills: ${bg.skills.map(skillName).join(', ')}</div>
        <div class="sub">Tools: ${bg.tools.map(esc).join(', ')}</div>
      </div>`;
    }
    html += '</div>';

    const bg = globals.state.bg ? findBackground(globals.state.bg) : null;
    if (bg) {
      html += `<div class="card"><div class="entry">${bg.feature}</div></div>`;
      html += renderAbilityBonusPicker(bg);
      html += `<h3>Background Feat</h3>${featPicker('bgFeat', globals.state.bgFeat, 1, 'This background grants the following feat.', 'locked')}`;
      html += renderSkilledPicker();
      if (globals.state.bgTool) html += `<div class="info"><b>Tool proficiency:</b> ${esc(globals.state.bgTool)}</div>`;
      html += renderToolChoiceHtml();
      html += `<h3>Background Equipment</h3><div class="grid grid-3">`;
      if (bg.equipment && bg.equipment[0]) {
        for (const k of ['A', 'B']) {
          const items = bg.equipment[0][k];
          if (!items) continue;
          const sel = globals.state.equipment.bg === k;
          html += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickBgEquip('${k}')">
            <h4>Layout ${k}</h4><div class="eq-list">${items.map(it => it.value !== undefined ? `<span class="eq-item">${(it.value / 100)} gp</span>` : `<span class="eq-item">${esc(it.name)}${it.quantity > 1 ? ' ×' + it.quantity : ''}</span>`).join('')}</div>
          </div>`;
        }
      }
      html += '</div>';
    }
  } else {
    html += `<h3>Ability Score Bonuses</h3>`;
    html += renderAbilityBonusPicker(null);
    html += `<h3>Origin Feat (choose one)</h3>`;
    html += featPicker('customFeat', globals.state.custom.feat, 1, 'Choose an origin feat from the 2024 Player\'s Handbook.');
    html += renderSkilledPicker();
    html += `<h3>Skill Proficiencies (choose 2)</h3><div class="choice-list">`;
    for (const s of globals.DATA.skills) {
      const on = globals.state.custom.skills.includes(s.id);
      const tk = otherSkillSources(s.id, 'bg');
      const chipCls = ['chip', on ? 'on' : '', tk.length ? 'taken' : ''].join(' ');
      const click = tk.length ? '' : ` onclick="API.toggleCustomSkill('${s.id}')"`;
      const tip = tk.length ? ` title="${esc('Already proficient: ' + tk.join(', '))}"` : '';
      html += `<span class="${chipCls}"${click}${tip}>${s.name}</span>`;
    }
    html += `</div><div class="counter">Selected ${globals.state.custom.skills.length} of 2</div>`;
    html += `<h3>Tool Proficiency (choose 1)</h3><div class="choice-list">`;
    for (const t of globals.DATA.toolsList) {
      const on = globals.state.custom.tool === t;
      const tk = otherToolSources(t, 'bg');
      const chipCls = ['chip', on ? 'on' : '', tk.length ? 'taken' : ''].join(' ');
      const click = tk.length ? '' : ` onclick="API.pickCustomTool('${jsStr(t)}')"`;
      const tip = tk.length ? ` title="${esc('Already proficient: ' + tk.join(', '))}"` : '';
      html += `<span class="${chipCls}"${click}${tip}>${esc(t)}</span>`;
    }
    html += '</div>';
  }
  return html;
}
