import deltahacksImg      from '../assets/hackathons/deltahacks.jpg';
import uofthacksImg       from '../assets/hackathons/uofthacks.jpg';
import stanImg            from '../assets/hackathons/stanhackathon.jpg';
import ultraImg           from '../assets/hackathons/ultrahacks.jpg';
import qhacksImg          from '../assets/hackathons/qhacks.jpg';
import voiceAgentImg      from '../assets/hackathons/voiceagent.jpg';
import smileImg           from '../assets/hackathons/snilehacks.jpg';
import deerhacksImg       from '../assets/hackathons/deerhacks.jpg';
import hackCanadaImg      from '../assets/hackathons/hackcanada.jpg';
import hackFutureImg      from '../assets/hackathons/hackthefuture.jpg';
import hackGlobeImg       from '../assets/hackathons/hacktheglobe.jpg';
import stupidImg          from '../assets/hackathons/stupidideashackathon.jpg';
import genaiImg           from '../assets/hackathons/genaigensis.jpg';
import fraserImg          from '../assets/hackathons/fraserhacks.jpg';

const hackathons = [
  {
    id: 1,
    number: 1,
    name: 'DeltaHacks',
    highlight: 'Built SkySync — analyzed 1.6M+ flight records to let planes fly in V-formation like birds. Produced 300K+ flight pairs using Haversine distance and gradient descent, then visualized everything on a 3D globe with live fuel savings ticking in real-time. First overnight hackathon, traveled through a snowstorm to get there.',
    image: deltahacksImg,
  },
  {
    id: 2,
    number: 2,
    name: 'UofTHacks',
    highlight: 'Won $600 with Big Brother — a Chrome extension that teaches elderly people how to navigate the web through natural language. It can browse Facebook Marketplace, add items to cart, and negotiate prices with sellers. Built with a RAG system, vector search, and real-time memory. 600+ hackers, our team stood out.',
    image: uofthacksImg,
  },
  {
    id: 3,
    number: 3,
    name: 'Hack AI x Stan',
    highlight: 'Competed for $20,000 among 60 hand-selected builders. Built an AI video editor combining Premiere Pro flexibility with iPhone simplicity. Met Stan\'s CTO who said "building is easy, distribution is hard." The food was unreal: sashimi, salmon, and perfect medium-rare steak. We didn\'t win, but walked away with invaluable lessons.',
    image: stanImg,
  },
  {
    id: 4,
    number: 4,
    name: 'UTRA Hacks',
    highlight: 'Won the ElevenLabs award in a hardware hackathon — as a software person. Built a 3D interactive showcase of our robot powered by ElevenLabs and Gemini where you can click any part and hear it explained, then drive the car yourself with WASD controls. The actual robot had a broken axle count of 37.',
    image: ultraImg,
  },
  {
    id: 5,
    number: 5,
    name: 'QHacks',
    highlight: 'Won the City of Kingston Challenge with a 1:1 3D replica of Kingston — live simulations across 4,500+ buildings and 700+ roads, all animated in real-time. Got a gold ticket to pitch to the mayor. Traveled 5 hours in -25°C through a snowstorm, nearly got stranded when the first Uber saw our luggage and drove off.',
    image: qhacksImg,
  },
  {
    id: 6,
    number: 6,
    name: 'AI Agents Voice Hackathon',
    highlight: 'Placed 13th out of 200 with Composium — an app where you sing and AI musical beats play along to back you up. Set up audio pipelines and voice-to-ABC note conversion. Guilty confession: it was Valentine\'s Day, I left midway to go to the aquarium. My teammates finished without me. Online hackathons are not for me.',
    image: voiceAgentImg,
  },
  {
    id: 7,
    number: 7,
    name: 'SmileHacks',
    highlight: 'Won 3rd place overall and best photo/video — the only team with two wins — at a dental hackathon with zero dental knowledge. Built a dual-view 3D jaw viewer from CT scans with chewing animations, annotations, and AI-powered cavity detection. Won $225, a direct NEST interview, and industry interest. Also ran through the rain to get McDonald\'s.',
    image: smileImg,
  },
  {
    id: 8,
    number: 8,
    name: 'DeerHacks V',
    highlight: 'Solo hacked AND mentored at the same event. Built Hands Tiles — a computer vision rhythm game where you play piano tiles with your bare hands, featuring real-time tap detection and voice hype announcements. Left midway to attend Tech Roast and grab dinner at Piano Piano, came back at midnight and kept coding.',
    image: deerhacksImg,
  },
  {
    id: 9,
    number: 9,
    name: 'Hack Canada',
    highlight: 'Won with ERoute — a smart emergency routing platform for Ontario that finds the best hospital based on your condition, live traffic, and ER congestion. Added a 3D government planning mode to simulate patient flow across hospitals. Part of a triple-hackathon weekend: bounced between two cities in one night to finish this and start two others.',
    image: hackCanadaImg,
  },
  {
    id: 10,
    number: 10,
    name: 'Hack The Future',
    highlight: 'Won 1st place and $1,500 at the Google office out of 250 participants with Omni — a supply chain AI agent that monitors disruption signals and proposes mitigation strategies. 15 minutes before demo, the product broke and I was fixing bugs while other teams presented. We prepared a 144-page planning document. I wore a quarter zip in a sea of suits.',
    image: hackFutureImg,
  },
  {
    id: 11,
    number: 11,
    name: 'GenAI Genesis 2026',
    highlight: 'Organized this one as a director. Ran across buildings, survived on 4 hours of sleep, blew a million balloons by mouth, organized the event while protests happened outside, stood in the cold handing out merch, dealt with 3 separate emergencies, and brought fried chicken with 7 dipping sauces + a spicy ramen eating competition.',
    image: genaiImg,
  },
  {
    id: 12,
    number: 12,
    name: 'Hack The Globe',
    highlight: 'Built VIBE — a platform for people with hearing disabilities to practice and carry out job interviews using sign language. Walked across Toronto at 11pm trying to find a place to sit. Overslept Sunday morning and missed the deadline, but the organizers were kind enough to give us one more chance to present.',
    image: hackGlobeImg,
  },
  {
    id: 13,
    number: 13,
    name: 'FraserHacks',
    highlight: 'Went from hacker to judge. Reviewed and evaluated projects from the other side of the table, provided feedback to teams, and helped select winners. A completely different experience — seeing every team\'s journey reminded me of why I fell in love with hackathons in the first place.',
    image: fraserImg,
  },
  {
    id: 14,
    number: 14,
    name: 'Stupid Hackathon',
    highlight: 'Won in 4 hours with a fully functional 2016 browser — complete with real YouTube, working Vines, live chess with AI, Pokemon GO, real-time election voting, and a bottle flip you do by literally flipping your laptop. Prizes: fidget spinners, a dino costume, and an iPhone. Possibly the most fun hackathon on this entire list.',
    image: stupidImg,
  },
];

export { hackathons };
