/** Offline test loader; application runtime uses the normal Next.js build. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
module.exports = function load(relative, env = {}, fetch = () => { throw Error('Offline test has no configured fetch'); }) {
  const cache = new Map();
  function read(name) {
    if (cache.has(name)) return cache.get(name).exports;
    const source = fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
    const mod = { exports: {} }; cache.set(name, mod);
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(js, { module: mod, exports: mod.exports,
      require: id => id.startsWith('@/') ? read(id.slice(2) + '.ts') : require(id),
      process: { env }, Request, Response, Headers, URL, AbortSignal, Buffer, fetch,
      crypto: webcrypto, TextEncoder, TextDecoder, ReadableStream, console,
    }, { filename: name });
    return mod.exports;
  }
  return read(relative);
};
