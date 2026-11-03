import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { REPO_URL, attributes, publications, schemeStatus, techniques } from '../lib/data';
import { countValues } from '../lib/search';

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
        <h1>A shared map of 3D selection techniques</h1>
        <p>
          An open catalogue of techniques for selecting objects in virtual and mixed reality. When you design a new
          technique, it shows you the existing ones closest to yours, so you know what to compare against.
        </p>
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

      <section className="about-steps" aria-label="How it works">
        <div>
          <span className="step-n">1</span>
          <h2>Collect</h2>
          <p>
            Each technique gets one record, linked to the paper that introduced it and to the studies and surveys
            that evaluated it.
          </p>
          <Link to="/">Browse the catalogue</Link>
        </div>
        <div>
          <span className="step-n">2</span>
          <h2>Code</h2>
          <p>Every technique is described with the same {attributes.length} attributes, so any two can be compared like for like.</p>
          <a href="#/about#attributes" onClick={scrollToAttrs}>
            See the attributes
          </a>
        </div>
        <div>
          <span className="step-n">3</span>
          <h2>Compare</h2>
          <p>
            Shared attributes give a similarity score. The graph places similar techniques together, and you can
            drop in your own to find its neighbours.
          </p>
          <Link to="/graph">Open the similarity graph</Link>
        </div>
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

      <section className="about-block" id="people">
        <div className="block-head">
          <h2>People</h2>
          <p>The vault is maintained at Concordia University in Montréal, Canada.</p>
        </div>
        <div className="people">
          <div className="person">
            <span className="avatar" aria-hidden="true">RT</span>
            <div>
              <h3>Rumeysa Turkmen</h3>
              <p>PhD candidate</p>
              <p className="muted small">Department of Computer Science and Software Engineering, Concordia University</p>
            </div>
          </div>
          <div className="person">
            <span className="avatar" aria-hidden="true">AUB</span>
            <div>
              <h3>Anil Ufuk Batmaz</h3>
              <p>Assistant Professor</p>
              <p className="muted small">Department of Computer Science and Software Engineering, Concordia University</p>
            </div>
          </div>
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
