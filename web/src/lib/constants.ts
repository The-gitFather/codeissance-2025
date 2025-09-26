// import { question } from "mermaid/dist/rendering-util/rendering-elements/shapes/question.js"

export const steps = [
  {
    question: 'What is your current level of education?',
    options: [
      'High School',
      'Undergraduate',
      'Postgraduate',
      'Other',
    ],
  },
  {
    question: 'What subjects are you most interested in?',
    options: [
      'Science & Technology',
      'Mathematics',
      'Arts & Humanities',
      'Business & Finance',
    ],
  },
  {
    question: 'How do you prefer to study?',
    options: [
      'Videos',
      'Text-based Materials',
      'Interactive Exercises',
      'Live Sessions',
    ],
  },
  {
    question: 'What is your primary academic goal?',
    options: [
      'Exam Preparation',
      'Skill Development',
      'Career Advancement',
      'General Learning',
    ],
  }
];

// Define the goal options with titles and roadmap topics
export const goalOptions = [
  {
    title: "Web Development",
    roadmap: ["Frontend", "Backend", "DevOps", "Databases", "API Development"]
  },
  {
    title: "Data Science",
    roadmap: ["Data Analysis", "Data Visualization", "Machine Learning Basics", "Statistical Methods", "Big Data Technologies"]
  },
  {
    title: "Machine Learning",
    roadmap: ["Python Programming", "Neural Networks", "Natural Language Processing", "Computer Vision", "Reinforcement Learning"]
  },
  {
    title: "Mobile App Development",
    roadmap: ["Native iOS", "Native Android", "Cross-Platform Frameworks", "UI/UX Design", "App Performance"]
  },
  {
    title: "Game Development",
    roadmap: ["Game Engines", "2D/3D Graphics", "Game Physics", "Multiplayer Systems", "Game Design"]
  },
  {
    title: "Cloud Computing",
    roadmap: ["AWS/Azure/GCP", "Serverless", "Containers", "Infrastructure as Code", "Cloud Security"]
  },
  {
    title: "Cybersecurity",
    roadmap: ["Network Security", "Ethical Hacking", "Cryptography", "Security Analysis", "Incident Response"]
  },
]

// Export just the titles for UI display purposes
export const goalTitles = goalOptions.map(goal => goal.title);

export const navLinks = [
  // { title: 'Home', url: '/' },
  { title: 'Dashboard', url: '/dashboard' },
  { title: 'Courses', url: '/courses' },
  { title: 'Study Material', url: '/study-material' },
  { title: 'Kanban', url: '/kanban' },
  { title: 'Doubts', url: '/doubts' }
]

export const ownerNavLinks = [
  { title: 'Home', url: '/' },
  { title: 'About', url: '/about' },
  { title: 'Dashboard', url: '/dashboard' },
  { title: 'Search Listings', url: '/search' },
  { title: 'Rent Tracker', url: '/rental' },
  { title: 'List Property', url: '/list-property' },
  { title: 'Listing Offers', url: '/offers' },
]