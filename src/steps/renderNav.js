import { globals } from '../modules/state.js';
import { STEPS, ABILITIES } from '../modules/constants.js';
import { $ } from '../modules/helpers.js';
import { findRace, findClass, findBackground } from '../modules/data.js';
import { charClass, chosenFeats, cantripCount, preparedCount } from '../modules/compute.js';
import { validateStep } from '../modules/validation.js';
import { renderAbilities } from './renderAbilities.js';
import { renderSpecies } from './renderSpecies.js';
import { renderClass } from './renderClass.js';
import { renderBackground } from './renderBackground.js';
import { renderEquipment } from './renderEquipment.js';
import { renderSpells } from './renderSpells.js';
import { renderDetails } from './renderDetails.js';
import { renderSummary } from './renderSummary.js';
import { SAVE } from '../modules/state.js';

export function stepDone(i) {
  const key = STEPS[i].key;
  if (key === 'abilities') return ABILITIES.every(a => globals.state.assign[a] !== null);
  if (key === 'species') {
    if (!globals.state.race) return false;
    const r = findRace(globals.state.race);
    if (r.lineages && r.lineages.length && !globals.state.lineage) return false;
    if (r.skillChoice) return globals.state.raceSkill.length >= r.skillChoice.count;
    if (chosenFeats().some(f => f && f.id === 'skilled-xphb') && globals.state.skilledPicks.length !== 3) return false;
    return true;
  }
  if (key === 'class') {
    if (!globals.state.cls) return false;
    const cls = findClass(globals.state.cls);
    const need = cls.skillChoices.reduce((n, c) => n + c.count, 0);
    return globals.state.classSkills.length >= need;
  }
  if (key === 'background') {
    if (globals.state.bgMode === 'custom') {
      return !!(globals.state.custom.p2 && globals.state.custom.p1 && globals.state.custom.feat && globals.state.custom.skills.length >= 2 && globals.state.custom.tool);
    }
    if (!globals.state.bg) return false;
    const bg = findBackground(globals.state.bg);
    if (bg.ability.length >= 2) return !!(globals.state.bgPlus2 && globals.state.bgPlus1);
    if ((bg.tools || []).some(t => /any/.test(t)) && !globals.state.bgTool) return false;
    if (chosenFeats().some(f => f && f.id === 'skilled-xphb') && globals.state.skilledPicks.length !== 3) return false;
    return true;
  }
  if (key === 'equipment') return !!globals.state.equipment.class;
  if (key === 'spells') {
    const cls = charClass();
    if (!cls || !cls.spellcasting.ability) return true;
    if (globals.state.spells.cantrips.length < cantripCount()) return false;
    if (globals.state.spells.prepared.length < preparedCount()) return false;
    return true;
  }
  return true;
}

export function canVisit(i) { return i <= globals.currentStep || stepDone(i - 1); }

export function renderNav() {
  const nav = $('steps');
  nav.innerHTML = STEPS.map((s, i) => {
    const done = stepDone(i);
    const active = i === globals.currentStep;
    const visit = canVisit(i);
    const cls = ['step-btn', active ? 'active' : '', done ? 'done' : '', visit ? '' : 'locked'].join(' ');
    return `<button class="${cls}" data-i="${i}" ${visit ? '' : 'disabled'}>${i + 1}. ${s.short}</button>`;
  }).join('');
  nav.querySelectorAll('.step-btn').forEach(b => b.onclick = () => goTo(parseInt(b.dataset.i)));
}

export function renderFooter() {
  const back = $('btn-back');
  const next = $('btn-next');
  const actions = $('step-actions');
  back.style.visibility = globals.currentStep === 0 ? 'hidden' : 'visible';
  back.onclick = () => goTo(globals.currentStep - 1);
  const key = STEPS[globals.currentStep].key;
  if (key === 'summary') {
    actions.innerHTML = `
      <button class="btn" onclick="API.saveJson()">Save as JSON</button>
      <button class="btn" onclick="API.loadJson()">Load JSON</button>
      <button class="btn" onclick="API.duplicate()">Duplicate</button>
      <button class="btn primary" onclick="API.print()">Print / Save PDF</button>`;
    next.style.visibility = 'hidden';
  } else {
    actions.innerHTML = '';
    next.style.visibility = 'visible';
    next.textContent = key === 'details' ? 'Show Character Sheet' : 'Continue';
    next.onclick = () => {
      if (!validateStep(globals.currentStep)) return;
      goTo(globals.currentStep + 1);
    };
  }
}

export function goTo(i) {
  if (i < 0 || i >= STEPS.length) return;
  globals.currentStep = i;
  render();
  window.scrollTo({ top: 0 });
}

export function render() {
  renderNav();
  renderFooter();
  const main = $('main');
  const key = STEPS[globals.currentStep].key;
  const fn = { abilities: renderAbilities, species: renderSpecies, class: renderClass, background: renderBackground, equipment: renderEquipment, spells: renderSpells, details: renderDetails, summary: renderSummary }[key];
  main.innerHTML = `<h2 class="step-title">Step ${globals.currentStep + 1}: ${STEPS[globals.currentStep].title}</h2>` + (fn ? fn() : '');
  const pv = $('preview');
  const pvc = $('preview-content');
  if (key === 'summary') {
    pv.classList.add('hidden');
  } else {
    pv.classList.remove('hidden');
    pvc.innerHTML = renderSummary();
  }
  SAVE(globals.state);
}
