import type {
  StoredResume,
  CreateResumeInput,
  UpdateResumeInput,
  ResumePersonalDetails,
  ResumeEducation,
  ResumeProject,
  ResumeExperience,
  ResumeCertification,
  ResumeAchievement,
  ResumeLink,
  ResumeEnhanceInput,
} from '../types/resume.js';

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function safeString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val.trim() : fallback;
}

function safeOptionalString(val: unknown): string | undefined {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function safeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

export function sanitizePersonalDetails(val: unknown): ResumePersonalDetails {
  const obj = isObject(val) ? val : {};
  return {
    fullName: safeString(obj.fullName),
    email: safeString(obj.email),
    phone: safeOptionalString(obj.phone),
    location: safeOptionalString(obj.location),
    linkedIn: safeOptionalString(obj.linkedIn),
    gitHub: safeOptionalString(obj.gitHub),
    portfolio: safeOptionalString(obj.portfolio),
  };
}

export function sanitizeEducation(val: unknown): ResumeEducation[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter(isObject)
    .map((edu) => ({
      institution: safeString(edu.institution),
      degree: safeString(edu.degree),
      fieldOfStudy: safeOptionalString(edu.fieldOfStudy),
      startDate: safeOptionalString(edu.startDate),
      endDate: safeOptionalString(edu.endDate),
      scoreOrGpa: safeOptionalString(edu.scoreOrGpa),
      location: safeOptionalString(edu.location),
      description: safeOptionalString(edu.description),
    }))
    .filter((edu) => edu.institution || edu.degree);
}

export function sanitizeProjects(val: unknown): ResumeProject[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter(isObject)
    .map((proj) => ({
      title: safeString(proj.title),
      role: safeOptionalString(proj.role),
      link: safeOptionalString(proj.link),
      technologies: safeStringArray(proj.technologies),
      startDate: safeOptionalString(proj.startDate),
      endDate: safeOptionalString(proj.endDate),
      bullets: safeStringArray(proj.bullets),
    }))
    .filter((proj) => proj.title || proj.bullets.length > 0);
}

export function sanitizeExperience(val: unknown): ResumeExperience[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter(isObject)
    .map((exp) => ({
      company: safeString(exp.company),
      role: safeString(exp.role),
      location: safeOptionalString(exp.location),
      employmentType: safeOptionalString(exp.employmentType),
      startDate: safeOptionalString(exp.startDate),
      endDate: safeOptionalString(exp.endDate),
      isCurrent: Boolean(exp.isCurrent),
      bullets: safeStringArray(exp.bullets),
    }))
    .filter((exp) => exp.company || exp.role || exp.bullets.length > 0);
}

export function sanitizeCertifications(val: unknown): ResumeCertification[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter(isObject)
    .map((cert) => ({
      name: safeString(cert.name),
      issuer: safeString(cert.issuer),
      issueDate: safeOptionalString(cert.issueDate),
      expiryDate: safeOptionalString(cert.expiryDate),
      credentialId: safeOptionalString(cert.credentialId),
      url: safeOptionalString(cert.url),
    }))
    .filter((cert) => cert.name);
}

export function sanitizeAchievements(val: unknown): ResumeAchievement[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter(isObject)
    .map((ach) => ({
      title: safeString(ach.title),
      description: safeOptionalString(ach.description),
      date: safeOptionalString(ach.date),
    }))
    .filter((ach) => ach.title);
}

export function sanitizeLinks(val: unknown): ResumeLink[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter(isObject)
    .map((link) => ({
      label: safeString(link.label),
      url: safeString(link.url),
    }))
    .filter((link) => link.url);
}

export function validateResumeInput(body: unknown, isUpdate = false): {
  valid: boolean;
  message?: string;
  data?: CreateResumeInput | UpdateResumeInput;
} {
  if (!isObject(body)) {
    return { valid: false, message: 'Request body must be an object.' };
  }

  if (!isUpdate) {
    const title = safeString(body.title, 'Untitled Resume');
    const template = safeString(body.template, 'modern');
    const personalDetails = sanitizePersonalDetails(body.personalDetails);

    if (!title) {
      return { valid: false, message: 'Resume title is required.' };
    }

    const resumeData: CreateResumeInput = {
      userId: '', // populated by caller
      title,
      template,
      personalDetails,
      summary: safeString(body.summary),
      education: sanitizeEducation(body.education),
      skills: safeStringArray(body.skills),
      projects: sanitizeProjects(body.projects),
      experience: sanitizeExperience(body.experience),
      certifications: sanitizeCertifications(body.certifications),
      achievements: sanitizeAchievements(body.achievements),
      links: sanitizeLinks(body.links),
      isCurrent: typeof body.isCurrent === 'boolean' ? body.isCurrent : false,
    };

    return { valid: true, data: resumeData };
  } else {
    const updateData: UpdateResumeInput = {};

    if ('title' in body) {
      const title = safeString(body.title);
      if (!title) return { valid: false, message: 'Resume title cannot be empty.' };
      updateData.title = title;
    }
    if ('template' in body) updateData.template = safeString(body.template, 'modern');
    if ('personalDetails' in body) updateData.personalDetails = sanitizePersonalDetails(body.personalDetails);
    if ('summary' in body) updateData.summary = safeString(body.summary);
    if ('education' in body) updateData.education = sanitizeEducation(body.education);
    if ('skills' in body) updateData.skills = safeStringArray(body.skills);
    if ('projects' in body) updateData.projects = sanitizeProjects(body.projects);
    if ('experience' in body) updateData.experience = sanitizeExperience(body.experience);
    if ('certifications' in body) updateData.certifications = sanitizeCertifications(body.certifications);
    if ('achievements' in body) updateData.achievements = sanitizeAchievements(body.achievements);
    if ('links' in body) updateData.links = sanitizeLinks(body.links);
    if ('isCurrent' in body && typeof body.isCurrent === 'boolean') updateData.isCurrent = body.isCurrent;

    return { valid: true, data: updateData };
  }
}

export function validateEnhanceInput(body: unknown): {
  valid: boolean;
  message?: string;
  data?: ResumeEnhanceInput;
} {
  if (!isObject(body)) {
    return { valid: false, message: 'Request body must be an object.' };
  }

  // Allow content passed directly as body or body.content or parts of body
  const rawContent = isObject(body.content) ? body.content : body;

  const summary = typeof rawContent.summary === 'string' ? rawContent.summary.trim() : undefined;
  const skills = safeStringArray(rawContent.skills);
  const projects = sanitizeProjects(rawContent.projects);
  const experience = sanitizeExperience(rawContent.experience);

  const sectionRaw = safeString(body.section).toLowerCase();
  const validSections = ['summary', 'projects', 'experience', 'skills', 'all'] as const;
  const section = validSections.includes(sectionRaw as never)
    ? (sectionRaw as 'summary' | 'projects' | 'experience' | 'skills' | 'all')
    : undefined;

  const targetRole = safeOptionalString(body.targetRole);
  const jobDescription = safeOptionalString(body.jobDescription);

  const hasContent =
    (summary && summary.length > 0) ||
    skills.length > 0 ||
    projects.length > 0 ||
    experience.length > 0;

  if (!hasContent) {
    return {
      valid: false,
      message: 'Provide resume content (summary, projects, experience, or skills) to enhance.',
    };
  }

  return {
    valid: true,
    data: {
      content: {
        summary,
        skills: skills.length > 0 ? skills : undefined,
        projects: projects.length > 0 ? projects : undefined,
        experience: experience.length > 0 ? experience : undefined,
      },
      section,
      targetRole,
      jobDescription,
    },
  };
}
