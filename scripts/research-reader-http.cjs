/** Qualification-only loopback wrapper. Production uses the Next.js route. */
if (!process.argv.includes('--synthetic-qualification')) throw Error('Explicit synthetic qualification flag required');
const http = require('node:http');
const load = require('./load-typescript.cjs');
const { createResearchReader } = load('lib/virtual-lab-research-reader.ts');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', text => { input += text; if (input.length > 16384) process.exit(2); });
process.stdin.on('end', () => {
  const config = JSON.parse(input); input = '';
  const identities = new Map([['synthetic-session-a','synthetic-user-a'],['synthetic-session-b','synthetic-user-b']]);
  const read = createResearchReader(config, {
    authenticate: async request => { const id = identities.get(request.headers.get('authorization')?.slice(7)); return id ? { id } : null; },
    accountAccess: async () => true, fetch, allowLoopbackHTTP: true,
  });
  const server = http.createServer(async (incoming, outgoing) => {
    try {
      const request = new Request('http://127.0.0.1' + incoming.url, { method: incoming.method,
        headers: Object.fromEntries(Object.entries(incoming.headers).filter(([,value]) => typeof value === 'string')) });
      const response = await read(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch { outgoing.writeHead(503); outgoing.end(); }
  });
  server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({ port: server.address().port })));
  process.once('SIGTERM', () => server.close(() => process.exit(0)));
});
