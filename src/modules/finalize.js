import { globals } from './state.js';
import { ABILITIES, STEPS } from './constants.js';
import { findRace, findClass, findBackground, findFeat } from './data.js';
import { charClass, chosenFeats, cantripCount, preparedCount, isAsiLevel, arcanumReached, arcanumPicks } from './compute.js';
import { esc } from './helpers.js';

export function finalizeReport() {
  const s = globals.state;
  const issues = [];
  const warnings = [];
  const cls = charClass();
  const race = findRace(s.race);

  // abilities
  const vals = ABILITIES.map(a => s.assign[a]);
  if (vals.some(v => v === null)) issues.push({ step: 0, msg: 'All six ability scores must be assigned.' });
  else if (new Set(vals).size !== 6) issues.push({ step: 0, msg: 'Each standard-array value must be used once.' });

  // species
  if (!s.race) issues.push({ step: 1, msg: 'No species chosen.' });
  else {
    if (race.lineages && race.lineages.length && !s.lineage) issues.push({ step: 1, msg: `Choose a lineage for ${race.name}.` });
    if (race.skillChoice && s.raceSkill.length < race.skillChoice.count) issues.push({ step: 1, msg: 'Choose your species skill proficiency.' });
  }

  // class
  if (!s.cls) {
    issues.push({ step: 2, msg: 'No class chosen.' });
  } else {
    const need = cls.skillChoices.reduce((n, c) => n + c.count, 0);
    if (s.classSkills.length !== need) issues.push({ step: 2, msg: `Choose exactly ${need} class skill proficienc${need === 1 ? 'y' : 'ies'}.` });
    if (s.level >= 3 && !s.subclass) issues.push({ step: 2, msg: 'Choose a subclass (your class gains it at level 3).' });
    for (let lv = 2; lv <= s.level; lv++) {
      if (s.hpPerLevel[lv - 1] == null) issues.push({ step: 2, msg: `No hit points recorded for level ${lv} (level down and up to record them).` });
      if (isAsiLevel(lv) && !s.asiSelections[lv]) issues.push({ step: 2, msg: `No Ability Score Improvement or feat recorded for level ${lv}.` });
    }
    const seen = {};
    for (const lvl of Object.keys(s.asiSelections)) {
      const sel = s.asiSelections[lvl];
      if (!sel || sel.type !== 'feat' || !sel.id) continue;
      if (seen[sel.id]) {
        const f = findFeat(sel.id);
        if (f && !f.repeatable) issues.push({ step: 2, msg: `"${f.name}" is selected twice (levels ${seen[sel.id]} and ${lvl}).` });
      } else seen[sel.id] = lvl;
    }
  }

  // background
  if (s.bgMode === 'bg') {
    if (!s.bg) issues.push({ step: 3, msg: 'No background chosen.' });
    else {
      const bg = findBackground(s.bg);
      if (bg.ability.length >= 2 && !(s.bgPlus2 && s.bgPlus1)) issues.push({ step: 3, msg: 'Assign the +2/+1 ability score bonuses.' });
      if ((bg.tools || []).some(t => /any/.test(t)) && !s.bgTool) issues.push({ step: 3, msg: 'Choose your tool proficiency.' });
    }
  } else {
    if (!s.custom.p2 || !s.custom.p1) issues.push({ step: 3, msg: 'Assign the +2/+1 ability score bonuses.' });
    else if (s.custom.p2 === s.custom.p1) issues.push({ step: 3, msg: 'The +2 and +1 bonuses must go to different abilities.' });
    if (!s.custom.feat) issues.push({ step: 3, msg: 'Choose your origin feat.' });
    if (s.custom.skills.length !== 2) issues.push({ step: 3, msg: 'Choose exactly 2 skill proficiencies.' });
    if (!s.custom.tool) issues.push({ step: 3, msg: 'Choose a tool proficiency.' });
  }
  if (chosenFeats().some(f => f && f.id === 'skilled-xphb') && s.skilledPicks.length !== 3) issues.push({ step: 3, msg: 'Choose 3 proficiencies for the Skilled feat.' });

  // equipment
  if (!s.equipment.class) issues.push({ step: 4, msg: 'No equipment option chosen.' });

  // spells
  if (cls && cls.spellcasting.ability) {
    if (s.spells.cantrips.length !== cantripCount()) issues.push({ step: 5, msg: `Choose exactly ${cantripCount()} cantrips.` });
    if (s.spells.prepared.length !== preparedCount()) issues.push({ step: 5, msg: `Choose exactly ${preparedCount()} spell${preparedCount() === 1 ? '' : 's'} to prepare.` });
  }
  if (cls && cls.spellcasting.type === 'pact') {
    for (const L of arcanumReached()) {
      if (!arcanumPicks()[L]) issues.push({ step: 5, msg: `Choose your Mystic Arcanum spell (warlock level ${L}).` });
    }
  }

  // warnings (non-blocking)
  if (!s.details.name) warnings.push('Give your character a name (Details step).');
  if (!s.details.portrait) warnings.push('No portrait uploaded (optional).');
  if (!s.details.traits && !s.details.ideals && !s.details.bonds && !s.details.flaws) warnings.push('Traits, ideals, bonds, and flaws are empty (optional).');

  return { ok: issues.length === 0, issues, warnings };
}

export function renderFinalize() {
  const rep = finalizeReport();
  const finalized = !!globals.state.finalized;
  const stepName = i => STEPS[i] ? STEPS[i].short : 'Start';

  let body;
  if (!rep.ok) {
    body = `<div class="finalize-issues">
      <div class="finalize-count">${rep.issues.length} issue${rep.issues.length === 1 ? '' : 's'} to resolve before this character is ready.</div>
      ${rep.issues.map((it, i) => `<div class="finalize-issue">
        <span class="finalize-num">${i + 1}</span>
        <span>${esc(it.msg)}</span>
        <button class="btn ghost" onclick="API.gotoStep(${it.step})">Fix &rarr; ${esc(stepName(it.step))}</button>
      </div>`).join('')}
    </div>`;
  } else if (!finalized) {
    body = `<div class="finalize-ok">
      <div class="finalize-check">&#10003;</div>
      <div>
        <b>All requirements are met.</b>
        <p>Your character is ready to be finalized. You can still go back to any step to make changes afterward.</p>
      </div>
    </div>
    <div class="finalize-actions">
      <button class="btn primary" onclick="API.finalize()">Finalize Character</button>
      <button class="btn" onclick="API.print()">Print / Save PDF</button>
    </div>`;
  } else {
    body = `<div class="finalize-ok">
      <div class="finalize-check">&#10003;</div>
      <div>
        <b>Character finalized.</b>
        <p>Any further changes you make will keep the character saved; use the button below to finalize again if you edit.</p>
      </div>
    </div>
    <div class="finalize-actions">
      <button class="btn primary" onclick="API.print()">Print / Save PDF</button>
    </div>`;
  }

  const warnHtml = rep.warnings.length
    ? `<div class="finalize-warnings">${rep.warnings.map(w => `<div>&#9888; ${esc(w)}</div>`).join('')}</div>`
    : '';

  return `<section class="finalize-panel ${rep.ok ? 'ok' : 'issues'}">
    <h2 class="finalize-title">${finalized ? 'Character Finalized' : 'Finalize Character'}</h2>
    ${body}
    ${warnHtml}
  </section>`;
}
