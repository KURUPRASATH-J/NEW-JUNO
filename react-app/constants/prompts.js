export const promptLibrary = [
  {
    category: 'Document Analysis',
    icon: 'file-text',
    color: '#6C63FF',
    prompts: [
      { title: 'Summarize Document', text: 'Summarize this document in detail' },
      { title: 'Key Insights', text: 'Extract key insights from this content' },
      { title: 'Main Topic', text: 'What is the main topic of this document?' },
      { title: 'Key Points', text: 'List the important points mentioned' },
      { title: 'Compare & Contrast', text: 'Compare and contrast the main ideas in this document' },
      { title: 'Action Items', text: 'Extract all action items and recommendations from this document' },
    ],
  },
  {
    category: 'Creative Writing',
    icon: 'edit-3',
    color: '#FF6B6B',
    prompts: [
      { title: 'Write a Story', text: 'Write a creative short story about' },
      { title: 'Poetry', text: 'Write a poem about' },
      { title: 'Blog Post', text: 'Write a blog post about' },
      { title: 'Email Draft', text: 'Draft a professional email about' },
      { title: 'Social Media Post', text: 'Create a social media post about' },
    ],
  },
  {
    category: 'Code & Tech',
    icon: 'code',
    color: '#00D4AA',
    prompts: [
      { title: 'Explain Code', text: 'Explain this code step by step:' },
      { title: 'Debug Help', text: 'Help me debug this issue:' },
      { title: 'Code Review', text: 'Review this code and suggest improvements:' },
      { title: 'Architecture', text: 'Suggest an architecture for' },
      { title: 'Best Practices', text: 'What are the best practices for' },
    ],
  },
  {
    category: 'Research',
    icon: 'search',
    color: '#F59E0B',
    prompts: [
      { title: 'Research Topic', text: 'Research and explain' },
      { title: 'Pros & Cons', text: 'List the pros and cons of' },
      { title: 'Timeline', text: 'Create a timeline of events for' },
      { title: 'Deep Dive', text: 'Give me a deep dive analysis on' },
    ],
  },
  {
    category: 'Business',
    icon: 'briefcase',
    color: '#8B5CF6',
    prompts: [
      { title: 'SWOT Analysis', text: 'Perform a SWOT analysis for' },
      { title: 'Business Plan', text: 'Create a business plan outline for' },
      { title: 'Market Analysis', text: 'Analyze the market for' },
      { title: 'Pitch Deck', text: 'Create a pitch deck outline for' },
    ],
  },
];

export const personas = [
  { id: 'default', name: 'Default', icon: 'robot', color: '#6C63FF', description: 'Balanced and helpful assistant' },
  { id: 'creative_writer', name: 'Creative Writer', icon: 'palette', color: '#FF6B6B', description: 'Rich, artistic, and expressive responses' },
  { id: 'code_expert', name: 'Code Expert', icon: 'laptop-code', color: '#00D4AA', description: 'Technical precision with code examples' },
  { id: 'researcher', name: 'Researcher', icon: 'flask', color: '#F59E0B', description: 'Academic and evidence-based analysis' },
  { id: 'study_buddy', name: 'Study Buddy', icon: 'book-open', color: '#10B981', description: 'Simplified learning with analogies' },
  { id: 'business_advisor', name: 'Business Advisor', icon: 'chart-line', color: '#8B5CF6', description: 'Strategic and results-oriented advice' },
];

export default promptLibrary;
