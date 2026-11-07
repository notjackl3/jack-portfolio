// The hackathons Jack wrote up on LinkedIn, lifted out of blog.js: the
// hackathons tab is the one place on the site that is about hackathons, so
// the blog no longer carries a category for them. Same shape as a blog
// entry — Posts.jsx renders both — and the photos still live in
// public/blog/, under the names they were exported with.
//
// `award` is what the write-up itself says was won, and only that — the
// entries without one (BearHacks, TechTO) are the ones Jack didn't win.
// Streak.jsx shows it as a medal or a trophy, never as words.
//
// `name` is the hackathon, and it is what the list shows — on a page of
// hackathons the event is what you are looking for, not the headline Jack
// wrote for LinkedIn. `title` is that headline, kept because it is the
// source wording and it says what the weekend was for.
//
// `body` is paragraphs. A paragraph opening with "- " or "1. " is a list
// item; Posts.jsx groups consecutive ones into a single list.
//
// `date` is the day Jack posted, except where the event's own dates are
// known — SOON Fall 2026 carries the weekend it ran, not the write-up's.
//
// Newest first. The streak above it runs oldest first, because it is one
// story told in order; these are separate weekends, so the latest leads.
export const hackathonPosts = [
  {
    slug: 'soon-fall-2026-mansion',
    name: 'SOON Fall 2026',
    date: '2026-10-23',
    dateEnd: '2026-10-25',
    images: [
      { src: '/blog/soon-fall-2026-mansion-1.webp', w: 800, h: 418 },
      { src: '/blog/soon-fall-2026-mansion-2.webp', w: 800, h: 418 },
      { src: '/blog/soon-fall-2026-mansion-3.webp', w: 800, h: 418 },
      { src: '/blog/soon-fall-2026-mansion-4.webp', w: 800, h: 418 },
    ],
    title: 'First ever hackathon at a private mansion in Canada, we just wrapped up our second SOON hackathon this year! 🏡',
    body: [
      'I had a chance to work with my amazing team to create the most memorable hackathon ever. Here are a few incredible moments we were able to pull off this iteration:',
      '- launched fireworks and smoke bombs',
      '- bought sushi and sashimi for dinner',
      '- got 2 houses, 1 for hackers to vibe and get their own rooms, 1 for sponsors to rest',
      '- wrote custom postcards and prepared polaroids for all hackers, guests, and sponsors',
      '- gathered everyone around campfire (both nights) with ukulele playing, lighting sparklers, and s’mores',
      '- completely rebranded, had marketing guidelines, beautiful merch designs',
      '- gave out merchs: sweaters, stickers, tote bags',
      '- bought prizes hackers will actually use: airpods, perfumes, digicam, etc.',
      '- organized 3 different onsite workshops',
      '- captured unique drone shots, and had 2 amazing photographers',
      '- gained support from Celsius and healthy snacks Low Carb Co',
      '- treated the organizing team with nice dinners!',
      '- and many many more…',
      'It’s crazy to say this because 5 months ago, at our first ever event, we didn’t have bedrooms for hackers, we had to cook meals ourselves to save cost, there was no merch, no photographers,.... Looking back, it’s crazy to see how much we have grown in such a short amount of time, thanks to our talented team!',
      'If we could pull these off, from scratch, in 8 months, I\'m excited to see what we will be able to accomplish in 1, 2 years ahead. Make sure to follow SOON to see our journey!',
    ],
  },
  {
    slug: 'hack-the-north',
    name: 'Hack the North',
    award: 'Sentry prize track',
    date: '2026-09-21',
    images: [
      { src: '/blog/hack-the-north-2.webp', w: 800, h: 418 },
      { src: '/blog/hack-the-north-3.webp', w: 800, h: 418 },
      { src: '/blog/hack-the-north-4.webp', w: 800, h: 418 },
      { src: '/blog/hack-the-north-5.webp', w: 800, h: 418 },
    ],
    title: 'It took me one year to win Hack the North 🏆',
    body: [
      'HTN 2025 was my first hackathon, I didn’t know what to do, came for the food, and ended the weekend not submitting any project. Fast forward a year, I have competed/judged/organized 28 hackathons. This is my 29th one…and I completed my last year’s mission, to win Canada’s largest hackathon! 🇨🇦',
      'Huge thanks to my teammates Ji Sung Han, Phineas Truong, Ethan Qiu for planning and building this insanely complex project with me. I had a chance to get hands-on experiences with GPUs, chips, inference, and distributed network systems. This won us the Sentry prize track!',
      'We made a platform so people can rent out any devices around the globe: pc, macbook, windows, iphone, ipad, etc. We allow any device to run LLM training, simulations, and rendering. It’s an orchestration agent that agentically splits up parallel tasks and distributes it across the network of devices.',
      'Our team also worked on ways to improve AI inference and source codes for chips. Running jobs on an AMD chip is different from NVIDIA. We helped migrate and optimize the codes directly to increase efficiency. All of these context are then fed back into the RL loop to improve future runs.',
      'Besides the nerdy work, we had fun hacking into our hacker badge machine, grabbing korean fried chickens, and sharing life stories in the middle of the night (while surviving on 2 hours of sleep).',
      '0 to 29 hackathons in a year, I really wonder what can happen now in the next 12 months.',
    ],
  },
  {
    slug: 'summerhacks-spark',
    name: 'SummerHacks',
    award: '1st Place main track + 2nd Place TECHNATION track',
    date: '2026-08-10',
    images: [
      { src: '/blog/summerhacks-spark-2.webp', w: 800, h: 418 },
      { src: '/blog/summerhacks-spark-3.webp', w: 800, h: 418 },
      { src: '/blog/summerhacks-spark-4.webp', w: 800, h: 418 },
      { src: '/blog/summerhacks-spark-5.webp', w: 800, h: 418 },
    ],
    title: 'Back to back to back hackathon win (1st place🥇), we reconstructed 3D environments of your memories, captured by a moving rover 📸',
    body: [
      'To make this happen, we built a rover to follow you, a mobile app to capture the environment, and a web app to process and display the results. We won 1st place for main track, and 2nd place for TECHNATION track!',
      'Our camera recorded videos, sent over wifi hotspot to my laptop, which trained a 3D gaussian splat in real time. With AR tracking, LiDAR depth, GPS, and camera pose data, we didn’t need to predict any movement (which all APIs do, and that takes a LONG time). Ours happened locally, built on top of open source, environment reconstruction (Brush), voice transcript (Whisper), and object detection (YOLO).',
      'We also had a rover to attach your phone on. The mobile app created a heatmap of the environment to tell the rover exactly which area to go to capture missing angles. All the materials are bought ($150), and built from scratch. We won $1600 tho!',
      'Every scan lands in an album of moments, auto-pinned to a 3D map. You will be able to recover your fun conversation, find objects you might have lost, and relive the moment (we also create a capture feature which turns a single frame of blurry images into a clear one).',
      'Big WWW to my team Matthew Sakhno (bro built the rover from scratch), Aman Shah, Saivenkat Jilla. It was a super fun 24 hours, we went around and gaussian splatting everyone!',
      'Another shout out to the SummerHacks organizing team for booking out Stackt market, and organizing all the events. Love to see new, untraditional hackathons popping up (we are tired of frozen pizzas and campus buildings)!',
    ],
  },
  {
    slug: 'hack-the-6ix-feetball',
    name: 'Hack the 6ix',
    award: 'ElevenLabs prize track',
    date: '2026-07-20',
    images: [
      { src: '/blog/hack-the-6ix-feetball-2.webp', w: 800, h: 418 },
      { src: '/blog/hack-the-6ix-feetball-3.webp', w: 800, h: 418 },
      { src: '/blog/hack-the-6ix-feetball-4.webp', w: 800, h: 418 },
      { src: '/blog/hack-the-6ix-feetball-5.webp', w: 800, h: 418 },
    ],
    title: 'Back to back hackathon win, we trained 22 AI agents to play football, then make 1000+ other agents bet on the match ⚽',
    body: [
      'We fed 50+ football matches data with coordinates of players and ball every millisecond to train LLM models on how to play football. This was my first time training a model. I had a chance to turn buzzwords like MLP neural net, standardized regression, cross-entropy method,...into real knowledge.',
      'While these agents are playing the game, we made the 1000+ audience in the crowd (which you can enter into their POV) to bet on the match in real time based on the events that are happening. We also brought the Meta Quest to allow anyone to enter the live game and fly as a drone around the stadium.',
      'Other features include custom formation, team playing styles, overriding an agent to manually control a player, starting a Mexican wave, replay system, live commentator in 4 different languages...or you can enter the ball POV too LOL.',
      'Huge shoutout to my team Timothy Khan, Kenny Wu, Steric Tsui. And Stanley Pang as our greatest cheerleader and emotional support. We don\'t just hack but singing karaoke at midnight, playing boardgames, or going on meaningless walks...and also won the ElevenLabs prize track.',
      'Big thanks to Dorothy Zheng, Erin Manalo, and the rest of the Hack the 6ix team for the amazing experiences, it\'s their 12th iteration and it\'s my first time but for sure not the last!',
    ],
  },
  {
    slug: 'genai-fund-vietnam',
    name: 'GenAI Fund Vietnam',
    award: 'Winner, two tracks',
    date: '2026-07-13',
    images: [
      { src: '/blog/genai-fund-vietnam-2.webp', w: 800, h: 418 },
      { src: '/blog/genai-fund-vietnam-3.webp', w: 800, h: 418 },
      { src: '/blog/genai-fund-vietnam-4.webp', w: 800, h: 418 },
      { src: '/blog/genai-fund-vietnam-5.webp', w: 800, h: 418 },
    ],
    title: 'Coming back to hackathons, we won $26K+ at the largest AI hackathon in Southeast Asia 🇻🇳 (10th hackathon win!)',
    body: [
      'I was 14,000km away, helping out my team in Vietnam to build 2 different projects for 2 different tracks last weekend. The most special thing for me is that Sy Anh Lu, Jaejin Cho, Tony Truong are from the same high school as me, BISHCMC. It was great now coming back to Vietnam (virtually) as an alumni and had a chance to contribute to the big win. Shout out Phineas Truong for grinding over the weekend, this is our 7th hackathon win together!',
      'We won $26,300 in prizes (in api credits tho) but $15,000 of that is OpenAI credits (crazy!) along with a year-long ChatGPT plan. Super proud as well to see Vietnam starting to enter the hackathon world, with some of the largest tech companies in the world as sponsors and over 2,500+ participants!',
      'What we created was an ideation pipeline for VNG to test out 2 different skinlines, they would be able to turn these skins into reality by generating realistic 3D models. Then we take that and run a public opinion simulation (inspired by MiroFish), where we simulate thousands of AI models discussing together, each with a unique persona, reacting to the skins and giving feedbacks.',
      'I wish to come back to Vietnam sometime soon. I really missed out on the on-site free KFC chickens, World Cup match, and other fun activities…big thanks to GenAI Fund team for hosting this event!',
    ],
  },
  {
    slug: 'bearhacks-speaker-judge',
    name: 'BearHacks',
    date: '2026-04-27',
    images: [
      { src: '/blog/bearhacks-speaker-judge-2.webp', w: 800, h: 418 },
      { src: '/blog/bearhacks-speaker-judge-3.webp', w: 800, h: 418 },
      { src: '/blog/bearhacks-speaker-judge-4.webp', w: 800, h: 418 },
      { src: '/blog/bearhacks-speaker-judge-5.webp', w: 800, h: 418 },
    ],
    title: 'Back to hackathons…but now I came to inspire other hackers, as a speaker and a judge 🗣️🔥',
    body: [
      'BearHacks was one of the best hackathon experiences I have ever had. I will just list out some stuff here: high quality food, ice cream truck, hand-drawn portraits, mini golf for Scotiabank coffee chats, $9K+ in prizes, an entire indoor escape room??? But most impressively, judging was not delayed, unlike other experiences I have had…',
      'I was given a chance to speak in front of 70+ people, showing them my passion for hackathons and sharing my tips, tricks, and “unethical hacks”.',
      'Then the next day, I came back as a judge. Not even glazing, but these guys made 3D customizable rooms, a 4-leg robot, a talking vending machine, a drone, and Cursor for 3D modeling…Funny enough James Liang judged me last time in Hack Canada, now I judged him back lol.',
      'Everyone was just so well-coordinated, each with a walkie talkie!',
      'Among everyone, I was the only second year, I truly feel like the dumbest in the room (and I love this!). I learned so much from these guys!',
    ],
  },
  {
    slug: 'goonhacks-lebron',
    name: 'GoOnHacks',
    award: 'Best pitch',
    date: '2025-11-10',
    images: [
      { src: '/blog/goonhacks-lebron-2.webp', w: 800, h: 800 },
      { src: '/blog/goonhacks-lebron-3.webp', w: 800, h: 800 },
      { src: '/blog/goonhacks-lebron-4.webp', w: 800, h: 800 },
      { src: '/blog/goonhacks-lebron-5.webp', w: 800, h: 800 },
    ],
    title: 'We are hackathon winners at GoOnHacks! 🏆',
    body: [
      'This hackathon was all about weird ideas. Me, Phineas (Hoang Xuan Phuc) Truong, and Shrey Shingala teamed up (none of us had built a Chrome extension before) and created one that uses image detection and recognition algorithms to find every human face on your browser… and turns them all into LeBron James. 👑🏀',
      'It works everywhere - Google Images, Instagram, even your emails. Every face? LeBron. We even added a feature so you can pat LeBron on the screen (because, why not show the King some love?) and a Twitter bot that counts how many times you see LeBron and tweets about it while tagging famous celebrities.',
      'We built the extension using Chrome Extension Manifest V3. For computer vision, we used Google\'s Face Detection API to run real-time face detection, and created real-time image conversions. We also implemented a custom motion detection algorithm with Handtrack.js and TensorFlow.js using sliding windows, adaptive noise filtering, and hand tracking to detect motion. Finally, a Node.js backend with Twitter and OAuth APIs for our X bot.',
      'Throughout the event, we met amazing people, from the founder of GoOnHacks Zachary Yu, to the founders of TypeOS (Daniel Martinez and Musa Aqeel) who gave us resume advices, and tons of other brilliant hackers. We have seen projects ranging from a chair that automatically chases you, electrocute kit, and also a game controller made out of AirPods!',
      'We were so amazed that out of 800 people who signed up, 200 chosen hackers coming to the event...our project stood out to the judges! We even got free labubus at the end for having the best pitch!',
      'Huge thanks to everyone who made GoOnHacks such a blast (literally) - can’t wait to come back next year for round two! Woohoo!',
    ],
  },
  {
    slug: 'techto-hackathon',
    name: 'TechTO Hackathon',
    date: '2025-09-29',
    images: [
      { src: '/blog/techto-hackathon-2.webp', w: 800, h: 800 },
      { src: '/blog/techto-hackathon-3.webp', w: 800, h: 800 },
      { src: '/blog/techto-hackathon-4.webp', w: 800, h: 800 },
      { src: '/blog/techto-hackathon-5.webp', w: 800, h: 800 },
      { src: '/blog/techto-hackathon-6.webp', w: 800, h: 213 },
    ],
    title: '7 hours to transform healthcare at TechTO Hackathon! 🩻',
    body: [
      'I arrived two hours early to the event, only to be told by the receptionist that the event didn’t exist! For a moment, I thought I had the wrong day, until I met Chantal Nguyen, and we realized we were just really early.',
      'As a solo hacker, I was placed in a team with three incredible individuals: Yakshith Kommineni, Ishan Shah, and Danny Hu. All three were so so smart, and together we built OperAid, a voice-controlled tool to help doctors access patient data, scans, and notes without touching a keyboard.',
      'Based on our research, a doctor spends on average 2 minutes per patient just to look up their information, which is prone to human errors, especially during late night shifts. Our solution is simple, simply say “Pull up Jack’s MRI scans”, and the following files will appear! It was a collaborative effort where we had to generate a database of over 500+ patients, create a minimalist frontend, work on the backend for voice recognition and information lookup, make a skit for demo, and finally put them together as a website…in just 7 hours!',
      'After the event, I got to explore the city with my amazing “tour guide” Emi Sun who introduced me to a cozy Japanese restaurant and a bubble tea spot! I totally did not expect a 12-hour event to bring so many new memories and opportunities for me to meet new friends.',
      'This was one of the fastest but most meaningful events I\'ve been part of. Thank you Samit Khalsa for hosting this event. And thank you to everyone who made it special.',
    ],
  },
  {
    slug: 'wallyhacks',
    name: 'WallyHacks',
    award: '2nd Place',
    date: '2025-03-17',
    images: [
      { src: '/blog/wallyhacks-2.webp', w: 800, h: 800 },
      { src: '/blog/wallyhacks-3.webp', w: 680, h: 680 },
      { src: '/blog/wallyhacks-4.webp', w: 680, h: 680 },
      { src: '/blog/wallyhacks-5.webp', w: 800, h: 800 },
    ],
    title: 'first hackathon experience at WallyHacks!',
    body: [
      'I’m excited to share that our team took second place 🎉 at WallyHacks 2025 at the University of Toronto Mississauga! This one-day hardware hackathon, hosted by the UTM Robotics Club, focused on building innovative prototypes to tackle sustainability challenges in urban environments',
      'Street Roamer S3000 - We developed a sensor-based prototype that detects flickering streetlights and bumpy sidewalks to streamline urban maintenance. By replacing slow and costly manual inspections, we provided real-time monitoring that helps reduce energy waste, improve safety, and address infrastructure challenges. This data-driven approach supports smarter, more sustainable urban planning while reducing costs and environmental impact.',
      'How we did it - Our system detected faulty lights in real-time using a fine-tuned photoresistor capable of identifying flickering lights. A gyroscope was used to detect bumpy roads and measure tilt angles, maintaining stability of the robot. Additionally, an ultrasonic sensor for collision avoidance and object detection in low visibility.',
      'My role - I contributed by developing the system using C++ and fine-tuning the model to optimize sensor performance. I was also responsible for organizing the circuit connections effectively. Lastly, I designed the presentation slides, and edited the project video to showcase our work.',
      'What I have learnt - I gained hands-on experience with microcontrollers, sensor integration, and fine-tuning systems. I improved my problem-solving and teamwork skills while learning how to effectively communicate technical ideas. This experience reinforced the value of innovation and applying technology to create sustainable solutions.',
    ],
  },
];
