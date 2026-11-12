import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  RefreshCw,
  Briefcase,
  GraduationCap,
  Award,
  Link as LinkIcon,
  Layers,
  Wand2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  resumeService,
  type StoredResume,
  type ResumeProject,
  type ResumeExperience,
  type ResumeEducation,
  type ResumeCertification,
  type ResumeAchievement,
  type ResumeLink,
} from '@/services/resumeService';
import { useToast } from '@/store/ToastContext';

export function ResumeMaker() {
  const { showToast } = useToast();
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [activeResume, setActiveResume] = useState<StoredResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Resume Upload / Analyzer modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // AI Enhance modal state
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [enhanceSection, setEnhanceSection] = useState<'all' | 'summary' | 'projects' | 'experience' | 'skills'>('all');
  const [enhancing, setEnhancing] = useState(false);

  // Active section tab
  const [activeTab, setActiveTab] = useState<'personal' | 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'certs'>('personal');

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    setLoading(true);
    try {
      const list = await resumeService.list();
      setResumes(list);
      if (list.length > 0) {
        const current = list.find((r) => r.isCurrent) || list[0];
        setActiveResume(current);
      } else {
        createNewEmptyResume();
      }
    } catch {
      createNewEmptyResume();
    } finally {
      setLoading(false);
    }
  }

  function createNewEmptyResume() {
    const blank: StoredResume = {
      _id: '',
      userId: '',
      title: 'My Professional Resume',
      template: 'modern',
      personalDetails: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedIn: '',
        gitHub: '',
        portfolio: '',
      },
      summary: '',
      skills: [],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      achievements: [],
      links: [],
      isCurrent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveResume(blank);
  }

  async function handleSave() {
    if (!activeResume) return;
    setSaving(true);
    try {
      if (activeResume._id) {
        const updated = await resumeService.update(activeResume._id, activeResume);
        setActiveResume(updated);
        setResumes((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
        showToast('Resume updated successfully.', 'success');
      } else {
        const created = await resumeService.create(activeResume);
        setActiveResume(created);
        setResumes((prev) => [created, ...prev]);
        showToast('New resume saved to your account.', 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save resume.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetCurrent(id: string) {
    try {
      const updated = await resumeService.setCurrent(id);
      setActiveResume(updated);
      setResumes((prev) =>
        prev.map((r) => ({ ...r, isCurrent: r._id === id }))
      );
      showToast('Marked as current resume.', 'success');
    } catch {
      showToast('Could not set default resume.', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.delete(id);
      const remaining = resumes.filter((r) => r._id !== id);
      setResumes(remaining);
      if (activeResume?._id === id) {
        if (remaining.length > 0) setActiveResume(remaining[0]);
        else createNewEmptyResume();
      }
      showToast('Resume removed.', 'info');
    } catch {
      showToast('Failed to delete resume.', 'error');
    }
  }

  async function handleExportPdf() {
    if (!activeResume) return;
    setExporting(true);
    try {
      let resumeId = activeResume._id;
      // Auto-save first if unsaved
      if (!resumeId) {
        const created = await resumeService.create(activeResume);
        setActiveResume(created);
        setResumes((prev) => [created, ...prev]);
        resumeId = created._id;
      } else {
        await resumeService.update(resumeId, activeResume);
      }
      await resumeService.downloadPdf(resumeId, `${activeResume.title || 'Resume'}.pdf`);
      showToast('ATS-friendly PDF downloaded.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PDF export failed.';
      showToast(msg, 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleEnhanceWithAI() {
    if (!activeResume) return;
    setEnhancing(true);
    try {
      const result = await resumeService.enhance({
        targetRole: targetRole || undefined,
        jobDescription: jobDescription || undefined,
        section: enhanceSection,
        content: {
          summary: activeResume.summary,
          skills: activeResume.skills,
          projects: activeResume.projects,
          experience: activeResume.experience,
        },
      });

      setActiveResume((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          summary: result.summary ?? prev.summary,
          skills: result.skills && result.skills.length > 0 ? result.skills : prev.skills,
          projects:
            result.projects && result.projects.length > 0
              ? result.projects.map((p, idx) => ({
                  ...prev.projects[idx],
                  title: p.title || prev.projects[idx]?.title || '',
                  bullets: p.bullets || prev.projects[idx]?.bullets || [],
                }))
              : prev.projects,
          experience:
            result.experience && result.experience.length > 0
              ? result.experience.map((e, idx) => ({
                  ...prev.experience[idx],
                  company: e.company || prev.experience[idx]?.company || '',
                  role: e.role || prev.experience[idx]?.role || '',
                  bullets: e.bullets || prev.experience[idx]?.bullets || [],
                }))
              : prev.experience,
        };
      });

      setEnhanceModalOpen(false);
      showToast('Resume polished with ATS keywords and impact phrasing.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI Enhancement failed.';
      showToast(msg, 'error');
    } finally {
      setEnhancing(false);
    }
  }

  // --- Handlers for dynamic sections ---

  const updatePersonal = (field: string, val: string) => {
    setActiveResume((prev) =>
      prev ? { ...prev, personalDetails: { ...prev.personalDetails, [field]: val } } : null
    );
  };

  const addExperience = () => {
    setActiveResume((prev) =>
      prev
        ? {
            ...prev,
            experience: [
              ...prev.experience,
              { company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, bullets: [''] },
            ],
          }
        : null
    );
  };

  const updateExperience = (idx: number, field: string, val: unknown) => {
    setActiveResume((prev) => {
      if (!prev) return null;
      const updated = [...prev.experience];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, experience: updated };
    });
  };

  const removeExperience = (idx: number) => {
    setActiveResume((prev) =>
      prev ? { ...prev, experience: prev.experience.filter((_, i) => i !== idx) } : null
    );
  };

  const addProject = () => {
    setActiveResume((prev) =>
      prev
        ? {
            ...prev,
            projects: [
              ...prev.projects,
              { title: '', role: '', link: '', technologies: [], bullets: [''] },
            ],
          }
        : null
    );
  };

  const updateProject = (idx: number, field: string, val: unknown) => {
    setActiveResume((prev) => {
      if (!prev) return null;
      const updated = [...prev.projects];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, projects: updated };
    });
  };

  const removeProject = (idx: number) => {
    setActiveResume((prev) =>
      prev ? { ...prev, projects: prev.projects.filter((_, i) => i !== idx) } : null
    );
  };

  const addEducation = () => {
    setActiveResume((prev) =>
      prev
        ? {
            ...prev,
            education: [
              ...prev.education,
              { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', scoreOrGpa: '' },
            ],
          }
        : null
    );
  };

  const updateEducation = (idx: number, field: string, val: string) => {
    setActiveResume((prev) => {
      if (!prev) return null;
      const updated = [...prev.education];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, education: updated };
    });
  };

  const removeEducation = (idx: number) => {
    setActiveResume((prev) =>
      prev ? { ...prev, education: prev.education.filter((_, i) => i !== idx) } : null
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="animate-spin text-[#6542C5] dark:text-[#B59AF7]" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-none bg-[#F5F3FD] dark:bg-[#B59AF7]/10 text-[#6542C5] dark:text-[#B59AF7]">
                <FileText size={20} />
              </span>
              <h1 className="font-space text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Resume Maker & Analyzer
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create ATS-optimized resumes with AI bullet enhancement and 1-click PDF export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold shadow-sm transition-all"
            >
              <Upload size={16} className="text-[#6542C5] dark:text-[#B59AF7]" /> Upload / Analyze PDF
            </button>
            <button
              onClick={() => setEnhanceModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Sparkles size={16} /> Enhance with AI
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={16} /> {saving ? 'Saving...' : 'Save Resume'}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="btn-render-sweep inline-flex items-center gap-2 px-4 py-2.5 rounded-none bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] text-sm font-semibold shadow-xs disabled:opacity-50"
            >
              <Download size={16} /> {exporting ? 'Generating PDF...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Saved Resumes Selector Bar */}
        <div className="flex items-center justify-between overflow-x-auto gap-2 p-2 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 uppercase tracking-wider">
              My Resumes:
            </span>
            {resumes.map((r) => (
              <button
                key={r._id}
                onClick={() => setActiveResume(r)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeResume?._id === r._id
                    ? 'bg-white dark:bg-slate-800 text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {r.title || 'Untitled'}
                {r.isCurrent && <Star size={12} className="text-amber-500 fill-amber-500" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeResume?._id && !activeResume.isCurrent && (
              <button
                onClick={() => handleSetCurrent(activeResume._id)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-[#6542C5] dark:text-[#B59AF7] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400"
              >
                Make Current
              </button>
            )}
            {activeResume?._id && (
              <button
                onClick={() => handleDelete(activeResume._id)}
                className="text-xs text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Delete resume"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={createNewEmptyResume}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F3FD] dark:bg-[#B59AF7]/10 dark:bg-blue-950/40 text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] text-xs font-bold hover:bg-blue-100"
            >
              <Plus size={14} /> New Resume
            </button>
          </div>
        </div>

        {/* Main Editor Section */}
        {activeResume && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Navigation Tabs */}
            <div className="lg:col-span-3 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sections
              </div>
              {[
                { id: 'personal', label: 'Personal Details', icon: Briefcase },
                { id: 'summary', label: 'Professional Summary', icon: Sparkles },
                { id: 'experience', label: 'Experience & Internships', icon: Layers },
                { id: 'projects', label: 'Projects', icon: Wand2 },
                { id: 'education', label: 'Education', icon: GraduationCap },
                { id: 'skills', label: 'Skills & Tools', icon: Award },
                { id: 'certs', label: 'Certifications & Links', icon: LinkIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as never)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-[#6542C5] text-white dark:bg-[#B59AF7] dark:text-[#141217] shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-500 mb-1 px-1">
                  Resume Title
                </label>
                <input
                  type="text"
                  value={activeResume.title}
                  onChange={(e) => setActiveResume({ ...activeResume, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Software Engineer 2026"
                />
              </div>
            </div>

            {/* Active Section Content */}
            <div className="lg:col-span-9 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Personal Details */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase size={18} className="text-[#6542C5] dark:text-[#B59AF7]" /> Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={activeResume.personalDetails.fullName}
                        onChange={(e) => updatePersonal('fullName', e.target.value)}
                        placeholder="John Doe"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={activeResume.personalDetails.email}
                        onChange={(e) => updatePersonal('email', e.target.value)}
                        placeholder="john@example.com"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={activeResume.personalDetails.phone || ''}
                        onChange={(e) => updatePersonal('phone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Location / City
                      </label>
                      <input
                        type="text"
                        value={activeResume.personalDetails.location || ''}
                        onChange={(e) => updatePersonal('location', e.target.value)}
                        placeholder="San Francisco, CA"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="text"
                        value={activeResume.personalDetails.linkedIn || ''}
                        onChange={(e) => updatePersonal('linkedIn', e.target.value)}
                        placeholder="linkedin.com/in/username"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        GitHub / Portfolio URL
                      </label>
                      <input
                        type="text"
                        value={activeResume.personalDetails.gitHub || ''}
                        onChange={(e) => updatePersonal('gitHub', e.target.value)}
                        placeholder="github.com/username"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-purple-600" /> Professional Summary
                    </h3>
                    <button
                      onClick={() => {
                        setEnhanceSection('summary');
                        setEnhanceModalOpen(true);
                      }}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={13} /> Enhance with AI
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={activeResume.summary}
                    onChange={(e) => setActiveResume({ ...activeResume, summary: e.target.value })}
                    placeholder="Write a concise 3-4 sentence overview of your key expertise, technical background, and major achievements..."
                    className="w-full text-sm p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Experience */}
              {activeTab === 'experience' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers size={18} className="text-indigo-600" /> Work Experience & Internships
                    </h3>
                    <button
                      onClick={addExperience}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] bg-[#F5F3FD] dark:bg-[#B59AF7]/10 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                    >
                      <Plus size={14} /> Add Experience
                    </button>
                  </div>

                  {activeResume.experience.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-sm text-slate-500">No experience items added yet.</p>
                      <button
                        onClick={addExperience}
                        className="mt-3 text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] hover:underline"
                      >
                        + Add your first role or internship
                      </button>
                    </div>
                  )}

                  {activeResume.experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Position #{idx + 1}
                        </span>
                        <button
                          onClick={() => removeExperience(idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                          placeholder="Job Title / Role (e.g. Software Engineer)"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                          placeholder="Company Name"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={exp.startDate || ''}
                          onChange={(e) => updateExperience(idx, 'startDate', e.target.value)}
                          placeholder="Start Date (e.g. Jun 2023)"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={exp.endDate || ''}
                          onChange={(e) => updateExperience(idx, 'endDate', e.target.value)}
                          placeholder="End Date (or Present)"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Bullet Points (One per line)
                        </label>
                        <textarea
                          rows={3}
                          value={exp.bullets.join('\n')}
                          onChange={(e) =>
                            updateExperience(
                              idx,
                              'bullets',
                              e.target.value.split('\n').filter(Boolean)
                            )
                          }
                          placeholder="• Engineered high-performance backend APIs...&#10;• Reduced latency by 35% using caching..."
                          className="w-full text-xs p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {activeTab === 'projects' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Wand2 size={18} className="text-[#6542C5] dark:text-[#B59AF7]" /> Academic & Personal Projects
                    </h3>
                    <button
                      onClick={addProject}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] bg-[#F5F3FD] dark:bg-[#B59AF7]/10 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                    >
                      <Plus size={14} /> Add Project
                    </button>
                  </div>

                  {activeResume.projects.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-sm text-slate-500">No projects added yet.</p>
                      <button
                        onClick={addProject}
                        className="mt-3 text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] hover:underline"
                      >
                        + Add your first project
                      </button>
                    </div>
                  )}

                  {activeResume.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Project #{idx + 1}
                        </span>
                        <button
                          onClick={() => removeProject(idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => updateProject(idx, 'title', e.target.value)}
                          placeholder="Project Title"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={proj.technologies?.join(', ') || ''}
                          onChange={(e) =>
                            updateProject(
                              idx,
                              'technologies',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="Tech Stack (comma-separated, e.g. React, Node, Redis)"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Bullet Points (One per line)
                        </label>
                        <textarea
                          rows={3}
                          value={proj.bullets.join('\n')}
                          onChange={(e) =>
                            updateProject(
                              idx,
                              'bullets',
                              e.target.value.split('\n').filter(Boolean)
                            )
                          }
                          placeholder="• Built a full-stack platform using TypeScript and MongoDB...&#10;• Implemented JWT authentication and real-time updates..."
                          className="w-full text-xs p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {activeTab === 'education' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <GraduationCap size={18} className="text-emerald-600" /> Education
                    </h3>
                    <button
                      onClick={addEducation}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] bg-[#F5F3FD] dark:bg-[#B59AF7]/10 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                    >
                      <Plus size={14} /> Add Education
                    </button>
                  </div>

                  {activeResume.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Institution #{idx + 1}
                        </span>
                        <button
                          onClick={() => removeEducation(idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                          placeholder="University / College Name"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                          placeholder="Degree (e.g. B.Tech / B.S.)"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={edu.fieldOfStudy || ''}
                          onChange={(e) => updateEducation(idx, 'fieldOfStudy', e.target.value)}
                          placeholder="Field of Study / Major"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={edu.scoreOrGpa || ''}
                          onChange={(e) => updateEducation(idx, 'scoreOrGpa', e.target.value)}
                          placeholder="GPA / Percentage (e.g. 3.8 / 85%)"
                          className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award size={18} className="text-amber-500" /> Skills & Competencies
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter technical skills, frameworks, and programming languages separated by commas.
                  </p>
                  <textarea
                    rows={4}
                    value={activeResume.skills.join(', ')}
                    onChange={(e) =>
                      setActiveResume({
                        ...activeResume,
                        skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="JavaScript, TypeScript, React, Node.js, Express, MongoDB, Docker, Git, Python..."
                    className="w-full text-sm p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {activeResume.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#F5F3FD] dark:bg-[#B59AF7]/10 dark:bg-blue-950/40 text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] text-xs font-semibold border border-[#C8B8F5] dark:border-[#B59AF7]/20/50 dark:border-blue-900/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications & Links */}
              {activeTab === 'certs' && (
                <div className="space-y-4">
                  <h3 className="font-space text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <LinkIcon size={18} className="text-teal-600" /> Certifications & Links
                  </h3>
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Certifications (Format: Name | Issuer)
                    </label>
                    <textarea
                      rows={3}
                      value={activeResume.certifications.map((c) => `${c.name} | ${c.issuer}`).join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').filter(Boolean);
                        const certs: ResumeCertification[] = lines.map((line) => {
                          const [name, issuer] = line.split('|').map((s) => s.trim());
                          return { name: name || 'Certification', issuer: issuer || '' };
                        });
                        setActiveResume({ ...activeResume, certifications: certs });
                      }}
                      placeholder="AWS Certified Solutions Architect | Amazon&#10;Google Cloud Associate Engineer | Google"
                      className="w-full text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Enhancement Modal */}
        <AnimatePresence>
          {enhanceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                    <Sparkles size={20} />
                    <h3 className="font-space text-lg text-slate-900 dark:text-white">
                      AI Resume Polish & ATS Optimizer
                    </h3>
                  </div>
                  <button
                    onClick={() => setEnhanceModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Gemini will refine your bullet points using strong action verbs, quantifiable metrics formatting, and industry-standard keywords without inventing fake qualifications.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Role / Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior Backend Engineer"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Job Description Snippet (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste keywords from target job posting..."
                      className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Section to Polish
                    </label>
                    <select
                      value={enhanceSection}
                      onChange={(e) => setEnhanceSection(e.target.value as never)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="all">Entire Resume (Summary, Experience & Projects)</option>
                      <option value="summary">Summary Only</option>
                      <option value="experience">Experience Bullets Only</option>
                      <option value="projects">Projects Bullets Only</option>
                      <option value="skills">Skills Optimization</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEnhanceModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnhanceWithAI}
                    disabled={enhancing}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {enhancing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Polishing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Apply Enhancements
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Upload & Deep Analysis Modal */}
        <AnimatePresence>
          {uploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7] font-bold">
                    <Upload size={20} />
                    <h3 className="font-space text-lg text-slate-900 dark:text-white">
                      Upload Resume for Deep ATS Audit
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setUploadModalOpen(false);
                      setAnalysisResult(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                {!analysisResult ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fileInput = (e.currentTarget.elements.namedItem('resumeFile') as HTMLInputElement);
                      if (!fileInput?.files?.[0]) {
                        showToast('Please select a PDF or DOCX file.', 'error');
                        return;
                      }
                      const formData = new FormData();
                      formData.append('file', fileInput.files[0]);
                      if (targetRole) formData.append('targetRole', targetRole);
                      if (jobDescription) formData.append('jobDescription', jobDescription);

                      setAnalyzingFile(true);
                      try {
                        const data = await resumeService.uploadAndAnalyze(formData);
                        setAnalysisResult(data.analysis);
                        showToast('Deep resume analysis complete!', 'success');
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : 'Analysis failed.';
                        showToast(msg, 'error');
                      } finally {
                        setAnalyzingFile(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-slate-500">
                      Upload your current PDF or Word resume. Our AI audit scans across 10 dimensions: ATS score, recruiter impression, missing keywords, and weak bullet points.
                    </p>

                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type="file"
                        name="resumeFile"
                        id="resumeFileInput"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => {
                          const label = document.getElementById('selectedFileLabel');
                          if (label && e.target.files?.[0]) {
                            label.innerText = `Selected: ${e.target.files[0].name}`;
                          }
                        }}
                      />
                      <label htmlFor="resumeFileInput" className="cursor-pointer space-y-2 block">
                        <Upload size={32} className="mx-auto text-[#6542C5] dark:text-[#B59AF7] dark:text-[#B59AF7]" />
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                          Click to browse PDF or Word DOCX
                        </span>
                        <span id="selectedFileLabel" className="block text-xs text-slate-500">
                          Maximum file size: 15MB
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Role (Optional)
                      </label>
                      <input
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Frontend Developer Intern"
                        className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setUploadModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={analyzingFile}
                        className="btn-render-sweep inline-flex items-center gap-2 px-5 py-2 rounded-none bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] text-xs font-bold disabled:opacity-50"
                      >
                        {analyzingFile ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> Deep Scanning...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} /> Start Deep Audit
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-xs">
                    {/* Score Bar */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                      <div>
                        <span className="text-2xl font-bold text-[#6542C5] dark:text-[#B59AF7]">{analysisResult.scores?.overall}/100</span>
                        <p className="text-slate-500 font-semibold">Overall Quality</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-emerald-600">{analysisResult.scores?.ats}/100</span>
                        <p className="text-slate-500 font-semibold">ATS Compatibility</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-purple-600">{analysisResult.scores?.recruiterImpression}/100</span>
                        <p className="text-slate-500 font-semibold">Recruiter Score</p>
                      </div>
                    </div>

                    {/* Feedback summary */}
                    <div className="p-3 bg-[#F5F3FD] dark:bg-[#B59AF7]/10 dark:bg-blue-950/40 rounded-xl text-blue-900 dark:text-blue-200">
                      <p className="font-bold mb-1">Executive Summary:</p>
                      <p>{analysisResult.explanations?.overallFeedback}</p>
                    </div>

                    {/* Weaknesses */}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">Top Weaknesses Detected:</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {analysisResult.weaknesses?.slice(0, 4).map((w: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
                            <span className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[10px] tracking-wide">
                              [{w.severity}] {w.section}
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{w.problem}</p>
                            <p className="text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">Fix: {w.fix}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setAnalysisResult(null)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        Scan Another Resume
                      </button>
                      <button
                        onClick={() => {
                          if (analysisResult.rewrittenContent?.summary) {
                            setActiveResume((prev) => prev ? { ...prev, summary: analysisResult.rewrittenContent.summary } : null);
                          }
                          setUploadModalOpen(false);
                          showToast('Audit improvements loaded into editor!', 'success');
                        }}
                        className="btn-render-sweep px-4 py-2 rounded-none bg-[#6542C5] dark:bg-[#B59AF7] text-white dark:text-[#141217] font-bold text-xs"
                      >
                        Apply Fixes to Editor
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
