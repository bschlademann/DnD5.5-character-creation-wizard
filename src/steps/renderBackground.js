import { globals } from '../modules/state.js';
import { esc, jsStr, skillName, skillTooltip } from '../modules/helpers.js';
import { findBackground } from '../modules/data.js';
import { otherSkillSources, otherToolSources } from '../modules/compute.js';
import { renderAbilityBonusPicker, renderToolChoiceHtml, featPicker, featRefLabel, renderSkilledPicker, renderFeatSpellChoices, splitLayout } from '../modules/sharedComponents.js';

export function renderBackground() {
  let html = `<p class="step-sub">Choose a published background, or build a custom one (free +2/+1, origin feat, 2 skills, 1 tool).</p>`;

  html += `<div class="choice-list" style="margin-bottom:14px">
    <span class="chip ${globals.state.bgMode === 'bg' ? 'on' : ''}" onclick="API.setBgMode('bg')">Published background</span>
    <span class="chip ${globals.state.bgMode === 'custom' ? 'on' : ''}" onclick="API.setBgMode('custom')">Custom background</span>
  </div>`;

  if (globals.state.bgMode === 'bg') {
    let list = `<div class="pick-list-head">Backgrounds</div>`;
    for (const bg of globals.DATA.backgrounds.filter(b => b.source !== 'EFA')) {
      const sel = bg.id === globals.state.bg;
      list += `<div class="opt-row ${sel ? 'selected' : ''}" onclick="API.pickBg('${bg.id}')">
        <h4>${esc(bg.name)}</h4>
        <div class="sub">${bg.feats.map(r => esc(featRefLabel(r))).join(', ')} &middot; ${bg.skills.map(s => skillName(s)).join('/')}</div>
      </div>`;
    }

    let detail = '';
    const bg = globals.state.bg ? findBackground(globals.state.bg) : null;
    if (bg) {
      detail += `<h3>${esc(bg.name)}</h3>`;
      detail += `<div class="card"><div class="entry">${bg.feature}</div></div>`;
      const needBonus = bg.ability.length >= 2 && !(globals.state.bgPlus2 && globals.state.bgPlus1);
      detail += `<div ${needBonus ? 'data-need="1"' : ''}>${renderAbilityBonusPicker(bg)}</div>`;
      detail += `<h3>Background Feat</h3>${featPicker('bgFeat', globals.state.bgFeat, 1, 'This background grants the following feat.', 'locked', true)}`;
      if (bg && bg.feats) for (const ref of bg.feats) detail += renderFeatSpellChoices(ref);
      detail += renderSkilledPicker();
      if (globals.state.bgTool) detail += `<div class="info"><b>Tool proficiency:</b> ${esc(globals.state.bgTool)}</div>`;
      const toolNeedsPick = (bg.tools || []).filter(t => /any/.test(t)).length;
      if (toolNeedsPick) detail += `<div ${globals.state.bgTool ? '' : 'data-need="1"'} id="tool-choice-wrap">`;
      detail += renderToolChoiceHtml();
      if (toolNeedsPick) detail += `</div>`;
      detail += `<h3>Background Equipment</h3><div class="grid grid-3">`;
      if (bg.equipment && bg.equipment[0]) {
        for (const k of ['A', 'B']) {
          const items = bg.equipment[0][k];
          if (!items) continue;
          const sel = globals.state.equipment.bg === k;
          detail += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickBgEquip('${k}')">
            <h4>Layout ${k}</h4><div class="eq-list">${items.map(it => it.value !== undefined ? `<span class="eq-item">${(it.value / 100)} gp</span>` : `<span class="eq-item">${esc(it.name)}${it.quantity > 1 ? ' ×' + it.quantity : ''}</span>`).join('')}</div>
          </div>`;
        }
      }
      detail += '</div>';
    } else {
      detail = `<div class="card"><div class="sub" style="font-style:italic;color:var(--muted)">Select a background to see its details and choices.</div></div>`;
    }
    html += splitLayout(list, detail, !bg);
  } else {
    html += `<div ${globals.state.custom.p1 && globals.state.custom.p2 ? '' : 'data-need="1"'}><h3>Ability Score Bonuses</h3>`;
    html += renderAbilityBonusPicker(null);
    html += `</div>`;
    html += `<div ${globals.state.custom.feat ? '' : 'data-need="1"'}><h3>Origin Feat (choose one)</h3>`;
    html += featPicker('customFeat', globals.state.custom.feat, 1, 'Choose an origin feat from the 2024 Player\'s Handbook.');
    html += renderFeatSpellChoices(globals.state.custom.feat);
    html += renderSkilledPicker();
    html += `</div>`;
    html += `<div ${globals.state.custom.skills.length >= 2 ? '' : 'data-need="1"'}><h3>Skill Proficiencies (choose 2)</h3><div class="choice-list">`;
    for (const s of globals.DATA.skills) {
      const on = globals.state.custom.skills.includes(s.id);
      const tk = otherSkillSources(s.id, 'bg');
      const chipCls = ['chip', on ? 'on' : '', tk.length ? 'taken' : ''].join(' ');
      const click = tk.length ? '' : ` onclick="API.toggleCustomSkill('${s.id}')"`;
      const tip = tk.length ? ` data-tip="${esc('Already proficient: ' + tk.join(', '))}"` : ` data-tip="${esc(skillTooltip(s.id))}"`;
      html += `<span class="${chipCls}"${click}${tip}>${s.name}</span>`;
    }
    html += `</div><div class="counter">Selected ${globals.state.custom.skills.length} of 2</div></div>`;
    html += `<div ${globals.state.custom.tool ? '' : 'data-need="1"'}><h3>Tool Proficiency (choose 1)</h3><div class="choice-list">`;
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
