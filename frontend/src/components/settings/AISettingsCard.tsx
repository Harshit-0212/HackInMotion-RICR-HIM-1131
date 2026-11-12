import { useState, useEffect } from 'react';
import { Key, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/store/ToastContext';
import { userApiKeyService, type UserApiKeyStatus } from '@/services/userApiKeyService';

export function AISettingsCard() {
  const { showToast } = useToast();
  const [geminiStatus, setGeminiStatus] = useState<UserApiKeyStatus | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    userApiKeyService.getGeminiStatus()
      .then(setGeminiStatus)
      .catch(() => setGeminiStatus({ connected: false }));
  }, []);

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeyFeedback({ type: 'error', message: 'Enter an API key before testing.' });
      return;
    }
    setIsTestingKey(true);
    setKeyFeedback(null);
    try {
      const res = await userApiKeyService.testGeminiKey(apiKeyInput.trim());
      if (res.warning) {
        setKeyFeedback({ type: 'success', message: res.warning });
      } else {
        setKeyFeedback({ type: 'success', message: 'Valid key! Google accepted the verification test.' });
      }
    } catch (err: unknown) {
      setKeyFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Key validation failed.' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeyFeedback({ type: 'error', message: 'API key is required.' });
      return;
    }
    setIsSavingKey(true);
    setKeyFeedback(null);
    try {
      const res = await userApiKeyService.saveGeminiKey(apiKeyInput.trim());
      setGeminiStatus({ connected: true, keyHint: res.keyHint, updatedAt: res.updatedAt });
      setApiKeyInput('');
      setKeyFeedback({ type: 'success', message: 'Gemini key safely encrypted and saved!' });
      showToast('Gemini API key connected successfully.', 'success');
    } catch (err: unknown) {
      setKeyFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    setIsDeletingKey(true);
    setKeyFeedback(null);
    try {
      await userApiKeyService.deleteGeminiKey();
      setGeminiStatus({ connected: false });
      setApiKeyInput('');
      showToast('Gemini API key disconnected.', 'info');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not remove key', 'error');
    } finally {
      setIsDeletingKey(false);
    }
  };

  return (
    <div id="ai-settings" className="lg:col-span-2">
      <Card padding="lg">
        <CardHeader
          title="Google Gemini AI Integration"
          subtitle="Connect your personal Gemini API key for private, unthrottled AI study features."
        />
        <div className="space-y-4 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Key size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-900 dark:text-ink-50">
                  {geminiStatus?.connected ? 'Gemini API Key Connected' : 'No Personal Key Connected'}
                </p>
                <p className="text-[11px] text-ink-500 dark:text-ink-400">
                  {geminiStatus?.connected && geminiStatus.keyHint
                    ? `Active Key: ${geminiStatus.keyHint}`
                    : 'Features use default platform capacity if available.'}
                </p>
              </div>
            </div>
            <Badge tone={geminiStatus?.connected ? 'success' : 'neutral'}>
              {geminiStatus?.connected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>

          <div className="space-y-2">
            <label htmlFor="gemini-key-input" className="block text-xs font-medium text-ink-700 dark:text-ink-300">
              {geminiStatus?.connected ? 'Replace API Key' : 'Enter Gemini API Key'}
            </label>
            <div className="relative">
              <input
                id="gemini-key-input"
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full h-10 px-3 pr-10 text-xs font-mono rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="absolute right-3 top-2.5 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-ink-400">
              Get an API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6542C5] hover:underline inline-flex items-center gap-0.5"
              >
                Google AI Studio &nearr;
              </a>
            </p>
          </div>

          {keyFeedback && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                keyFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {keyFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{keyFeedback.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveKey}
              disabled={isSavingKey || isTestingKey || !apiKeyInput.trim()}
            >
              {isSavingKey ? 'Saving...' : geminiStatus?.connected ? 'Update Key' : 'Save Key'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestKey}
              disabled={isSavingKey || isTestingKey || !apiKeyInput.trim()}
            >
              {isTestingKey ? 'Verifying...' : 'Test Key'}
            </Button>
            {geminiStatus?.connected && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteKey}
                disabled={isDeletingKey}
              >
                {isDeletingKey ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-ink-100 dark:border-ink-800 text-[11px] text-ink-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Encrypted at rest with AES-256-GCM. Raw credentials are never stored or logged in plaintext.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
