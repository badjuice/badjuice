// Writes the profile README and its images (assets/*.svg, in Monkeytype's
// 9009 colours, each with a -dark twin for GitHub's dark theme) from live
// GitHub data. Run daily by .github/workflows/refresh.yml.
//
//   node tools/render.mjs        (set GITHUB_TOKEN to avoid API rate limits)
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const LOGIN = 'badjuice';
const NAME = 'Nox Fortes';
const TAGLINE = 'Small tools for problems I keep running into, and a card game.';
// Same text as the portfolio (badjuice.github.io, js/profile.js).
const BIO =
  'I build small tools for problems I keep running into: moving Epic Games installs between drives, ' +
  'bookmarking every open tab at once, turning web pages into PDFs. Lately also a card game you can play ' +
  'in the browser. Mostly C#, PowerShell, JavaScript, TypeScript and Python. I wanted to write something ' +
  'more meaningful here, but I think there is a character lim';
// The big card at the top, with a button to the game.
const FEATURED = { repo: 'tximtxom', title: 'TximTxom', play: 'https://badjuice.github.io/tximtxom/' };
// Shown first, in this order. The rest follow, newest activity first.
const PINNED = ['EpicLibraryToolExplode', 'TabsExplode', 'url2pdf'];
const HIDE = [LOGIN, `${LOGIN}.github.io`];

// 9009 theme (monkeytype frontend/src/ts/constants/themes.ts), plus a dark
// variant built from the same hues for viewers on GitHub's dark theme.
const THEMES = {
  light: { bg: '#eeebe2', card: '#f7f5ef', main: '#080909', text: '#3b3a33', sub: '#99947f', line: '#d3cfc1', accent: '#7fa480', onAccent: '#080909' },
  dark: { bg: '#1b1c19', card: '#22231f', main: '#eeebe2', text: '#c9c5b8', sub: '#8a8572', line: '#363731', accent: '#7fa480', onAccent: '#080909' },
};
const LANG = { TypeScript: '#3178c6', JavaScript: '#f1e05a', PowerShell: '#4f8fd8', Python: '#3572a5', 'C#': '#178600', Kotlin: '#a97bff' };
const FONT = "system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

