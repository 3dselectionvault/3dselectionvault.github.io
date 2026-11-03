import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { attributes, techniques, valueLabel } from '../lib/data';
import { countValues, search, type Filters, type SortKey } from '../lib/search';
import { citePubsOf } from '../lib/citations';
import SelectionBar from '../SelectionBar';
import ToolGlyph from '../ToolGlyph';
import { publications } from '../lib/data';

const OPEN_BY_DEFAULT = new Set(['environment', 'selectionTool', 'inputModality', 'disambiguation', 'targetDistance', 'handlesOcclusion']);

// Columns of the table after the name and year, in order.
const COLUMNS: { attr: string; label: string; className?: string }[] = [
  { attr: 'environment', label: 'Environment', className: 'wrap' },
  { attr: 'selectionTool', label: 'Tool' },
  { attr: 'inputModality', label: 'Input', className: 'opt wrap' },
  { attr: 'disambiguation', label: 'Disambiguation', className: 'opt wrap' },
  { attr: 'targetDistance', label: 'Distance' },
  { attr: 'handlesOcclusion', label: 'Occlusion', className: 'opt2' },
];
// Short labels for the table: drop the explanation in brackets.
const short = (attr: string, v: string) => valueLabel(attr, v).replace(/ \(.*\)/, '');
const cell = (vals: string[] | undefined, attr: string) =>
  vals && vals.length ? vals.map((v) => short(attr, v)).join(', ') : '—';

