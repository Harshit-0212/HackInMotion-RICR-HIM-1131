import { useState, useEffect } from 'react';
import { Layers, RotateCcw, Check, Sparkles, Plus, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/store/ToastContext';
import { learningFeaturesService } from '@/services/learningFeaturesService';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
}

export function Flashcards() {
  const { showToast } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([
    {
      id: 'f1',
      front: 'What does ACID stand for in Database Management?',
      back: 'Atomicity, Consistency, Isolation, Durability.',
      subject: 'DBMS',
      topic: 'Transactions',
    },
    {
      id: 'f2',
      front: 'What is the auxiliary space complexity of MergeSort?',
      back: 'O(N) for standard array implementation to store merged halves.',
      subject: 'DSA',
      topic: 'Sorting',
    },
    {
      id: 'f3',
      front: 'In TCP, how does the 3-Way Handshake proceed?',
      back: 'SYN -> SYN-ACK -> ACK.',
      subject: 'Computer Networks',
      topic: 'Transport Layer',
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function loadDueCards() {
      try {
        const due = await learningFeaturesService.getDueFlashcards();
        if (due && due.length > 0) {
          setCards(
            due.map((d) => ({
              id: d._id,
              front: d.front,
              back: d.back,
              subject: d.subject,
              topic: d.topic || 'General',
            }))
          );
        }
      } catch {
        // Keeps defaults
      }
    }
    loadDueCards();
  }, []);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (completed) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code) && isFlipped) {
        handleRate(Number(e.code.replace('Digit', '')));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFlipped, completed]);

  const handleRate = async (rating: number) => {
    if (currentCard?.id) {
      try {
        await learningFeaturesService.reviewFlashcard(currentCard.id, rating);
      } catch {
        // offline fallback
      }
    }
    showToast(`Rated ${rating}/4! Next interval updated via SM-2. +5 XP`, 'success');
    setIsFlipped(false);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      setCompleted(true);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  return (
    <AppLayout>
      <PageContainer maxWidth="md">
        <PageHeader
          title="Flashcard Mastery"
          subtitle="Spaced repetition (SM-2) engine to encode long-term memory."
          action={
            <Badge tone="primary">
              <Sparkles size={12} /> {cards.length - currentIndex} cards due
            </Badge>
          }
        />

        {completed ? (
          <Card padding="lg" className="text-center py-12 space-y-4">
            <div className="size-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Award size={32} />
            </div>
            <h3 className="font-space text-2xl font-bold text-[var(--text-primary)]">Daily Deck Complete!</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
              You reviewed all due flashcards today. Spaced intervals will resurface these when retention is optimal.
            </p>
            <Button variant="primary" onClick={resetSession} className="mx-auto">
              <RotateCcw size={14} /> Review Again
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Card Counter */}
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span>Space: Flip • 1-4: Rate</span>
            </div>

            {/* Interactive Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative h-72 cursor-pointer perspective-1000 select-none"
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Front */}
                <div
                  className={`absolute inset-0 backface-hidden p-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md flex flex-col justify-between ${
                    isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge tone="primary">{currentCard.subject}</Badge>
                    <span className="text-xs text-[var(--text-muted)]">{currentCard.topic}</span>
                  </div>
                  <h3 className="font-space text-xl sm:text-2xl font-bold text-[var(--text-primary)] text-center my-auto">
                    {currentCard.front}
                  </h3>
                  <p className="text-center text-xs text-[var(--text-muted)]">Click or press Space to flip</p>
                </div>

                {/* Back */}
                <div
                  className={`absolute inset-0 backface-hidden p-8 rounded-3xl border border-[#6542C5]/30 bg-gradient-to-br from-[var(--surface)] to-[#F5F3FD] dark:to-[#1D1922] shadow-md flex flex-col justify-between rotate-y-180 ${
                    !isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  <Badge tone="success" className="w-fit">Answer</Badge>
                  <p className="font-sans text-base sm:text-lg text-[var(--text-primary)] text-center my-auto leading-relaxed">
                    {currentCard.back}
                  </p>
                  <p className="text-center text-xs text-[var(--text-muted)]">Rate difficulty below to schedule next interval</p>
                </div>
              </motion.div>
            </div>

            {/* Rating Action Buttons */}
            {isFlipped ? (
              <div className="grid grid-cols-4 gap-2">
                <Button variant="danger" size="sm" onClick={() => handleRate(1)}>
                  1: Again
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRate(2)}>
                  2: Hard
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleRate(3)}>
                  3: Good
                </Button>
                <Button variant="success" size="sm" onClick={() => handleRate(4)}>
                  4: Easy
                </Button>
              </div>
            ) : (
              <Button fullWidth variant="outline" onClick={() => setIsFlipped(true)}>
                Reveal Answer
              </Button>
            )}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}

