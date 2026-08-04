import { globals } from '../modules/state.js';
import { esc, jsStr, abilName } from '../modules/helpers.js';
import { findSpell } from '../modules/data.js';
import { charClass, maxSpellLevel, cantripCount, preparedCount, spellDC, spellAtk, classSpellsKnownFromSources } from '../modules/compute.js';

export function renderSpells() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.ability) {
    return `<div class="info">${cls ? esc(cls.name) : 'This'} class does not have class spellcasting at level 1.</div>`;
  }
  const list = cls.spellList;
  const maxLv = maxSpellLevel();
  const sources = classSpellsKnownFromSources();
  const fixed = [...sources.cantrips, ...sources.spells];
  let html = `<p class="step-sub">Spellcasting ability: <b>${abilName(cls.spellcasting.ability)}</b>. Spell save DC ${spellDC()}, spell attack +${spellAtk()}. Slot table: ${cls.spellSlotsTxt}.</p>`;

  if (fixed.length) {
    html += `<h3>Spells From Species, Class & Feats (always prepared / known)</h3><div class="eq-list">`;
    for (const s of fixed) html += `<span class="eq-item">${esc(s.name)} <span style="opacity:.6">(${esc(s.source)}${s.always ? ' • always' : ''})</span></span>`;
    html += '</div>';
  }

  html += `<div class="side-picker"><div class="pick-list">`;

  html += `<h3>Cantrips (choose ${cantripCount()})</h3>`;
  html += `<div class="counter"><b>${globals.state.spells.cantrips.length}</b> / ${cantripCount()} selected</div>`;
  html += `<div class="spell-grid">`;
  const catCan = list[0] || [];
  for (const name of catCan) {
    const sp = findSpell(name);
    const on = globals.state.spells.cantrips.includes(name);
    html += `<div class="spell-item ${on ? 'on' : ''}" onclick="API.toggleCantrip('${jsStr(name)}')" onmouseover="API.previewSpell('${jsStr(name)}')">
      <div>${esc(name)}</div><div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) : ''}</div></div>`;
  }
  html += `</div>`;

  html += `<h3>Spells to Prepare (choose ${preparedCount()})</h3>`;
  html += `<div class="counter"><b>${globals.state.spells.prepared.length}</b> / ${preparedCount()} selected &middot; up to level ${maxLv}</div>`;
  for (let lv = 1; lv <= maxLv; lv++) {
    const arr = list[lv] || [];
    if (!arr.length) continue;
    html += `<h4 style="margin:10px 0 4px">Level ${lv}${lv === 1 ? 'st' : lv === 2 ? 'nd' : lv === 3 ? 'rd' : 'th'}</h4><div class="spell-grid">`;
    for (const name of arr) {
      const sp = findSpell(name);
      const on = globals.state.spells.prepared.includes(name);
      html += `<div class="spell-item ${on ? 'on' : ''}" onclick="API.togglePrepared('${jsStr(name)}')" onmouseover="API.previewSpell('${jsStr(name)}')">
        <div>${esc(name)}${sp && sp.ritual ? ' <span class="badge">R</span>' : ''}</div>
        <div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) + ' · ' + esc(sp.components) : ''}</div></div>`;
    }
    html += '</div>';
  }

  html += `</div><div class="pick-desc" id="spell-desc"></div></div>`;

  html += `<div class="info" style="margin-top:14px"><b>Always prepared (class):</b> ${cls.bonusSpells.length ? cls.bonusSpells.map(b => b.name).join(', ') : 'none'}</div>`;
  return html;
}
