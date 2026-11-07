import React, { useState } from 'react';

const Contact = () => {
  const [discord, setDiscord] = useState('Discord');

  const copyDiscord = async () => {
    try {
      await navigator.clipboard?.writeText?.('notjackl3');
      setDiscord('copied notjackl3');
      setTimeout(() => setDiscord('Discord'), 1800);
    } catch {
      setDiscord('notjackl3');
    }
  };

  return (
    <div className="wrap">
      <section className="contact rise">
        <p style={{ marginTop: 14 }}>
          reach me at{' '}
          <a className="link" href="mailto:huuanducle@gmail.com">
            huuanducle@gmail.com
          </a>{' '}
          for work,{' '}
          <a className="link" href="mailto:jack.le@mail.utoronto.ca">
            jack.le@mail.utoronto.ca
          </a>{' '}
          for school, and{' '}
          <a className="link" href="mailto:jackl32482005@gmail.com">
            jackl32482005@gmail.com
          </a>{' '}
          for anything else.
        </p>

        <div className="contact-links">
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
          <button type="button" className="link" onClick={copyDiscord}>
            {discord}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Contact;
