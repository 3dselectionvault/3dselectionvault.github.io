import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { REPO_URL, attributes, publications, schemeStatus, techniques } from '../lib/data';
import { countValues } from '../lib/search';
import anilPhoto from '../assets/people/anil-batmaz.jpg';
import rumeysaPhoto from '../assets/people/rumeysa-turkmen.jpg';

// Only the opening clause: the values themselves are listed beside it.
const shortDescription = (d: string) => {
  const first = d.split(/(?<=\.)\s/)[0];
  return first.includes(':') ? `${first.split(':')[0]}.` : first;
};

const TILES: { title: string; text: string; to: string; go: string; external?: boolean }[] = [
  { title: 'Place your own technique', text: 'Code a new technique with the same attributes and see which existing ones to compare it against.', to: '/graph?mode=mine', go: 'Place a technique' },
  { title: 'Find techniques by attribute', text: 'Filter by environment, selection tool, input, disambiguation, distance and occlusion, or search by name and author.', to: '/', go: 'Open the catalogue' },
  { title: 'Read a technique at a glance', text: 'How it works, its attributes, the papers behind it and the techniques most similar to it.', to: '/technique/raycasting', go: 'See an example' },
  { title: 'Find the papers', text: `All ${publications.length} papers with DOIs, and which techniques each one introduces or evaluates.`, to: '/papers', go: 'Browse papers' },
  { title: 'Download BibTeX', text: 'Check the techniques or papers you need and get one .bib file for your reference manager.', to: '/', go: 'Pick techniques to cite' },
  { title: 'Explore the similarity graph', text: 'A 3D map where techniques that share more attributes sit closer together.', to: '/graph', go: 'Open the graph' },
  { title: 'Follow the citations', text: 'A 3D citation graph of the papers in the vault, to trace how techniques built on each other.', to: '/graph?view=citations', go: 'Open the citation graph' },
  { title: 'Suggest a correction', text: 'Every record is open on GitHub. Suggest a missing technique or a coding you disagree with.', to: `${REPO_URL}/issues/new/choose`, go: 'Suggest a technique', external: true },
];

export default function About() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  const counts = useMemo(
    () => new Map(attributes.map((a) => [a.id, countValues(techniques, a.id)])),
    [],
  );

  return (
    <div className="about">
      <section className="about-block about-intro" id="about-the-vault">
        <div className="intro-grid">
          <h2>About the vault</h2>
          <div className="intro-text">
            <p>
              3D selection is one of the fundamental tasks in virtual environments. Since the early 1990s,
              researchers have proposed hundreds of ways to select in virtual reality, augmented and mixed reality,
              desktop 3D and projection displays.
            </p>
            <p>
              These techniques are spread across many conferences and journals and are described in different terms,
              so it is hard to see what already exists, how two techniques differ, or which ones a new technique
              should be compared against in a study.
            </p>
            <p>
              The 3D Selection Vault gathers them in one place. Each technique has its own record, linked to the
              paper that introduced it and to the studies and surveys that evaluated it. Each technique is coded on {attributes.length} attributes. Because the coding is shared, techniques can be filtered,
              compared like for like and placed in a similarity map.
            </p>
          </div>
          <aside className="intro-people" id="people" aria-label="People">
            <h2>People</h2>
            <p className="muted small">
              <a href="https://users.encs.concordia.ca/~abatmaz/" target="_blank" rel="noreferrer">
                EXIT Lab
              </a>
              , Concordia University · Montréal, QC, Canada
            </p>
            <div className="people people-side">
              <div className="person">
                <img className="avatar" src={rumeysaPhoto} alt="" width="112" height="112" />
                <div>
                  <h3>Rumeysa Turkmen</h3>
                  <p>PhD candidate</p>
                  <p className="muted small">Computer Science and Software Engineering</p>
                </div>
              </div>
              <div className="person">
                <img className="avatar" src={anilPhoto} alt="" width="112" height="112" />
                <div>
                  <h3>Anil Ufuk Batmaz</h3>
                  <p>Assistant Professor</p>
                  <p className="muted small">Computer Science and Software Engineering</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="about-block" id="features" aria-labelledby="can-do">
        <div className="block-head">
          <h2 id="can-do">Features</h2>
        </div>
        <ul className="do-tiles">
          {TILES.map((t, i) => {
            const body = (
              <>
                <span className="do-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
                <span className="do-go">{t.go} →</span>
              </>
            );
            return (
              <li key={t.title}>
                {t.external ? (
                  <a href={t.to} target="_blank" rel="noreferrer">{body}</a>
                ) : (
                  <Link to={t.to}>{body}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="about-block" id="attributes">
        <div className="block-head">
          <h2>Attribute scheme</h2>
          {schemeStatus === 'draft' && (
            <p>
              The scheme is a draft; selection tool, tool origin, motor and visual space, and disambiguation follow
              Argelaguet and Andujar's 2013 survey.
            </p>
          )}
        </div>
        <div className="attr-rows">
          {attributes.map((a) => {
            const c = counts.get(a.id)!;
            return (
              <article key={a.id} className="attr-row">
                <div className="attr-name">
                  <h3>{a.label}</h3>
                </div>
                <p>{shortDescription(a.description)}</p>
                <ul className="value-chips">
                  {a.values.map((v) => (
                    <li key={v.id}>
                      <Link to={`/?${a.id}=${v.id}`}>
                        {v.label}
                        <span className="n">{c.get(v.id) ?? 0}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>


    </div>
  );
}
