import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const child=spawn(process.execPath,['tools/serve.mjs'],{cwd:root,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let timer;
try {
  const base=await new Promise((resolve,reject)=>{
    timer=setTimeout(()=>reject(Error('Server readiness timed out')),10000);
    child.once('error',reject);child.once('exit',code=>reject(Error(`Server exited: ${code}`)));
    child.stdout.on('data',chunk=>{const match=chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
  });
  const page=await fetch(base+'/');assert.equal(page.status,200);assert((await page.text()).includes('British Speaking Studio'));
  const audio='audio/social_english_trial_02_130wpm.mp3';
  const ranged=await fetch(base+'/'+audio,{headers:{Range:'bytes=64-127'}});assert.equal(ranged.status,206);assert.equal(ranged.headers.get('content-length'),'64');
  assert.deepEqual(Buffer.from(await ranged.arrayBuffer()),fs.readFileSync(path.join(root,audio)).subarray(64,128));
  const suffix=await fetch(base+'/'+audio,{headers:{Range:'bytes=-16'}});assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,16);
  assert.equal((await fetch(base+'/'+audio,{method:'HEAD'})).status,200);
  assert.equal((await fetch(base+'/'+audio,{headers:{Range:'bytes=999999999-'}})).status,416);
  assert.equal((await fetch(base+'/.git/config')).status,403);
  assert.equal((await fetch(base+'/missing-file')).status,404);
  assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
  console.log('PASS HTTP: page, exact-byte audio seeking, suffix ranges, HEAD, invalid ranges, hidden-file blocking and unsupported methods.');
} finally { clearTimeout(timer);child.kill(); }
