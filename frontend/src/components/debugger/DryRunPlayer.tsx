import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  Layers,
  Terminal,
  Variable,
  Globe2,
  Sparkles,
  Info,
} from 'lucide-react';
import type { DryRunStep, SupportedDebuggerLanguage } from '@/types/debugger';

interface DryRunPlayerProps {
  code: string;
  language: SupportedDebuggerLanguage;
  steps: DryRunStep[];
  narrationEnglish: string[];
  narrationHinglish: string[];
  initialLanguage?: 'english' | 'hinglish';
  onLineSelect?: (line: number) => void;
}

export function DryRunPlayer({
  code,
  language,
  steps,
  narrationEnglish,
  narrationHinglish,
  initialLanguage = 'english',
  onLineSelect,
}: DryRunPlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [narrationLang, setNarrationLang] = useState<'english' | 'hinglish'>(initialLanguage);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const codeLines = code.split('\n');
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const totalSteps = steps.length;
  const currentStep: DryRunStep | undefined = steps[currentStepIndex];

  // Current narration text
  const currentNarration =
    narrationLang === 'hinglish'
      ? narrationHinglish[currentStepIndex] || currentStep?.description || ''
      : narrationEnglish[currentStepIndex] || currentStep?.description || '';

  // Speech synthesis
  const speakCurrentStep = useCallback(
    (text: string) => {
      if (!voiceEnabled || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      if (!text.trim()) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed >= 1.5 ? 1.1 : 0.95;
      utterance.pitch = 1.0;
      utterance.lang = narrationLang === 'hinglish' ? 'hi-IN' : 'en-US';

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, speed, narrationLang]
  );

  // Stop voice when unmounting or disabled
  useEffect(() => {
    if (!voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [voiceEnabled]);

  // Voice narration on step change
  useEffect(() => {
    if (voiceEnabled && currentNarration) {
      speakCurrentStep(currentNarration);
    }
  }, [currentStepIndex, voiceEnabled, speakCurrentStep, currentNarration]);

  // Auto-scroll highlighted code line into view smoothly
  useEffect(() => {
    if (activeLineRef.current && codeContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentStepIndex]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, totalSteps]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleRestart = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Timer loop for playback
  useEffect(() => {
    if (isPlaying) {
      const delay = Math.round(1800 / speed);
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isPlaying, currentStepIndex, totalSteps, speed]);

  // Keyboard shortcuts: Space (play/pause), Left Arrow (prev), Right Arrow (next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNext, handlePrev]);

  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
          No dry-run steps available for this code snippet.
        </p>
      </div>
    );
  }

  const activeLine = currentStep ? currentStep.line : -1;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Top Header / Player Controls Bar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3">
        {/* Step counter & event badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 font-mono text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>
              Step {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>

          {currentStep?.event && (
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider ${
                currentStep.isErrorStep
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : currentStep.event === 'function-call' || currentStep.event === 'return'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-900'
                    : currentStep.event === 'loop-iteration'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
              }`}
            >
              {currentStep.event}
            </span>
          )}
        </div>

        {/* Playback action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRestart}
            title="Restart from Step 1"
            className="p-1.5 rounded-lg text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            title="Previous Step (Left Arrow)"
            className="p-1.5 rounded-lg text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Play
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentStepIndex === totalSteps - 1}
            title="Next Step (Right Arrow)"
            className="p-1.5 rounded-lg text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center ml-2 border border-gray-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-900 text-xs">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  speed === s
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Audio narration & Language toggles */}
        <div className="flex items-center gap-2">
          {/* Narration language switch */}
          <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-900 text-xs">
            <button
              type="button"
              onClick={() => setNarrationLang('english')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                narrationLang === 'english'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-semibold'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              <Globe2 className="w-3 h-3" /> EN
            </button>
            <button
              type="button"
              onClick={() => setNarrationLang('hinglish')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                narrationLang === 'hinglish'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 font-semibold'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              <Globe2 className="w-3 h-3" /> Hinglish
            </button>
          </div>

          {/* Web Speech Voice Narration */}
          {'speechSynthesis' in window && (
            <button
              type="button"
              onClick={() => setVoiceEnabled((prev) => !prev)}
              title={voiceEnabled ? 'Mute AI voice narration' : 'Enable AI voice narration'}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                voiceEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 text-gray-500 border-gray-200 dark:border-slate-700 hover:text-gray-700'
              }`}
            >
              {voiceEnabled ? (
                <Volume2 className={`w-4 h-4 ${speaking ? 'animate-pulse text-emerald-500' : ''}`} />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Narration Banner */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent border-b border-gray-200 dark:border-slate-800 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-gray-800 dark:text-slate-200 leading-relaxed font-sans">
          <span className="font-semibold text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wide mr-2">
            {narrationLang === 'hinglish' ? 'Hinglish Narration:' : 'Narration:'}
          </span>
          {currentNarration || currentStep?.description}
        </div>
      </div>

      {/* Error alert banner if step is an error */}
      {currentStep?.isErrorStep && (
        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">RUNTIME / TRACE ERROR:</span>
          <span>{currentStep.errorMessage || 'Execution halted at this step.'}</span>
        </div>
      )}

      {/* Main Grid: Code Editor (Left) & State Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-slate-800">
        {/* Left Side: Code Visualizer */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950 text-slate-100 font-mono text-xs overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-[11px] text-slate-400 flex items-center justify-between">
            <span>source.{language}</span>
            <span className="text-[10px] text-slate-500">
              Active Line: {activeLine > 0 ? activeLine : 'None'}
            </span>
          </div>

          <div
            ref={codeContainerRef}
            className="flex-1 overflow-auto p-2 code-scroll text-[12px] leading-5 font-mono select-text"
          >
            {codeLines.map((lineContent, idx) => {
              const lineNum = idx + 1;
              const isCurrent = lineNum === activeLine;
              const isError = isCurrent && currentStep?.isErrorStep;

              return (
                <div
                  key={lineNum}
                  ref={isCurrent ? activeLineRef : undefined}
                  onClick={() => onLineSelect?.(lineNum)}
                  className={`flex items-start rounded px-1 transition-colors group cursor-pointer ${
                    isError
                      ? 'bg-rose-900/50 text-rose-100 border-l-4 border-rose-500 font-semibold'
                      : isCurrent
                        ? 'bg-blue-600/30 text-white border-l-4 border-blue-500 font-semibold'
                        : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  {/* Line Number */}
                  <span
                    className={`w-9 shrink-0 text-right pr-3 select-none text-[11px] ${
                      isCurrent
                        ? 'text-blue-400 font-bold'
                        : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  >
                    {lineNum}
                  </span>

                  {/* Indicator icon */}
                  <span className="w-4 shrink-0 text-center select-none">
                    {isError ? (
                      <span className="text-rose-400">✖</span>
                    ) : isCurrent ? (
                      <span className="text-blue-400 animate-pulse">▶</span>
                    ) : null}
                  </span>

                  {/* Code Line text */}
                  <pre className="flex-1 whitespace-pre overflow-x-visible font-mono">
                    {lineContent || ' '}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Execution Context & State Inspector */}
        <div className="lg:col-span-5 flex flex-col bg-gray-50/50 dark:bg-slate-900/60 divide-y divide-gray-200 dark:divide-slate-800 text-xs">
          {/* Step Summary description box */}
          <div className="p-3 bg-white dark:bg-slate-900">
            <div className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" /> Current Action
            </div>
            <p className="text-gray-800 dark:text-slate-200 font-sans text-xs leading-relaxed">
              {currentStep?.description || 'Evaluating statement...'}
            </p>
          </div>

          {/* Variables Table */}
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Variable className="w-3.5 h-3.5 text-emerald-500" />
                Variables in Scope
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {currentStep?.variables?.length || 0} active
              </span>
            </div>

            <div className="flex-1 overflow-auto max-h-[160px] border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-1">
              {!currentStep?.variables || currentStep.variables.length === 0 ? (
                <div className="py-4 text-center text-gray-400 dark:text-slate-500 italic text-[11px]">
                  No local variables initialized yet.
                </div>
              ) : (
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 text-[10px]">
                      <th className="py-1 px-2">Name</th>
                      <th className="py-1 px-2">Value</th>
                      <th className="py-1 px-2">Type</th>
                      <th className="py-1 px-2">Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStep.variables.map((v, i) => (
                      <tr
                        key={`${v.name}-${i}`}
                        className="border-b border-gray-50 dark:border-slate-900/60 last:border-none hover:bg-gray-50/80 dark:hover:bg-slate-900/40"
                      >
                        <td className="py-1 px-2 font-semibold text-blue-600 dark:text-blue-400">
                          {v.name}
                        </td>
                        <td className="py-1 px-2 text-emerald-600 dark:text-emerald-400 break-all font-mono">
                          {v.value}
                        </td>
                        <td className="py-1 px-2 text-gray-500 dark:text-slate-400 text-[10px]">
                          {v.type}
                        </td>
                        <td className="py-1 px-2 text-gray-400 dark:text-slate-500 text-[10px]">
                          {v.scope}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Call Stack Panel */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                Call Stack
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                depth: {currentStep?.callStack?.length || 0}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-auto p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
              {!currentStep?.callStack || currentStep.callStack.length === 0 ? (
                <span className="text-[11px] text-gray-400 italic">Global</span>
              ) : (
                currentStep.callStack.map((frame, idx) => (
                  <span
                    key={`${frame}-${idx}`}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      idx === currentStep.callStack.length - 1
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800 font-semibold shadow-2xs'
                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                    }`}
                  >
                    {frame}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Program Output Terminal Console */}
          <div className="p-3">
            <div className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              Standard Output (stdout)
            </div>
            <div className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-2.5 rounded-lg border border-slate-800 min-h-[64px] max-h-[100px] overflow-auto whitespace-pre">
              {currentStep?.output ? currentStep.output : <span className="text-slate-600 italic">No output produced yet</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            Note: Dry-run traces are simulated via Gemini static analysis. Always verify against native compiler/runtime environments.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400">
          <span>Shortcuts:</span>
          <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-800 font-mono text-gray-700 dark:text-slate-300">
            Space
          </kbd>{' '}
          play/pause
          <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-800 font-mono text-gray-700 dark:text-slate-300">
            ←
          </kbd>
          <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-800 font-mono text-gray-700 dark:text-slate-300">
            →
          </kbd>{' '}
          step
        </div>
      </div>
    </div>
  );
}

