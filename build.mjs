import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const output = join(root, 'dist', 'server');
const sources = ['index.html', 'assets.html', 'assets', 'variants', 'v2'];
const mime = {
  '.css':'text/css; charset=utf-8',
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.svg':'image/svg+xml; charset=utf-8',
};

async function collect(path, files = []){
  const entries = await readdir(path, { withFileTypes:true });
  for (const entry of entries){
    const full = join(path, entry.name);
    if (entry.isDirectory()) await collect(full, files);
    else files.push(full);
  }
  return files;
}

const files = [];
for (const source of sources){
  const path = join(root, source);
  if (source.includes('.')) files.push(path);
  else await collect(path, files);
}

const assets = {};
for (const file of files){
  const name = relative(root, file).split('\\').join('/');
  assets[name] = {
    body:(await readFile(file)).toString('base64'),
    type:mime[extname(file).toLowerCase()] || 'application/octet-stream',
  };
}

const worker = `const FILES=${JSON.stringify(assets)};
const decode=base64=>Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
export default {async fetch(request){
  const url=new URL(request.url);
  let path=decodeURIComponent(url.pathname).replace(/^\\/+/, '');
  if(!path||path.endsWith('/')) path+='index.html';
  const file=FILES[path];
  if(!file) return new Response('Not found',{status:404});
  const headers={
    'content-type':file.type,
    'cache-control':file.type.startsWith('text/html')?'no-cache':'public, max-age=3600',
    'x-content-type-options':'nosniff',
  };
  return new Response(decode(file.body),{headers});
}};\n`;

await rm(join(root, 'dist'), { recursive:true, force:true });
await mkdir(output, { recursive:true });
await writeFile(join(output, 'index.js'), worker);
console.log(`Built ${files.length} files into dist/server/index.js`);
