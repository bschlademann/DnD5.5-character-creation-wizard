import { ABIL_NAME, SKILL_ABILITY_MAP, SKILL_DESC } from './constants.js';
import { globals } from './state.js';

export const $ = id => document.getElementById(id);
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const jsStr = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const skillName = id => (globals.DATA.skills.find(s => s.id === id) || {}).name || cap(id);
export const abilName = a => ABIL_NAME[a] || a;

export const profBonus = level => Math.floor((level - 1) / 4) + 2;
export const abilityMod = score => Math.floor((score - 10) / 2);
export const modStr = m => (m >= 0 ? '+' + m : '' + m);

export const skillAbility = skillId => SKILL_ABILITY_MAP[skillId] || 'wis';

export const skillTooltip = skillId => {
  const ability = SKILL_ABILITY_MAP[skillId] || 'wis';
  const abilityLabel = ABIL_NAME[ability] || ability;
  const desc = SKILL_DESC[skillId] || '';
  return `${skillId.charAt(0).toUpperCase() + skillId.slice(1)} — uses ${abilityLabel}.${desc ? ' ' + desc : ''}`;
};

export const ritualTip = 'Ritual: You can cast this spell using a ritual instead of a spell slot. The casting time increases by 10 minutes.';
export const alwaysPreparedTip = 'This spell is fixed — it is always known / always prepared because of the listed source. It cannot be changed.';
export const sourceBadge = (srcType, label) => `<span class="src-badge ${srcType}">${esc(label)}</span>`;

export function toggleIn(arr, val, max) {
  const i = arr.indexOf(val);
  if (i >= 0) arr.splice(i, 1);
  else {
    if (max && arr.length >= max) { alert(`Only ${max} can be selected.`); return; }
    arr.push(val);
  }
}

export function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
