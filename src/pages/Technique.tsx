import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { attributes, editUrl, getPublication, getTechnique, techniques, valueLabel } from '../lib/data';
import { nearest } from '../lib/similarity';
import { downloadBibtex, toBibtex } from '../lib/bibtex';
import ToolGlyph from '../ToolGlyph';
import { citationGraphHref, citePubsOf, inCitationGraph } from '../lib/citations';
import type { Publication, PublicationLink, Relationship } from '../lib/types';

const ROLE_LABEL: Record<PublicationLink['role'], string> = {
  introduced: 'Introduced',
  evaluated: 'Evaluated',
  surveyed: 'Survey',
  reference: 'Reference',
};
const ROLE_TITLE: Record<PublicationLink['role'], string> = {
  introduced: 'This paper introduces the technique',
  evaluated: 'This paper evaluates the technique',
  surveyed: 'A survey covering the technique',
  reference: 'Reference, role not yet classified',
};
const short = (attr: string, v: string) => valueLabel(attr, v).replace(/ \(.*\)/, '');
const ROLE_ORDER: PublicationLink['role'][] = ['introduced', 'evaluated', 'reference', 'surveyed'];

const REL_LABEL: Record<Relationship['type'], string> = {
  extends: 'Extends',
  'variant-of': 'Variant of',
  'compared-with': 'Compared with',
  related: 'Related to',
};

const REVIEW_LABEL = {
  migrated: 'Imported from the old catalogue, not yet reviewed',
  draft: 'Draft, awaiting review',
  reviewed: 'Reviewed',
};

function cite(p: Publication) {
  const authors =
    p.authors.length > 3 ? `${p.authors[0]} et al.` : p.authors.join(', ') || 'Unknown authors';
  return `${authors}${p.year ? ` (${p.year})` : ''}`;
}

function CopyBibtex({ bibtex }: { bibtex: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="link-button"
      onClick={() => {
        navigator.clipboard?.writeText(bibtex).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => undefined,
        );
      }}
    >
      {done ? 'Copied' : 'Copy BibTeX'}
    </button>
  );
}

