export interface GenerateSummaryInput {
  targetRole?: string;
  jobDescription?: string;
  experienceLevel?: string;
  skills?: string[];
  education?: string[];
  background?: string;
  existingSummary?: string;
}

export interface GenerateSummaryResult {
  summary: string;
  alternativeOptions: string[];
  highlightedKeywords: string[];
}

export interface GenerateBulletsInput {
  type: 'project' | 'experience';
  titleOrRole: string;
  organization?: string;
  techStack?: string[];
  rawDetails: string | string[];
  targetRole?: string;
  jobDescription?: string;
}

export interface BulletImprovementItem {
  original?: string;
  bullet: string;
  actionVerb: string;
  measurableImpact?: string;
}

export interface GenerateBulletsResult {
  bullets: BulletImprovementItem[];
  feedback: string;
}

export interface SuggestSkillsInput {
  targetRole?: string;
  jobDescription?: string;
  existingSkills?: string[];
  currentProjects?: string[];
  experienceLevel?: string;
}

export interface SuggestSkillsResult {
  technical: string[];
  toolsAndFrameworks: string[];
  softSkills: string[];
  missingCrucialSkills: string[];
}

export interface ImproveProjectInput {
  title: string;
  role?: string;
  techStack?: string[];
  rawDescription?: string;
  existingBullets?: string[];
  targetRole?: string;
  jobDescription?: string;
}

export interface ImproveProjectResult {
  title: string;
  refinedTechStack: string[];
  bullets: string[];
  missingInformation: string[];
}

export interface CompleteResumeDraftInput {
  background?: string;
  targetRole?: string;
  jobDescription?: string;
  experienceLevel?: string;
  personalDetails?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    gitHub?: string;
    portfolio?: string;
  };
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    scoreOrGpa?: string;
  }>;
  skills?: string[] | { technical?: string[]; tools?: string[]; soft?: string[] };
  projects?: Array<{
    title: string;
    role?: string;
    technologies?: string[];
    description?: string;
    bullets?: string[];
  }>;
  experience?: Array<{
    company: string;
    role: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    bullets?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    issueDate?: string;
  }>;
  achievements?: Array<{
    title: string;
    description?: string;
    date?: string;
  }>;
}

export interface CompleteResumeDraftResult {
  professionalSummary: string;
  skills: {
    technical: string[];
    tools: string[];
    soft: string[];
  };
  projects: Array<{
    title: string;
    techStack: string[];
    bullets: string[];
  }>;
  experience: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    scoreOrGpa?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer?: string;
    issueDate?: string;
  }>;
  achievements: Array<{
    title: string;
    description?: string;
    date?: string;
  }>;
  missingInformation: string[];
}

export interface TailorResumeInput {
  resume: {
    summary?: string;
    skills?: string[];
    projects?: Array<{ title: string; bullets: string[]; technologies?: string[] }>;
    experience?: Array<{ company: string; role: string; bullets: string[] }>;
    education?: Array<{ institution: string; degree: string }>;
  };
  jobDescription: string;
  targetRole?: string;
}

export interface TailorResumeResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestedSkillAdditions: string[];
  rewrittenSummary: string;
  rewrittenProjects: Array<{
    title: string;
    bullets: string[];
  }>;
  rewrittenExperience: Array<{
    company: string;
    role: string;
    bullets: string[];
  }>;
  sectionsToEmphasize: string[];
  sectionsToReduceOrRemove: string[];
}

// ----------------- RESUME ANALYZER TYPES -----------------

export interface ResumeAnalysisScoreSection {
  overall: number;
  ats: number;
  roleMatch: number;
  recruiterImpression: number;
  sections: {
    summary: number;
    education: number;
    skills: number;
    projects: number;
    experience: number;
    certifications: number;
    achievements: number;
    formatting: number;
    keywords: number;
    credibility: number;
  };
}

export interface ResumeWeaknessItem {
  severity: 'low' | 'medium' | 'high' | 'critical';
  section: string;
  snippet?: string;
  problem: string;
  impact: string;
  fix: string;
  improved?: string;
}

export interface ResumeMissingKeywordItem {
  keyword: string;
  category: 'technical' | 'tool' | 'concept' | 'soft-skill';
  relevance: 'critical' | 'recommended' | 'optional';
  context: string;
}

export interface ResumeWeakBulletItem {
  original: string;
  problemType: 'no-action-verb' | 'no-impact' | 'too-generic' | 'too-long' | 'unclear-tech-stack' | 'no-measurable-result';
  severity: 'low' | 'medium' | 'high' | 'critical';
  improved: string;
  explanation: string;
}

export interface ResumeFormattingIssueItem {
  issue: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface ResumeCredibilityCheckItem {
  claim: string;
  concern: string;
  status: 'verificationRecommended' | 'wellSupported' | 'unclearTechStack';
  recommendation: string;
}

export interface ResumePrioritizedActionItem {
  priority: 'P0' | 'P1' | 'P2';
  estimatedImpact: string;
  section: string;
  action: string;
  beforeExample: string;
  afterExample: string;
}

export interface ResumeRewrittenContent {
  summary?: string;
  projectBullets?: Array<{ projectTitle?: string; original: string; improved: string }>;
  experienceBullets?: Array<{ company?: string; original: string; improved: string }>;
  skills?: string[];
  achievements?: string[];
}

export interface ResumeInterviewQuestions {
  technical: string[];
  projectBased: string[];
  hr: string[];
}

export interface FullResumeAnalysis {
  scores: ResumeAnalysisScoreSection;
  strengths: Array<{ title: string; explanation: string; sectionToHighlight: string }>;
  weaknesses: ResumeWeaknessItem[];
  missingKeywords: ResumeMissingKeywordItem[];
  weakBullets: ResumeWeakBulletItem[];
  formattingIssues: ResumeFormattingIssueItem[];
  credibilityChecks: ResumeCredibilityCheckItem[];
  redFlags: string[];
  prioritizedActions: ResumePrioritizedActionItem[];
  rewrittenContent: ResumeRewrittenContent;
  interviewQuestions: ResumeInterviewQuestions;
  explanations: {
    language: 'english' | 'hinglish';
    overallFeedback: string;
  };
}

export interface StoredResumeAnalysis {
  _id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'text';
  extractedText: string;
  targetRole?: string;
  jobDescription?: string;
  experienceLevel?: string;
  language?: 'english' | 'hinglish';
  analysis: FullResumeAnalysis;
  createdAt: string;
}

export interface ImproveAnalysisInput {
  focus?: 'summary' | 'projects' | 'skills' | 'experience' | 'all';
  targetRole?: string;
  jobDescription?: string;
  language?: 'english' | 'hinglish';
}

export interface ImproveAnalysisResult {
  rewrittenSummary?: string;
  rewrittenProjectBullets?: Array<{ projectTitle?: string; bullets: string[] }>;
  rewrittenExperienceBullets?: Array<{ company?: string; role?: string; bullets: string[] }>;
  suggestedSkills?: string[];
  suggestedAchievements?: string[];
  explanation: Record<string, string>;
  itemsToVerify: string[];
}
