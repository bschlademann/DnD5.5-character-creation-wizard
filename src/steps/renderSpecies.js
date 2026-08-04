import { globals } from '../modules/state.js';
import { esc, skillName, skillTooltip } from '../modules/helpers.js';
import { charRace, charLineage, takenChip } from '../modules/compute.js';
import { featPicker, renderSkilledPicker, renderFeatSpellChoices, splitLayout } from '../modules/sharedComponents.js';

export function renderSpecies() {
  const race = charRace();
  const lineage = charLineage();
  let list = `<div class="pick-list-head">Species</div>`;
  for (const r of globals.DATA.species) {
    const sel = r.id === globals.state.race;
    list += `<div class="opt-row ${sel ? 'selected' : ''}" onclick="API.pickRace('${r.id}')">
      <h4>${esc(r.name)}</h4>
      <div class="sub">${esc(r.size)} &middot; ${r.speed} ft${r.darkvision ? ' &middot; DV ' + r.darkvision : ''}${r.skillChoice ? ' &middot; skill' : ''}</div>
    </div>`;
  }

  let detail = '';
  if (race) {
    detail += `<h3>${esc(race.name)}</h3>`;
    detail += `<div class="card"><div class="entry">${race.featuresHtml}</div></div>`;
    if (race.spells && race.spells.length) {
      detail += `<div class="info"><b>Species spells:</b> ${race.spells.map(s => `${s.name}${s.kind === 'cantrip' ? ' (cantrip)' : ''} at level ${s.charLevel}`).join('; ')}</div>`;
    }
    if (race.lineages && race.lineages.length) {
      const lineagesOk = globals.state.lineage != null;
      detail += `<div ${lineagesOk ? '' : 'data-need="1"'}><h3>Lineage (choose one)</h3><div class="choice-list">`;
      for (const l of race.lineages) {
        const sel = l.id === globals.state.lineage;
        detail += `<span class="chip ${sel ? 'on' : ''}" onclick="API.pickLineage('${l.id}')" title="${esc(l.speed + ' ft' + (l.darkvision ? ' · Darkvision ' + l.darkvision + ' ft' : '') + (l.resist ? ' · ' + l.resist : ''))}">${esc(l.name)}</span>`;
      }
      detail += `</div></div>`;
      if (lineage) {
        detail += `<div class="card"><div class="entry">${lineage.featuresHtml}</div></div>`;
        const sps = lineage.spells;
        if (sps && sps.length) {
          detail += `<div class="info"><b>Lineage spells:</b> ${sps.map(s => `${s.name}${s.kind === 'cantrip' ? ' (cantrip)' : ''} at level ${s.charLevel}`).join('; ')}</div>`;
        }
      }
    }
    if (race.skillChoice) {
      const sc = race.skillChoice;
      const skillsOk = globals.state.raceSkill.length >= sc.count;
      detail += `<div ${skillsOk ? '' : 'data-need="1"'}><h3>Skill Proficiency (choose ${sc.count})</h3><div class="choice-list">`;
      const opts = sc.any ? globals.DATA.skills.map(s => s.id) : sc.from;
      for (const s of opts) {
        const on = globals.state.raceSkill.includes(s);
        const tk = takenChip(s, 'race');
        const cls = ['chip', on ? 'on' : '', tk.taken ? 'taken' : ''].join(' ');
        const click = tk.taken ? '' : ` onclick="API.toggleRaceSkill('${s}')"`;
        const tip = tk.taken ? ` data-tip="${esc(tk.tip)}"` : ` data-tip="${esc(skillTooltip(s))}"`;
        detail += `<span class="${cls}"${click}${tip}>${skillName(s)}</span>`;
      }
      detail += `</div><div class="counter">Selected ${globals.state.raceSkill.length} of ${sc.count}</div></div>`;
    }
    if (race.bonusFeats > 0) {
      const featOk = !!globals.state.humanFeat;
      detail += `<div ${featOk ? '' : 'data-need="1"'}><h3>Bonus Origin Feat (Human)</h3>`;
      detail += featPicker('humanFeat', globals.state.humanFeat, race.bonusFeats, 'Choose a bonus origin feat (Humans gain one).', '', true);
      detail += renderFeatSpellChoices(globals.state.humanFeat);
      detail += renderSkilledPicker();
      detail += `</div>`;
    }
  } else {
    detail = `<div class="card"><div class="sub" style="font-style:italic;color:var(--muted)">Select a species to see its features and make your choices here.</div></div>`;
  }
  return `<p class="step-sub">Choose your species. Some species have lineages with additional features.</p>` + splitLayout(list, detail, !race);
}
