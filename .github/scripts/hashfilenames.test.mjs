import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./hashfilenames.mjs', import.meta.url));

function fixture(t, files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-hash-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const filename = path.join(directory, name);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
  }
  return directory;
}

function hashed(name, content) {
  const extension = path.extname(name);
  const digest = createHash('sha256').update(content).digest('hex').slice(0, 16);
  return `${name.slice(0, -extension.length)}.${digest}${extension}`;
}

function run(directory) {
  execFileSync(process.execPath, [script, directory]);
}

test('同名のCSSをHTMLのディレクトリごとに解決し、lib内のスクリプトも更新する', (t) => {
  const files = {
    'css/main.css': 'body { color: blue; }',
    'qr/css/main.css': 'body { color: green; }',
    'qr/lib/qrcode.js': 'window.QRCode = {};',
    'index.html': '<link href="./css/main.css">',
    'qr/index.html': '<link href="./css/main.css"><script src="./lib/qrcode.js"></script>',
  };
  const directory = fixture(t, files);
  run(directory);
  assert.equal(
    fs.readFileSync(path.join(directory, 'index.html'), 'utf8'),
    `<link href="./${hashed('css/main.css', files['css/main.css'])}">`,
  );
  assert.equal(
    fs.readFileSync(path.join(directory, 'qr/index.html'), 'utf8'),
    `<link href="./${hashed('css/main.css', files['qr/css/main.css'])}">` +
      `<script src="./${hashed('lib/qrcode.js', files['qr/lib/qrcode.js'])}"></script>`,
  );
  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith('.html')) continue;
    assert.equal(fs.readFileSync(path.join(directory, hashed(name, content)), 'utf8'), content);
    assert.equal(fs.existsSync(path.join(directory, name)), false);
  }
});

test('親・ルート相対パスとクエリ・フラグメントを保持し、外部URLなどは変更しない', (t) => {
  const css = 'body {}';
  const unchanged = [
    '<link href="https://example.com/css/main.css">',
    '<link href="//example.com/css/main.css">',
    '<a href="#section">link</a>',
    '<a href="?page=1#section">link</a>',
    '<img src="data:image/png;base64,AAAA">',
    '<div data-src="/css/main.css" data-href="/css/main.css"></div>',
  ].join('\n');
  const directory = fixture(t, {
    'css/main.css': css,
    'qr/index.html':
      '<link href="../css/main.css?v=1#theme">\n' +
      "<link href='/css/main.css?v=2#theme'>\n" + unchanged,
  });
  run(directory);
  assert.equal(
    fs.readFileSync(path.join(directory, 'qr/index.html'), 'utf8'),
    `<link href="../${hashed('css/main.css', css)}?v=1#theme">\n` +
      `<link href='/${hashed('css/main.css', css)}?v=2#theme'>\n` + unchanged,
  );
});

test('再実行してもファイル名やHTMLを変更しない', (t) => {
  const directory = fixture(t, {
    'main.js': 'window.ready = true;',
    'index.html': '<script src="main.js"></script>',
  });
  run(directory);
  const names = fs.readdirSync(directory);
  const contents = names.map((name) => fs.readFileSync(path.join(directory, name)));
  run(directory);
  assert.deepEqual(fs.readdirSync(directory), names);
  assert.deepEqual(names.map((name) => fs.readFileSync(path.join(directory, name))), contents);
});
