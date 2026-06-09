'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Article, PracticeMode, TypingState } from '@/types';
import { getArticles, saveRecord } from '@/lib/storage';
import styles from './page.module.css';

const TIMED_OPTIONS = [30, 60, 120, 180, 300];
const DEFAULT_TIMED_DURATION = 60;

function PracticeContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') || 'free') as PracticeMode;
  const articleId = searchParams.get('articleId');
  const durationParam = parseInt(searchParams.get('duration') || '', 10);
  const timedDuration =
    TIMED_OPTIONS.includes(durationParam) ? durationParam : DEFAULT_TIMED_DURATION;

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showArticlePicker, setShowArticlePicker] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [pickerSortAsc, setPickerSortAsc] = useState(true);
  const [resultData, setResultData] = useState<{
    speed: number;
    accuracy: number;
    duration: number;
    correctChars: number;
    wrongChars: number;
    totalChars: number;
  } | null>(null);

  const [state, setState] = useState<TypingState>({
    currentIndex: 0,
    inputHistory: [],
    isStarted: false,
    isFinished: false,
    startTime: null,
    endTime: null,
    timerDuration: timedDuration,
    timeLeft: timedDuration,
  });

  // Realtime stats for display
  const [realtimeStats, setRealtimeStats] = useState({
    elapsedSeconds: 0,
    wpm: 0,
    cpm: 0,
    accuracy: 100,
    typedCount: 0,
    totalCount: 0,
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const inputHistoryRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  // Responsive line length based on container width
  const [lineLength, setLineLength] = useState(20);
  const lineLengthRef = useRef(20);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth;
      // Measure actual rendered character width from an existing span
      const sample = el.querySelector('[data-index]') as HTMLElement | null;
      if (sample) {
        const charW = sample.getBoundingClientRect().width;
        const len = Math.max(4, Math.floor((w - 36) / charW));
        setLineLength(len);
        lineLengthRef.current = len;
      }
    };
    // Delay first measurement to ensure spans are rendered
    setTimeout(calc, 0);
    const observer = new ResizeObserver(calc);
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedArticle]); // remeasure when article changes

  useEffect(() => {
    const loadedArticles = getArticles();
    setArticles(loadedArticles);
    if (articleId) {
      const found = loadedArticles.find((a) => a.id === articleId);
      if (found) setSelectedArticle(found);
    } else if (loadedArticles.length > 0) {
      setSelectedArticle(loadedArticles[0]);
    }
  }, [articleId]);

  // Countdown timer for timed mode
  useEffect(() => {
    if (mode === 'timed' && state.isStarted && !state.isFinished) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            return { ...prev, timeLeft: 0, isFinished: true, endTime: Date.now() };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, state.isStarted, state.isFinished]);

  useEffect(() => {
    if (state.isFinished && selectedArticle) {
      const chars = selectedArticle.content.split('');
      const typedCount = state.inputHistory.length;
      const correctCount = state.inputHistory.filter(
        (char, i) => char === chars[i],
      ).length;
      const wrongCount = typedCount - correctCount;
      const duration =
        state.endTime && state.startTime ? (state.endTime - state.startTime) / 1000 : 0;
      const speed = duration > 0 ? Math.round((correctCount / duration) * 60) : 0;
      const accuracy = typedCount > 0 ? Math.round((correctCount / typedCount) * 100) : 0;

      const record = {
        speed,
        accuracy,
        duration: Math.round(duration),
        correctChars: correctCount,
        wrongChars: wrongCount,
        totalChars: typedCount,
      };

      setResultData(record);
      setShowResult(true);

      saveRecord({
        id: Date.now().toString(),
        date: Date.now(),
        mode,
        ...record,
      });
    }
  }, [state.isFinished, selectedArticle, mode, state.inputHistory, state.startTime, state.endTime]);

  useEffect(() => {
    if (!showArticlePicker && !showResult && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [showArticlePicker, showResult, selectedArticle]);

  const chars = useMemo(
    () => (selectedArticle ? selectedArticle.content.split('') : []),
    [selectedArticle],
  );

  // Split text into lines, length adapts to container width
  const textLines = useMemo(() => {
    const lines: { start: number; end: number }[] = [];
    for (let i = 0; i < chars.length; i += lineLength) {
      lines.push({ start: i, end: Math.min(i + lineLength, chars.length) });
    }
    return lines;
  }, [chars, lineLength]);

  // Auto-scroll to follow current line (only when it leaves the visible area)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || state.currentIndex >= chars.length) return;

    const currentLine = container.querySelector(
      `[data-line-current="true"]`,
    ) as HTMLElement | null;
    if (!currentLine) return;

    const cr = container.getBoundingClientRect();
    const lr = currentLine.getBoundingClientRect();

    // Only scroll if the current line is not fully inside the container
    const isAbove = lr.top < cr.top;
    const isBelow = lr.bottom > cr.bottom;

    if (isAbove || isBelow) {
      currentLine.scrollIntoView({
        block: isAbove ? 'start' : 'end',
        behavior: 'instant',
      });
    }
  }, [state.currentIndex, chars.length]);

  // Realtime stats update timer
  useEffect(() => {
    if (state.isStarted && !state.isFinished) {
      realtimeTimerRef.current = setInterval(() => {
        const now = Date.now();
        const start = startTimeRef.current;
        if (!start) return;
        const elapsed = (now - start) / 1000;
        const history = inputHistoryRef.current;
        const correctCount = history.filter((ch, i) => ch === chars[i]).length;
        const typedCount = history.length;
        const wpm = elapsed > 0 ? Math.round((correctCount / elapsed) * 60) : 0;
        const cpm = elapsed > 0 ? Math.round((typedCount / elapsed) * 60) : 0;
        const accuracy = typedCount > 0 ? Math.round((correctCount / typedCount) * 100) : 100;
        setRealtimeStats({
          elapsedSeconds: Math.round(elapsed),
          wpm,
          cpm,
          accuracy,
          typedCount,
          totalCount: chars.length,
        });
      }, 300);
    } else {
      if (realtimeTimerRef.current) clearInterval(realtimeTimerRef.current);
    }
    return () => {
      if (realtimeTimerRef.current) clearInterval(realtimeTimerRef.current);
    };
  }, [state.isStarted, state.isFinished, chars]);

  const advanceTyping = useCallback(
    (newChars: string[]) => {
      if (newChars.length === 0) return;

      setState((prev) => {
        const newHistory = [...prev.inputHistory, ...newChars];
        const newIndex = prev.currentIndex + newChars.length;
        const isFinished = newIndex >= chars.length;
        inputHistoryRef.current = newHistory;
        currentIndexRef.current = newIndex;
        return {
          ...prev,
          inputHistory: newHistory,
          currentIndex: newIndex,
          isFinished,
          endTime: isFinished ? Date.now() : null,
        };
      });
    },
    [chars.length],
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      const value = (e.target as HTMLTextAreaElement).value;
      if (!value) return;

      const chars_typed = [...value];
      (e.target as HTMLTextAreaElement).value = '';

      if (!state.isStarted) {
        const now = Date.now();
        startTimeRef.current = now;
        setState((prev) => ({
          ...prev,
          isStarted: true,
          startTime: now,
        }));
      }

      advanceTyping(chars_typed);
    },
    [state.isStarted, advanceTyping],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Skip processing during IME composition
      if (isComposingRef.current) return;

      const value = e.target.value;
      if (!value) return;

      const chars_typed = [...value];
      e.target.value = '';

      if (!state.isStarted) {
        const now = Date.now();
        startTimeRef.current = now;
        setState((prev) => ({
          ...prev,
          isStarted: true,
          startTime: now,
        }));
      }

      advanceTyping(chars_typed);
    },
    [state.isStarted, advanceTyping],
  );

  const handleRestart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (realtimeTimerRef.current) clearInterval(realtimeTimerRef.current);
    inputHistoryRef.current = [];
    currentIndexRef.current = 0;
    startTimeRef.current = null;
    setState({
      currentIndex: 0,
      inputHistory: [],
      isStarted: false,
      isFinished: false,
      startTime: null,
      endTime: null,
      timerDuration: timedDuration,
      timeLeft: timedDuration,
    });
    setRealtimeStats({ elapsedSeconds: 0, wpm: 0, cpm: 0, accuracy: 100, typedCount: 0, totalCount: 0 });
    setShowResult(false);
    setResultData(null);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  const handleSelectArticle = useCallback(
    (article: Article) => {
      setSelectedArticle(article);
      setShowArticlePicker(false);
      handleRestart();
    },
    [handleRestart],
  );

  const sortedPickerArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const cmp = a.id.localeCompare(b.id);
      return pickerSortAsc ? cmp : -cmp;
    });
  }, [articles, pickerSortAsc]);

  if (showArticlePicker) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <button onClick={() => setShowArticlePicker(false)} className={styles.backBtn}>
              ← 返回
            </button>
            <h1 className={styles.headerTitle}>选择文章</h1>
            <button
              className={styles.pickerSortBtn}
              onClick={() => setPickerSortAsc((v) => !v)}
            >
              时间{pickerSortAsc ? '↑' : '↓'}
            </button>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.articleList}>
            {sortedPickerArticles.map((article) => (
              <button
                key={article.id}
                className={`${styles.articleItem} ${selectedArticle?.id === article.id ? styles.articleItemActive : ''}`}
                onClick={() => handleSelectArticle(article)}
              >
                <span className={styles.articleItemTitle}>{article.title}</span>
                <span className={styles.articleItemLen}>{article.content.length} 字</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (showResult && resultData) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/" className={styles.backBtn}>
              ← 首页
            </Link>
            <h1 className={styles.headerTitle}>练习结果</h1>
            <div className={styles.headerSpacer} />
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.resultCard}>
            <div className={styles.resultHero}>
              <span className={styles.resultSpeed}>{resultData.speed}</span>
              <span className={styles.resultUnit}>字/分钟</span>
            </div>
            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>{resultData.accuracy}%</span>
                <span className={styles.resultLabel}>正确率</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>{resultData.duration}s</span>
                <span className={styles.resultLabel}>用时</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>{resultData.correctChars}</span>
                <span className={styles.resultLabel}>正确字数</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultValue}>{resultData.wrongChars}</span>
                <span className={styles.resultLabel}>错误字数</span>
              </div>
            </div>
          </div>
          <div className={styles.resultActions}>
            <button onClick={handleRestart} className={styles.btnPrimary}>
              再练一次
            </button>
            <button onClick={() => setShowArticlePicker(true)} className={styles.btnSecondary}>
              换一篇文章
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!selectedArticle) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/" className={styles.backBtn}>
              ← 首页
            </Link>
            <h1 className={styles.headerTitle}>{mode === 'free' ? '自由练习' : '计时赛'}</h1>
            <div className={styles.headerSpacer} />
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>暂无文章，请先添加练习文章</p>
            <Link href="/articles" className={styles.btnPrimary}>
              前往文章管理
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backBtn}>
            ← 首页
          </Link>
          <div className={styles.headerCenter}>
            <h1 className={styles.headerTitle}>
              {mode === 'free' ? '自由练习' : '计时赛'}
            </h1>
            {mode === 'timed' && (
              <span className={`${styles.timer} ${state.isStarted && state.timeLeft <= 10 ? styles.timerUrgent : ''}`}>
                {state.timeLeft}s
              </span>
            )}
          </div>
          <button onClick={() => setShowArticlePicker(true)} className={styles.switchBtn}>
            换文章
          </button>
        </div>
      </header>

      <main className={styles.main} ref={mainRef}>
        <div className={styles.articleBar}>
          <span className={styles.articleTitle}>{selectedArticle.title}</span>
          <span className={styles.progress}>
            {state.currentIndex}/{chars.length}
          </span>
        </div>

        {/* Realtime stats */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{realtimeStats.wpm}</span>
            <span className={styles.statLabel}>WPM</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{realtimeStats.cpm}</span>
            <span className={styles.statLabel}>CPM</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{realtimeStats.accuracy}%</span>
            <span className={styles.statLabel}>正确率</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{realtimeStats.typedCount}/{realtimeStats.totalCount}</span>
            <span className={styles.statLabel}>进度</span>
          </div>
        </div>

        <div
          className={styles.textArea}
          ref={containerRef}
          onClick={() => inputRef.current?.focus({ preventScroll: true })}
        >
          {(() => {
            const currentLineIdx = textLines.findIndex(
              (l) => state.currentIndex >= l.start && state.currentIndex < l.end,
            );
            return textLines.map((line, lineIdx) => {
            const isCurrentLine = lineIdx === currentLineIdx;
            const isCompleted = state.currentIndex >= line.end;
            const lineChars = chars.slice(line.start, line.end);

            return (
              <div
                key={lineIdx}
                data-line-current={isCurrentLine ? 'true' : 'false'}
                className={`${styles.textLine} ${isCurrentLine ? styles.textLineCurrent : ''} ${isCompleted ? styles.textLineCompleted : ''}`}
              >
                <div className={styles.lineChars}>
                  {lineChars.map((char, charIdx) => {
                    const globalIdx = line.start + charIdx;
                    let charClass = styles.charDefault;
                    if (globalIdx < state.inputHistory.length) {
                      charClass =
                        state.inputHistory[globalIdx] === char
                          ? styles.charCorrect
                          : styles.charWrong;
                    }
                    if (globalIdx === state.currentIndex && !state.isFinished) {
                      charClass = `${charClass} ${styles.charCurrent}`;
                    }
                    return (
                      <span
                        key={globalIdx}
                        data-index={globalIdx}
                        className={charClass}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
                {/* Typed text display below each line */}
                <div className={styles.lineInput}>
                  {state.inputHistory.slice(line.start, line.end).map((ch, i) => (
                    <span key={i} className={styles.charCorrect}>
                      {ch}
                    </span>
                  ))}
                  {isCurrentLine && !state.isFinished && (
                    <span className={styles.lineCursor}>|</span>
                  )}
                </div>
              </div>
            );
          });
          })()}
        </div>

        <textarea
          ref={inputRef}
          className={styles.hiddenInput}
          onChange={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="done"
          aria-label="打字输入区"
        />

        {!state.isStarted && (
          <p className={styles.hint} onClick={() => inputRef.current?.focus({ preventScroll: true })}>
            点击上方文字区域开始打字
          </p>
        )}

        {state.isStarted && !state.isFinished && (
          <button onClick={handleRestart} className={styles.resetBtn}>
            重新开始
          </button>
        )}
      </main>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>加载中...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
