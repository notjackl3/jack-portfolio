const trgImages = Object.entries(
  import.meta.glob('./assets/trg/*.{png,jpg,jpeg}', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src);

const ccImages = Object.entries(
  import.meta.glob('./assets/cc/*.{png,jpg,jpeg,JPG,JPEG}', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src);

export const locationDetails = {
  "trg-international": {
    title: "TRG International",
    subtitle: "My first internship",
    description: "It was an HR role, but I created apps to improve my team's workflow. I represented TRG at career fairs, participated in CSR activities, and helped organised events for the company, even one involving the CEO himself!",
    images: trgImages
  },
  "utm-career-center": {
    title: "UTM Career Center",
    subtitle: "My first on-campus position",
    description: "I helped organize career fairs, guided students with resume building/job searching, and ensured that all materials were accessible to all 16,000+students.",
    images: ccImages
  },
  "go-on-hacks": {
    title: "Go On Hacks",
    subtitle: "My first software hackathon win 🏆",
    description: "I built my first ever Google extension for this hackathon, I learnt so many new things, and met very ambitious people!",
    images: []
  },
  "ember-hacks": {
    title: "EmberHacks",
    subtitle: "My first time organizing a hackathon",
    description: "I organized my first hackathon for 100+ hackers. I stayed back overnight and it was a wonderful experience!",
    images: []
  },
  "university-of-toronto": {
    title: "University of Toronto",
    subtitle: "My university",
    description: "I studied Computer Science at the University of Toronto, and I loved almost every moment of it!",
    images: []
  },
  "techto-hackathon": {
    title: "TechTO Hackathon",
    subtitle: "My quickest hackathon",
    description: "I had to create an app with my team in 6 hours. We managed to build a functioning app in time somehow!",
    images: []
  },
  "hack-the-north": {
    title: "Hack The North",
    subtitle: "My first time at Canada's biggest hackathon",
    description: "I stayed for 2 nights at this hackathon, competed with over 1200+ hackers, and witnessed a World record being broken!",
    images: []
  },
  "ignition-hacks": {
    title: "Ignition Hacks",
    subtitle: "My first time hosting a hackathon workshop",
    description: "I hosted my first ever hackathon workshop for 100+ hackers. I taught them how to use Mapbox, the tool which I am using for this map!",
    images: []
  },
  "aws-summit": {
    title: "AWS Summit",
    subtitle: "My first time at a large scale tech event",
    description: "I arrived here at 7am and stayed until 5pm, with over 10,000 attendees. I learned so much information from industry experts and got to train for my AI model!",
    images: []
  },
  "google-devfest": {
    title: "Google DevFest",
    subtitle: "My first time at a huge workshop",
    description: "I participated in Gemini workshop with 500+ guests. I learnt so much about the power of AI and how to use it in my projects!",
    images: []
  },
  "murder-mystery-party": {
    title: "Murder Mystery Party",
    subtitle: "My first time at a party for founders",
    description: "4,500km from home, I attended a party for young entrepreneurs. I met so many interesting and ambitious people!",
    images: []
  },
  "shut-up-and-code": {
    title: "Shut Up & Code",
    subtitle: "My first time meeting strangers just to code",
    description: "I left home at 6am to attend this event, where strangers met up just to code and learn from each other.",
    images: []
  }
};