export default function TechniquePage() {
  const { id = '' } = useParams();
  const t = getTechnique(id);
  const mainPub = t ? citePubsOf(t).find((p) => inCitationGraph(p.id)) : undefined;
  const similar = useMemo(() => (t ? nearest(attributes, t.attributes, techniques, 5, t.id) : []), [t]);

  if (!t)
    return (
      <div className="empty">
        <h1>Technique not found</h1>
        <p>
          There is no technique with the id “{id}”. <Link to="/">See all techniques</Link>.
        </p>
      </div>
    );

  const pubs = [...t.publications].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );
  const coded = attributes.filter((a) => (t.attributes[a.id] ?? []).length > 0).length;
  const uncertain = new Set(t.review.uncertain ?? []);

  const allPubs = citePubsOf(t);
  const env = (t.attributes.environment ?? []).map((v) => short('environment', v)).join(', ');

  return (
    <article className="technique">
      <header className="tech-hero">
        <Link to="/" className="back">
          ← All techniques
        </Link>
        <div className="tech-hero-row">
          <div className="tech-glyph">
            <ToolGlyph tool={t.attributes.selectionTool?.[0]} size={44} />
          </div>
          <div className="tech-title">
            <h1>{t.name}</h1>
            <p>
              {[
                t.year != null ? String(t.year) : 'Year unknown',
                env,
                t.aliases && t.aliases.length ? `Also known as ${t.aliases.join(', ')}` : '',
                t.tasks.length > 1 ? `Also used for ${t.tasks.filter((x) => x !== 'selection').join(', ')}` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="tech-actions">
            <button type="button" className="hero-btn primary" disabled={!allPubs.length} onClick={() => downloadBibtex(allPubs)}>
              Download BibTeX
            </button>
            <Link to={`/graph?t=${t.id}`} className="hero-btn">
              Show in graph
            </Link>
          </div>
        </div>
      </header>

      <dl className="attr-strip">
        {attributes.map((a) => {
          const vals = t.attributes[a.id] ?? [];
          const unsure = vals.length > 0 && uncertain.has(a.id);
          return (
            <div key={a.id} title={a.description}>
              <dt>{a.label}</dt>
              <dd className={vals.length ? '' : 'muted'}>
                {vals.length ? vals.map((v) => short(a.id, v)).join(', ') : '—'}
                {unsure && <span className="unsure-dot" title="Best guess, still to be checked against the paper" aria-label="not yet confirmed" />}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="tech-body">
        <div className="tech-main">
          <p className="lead">{t.summary}</p>
          {t.howItWorks && (
            <section>
              <h2>How it works</h2>
              <p>{t.howItWorks}</p>
            </section>
          )}

          {((t.advantages?.length ?? 0) > 0 || (t.limitations?.length ?? 0) > 0) && (
            <section className="pros-cons">
              {(t.advantages?.length ?? 0) > 0 && (
                <div>
                  <h2>Strengths</h2>
                  <ul>
                    {t.advantages!.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(t.limitations?.length ?? 0) > 0 && (
                <div>
                  <h2>Limitations</h2>
                  <ul>
                    {t.limitations!.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section>
            <h2>Papers</h2>
            {pubs.length === 0 && <p className="muted">No publications linked yet.</p>}
            <ul className="paper-rows">
              {pubs.map((link) => {
                const p = getPublication(link.publication);
                if (!p) return null;
                const href = p.doi ? `https://doi.org/${p.doi}` : p.url;
                return (
                  <li key={link.publication}>
                    <span className={`role-tag role-${link.role}`} title={ROLE_TITLE[link.role]}>
                      {ROLE_LABEL[link.role]}
                    </span>
                    <div>
                      <span className="pr-title">
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer">
                            {p.title}
                          </a>
                        ) : (
                          p.title
                        )}
                      </span>
                      <span className="pr-meta">
                        {cite(p)}
                        {p.venue ? ` · ${p.venue}` : ''}
                        {link.where ? ` · ${link.where}` : ''}
                      </span>
                      <span className="pr-actions">
                        <CopyBibtex bibtex={toBibtex(p)} />
                        {inCitationGraph(p.id) && <Link to={citationGraphHref(p.id)}>Citation graph</Link>}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="tech-side">
          {(t.relationships?.length ?? 0) > 0 && (
            <section>
              <h2>Related techniques</h2>
              <ul className="tech-links">
                {t.relationships!.map((r) => {
                  const other = getTechnique(r.technique);
                  if (!other) return null;
                  return (
                    <li key={`${r.type}-${r.technique}`}>
                      <ToolGlyph tool={other.attributes.selectionTool?.[0]} size={18} />
                      <div>
                        <Link to={`/technique/${other.id}`}>{other.name}</Link>
                        <span className="rel-type">{REL_LABEL[r.type]}</span>
                        {r.note && <span className="rel-note">{r.note}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {similar.length > 0 && (
            <section>
              <h2>Most similar by attributes</h2>
              <ul className="tech-links">
                {similar.map(({ technique: o, similarity: sim }) => (
                  <li key={o.id}>
                    <ToolGlyph tool={o.attributes.selectionTool?.[0]} size={18} />
                    <div>
                      <Link to={`/technique/${o.id}`}>{o.name}</Link>
                      <span className="rel-type">{Math.round(sim.score * 100)}% shared attributes</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="side-links">
                <Link to={`/graph?t=${t.id}`}>Similarity graph</Link>
                {mainPub && <Link to={citationGraphHref(mainPub.id)}>Citation graph</Link>}
              </p>
            </section>
          )}
        </aside>
      </div>

      <p className="record-line">
        {REVIEW_LABEL[t.review.status]} · {coded} of {attributes.length} attributes coded
        {uncertain.size > 0 && ' · a dot marks a value still to be confirmed'} ·{' '}
        <a href={editUrl(`data/techniques/${t.id}.json`)} target="_blank" rel="noreferrer">
          Suggest a correction on GitHub
        </a>
      </p>
    </article>
  );
}
