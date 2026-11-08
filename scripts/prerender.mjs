// After `vite build`: write one HTML file per page so that real paths (/technique/raycasting) work on
// GitHub Pages and search engines can read each page without running the app. Each file is the app's
// index.html with its own title, description and canonical link, plus a plain-text version of the page
// inside #root that React replaces once it starts. Also writes 404.html, sitemap.xml and robots.txt.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE = process.env.VAULT_BASE ?? '/';
const ORIGIN = process.env.VAULT_ORIGIN ?? 'https://3dselectionvault.github.io';
const SITE = ORIGIN + BASE;
const dist = 'dist';

const readDir = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const techniques = readDir('data/techniques').sort((a, b) => a.name.localeCompare(b.name));
const publications = readDir('data/publications');
const pubById = new Map(publications.map((p) => [p.id, p]));

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const clip = (s, n = 160) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
};

const shell = readFileSync(join(dist, 'index.html'), 'utf8');
if (!shell.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root');

function page({ path, title, description, body }) {
  const url = SITE + path;
  // On the home page, tell Google the site's name (shown above results instead of the address).
  const siteName = path
    ? []
    : [
        `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: '3D Selection Vault',
          url: SITE,
        })}</script>`,
      ];
  const head = [
    ...siteName,
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="3D Selection Vault" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
  ].join('\n    ');
  const html = shell
    .replace(/<title>[^<]*<\/title>/, head)
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  // GitHub Pages serves /technique/raycasting from technique/raycasting.html, with no redirect to a trailing slash.
  const file = path ? join(dist, `${path}.html`) : join(dist, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  return url;
}

const link = (path, text) => `<a href="${esc(BASE + path)}">${esc(text)}</a>`;
const paperLine = (p) =>
  `${esc(p.authors?.join?.(', ') ?? p.authors ?? '')} (${esc(p.year ?? 'n.d.')}). ${esc(p.title)}. ${esc(p.venue ?? '')}` +
  (p.doi ? ` <a href="https://doi.org/${esc(p.doi)}">doi:${esc(p.doi)}</a>` : p.url ? ` <a href="${esc(p.url)}">link</a>` : '');

const urls = [];

urls.push(
  page({
    path: '',
    title: '3D Selection Vault',
    description:
      'An open database and visualization of 3D selection techniques for virtual and augmented reality: filter by attribute, compare similar techniques, and download BibTeX.',
    body: `<main><h1>3D Selection Techniques</h1><p>An open database and visualization of techniques for selecting objects in virtual and augmented reality.</p><ul>${techniques
      .map((t) => `<li>${link(`technique/${t.id}`, t.name)}${t.year ? ` (${t.year})` : ''}: ${esc(clip(t.summary, 140))}</li>`)
      .join('')}</ul></main>`,
  }),
);

for (const t of techniques) {
  const pubs = (t.publications ?? []).map((l) => pubById.get(l.id ?? l.publication ?? l)).filter(Boolean);
  urls.push(
    page({
      path: `technique/${t.id}`,
      title: `${t.name} · 3D Selection Vault`,
      description: clip(t.summary),
      body:
        `<main><p>${link('', '3D Selection Vault')}</p><h1>${esc(t.name)}</h1>` +
        (t.aliases?.length ? `<p>Also known as ${esc(t.aliases.join(', '))}</p>` : '') +
        `<p>${esc(t.summary)}</p>` +
        (t.howItWorks ? `<h2>How it works</h2><p>${esc(t.howItWorks)}</p>` : '') +
        (pubs.length ? `<h2>Papers</h2><ul>${pubs.map((p) => `<li>${paperLine(p)}</li>`).join('')}</ul>` : '') +
        `</main>`,
    }),
  );
}

urls.push(
  page({
    path: 'papers',
    title: 'Papers · 3D Selection Vault',
    description: 'The publications behind the 3D Selection Vault, with DOIs and BibTeX.',
    body: `<main><h1>Papers</h1><ul>${[...publications]
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
      .map((p) => `<li>${paperLine(p)}</li>`)
      .join('')}</ul></main>`,
  }),
);
urls.push(
  page({
    path: 'graph',
    title: 'Graphs · 3D Selection Vault',
    description:
      'Interactive 3D graphs of 3D selection techniques: technique similarity, designing a new technique, and paper citations.',
    body: '<main><h1>Graphs</h1><p>Technique similarity, design a new technique, and paper citations.</p></main>',
  }),
);
urls.push(
  page({
    path: 'about',
    title: 'About · 3D Selection Vault',
    description: 'What the 3D Selection Vault is, what you can do with it, and the attribute scheme behind it.',
    body: '<main><h1>About the vault</h1><p>An open database and visualization of 3D selection techniques, by Rumeysa Turkmen and Anil Ufuk Batmaz, EXIT Lab, Concordia University.</p></main>',
  }),
);

// Unknown paths: GitHub Pages serves 404.html, which is the bare app, so the app shows its own not-found page.
writeFileSync(join(dist, '404.html'), shell);

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`,
);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

console.log(`prerender: ${urls.length} pages, sitemap.xml, robots.txt, 404.html`);
