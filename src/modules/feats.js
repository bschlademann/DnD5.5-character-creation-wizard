import { globals } from './state.js';

export function magicInitiateVariants() {
  return [
    { id: 'mi-cleric', label: 'Magic Initiate (Cleric)', base: 'magicinitiate-xphb', list: 'cleric' },
    { id: 'mi-druid', label: 'Magic Initiate (Druid)', base: 'magicinitiate-xphb', list: 'druid' },
    { id: 'mi-wizard', label: 'Magic Initiate (Wizard)', base: 'magicinitiate-xphb', list: 'wizard' }
  ];
}

export function originFeatPool() {
  const pool = [];
  for (const f of globals.DATA.feats) {
    if (f.source === 'XPHB' && f.category === 'O') {
      if (f.id === 'magicinitiate-xphb') continue;
      pool.push({ id: f.id, label: f.name, desc: 'Origin feat', feat: f });
    }
  }
  for (const v of magicInitiateVariants()) pool.push({ id: v.id, label: v.label, desc: 'Origin feat', variant: v });
  return pool;
}

export function resolveFeatRef(ref) {
  if (!ref) return null;
  const byId = globals.DATA.feats.find(f => f.id === ref);
  if (byId) return byId;
  const v = magicInitiateVariants().find(x => x.id === ref);
  if (v) return v;
  const m = ref.match(/^magic initiate;\s*(\w+)/i);
  if (m) return magicInitiateVariants().find(v => v.list === m[1].toLowerCase()) || null;
  const name = ref.split('|')[0].trim().toLowerCase();
  if (name === 'skilled') return globals.DATA.feats.find(f => f.id === 'skilled-xphb');
  const byName = globals.DATA.feats.find(f => f.name.toLowerCase() === name && (f.source === 'XPHB' || f.source === 'EFA'));
  if (byName) return byName;
  return globals.DATA.feats.find(f => f.name.toLowerCase() === name) || null;
}

export function featText(ref) {
  const f = resolveFeatRef(ref);
  if (!f) return '';
  if (f.text) return f.text;
  if (f.base) {
    const b = globals.DATA.feats.find(x => x.id === f.base);
    if (b) return b.text;
  }
  return '';
}

export function featName(ref) {
  const f = resolveFeatRef(ref);
  if (!f) return ref || '';
  return f.name || f.label || f.id;
}

export function featSource(ref) {
  const f = resolveFeatRef(ref);
  if (!f) return '';
  if (f.source) return f.source;
  if (f.base) {
    const b = globals.DATA.feats.find(x => x.id === f.base);
    if (b) return b.source;
  }
  return '';
}
