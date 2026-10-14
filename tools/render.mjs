// Draws the profile README images (assets/*.svg) from live GitHub data,
// in Monkeytype's 9009 colours. Run by .github/workflows/refresh.yml daily.
//
//   node tools/render.mjs        (set GITHUB_TOKEN to avoid API rate limits)
import { readFileSync, writeFileSync } from 'node:fs';

const LOGIN = 'badjuice';
const NAME = 'Nox Fortes';
const LOCATION = 'Nowhere to be found';
// Same text as the portfolio (badjuice.github.io, js/profile.js).
const BIO =
  'I build small tools for problems I keep running into: moving Epic Games installs between drives, ' +
  'bookmarking every open tab at once, turning web pages into PDFs. Lately also a card game you can play ' +
  'in the browser. Mostly C#, PowerShell, JavaScript, TypeScript and Python. I wanted to write something ' +
  'more meaningful here, but I think there is a character lim';
const PINNED = ['tximtxom', 'EpicLibraryToolExplode', 'TabsExplode', 'url2pdf'];

// 9009 theme (monkeytype frontend/src/ts/constants/themes.ts)
const C = { bg: '#eeebe2', main: '#080909', caret: '#7fa480', sub: '#99947f', subAlt: '#d3cfc1', error: '#c87e74' };
const LANG = { TypeScript: '#7fa480', JavaScript: '#c87e74', 'C#': '#080909', PowerShell: '#6f8fa6', Python: '#c9a85c' };

