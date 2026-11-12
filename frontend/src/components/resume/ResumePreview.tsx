import React from 'react';
import type { StoredResume } from '../../services/resumeService';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, ExternalLink } from 'lucide-react';

interface ResumePreviewProps {
  resume: StoredResume;
  className?: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resume, className = '' }) => {
  const template = resume.template || 'classic-ats';
  const accent = resume.accentColor || '#6542C5';
  const font = resume.fontFamily || 'Inter, sans-serif';
  const { personalDetails: pd, summary, education = [], experience = [], projects = [], skills = [], certifications = [], achievements = [] } = resume;

  const photoClass = pd.photoShape === 'square' ? 'rounded-none' : pd.photoShape === 'rounded' ? 'rounded-2xl' : 'rounded-full';

  // Template 1: Classic ATS (Single column, clean, ATS standard)
  if (template === 'classic-ats') {
    return (
      <div style={{ fontFamily: font }} className={`bg-white text-zinc-900 p-8 shadow-md border border-zinc-200 rounded-lg text-sm leading-relaxed max-w-[800px] mx-auto min-h-[900px] ${className}`}>
        <div className="text-center border-b border-zinc-300 pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 uppercase">{pd.fullName || 'Your Name'}</h1>
          <div className="flex flex-wrap justify-center items-center gap-3 mt-2 text-xs text-zinc-600">
            {pd.email && <span>{pd.email}</span>}
            {pd.phone && <span>• {pd.phone}</span>}
            {pd.location && <span>• {pd.location}</span>}
            {pd.linkedIn && <span>• {pd.linkedIn}</span>}
            {pd.gitHub && <span>• {pd.gitHub}</span>}
          </div>
        </div>

        {summary && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-200 pb-0.5 mb-1.5">Professional Summary</h2>
            <p className="text-xs text-zinc-800 leading-normal text-justify">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-200 pb-0.5 mb-2">Work Experience</h2>
            <div className="space-y-3">
              {experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline text-xs font-semibold text-zinc-900">
                    <span>{exp.role} — <span className="font-normal text-zinc-700">{exp.company}</span></span>
                    <span className="text-zinc-500 font-normal">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-zinc-700">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-200 pb-0.5 mb-2">Projects</h2>
            <div className="space-y-2.5">
              {projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline text-xs font-semibold text-zinc-900">
                    <span>{proj.title} {proj.technologies && proj.technologies.length > 0 && <span className="font-normal text-zinc-500">({proj.technologies.join(', ')})</span>}</span>
                    {proj.link && <span className="text-zinc-500 font-normal">{proj.link}</span>}
                  </div>
                  {proj.bullets && proj.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-zinc-700">
                      {proj.bullets.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-200 pb-0.5 mb-1.5">Technical Skills</h2>
            <p className="text-xs text-zinc-800">{skills.join(' • ')}</p>
          </div>
        )}

        {education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-200 pb-0.5 mb-2">Education</h2>
            <div className="space-y-1.5">
              {education.map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold text-zinc-900">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''} — <span className="font-normal text-zinc-700">{edu.institution}</span></span>
                  <span className="text-zinc-500">{edu.startDate} – {edu.endDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Template 2: Modern Two-Column (Sidebar with photo, accent color, clean modern feel)
  if (template === 'modern-two-col') {
    return (
      <div style={{ fontFamily: font }} className={`bg-white text-zinc-900 shadow-md border border-zinc-200 rounded-lg max-w-[800px] mx-auto min-h-[900px] flex overflow-hidden ${className}`}>
        {/* Left Column Sidebar */}
        <div style={{ backgroundColor: `${accent}12`, borderRightColor: `${accent}33` }} className="w-1/3 p-6 border-r flex flex-col gap-5">
          {pd.photoUrl && (
            <div className="flex justify-center">
              <img src={pd.photoUrl} alt="Profile" className={`w-28 h-28 object-cover border-2 shadow-sm ${photoClass}`} style={{ borderColor: accent }} />
            </div>
          )}
          <div>
            <h1 style={{ color: accent }} className="text-xl font-bold leading-tight">{pd.fullName || 'Your Name'}</h1>
            <p className="text-xs text-zinc-600 mt-1 font-medium">{experience[0]?.role || 'Professional'}</p>
          </div>

          <div className="space-y-2 text-xs text-zinc-700">
            <h3 style={{ color: accent }} className="font-bold uppercase tracking-wider text-[11px] border-b pb-1">Contact</h3>
            {pd.email && <div className="flex items-center gap-2"><Mail size={12} className="shrink-0" /> <span className="truncate">{pd.email}</span></div>}
            {pd.phone && <div className="flex items-center gap-2"><Phone size={12} className="shrink-0" /> <span>{pd.phone}</span></div>}
            {pd.location && <div className="flex items-center gap-2"><MapPin size={12} className="shrink-0" /> <span>{pd.location}</span></div>}
            {pd.linkedIn && <div className="flex items-center gap-2"><Linkedin size={12} className="shrink-0" /> <span className="truncate">{pd.linkedIn}</span></div>}
            {pd.gitHub && <div className="flex items-center gap-2"><Github size={12} className="shrink-0" /> <span className="truncate">{pd.gitHub}</span></div>}
          </div>

          {skills.length > 0 && (
            <div>
              <h3 style={{ color: accent }} className="font-bold uppercase tracking-wider text-[11px] border-b pb-1 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, idx) => (
                  <span key={idx} style={{ backgroundColor: `${accent}20`, color: accent }} className="px-2 py-0.5 rounded text-[11px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h3 style={{ color: accent }} className="font-bold uppercase tracking-wider text-[11px] border-b pb-1 mb-2">Education</h3>
              <div className="space-y-2 text-xs">
                {education.map((edu, idx) => (
                  <div key={idx}>
                    <p className="font-semibold text-zinc-900">{edu.degree}</p>
                    <p className="text-zinc-600 text-[11px]">{edu.institution}</p>
                    <p className="text-zinc-500 text-[10px]">{edu.startDate} – {edu.endDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Column */}
        <div className="w-2/3 p-6 flex flex-col gap-5">
          {summary && (
            <div>
              <h2 style={{ color: accent }} className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2">About Me</h2>
              <p className="text-xs text-zinc-700 leading-relaxed">{summary}</p>
            </div>
          )}

          {experience.length > 0 && (
            <div>
              <h2 style={{ color: accent }} className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3">Work Experience</h2>
              <div className="space-y-3">
                {experience.map((exp, idx) => (
                  <div key={idx} className="relative pl-3 border-l-2" style={{ borderColor: `${accent}40` }}>
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-bold text-zinc-900">{exp.role}</h4>
                      <span className="text-[10px] text-zinc-500">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-600 mb-1">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                    {exp.bullets && (
                      <ul className="list-disc list-outside ml-3 space-y-0.5 text-xs text-zinc-700">
                        {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h2 style={{ color: accent }} className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3">Key Projects</h2>
              <div className="space-y-2.5">
                {projects.map((p, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline text-xs font-semibold text-zinc-900">
                      <span>{p.title}</span>
                      {p.link && <span className="text-[10px] text-zinc-400">{p.link}</span>}
                    </div>
                    {p.bullets && (
                      <ul className="list-disc list-outside ml-3 mt-1 space-y-0.5 text-xs text-zinc-700">
                        {p.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Template 3: Minimal (Clean, generous whitespace, understated elegance)
  if (template === 'minimal') {
    return (
      <div style={{ fontFamily: font }} className={`bg-white text-zinc-800 p-10 shadow-md border border-zinc-200 rounded-lg text-sm max-w-[800px] mx-auto min-h-[900px] ${className}`}>
        <div className="mb-6">
          <h1 className="text-3xl font-light tracking-wide text-zinc-900">{pd.fullName || 'Your Name'}</h1>
          <p className="text-xs tracking-wider uppercase text-zinc-500 mt-1">{pd.location} • {pd.email} • {pd.phone}</p>
        </div>

        {summary && (
          <div className="mb-6 pb-6 border-b border-zinc-100">
            <p className="text-xs leading-relaxed text-zinc-600">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Experience</h3>
            <div className="space-y-4">
              {experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium text-zinc-900">{exp.role} / <span className="text-zinc-600">{exp.company}</span></span>
                    <span className="text-[11px] text-zinc-400">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
                  </div>
                  {exp.bullets && (
                    <ul className="mt-1 space-y-1 text-xs text-zinc-600 ml-4 list-disc">
                      {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Selected Works</h3>
            <div className="space-y-3">
              {projects.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-medium text-zinc-900">
                    <span>{p.title}</span>
                    <span className="text-zinc-400 text-[11px]">{p.technologies?.join(', ')}</span>
                  </div>
                  {p.bullets && (
                    <ul className="mt-1 space-y-0.5 text-xs text-zinc-600 ml-4 list-disc">
                      {p.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Capabilities</h3>
            <p className="text-xs text-zinc-600">{skills.join(', ')}</p>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Education</h3>
            {education.map((e, i) => (
              <div key={i} className="flex justify-between text-xs text-zinc-700">
                <span>{e.degree}, {e.institution}</span>
                <span className="text-zinc-400">{e.endDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Template 4: Creative Accent (Hero banner in accent color, badge tags, high visual interest)
  if (template === 'creative-accent') {
    return (
      <div style={{ fontFamily: font }} className={`bg-white text-zinc-900 shadow-md border border-zinc-200 rounded-lg max-w-[800px] mx-auto min-h-[900px] overflow-hidden ${className}`}>
        {/* Banner */}
        <div style={{ backgroundColor: accent }} className="p-8 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{pd.fullName || 'Your Name'}</h1>
            <p className="text-white/80 text-xs mt-1 font-medium">{experience[0]?.role || 'Specialist'}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-white/90">
              {pd.email && <span>{pd.email}</span>}
              {pd.phone && <span>• {pd.phone}</span>}
              {pd.location && <span>• {pd.location}</span>}
            </div>
          </div>
          {pd.photoUrl && (
            <img src={pd.photoUrl} alt="Profile" className={`w-20 h-20 object-cover border-2 border-white shadow ${photoClass}`} />
          )}
        </div>

        <div className="p-6 space-y-5">
          {summary && (
            <div className="bg-zinc-50 p-3 rounded-lg border-l-4" style={{ borderColor: accent }}>
              <p className="text-xs text-zinc-700 leading-relaxed">{summary}</p>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h3 style={{ color: accent }} className="text-xs font-bold uppercase tracking-wider mb-2">Core Competencies</h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, idx) => (
                  <span key={idx} style={{ backgroundColor: `${accent}15`, color: accent, borderColor: `${accent}30` }} className="px-2.5 py-1 rounded-full text-xs font-semibold border">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {experience.length > 0 && (
            <div>
              <h3 style={{ color: accent }} className="text-xs font-bold uppercase tracking-wider mb-2">Professional Journey</h3>
              <div className="space-y-3">
                {experience.map((exp, i) => (
                  <div key={i} className="border-b border-zinc-100 pb-3 last:border-b-0">
                    <div className="flex justify-between text-xs font-bold text-zinc-900">
                      <span>{exp.role} <span className="font-medium text-zinc-500">at {exp.company}</span></span>
                      <span className="text-zinc-400 font-normal">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                    </div>
                    {exp.bullets && (
                      <ul className="list-disc ml-4 mt-1 space-y-0.5 text-xs text-zinc-600">
                        {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h3 style={{ color: accent }} className="text-xs font-bold uppercase tracking-wider mb-2">Notable Projects</h3>
              <div className="grid grid-cols-2 gap-3">
                {projects.map((p, i) => (
                  <div key={i} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <p className="text-xs font-bold text-zinc-900">{p.title}</p>
                    {p.bullets && <p className="text-[11px] text-zinc-600 mt-1 line-clamp-2">{p.bullets[0]}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h3 style={{ color: accent }} className="text-xs font-bold uppercase tracking-wider mb-2">Education</h3>
              {education.map((e, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="font-semibold text-zinc-800">{e.degree} — <span className="font-normal text-zinc-600">{e.institution}</span></span>
                  <span className="text-zinc-500">{e.startDate} – {e.endDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Template 5: Executive (Authoritative serif headings, boxed header, two-line layout)
  if (template === 'executive') {
    return (
      <div style={{ fontFamily: font }} className={`bg-white text-zinc-900 p-8 shadow-md border border-zinc-300 rounded-lg text-sm max-w-[800px] mx-auto min-h-[900px] ${className}`}>
        <div className="border-4 border-zinc-800 p-6 text-center mb-6">
          <h1 className="text-2xl font-serif font-bold tracking-widest text-zinc-900 uppercase">{pd.fullName || 'Executive Candidate'}</h1>
          <p className="text-xs tracking-wider text-zinc-600 mt-1 uppercase font-semibold">{experience[0]?.role || 'Senior Professional'}</p>
          <div className="flex justify-center gap-4 text-xs text-zinc-500 mt-3 border-t border-zinc-200 pt-2">
            {pd.email && <span>{pd.email}</span>}
            {pd.phone && <span>{pd.phone}</span>}
            {pd.location && <span>{pd.location}</span>}
          </div>
        </div>

        {summary && (
          <div className="mb-5">
            <h2 className="font-serif font-bold text-xs uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-800 pb-1 mb-2">Executive Profile</h2>
            <p className="text-xs text-zinc-800 leading-relaxed text-justify">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mb-5">
            <h2 className="font-serif font-bold text-xs uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-800 pb-1 mb-3">Leadership & Experience</h2>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-serif text-xs font-bold text-zinc-900">
                    <span>{exp.company} — <span className="font-normal italic">{exp.role}</span></span>
                    <span className="text-zinc-600 font-sans">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                  </div>
                  {exp.bullets && (
                    <ul className="list-disc ml-4 mt-1 space-y-0.5 text-xs text-zinc-700">
                      {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="font-serif font-bold text-xs uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-800 pb-1 mb-2">Core Competencies</h2>
            <p className="text-xs text-zinc-800">{skills.join('  |  ')}</p>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h2 className="font-serif font-bold text-xs uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-800 pb-1 mb-2">Education & Credentials</h2>
            {education.map((e, idx) => (
              <div key={idx} className="flex justify-between text-xs text-zinc-800">
                <span className="font-semibold">{e.degree}, {e.institution}</span>
                <span className="text-zinc-500">{e.startDate} – {e.endDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Template 6: Compact One-Page (Ultra dense, fits maximum information on single page)
  return (
    <div style={{ fontFamily: font }} className={`bg-white text-zinc-900 p-6 shadow-md border border-zinc-200 rounded-lg text-xs max-w-[800px] mx-auto min-h-[900px] ${className}`}>
      <div className="flex justify-between items-end border-b border-zinc-400 pb-2 mb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">{pd.fullName || 'Your Name'}</h1>
          <p className="text-[11px] text-zinc-600 font-medium">{experience[0]?.role || 'Specialist'}</p>
        </div>
        <div className="text-right text-[10px] text-zinc-600 space-y-0.5">
          <p>{pd.email} • {pd.phone}</p>
          <p>{pd.location} • {pd.linkedIn || pd.gitHub}</p>
        </div>
      </div>

      {summary && (
        <div className="mb-3">
          <p className="text-[11px] text-zinc-700 leading-snug">{summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-3">
          <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-800 mr-2">Skills:</span>
          <span className="text-[11px] text-zinc-700">{skills.join(', ')}</span>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-3">
          <h2 className="font-bold uppercase tracking-wider text-[10px] text-zinc-800 border-b border-zinc-200 pb-0.5 mb-1.5">Experience</h2>
          <div className="space-y-2">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between font-semibold text-[11px]">
                  <span>{exp.role}, {exp.company}</span>
                  <span className="text-zinc-500 text-[10px]">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                {exp.bullets && (
                  <ul className="list-disc ml-3 space-y-0.5 text-[10px] text-zinc-600">
                    {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-3">
          <h2 className="font-bold uppercase tracking-wider text-[10px] text-zinc-800 border-b border-zinc-200 pb-0.5 mb-1.5">Projects</h2>
          <div className="space-y-1.5">
            {projects.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between font-semibold text-[11px]">
                  <span>{p.title}</span>
                  <span className="text-zinc-500 text-[10px]">{p.technologies?.join(', ')}</span>
                </div>
                {p.bullets && (
                  <ul className="list-disc ml-3 space-y-0.5 text-[10px] text-zinc-600">
                    {p.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div>
          <h2 className="font-bold uppercase tracking-wider text-[10px] text-zinc-800 border-b border-zinc-200 pb-0.5 mb-1">Education</h2>
          {education.map((e, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span>{e.degree}, {e.institution}</span>
              <span className="text-zinc-500 text-[10px]">{e.startDate} – {e.endDate}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