const root = new URL('..', import.meta.url);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const month = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Greedy word wrap by character count (SVG text doesn't wrap), ellipsis past `max` lines. */
function wrap(text, width, max) {
  const lines = [];
  let cur = '';
  for (const word of text.split(/\s+/)) {
    if (cur && (cur + ' ' + word).length > width) {
      lines.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    lines.length = max;
    lines[max - 1] = lines[max - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines;
}

const svg = (w, h, label, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<style>text{font-family:${FONT}}</style>
${body}
</svg>
`;

/** A playing card, for the decorations. */
const playingCard = (t, x, y, rot, suit, red) => {
  const ink = red ? '#c0605a' : t.main === '#080909' ? '#080909' : '#2a2b27';
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
<rect x="-34" y="-48" width="68" height="96" rx="8" fill="#fbfaf6" stroke="${t.line}"/>
<text x="-24" y="-28" font-size="15" font-weight="700" fill="${ink}">${suit}</text>
<text x="0" y="12" font-size="30" text-anchor="middle" fill="${ink}">${suit}</text>
</g>`;
};

function header(t) {
  const W = 900;
  const H = 220;
  const langs = ['C#', 'PowerShell', 'TypeScript', 'JavaScript', 'Python'];
  let x = 48;
  const chips = langs
    .map((l) => {
      const w = l.length * 7.1 + 36;
      const chip = `<rect x="${x}" y="160" width="${w}" height="28" rx="14" fill="${t.card}" stroke="${t.line}"/>
<circle cx="${x + 15}" cy="174" r="4.5" fill="${LANG[l]}"/>
<text x="${x + 25}" y="178.5" font-size="13" fill="${t.text}">${l}</text>`;
      x += w + 8;
      return chip;
    })
    .join('\n');
  return svg(
    W,
    H,
    `${NAME} (${LOGIN})`,
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.bg}" stroke="${t.line}"/>
<circle cx="56" cy="58" r="6" fill="${t.accent}"/>
<text x="74" y="64" font-size="15" letter-spacing="1.5" fill="${t.sub}">HI, I'M</text>
<text x="46" y="106" font-size="40" font-weight="700" letter-spacing="-0.5" fill="${t.main}">${NAME}</text>
<text x="48" y="138" font-size="16" fill="${t.text}"><tspan fill="${t.accent}" font-weight="600">@${LOGIN}</tspan><tspan fill="${t.sub}">  ·  </tspan>${esc(TAGLINE)}</text>
${chips}
${playingCard(t, 715, 112, -14, '♠', false)}
${playingCard(t, 765, 105, 0, '♥', true)}
${playingCard(t, 815, 112, 14, '♣', false)}`,
  );
}

function footer(t, repo, x, y) {
  const parts = [];
  if (repo.language) {
    parts.push(`<circle cx="${x + 5}" cy="${y - 4.5}" r="5" fill="${LANG[repo.language] ?? t.sub}"/>
<text x="${x + 16}" y="${y}" font-size="13" fill="${t.sub}">${esc(repo.language)}</text>`);
    x += 16 + repo.language.length * 7 + 20;
  }
  parts.push(`<text x="${x}" y="${y}" font-size="13" fill="${t.sub}">★ ${repo.stargazers_count}</text>`);
  x += 46;
  parts.push(`<text x="${x}" y="${y}" font-size="13" fill="${t.sub}">updated ${month(repo.pushed_at)}</text>`);
  return parts.join('\n');
}

function card(t, repo) {
  const W = 440;
  const H = 180;
  const desc = wrap(repo.description || 'No description yet.', 58, 3)
    .map((l, i) => `<text x="24" y="${78 + i * 21}" font-size="14" fill="${t.text}">${esc(l)}</text>`)
    .join('\n');
  return svg(
    W,
    H,
    `${repo.name}: ${repo.description ?? ''}`,
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.card}" stroke="${t.line}"/>
<path d="M24 22 h28" stroke="${t.accent}" stroke-width="3" stroke-linecap="round"/>
<text x="24" y="52" font-size="19" font-weight="700" fill="${t.main}">${esc(repo.name)}</text>
<text x="${W - 24}" y="52" font-size="15" text-anchor="end" fill="${t.sub}">↗</text>
${desc}
${footer(t, repo, 24, H - 22)}`,
  );
}

function featured(t, repo) {
  const W = 900;
  const H = 230;
  const desc = wrap(repo.description || '', 64, 3)
    .map((l, i) => `<text x="36" y="${122 + i * 23}" font-size="16" fill="${t.text}">${esc(l)}</text>`)
    .join('\n');
  return svg(
    W,
    H,
    `${FEATURED.title}: ${repo.description ?? ''}`,
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.card}" stroke="${t.line}"/>
<rect x="36" y="30" width="148" height="24" rx="12" fill="${t.accent}"/>
<text x="110" y="46.5" font-size="12" font-weight="700" letter-spacing="1" text-anchor="middle" fill="${t.onAccent}">PLAY IN BROWSER</text>
<text x="36" y="88" font-size="30" font-weight="700" letter-spacing="-0.3" fill="${t.main}">${FEATURED.title}</text>
${desc}
${footer(t, repo, 36, H - 28)}
${playingCard(t, 650, 125, -18, '♦', true)}
${playingCard(t, 705, 112, -6, '♠', false)}
${playingCard(t, 760, 112, 6, '♥', true)}
${playingCard(t, 815, 125, 18, '♣', false)}`,
  );
}

function button(t, kind) {
  const play = kind === 'play';
  const W = play ? 196 : 164;
  const H = 48;
  const label = play ? `Play ${FEATURED.title}` : 'View source';
  const icon = play
    ? `<path d="M24 16 L36 24 L24 32 Z" fill="${t.onAccent}"/>`
    : `<text x="22" y="30" font-size="15" font-weight="700" fill="${t.main}">&lt;/&gt;</text>`;
  return svg(
    W,
    H,
    label,
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${play ? t.accent : t.card}" stroke="${play ? t.accent : t.line}"/>
${icon}
<text x="${play ? 46 : 56}" y="29.5" font-size="16" font-weight="700" fill="${play ? t.onAccent : t.main}">${label}</text>`,
  );
}

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': `${LOGIN}-profile-render` };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const r = await fetch(`https://api.github.com/users/${LOGIN}/repos?per_page=100&type=owner`, { headers });
if (!r.ok) throw new Error(`repos: ${r.status}`);
const own = (await r.json()).filter((x) => !x.fork && !x.private && !HIDE.includes(x.name));
const top = own.find((x) => x.name === FEATURED.repo);
const rank = (x) => (PINNED.includes(x.name) ? PINNED.indexOf(x.name) : PINNED.length);
const rest = own
  .filter((x) => x !== top)
  .sort((a, b) => rank(a) - rank(b) || new Date(b.pushed_at) - new Date(a.pushed_at));

// Start from an empty assets folder so renamed or deleted repos don't leave cards behind.
const assets = new URL('assets/', root);
mkdirSync(assets, { recursive: true });
for (const f of readdirSync(assets)) rmSync(new URL(f, assets));
const images = { header, ...(top && { featured: (t) => featured(t, top), play: (t) => button(t, 'play'), source: (t) => button(t, 'source') }) };
for (const repo of rest) images[`card-${repo.name}`] = (t) => card(t, repo);
for (const [name, draw] of Object.entries(images)) {
  writeFileSync(new URL(`${name}.svg`, assets), draw(THEMES.light));
  writeFileSync(new URL(`${name}-dark.svg`, assets), draw(THEMES.dark));
}

/** An <img> that switches to the -dark file on GitHub's dark theme. */
const pic = (name, alt, attrs) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg"><img src="assets/${name}.svg" ${attrs} alt="${esc(alt)}"></picture>`;

const grid = rest.map((repo) => `<a href="${repo.html_url}">${pic(`card-${repo.name}`, `${repo.name}: ${repo.description ?? ''}`, 'width="49%"')}</a>`);
const rows = [];
for (let i = 0; i < grid.length; i += 2) rows.push(grid.slice(i, i + 2).join(' '));

const featuredBlock = top
  ? `<a href="${top.html_url}">${pic('featured', `${FEATURED.title}: ${top.description ?? ''}`, 'width="100%"')}</a>

<p>
  <a href="${FEATURED.play}">${pic('play', `Play ${FEATURED.title}`, 'height="44"')}</a>&nbsp;
  <a href="${top.html_url}">${pic('source', `${FEATURED.title} source code`, 'height="44"')}</a>
</p>

`
  : '';

writeFileSync(
  new URL('README.md', root),
  `<a href="https://${LOGIN}.github.io/">${pic('header', `${NAME} (${LOGIN}): ${TAGLINE}`, 'width="100%"')}</a>

${BIO}

${featuredBlock}### Projects

<p>
  ${rows.join('<br>\n  ')}
</p>

<p align="center">
  <a href="https://${LOGIN}.github.io/">${LOGIN}.github.io</a> ·
  <a href="${FEATURED.play}">play ${FEATURED.title}</a> ·
  <a href="https://github.com/${LOGIN}?tab=repositories">all repositories</a>
</p>

<!-- Generated by tools/render.mjs. Edit that file, not this one. -->
`,
);
console.log(`rendered README with ${top ? 1 : 0} featured and ${rest.length} project cards`);
