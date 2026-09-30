import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, RotateCw, Trophy } from 'lucide-react';
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

const uniqueIds = (ids, id) => ids.includes(id) ? ids : [...ids, id];

function getMeme(type, count) {
  const milestones = type === 'correct' ? [1, 3, 5, 10] : [1, 3, 6, 10];
  const isMilestone = milestones.includes(count) || (count > 10 && count % 5 === 0);
  if (!isMilestone) return null;

  const messages = type === 'correct'
    ? [
      ['Đúng câu đầu. Bộ nhớ đã vào ca.', '✦'],
      ['Ba câu liền. Não bắt đầu tin vào bản thân.', '✦'],
      ['Năm câu chuẩn. Flashcard đang mất lợi thế.', '✦'],
      ['Mười câu liền. Từ điển xin phép nghỉ.', '✦'],
    ]
    : [
      ['Câu này đã được bộ nhớ đánh dấu nổi bật.', '↻'],
      ['Ba lần thử. Ít nhất từ này sẽ khó quên.', '↻'],
      ['Đã ghi nhận. Lần ôn sau bạn sẽ nhận ra ngay.', '↻'],
      ['Sai không mất điểm. Chỉ thêm một lần làm quen.', '↻'],
    ];
  const [text, emoji] = messages[milestones.indexOf(count)] || messages.at(-1);
  return { id: `${type}-${count}`, type, count, text, emoji };
}

