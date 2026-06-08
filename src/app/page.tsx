'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { TypingRecord } from '@/types';
import { getRecords } from '@/lib/storage';
import styles from './page.module.css';

// Simple SVG line chart component
function TrendChart({
  data,
  width,
  height,
  label,
  valueKey,
  formatValue,
  color,
}: {
  data: TypingRecord[];
  width: number;
  height: number;
  label: string;
  valueKey: keyof TypingRecord;
  formatValue: (v: number) => string;
  color: string;
}) {
  const pad = { top: 16, right: 16, bottom: 24, left: 16 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  if (data.length === 0) {
    return (
      <div className={styles.chartWrapper}>
        <div className={styles.chartTitle}>{label}</div>
        <div className={styles.chartEmpty}>暂无数据</div>
      </div>
    );
  }

  const values = data.map((d) => d[valueKey] as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Build points: oldest on the left
  const reversed = [...data].reverse();
  const points = reversed.map((d, i) => {
    const x = pad.left + (i / Math.max(reversed.length - 1, 1)) * chartW;
    const y = pad.top + chartH - (((d[valueKey] as number) - minVal) / range) * chartH;
    return { x, y, val: d[valueKey] as number, date: d.date };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // Y axis labels
  const yLabels = [minVal, Math.round((minVal + maxVal) / 2), maxVal];

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartTitle}>{label}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
        {/* Grid lines */}
        {yLabels.map((v, i) => {
          const y = pad.top + chartH - ((v - minVal) / range) * chartH;
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={pad.left + chartW} y2={y} stroke="#dfdcd9" strokeWidth="0.5" />
              <text x={pad.left - 4} y={y + 3} textAnchor="end" fontSize="10" fill="#a39e98">
                {formatValue(v)}
              </text>
            </g>
          );
        })}
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke={color} strokeWidth="2" />
        ))}
        {/* X axis labels - show first and last date */}
        {points.length > 1 && (
          <>
            <text x={points[0].x} y={height - 4} textAnchor="start" fontSize="10" fill="#a39e98">
              {new Date(points[0].date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </text>
            <text x={points[points.length - 1].x} y={height - 4} textAnchor="end" fontSize="10" fill="#a39e98">
              {new Date(points[points.length - 1].date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

const TIMED_OPTIONS = [
  { value: 30, label: '30秒' },
  { value: 60, label: '1分钟' },
  { value: 120, label: '2分钟' },
  { value: 180, label: '3分钟' },
  { value: 300, label: '5分钟' },
];

export default function HomePage() {
  const [recentRecords, setRecentRecords] = useState<TypingRecord[]>([]);
  const [showTimedPicker, setShowTimedPicker] = useState(false);

  useEffect(() => {
    setRecentRecords(getRecords().slice(0, 5));
  }, []);

  // All records for charts (capped at last 30, ordered chronologically)
  const allRecords = useMemo(() => {
    const records = getRecords();
    return records.slice(0, 30).reverse(); // chronological order
  }, []);

  const bestSpeed = recentRecords.length > 0 ? Math.max(...recentRecords.map((r) => r.speed)) : 0;
  const bestAccuracy =
    recentRecords.length > 0 ? Math.max(...recentRecords.map((r) => r.accuracy)) : 0;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.logo}>Typing Pro</h1>
          <Link href="/articles" className={styles.navLink}>
            文章管理
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>提升打字速度</h2>
          <p className={styles.heroDesc}>简洁、克制的打字练习工具，专注每一次击键</p>
        </div>

        {/* Practice Modes */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>练习模式</h3>
          <div className={styles.cards}>
            <Link href="/select?mode=free" className={styles.card}>
              <h4 className={styles.cardTitle}>自由练习</h4>
              <p className={styles.cardDesc}>选择文章，按自己的节奏练习打字，无时间限制</p>
            </Link>
            <button
              onClick={() => setShowTimedPicker(true)}
              className={styles.card}
            >
              <h4 className={styles.cardTitle}>计时赛</h4>
              <p className={styles.cardDesc}>限时挑战，在倒计时中完成打字，测试速度极限</p>
            </button>
          </div>
        </section>

        {/* Stats */}
        {recentRecords.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>练习数据</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{bestSpeed}</span>
                <span className={styles.statLabel}>最佳速度 (字/分)</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{bestAccuracy}%</span>
                <span className={styles.statLabel}>最佳正确率</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{recentRecords.length}</span>
                <span className={styles.statLabel}>练习次数</span>
              </div>
            </div>
          </section>
        )}

        {/* Trend Charts */}
        {allRecords.length >= 2 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>学习曲线</h3>
            <div className={styles.chartsGrid}>
              <TrendChart
                data={allRecords}
                width={300}
                height={160}
                label="速度趋势 (WPM)"
                valueKey="speed"
                formatValue={(v) => `${v}`}
                color="#373530"
              />
              <TrendChart
                data={allRecords}
                width={300}
                height={160}
                label="正确率趋势 (%)"
                valueKey="accuracy"
                formatValue={(v) => `${v}%`}
                color="#787774"
              />
            </div>
          </section>
        )}

        {/* Recent Records */}
        {recentRecords.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>最近记录</h3>
            <div className={styles.recordList}>
              {recentRecords.map((r) => (
                <div key={r.id} className={styles.recordItem}>
                  <div className={styles.recordInfo}>
                    <span className={styles.recordMode}>{r.mode === 'free' ? '自由练习' : '计时赛'}</span>
                    <span className={styles.recordDate}>
                      {new Date(r.date).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className={styles.recordStats}>
                    <span>{r.speed} 字/分</span>
                    <span className={styles.recordDivider} />
                    <span>{r.accuracy}%</span>
                    <span className={styles.recordDivider} />
                    <span>{r.duration}s</span>
                    <span className={styles.recordDivider} />
                    <span>错{r.wrongChars}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Typing Pro · 简洁的打字练习工具</p>
      </footer>

      {/* Timed Mode Duration Picker Modal */}
      {showTimedPicker && (
        <div className={styles.overlay} onClick={() => setShowTimedPicker(false)}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.pickerTitle}>选择计时赛时长</h3>
            <div className={styles.pickerOptions}>
              {TIMED_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={`/select?mode=timed&duration=${opt.value}`}
                  className={styles.pickerOption}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
            <button
              onClick={() => setShowTimedPicker(false)}
              className={styles.pickerCancel}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
