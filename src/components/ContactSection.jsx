import React from 'react';

const ContactSection = () => {
  return (
    <section id="contact" className="section tab-content">
      <h2>Contact</h2>
      <div className="contact-content">
        <div className="contact-info">
          <p>I'm always interested in new opportunities and collaborations.</p>
          <p>Feel free to reach out if you'd like to work together!</p>

          <div className="contact-methods">
            <div className="contact-item">
              <strong>Email:</strong>
              <a href="mailto:jack@example.com">jack@example.com</a>
            </div>
            <div className="contact-item">
              <strong>LinkedIn:</strong>
              <a href="https://linkedin.com/in/jack-doe" target="_blank" rel="noopener noreferrer">
                linkedin.com/in/jack-doe
              </a>
            </div>
            <div className="contact-item">
              <strong>GitHub:</strong>
              <a href="https://github.com/jack-doe" target="_blank" rel="noopener noreferrer">
                github.com/jack-doe
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
