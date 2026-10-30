import { fetchApi, API_URL } from './api';

export interface ResumePersonalDetails {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  gitHub?: string;
  portfolio?: string;
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

export interface EnhanceResumePayload {
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

export interface EnhancedResumeResult {
  summary?: string;
  skills?: string[];
  projects?: Array<{ title: string; bullets: string[] }>;
  experience?: Array<{ company: string; role: string; bullets: string[] }>;
}

export const resumeService = {
  async list(): Promise<StoredResume[]> {
    const res = (await fetchApi('/resume')) as { resumes: StoredResume[] };
    return res.resumes || [];
  },

  async getCurrent(): Promise<StoredResume | null> {
    const res = (await fetchApi('/resume/current')) as { resume: StoredResume | null };
    return res.resume ?? null;
  },

  async getById(id: string): Promise<StoredResume> {
    const res = (await fetchApi(`/resume/${id}`)) as { resume: StoredResume };
    return res.resume;
  },

  async create(data: Partial<StoredResume>): Promise<StoredResume> {
    const res = (await fetchApi('/resume', {
      method: 'POST',
      body: JSON.stringify(data),
    })) as { resume: StoredResume };
    return res.resume;
  },

  async update(id: string, data: Partial<StoredResume>): Promise<StoredResume> {
    const res = (await fetchApi(`/resume/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })) as { resume: StoredResume };
    return res.resume;
  },

  async delete(id: string): Promise<void> {
    await fetchApi(`/resume/${id}`, {
      method: 'DELETE',
    });
  },

  async setCurrent(id: string): Promise<StoredResume> {
    const res = (await fetchApi(`/resume/${id}/set-current`, {
      method: 'POST',
    })) as { resume: StoredResume };
    return res.resume;
  },

  async enhance(payload: EnhanceResumePayload): Promise<EnhancedResumeResult> {
    const res = (await fetchApi('/resume/enhance', {
      method: 'POST',
      body: JSON.stringify(payload),
    })) as EnhancedResumeResult;
    return res;
  },

  async downloadPdf(id: string, filename = 'resume.pdf'): Promise<void> {
    const token = localStorage.getItem('nova_auth_token');
    const response = await fetch(`${API_URL}/resume/${id}/export`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download resume PDF.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async uploadAndAnalyze(formData: FormData): Promise<any> {
    const token = localStorage.getItem('nova_auth_token');
    const response = await fetch(`${API_URL}/resume-analyzer/analyze`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const json = await response.json();
    if (!response.ok || json.error) {
      throw new Error(json.error?.message || 'Failed to analyze resume file.');
    }
    return json.data;
  },

  async analyzeText(data: { text: string; targetRole?: string; jobDescription?: string; language?: string }): Promise<any> {
    return fetchApi('/resume-analyzer/analyze-text', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
