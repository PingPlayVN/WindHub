import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowRightLeft,
  BookOpen,
  Check,
  Flame,
  RotateCw,
  Trophy,
} from 'lucide-react';
import Button from '@/components/os/Button';
import { getAcceptedAnswers, isAnswerCorrect } from '../../utils/answerUtils';

const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const makeSession = (words) => ({
  phase: 'main',
  queue: shuffle(words),
  index: 0,
  attempts: 0,
  missedIds: [],
  failedIds: [],
  summaryIds: [],
  solvedIds: [],
  wrongCount: 0,
  streak: 0,
  feedback: null,
});

const uniqueIds = (ids, id) => (ids.includes(id) ? ids : [...ids, id]);

function getMilestoneNote(type, count) {
  const milestones = type === 'correct' ? [1, 3, 5, 10] : [1, 3, 6, 10];
  const isMilestone = milestones.includes(count) || (count > 10 && count % 5 === 0);
  if (!isMilestone) return null;

  const messages =
    type === 'correct'
      ? [
          'Khởi đầu chính xác. Nhịp ghi nhớ đã sẵn sàng.',
          'Chuỗi 3 câu đúng liên tiếp. Phản xạ rất tốt.',
          'Chuỗi 5 câu chuẩn xác. Trí nhớ dài hạn đang củng cố.',
          'Mốc 10 câu liên tiếp hoàn hảo.',
        ]
      : [
          'Từ này đã được đánh dấu để ôn lại ở cuối lượt.',
          'Ba lần thử giúp não bộ ghi nhận sâu hơn.',
          'Đã lưu vào danh sách ưu tiên củng cố.',
          'Mỗi lần nhầm là một bước khắc sâu từ mới.',
        ];
  const text = messages[milestones.indexOf(count)] || messages.at(-1);
  return { id: `${type}-${count}`, type, count, text };
}

