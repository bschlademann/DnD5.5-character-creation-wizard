import { globals } from '../modules/state.js';
import { esc, jsStr, abilName, sourceBadge, ritualTip, alwaysPreparedTip } from '../modules/helpers.js';
import { findSpell } from '../modules/data.js';
import { charClass, maxSpellLevel, cantripCount, preparedCount, spellDC, spellAtk, classSpellsKnownFromSources, spellSystemLabel, arcanumLevels, arcanumSpellLv, arcanumReached, arcanumPicks } from '../modules/compute.js';

const srcLabel = s => s.srcType === 'species' ? 'Species' : s.srcType === 'feat' ? 'Feat' : 'Class';

export function renderSpells() {
  const cls = charClass();
  if (!cls || !cls.spellcasting.ability) {
    return `<div class="info">${cls ? esc(cls.name) : 'This'} class does not have class spellcasting at level 1.</div>`;
  }
  const list = cls.spellList;
  const maxLv = maxSpellLevel();
  const sources = classSpellsKnownFromSources();
  const fixedCantrips = sources.cantrips.map(s => s.name);
  const fixedSpells = sources.spells.map(s => s.name);
  const sourceTip = s => (s.always ? 'Always known / always prepared' : 'Adds this spell to the class list') + ' — from: ' + s.source;
  let html = `<p class="step-sub">Spellcasting ability: <b>${abilName(cls.spellcasting.ability)}</b>. Spell save DC ${spellDC()}, spell attack +${spellAtk()}.</p>`;

  if (fixedCantrips.length || fixedSpells.length) {
    html += `<h3>Spells From Species, Class & Feats</h3><div class="eq-list">`;
    for (const s of sources.cantrips) html += `<span class="eq-item" data-tip="${esc(sourceTip(s))}">${esc(s.name)} ${s.always ? '<span class="always">always</span>' : ''}${sourceBadge(s.srcType, srcLabel(s))}</span>`;
    for (const s of sources.spells) html += `<span class="eq-item" data-tip="${esc(sourceTip(s))}">${esc(s.name)} ${s.always ? '<span class="always">always</span>' : ''}${sourceBadge(s.srcType, srcLabel(s))}</span>`;
    html += '</div>';
  }

  const spellsOk = globals.state.spells.cantrips.length === cantripCount()
    && globals.state.spells.prepared.length === preparedCount()
    && (cls.spellcasting.type !== 'pact' || arcanumReached().every(L => arcanumPicks()[L]));
  html += `<div class="side-picker"><div class="pick-list" ${spellsOk ? '' : 'data-need="1"'}>`;

  html += `<h3>Cantrips (choose ${cantripCount()})</h3>`;
  html += `<div class="counter"><b>${globals.state.spells.cantrips.length}</b> / ${cantripCount()} selected</div>`;
  html += `<div class="spell-grid">`;
  const catCan = list[0] || [];
  for (const name of catCan) {
    const sp = findSpell(name);
    const on = globals.state.spells.cantrips.includes(name);
    const fixed = sources.cantrips.find(s => s.name === name);
    const isFixed = !!fixed;
    const canMaxed = !on && globals.state.spells.cantrips.length >= cantripCount();
    const itemCls = ['spell-item', on ? 'on' : '', isFixed ? 'always-prepared' : '', canMaxed && !isFixed ? 'maxed' : ''].join(' ');
    const click = (isFixed || canMaxed) ? '' : `onclick="API.toggleCantrip('${jsStr(name)}')"`;
    const hover = `onmouseover="API.previewSpell('${jsStr(name)}')"`;
    const tip = isFixed ? `${esc(alwaysPreparedTip)} Source: ${esc(fixed.source)}` : '';
    html += `<div class="${itemCls}" ${click} ${hover} ${isFixed ? `data-tip="${tip}"` : ''}>
      <div>${esc(name)}${isFixed ? sourceBadge(fixed.srcType, srcLabel(fixed)) : ''}</div><div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) : ''}</div></div>`;
  }
  html += `</div>`;

  html += `<h3>${esc(spellSystemLabel())} (choose ${preparedCount()})</h3>`;
  html += `<div class="counter"><b>${globals.state.spells.prepared.length}</b> / ${preparedCount()} selected &middot; up to level ${maxLv}</div>`;
  for (let lv = 1; lv <= maxLv; lv++) {
    const arr = list[lv] || [];
    if (!arr.length) continue;
    html += `<h4 style="margin:10px 0 4px">Level ${lv}${lv === 1 ? 'st' : lv === 2 ? 'nd' : lv === 3 ? 'rd' : 'th'}</h4><div class="spell-grid">`;
    for (const name of arr) {
      const sp = findSpell(name);
      const on = globals.state.spells.prepared.includes(name);
      const fixed = sources.spells.find(s => s.name === name && s.always);
      const isFixed = !!fixed;
      const preMaxed = !on && globals.state.spells.prepared.length >= preparedCount();
      const itemCls = ['spell-item', on ? 'on' : '', isFixed ? 'always-prepared' : '', preMaxed && !isFixed ? 'maxed' : ''].join(' ');
      const click = (isFixed || preMaxed) ? '' : `onclick="API.togglePrepared('${jsStr(name)}')"`;
      const hover = `onmouseover="API.previewSpell('${jsStr(name)}')"`;
      const tip = isFixed ? `${esc(alwaysPreparedTip)} Source: ${esc(fixed.source)}` : (sp && sp.ritual ? esc(ritualTip) : '');
      html += `<div class="${itemCls}" ${click} ${hover} ${tip ? `data-tip="${tip}"` : ''}>
        <div>${esc(name)}${sp && sp.ritual ? ' <span class="badge">[Ritual]</span>' : ''}${isFixed ? sourceBadge(fixed.srcType, srcLabel(fixed)) : ''}</div>
        <div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) + ' · ' + esc(sp.components) : ''}</div></div>`;
    }
    html += '</div>';
  }

  if (cls.spellcasting.type === 'pact' && arcanumReached().length) {
    const picks = arcanumPicks();
    html += `<h3>Mystic Arcanum</h3>`;
    html += `<div class="info">You can cast each Mystic Arcanum spell once per Long Rest without expending a spell slot. Choose one spell for each level shown.</div>`;
    for (const L of arcanumReached()) {
      const spl = arcanumSpellLv(L);
      const cur = picks[L] || null;
      html += `<h4 style="margin:12px 0 4px">Warlock Level ${L} — one level-${spl} spell</h4>`;
      html += `<div class="counter">${cur ? `Selected: <b>${esc(cur)}</b>` : 'No spell selected yet'}</div>`;
      html += `<div class="spell-grid">`;
      for (const name of list[spl] || []) {
        const sp = findSpell(name);
        const on = cur === name;
        html += `<div class="spell-item ${on ? 'on' : ''}" onclick="API.toggleArcanum(${L},'${jsStr(name)}')" onmouseover="API.previewSpell('${jsStr(name)}')">
          <div>${esc(name)}</div><div class="meta">${sp ? esc(sp.school) + ' · ' + esc(sp.time) : ''}</div></div>`;
      }
      html += `</div>`;
    }
  }

  html += `</div><div class="pick-desc" id="spell-desc"></div></div>`;
  return html;
}
