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
  Copy,
  Check,
  Trash2,
  CheckCircle2,
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
  const [speechBlocked, setSpeechBlocked] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Output console states
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [clearedVisualOutput, setClearedVisualOutput] = useState(false);

  // Refs for tracking mutable states in event callbacks without stale closures
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const currentStepIndexRef = useRef(currentStepIndex);
  currentStepIndexRef.current = currentStepIndex;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const narrationLangRef = useRef(narrationLang);
  narrationLangRef.current = narrationLang;

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const narrationEnglishRef = useRef(narrationEnglish);
  narrationEnglishRef.current = narrationEnglish;

  const narrationHinglishRef = useRef(narrationHinglish);
  narrationHinglishRef.current = narrationHinglish;

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const codeContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const outputConsoleRef = useRef<HTMLDivElement>(null);

  const totalSteps = steps.length;
  const currentStep: DryRunStep | undefined = steps[currentStepIndex];

  // Derive narration text for given index
  const getNarrationText = useCallback((index: number, lang: 'english' | 'hinglish') => {
    const list = lang === 'hinglish' ? narrationHinglishRef.current : narrationEnglishRef.current;
    return list[index] || stepsRef.current[index]?.description || '';
  }, []);

  const currentNarration = getNarrationText(currentStepIndex, narrationLang);

  // Helper to safely stop any active browser speech
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current.onstart = null;
        activeUtteranceRef.current.onpause = null;
        activeUtteranceRef.current = null;
      }
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  // Advance step programmatically
  const advanceStep = useCallback(() => {
    if (currentStepIndexRef.current < stepsRef.current.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      stopSpeech();
    }
  }, [stopSpeech]);

  // Audio Speech Utterance Engine
  const speakStep = useCallback((index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechBlocked(true);
      return;
    }

    // Cancel any ongoing speech
    stopSpeech();

    if (!voiceEnabledRef.current) return;

    const textToSpeak = getNarrationText(index, narrationLangRef.current);
    if (!textToSpeak.trim()) {
      if (isPlayingRef.current) {
        // If empty text and playing, short fallback timer to move to next
        timerRef.current = setTimeout(() => {
          advanceStep();
        }, 800);
      }
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      activeUtteranceRef.current = utterance;

      // Rate calibration based on speed selector
      const baseRate = narrationLangRef.current === 'hinglish' ? 0.95 : 1.0;
      utterance.rate = Math.max(0.7, Math.min(2.0, baseRate * speedRef.current));
      utterance.pitch = 1.0;

      // Best-effort voice matching
      const targetLang = narrationLangRef.current === 'hinglish' ? 'hi-IN' : 'en-US';
      utterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (narrationLangRef.current === 'hinglish') {
          const hindiVoice = voices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.lang === 'en-IN');
          if (hindiVoice) utterance.voice = hindiVoice;
        } else {
          const enVoice = voices.find((v) => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
        }
      }

      utterance.onstart = () => {
        setSpeaking(true);
      };

      utterance.onpause = () => {
        setSpeaking(false);
      };

      utterance.onerror = (e) => {
        setSpeaking(false);
        // Interrupted/canceled is expected when user skips steps or pauses
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e.error);
        }
        if (isPlayingRef.current && e.error !== 'interrupted' && e.error !== 'canceled') {
          advanceStep();
        }
      };

      utterance.onend = () => {
        setSpeaking(false);
        activeUtteranceRef.current = null;
        // ADVANCE ONLY AFTER THE CURRENT UTTERANCE FULLY COMPLETES
        if (isPlayingRef.current) {
          advanceStep();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to speak with Web Speech API:', err);
      setSpeechBlocked(true);
    }
  }, [stopSpeech, getNarrationText, advanceStep]);

  // Handle Play/Pause transitions
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // If at the end, restart from step 0
      if (currentStepIndex >= totalSteps - 1) {
        setCurrentStepIndex(0);
      }
      setIsPlaying(true);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (voiceEnabled) {
        speakStep(currentStepIndex >= totalSteps - 1 ? 0 : currentStepIndex);
      }
    }
  }, [isPlaying, currentStepIndex, totalSteps, voiceEnabled, speakStep]);

  // When step changes, handle voice or non-voice timer
  useEffect(() => {
    // Reset visual cleared flag when stepping
    setClearedVisualOutput(false);

    if (voiceEnabled) {
      speakStep(currentStepIndex);
    } else if (isPlaying) {
      // Non-voice timer: standard stepping based on speed
      const delay = Math.round(1800 / speed);
      timerRef.current = setTimeout(() => {
        advanceStep();
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStepIndex, isPlaying, voiceEnabled, speed, speakStep, advanceStep]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stopSpeech]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    stopSpeech();
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, totalSteps, stopSpeech]);

  const handlePrev = useCallback(() => {
    stopSpeech();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex, stopSpeech]);

  const handleRestart = useCallback(() => {
    stopSpeech();
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, [stopSpeech]);

  // Speed change handler: stops speech and restarts for current step using new speed
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
    if (voiceEnabled) {
      stopSpeech();
      speakStep(currentStepIndex);
    }
  }, [voiceEnabled, stopSpeech, speakStep, currentStepIndex]);

  // Language change handler: stops speech and restarts in chosen language
  const handleLanguageChange = useCallback((newLang: 'english' | 'hinglish') => {
    setNarrationLang(newLang);
    narrationLangRef.current = newLang;
    if (voiceEnabled) {
      stopSpeech();
      speakStep(currentStepIndex);
    }
  }, [voiceEnabled, stopSpeech, speakStep, currentStepIndex]);

  // Toggle voice narration
  const handleToggleVoice = useCallback(() => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    voiceEnabledRef.current = nextVal;
    if (!nextVal) {
      stopSpeech();
    } else {
      speakStep(currentStepIndex);
    }
  }, [voiceEnabled, stopSpeech, speakStep, currentStepIndex]);

  // Auto-scroll highlighted code line into view smoothly
  useEffect(() => {
    if (activeLineRef.current && codeContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentStepIndex]);

  // Auto-scroll output console when output updates
  useEffect(() => {
    if (outputConsoleRef.current) {
      outputConsoleRef.current.scrollTop = outputConsoleRef.current.scrollHeight;
    }
  }, [currentStep?.output, currentStepIndex]);

  // Keyboard shortcuts: Space (play/pause), Left Arrow (prev), Right Arrow (next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
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
  }, [handleTogglePlay, handleNext, handlePrev]);

  // Copy output handler
  const handleCopyOutput = useCallback(async () => {
    if (!currentStep?.output) return;
    try {
      await navigator.clipboard.writeText(currentStep.output);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    } catch {
      // ignore
    }
  }, [currentStep?.output]);

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

  const codeLines = code.split('\n');
  const activeLine = currentStep ? currentStep.line : -1;
  const isFinalStep = currentStepIndex === totalSteps - 1;

  // Determine newly produced output at this step compared to previous
  const prevOutput = currentStepIndex > 0 ? steps[currentStepIndex - 1]?.output || '' : '';
  const currentOutput = currentStep?.output || '';
  const hasNewOutput = currentOutput.length > prevOutput.length && currentOutput.startsWith(prevOutput);
  const existingPrefix = hasNewOutput ? prevOutput : '';
  const newlyAppendedOutput = hasNewOutput ? currentOutput.slice(prevOutput.length) : (currentStepIndex === 0 ? currentOutput : '');

  // Format event badge label & color
  const getEventBadge = (event?: string, isError?: boolean) => {
    if (isError) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          Error
        </span>
      );
    }
    switch (event) {
      case 'loop-check':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            Loop Check
          </span>
        );
      case 'loop-body':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-800 dark:bg-yellow-950/70 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900">
            Loop Body
          </span>
        );
      case 'loop-iteration':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
            Loop Update
          </span>
        );
      case 'condition':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900">
            Condition
          </span>
        );
      case 'function-call':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
            Function Call
          </span>
        );
      case 'return':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            Return
          </span>
        );
      case 'output':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-900">
            Output
          </span>
        );
      case 'assignment':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            Assignment
          </span>
        );
    }
  };

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

          {getEventBadge(currentStep?.event, currentStep?.isErrorStep)}

          {isFinalStep && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dry run completed
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
            onClick={handleTogglePlay}
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
                onClick={() => handleSpeedChange(s)}
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
              onClick={() => handleLanguageChange('english')}
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
              onClick={() => handleLanguageChange('hinglish')}
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
          <button
            type="button"
            onClick={handleToggleVoice}
            title={voiceEnabled ? 'Mute AI voice narration' : 'Enable synchronous AI voice narration'}
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
        </div>
      </div>

      {/* Voice blocked warning if speech synthesis failed */}
      {speechBlocked && (
        <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <span>Browser speech synthesis is not permitted or unsupported. Visual stepping will continue smoothly.</span>
          <button type="button" onClick={() => setSpeechBlocked(false)} className="underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Narration Banner with Live Speaking Indicator */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent border-b border-gray-200 dark:border-slate-800 flex items-start gap-2.5">
        <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${speaking ? 'text-emerald-500 animate-spin' : 'text-blue-600 dark:text-blue-400'}`} />
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
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px] divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-slate-800">
        {/* Left Side: Code Visualizer */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950 text-slate-100 font-mono text-xs overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-[11px] text-slate-400 flex items-center justify-between">
            <span>source.{language}</span>
            <span className="text-[10px] text-slate-500 font-mono">
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
            <div className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" /> Current Action
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Line {activeLine}</span>
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

          {/* Program Output Terminal Console - Always Visible & Highlighted */}
          <div className="p-3 bg-white dark:bg-slate-900 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                Output Console (stdout)
              </div>
              <div className="flex items-center gap-1.5">
                {currentStep?.output && (
                  <button
                    type="button"
                    onClick={handleCopyOutput}
                    title="Copy Output"
                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {copiedOutput ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
                {currentStep?.output && !clearedVisualOutput && (
                  <button
                    type="button"
                    onClick={() => setClearedVisualOutput(true)}
                    title="Clear Visual Console View"
                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div
              ref={outputConsoleRef}
              className={`font-mono text-xs p-3 rounded-lg border min-h-[90px] max-h-[140px] overflow-auto whitespace-pre leading-relaxed shadow-inner ${
                currentStep?.isErrorStep
                  ? 'bg-rose-950/20 text-rose-300 border-rose-800/60'
                  : 'bg-slate-950 text-emerald-400 border-slate-800'
              }`}
            >
              {clearedVisualOutput ? (
                <span className="text-slate-600 italic">Console output cleared visually (will reappear on new step)</span>
              ) : currentStep?.output ? (
                <>
                  {hasNewOutput ? (
                    <>
                      <span>{existingPrefix}</span>
                      <span className="bg-emerald-500/20 text-emerald-300 font-bold px-0.5 rounded border border-emerald-500/30">
                        {newlyAppendedOutput}
                      </span>
                    </>
                  ) : (
                    <span>{currentStep.output}</span>
                  )}
                  {currentStep.isErrorStep && currentStep.errorMessage && (
                    <div className="mt-2 text-rose-400 font-bold border-t border-rose-900/60 pt-1">
                      [Error]: {currentStep.errorMessage}
                    </div>
                  )}
                </>
              ) : currentStep?.isErrorStep && currentStep.errorMessage ? (
                <div className="text-rose-400 font-bold">[Error]: {currentStep.errorMessage}</div>
              ) : (
                <span className="text-slate-600 italic">No output yet</span>
              )}
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
