'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Article, ArticleGroup } from '@/types';
import { getArticles, getGroups } from '@/lib/storage';
import styles from './page.module.css';

function SelectContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'free';
  const duration = searchParams.get('duration') || '';

  const [groups, setGroups] = useState<ArticleGroup[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setGroups(getGroups());
    setArticles(getArticles());
  }, []);

  const treeData = useMemo(() => {
    const result: { group: ArticleGroup | null; articles: Article[] }[] = [];

    // Groups with their articles
    for (const group of groups) {
      result.push({
        group,
        articles: articles.filter((a) => a.groupId === group.id),
      });
    }

    // Ungrouped articles
    const ungrouped = articles.filter((a) => !a.groupId);
    if (ungrouped.length > 0) {
      result.push({ group: null, articles: ungrouped });
    }

    return result;
  }, [groups, articles]);

  const toggleGroup = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const buildUrl = useCallback(
    (article: Article) => {
      const params = new URLSearchParams();
      params.set('mode', mode);
      params.set('articleId', article.id);
      if (duration) params.set('duration', duration);
      return `/practice?${params.toString()}`;
    },
    [mode, duration],
  );

  const modeLabel = mode === 'free' ? '自由练习' : '计时赛';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backBtn}>
            ← 首页
          </Link>
          <h1 className={styles.headerTitle}>
            选择文章 · {modeLabel}
          </h1>
          <div className={styles.headerSpacer} />
        </div>
      </header>

      <main className={styles.main}>
        {treeData.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>暂无文章，请先添加练习文章</p>
            <Link href="/articles" className={styles.btnPrimary}>
              前往文章管理
            </Link>
          </div>
        ) : (
          <div className={styles.tree}>
            {treeData.map(({ group, articles: groupArticles }) => {
              const groupId = group?.id || '__ungrouped__';
              const isCollapsed = collapsed.has(groupId);

              return (
                <div key={groupId} className={styles.treeGroup}>
                  <button
                    className={styles.groupHeader}
                    onClick={() => toggleGroup(groupId)}
                  >
                    <span
                      className={`${styles.arrow} ${isCollapsed ? styles.arrowCollapsed : ''}`}
                    >
                      ▶
                    </span>
                    <span className={styles.groupName}>
                      {group?.name || '未分组'}
                    </span>
                    <span className={styles.groupCount}>
                      {groupArticles.length} 篇
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className={styles.groupChildren}>
                      {groupArticles.length === 0 ? (
                        <p className={styles.groupEmpty}>此分组暂无文章</p>
                      ) : (
                        groupArticles.map((article) => (
                          <Link
                            key={article.id}
                            href={buildUrl(article)}
                            className={styles.articleItem}
                          >
                            <div className={styles.articleInfo}>
                              <span className={styles.articleTitle}>
                                {article.title}
                              </span>
                              <span className={styles.articleMeta}>
                                {article.content.length} 字
                              </span>
                            </div>
                            <span className={styles.articleArrow}>→</span>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SelectPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
          加载中...
        </div>
      }
    >
      <SelectContent />
    </Suspense>
  );
}
