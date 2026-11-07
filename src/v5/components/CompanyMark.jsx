import React from 'react';

// Company logos, lifted from LinkedIn and re-encoded to 72px WebP — every one
// is under 2 KB, so Vite inlines them into the bundle and they are painted
// with the row rather than arriving a beat later.
import aiFellowship from '../assets/logos/ai-fellowship.webp';
import aucctus from '../assets/logos/aucctus.webp';
import blueprint from '../assets/logos/blueprint.webp';
import energyBridge from '../assets/logos/energy-bridge.webp';
import genaiGenesis from '../assets/logos/genai-genesis.webp';
import ignition from '../assets/logos/ignition.webp';
import knowidea from '../assets/logos/knowidea.webp';
import soon from '../assets/logos/soon.webp';
import trg from '../assets/logos/trg.webp';
import uoft from '../assets/logos/uoft.webp';
import utmCareer from '../assets/logos/utm-career.webp';
import utmfa from '../assets/logos/utmfa.webp';
import utmist from '../assets/logos/utmist.webp';
import utmsam from '../assets/logos/utmsam.webp';

// Keyed by the `company` string in src/data/experiences.js.
const LOGOS = {
  'The AI Fellowship': aiFellowship,
  'Aucctus AI': aucctus,
  'UofT Blueprint': blueprint,
  'The Energy Bridge': energyBridge,
  'GenAI Genesis': genaiGenesis,
  'Ignition Hacks': ignition,
  KNOWIDEA: knowidea,
  SOON: soon,
  'TRG International': trg,
  'University of Toronto': uoft,
  'UTM Career Center': utmCareer,
  UTMFA: utmfa,
  UTMIST: utmist,
  UTMSAM: utmsam,
};

// Orgs whose LinkedIn page was never claimed have no logo to take, so they
// get a monogram cut from the same square.
const SKIP = new Set(['for', 'the', 'of', 'and', 'a', 'to']);

const initials = (name) => {
  // A name that already carries its own acronym — "… (SAGE)" — uses it.
  const acronym = (name || '').match(/\(([A-Z]{2,5})\)/);
  if (acronym) return acronym[1];
  return (name || '')
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w && !SKIP.has(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

const CompanyMark = ({ company }) => {
  const src = LOGOS[company];
  if (!src) {
    const mark = initials(company);
    return (
      <span className="row-logo row-logo--mono" data-len={mark.length} aria-hidden="true">
        {mark}
      </span>
    );
  }
  return (
    <img
      className="row-logo"
      src={src}
      alt=""
      width="36"
      height="36"
      loading="lazy"
      decoding="async"
    />
  );
};

export default CompanyMark;