// Filter state lives in the URL so a filtered view can be shared as a link.
function readFilters(params: URLSearchParams): Filters {
  const f: Filters = {};
  for (const a of attributes) {
    const v = params.get(a.id);
    if (v) f[a.id] = v.split(',');
  }
  return f;
}

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  // On phones the filter groups start closed so the list is visible.
  const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches;
  const query = params.get('q') ?? '';
  const sort = (params.get('sort') as SortKey) ?? 'name';
  const filters = useMemo(() => readFilters(params), [params]);

  const results = useMemo(() => search(techniques, query, filters, sort), [query, filters, sort]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const flip = (id: string) =>
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const pickedTechs = techniques.filter((t) => picked.has(t.id));
  const pickedPubs = pickedTechs.flatMap(citePubsOf);
  const noPaper = pickedTechs.filter((t) => citePubsOf(t).length === 0).length;
  const allShownPicked = results.length > 0 && results.every((t) => picked.has(t.id));
  const active = Object.values(filters).reduce((n, v) => n + v.length, 0);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const toggle = (attr: string, value: string) => {
    const cur = new Set(filters[attr] ?? []);
    if (cur.has(value)) cur.delete(value);
    else cur.add(value);
    update(attr, cur.size ? [...cur].join(',') : null);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (sort !== 'name') next.set('sort', sort);
    setParams(next, { replace: true });
  };

  // Only offer attributes that at least one technique has been coded for.
  const facetGroups = attributes
    .map((a) => ({ attr: a, counts: countValues(techniques, a.id) }))
    .filter((g) => g.counts.size > 0);

  const pickAllShown = () =>
    setPicked((cur) => {
      const next = new Set(cur);
      for (const t of results) allShownPicked ? next.delete(t.id) : next.add(t.id);
      return next;
    });

  return (
    <div className="catalogue">
      <section className="cat-hero">
        <div className="cat-title">
          <h1>3D selection techniques</h1>
          <p>
            {techniques.length} techniques · {publications.length} papers
          </p>
        </div>
        <input
          type="search"
          className="hero-search"
          placeholder="Search names, descriptions, authors, papers"
          value={query}
          onChange={(e) => update('q', e.target.value || null)}
          aria-label="Search techniques"
        />
        <Link to="/graph" className="graph-link">
          <svg viewBox="0 0 120 80" aria-hidden="true">
            <g className="t-links">
              <path d="M18 52 38 30 62 40 86 18 104 34M38 30 50 62 62 40 80 58 104 34M18 52 50 62" />
            </g>
            <circle cx="18" cy="52" r="5" fill="#3f6fb0" />
            <circle cx="38" cy="30" r="6" fill="#4f8a4b" />
            <circle cx="50" cy="62" r="4.5" fill="#c08a2e" />
            <circle cx="86" cy="18" r="5" fill="#7a4fa3" />
            <circle cx="80" cy="58" r="4.5" fill="#2f8f8a" />
            <circle cx="104" cy="34" r="5.5" fill="#3f6fb0" />
            <circle cx="62" cy="40" r="8" fill="#e0475b" stroke="#fff" strokeWidth="2" />
          </svg>
          <strong>Similarity graph</strong>
        </Link>
      </section>

      <div className="catalogue-body">
        <aside className="filters" aria-label="Filters">
          {facetGroups.map(({ attr, counts }) => {
            const activeHere = filters[attr.id]?.length ?? 0;
            return (
              <details key={attr.id} className="facet" open={(!narrow && OPEN_BY_DEFAULT.has(attr.id)) || activeHere > 0}>
                <summary title={attr.description}>
                  <span>{attr.label}</span>
                  {activeHere > 0 && <span className="facet-active">{activeHere}</span>}
                </summary>
                <div className="facet-options">
                  {attr.values
                    .filter((v) => counts.has(v.id))
                    .map((v) => {
                      const on = filters[attr.id]?.includes(v.id) ?? false;
                      return (
                        <label key={v.id} className={on ? 'facet-option on' : 'facet-option'} title={v.label}>
                          <input type="checkbox" checked={on} onChange={() => toggle(attr.id, v.id)} />
                          {attr.id === 'selectionTool' && <ToolGlyph tool={v.id} size={16} />}
                          <span className="facet-label">{short(attr.id, v.id)}</span>
                          <span className="count">{counts.get(v.id)}</span>
                        </label>
                      );
                    })}
                </div>
              </details>
            );
          })}
          <p className="filters-note">
            What each filter means: <Link to="/about#attributes">attribute scheme</Link>.
          </p>
        </aside>

        <section className="results" aria-live="polite">
          <div className="toolbar">
            <p className="result-count">
              {results.length === techniques.length
                ? `${results.length} techniques`
                : `${results.length} of ${techniques.length} techniques`}
            </p>
            {active > 0 && (
              <button type="button" className="link-button" onClick={clearAll}>
                Clear {active} filter{active === 1 ? '' : 's'}
              </button>
            )}
            <select
              value={sort}
              onChange={(e) => update('sort', e.target.value === 'name' ? null : e.target.value)}
              aria-label="Sort"
            >
              <option value="name">Name A–Z</option>
              <option value="year-desc">Newest first</option>
              <option value="year-asc">Oldest first</option>
            </select>
          </div>

          {results.length === 0 ? (
            <div className="empty">
              <p>No techniques match these filters.</p>
              <button type="button" className="button" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          ) : (
            <table className="tech-table">
              <thead>
                <tr>
                  <th className="g" aria-label="Selection tool" />
                  <th>Technique</th>
                  <th className="n">Year</th>
                  {COLUMNS.map((c) => (
                    <th key={c.attr} className={c.className}>
                      {c.label}
                    </th>
                  ))}
                  <th className="n opt2">Papers</th>
                  <th className="ck">
                    <label title={allShownPicked ? 'Unselect all shown' : 'Select all shown for BibTeX'}>
                      Cite
                      <input type="checkbox" checked={allShownPicked} onChange={pickAllShown} aria-label="Select all shown" />
                    </label>
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((t) => (
                  <tr
                    key={t.id}
                    className={picked.has(t.id) ? 'picked' : undefined}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('a, input, label')) return;
                      navigate(`/technique/${t.id}`);
                    }}
                  >
                    <td className="g">
                      <ToolGlyph tool={t.attributes.selectionTool?.[0]} />
                    </td>
                    <td className="nm">
                      <Link to={`/technique/${t.id}`}>{t.name}</Link>
                      <span>{t.summary}</span>
                    </td>
                    <td className="n">{t.year ?? '—'}</td>
                    {COLUMNS.map((c) => (
                      <td key={c.attr} className={c.className}>
                        {cell(t.attributes[c.attr], c.attr)}
                      </td>
                    ))}
                    <td className="n opt2">{t.publications.length}</td>
                    <td className="ck">
                      <input
                        type="checkbox"
                        checked={picked.has(t.id)}
                        onChange={() => flip(t.id)}
                        aria-label={`Cite ${t.name}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
      <SelectionBar
        count={picked.size}
        noun="technique"
        pubs={pickedPubs}
        onClear={() => setPicked(new Set())}
        note={noPaper ? `${noPaper} without a linked paper` : (() => { const n = new Set(pickedPubs.map((p) => p.id)).size; return `${n} paper${n === 1 ? '' : 's'}`; })()}
      />
    </div>
  );
}
