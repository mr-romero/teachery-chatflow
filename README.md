# Teachery - Interactive Classroom Learning Platform

A modern web application for interactive classroom learning that combines slide presentations with AI-powered tutoring and goal tracking.

## Features

- 🎯 **Learning Goal Management**
  - Create and track specific learning objectives
  - Add answer keys for automated progress tracking
  - Monitor student progress in real-time

- 📊 **Interactive Slides**
  - Support for Markdown content
  - Multiple choice questions
  - Image uploads
  - Associate goals with specific slides

- 🤖 **AI Tutor Integration**
  - Powered by OpenRouter.ai with gpt-4o-mini
  - Contextual tutoring based on current learning goals
  - Automatic goal completion tracking
  - Customizable system prompts

- 👩‍🏫 **Teacher Controls**
  - Real-time class management
  - Pause/resume student chats
  - Monitor student progress
  - Save and load lesson plans

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your OpenRouter API key:
   ```
   VITE_OPENROUTER_API_KEY=your_api_key_here
   VITE_OPENROUTER_REFERRER=https://your-domain.com
   VITE_LLM_MODEL_ID=gpt-4o-mini
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/pages/` - Main page components (TeacherDashboard, StudentView)
- `src/components/ui/` - Reusable UI components
- `src/types/` - TypeScript type definitions
- `src/lib/` - Utility functions and helpers

## Key Components

### TeacherDashboard
- Create and manage slides
- Monitor student progress
- Set learning goals
- Control classroom interactions

### StudentView
- View slides
- Interact with AI tutor
- Track personal progress
- Submit answers to questions

### SlideEditor
- Create/edit slide content
- Add multiple choice questions
- Associate learning goals
- Preview content

## Technology Stack

- React with TypeScript
- Tailwind CSS for styling
- OpenRouter.ai for AI integration
- Vite for build tooling

## License

MIT
