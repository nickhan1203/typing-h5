import type { Article, ArticleGroup, TypingRecord } from '@/types';

const ARTICLES_KEY = 'typing_articles';
const GROUPS_KEY = 'typing_groups';
const RECORDS_KEY = 'typing_records';

// Default articles
const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'default-1',
    title: '春',
    content:
      '盼望着，盼望着，东风来了，春天的脚步近了。一切都像刚睡醒的样子，欣欣然张开了眼。山朗润起来了，水涨起来了，太阳的脸红起来了。',
    groupId: null,
    createdAt: Date.now(),
  },
  {
    id: 'default-2',
    title: '匆匆',
    content:
      '燕子去了，有再来的时候；杨柳枯了，有再青的时候；桃花谢了，有再开的时候。但是，聪明的，你告诉我，我们的日子为什么一去不复返呢？',
    groupId: null,
    createdAt: Date.now(),
  },
  {
    id: 'default-3',
    title: '荷塘月色',
    content:
      '曲曲折折的荷塘上面，弥望的是田田的叶子。叶子出水很高，像亭亭的舞女的裙。层层的叶子中间，零星地点缀着些白花，有袅娜地开着的，有羞涩地打着朵儿的。',
    groupId: null,
    createdAt: Date.now(),
  },
];

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Articles
export function getArticles(): Article[] {
  const articles = getFromStorage<Article[]>(ARTICLES_KEY, []);
  if (articles.length === 0) {
    setToStorage(ARTICLES_KEY, DEFAULT_ARTICLES);
    return DEFAULT_ARTICLES;
  }
  return articles;
}

export function getArticleById(id: string): Article | undefined {
  return getArticles().find((a) => a.id === id);
}

export function getArticlesByGroup(groupId: string | null): Article[] {
  return getArticles().filter((a) => a.groupId === groupId);
}

export function saveArticle(article: Article): void {
  const articles = getArticles();
  const idx = articles.findIndex((a) => a.id === article.id);
  if (idx >= 0) {
    articles[idx] = article;
  } else {
    articles.unshift(article);
  }
  setToStorage(ARTICLES_KEY, articles);
}

export function deleteArticle(id: string): void {
  const articles = getArticles().filter((a) => a.id !== id);
  setToStorage(ARTICLES_KEY, articles);
}

// Groups
export function getGroups(): ArticleGroup[] {
  return getFromStorage<ArticleGroup[]>(GROUPS_KEY, []);
}

export function getGroupById(id: string): ArticleGroup | undefined {
  return getGroups().find((g) => g.id === id);
}

export function saveGroup(group: ArticleGroup): void {
  const groups = getGroups();
  const idx = groups.findIndex((g) => g.id === group.id);
  if (idx >= 0) {
    groups[idx] = group;
  } else {
    groups.push(group);
  }
  setToStorage(GROUPS_KEY, groups);
}

export function deleteGroup(id: string): void {
  const groups = getGroups().filter((g) => g.id !== id);
  setToStorage(GROUPS_KEY, groups);
  // Move articles in this group to ungrouped
  const articles = getArticles();
  let changed = false;
  articles.forEach((a) => {
    if (a.groupId === id) {
      a.groupId = null;
      changed = true;
    }
  });
  if (changed) setToStorage(ARTICLES_KEY, articles);
}

export function moveArticleToGroup(articleId: string, groupId: string | null): void {
  const articles = getArticles();
  const article = articles.find((a) => a.id === articleId);
  if (article) {
    article.groupId = groupId;
    setToStorage(ARTICLES_KEY, articles);
  }
}

// Records
export function getRecords(): TypingRecord[] {
  return getFromStorage<TypingRecord[]>(RECORDS_KEY, []);
}

export function saveRecord(record: TypingRecord): void {
  const records = getRecords();
  records.unshift(record);
  // Keep only last 100 records
  if (records.length > 100) {
    records.length = 100;
  }
  setToStorage(RECORDS_KEY, records);
}

export function clearRecords(): void {
  setToStorage(RECORDS_KEY, []);
}
