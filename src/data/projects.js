import streetRoamer from './assets/street-roamer-s3000.png';
import utmLive from './assets/utm-live.png';
import organese from './assets/organese.png';
import gooseGoGeese from './assets/goosegogeese.png';
import jobHunter from './assets/job-hunter.png';
import resumeBuilder from './assets/resume-builder.png';
import operaid from './assets/operaid.png';
import wordDiff from './assets/word-diff.png';
import yaas from './assets/yaas.png';
import imageGallery from './assets/image-gallery.png';
import lereplacer from './assets/lereplacer.png';
import resumeForMe from './assets/resume-for-me.png';

export const projects = [
  {
    id: 1,
    title: "Street Roamer S3000",
    description: "A high-performance autonomous navigation system for complex urban environments.",
    technologies: ["Python", "PyTorch", "ROS", "OpenCV"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: streetRoamer,
    category: "school"
  },
  {
    id: 2,
    title: "UTM Live | HackUTM",
    description: "Real-time campus event tracking and navigation for University of Toronto students.",
    technologies: ["React", "Firebase", "Google Maps API"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: utmLive,
    category: "hackathon"
  },
  {
    id: 3,
    title: "Organese | TOHacks",
    description: "AI-driven schedule optimizer that helps students manage extracurriculars and academics.",
    technologies: ["Node.js", "Express", "TensorFlow.js"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: organese,
    category: "hackathon"
  },
  {
    id: 4,
    title: "GooseGoGeese",
    description: "A fun, interactive multiplayer game featuring competitive goose-themed challenges.",
    technologies: ["Socket.io", "Canvas API", "Node.js"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: gooseGoGeese,
    category: "personal"
  },
  {
    id: 5,
    title: "Job Hunter",
    description: "Automated job application tracker and dashboard for streamlined career hunting.",
    technologies: ["React", "PostgreSQL", "FastAPI"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: jobHunter,
    category: "personal"
  },
  {
    id: 6,
    title: "Resume Builder",
    description: "Minimalist tool to generate ATS-friendly resumes in multiple professional formats.",
    technologies: ["React", "Tailwind CSS", "PDFKit"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: resumeBuilder,
    category: "personal"
  },
  {
    id: 7,
    title: "OperaID",
    description: "Biometric identification system designed for rapid access control in industrial settings.",
    technologies: ["Java", "SpringBoot", "Docker"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: operaid,
    category: "school"
  },
  {
    id: 8,
    title: "Word Diff",
    description: "A visual text comparison tool that highlights subtle differences between document versions.",
    technologies: ["React", "TypeScript", "Vite"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: wordDiff,
    category: "personal"
  },
  {
    id: 9,
    title: "YAAS",
    description: "Yet Another Auth Service - a highly secure, easy-to-integrate authentication provider for modern web apps.",
    technologies: ["Node.js", "Redis", "JWT", "OAuth"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: yaas,
    category: "personal"
  },
  {
    id: 10,
    title: "Image Gallery",
    description: "A responsive image gallery with advanced filtering and lightbox capabilities.",
    technologies: ["React", "Framer Motion", "Unsplash API"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: imageGallery,
    category: "personal"
  },
  {
    id: 11,
    title: "Le Replacer",
    description: "A versatile text replacement tool for bulk editing and code refactoring.",
    technologies: ["JavaScript", "Regex", "Node.js"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: lereplacer,
    category: "personal"
  },
  {
    id: 12,
    title: "Resume For Me",
    description: "AI-powered resume optimization tool that tailors your CV for specific job descriptions.",
    technologies: ["React", "OpenAI API", "Node.js"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    image: resumeForMe,
    category: "personal"
  }
];
