import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Github, Mail } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Features', href: '/#features' },
      { label: 'Progress tracking', href: '/#progress' },
      { label: 'AI tutor', href: '/#ai-preview' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Study guides', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: 'mailto:hello@nova.study' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#141217]/90 backdrop-blur-xl dark:bg-[#1D1922]/90">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-[#B8AFBE]">
              Your AI study coach. Personalized plans, adaptive re-planning, and instant doubt solving — all in one
              place.
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href="#"
                aria-label="GitHub"
                className="rounded-none border border-white/10 p-2 text-[#B8AFBE] transition hover:bg-white/5 hover:text-white"
              >
                <Github size={16} />
              </a>
              <a
                href="mailto:hello@nova.study"
                aria-label="Email"
                className="rounded-none border border-white/10 p-2 text-[#B8AFBE] transition hover:bg-white/5 hover:text-white"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-[#B8AFBE] transition hover:text-[#B59AF7]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#7E7589] sm:flex-row">
          <p>© {new Date().getFullYear()} Cadence Learning. Built for curious minds.</p>
          <p>Made with care for curious minds.</p>
        </div>
      </div>
    </footer>
  );
}
