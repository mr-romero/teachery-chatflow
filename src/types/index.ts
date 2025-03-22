export type Student = {
  id: string;
  name: string;
  completedGoals: Map<string, string[]>; // lessonId -> goalIds
};

export type Goal = {
  id: string;
  description: string;
  completed: boolean;
  answerKey?: string;
};

export type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
  label?: string; // For A, B, C, D or F, G, H, J display
};

export type MultipleChoice = {
  id: string; // Unique identifier for the question
  question: string;
  choices: Choice[];
  explanation?: string;
  latexAnswer?: string; // For mathematical answers in LaTeX format
  type?: 'basic' | 'math'; // To differentiate between regular and math questions
};

export type Equation = {
  latex: string;
  displayMode?: boolean;
  question?: string;
  answer?: string;
  explanation?: string;
};

// Content types
export type MarkdownContent = {
  text: string;
};

export type ImageContent = {
  url: string;
  caption?: string;
  questions?: MultipleChoice[];
};

export type QuizContent = {
  questions: MultipleChoice[];
};

export type EquationContent = {
  equations: Equation[];
};

export type SlideContent =
  | { type: 'markdown'; content: MarkdownContent; }
  | { type: 'image'; content: ImageContent; }
  | { type: 'quiz'; content: QuizContent; }
  | { type: 'equation'; content: EquationContent; };

export type Slide = {
  id: string;
  title?: string;
  content: SlideContent;
  goals: Goal[];
};

export type Lesson = {
  id: string;
  title: string;
  slides: Slide[];
  accessCode: string;
  systemPrompt: string;
  isPaused: boolean;
  goals: Goal[];
};

export type StudentResponse = {
  answer: string;
  isCorrect: boolean;
  timestamp: number;
  feedback?: string;
  latexAnswer?: string; // For mathematical responses
  selectedChoice?: string; // For multiple choice responses (stores the choice label)
};

export type StudentSession = {
  studentId: string;
  studentName: string;
  lessonId: string;
  lastActive: number;
  currentSlide: number;
  completedGoals: string[];
  responses: {
    [slideId: string]: StudentResponse[];
  };
};

export type TeacherSession = {
  lessonId: string;
  currentSlide: number;
  isPaused: boolean;
  lastActive: number;
  connectedStudents: string[]; // studentIds
};
