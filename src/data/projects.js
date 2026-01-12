import streetRoamer from '../assets/street-roamer-s3000.jpg';
import utmLive from '../assets/utm-live.jpg';
import organese from '../assets/organese.jpg';
import gooseGoGeese from '../assets/goosegogeese.jpg';
import jobHunter from '../assets/job-hunter.jpg';
import resumeBuilder from '../assets/resume-builder.jpg';
import operaid from '../assets/operaid.jpg';
import wordDiff from '../assets/word-diff.jpg';
import yaas from '../assets/yaas.jpg';
import imageGallery from '../assets/image-gallery.jpg';
import leReplacer from '../assets/lereplacer.jpg';
import resumeForMe from '../assets/resume-for-me.jpg';
import paint from '../assets/paint.jpg';
import lightUpTheShadow from '../assets/light-up-the-shadow.jpg';
import catchIt from '../assets/catch-it.jpg';

export const projects = [
  {
    id: 1,
    title: "Street Roamer S3000 | WallyHacks, Winner 🏆",
    description: "A robot that can detect faulty street lights and bumpy obstacles by just sensing the road",
    technologies: ["C++", "Arduino"],
    githubUrl: "https://github.com/scriptgenerator64/wallyhacks-redhackhackers",
    liveUrl: "https://devpost.com/software/street-roamer-s3000",
    image: streetRoamer,
    category: "hackathon"
  },
  {
    id: 2,
    title: "Resume Builder",
    description: "A basic resume builder, tailors resumes and produces keyword-optimized PDFs for ATS scoring",
    technologies: ["Python", "OpenAI", "Tkinter", "PyQt5"],
    githubUrl: "https://github.com/notjackl3/resume-builder",
    image: resumeBuilder,
    category: "personal"
  },
  {
    id: 3,
    title: "YouTube as a Service",
    description: "An unlimited storage app, losslessly compresses/retrieves any files into/from YouTube videos",
    technologies: ["Python", "JavaScript", "OpenCV", "Numpy", "Google Cloud Platform", "AWS"],
    githubUrl: "https://github.com/notjackl3/youtube-as-a-service",
    image: yaas,
    category: "personal"
  },
  {
    id: 4,
    title: "Word Diff",
    description: "A version control app, users can track real-time changes between two offline Word documents",
    technologies: ["Python/Flask", "Python-docx"],
    githubUrl: "https://github.com/notjackl3/word-diff",
    image: wordDiff,
    category: "personal"
  },
  {
    id: 5,
    title: "Job Hunter",
    description: "Automated job application tracker and dashboard for streamlined career hunting",
    technologies: ["Python/Django", "Beautiful Soup", "OpenAI", "PostgreSQL", "Matplotlib"],
    githubUrl: "https://github.com/notjackl3/job-hunter",
    image: jobHunter,
    category: "personal"
  },
  {
    id: 6,
    title: "Organese",
    description: "A scheduling app to create personalized timetables, share bookings, and manage tasks",
    technologies: ["Python/Django", "JavaScript", "Bootstrap", "PostgreSQL"],
    githubUrl: "https://github.com/notjackl3/organese",  
    image: organese,
    category: "personal"
  },
  {
    id: 7,
    title: "Image Gallery",
    description: "An image gallery using many cloud technologies, users can upload/download images publicly",
    technologies: ["Python/FastAPI", "AWS"],
    githubUrl: "https://github.com/notjackl3/image-gallery",
    image: imageGallery,
    category: "personal"
  },
  {
    id: 8,
    title: "UTM Live",
    description: "An interactive 3D map that allows students to find the perfect study spots around campus!",
    technologies: ["Python/Django", "Mapbox", "PostgreSQL"],
    githubUrl: "https://github.com/notjackl3/utm-live",
    liveUrl: "https://jack-le.com/utm-live.onrender.com/",
    image: utmLive,
    category: "personal"
  },
  {
    id: 9,
    title: "GooseGoGeese | Hack The North 2025",
    description: "A minigame that detects humans and objects, then a series of tasks chosen by your friends must be completed!",
    technologies: ["Python/FastAPI", "JavaScript/React.js", "Tailwind", "YOLO", "OpenCV", "MediaPipe"],
    githubUrl: "https://github.com/notjackl3/HTN2025",
    image: gooseGoGeese,
    category: "hackathon"
  },
  {
    id: 10,
    title: "Resume For Me",
    description: "A feature-based resume builder, helps students craft their resume easily following Jake's template",
    technologies: ["Python/Django", "JavaScript/React.js", "Tailwind", "AWS"],
    githubUrl: "https://github.com/notjackl3/jake-resume-for-me",
    image: resumeForMe,
    category: "personal"
  },
  {
    id: 11,
    title: "Operaid | TechTO Hackathon",
    description: "A voice-controlled solution for doctors to look up and record patient information",
    technologies: ["Python/FastAPI", "JavaScript/React.js", "Tailwind", "PostgreSQL/Supabase", "ElevenLabs", "OpenAI"],
    githubUrl: "https://generous-cogwheel-353742.framer.app/",
    liveUrl: "https://operaid.vercel.app/",
    image: operaid,
    category: "hackathon"
  },
  {
    id: 12,
    title: "Paint App",
    description: "An interactive paint app, allows users to draw on a canvas with functionalities just like Photoshop",
    technologies: ["Java", "JavaFX", "JUnit"],
    image: paint,
    category: "school"
  },
  {
    id: 13,
    title: "Light Up The Shadow",
    description: "A survival game where the player must navigate through the board to complete quests while avoiding the shadows",
    technologies: ["Assembly"],
    image: lightUpTheShadow,
    category: "school"
  },
  {
    id: 14,
    title: "LeReplacer | Go On Hack, Winner 🏆",
    description: "A Google extension that uses face-detection algorithms to replace all the faces on your screen with LeBron James",
    technologies: ["JavaScript/Node.js", "MediaPipe", "Twitter API", "Gemini API"],
    githubUrl: "https://github.com/ShreyShingala/LeReplacerExtension",
    liveUrl: "https://devpost.com/software/lereplacer",
    image: leReplacer,
    category: "hackathon"
  },
  {
    id: 15,
    title: "Catch It",
    description: "A cross-platform mobile/web app that allows commuters to search public transportation with multiple stops and routes (something current maps lack)",
    technologies: ["TypeScript", "React Native", "Google Cloud Platform"],
    githubUrl: "https://github.com/notjackl3/catch-it",
    liveUrl: "https://catch-it-sigma.vercel.app/",
    image: catchIt,
    category: "personal"
  }
];
