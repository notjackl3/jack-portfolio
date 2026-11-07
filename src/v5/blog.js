// Write-ups of events Jack went to or ran, lifted from his LinkedIn posts.
// The prose is his own, near-verbatim: what was cut is the tagging — the
// paragraphs that are only a list of people to thank — and the link
// shorteners, which no longer resolve outside LinkedIn. v5 lowercases the
// prose and drops the emoji at render time, like everywhere else on the site.
//
// `body` is paragraphs. A paragraph opening with "- " or "1. " is a list
// item; Blog.jsx groups consecutive ones into a single list.
//
// `category` is what Jack was doing there, and drives the filter row:
// 'hackathon' he competed, judged or spoke at; 'organizing' he ran;
// 'office' a company tour; 'event' a summit, meetup or retreat.
export const blog = [
  {
    slug: 'soon-fall-2026-recap',
    date: '2026-11-02',
    category: 'organizing',
    images: [
    ],
    title: 'SOON Fall 2026 has come to an end 💚💙',
    body: [
      'Over one unforgettable weekend, our houses were filled with workshops, late-night hacking, activities, campfire a capella, karaoke, fireworks, volleyball matches, and so much more!',
      'The projects were incredible, but the conversations, friendships, and memories made throughout the weekend are what made SOON truly special.',
      'See everyone again SOON!',
    ],
  },
  {
    slug: 'the-foundry-water',
    date: '2026-10-22',
    category: 'organizing',
    images: [
      { src: '/blog/the-foundry-water-2.webp', w: 800, h: 418 },
      { src: '/blog/the-foundry-water-3.webp', w: 800, h: 418 },
      { src: '/blog/the-foundry-water-4.webp', w: 800, h: 418 },
      { src: '/blog/the-foundry-water-5.webp', w: 800, h: 418 },
    ],
    title: 'We brought 4 generations together for a charity hackathon, to help solve problems for millions of people around the globe! 💧',
    body: [
      'Last weekend, I co-hosted The Foundry Vol. I: Water, a multi-generational charity hackathon, bringing together 60 builders across all age groups to tackle real-world challenges for WaterAid Canada, our partner charity.',
      'Thanks to the help of The AI Fellowship, Toronto Metropolitan University, Glacier Fresh, WaterH Inc., and SOON, we were able to bring together 4 different generations to collaborate in teams, combining different experiences to solve ongoing global problems.',
      'Every project was impressive in its own way, and some will have the opportunity to pitch further to WaterAid. Our mission is to use technology to help directly impact millions of people around the globe for good.',
      'After attending and organizing so many hackathons, 22 this year, this one made me realize that hackathons don\'t always have to be about winning prizes or building startups. In the right hands, hackathons can change lives.',
      'Can\'t wait to work with more charities in the future!',
    ],
  },
  {
    slug: 'agiv-cottage-retreat',
    date: '2026-09-04',
    category: 'event',
    images: [
      { src: '/blog/agiv-cottage-retreat-2.webp', w: 800, h: 418 },
      { src: '/blog/agiv-cottage-retreat-3.webp', w: 800, h: 418 },
      { src: '/blog/agiv-cottage-retreat-4.webp', w: 800, h: 418 },
      { src: '/blog/agiv-cottage-retreat-5.webp', w: 800, h: 418 },
    ],
    title: 'I traveled 9 hours to stay at a cottage with 20 strangers for a weekend 🪵',
    body: [
      'Last weekend, I was selected among the top builders to come to Ottawa for a cottage retreat by AGIV BUILDERS. Everyone came to ship unique products over the weekend, while enjoying the best food services (steak!!) and unlimited activities.',
      'At the cottage, I’ve experimented with reconstructing 3D environments (again), but for outdoors this time. Devin by Cognition was incredibly helpful throughout the process, managing my agents, finding the right open-source resources, and helping me to capture our entire cottage into a relivable experience.',
      'We meditated, went kayaking, played ping-pong, arcade games, axe throwing,...and spent time enjoying the cottage together. Huge thanks to Damian Polan and Lila Galipeau for giving me a ride there, and to Michael Golubev for riding me on the way back. Can’t wait come back for the next one!',
      'I met strangers (who then become friends!) who taught me about software, entrepreneurship, and growing a business. Every conversation gave me a new perspective, and I genuinely loved being surrounded by people who were excited to share what they knew.',
    ],
  },
  {
    slug: 'toronto-tech-week',
    date: '2026-06-01',
    category: 'event',
    images: [
      { src: '/blog/toronto-tech-week-2.webp', w: 800, h: 418 },
      { src: '/blog/toronto-tech-week-3.webp', w: 800, h: 418 },
      { src: '/blog/toronto-tech-week-4.webp', w: 800, h: 418 },
      { src: '/blog/toronto-tech-week-5.webp', w: 800, h: 418 },
    ],
    title: '7 days, 7 Toronto Tech Week events 🕺',
    body: [
      'On Sunday, I returned to hackathons as a hacker! Super proud to see Akira Takaki, Victoria Chernobay building SANDBOX TORONTO in 11 days with insanely creative concepts, an amazing venue, and good foooood. Somehow managed to win Pokemon cards for pitching about “how to rob someone” lol.',
      'On Monday, I came to DevTools meetup to meet some of the most technical developers (at some point I didn’t know what they are talking about), hearing how Jay V built his tool for 7.5M+ developers, and chatting with Josh Allishaw, Tridhatri Vallamkondu, Sahand Seifi. Thanks to Ben Vinegar for organizing this.',
      'On Tuesday afternoon, I attended the Innovation hackathon which was so well-organized by Berto Mill and the Disruptive Edge team. Super hyped to see Akira Takaki getting invited to present his project from SOON here.',
      'On Tuesday night, we ended up crashing at a Schulich School of Business - York University party right after, continuing the journey of meeting cool people (engineers, DJ, business owners, etc.)',
      'On Wednesday, I went to Homecoming, the largest event of the week, hearing from the most talented CEOs and founders on stage, while learning so much insights from those around me in the audience, great to meet Sarah Rea, Jeffrey Kwong, and some others I forgot to ask for their contacts! Love all the free swags, ice cream, and life lessons.',
      'On Wednesday night, I went to a Cohere party (one of the craziest parties I have been to).  Meeting the Mayor of Toronto Olivia Chow, the founders of Cohere Ivan Zhang, Nick Frosst, talking to the most brilliant engineers, making meaningful connections, even getting my name engraved into swags, and coming up with fun party games, the list goes on. Hello to Amy Chen, Baran Nasiri, Noah van Hart, Ilya Brotzky, Aarya Prakash,... Then after the party, I crashed at my friend’s place to play board games (Catan) until 5am.',
      'On Thursday, it was a rest day, phew.',
      'On Friday afternoon, I went to a meetup for hackathon organizers to pitch SOON to Sokmontrey Sythat and Jason Cao and hopefully inspire others to join us to create the most unique tech events in Canada.',
      'On Friday night, we participated in the NVIDIA hackathon (yes, the real NVIDIA). Amazing event hosted by Shambhavi Mishra and Kiana Steele. Besides all the technical aspects, we had a chance to eat actually good food at a hackathon. Got a bit too distracted with the in-door ping pong, pool tables, arcade machines, table football, and basketball hoops (will get this for my office one day).',
      'On Saturday and Sunday, we continued the hackathon! And again last week had been so much fun thanks to Steric Tsui, Timothy Khan, Stanley Pang, and Kenny Wu for grinding these sidequests with me. Let’s do more in the future SOON!',
    ],
  },
  {
    slug: 'amazon-fulfillment-centre',
    date: '2026-02-12',
    category: 'office',
    images: [
      { src: '/blog/amazon-fulfillment-centre-2.webp', w: 800, h: 418 },
      { src: '/blog/amazon-fulfillment-centre-3.webp', w: 800, h: 418 },
      { src: '/blog/amazon-fulfillment-centre-4.webp', w: 800, h: 418 },
      { src: '/blog/amazon-fulfillment-centre-5.webp', w: 800, h: 418 },
    ],
    title: 'I went to Amazon office, not the one for humans, but the one where robots live 🤖',
    body: [
      'I arrived at Amazon’s fulfillment center, waiting to be fulfilled. And yes, I was satisfied by just witnessing over 10,000 robots operating in perfect coordination, in an 850,000-square-foot factory.',
      'They took all of our phones, so I couldn’t capture images inside (but a stock image is attached below), thus my memory will be shallow, but here were what I took away from the tour:',
      '- Each floor, 1,000 robots moved constantly with no traffic accidents! (even when a human came into the matrix, the robots will navigate around them)',
      '- Each robot can carry up to 700 pounds',
      '- AI is utilized in the process to track exactly where all packages are going',
      '- Computer vision detected exactly the size of the items, dispensed the correct box and tape sizes efficiently',
      '- The angle and color of workstation lighting is optimized in a way to improve the employee’s focus (backed by psychology!)',
      '- There were multiplayer games where employees can compete in to see who earns more points (by packing more items)',
      '- More than 13 miles of conveyor belts were running non-stop',
      '- The entire ecosystem took into consideration the size, the weight of each item, where it was heading, the drop-off dates, who was the buyer, the seller, etc.',
      '- A wall of names was decorated to honor loyal employees, some worked here for 15 years',
      'Funny enough, this tour made me realize AI and robots still couldn\'t replace humans just yet, as some of the packages flew off the conveyor belt LOL, but it rarely happened.',
      'Seeing how software translates into physical motion at this scale was surreal. It reminded me that behind every “Order” button is an ecosystem of AI, automation, and engineering behind the screen.',
      'Massive respect to the engineers who design systems like this.',
    ],
  },
  {
    slug: 'shopify-office-tour',
    date: '2025-12-12',
    category: 'office',
    images: [
      { src: '/blog/shopify-office-tour-2.webp', w: 800, h: 800 },
      { src: '/blog/shopify-office-tour-3.webp', w: 800, h: 800 },
      { src: '/blog/shopify-office-tour-4.webp', w: 800, h: 800 },
      { src: '/blog/shopify-office-tour-5.webp', w: 800, h: 800 },
    ],
    title: 'I have 5 final exams, but I’d never be too busy for the Shopify office tour! 🛍️',
    body: [
      'Karaoke room, movie theatre, indoor garden, yoga studio, unlimited snacks, 3D printed candies, ping pong tables, and a car inside the office…? These were just a few out of all the unique things I saw at the Shopify office. It was mind-blowing.',
      'The space is filled with unique architectural designs that make every corner feel like a new environment. I also had the opportunity to speak with the VP & Head of Engineering at Shopify, Farhan Thawar, and the insights I gained from that conversation were truly eye-opening. One quote that has stayed with me is his reminding that “you grow the most when you surround yourself with smartest people and getting into the hardest problems.”',
      'I also had the chance to connect with incredible people, each of whom brought inspiring perspectives and energy to the tour. Through our conversations, I gained a much deeper understanding of Shopify’s culture and what the future application process might look like. I’m truly grateful for the insights they shared.',
      'This visit left me more motivated than ever to keep pushing forward. One day, I hope to contribute to a place as innovative as Shopify.',
    ],
  },
  {
    slug: 'deloitte-office',
    date: '2025-11-30',
    category: 'office',
    images: [
      { src: '/blog/deloitte-office-2.webp', w: 800, h: 800 },
      { src: '/blog/deloitte-office-3.webp', w: 612, h: 612 },
      { src: '/blog/deloitte-office-4.webp', w: 800, h: 800 },
      { src: '/blog/deloitte-office-5.webp', w: 800, h: 800 },
    ],
    title: 'I arrived at the Deloitte office and was surrounded by the most well-dressed people! 🥂',
    body: [
      'Entering the consulting world and visiting the Deloitte office in Toronto left me with unforgettable memories. From beautifully designed open-concept workspaces to quiet corners for deep focus, the office seems to strike the perfect balance between professionalism and comfort. My favorite part was the absolutely stunning green neon stairs in the center, where all floors are connected elegantly. And of course, the views of downtown Toronto were absolutely breathtaking.',
      'But the highlight of this visit wasn’t just the environment, it was the people. I got to connect with amazing students and speak with Deloitte professionals who generously shared their experiences in finance, consulting, and strategy.',
    ],
  },
  {
    slug: 'google-devfest',
    date: '2025-11-17',
    category: 'event',
    images: [
      { src: '/blog/google-devfest-2.webp', w: 800, h: 800 },
      { src: '/blog/google-devfest-3.webp', w: 800, h: 800 },
      { src: '/blog/google-devfest-4.webp', w: 800, h: 800 },
      { src: '/blog/google-devfest-5.webp', w: 800, h: 800 },
    ],
    title: '500+ people in the room, and I got the mic! 🎤',
    body: [
      'Google’s DevFest 2025 was the biggest hands-on workshop I’ve ever attended, and also the first time I pushed myself to take the mic, and asked questions in front of a crowd that size.',
      'We spent the entire day building, experimenting, and breaking things (on purpose) with Google Cloud and Gemini CLI agent. We were guided through practical labs that took us from zero to deploying a real ML-powered Gmail add-on.',
      'The workshops were highly interactive, filled with passionate developers, students, and industry professionals who were all there to experiment and learn. I met so many amazing people, listened to great keynotes, and chatted with incredible mentors.',
    ],
  },
  {
    slug: 'emberhacks',
    date: '2025-10-31',
    category: 'organizing',
    images: [
      { src: '/blog/emberhacks-2.webp', w: 800, h: 800 },
      { src: '/blog/emberhacks-3.webp', w: 800, h: 800 },
      { src: '/blog/emberhacks-4.webp', w: 800, h: 800 },
      { src: '/blog/emberhacks-5.webp', w: 800, h: 800 },
    ],
    title: 'Organized my first hackathon and it was fire! 🔥',
    body: [
      'Last weekend, we hosted EmberHacks, University of Toronto Society for Algorithmic Modelling’s first-ever hackathon which lasted for 36 hours! Our mission was to bring UofT students together to build projects around the theme of Education, and with over 120+ hackers signed-up and countless inspiring submissions.',
      'Our judges ranged from software developers to professors, and several projects even caught the attention of faculty members, some may soon be implemented in real courses! Teams built amazing tools like an integrated VS plugin, accessibility apps for those with dyslexia, and platforms connecting courses’ knowledge to help students visualize their educational path ways.',
      'The hackers’ hard work was paid off with awesome prizes, from airpods and headphones to gaming mice and more! We even hosted a cup-stacking challenge, and the winner of cup stacking also took first place in the hackathon!',
      'Staying overnight, meeting new friends, and watching this event coming together was an unforgettable experience. I can’t wait to do this again next year and continue building the legacy of EmberHacks. 🔥',
    ],
  },
  {
    slug: 'google-office',
    date: '2025-10-21',
    category: 'office',
    images: [
      { src: '/blog/google-office-2.webp', w: 800, h: 800 },
      { src: '/blog/google-office-3.webp', w: 800, h: 800 },
      { src: '/blog/google-office-4.webp', w: 800, h: 800 },
      { src: '/blog/google-office-5.webp', w: 800, h: 800 },
    ],
    title: 'Skipped my midterm to visit the Google office, was it worth it? 🔵🟢🟡🔴',
    body: [
      'By far, the most impressive office I’ve ever visited! From a game room with PlayStations, pool, and football tables to indoor golf, the fun never stops. There are also music production rooms, 3D printing labs, and even a cozy corner for your pets. And the food? From Asian cuisines to Western classics, there will always be something that matches your taste. There was also a secret door built into the wall…WHAT?',
      'The most unique thing about this Google office was how each floor and room is designed around Canadian culture, with themes celebrating famous places and people from across the country. As an international student who is still exploring Canada, it was amazing to experience how deeply Google embraces and celebrates its roots in the local culture.',
      'The event wasn’t just about the office tour, it was also an incredible learning experience. I had the chance to meet like-minded friends, chat with current Googlers about their exciting career journeys, and gain insights that will definitely help shape my future.',
      'This experience has truly motivated me to push even harder in my own journey. One day, I hope to call this place home.',
    ],
  },
  {
    slug: 'aws-summit',
    date: '2025-09-08',
    category: 'event',
    images: [
      { src: '/blog/aws-summit-2.webp', w: 800, h: 800 },
      { src: '/blog/aws-summit-3.webp', w: 800, h: 800 },
      { src: '/blog/aws-summit-4.webp', w: 800, h: 800 },
      { src: '/blog/aws-summit-5.webp', w: 800, h: 800 },
    ],
    title: 'woke up at 4 AM, skipped 3 lectures, 2-hour commute, all for 1 AWS Summit',
    body: [
      'I would never expected an event to offer so many opportunities to meet new people and learn cutting-edge technologies.',
      'I was lucky enough to meet Narges Nezhad, a fellow UofT student. For the next 10 hours, we explored AWS partner booths, attended workshops and keynotes, and made lasting memories.',
      'One highlight was participating in the AWS AI League, where I trained an AI model to become a "true local Toronto tour guide." Stakes were high - the winner earned a ticket to Las Vegas! I stepped out of my comfort zone to clean datasets, fine-tune training data, and build my model. Out of 60+ submissions, my AI buddy ranked 18th 🎉!',
      'The summit brought together people from all over the world, I met many people from Vancouver, the US, and the UK as well! As a student, connecting with industry professionals gave me fresh perspectives on the job market and my own career goals. Huge thanks to everyone I met! Special shoutouts to Suleiman Sadiq for his inspiring stories, and Musa Musayev for his amazing keynote!',
      'I’ll keep chasing opportunities like this, and maybe next time, I’ll come as a speaker. Who knows?',
    ],
  },
  {
    slug: 'codequest-orientation',
    date: '2025-09-02',
    category: 'organizing',
    images: [
      { src: '/blog/codequest-orientation-2.webp', w: 800, h: 800 },
      { src: '/blog/codequest-orientation-3.webp', w: 800, h: 800 },
      { src: '/blog/codequest-orientation-4.webp', w: 800, h: 800 },
      { src: '/blog/codequest-orientation-5.webp', w: 800, h: 800 },
    ],
    title: '4x more participants than expected (100+), thank you everyone for coming',
    body: [
      'My first year orientation felt like yesterday. Now as a second year student, I’m excited to bring back the same energy from last year. Before the event even began, I spent 7 hours straight at the tabling event with my team, spreading the word about CodeQuest!',
      'We led students into the world of hedgehogs and explore the UTM campus, while solving tricky, but exciting problems related to Math and Computer Science. Along the way, they were asked to snap selfies to prove their progress, but most importantly, to create unforgettable memories.',
      'Stay tuned for what\'s to come in the school year, I will see you all soon!',
    ],
  },
  {
    slug: 'microsoft-headquarters',
    date: '2025-08-31',
    category: 'office',
    images: [
      { src: '/blog/microsoft-headquarters-2.webp', w: 800, h: 800 },
      { src: '/blog/microsoft-headquarters-3.webp', w: 800, h: 450 },
      { src: '/blog/microsoft-headquarters-4.webp', w: 800, h: 800 },
      { src: '/blog/microsoft-headquarters-5.webp', w: 800, h: 800 },
    ],
    title: 'somehow, I landed at Microsoft Canadian Headquarters!',
    body: [
      'This is a true story: Two weeks before, I walked by the CIBC SQUARE and wondered if I can go up there. Exactly one week later, I received an invitation to attend a project showcase on the 43rd floor, at the Microsoft Headquarter!',
      'This was an astonishing experience. I had the pleasure to sit among senior students and industry professionals to hear about many innovative AI/ML research projects. I took the opportunity to ask questions and engage in meaningful conversations.',
      'Many years from now, hopefully I will look back at these pictures and see how much I have grown by then. Good luck to you, Jack the future - best wishes from Jack the present.',
    ],
  },
];

export default blog;
