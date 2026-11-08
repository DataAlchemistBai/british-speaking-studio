import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const context = vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root, 'practice-pack.js'), 'utf8'), context);
const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(match => !/\bsrc\s*=/.test(match[1])).map(match => match[2]);
inline.forEach(source => new vm.Script(source));
new vm.Script(fs.readFileSync(path.join(root, 'practice-cache-sw.js'), 'utf8'));
const app = inline.find(source => source.includes('const sessions ='));
assert(app, 'Missing app script');
const dataEnd = app.indexOf('let activeChapter');
assert(dataEnd > 0, 'Missing end of lesson declarations');
vm.runInContext(app.slice(0, dataEnd) + '\nglobalThis.lessons={sessions,characters};', context);
const {sessions,characters} = context.lessons;
assert.equal(sessions.length, 36);
assert.equal(new Set(sessions.map(card => card.id)).size, sessions.length);
assert.equal(Object.keys(characters).length, 6);
const checkAsset = relative => { assert(!path.isAbsolute(relative) && !relative.includes('..')); assert(fs.statSync(path.join(root, relative)).isFile(), relative); };
for (const person of Object.values(characters)) checkAsset(person.photo);
for (const card of sessions) {
  assert(card.context?.en, `${card.id}: background`);
  checkAsset(card.audio); checkAsset(card.timings);
  const timing = JSON.parse(fs.readFileSync(path.join(root, card.timings), 'utf8'));
  assert.equal(timing.items.length, card.dialogue.length, `${card.id}: timing count`);
  assert.deepEqual(new Set(card.speakers), new Set(card.dialogue.map(turn => turn[0])));
  let previous = 0;
  card.dialogue.forEach(([speaker,en,zh],index) => {
    assert(characters[speaker] && en && zh, `${card.id}: turn ${index}`);
    const item = timing.items[index];
    assert(Number.isFinite(item.start) && item.end > item.start && item.start >= previous - .002, `${card.id}: time ${index}`);
    if (item.speaker) assert.equal(item.speaker, speaker);
    previous = item.end;
  });
  assert(Math.abs(previous - timing.duration) < .1, `${card.id}: duration`);
}

class Element {
  constructor() { this.className=''; this.children=[]; this.dataset={}; this.attributes={}; this.classList={toggle:(name,on)=>{const values=new Set(this.className.split(/\s+/).filter(Boolean)); on?values.add(name):values.delete(name); this.className=[...values].join(' ');}}; }
  set innerHTML(value) { this.html=value; this.children=[]; }
  get innerHTML() { return this.html; }
  append(child) { this.children.push(child); }
  setAttribute(key,value) { this.attributes[key]=value; }
}
const stage=new Element(), chips=new Element();
context.$=selector=>selector==='#speakerStage'?stage:chips;
context.document={createElement:()=>new Element(),querySelectorAll:()=>stage.children};
const render=app.match(/function renderSpeakers\(\)\{[\s\S]*?(?=\s*function renderChapterNav)/)?.[0];
const highlight=app.match(/function syncPortraits\(i\)\{[^\n]+/)?.[0];
assert(render && highlight);
vm.runInContext('let activeSession,dialogue;\n'+render+'\n'+highlight, context);
let groupCount=0;
for (const card of sessions.filter(item=>item.speakers.length===4)) {
  context.testCard=card; vm.runInContext('activeSession=testCard;dialogue=testCard.dialogue;renderSpeakers()', context);
  assert.equal(stage.children.length,4); assert.equal(chips.children.length,4); assert(stage.className.includes('group-stage'));
  card.dialogue.forEach((turn,index)=>{vm.runInContext(`syncPortraits(${index})`, context);const active=stage.children.filter(item=>item.className.split(' ').includes('active'));assert.equal(active.length,1);assert.equal(active[0].dataset.speaker,turn[0]);});
  groupCount++;
}
context.testCard=sessions[0]; vm.runInContext('activeSession=testCard;dialogue=testCard.dialogue;renderSpeakers()', context);
assert.equal(stage.children.length,2);assert(!stage.className.includes('group-stage'));assert(!chips.className.includes('group-speakers'));
assert(html.includes('min-height:214px') && html.includes('min-height:155px'));
assert(!fs.existsSync(path.join(root,'.openai')), 'Internal hosting config must not be published');
console.log(`PASS: ${sessions.length} cards, ${Object.keys(characters).length} characters, all referenced assets and timings; ${groupCount} four-person scenes and two-person layout restoration.`);
console.log('Scope: data, syntax and mocked DOM checks; not a browser visual test.');
