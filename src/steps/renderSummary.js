import { globals } from '../modules/state.js';
import { ABILITIES } from '../modules/constants.js';
import { esc, abilName, skillName, skillAbility, abilityMod, modStr, profBonus } from '../modules/helpers.js';
import { findClass, findBackground } from '../modules/data.js';
import { charClass, charRace, charLineage, finalScores, grantedSkills, chosenFeats, hp, ac, money, equipmentItems, grantedTools, slotSummaryTxt, classSpellsKnownFromSources, spellDC, spellAtk } from '../modules/compute.js';

export function renderSummary() {
  const cls = charClass();
  const race = charRace();
  const lin = charLineage();
  const scores = finalScores();
  const skills = grantedSkills();
  const feats = chosenFeats();
  const h = hp();
  const armor = ac();
  const mon = money();
  const pb = profBonus(globals.state.level);
  const d = globals.state.details;

  let html = `<div class="sheet-wrap" id="sheet">
    <div class="sheet-head">
      <h2>${esc(d.name || 'Unnamed Character')}</h2>
      <div class="meta">Level ${globals.state.level} ${cls ? esc(cls.name) : ''}${globals.state.subclass ? ' (' + esc((findClass(globals.state.cls).subclasses.find(s => s.id === globals.state.subclass) || {}).name || globals.state.subclass) + ')' : ''} ${race ? '· ' + esc(race.name) + (lin ? ' (' + esc(lin.name) + ')' : '') : ''}</div>
    </div>

    <div class="sheet-cols">
      <div>
        <h4>Ability Scores</h4>
        ${ABILITIES.map(a => `<div class="ab-block"><span>${abilName(a)}</span><span class="val">${scores[a]}</span><span class="mod">${modStr(abilityMod(scores[a]))}</span></div>`).join('')}
        <h4>Combat</h4>
        <div class="item"><b>HP:</b> ${h ?? '—'} &nbsp; <b>AC:</b> ${armor.total} &nbsp; <b>Initiative:</b> ${modStr(abilityMod(scores.dex))}</div>
        <div class="item"><b>Speed:</b> ${race ? race.speed : '—'} ft &nbsp; <b>Proficiency Bonus:</b> +${pb}</div>
        ${cls ? `<div class="item"><b>Hit Die:</b> ${cls.hd}${cls.spellcasting.ability ? ` &nbsp; <b>Spell DC:</b> ${spellDC()} &nbsp; <b>Spell Attack:</b> +${spellAtk()}` : ''}</div>` : ''}
        <div class="item"><b>Money:</b> ${mon.gp} gp, ${mon.sp} sp, ${mon.c} cp</div>
        <h4>Saving Throws</h4>
        ${ABILITIES.map(a => {
          const prof = cls && cls.savingThrows.includes(a);
          return `<div class="item">${prof ? '✓' : '&nbsp;'} ${abilName(a)} <b>${modStr(abilityMod(scores[a]) + (prof ? pb : 0))}</b></div>`;
        }).join('')}
      </div>
      <div>
        <h4>Skills</h4>
        ${globals.DATA.skills.map(s => {
          const base = skills.has(s.id);
          const exp = !!globals.state.expertise[s.id];
          const bonus = abilityMod(scores[skillAbility(s.id)]) + (exp ? 2 * pb : base ? pb : 0);
          const marker = exp ? '✱' : (base ? '✓' : '&nbsp;');
          return `<div class="item" style="cursor:pointer" onclick="API.cycleSkill('${s.id}')"><span class="chk ${base || exp ? 'on' : ''}" data-exp="${exp ? 1 : 0}"></span>${skillName(s.id)} <b>${modStr(bonus)}</b>${exp ? ' <span class="exp">expertise</span>' : ''} <span style="float:right;color:var(--muted);font-size:11px">${marker}</span></div>`;
        }).join('')}
        <h4>Proficiencies</h4>
        <div class="item"><b>Armor:</b> ${esc(cls ? cls.armor : '—')}</div>
        <div class="item"><b>Weapons:</b> ${esc(cls ? cls.weapons : '—')}</div>
        <div class="item"><b>Tools:</b> ${grantedTools().map(esc).join(', ') || '—'}</div>
      </div>
    </div>

    <h4>Background</h4>
    <div class="item">${globals.state.bgMode === 'bg' && globals.state.bg ? esc(findBackground(globals.state.bg).name) : 'Custom background'}</div>

    <h4>Feats</h4>
    ${feats.length ? feats.map(f => `<div class="item"><b>${esc(f.name || f.label)}</b></div>`).join('') : '<div class="item">—</div>'}

    <h4>Equipment</h4>
    <div class="eq-list">${equipmentItems().map(it => it.value !== undefined ? `<span class="eq-item">${it.value / 100} gp</span>` : `<span class="eq-item">${esc(it.name)}${it.quantity > 1 ? ' ×' + it.quantity : ''}</span>`).join('')}</div>

    <h4>Spells & Features</h4>
    <div class="sheet-cols">
      <div>
        <h4>Prepared Spells</h4>
        ${globals.state.spells.prepared.length ? `<div class="eq-list">${globals.state.spells.prepared.map(n => `<span class="eq-item">${esc(n)}</span>`).join('')}</div>` : '<div class="item">—</div>'}
        <h4>Cantrips</h4>
        ${globals.state.spells.cantrips.length ? `<div class="eq-list">${globals.state.spells.cantrips.map(n => `<span class="eq-item">${esc(n)}</span>`).join('')}</div>` : '<div class="item">—</div>'}
        <h4>Spell Slots</h4>
        ${(() => { const t = slotSummaryTxt(); return t ? `<div class="item">${esc(t)}</div>` : '<div class="item">—</div>'; })()}
        <h4>Other Known Spells</h4>
        ${(() => { const src = classSpellsKnownFromSources(); const all = [...src.spells.map(s => s.name), ...src.cantrips.map(s => s.name)]; return all.length ? `<div class="eq-list">${[...new Set(all)].map(n => `<span class="eq-item">${esc(n)}</span>`).join('')}</div>` : '<div class="item">—</div>'; })()}
      </div>
      <div>
        <h4>Class Features (level ${globals.state.level})</h4>
        ${cls ? cls.features.filter(f => f.level <= globals.state.level).map(f => `<div class="item">• <b>${esc(f.name)}</b></div>`).join('') : ''}
      </div>
    </div>

    <h4>Details</h4>
    <div class="item">${[d.age && 'Age: ' + esc(d.age), d.height && 'Height: ' + esc(d.height), d.weight && 'Weight: ' + esc(d.weight), d.eyes && 'Eyes: ' + esc(d.eyes), d.hair && 'Hair: ' + esc(d.hair), d.skin && 'Skin: ' + esc(d.skin), d.alignment && 'Alignment: ' + esc(d.alignment), d.deity && 'Deity: ' + esc(d.deity)].filter(Boolean).join(' · ') || '—'}</div>
    ${d.traits ? `<div class="item"><b>Traits:</b> ${esc(d.traits)}</div>` : ''}
    ${d.ideals ? `<div class="item"><b>Ideals:</b> ${esc(d.ideals)}</div>` : ''}
    ${d.bonds ? `<div class="item"><b>Bonds:</b> ${esc(d.bonds)}</div>` : ''}
    ${d.flaws ? `<div class="item"><b>Flaws:</b> ${esc(d.flaws)}</div>` : ''}
    ${d.backstory ? `<div class="item"><b>Backstory:</b> ${esc(d.backstory)}</div>` : ''}
    ${d.portrait ? `<div style="margin-top:8px"><img src="${d.portrait}" alt="portrait" style="max-width:160px;max-height:200px;border:1px solid #000"></div>` : ''}
  </div>`;
  return html;
}
