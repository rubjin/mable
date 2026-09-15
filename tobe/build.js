import fs from 'fs';
import path from 'path';
import * as sass from 'sass';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const SRC_DIR = path.resolve(ROOT_DIR, 'src');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const WATCH_MODE = process.argv.includes('--watch');

// Custom alias importer for Sass (supports styles/, @/, assets/, src/)
const sassAliasImporter = {
  canonicalize(url) {
    let resolvedPath = null;
    if (url.startsWith('styles/')) {
      resolvedPath = path.resolve(ROOT_DIR, 'src/styles', url.replace(/^styles\//, ''));
    } else if (url.startsWith('@/')) {
      resolvedPath = path.resolve(ROOT_DIR, 'src', url.replace(/^@\//, ''));
    } else if (url.startsWith('assets/')) {
      resolvedPath = path.resolve(ROOT_DIR, 'src/assets', url.replace(/^assets\//, ''));
    } else if (url.startsWith('src/')) {
      resolvedPath = path.resolve(ROOT_DIR, url);
    }

    if (!resolvedPath) return null;

    const dir = path.dirname(resolvedPath);
    const base = path.basename(resolvedPath);
    const candidates = [
      resolvedPath,
      `${resolvedPath}.scss`,
      path.join(dir, `_${base}.scss`),
      path.join(resolvedPath, '_index.scss'),
      path.join(resolvedPath, 'index.scss')
    ];

    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        const fileUrlStr = `file:///${c.replace(/\\/g, '/')}`;
        return new URL(fileUrlStr);
      }
    }
    return null;
  },
  load(canonicalUrl) {
    let filePath = canonicalUrl.pathname;
    // On Windows, pathname starts with /C:/..., normalize it
    if (/^\/[a-zA-Z]:/.test(filePath)) {
      filePath = filePath.substring(1);
    }
    const decodedPath = decodeURIComponent(filePath);
    return {
      contents: fs.readFileSync(decodedPath, 'utf8'),
      syntax: decodedPath.endsWith('.sass') ? 'indented' : 'scss'
    };
  }
};

// Compile SCSS directly to dist/assets/css
function compileSass(srcFile, destFile) {
  const fullSrc = path.resolve(ROOT_DIR, srcFile);
  const fullDest = path.resolve(ROOT_DIR, destFile);
  if (!fs.existsSync(fullSrc)) return;
  try {
    const result = sass.compile(fullSrc, {
      importers: [sassAliasImporter],
      loadPaths: [
        path.dirname(fullSrc),
        path.resolve(ROOT_DIR, 'src/styles'),
        path.resolve(ROOT_DIR, 'src/styles/abstracts'),
        path.resolve(ROOT_DIR, 'src/assets'),
        path.resolve(ROOT_DIR, 'src'),
        ROOT_DIR
      ],
      style: 'expanded',
      sourceMap: false
    });

    let css = result.css;
    // dist 배포용 CSS는 독립적인 상대 경로(dist/assets/images, dist/assets/font)로 보정
    if (destFile.startsWith('dist/')) {
      css = css.replace(/\/src\/assets\/images/g, '../images');
      css = css.replace(/\/src\/assets\/font/g, '../font');
      css = css.replace(/\/assets\/images/g, '../images');
      css = css.replace(/\/assets\/font/g, '../font');
    }

    fs.mkdirSync(path.dirname(fullDest), { recursive: true });
    fs.writeFileSync(fullDest, css, 'utf8');
    console.log(`[Sass] Compiled: ${srcFile} -> ${destFile}`);
  } catch (err) {
    console.error(`[Sass Error] ${srcFile}:`, err.message);
  }
}

// Helper to copy directory recursively
function copyDirSync(srcDirPath, destDirPath) {
  if (!fs.existsSync(srcDirPath)) return;

  fs.mkdirSync(destDirPath, { recursive: true });
  const entries = fs.readdirSync(srcDirPath, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDirPath, entry.name);
    const destPath = path.join(destDirPath, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// HTML Include Resolver
function resolveIncludes(htmlContent, currentFilePath) {
  const includeRegex = /<!--[\s\S]*?-->|<include\s+src="([^"]+)"><\/include>/g;
  return htmlContent.replace(includeRegex, (match, src) => {
    if (match.startsWith('<!--')) return match;
    const includePath = path.resolve(ROOT_DIR, src.replace(/^\.\//, ''));
    if (fs.existsSync(includePath)) {
      const nestedContent = fs.readFileSync(includePath, 'utf8');
      return resolveIncludes(nestedContent, includePath);
    }
    console.warn(`[Include Warning] Not found: ${src} in ${currentFilePath}`);
    return match;
  });
}

// Process all HTML files in src (output directly under dist/)
function walkHtml(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') continue;
      results = results.concat(walkHtml(fullPath));
    } else if (item.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function runBuild({ clean = true } = {}) {
  const startedAt = Date.now();
  console.log('Starting HTML dist build...\n');

  // 1. Clean dist
  // watch 모드에서는 매번 지우지 않습니다 — OneDrive 가 방금 쓴 파일의 핸들을
  // 잠깐 붙들고 있어서 rmSync 가 간헐적으로 ENOTEMPTY 를 던집니다. 어차피
  // 파일은 매번 덮어써지므로, 최초 1회만 지우고 이후에는 덮어쓰기만 합니다.
  if (clean && fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 2. Copy static assets directly to dist/assets (css, font, images, js, lottie)
  ['css', 'font', 'images', 'js', 'lottie'].forEach(subDir => {
    copyDirSync(path.resolve(SRC_DIR, 'assets', subDir), path.resolve(DIST_DIR, 'assets', subDir));
  });

  // 3. Compile SCSS directly to src/assets/css & dist/assets/css
  compileSass('src/styles/globals.scss', 'src/assets/css/globals.css');
  compileSass('src/styles/globalsPub.scss', 'src/assets/css/globalsPub.css');
  compileSass('src/styles/globals.scss', 'dist/assets/css/globals.css');
  compileSass('src/styles/globalsPub.scss', 'dist/assets/css/globalsPub.css');

  // 4. Resolve includes / rewrite asset paths for every HTML file
  const allHtmlFiles = walkHtml(SRC_DIR);

  for (const htmlFile of allHtmlFiles) {
    const relativePath = path.relative(SRC_DIR, htmlFile);
    let content = fs.readFileSync(htmlFile, 'utf8');

    // 1) Resolve includes
    content = resolveIncludes(content, htmlFile);

    // 2) Replace .scss references with .css references for dist
    const depth = relativePath.split(path.sep).length - 1;
    const prefix = depth > 0 ? '../'.repeat(depth) : './';
    content = content.replace(/href="[^"]*?(?:styles\/)?(globalsPub|globals|main|common)\.scss"/g, (m, name) => {
      return name === 'globalsPub' ? `href="${prefix}assets/css/globalsPub.css"` : `href="${prefix}assets/css/globals.css"`;
    });
    content = content.replace(/src="[^"]*?(?:assets\/)?js\/ui\.js"/g, `src="${prefix}assets/js/ui.js"`);
    content = content.replace(/src="[^"]*?(?:assets\/)?js\/guide\.js"/g, `src="${prefix}assets/js/guide.js"`);
    content = content.replace(/src="[^"]*?(?:assets\/)?js\/prism\.min\.js"/g, `src="${prefix}assets/js/prism.min.js"`);

    const destPath = path.resolve(DIST_DIR, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`[HTML] Generated: ${relativePath}`);
  }

  // 5. Process admin worksheet data
  const srcDataDir = path.resolve(SRC_DIR, 'data');
  if (fs.existsSync(srcDataDir)) {
    copyDirSync(srcDataDir, path.resolve(DIST_DIR, 'data'));
    console.log('[Worksheet Data] Copied: dist/data');
  }

  const elapsed = Date.now() - startedAt;
  console.log('\n========================================');
  console.log(`Dist build completed successfully in ./dist (${elapsed}ms)`);
  console.log('========================================\n');
}

runBuild();

// --watch: src/ 아래 html/scss/js 가 바뀔 때마다 dist 를 다시 빌드합니다.
if (WATCH_MODE) {
  console.log(`[Watch] Watching ${path.relative(ROOT_DIR, SRC_DIR)} for changes... (Ctrl+C to stop)\n`);

  let rebuildTimer = null;
  let isBuilding = false;
  let pendingFilename = null;
  const runRebuild = (filename) => {
    if (isBuilding) {
      // 빌드 중 들어온 변경은 지금 빌드가 끝난 뒤 한 번 더 반영합니다.
      pendingFilename = filename;
      return;
    }
    isBuilding = true;
    console.log(`[Watch] Change detected: ${filename || '(unknown file)'}`);
    try {
      runBuild({ clean: false });
    } catch (err) {
      console.error('[Watch] Build failed:', err.message);
    } finally {
      isBuilding = false;
      if (pendingFilename !== null) {
        const next = pendingFilename;
        pendingFilename = null;
        runRebuild(next);
      }
    }
  };

  const scheduleRebuild = (_eventType, filename) => {
    if (filename && !/\.(html|scss|sass|js)$/i.test(filename)) return;
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => runRebuild(filename), 150);
  };

  fs.watch(SRC_DIR, { recursive: true }, scheduleRebuild);
}