export default function PracticePanel({ words, boards = [] }) {
  const [answer, setAnswer] = useState('');
  const [reaction, setReaction] = useState(null);
  const [session, setSession] = useState(() => makeSession(words));
  const advanceButtonRef = useRef(null);
  const direction = 'vietnamese';
  const question = session.queue[session.index] || null;
  const totalQuestions = session.queue.length;
  const expected = question
    ? direction === 'vietnamese' ? question.english : question.vietnamese
    : '';

  useEffect(() => {
    if (['correct', 'reveal'].includes(session.feedback?.type)) {
      advanceButtonRef.current?.focus();
    }
  }, [session.feedback?.type]);
  const prompt = question
    ? direction === 'vietnamese' ? question.vietnamese : question.english
    : '';

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
    if (!question || !answer.trim() || session.feedback?.type === 'correct' || session.feedback?.type === 'reveal') return;

    if (isAnswerCorrect(answer, getAcceptedAnswers(expected))) {
      const nextStreak = session.streak + 1;
      setSession((current) => ({
        ...current,
        solvedIds: uniqueIds(current.solvedIds, question.id),
        streak: nextStreak,
        feedback: { type: 'correct' },
      }));
      setReaction(getMeme('correct', nextStreak));
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
      missedIds: revealed && current.phase === 'main' ? uniqueIds(current.missedIds, question.id) : current.missedIds,
      failedIds: revealed && current.phase === 'retry' ? uniqueIds(current.failedIds, question.id) : current.failedIds,
      feedback: revealed ? { type: 'reveal', expected } : { type: 'wrong', remaining: 3 - nextAttempts },
    }));
    setReaction(getMeme('wrong', nextWrongCount));
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
      <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-4 text-center">
        <p className="font-semibold text-slate-200">Chưa có từ để dò bài</p>
        <p className="mt-2 text-sm text-slate-500">Chọn ít nhất một bảng có từ vựng trong mục Bảng từ.</p>
      </div>
    );
  }

  if (session.phase === 'complete' || session.phase === 'summary') {
    const unresolvedWords = words.filter((word) => session.summaryIds.includes(word.id));
    return (
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-5 rounded-xl border border-slate-800 bg-[#101319] p-5 text-center sm:p-7">
        <Trophy className="mx-auto text-amber-300" size={30} />
        <div>
          <h3 className="text-lg font-bold text-slate-100">{session.phase === 'summary' ? 'Đã ôn lại từ sai' : 'Hoàn thành lượt dò'}</h3>
          <p className="mt-2 text-sm text-slate-400">Đúng {session.solvedIds.length}/{words.length} từ · {session.wrongCount} lượt sai</p>
        </div>
        {unresolvedWords.length > 0 && (
          <div className="space-y-2 text-left">
            <p className="text-xs font-semibold text-amber-200">Các từ cần luyện thêm</p>
            {unresolvedWords.map((word) => <p key={word.id} className="rounded-lg bg-black/30 px-3 py-2 text-sm"><span className="font-semibold text-slate-100">{word.vietnamese}</span><span className="text-slate-500"> → </span><span className="text-slate-300">{word.english}</span></p>)}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {session.phase === 'summary' && <button type="button" onClick={startRetry} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300">Luyện lại từ sai</button>}
          <button type="button" onClick={startNewSession} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5"><RotateCw size={15} /> Lượt mới</button>
        </div>
      </motion.section>
    );
  }

  const progress = totalQuestions ? Math.round(((session.index + 1) / totalQuestions) * 100) : 0;

  return (
    <motion.section layout className="mx-auto max-w-2xl space-y-5 rounded-xl border border-slate-800 bg-[#101319] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-300">{session.phase === 'retry' ? 'Ôn lại từ sai' : 'Lượt dò mới'}</p>
          <p className="mt-1 text-[11px] text-slate-500">{boards.map((board) => board.name).join(' · ')}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-slate-400">Đúng {session.solvedIds.length}/{words.length} · Sai {session.wrongCount}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">Câu {session.index + 1}/{totalQuestions}</p>
        </div>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-slate-800"><motion.div className="h-full rounded-full bg-amber-400" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} /></div>

      <AnimatePresence mode="wait">
        <motion.div key={question.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="rounded-lg border border-slate-800 bg-black/30 px-5 py-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{direction === 'vietnamese' ? 'Dịch sang tiếng Anh' : 'Dịch sang tiếng Việt'}</p>
          <p className="mt-3 break-words text-2xl font-bold text-slate-100">{prompt}</p>
        </motion.div>
      </AnimatePresence>

      <form onSubmit={checkAnswer} className="space-y-4">
        <label className="block space-y-1.5 text-xs font-medium text-slate-400">
          Câu trả lời
          <input
            autoComplete="off"
            autoFocus
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={['correct', 'reveal'].includes(session.feedback?.type)}
            placeholder="Nhập nghĩa của từ"
            className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400 disabled:opacity-70"
          />
        </label>

        <AnimatePresence mode="wait">
          {session.feedback && (
            <motion.p key={`${session.feedback.type}-${session.attempts}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} role="status" className={`rounded-lg border px-3 py-2.5 text-sm ${session.feedback.type === 'correct' ? 'border-emerald-800 bg-emerald-950/30 text-emerald-300' : session.feedback.type === 'reveal' ? 'border-amber-800 bg-amber-950/30 text-amber-200' : 'border-rose-900 bg-rose-950/30 text-rose-300'}`}>
              {session.feedback.type === 'correct' ? 'Chính xác!' : session.feedback.type === 'reveal' ? `Đã hết 3 lượt. Đáp án: ${session.feedback.expected}` : `Chưa đúng. Còn ${session.feedback.remaining} lượt thử.`}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          ref={advanceButtonRef}
          type={['correct', 'reveal'].includes(session.feedback?.type) ? 'button' : 'submit'}
          onClick={['correct', 'reveal'].includes(session.feedback?.type) ? advance : undefined}
          disabled={!['correct', 'reveal'].includes(session.feedback?.type) && !answer.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {session.feedback?.type === 'correct' ? <><Check size={16} /> Từ tiếp theo</> : session.feedback?.type === 'reveal' ? <><ArrowRight size={16} /> Bỏ qua</> : <><Check size={16} /> Kiểm tra</>}
        </button>
      </form>

      <AnimatePresence>
        {reaction && (
          <motion.div
            key={reaction.id}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            role="status"
            className={`relative flex items-center gap-3 overflow-hidden rounded-lg border px-4 py-3 ${reaction.type === 'correct' ? 'border-emerald-700/70 bg-emerald-950/40 text-emerald-100' : 'border-amber-700/70 bg-amber-950/40 text-amber-100'}`}
          >
            <motion.span aria-hidden="true" animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] }} transition={{ duration: 0.45 }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/25 text-xl">{reaction.emoji}</motion.span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-60">{reaction.type === 'correct' ? `Chuỗi đúng · ${reaction.count}` : `Ghi nhớ · ${reaction.count}`}</p>
              <p className="mt-1 text-sm font-semibold">{reaction.text}</p>
            </div>
            <span aria-hidden="true" className="absolute -right-5 -top-8 h-20 w-20 rounded-full border border-current opacity-10" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
