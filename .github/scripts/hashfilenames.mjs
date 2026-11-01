import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const distDir = process.argv[2] || 'dist';
const extsToHash = new Set(['.js', '.mjs', '.css']); // 必要なら増やす

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function sha16(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

// すでに foo.<16hex>.js みたいな名前なら二重ハッシュしない
function alreadyHasHash(fileBase, ext) {
  const re = new RegExp(`\\.[0-9a-f]{16}\\${ext}$`, 'i');
  return re.test(fileBase + ext);
}

function processHtml(filePath, mapping) {
  let html = fs.readFileSync(filePath, 'utf8');

  // src/href の値だけを置換対象にする（雑に全文置換しない）
  html = html.replace(/(\s)(src|href)\s*=\s*(["'])([^"']+)\3/gi, (match, space, attr, quote, url) => {
    // 外部URL、データURL、ページ内リンクなどは書き換えない。
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|[?#])/i.test(url)) return match;

    // クエリとフラグメントは、両方あっても末尾まで保持する。
    const [, base, tail] = url.match(/^([^?#]*)(.*)$/);
    const targetPath = base.startsWith('/')
      ? path.resolve(distDir, '.' + base)
      : path.resolve(path.dirname(filePath), base);
    const newName = mapping.get(targetPath);
    if (!newName) return match;

    const replaced = base.slice(0, base.lastIndexOf('/') + 1) + newName;
    return `${space}${attr}=${quote}${replaced}${tail}${quote}`;
  });

  fs.writeFileSync(filePath, html, 'utf8');
}

function main() {
  const files = walk(distDir);

  // 1) 対象アセットをハッシュ名にリネームし、旧->新の対応表を作る
  // HTMLの所在に応じて解決できるよう、元ファイルの絶対パスをキーにする。
  const mapping = new Map();

  for (const abs of files) {
    const ext = path.extname(abs).toLowerCase();
    if (!extsToHash.has(ext)) continue;

    const dir = path.dirname(abs);
    const base = path.basename(abs, ext);

    if (alreadyHasHash(base, ext)) continue;

    const buf = fs.readFileSync(abs);
    const h = sha16(buf);

    const newName = `${base}.${h}${ext}`;
    const newAbs = path.join(dir, newName);

    fs.renameSync(abs, newAbs);

    mapping.set(path.resolve(abs), newName);
  }

  // 2) dist内の全HTMLの参照を書き換える
  for (const abs of walk(distDir)) {
    if (abs.toLowerCase().endsWith('.html')) {
      processHtml(abs, mapping);
    }
  }

  console.log(`hashed files: ${mapping.size} (html rewrite done)`);
}

main();
