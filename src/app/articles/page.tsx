'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Article, ArticleGroup } from '@/types';
import {
  getArticles,
  getArticlesByGroup,
  getGroups,
  saveArticle,
  deleteArticle,
  saveGroup,
  deleteGroup,
  moveArticleToGroup,
} from '@/lib/storage';
import styles from './page.module.css';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [groups, setGroups] = useState<ArticleGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formGroupId, setFormGroupId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Group management state
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupDeleteConfirm, setGroupDeleteConfirm] = useState<string | null>(null);

  // Move article modal
  const [moveArticleId, setMoveArticleId] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setArticles(getArticles());
    setGroups(getGroups());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const displayedArticles = activeGroupId
    ? getArticlesByGroup(activeGroupId)
    : articles.filter((a) => !a.groupId);

  const handleSave = useCallback(() => {
    if (!title.trim() || !content.trim()) return;

    const article: Article = {
      id: editingArticle?.id || Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      groupId: formGroupId,
      createdAt: editingArticle?.createdAt || Date.now(),
    };

    saveArticle(article);
    refreshData();
    setShowForm(false);
    setEditingArticle(null);
    setTitle('');
    setContent('');
    setFormGroupId(null);
  }, [title, content, editingArticle, formGroupId, refreshData]);

  const handleEdit = useCallback((article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setContent(article.content);
    setFormGroupId(article.groupId);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteArticle(id);
      refreshData();
      setDeleteConfirm(null);
    },
    [refreshData],
  );

  const handleNew = useCallback(() => {
    setEditingArticle(null);
    setTitle('');
    setContent('');
    setFormGroupId(activeGroupId);
    setShowForm(true);
  }, [activeGroupId]);

  // Group handlers
  const handleSaveGroup = useCallback(() => {
    if (!groupName.trim()) return;
    const group: ArticleGroup = {
      id: editingGroupId || Date.now().toString(),
      name: groupName.trim(),
      createdAt: editingGroupId
        ? groups.find((g) => g.id === editingGroupId)?.createdAt || Date.now()
        : Date.now(),
    };
    saveGroup(group);
    refreshData();
    setGroupName('');
    setEditingGroupId(null);
  }, [groupName, editingGroupId, groups, refreshData]);

  const handleDeleteGroup = useCallback(
    (id: string) => {
      if (activeGroupId === id) setActiveGroupId(null);
      deleteGroup(id);
      refreshData();
      setGroupDeleteConfirm(null);
    },
    [activeGroupId, refreshData],
  );

  const handleMoveArticle = useCallback(
    (targetGroupId: string | null) => {
      if (moveArticleId) {
        moveArticleToGroup(moveArticleId, targetGroupId);
        refreshData();
        setMoveArticleId(null);
      }
    },
    [moveArticleId, refreshData],
  );

  // Article form view
  if (showForm) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingArticle(null);
              }}
              className={styles.backBtn}
            >
              ← 返回
            </button>
            <h1 className={styles.headerTitle}>
              {editingArticle ? '编辑文章' : '新建文章'}
            </h1>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim()}
              className={styles.saveBtn}
            >
              保存
            </button>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.form}>
            <input
              type="text"
              className={styles.input}
              placeholder="文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
            {/* Group selector in form */}
            <div className={styles.formGroupSelect}>
              <span className={styles.formLabel}>所属分组</span>
              <select
                className={styles.select}
                value={formGroupId || ''}
                onChange={(e) => setFormGroupId(e.target.value || null)}
              >
                <option value="">未分组</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className={styles.textarea}
              placeholder="输入或粘贴练习文本..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
            />
            <p className={styles.charCount}>{content.length} 字</p>
          </div>
        </main>
      </div>
    );
  }

  const currentGroup = activeGroupId
    ? groups.find((g) => g.id === activeGroupId)
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backBtn}>
            ← 首页
          </Link>
          <h1 className={styles.headerTitle}>文章管理</h1>
          <div className={styles.headerActions}>
            <button
              onClick={() => setShowGroupManager(true)}
              className={styles.addBtn}
            >
              分组
            </button>
            <button onClick={handleNew} className={styles.addBtn}>
              新建
            </button>
          </div>
        </div>
      </header>

      {/* Group tabs */}
      <div className={styles.groupTabs}>
        <div className={styles.groupTabsInner}>
          <button
            className={`${styles.groupTab} ${activeGroupId === null ? styles.groupTabActive : ''}`}
            onClick={() => setActiveGroupId(null)}
          >
            未分组
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              className={`${styles.groupTab} ${activeGroupId === g.id ? styles.groupTabActive : ''}`}
              onClick={() => setActiveGroupId(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <main className={styles.main}>
        {/* Group header */}
        {activeGroupId && currentGroup && (
          <div className={styles.groupHeader}>
            <span className={styles.groupName}>{currentGroup.name}</span>
            <span className={styles.groupCount}>
              {getArticlesByGroup(activeGroupId).length} 篇文章
            </span>
          </div>
        )}

        {articles.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>还没有练习文章</p>
            <button onClick={handleNew} className={styles.btnPrimary}>
              添加第一篇文章
            </button>
          </div>
        ) : displayedArticles.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>此分组暂无文章</p>
            <button onClick={handleNew} className={styles.btnPrimary}>
              添加文章
            </button>
          </div>
        ) : (
          <div className={styles.articleList}>
            {displayedArticles.map((article) => (
              <div key={article.id} className={styles.articleItem}>
                <div className={styles.articleInfo}>
                  <h3 className={styles.articleTitle}>{article.title}</h3>
                  <p className={styles.articleMeta}>
                    {article.content.length} 字 ·{' '}
                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                  <p className={styles.articlePreview}>
                    {article.content.slice(0, 60)}
                    {article.content.length > 60 ? '...' : ''}
                  </p>
                </div>
                <div className={styles.articleActions}>
                  <Link
                    href={`/practice?mode=free&articleId=${article.id}`}
                    className={styles.actionBtn}
                  >
                    练习
                  </Link>
                  <button
                    onClick={() => handleEdit(article)}
                    className={styles.actionBtnSecondary}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setMoveArticleId(article.id)}
                    className={styles.actionBtnSecondary}
                  >
                    移动
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(article.id)}
                    className={styles.actionBtnDanger}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Group Manager Modal */}
      {showGroupManager && (
        <div
          className={styles.overlay}
          onClick={() => setShowGroupManager(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>管理分组</h2>

            {/* Create / Edit group */}
            <div className={styles.groupForm}>
              <input
                type="text"
                className={styles.groupInput}
                placeholder="分组名称"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={20}
              />
              <button
                onClick={handleSaveGroup}
                disabled={!groupName.trim()}
                className={styles.groupSaveBtn}
              >
                {editingGroupId ? '更新' : '新建'}
              </button>
              {editingGroupId && (
                <button
                  onClick={() => {
                    setEditingGroupId(null);
                    setGroupName('');
                  }}
                  className={styles.groupCancelBtn}
                >
                  取消
                </button>
              )}
            </div>

            {/* Group list */}
            {groups.length === 0 ? (
              <p className={styles.noGroups}>暂无分组</p>
            ) : (
              <div className={styles.groupList}>
                {groups.map((g) => (
                  <div key={g.id} className={styles.groupItem}>
                    <div className={styles.groupItemInfo}>
                      <span className={styles.groupItemName}>{g.name}</span>
                      <span className={styles.groupItemCount}>
                        {getArticlesByGroup(g.id).length} 篇
                      </span>
                    </div>
                    <div className={styles.groupItemActions}>
                      <button
                        onClick={() => {
                          setEditingGroupId(g.id);
                          setGroupName(g.name);
                        }}
                        className={styles.groupEditBtn}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => setGroupDeleteConfirm(g.id)}
                        className={styles.groupDeleteBtn}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowGroupManager(false)}
              className={styles.modalCloseBtn}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Move article modal */}
      {moveArticleId && (
        <div className={styles.overlay} onClick={() => setMoveArticleId(null)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>移动到分组</h2>
            <div className={styles.moveList}>
              <button
                className={styles.moveItem}
                onClick={() => handleMoveArticle(null)}
              >
                <span>未分组</span>
                <span className={styles.moveCheck}>→</span>
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  className={styles.moveItem}
                  onClick={() => handleMoveArticle(g.id)}
                >
                  <span>{g.name}</span>
                  <span className={styles.moveCheck}>→</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMoveArticleId(null)}
              className={styles.modalCloseBtn}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Delete article confirm modal */}
      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalText}>确定要删除这篇文章吗？</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={styles.modalCancel}
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className={styles.modalConfirm}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete group confirm modal */}
      {groupDeleteConfirm && (
        <div
          className={styles.overlay}
          onClick={() => setGroupDeleteConfirm(null)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.modalText}>
              删除分组后，组内文章将移至"未分组"。确定删除？
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setGroupDeleteConfirm(null)}
                className={styles.modalCancel}
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteGroup(groupDeleteConfirm)}
                className={styles.modalConfirm}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
