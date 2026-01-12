import React, { useState } from 'react';
import { FaDiscord, FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa';

const ContactSection = () => {
  const [discordLabel, setDiscordLabel] = useState('discord');

  const onDiscordClick = async () => {
    setDiscordLabel('notjackl3');
    try {
      await navigator.clipboard?.writeText?.('notjackl3');
    } catch {
      // ignore (clipboard may be unavailable depending on browser/security context)
    }
  };

  return (
    <section id="contact" className="section tab-content">
      <div className="contact-content">
        <div className="contact-info">
          <p>
            Feel free to contact me at{' '}
            <a href="mailto:huuanducle@gmail.com">huuanducle@gmail.com</a> for work purposes,{' '}
            <a href="mailto:jack.le@mail.utoronto.ca">jack.le@mail.utoronto.ca</a> for school purposes,{' '}
            <a href="mailto:jackl32482005@gmail.com">jackl32482005@gmail.com</a> for personal matters.
          </p>

          <div className="contact-methods">
            <a
              className="contact-social"
              href="https://github.com/notjackl3"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
            >
              <FaGithub size={22} />
              <span className="contact-social-label">github</span>
            </a>

            <a
              className="contact-social"
              href="https://www.linkedin.com/in/huu-an-duc-le/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <FaLinkedin size={22} />
              <span className="contact-social-label">linkedin</span>
            </a>

            <button
              type="button"
              className="contact-social"
              aria-label="Discord"
              title="Discord (click to copy username)"
              onClick={onDiscordClick}
            >
              <FaDiscord size={22} />
              <span className="contact-social-label">{discordLabel}</span>
            </button>

            <a
              className="contact-social"
              href="https://instagram.com/notjackl3"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
            >
              <FaInstagram size={22} />
              <span className="contact-social-label">instagram</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
