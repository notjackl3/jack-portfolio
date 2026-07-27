import omni from '../assets/omni.webp';
import bigBrother from '../assets/big-brother.webp';
import vibeLearn from '../assets/vibe-learn.webp';
import kingsview from '../assets/kingsview.webp';
import eroute from '../assets/eroute.webp';

// Mirrors the `type: "swe"` entries from src/data/experiences.js, ordered most-recent first.
// `title` = job title (role). `company` + `duration` shown below it.
// `slug` = URL path that deep-links to this project (e.g. jack-le.com/teb).
// Each work entry has at least one screen (the "main" one defined here).
// More screens can be added at runtime via the admin UI on localhost —
// they're stored in src/data/workNodes.json alongside their per-screen notes.
export const workProjects = [
  // NOTE: the admin meta override in workNodes.json swaps the displayed
  // company for id 22 (it shows The Energy Bridge).
  // Slugs follow what visitors actually see, not the base data below.
  {
    id: 22,
    slug: 'teb',
    title: 'AI Software Engineer Intern',
    company: 'Aucctus AI',
    duration: 'May 2026 - Present',
    mainScreen: { id: 'main', label: 'Main', image: omni },
  },
  {
    id: 21,
    slug: 'utmist',
    title: 'Infrastructure Engineer',
    company: 'UTMIST',
    duration: 'February 2026 - April 2026',
    mainScreen: { id: 'main', label: 'Main', image: bigBrother },
  },
  {
    id: 19,
    slug: 'uoft',
    title: 'Software Engineer',
    company: 'University of Toronto',
    duration: 'January 2026 - April 2026',
    mainScreen: { id: 'main', label: 'Main', image: kingsview },
  },
  {
    id: 17,
    slug: 'uoft-research',
    title: 'Research Assistant',
    company: 'University of Toronto',
    duration: 'September 2025 - April 2026',
    mainScreen: { id: 'main', label: 'Main', image: vibeLearn },
  },
  {
    id: 16,
    slug: 'blueprint',
    title: 'Software Tech Lead',
    company: 'UofT Blueprint',
    duration: 'August 2025 - April 2026',
    mainScreen: { id: 'main', label: 'Main', image: eroute },
  },
];
