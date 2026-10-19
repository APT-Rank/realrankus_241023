'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const runtimePath = path.resolve(__dirname, '../../js/runtime/firebase_runtime.js');
const runtimeSource = fs.readFileSync(runtimePath, 'utf8');

function bootRuntime(hostname) {
  const calls = [];
  const app = { functions: region => ({ useEmulator: (host, port) => calls.push(['functions', region, host, port]) }) };
  const firebase = {
    initializeApp: config => calls.push(['initializeApp', config]),
    auth: () => ({ useEmulator: (...args) => calls.push(['auth', ...args]) }),
    firestore: () => ({ useEmulator: (...args) => calls.push(['firestore', ...args]) }),
    app: () => app
  };
  const window = { location: { hostname } };
  vm.runInNewContext(runtimeSource, { window, firebase });
  return { runtime: window.playRuntime, calls };
}

test('localhost routes every Firebase SDK to demo-play emulators', () => {
  const { runtime, calls } = bootRuntime('localhost');
  assert.equal(runtime.isEmulatorMode, true);
  assert.equal(runtime.projectId, 'demo-play');
  assert.ok(calls.some(call => call[0] === 'auth' && call[1] === 'http://127.0.0.1:9099'));
  assert.ok(calls.some(call => call[0] === 'firestore' && call[1] === '127.0.0.1' && call[2] === 8080));
  assert.ok(calls.some(call => call[0] === 'functions' && call[2] === '127.0.0.1' && call[3] === 5001));
});

test('hosted pages keep using the production project without emulator endpoints', () => {
  const { runtime, calls } = bootRuntime('play.example.com');
  assert.equal(runtime.isEmulatorMode, false);
  assert.equal(runtime.projectId, 'aptrank-cc61b');
  assert.equal(calls.filter(call => call[0] !== 'initializeApp').length, 0);
});