const root = new URL('..', import.meta.url);
const font = readFileSync(new URL('tools/roboto-mono.woff2', root)).toString('base64');
const FONT_CSS = `@font-face{font-family:'RM';src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400 700}
text{font-family:'RM',ui-monospace,'DejaVu Sans Mono',monospace}`;
/** Roboto Mono glyphs are 0.6em wide. */
const CHAR = 0.6;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const w of text.split(' ')) {
    if (line && (line + ' ' + w).length > maxChars) {
      lines.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines;
}

function svg(w, h, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${FONT_CSS}</style>
${body}
</svg>
`;
}

// ------------------------------------------------------------------ header

function header() {
  const W = 900;
  const size = 22;
  const cw = size * CHAR;
  const x0 = 40;
  const lines = wrap(BIO, Math.floor((W - 2 * x0) / cw));
  const top = 150;
  const lh = 36;
  const H = top + (lines.length - 1) * lh + 40;

  // Typing animation: each line is drawn grey, then a black copy is revealed
  // by a clip that grows at ~85 wpm. One loop types everything, pauses, restarts.
  const perChar = 0.12;
  let t = 0.8;
  const spans = lines.map((l) => {
    const start = t;
    t += l.length * perChar + 0.15;
    return { l, start, end: t - 0.15 };
  });
  const total = t + 5;
  const k = (s) => (s / total).toFixed(4);

  const clips = spans
    .map(({ l, start, end }, i) => {
      const w = (l.length * cw).toFixed(1);
      return `<clipPath id="c${i}"><rect x="${x0}" y="${top + i * lh - size}" height="${lh}" width="0">
<animate attributeName="width" dur="${total.toFixed(2)}s" repeatCount="indefinite" values="0;0;${w};${w}" keyTimes="0;${k(start)};${k(end)};1"/></rect></clipPath>`;
    })
    .join('\n');

  const text = spans
    .map(({ l }, i) => {
      const y = top + i * lh;
      return `<text x="${x0}" y="${y}" font-size="${size}" fill="${C.sub}" xml:space="preserve">${esc(l)}</text>
<text x="${x0}" y="${y}" font-size="${size}" fill="${C.main}" xml:space="preserve" clip-path="url(#c${i})">${esc(l)}</text>`;
    })
    .join('\n');

  // Caret: follows the clip edge line by line.
  const xs = [];
  const ys = [];
  const kt = [];
  spans.forEach(({ l, start, end }, i) => {
    xs.push(x0, x0 + l.length * cw);
    ys.push(top + i * lh - size + 4, top + i * lh - size + 4);
    kt.push(start / total, end / total);
  });
  const last = spans[spans.length - 1];
  xs.unshift(x0);
  ys.unshift(top - size + 4);
  kt.unshift(0);
  xs.push(x0 + last.l.length * cw);
  ys.push(ys[ys.length - 1]);
  kt.push(1);
  const ktS = kt.map((v) => v.toFixed(4)).join(';');
  const caret = `<rect width="3" height="${size + 4}" rx="1.5" fill="${C.caret}">
<animate attributeName="x" dur="${total.toFixed(2)}s" repeatCount="indefinite" values="${xs.map((v) => v.toFixed(1)).join(';')}" keyTimes="${ktS}"/>
<animate attributeName="y" dur="${total.toFixed(2)}s" repeatCount="indefinite" calcMode="discrete" values="${ys.join(';')}" keyTimes="${ktS}"/>
<animate attributeName="opacity" dur="1s" repeatCount="indefinite" values="1;1;0;0" keyTimes="0;0.5;0.5;1"/>
</rect>`;

  const keyboard = `<g transform="translate(${x0} 34)" fill="none" stroke="${C.main}" stroke-width="2.4">
<rect x="1" y="1" width="58" height="38" rx="6"/>
<g fill="${C.main}" stroke="none">${[0, 1, 2, 3, 4]
    .map((i) => `<rect x="${9 + i * 9}" y="9" width="6" height="6" rx="1.5"/><rect x="${9 + i * 9}" y="18" width="6" height="6" rx="1.5"/>`)
    .join('')}<rect x="18" y="28" width="24" height="5" rx="1.5"/></g></g>`;

  const body = `<rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
${keyboard}
<text x="${x0 + 74}" y="46" font-size="12" fill="${C.sub}">${esc(NAME.toLowerCase())}</text>
<text x="${x0 + 72}" y="76" font-size="38" fill="${C.main}" letter-spacing="-1.5">${LOGIN}</text>
<g font-size="14" text-anchor="end"><text x="${W - x0}" y="66" fill="${C.error}">about</text><text x="${W - x0 - 80}" y="66" fill="${C.caret}">play</text><text x="${W - x0 - 150}" y="66" fill="${C.sub}">projects</text></g>
<text x="${x0}" y="${top - 46}" font-size="13" fill="${C.sub}">watching</text>
<defs>${clips}</defs>
${text}
${caret}`;
  return svg(W, H, body, `${NAME} (${LOGIN}): ${BIO}`);
}

// ------------------------------------------------------------------ stats

function stats({ repos, stars, followers, years }) {
  const W = 900;
  const H = 130;
  const items = [
    ['repos', repos],
    ['stars', stars],
    ['followers', followers],
    ['years on github', years],
  ];
  let x = 40;
  const parts = items.map(([label, value]) => {
    const g = `<text x="${x}" y="44" font-size="16" fill="${C.sub}">${label}</text><text x="${x - 3}" y="104" font-size="64" fill="${C.main}">${value}</text>`;
    x += Math.max(label.length * 16 * CHAR, String(value).length * 64 * CHAR) + 46;
    return g;
  });
  parts.push(`<text x="${x}" y="70" font-size="16" fill="${C.sub}">location</text><text x="${x}" y="104" font-size="28" fill="${C.main}">${esc(LOCATION)}</text>`);
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>\n${parts.join('\n')}`,
    `${repos} public repos, ${stars} stars, ${followers} followers, ${years} years on GitHub. Location: ${LOCATION}.`,
  );
}

// ------------------------------------------------------------------ project cards

