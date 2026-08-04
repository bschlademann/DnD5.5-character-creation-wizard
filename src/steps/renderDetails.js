import { globals } from '../modules/state.js';
import { esc } from '../modules/helpers.js';

export function renderDetails() {
  const d = globals.state.details;
  const html = `<div class="detail-grid">
    <div class="field"><label>Character Name</label><input type="text" id="det-name" value="${esc(d.name)}" oninput="API.detail('name', this.value)"></div>
    <div class="field"><label>Alignment (optional)</label><input type="text" id="det-align" value="${esc(d.alignment)}" oninput="API.detail('alignment', this.value)"></div>
    <div class="field"><label>Age</label><input type="text" value="${esc(d.age)}" oninput="API.detail('age', this.value)"></div>
    <div class="field"><label>Height</label><input type="text" value="${esc(d.height)}" oninput="API.detail('height', this.value)"></div>
    <div class="field"><label>Weight</label><input type="text" value="${esc(d.weight)}" oninput="API.detail('weight', this.value)"></div>
    <div class="field"><label>Deity / Faith (optional)</label><input type="text" value="${esc(d.deity)}" oninput="API.detail('deity', this.value)"></div>
    <div class="field"><label>Eyes</label><input type="text" value="${esc(d.eyes)}" oninput="API.detail('eyes', this.value)"></div>
    <div class="field"><label>Hair</label><input type="text" value="${esc(d.hair)}" oninput="API.detail('hair', this.value)"></div>
    <div class="field"><label>Skin</label><input type="text" value="${esc(d.skin)}" oninput="API.detail('skin', this.value)"></div>
    <div class="field"><label>Portrait (optional image)</label><input type="file" accept="image/*" onchange="API.portrait(this)"></div>
    <div class="field" style="grid-column:1/-1"><label>Personality Traits</label><textarea rows="2" oninput="API.detail('traits', this.value)">${esc(d.traits)}</textarea></div>
    <div class="field"><label>Ideals</label><textarea rows="2" oninput="API.detail('ideals', this.value)">${esc(d.ideals)}</textarea></div>
    <div class="field"><label>Bonds</label><textarea rows="2" oninput="API.detail('bonds', this.value)">${esc(d.bonds)}</textarea></div>
    <div class="field"><label>Flaws</label><textarea rows="2" oninput="API.detail('flaws', this.value)">${esc(d.flaws)}</textarea></div>
    <div class="field" style="grid-column:1/-1"><label>Backstory (optional)</label><textarea rows="4" oninput="API.detail('backstory', this.value)">${esc(d.backstory)}</textarea></div>
  </div>`;
  return html;
}
