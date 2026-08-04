import { globals } from '../modules/state.js';
import { ABILITIES } from '../modules/constants.js';
import { esc, abilName, skillName, skillAbility, skillTooltip, abilityMod, modStr, profBonus, sourceBadge } from '../modules/helpers.js';
import { findClass, findBackground } from '../modules/data.js';
import { featName } from '../modules/feats.js';
import { charClass, charRace, charLineage, finalScores, grantedSkills, chosenFeats, hp, ac, money, equipmentItems, grantedTools, classSpellsKnownFromSources, spellDC, spellAtk, arcanumReached, arcanumSpellLv, arcanumPicks } from '../modules/compute.js';

export function renderSummary() {
  const cls = charClass();
  const subclass = cls && globals.state.subclass ? cls.subclasses.find(s => s.id === globals.state.subclass) : null;
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
          const extra = (globals.state.extraSkills || []).includes(s.id);
          const exp = !!globals.state.expertise[s.id];
          const bonus = abilityMod(scores[skillAbility(s.id)]) + (exp ? 2 * pb : base ? pb : 0);
          const marker = exp ? '✱' : (extra ? '+' : (base ? '✓' : '&nbsp;'));
          return `<div class="item skill-row" onclick="API.cycleSkill('${s.id}')" data-tip="${esc(skillTooltip(s.id))}${base ? ' — Proficient' : ''}${exp ? ' — Expertise' : ''}"><span class="chk ${base || exp ? 'on' : ''}" data-exp="${exp ? 1 : 0}"></span>${skillName(s.id)} <b>${modStr(bonus)}</b>${exp ? ' <span class="exp">expertise</span>' : ''} <span class="skill-marker">${marker}</span></div>`;
        }).join('')}
        <div class="item" style="font-size:11px;color:var(--muted)">Click a skill to cycle: none → proficient → expertise. ✓ class/race · + extra · ✱ expertise</div>
        <h4>Proficiencies</h4>
        <div class="item"><b>Armor:</b> ${esc(cls ? cls.armor : '—')}</div>
        <div class="item"><b>Weapons:</b> ${esc(cls ? cls.weapons : '—')}</div>
        <div class="item"><b>Tools:</b> ${grantedTools().map(esc).join(', ') || '—'}</div>
        ${globals.state.fightingStyle ? `<div class="item"><b>Fighting Style:</b> ${esc(featName(globals.state.fightingStyle))}</div>` : ''}
        ${globals.state.weaponMasteries && globals.state.weaponMasteries.length ? `<div class="item"><b>Weapon Mastery:</b> ${globals.state.weaponMasteries.map(esc).join(', ')}</div>` : ''}
      </div>
    </div>

    <h4>Background</h4>
    <div class="item">${globals.state.bgMode === 'bg' && globals.state.bg ? esc(findBackground(globals.state.bg).name) : 'Custom background'}</div>

    <h4>Feats</h4>
    ${feats.length ? feats.map(f => `<div class="item" title="${esc(f.source || 'Origin feat')}"><b>${esc(f.name || f.label)}</b> <span style="color:var(--muted);font-size:11px">(${esc(f.source || 'Origin feat')})</span></div>`).join('') : '<div class="item">—</div>'}

    <h4>Equipment</h4>
    <div class="eq-list">${equipmentItems().map(it => it.value !== undefined ? `<span class="eq-item">${it.value / 100} gp</span>` : `<span class="eq-item">${esc(it.name)}${it.quantity > 1 ? ' ×' + it.quantity : ''}</span>`).join('')}</div>

    <h4>Spells & Features</h4>
    <div class="sheet-cols">
      <div>
        ${(() => {
          const src = classSpellsKnownFromSources();
          const cm = {};
          for (const s of src.cantrips) cm[s.name] = s;
          const sm = {};
          for (const s of src.spells) sm[s.name] = s;
          const allCantrips = [...new Set([...src.cantrips.map(s => s.name), ...globals.state.spells.cantrips])];
          const allPrepared = [...new Set([...src.spells.filter(s => s.always).map(s => s.name), ...globals.state.spells.prepared])];
          const item = (n, meta) => {
            if (!meta) return `<span class="eq-item">${esc(n)}</span>`;
            const label = meta.srcType === 'species' ? 'Species' : meta.srcType === 'feat' ? 'Feat' : 'Class';
            const tip = (meta.always ? 'Always known / always prepared' : 'Available from the expanded list') + ' — from: ' + meta.source;
            return `<span class="eq-item" data-tip="${esc(tip)}">${esc(n)} ${meta.always ? '<span class="always">always</span>' : ''}${sourceBadge(meta.srcType, label)}</span>`;
          };
          let h = '';
          if (allCantrips.length) {
            h += '<h4>Cantrips</h4><div class="eq-list">';
            for (const n of allCantrips) h += item(n, cm[n]);
            h += '</div>';
          }
          if (allPrepared.length) {
            h += '<h4>Prepared & Known Spells</h4><div class="eq-list">';
            for (const n of allPrepared) h += item(n, sm[n]);
            h += '</div>';
          }
          const arc = arcanumPicks();
          const arcEntries = arcanumReached().filter(L => arc[L]);
          if (arcEntries.length) {
            h += '<h4>Mystic Arcanum</h4><div class="eq-list">';
            for (const L of arcEntries) h += `<span class="eq-item" data-tip="${esc('Warlock level ' + L + ' · level-' + arcanumSpellLv(L) + ' spell')}">${esc(arc[L])} <span style="opacity:.5;font-size:10px">(warlock ${L})</span></span>`;
            h += '</div>';
          }
          if (!allCantrips.length && !allPrepared.length && !arcEntries.length) h += '<div class="item">—</div>';
          return h;
        })()}
      </div>
      <div>
        <h4>Class Features (level ${globals.state.level})</h4>
        ${(() => {
          const parts = [];
          if (cls) {
            for (const f of (cls.features || [])) {
              if (f.level <= globals.state.level) parts.push(`<div class="item" data-tip="${esc('Level ' + f.level + ' · ' + cls.name)}">• <b>${esc(f.name)}</b> ${sourceBadge('class', 'Class')}</div>`);
            }
          }
          if (cls && subclass && subclass.features) {
            for (const f of subclass.features) {
              if (f.level <= globals.state.level) parts.push(`<div class="item" data-tip="${esc('Level ' + f.level + ' · ' + subclass.name)}">• <b>${esc(f.name)}</b> ${sourceBadge('subclass', subclass.name)}</div>`);
            }
          }
          return parts.length ? parts.join('') : '<div class="item">—</div>';
        })()}
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
