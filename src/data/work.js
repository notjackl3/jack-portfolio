import omni from '../assets/omni.png';
import vibe from '../assets/vibe.png';
import bigBrother from '../assets/big-brother.png';
import vibeLearn from '../assets/vibe-learn.png';
import kingsview from '../assets/kingsview.png';
import eroute from '../assets/eroute.png';

// Mirrors the `type: "swe"` entries from src/data/experiences.js, ordered most-recent first.
// `title` = job title (role). `company` + `duration` shown below it.
// Each work entry has at least one screen (the "main" one defined here).
// More screens can be added at runtime via the admin UI on localhost —
// they're stored in src/data/workNodes.json alongside their per-screen notes.
export const workProjects = [
  {
    id: 22,
    title: 'AI Software Engineer Intern',
    company: 'Aucctus AI',
    duration: 'May 2026 - Present',
    mainScreen: { id: 'main', label: 'Main', image: omni },
  },
  {
    id: 23,
    title: 'Founding Software Engineer',
    company: 'The Energy Bridge',
    duration: 'May 2026 - Present',
    mainScreen: { id: 'main', label: 'Main', image: vibe },
  },
  {
    id: 21,
    title: 'Infrastructure Engineer',
    company: 'UTMIST',
    duration: 'February 2026 - April 2026',
    mainScreen: { id: 'main', label: 'Main', image: bigBrother },
  },
  {
    id: 19,
    title: 'Software Engineer',
    company: 'University of Toronto',
    duration: 'January 2026 - April 2026',
    mainScreen: { id: 'main', label: 'Main', image: kingsview },
  },
  {
    id: 17,
    title: 'Research Assistant',
    company: 'University of Toronto',
    duration: 'September 2025 - April 2026',
    mainScreen: { id: 'main', label: 'Main', image: vibeLearn },
  },
  {
    id: 16,
    title: 'Software Tech Lead',
    company: 'UofT Blueprint',
    duration: 'August 2025 - April 2026',
    mainScreen: { id: 'main', label: 'Main', image: eroute },
  },
];
