# Jack's Portfolio - React Edition

A clean, compact portfolio website built with React, featuring a light theme and 3D Mapbox map. Designed for easy addition of new projects and experiences.

## ✨ Features

- **React-Based**: Modern, component-based architecture
- **Light Theme**: Clean, modern design with a light color scheme
- **Compact Layout**: All content is centered and compact, not spread out
- **3D Mapbox Map**: Interactive 3D map on the home page
- **Tab-Based Navigation**: Clean interface with separate tabs for Home, Projects, Experiences, and Contact
- **Easy Content Management**: Add projects and experiences by simply editing data files
- **Responsive Design**: Works well on desktop and mobile devices
- **Smooth Transitions**: Fade-in animations between tabs

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone and Install**:
   ```bash
   cd jack-portfolio
   npm install
   ```

2. **Get a Mapbox Access Token**:
   - Visit [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
   - Create a new token or use an existing one
   - Copy the token

3. **Configure Mapbox**:
   - Create a `.env` file in the project root
   - Add: `VITE_MAPBOX_ACCESS_TOKEN=your_token_here`

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   - Open `http://localhost:3000` in your browser

## 📝 Adding Projects & Experiences

### Adding a New Project

1. Open `src/data/projects.js`
2. Add a new object to the `projects` array:

```javascript
{
  id: 4, // Unique ID (increment from the last one)
  title: "Your Project Name",
  description: "Brief description of your project and what it does.",
  technologies: ["Tech1", "Tech2", "Tech3"], // Array of technologies used
  githubUrl: "https://github.com/yourusername/project-repo", // Optional
  liveUrl: "https://your-project-demo.com", // Optional
  image: "https://via.placeholder.com/400x250/4A90E2/FFFFFF?text=Your+Project" // Project screenshot/thumbnail
}
```

### Adding a New Experience

1. Open `src/data/experiences.js`
2. Add a new object to the `experiences` array:

```javascript
{
  id: 4, // Unique ID (increment from the last one)
  company: "Company Name",
  position: "Your Position",
  duration: "Jan 2023 - Present",
  location: "City, State/Country",
  description: "Brief description of your role and responsibilities.",
  achievements: [
    "Achievement 1",
    "Achievement 2",
    "Achievement 3"
  ],
  technologies: ["Tech1", "Tech2", "Tech3"] // Technologies you worked with
}
```

## 🎨 Customization

### Personal Information
- **Avatar**: Update the image URL in `src/components/HeroSection.jsx`
- **Name & Description**: Edit the profile section in `src/components/HeroSection.jsx`
- **Skills**: Modify the skills array in `src/components/HeroSection.jsx`
- **Contact Info**: Update `src/components/ContactSection.jsx`

### Styling
- **Colors**: Adjust the color scheme in `src/styles.css`
- **Layout**: Modify spacing and sizing in `src/styles.css`
- **Map Location**: Change coordinates in `src/components/HeroSection.jsx`

## 📁 Project Structure

```
jack-portfolio/
├── public/
│   └── index.html          # Main HTML template
├── src/
│   ├── components/         # React components
│   │   ├── App.jsx        # Main app component
│   │   ├── Navbar.jsx     # Navigation component
│   │   ├── HeroSection.jsx # Hero section with map
│   │   ├── ProjectsSection.jsx # Projects display
│   │   ├── ExperiencesSection.jsx # Experiences timeline
│   │   └── ContactSection.jsx # Contact information
│   ├── data/              # Data files (easy to edit!)
│   │   ├── projects.js    # Projects data
│   │   └── experiences.js # Experiences data
│   ├── main.jsx           # React entry point
│   └── styles.css         # All styling
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## 🛠️ Technologies Used

- **React 19** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Mapbox GL JS** - Interactive maps and location services
- **CSS3** - Modern styling with responsive design

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌟 Key Benefits

- **Easy Maintenance**: Add new content without touching code
- **Modern Stack**: Built with latest React and development tools
- **Performance**: Optimized with Vite for fast development and builds
- **Scalable**: Component-based architecture makes it easy to extend
- **Professional**: Clean design suitable for any industry
