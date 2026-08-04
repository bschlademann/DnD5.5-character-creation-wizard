import { globals } from '../modules/state.js';
import { esc, skillName } from '../modules/helpers.js';
import { charRace, charLineage, takenChip, chosenFeats } from '../modules/compute.js';
import { featPicker, renderSkilledPicker } from '../modules/sharedComponents.js';

export function renderSpecies() {
  const race = charRace();
  const lineage = charLineage();
  let html = `<p class="step-sub">Choose your species. Some species have lineages with additional features.</p>
  <div class="grid grid-3">`;
  for (const r of globals.DATA.species) {
    const sel = r.id === globals.state.race;
    const lineages = r.lineages.length ? `${r.lineages.length} lineage${r.lineages.length > 1 ? 's' : ''}` : 'No lineages';
    html += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickRace('${r.id}')">
      <h4>${esc(r.name)}</h4>
      <div class="sub">${r.size} &middot; Speed ${r.speed} ft${r.darkvision ? ' &middot; Darkvision ' + r.darkvision + ' ft' : ''}</div>
      <div class="sub">${lineages}${r.skillChoice ? ' &middot; skill proficiency' : ''}</div>
      <div class="desc">${esc(r.features.join(', '))}</div>
    </div>`;
  }
  html += '</div>';

  if (race) {
    html += `<h3>${esc(race.name)} Features</h3>`;
    if (race.lineages && race.lineages.length) {
      html += `<p class="step-sub">Choose a lineage:</p><div class="grid grid-4">`;
      for (const l of race.lineages) {
        const sel = l.id === globals.state.lineage;
        html += `<div class="card opt ${sel ? 'selected' : ''}" onclick="API.pickLineage('${l.id}')">
          <h4>${esc(l.name)}</h4>
          <div class="sub">${l.speed} ft${l.darkvision ? ' &middot; DV ' + l.darkvision : ''}${l.resist ? ' &middot; ' + esc(l.resist) : ''}</div>
        </div>`;
      }
      html += '</div>';
      if (lineage) {
        html += `<div class="card"><div class="entry">${lineage.featuresHtml}</div></div>`;
        const sps = lineage.spells;
        if (sps && sps.length) {
          html += `<div class="info"><b>Lineage spells:</b> ${sps.map(s => `${s.name}${s.kind === 'cantrip' ? ' (cantrip)' : ''} at level ${s.charLevel}`).join('; ')}</div>`;
        }
      }
    }
    html += `<div class="card"><div class="entry">${race.featuresHtml}</div></div>`;
    if (race.spells && race.spells.length) {
      html += `<div class="info"><b>Species spells:</b> ${race.spells.map(s => `${s.name}${s.kind === 'cantrip' ? ' (cantrip)' : ''} at level ${s.charLevel}`).join('; ')}</div>`;
    }
    if (race.skillChoice) {
      const sc = race.skillChoice;
      html += `<h3>Skill Proficiency (choose ${sc.count})</h3><div class="choice-list">`;
      const opts = sc.any ? globals.DATA.skills.map(s => s.id) : sc.from;
      for (const s of opts) {
        const on = globals.state.raceSkill.includes(s);
        const tk = takenChip(s, 'race');
        const cls = ['chip', on ? 'on' : '', tk.taken ? 'taken' : ''].join(' ');
        const click = tk.taken ? '' : ` onclick="API.toggleRaceSkill('${s}')"`;
        const tip = tk.taken ? ` title="${esc(tk.tip)}"` : '';
        html += `<span class="${cls}"${click}${tip}>${skillName(s)}</span>`;
      }
      html += `</div><div class="counter">Selected ${globals.state.raceSkill.length} of ${sc.count}</div>`;
    }
    if (race.bonusFeats > 0) {
      html += `<h3>Bonus Origin Feat (Human)</h3>`;
      html += featPicker('humanFeat', globals.state.humanFeat, race.bonusFeats, 'Choose a bonus origin feat (Humans gain one).');
      html += renderSkilledPicker();
    }
  }
  return html;
}
