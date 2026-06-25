// Migración mecánica: en cada archivo que importa `Text` de 'react-native',
// lo saca de ese import y agrega `import { AppText as Text } from '<rel>/AppText'`.
// Así todos los <Text> existentes pasan a usar AppText (escala + negrita global)
// sin tocar cada tag. Idempotente: si ya está aliasado, lo saltea.
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const APPTEXT_ABS = path.join(ROOT, 'app', 'components', 'shared', 'AppText');

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(full, acc);
    } else if (full.endsWith('.tsx')) {
      acc.push(full);
    }
  }
}

const files = [];
walk(path.join(ROOT, 'app'), files);
if (fs.existsSync(path.join(ROOT, 'App.tsx'))) files.push(path.join(ROOT, 'App.tsx'));

const importRe = /import\s+\{([\s\S]*?)\}\s+from\s+['"]react-native['"];?/;
const changed = [];

for (const file of files) {
  if (path.resolve(file) === APPTEXT_ABS + '.tsx') continue; // no aliasar el propio AppText
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('AppText as Text')) continue; // ya migrado

  const m = content.match(importRe);
  if (!m) continue;
  const specifiers = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  if (!specifiers.includes('Text')) continue;

  const remaining = specifiers.filter((s) => s !== 'Text');

  let rel = path.relative(path.dirname(file), APPTEXT_ABS).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;

  const rnImport = remaining.length ? `import { ${remaining.join(', ')} } from 'react-native';` : '';
  const appImport = `import { AppText as Text } from '${rel}';`;
  const replacement = rnImport ? `${rnImport}\n${appImport}` : appImport;

  content = content.replace(importRe, () => replacement);
  fs.writeFileSync(file, content, 'utf8');
  changed.push(path.relative(ROOT, file).replace(/\\/g, '/'));
}

console.log(`Archivos migrados: ${changed.length}`);
changed.forEach((f) => console.log('  ' + f));
