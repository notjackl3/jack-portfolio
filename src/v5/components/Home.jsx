import React from 'react';
import { experiences } from '../../data/experiences';
import { lowerDuration, lowerTitle } from '../text';
import Activity from './Activity';
import CompanyMark from './CompanyMark';
import Notes from './Notes';

// Everything still running, newest first. Paid engineering roles only — the
// club and volunteer work lives on the experience page behind its own filter.
const current = experiences.filter(
  (e) => /present/i.test(e.duration) && e.type !== 'volunteer'
);


const Home = ({ noteStyle, hand }) => (
  <div className="wrap">
    <section className="intro rise" id="intro" data-rail-target>
      <h1>Jack Le</h1>
      <p>i'm a fullstack engineer, studying at the University of Toronto.</p>
      <p>
        i've been to 22 hackathons in 2026, 15 of them in a row. this summer i work three
        software jobs: the 9-5, the 5-9, and the weekend. always seeking new opportunities.
      </p>

      <div className="intro-links">
        <span>resume:</span>
        <a className="link" href="/jack-le-fullstack-resume.pdf" target="_blank" rel="noopener noreferrer">
          fullstack
        </a>
        <span className="sep">·</span>
        <a className="link" href="/jack-le-backend-resume.pdf" target="_blank" rel="noopener noreferrer">
          backend
        </a>
        <span className="sep">·</span>
        <a className="link" href="/jack-le-ai-resume.pdf" target="_blank" rel="noopener noreferrer">
          ai
        </a>
      </div>
    </section>

    {/* `now` and the note share this row: what I am doing on the left,
        what I want to do on the right. The two halves stack on a phone. */}
    <section className="block rise now-row" id="now" data-rail-target style={{ '--d': '90ms' }}>
      <div className="now-col">
        <h2>now</h2>
        {current.map((e) => (
          <div className="row" key={e.id}>
            <CompanyMark company={e.company} />
            <div className="row-main">
              <div className="row-title">{lowerTitle(e.position)}</div>
              <div className="row-sub">{e.company}</div>
            </div>
            <div className="row-date">{lowerDuration(e.duration.replace(/ - Present$/i, ''))}</div>
          </div>
        ))}
      </div>

      <div className="note-col">
        <Notes style={noteStyle} hand={hand} />
      </div>
    </section>

    <section className="block rise" id="activity" data-rail-target style={{ '--d': '160ms' }}>
      <Activity />
    </section>

    <section className="block rise" id="elsewhere" data-rail-target style={{ '--d': '220ms' }}>
      <h2>elsewhere</h2>
      <div className="intro-links" style={{ marginTop: 0 }}>
        <a className="link" href="https://github.com/notjackl3" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <span className="sep">·</span>
        <a className="link" href="https://www.linkedin.com/in/huu-an-duc-le/" target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <span className="sep">·</span>
        <a className="link" href="https://devpost.com/notjackl3" target="_blank" rel="noopener noreferrer">
          Devpost
        </a>
        <span className="sep">·</span>
        <a className="link" href="https://leetcode.com/u/notjackl3/" target="_blank" rel="noopener noreferrer">
          LeetCode
        </a>
        <span className="sep">·</span>
        <a className="link" href="https://instagram.com/notjackl3" target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
        <span className="sep">·</span>
        <a className="link" href="mailto:huuanducle@gmail.com">
          email
        </a>
      </div>
    </section>
  </div>
);

export default Home;
