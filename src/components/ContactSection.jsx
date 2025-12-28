import React from 'react';
import { FaDiscord, FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa';

const ContactSection = () => {
  return (
    <section id="contact" className="section tab-content">
      <div className="contact-content">
        <div className="contact-info">
          <p>
            Feel free to contact me at{' '}
            <a href="mailto:huuanducle@gmail.com">huuanducle@gmail.com</a> for work purposes,{' '}
            <a href="mailto:jack.le@mail.utoronto.ca">jack.le@mail.utoronto.ca</a> for school purposes.
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
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <FaLinkedin size={22} />
              <span className="contact-social-label">linkedin</span>
            </a>

            <a
              className="contact-social"
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              title="Discord"
            >
              <FaDiscord size={22} />
              <span className="contact-social-label">discord</span>
            </a>

            <a
              className="contact-social"
              href="https://instagram.com"
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
