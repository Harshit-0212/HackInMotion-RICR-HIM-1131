import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/store/AuthContext';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  onStart,
}: {
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
  onStart?: () => void;
}) {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (!window.google || !containerRef.current) {
        setTimeout(tryInit, 100);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          setIsVerifying(true);
          onStart?.();
          try {
            const user = await loginWithGoogle(response.credential);
            onSuccess(user);
          } catch (err) {
            setIsVerifying(false);
            onError(err instanceof Error ? err.message : 'Google sign-in failed.');
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
      setReady(true);
    };

    tryInit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        ref={containerRef}
        className={ready && !isVerifying ? '' : 'h-11 w-full max-w-[320px] animate-pulse rounded-xl bg-white/5'}
      />
      {isVerifying && (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6542C5] dark:text-[#B59AF7]" />
          <span>Signing you in with Google…</span>
        </div>
      )}
    </div>
  );
}
