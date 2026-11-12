export interface ResumePersonalDetails {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  gitHub?: string;
  portfolio?: string;
  photoUrl?: string;
  photoShape?: 'circle' | 'rounded' | 'square';
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  scoreOrGpa?: string;
  location?: string;
  description?: string;
}

export interface ResumeProject {
  title: string;
  role?: string;
  link?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

export interface ResumeExperience {
  company: string;
  role: string;
  location?: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  bullets: string[];
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface ResumeAchievement {
  title: string;
  description?: string;
  date?: string;
}

export interface ResumeLink {
  label: string;
  url: string;
}

export interface StoredResume {
  _id: string;
  userId: string;
  title: string;
  template: string;
  accentColor?: string;
  fontFamily?: string;
  sectionOrder?: string[];
  hiddenSections?: string[];
  personalDetails: ResumePersonalDetails;
  summary: string;
  education: ResumeEducation[];
  skills: string[];
  projects: ResumeProject[];
  experience: ResumeExperience[];
  certifications: ResumeCertification[];
  achievements: ResumeAchievement[];
  links: ResumeLink[];
  isCurrent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateResumeInput = Omit<StoredResume, '_id' | 'createdAt' | 'updatedAt'>;

export type UpdateResumeInput = Partial<Omit<StoredResume, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface ResumeEnhanceInput {
  content: {
    summary?: string;
    skills?: string[];
    projects?: ResumeProject[];
    experience?: ResumeExperience[];
  };
  section?: 'summary' | 'projects' | 'experience' | 'skills' | 'all';
  targetRole?: string;
  jobDescription?: string;
}

export interface ResumeEnhanceResult {
  summary?: string;
  projects?: Array<{
    title: string;
    bullets: string[];
  }>;
  experience?: Array<{
    company: string;
    role: string;
    bullets: string[];
  }>;
  skills?: string[];
}