export default function PracticePanel({ words, boards = [], onManageWords }) {
  const [answer, setAnswer] = useState('');
  const [direction, setDirection] = useState('vietnamese'); // 'vietnamese' (Vi -> En) | 'english' (En -> Vi)
  const [reaction, setReaction] = useState(null);
  const [session, setSession] = useState(() => makeSession(words));
  const advanceButtonRef = useRef(null);

  const question = session.queue[session.index] || null;
  const totalQuestions = session.queue.length;
  const expected = question
    ? direction === 'vietnamese'
      ? question.english
      : question.vietnamese
    : '';
  const prompt = question
    ? direction === 'vietnamese'
      ? question.vietnamese
      : question.english
    : '';

  useEffect(() => {
    if (['correct', 'reveal'].includes(session.feedback?.type)) {
      advanceButtonRef.current?.focus();
    }
  }, [session.feedback?.type]);

  const advance = () => {
    setAnswer('');
    setReaction(null);
    setSession((current) => {
      if (current.index < current.queue.length - 1) {
        return { ...current, index: current.index + 1, attempts: 0, feedback: null };
      }

      if (current.phase === 'main') {
        const missed = words.filter((word) => current.missedIds.includes(word.id));
        if (missed.length) {
          return {
            ...current,
            phase: 'retry',
            queue: shuffle(missed),
            index: 0,
            attempts: 0,
            missedIds: [],
            failedIds: [],
            streak: 0,
            feedback: null,
          };
        }
        return { ...current, phase: 'complete', feedback: null };
      }

      if (current.failedIds.length) {
        return { ...current, phase: 'summary', summaryIds: current.failedIds, feedback: null };
      }
      return { ...current, phase: 'complete', feedback: null };
    });
  };

  const checkAnswer = (event) => {
    event.preventDefault();
    if (
      !question ||
      !answer.trim() ||
      session.feedback?.type === 'correct' ||
      session.feedback?.type === 'reveal'
    )
      return;

    if (isAnswerCorrect(answer, getAcceptedAnswers(expected))) {
      const nextStreak = session.streak + 1;
      setSession((current) => ({
        ...current,
        solvedIds: uniqueIds(current.solvedIds, question.id),
        streak: nextStreak,
        feedback: { type: 'correct' },
      }));
      setReaction(getMilestoneNote('correct', nextStreak));
      return;
    }

    const nextAttempts = session.attempts + 1;
    const nextWrongCount = session.wrongCount + 1;
    const revealed = nextAttempts >= 3;
    setSession((current) => ({
      ...current,
      attempts: nextAttempts,
      wrongCount: nextWrongCount,
      streak: 0,
      missedIds:
        revealed && current.phase === 'main'
          ? uniqueIds(current.missedIds, question.id)
          : current.missedIds,
      failedIds:
        revealed && current.phase === 'retry'
          ? uniqueIds(current.failedIds, question.id)
          : current.failedIds,
      feedback: revealed
        ? { type: 'reveal', expected }
        : { type: 'wrong', remaining: 3 - nextAttempts },
    }));
    setReaction(getMilestoneNote('wrong', nextWrongCount));
  };

  const startRetry = () => {
    const retryWords = words.filter((word) => session.summaryIds.includes(word.id));
    setAnswer('');
    setReaction(null);
    setSession((current) => ({
      ...current,
      phase: 'retry',
      queue: shuffle(retryWords),
      index: 0,
      attempts: 0,
      failedIds: [],
      summaryIds: [],
      streak: 0,
      feedback: null,
    }));
  };

  const startNewSession = () => {
    setAnswer('');
    setReaction(null);
    setSession(makeSession(words));
  };

  if (!words.length) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--os-border-strong)] bg-[var(--os-surface-1)] px-5 py-10 text-center">
        <BookOpen size={28} className="mb-3 text-[var(--os-text-muted)]" />
        <p className="text-base font-bold text-[var(--os-text-primary)]">
          Chưa có cặp từ nào để bắt đầu dò bài
        </p>
        <p className="mt-1 max-w-md text-xs sm:text-sm text-[var(--os-text-muted)]">
          Hãy tích chọn ít nhất một bảng có từ vựng trong mục Bảng từ vựng để khởi tạo phiên luyện tập.
        </p>
        <Button
          variant="secondary"
          size="sm"
          icon={<BookOpen size={14} />}
          onClick={onManageWords}
          className="mt-4"
        >
          Quay về Bảng từ vựng
        </Button>
      </div>
    );
  }

  if (session.phase === 'complete' || session.phase === 'summary') {
    const unresolvedWords = words.filter((word) => session.summaryIds.includes(word.id));
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl space-y-5 rounded-[var(--radius-xl)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-6 text-center sm:p-8"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] text-[var(--os-warning)]">
          <Trophy size={26} />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-[var(--os-text-primary)]">
            {session.phase === 'summary' ? 'Tổng kết ôn tập từ khó' : 'Hoàn thành phiên luyện tập!'}
          </h3>
          <p className="mt-1.5 font-mono text-xs sm:text-sm text-[var(--os-text-secondary)]">
            Chính xác <strong>{session.solvedIds.length}/{words.length}</strong> từ ·{' '}
            {session.wrongCount} lượt nhầm
          </p>
        </div>

        {unresolvedWords.length > 0 && (
          <div className="space-y-2 text-left">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-warning)]">
              Cần củng cố thêm
            </p>
            {unresolvedWords.map((word) => (
              <div
                key={word.id}
                className="os-sunken flex items-center justify-between rounded-[var(--radius-sm)] px-3.5 py-2 text-xs sm:text-sm"
              >
                <span className="font-bold text-[var(--os-text-primary)]">{word.vietnamese}</span>
                <span className="font-mono text-[var(--os-accent)]">{word.english}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2.5 pt-2">
          {session.phase === 'summary' && (
            <Button variant="primary" size="md" onClick={startRetry}>
              Luyện lại từ chưa thuộc
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            icon={<RotateCw size={15} />}
            onClick={startNewSession}
          >
            Bắt đầu lượt mới
          </Button>
          <Button
            variant="ghost"
            size="md"
            icon={<BookOpen size={15} />}
            onClick={onManageWords}
          >
            Quản lý từ vựng
          </Button>
        </div>
      </motion.section>
    );
  }

  const progress = totalQuestions ? Math.round(((session.index + 1) / totalQuestions) * 100) : 0;

  return (
    <motion.section
      layout
      className="mx-auto max-w-2xl space-y-5 rounded-[var(--radius-xl)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-5 sm:p-7 shadow-[var(--os-shadow-xs)]"
    >
      {/* Session Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-accent)]">
              {session.phase === 'retry' ? 'Vòng củng cố từ khó' : 'Phiên phản xạ chủ động'}
            </span>
            {session.streak >= 2 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--os-success-border)] bg-[var(--os-success-soft)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--os-success)]">
                <Flame size={11} /> Chuỗi {session.streak}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[var(--os-text-muted)]">
            {boards.map((board) => board.name).join(' · ')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDirection((d) => (d === 'vietnamese' ? 'english' : 'vietnamese'));
              setAnswer('');
            }}
            title="Đổi chiều dịch câu hỏi"
            className="os-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 py-1 font-mono text-[11px] font-bold text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
          >
            <ArrowRightLeft size={12} className="text-[var(--os-accent)]" />
            <span>{direction === 'vietnamese' ? 'Việt → Anh' : 'Anh → Việt'}</span>
          </button>

          <div className="text-right font-mono text-xs">
            <span className="font-bold text-[var(--os-text-primary)]">
              {session.index + 1}/{totalQuestions}
            </span>
            <span className="block text-[10px] text-[var(--os-text-muted)]">
              Thuộc {session.solvedIds.length} · Nhầm {session.wrongCount}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--os-surface-3)]">
        <motion.div
          className="h-full rounded-full bg-[var(--os-accent)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>

      {/* Flashcard Prompt Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${question.id}-${direction}`}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.16 }}
          className="os-sunken rounded-[var(--radius-lg)] px-6 py-9 text-center"
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--os-text-muted)]">
            {direction === 'vietnamese' ? 'Nhập từ Tiếng Anh tương ứng' : 'Nhập nghĩa Tiếng Việt'}
          </p>
          <p className="mt-3 break-words text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
            {prompt}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Answer Form */}
      <form onSubmit={checkAnswer} className="space-y-4">
        <label className="block space-y-1.5 text-xs font-semibold text-[var(--os-text-secondary)]">
          <span>Đáp án của bạn</span>
          <input
            autoComplete="off"
            autoFocus
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={['correct', 'reveal'].includes(session.feedback?.type)}
            placeholder={
              direction === 'vietnamese' ? 'Gõ từ tiếng Anh...' : 'Gõ nghĩa tiếng Việt...'
            }
            className="os-focus-ring h-12 w-full rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-4 text-sm sm:text-base font-semibold text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)] disabled:opacity-65"
          />
        </label>

        <AnimatePresence mode="wait">
          {session.feedback && (
            <motion.p
              key={`${session.feedback.type}-${session.attempts}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              role="status"
              className={`rounded-[var(--radius-md)] border px-3.5 py-2.5 text-xs sm:text-sm font-semibold ${
                session.feedback.type === 'correct'
                  ? 'border-[var(--os-success-border)] bg-[var(--os-success-soft)] text-[var(--os-success)]'
                  : session.feedback.type === 'reveal'
                  ? 'border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] text-[var(--os-warning)]'
                  : 'border-[var(--os-danger-border)] bg-[var(--os-danger-soft)] text-[var(--os-danger)]'
              }`}
            >
              {session.feedback.type === 'correct'
                ? 'Chính xác! Nhấn Enter để sang câu tiếp theo.'
                : session.feedback.type === 'reveal'
                ? `Đã hết 3 lượt thử. Đáp án chuẩn: ${session.feedback.expected}`
                : `Chưa khớp — còn ${session.feedback.remaining} lượt thử.`}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          ref={advanceButtonRef}
          type={['correct', 'reveal'].includes(session.feedback?.type) ? 'button' : 'submit'}
          onClick={['correct', 'reveal'].includes(session.feedback?.type) ? advance : undefined}
          disabled={!['correct', 'reveal'].includes(session.feedback?.type) && !answer.trim()}
          className="os-focus-ring inline-flex h-11.5 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--os-accent)] px-4 text-sm font-bold text-[var(--os-accent-fg)] transition-colors hover:bg-[var(--os-accent-hover)] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
        >
          {session.feedback?.type === 'correct' ? (
            <>
              <Check size={16} />
              <span>Từ tiếp theo</span>
            </>
          ) : session.feedback?.type === 'reveal' ? (
            <>
              <ArrowRight size={16} />
              <span>Tiếp tục</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Kiểm tra đáp án</span>
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {reaction && (
          <motion.div
            key={reaction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="status"
            className={`flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-xs sm:text-sm ${
              reaction.type === 'correct'
                ? 'border-[var(--os-success-border)] bg-[var(--os-success-soft)] text-[var(--os-text-primary)]'
                : 'border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] text-[var(--os-text-primary)]'
            }`}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--os-surface-1)] text-[var(--os-accent)]">
              {reaction.type === 'correct' ? <Flame size={16} /> : <RotateCw size={15} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                {reaction.type === 'correct'
                  ? `Cột mốc chuỗi đúng · ${reaction.count}`
                  : `Ghi nhận ôn tập · ${reaction.count}`}
              </p>
              <p className="font-semibold">{reaction.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
