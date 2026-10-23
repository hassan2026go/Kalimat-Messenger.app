import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('call setup supports deployment-provided ICE servers without hard-coded credentials', () => {
  assert.match(source, /Array\.isArray\(window\.KALIMAT_ICE_SERVERS\)/);
  assert.match(source, /stun:stun\.cloudflare\.com:3478/);
  assert.doesNotMatch(source, /turns?:[^'"]+:[^'"]+:[^'"]+/i);
});

test('call duration starts only after a peer connection is connected', () => {
  assert.match(source, /pc\.connectionState === 'connected'[\s\S]*?if \(!call\.t0\) callActive\(\)/);
  assert.match(source, /function callActive\(\) \{ if \(!CALL \|\| CALL\.t0\) return;/);
  assert.doesNotMatch(source, /async function acceptCall\(d\)[\s\S]*?\}\n\s*callActive\(\);/);
});

test('temporary disconnections get a bounded recovery window and cleanup clears the timer', () => {
  assert.match(source, /pc\.connectionState === 'disconnected'[\s\S]*?\}, 12000\)/);
  assert.match(source, /clearTimeout\(call\.disconnectTimer\)/);
  assert.match(source, /clearTimeout\(c\.disconnectTimer\)/);
});

test('ICE candidate errors are logged for connection troubleshooting', () => {
  assert.match(source, /pc\.onicecandidateerror = e => console\.warn\('Kalimat ICE candidate error'/);
});
