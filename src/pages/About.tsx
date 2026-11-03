import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { REPO_URL, attributes, publications, schemeStatus, techniques } from '../lib/data';
import { countValues } from '../lib/search';
import anilPhoto from '../assets/people/anil-batmaz.jpg';
import rumeysaPhoto from '../assets/people/rumeysa-turkmen.jpg';

const MAX_WEIGHT = Math.max(...attributes.map((a) => a.weight));

function Weight({ value }: { value: number }) {
  return (
    <span className="weight" title={`Weight ${value} of ${MAX_WEIGHT} in the similarity score`}>
      {Array.from({ length: MAX_WEIGHT }, (_, i) => (
        <span key={i} className={i < value ? 'on' : ''} />
      ))}
    </span>
  );
}

export default function About() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  const years = techniques.map((t) => t.year).filter((y): y is number => y != null);
  const counts = useMemo(
    () => new Map(attributes.map((a) => [a.id, countValues(techniques, a.id)])),
    [],
  );
  const reviewed = techniques.filter((t) => t.review.status === 'reviewed').length;

  const scrollToAttrs = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('attributes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="about">
      <header className="about-band">
        <div className="band-stats">
          <Link to="/">
            <strong>{techniques.length}</strong>
            <span>Techniques</span>
          </Link>
          <Link to="/papers">
            <strong>{publications.length}</strong>
            <span>Papers</span>
          </Link>
          <a href="#/about#attributes" onClick={scrollToAttrs}>
            <strong>{attributes.length}</strong>
            <span>Attributes</span>
          </a>
          {years.length > 0 && (
            <div>
              <strong>
                {Math.min(...years)}–{Math.max(...years)}
              </strong>
              <span>Years covered</span>
            </div>
          )}
        </div>
      </header>

      <section className="about-block about-intro">
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
              paper that introduced it and to the studies and surveys that evaluated it. Every technique is coded on
              the same {attributes.length} attributes, from the selection tool and where it starts to how the user
              confirms and whether hidden targets can be reached. Because the coding is shared, techniques can be
              filtered, compared like for like and placed in a similarity map.
            </p>
          </div>
          <aside className="intro-people" id="people" aria-label="People">
            <h2>People</h2>
            <p className="muted small">Concordia University, Montréal</p>
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

      <section className="about-block" aria-labelledby="can-do">
        <div className="block-head">
          <h2 id="can-do">What you can do</h2>
        </div>
        <ul className="can-do">
          <li>
            <h3>Find techniques by attribute</h3>
            <p>Filter the catalogue by environment, selection tool, input, disambiguation, distance and more, or search by name, description or author.</p>
            <Link to="/">Open the catalogue</Link>
          </li>
          <li>
            <h3>Read each technique at a glance</h3>
            <p>Every technique page shows how it works, its nine attributes, the papers behind it and the techniques related or most similar to it.</p>
            <Link to="/technique/raycasting">See an example</Link>
          </li>
          <li>
            <h3>Find the papers</h3>
            <p>Browse all {publications.length} papers with their DOIs, see which techniques each one introduces or evaluates, and how often they cite each other.</p>
            <Link to="/papers">Browse papers</Link>
          </li>
          <li>
            <h3>Download BibTeX</h3>
            <p>Tick the techniques or papers you need and download one .bib file for your reference manager, or copy a single entry.</p>
            <Link to="/">Pick techniques to cite</Link>
          </li>
          <li>
            <h3>Explore the similarity graph</h3>
            <p>A 3D map where techniques that share more attributes sit closer together. Click one to see its nearest neighbours and what they have in common.</p>
            <Link to="/graph">Open the similarity graph</Link>
          </li>
          <li>
            <h3>Place your own technique</h3>
            <p>Describe a new technique with the same attributes and the graph shows which existing techniques it is closest to: the ones to compare against.</p>
            <Link to="/graph">Place a technique</Link>
          </li>
          <li>
            <h3>Follow the citations</h3>
            <p>A 3D citation graph links the papers in the vault, so you can trace how techniques built on each other over time.</p>
            <Link to="/graph?view=citations">Open the citation graph</Link>
          </li>
          <li>
            <h3>Suggest a correction</h3>
            <p>Every record can be checked and edited on GitHub. Suggest a missing technique or a coding you disagree with.</p>
            <a href={`${REPO_URL}/issues/new/choose`} target="_blank" rel="noreferrer">
              Suggest a technique
            </a>
          </li>
        </ul>
      </section>

      <section className="about-block" id="attributes">
        <div className="block-head">
          <h2>Attribute scheme</h2>
          <p>
            The dots show how much each attribute counts in the similarity score. Click a value to see the
            techniques that have it.
            {schemeStatus === 'draft' &&
              " The scheme is a draft; selection tool, tool origin, motor and visual space, and disambiguation follow Argelaguet and Andujar's 2013 survey."}
          </p>
        </div>
        <div className="attr-rows">
          {attributes.map((a) => {
            const c = counts.get(a.id)!;
            return (
              <article key={a.id} className="attr-row">
                <div className="attr-name">
                  <h3>{a.label}</h3>
                  <Weight value={a.weight} />
                  <span className="attr-foot">
                    {a.multiple ? 'Several values' : 'One value'}
                    {a.basis ? ` · ${a.basis === 'Addition' ? 'added for this vault' : a.basis}` : ''}
                  </span>
                </div>
                <p>{a.description}</p>
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


      <section className="about-steps about-foot">
        <div>
          <h2>Contribute</h2>
          <p>
            Missing a technique, or spotted a coding you disagree with? Suggest it with the technique's name and its
            original paper, or edit its data file and open a pull request.
          </p>
          <p className="about-actions">
            <a className="button" href={`${REPO_URL}/issues/new/choose`} target="_blank" rel="noreferrer">
              Suggest a technique
            </a>
            <a className="button button-ghost" href={REPO_URL} target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </p>
        </div>
        <div>
          <h2>The data</h2>
          <p>
            Each technique is one JSON file in{' '}
            <a href={`${REPO_URL}/tree/main/data/techniques`} target="_blank" rel="noreferrer">
              data/techniques
            </a>{' '}
            and each paper one file in{' '}
            <a href={`${REPO_URL}/tree/main/data/publications`} target="_blank" rel="noreferrer">
              data/publications
            </a>
            . Every change is checked automatically before it appears on the site.
          </p>
          <p className="muted small">
            {reviewed} of {techniques.length} techniques reviewed so far; the rest are draft codings awaiting a check
            against their papers.
          </p>
        </div>
        <div>
          <h2>Licence</h2>
          <p>
            The site's code and the catalogue data are released under the MIT licence. Papers, figures and videos
            linked from the vault belong to their authors and publishers.
          </p>
        </div>
      </section>
    </div>
  );
}