function ago(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function card(repo) {
  const W = 440;
  const H = 170;
  const pad = 22;
  const all = wrap(repo.description || 'no description yet', Math.floor((W - 2 * pad) / (13 * CHAR)));
  const desc = all.slice(0, 3);
  if (all.length > 3) desc[2] = desc[2].replace(/.{0,3}$/, '...');
  const lang = repo.language;
  let mx = pad;
  const meta = [];
  if (lang) {
    meta.push(`<circle cx="${mx + 5}" cy="${H - 26}" r="5" fill="${LANG[lang] ?? C.sub}"/><text x="${mx + 16}" y="${H - 21}" font-size="12" fill="${C.sub}">${esc(lang.toLowerCase())}</text>`);
    mx += 16 + lang.length * 12 * CHAR + 18;
  }
  if (repo.stargazers_count) {
    meta.push(`<text x="${mx}" y="${H - 21}" font-size="12" fill="${C.sub}">★ ${repo.stargazers_count}</text>`);
    mx += 50;
  }
  meta.push(`<text x="${mx}" y="${H - 21}" font-size="12" fill="${C.sub}">${ago(repo.pushed_at)}</text>`);
  const live = repo.homepage || (repo.has_pages ? `https://${LOGIN}.github.io/${repo.name}/` : null);
  if (live) meta.push(`<text x="${W - pad}" y="${H - 21}" font-size="12" font-weight="700" fill="${C.caret}" text-anchor="end">${repo.name === 'tximtxom' ? 'play' : 'open'} on the site →</text>`);
  const body = `<rect width="${W}" height="${H}" rx="12" fill="${C.subAlt}"/>
<text x="${pad}" y="40" font-size="18" font-weight="700" fill="${C.main}">${esc(repo.name)}</text>
${desc.map((l, i) => `<text x="${pad}" y="${68 + i * 20}" font-size="13" fill="${repo.description ? C.main : C.sub}">${esc(l)}</text>`).join('\n')}
${meta.join('\n')}`;
  return svg(W, H, body, `${repo.name}: ${repo.description || 'no description yet'}`);
}

// ------------------------------------------------------------------ main

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': `${LOGIN}-profile-render` };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const get = async (path) => {
  const r = await fetch(`https://api.github.com${path}`, { headers });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
};

const user = await get(`/users/${LOGIN}`);
const all = await get(`/users/${LOGIN}/repos?per_page=100&type=owner`);
const own = all.filter((r) => !r.fork && !r.private && r.name !== LOGIN && r.name !== `${LOGIN}.github.io`);
const numbers = {
  repos: own.length,
  stars: own.reduce((s, r) => s + r.stargazers_count, 0),
  followers: user.followers,
  years: Math.floor((Date.now() - new Date(user.created_at)) / (365.25 * 86400000)),
};

const out = (name, content) => writeFileSync(new URL(`assets/${name}`, root), content);
out('header.svg', header());
out('stats.svg', stats(numbers));
const pinned = PINNED.map((n) => own.find((r) => r.name === n)).filter(Boolean);
for (const r of pinned) out(`card-${r.name}.svg`, card(r));

// README: cards two per row, each linking to its repo.
const rows = [];
for (let i = 0; i < pinned.length; i += 2) {
  rows.push(
    pinned
      .slice(i, i + 2)
      .map((r) => `<a href="${r.html_url}"><img src="assets/card-${r.name}.svg" width="400" alt="${esc(r.name)}: ${esc(r.description || '')}"></a>`)
      .join(' '),
  );
}
const readme = `<p align="center">
  <a href="https://${LOGIN}.github.io/"><img src="assets/header.svg" width="900" alt="${esc(NAME)} (${LOGIN}): ${esc(BIO)}"></a>
</p>

<p align="center">
  <img src="assets/stats.svg" width="900" alt="${numbers.repos} public repos, ${numbers.stars} stars, ${numbers.followers} followers, ${numbers.years} years on GitHub">
</p>

<p align="center">
${rows.map((r) => `  ${r}`).join('<br>\n')}
</p>

<p align="center">
  <a href="https://${LOGIN}.github.io/">${LOGIN}.github.io</a> ·
  <a href="https://${LOGIN}.github.io/tximtxom/">play TximTxom</a> ·
  <a href="https://github.com/${LOGIN}?tab=repositories">all repositories</a>
</p>

<!-- Generated by tools/render.mjs. Edit that file, not this one. -->
`;
writeFileSync(new URL('README.md', root), readme);
console.log(`rendered header, stats and ${pinned.length} cards`);
