import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ImportedArticle {
  title: string;
  content: string;
}

// ── TXT 解析 ──────────────────────────────────────
function parseTXT(text: string, filename: string): ImportedArticle[] {
  const articles: ImportedArticle[] = [];

  // Try to split by common chapter markers
  const chapterRegex =
    /^(?:第[零一二三四五六七八九十百千万\d]+[章节回篇部]|[Cc]hapter\s*\d+|§+\s|\d+[.\、]\s).*$/gm;
  const lines = text.split(/\r?\n/);
  const chapterIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    chapterRegex.lastIndex = 0;
    if (chapterRegex.test(lines[i].trim())) {
      chapterIndices.push(i);
    }
  }

  if (chapterIndices.length > 1) {
    for (let i = 0; i < chapterIndices.length; i++) {
      const start = chapterIndices[i];
      const end =
        i + 1 < chapterIndices.length ? chapterIndices[i + 1] : lines.length;
      const chapterLines = lines.slice(start, end);
      const title = chapterLines[0].trim();
      const content = chapterLines
        .slice(1)
        .filter((l) => l.trim())
        .join('\n\n');

      if (content.length >= 20) {
        articles.push({
          title: title || `${filename} - 第${i + 1}章`,
          content,
        });
      }
    }
  }

  // Fallback: single article
  if (articles.length === 0) {
    const clean = text.replace(/\n{3,}/g, '\n\n').trim();
    if (clean.length >= 10) {
      const baseName = filename.replace(/\.(txt|text)$/i, '');
      articles.push({ title: baseName, content: clean });
    }
  }

  return articles;
}

// ── Strip HTML helper ──────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface TocItem {
  level: number;
  order: number;
  title: string;
  id: string;
  href: string;
}

interface FlowItem {
  id: string;
  href: string;
  title?: string;
}

// ── EPUB 解析 ──────────────────────────────────────
async function parseEPUB(filepath: string): Promise<ImportedArticle[]> {
  const EPub = (await import('epub')).default;
  const epub = new EPub(filepath);
  await epub.parse();

  const articles: ImportedArticle[] = [];
  const tocItems = (epub.toc || []) as TocItem[];

  for (const item of tocItems) {
    try {
      const raw = await epub.getChapterRaw(item.id);
      if (!raw) continue;
      const plainText = stripHtml(raw);
      if (plainText.length >= 20) {
        articles.push({
          title: item.title || `章节 ${item.id}`,
          content: plainText,
        });
      }
    } catch {
      continue;
    }
  }

  // If TOC is empty, try reading the flow (reading order)
  if (articles.length === 0 && epub.flow && epub.flow.length > 0) {
    const flowItems = epub.flow as FlowItem[];
    for (const chapter of flowItems) {
      try {
        const raw = await epub.getChapterRaw(chapter.id);
        if (!raw) continue;
        const plainText = stripHtml(raw);
        if (plainText.length >= 20) {
          articles.push({
            title: chapter.title || `章节 ${chapter.id}`,
            content: plainText,
          });
        }
      } catch {
        continue;
      }
    }
  }

  return articles;
}

// ── API Handler ────────────────────────────────────
export async function POST(request: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '未找到上传文件' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件不能超过 10MB' },
        { status: 400 },
      );
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let articles: ImportedArticle[] = [];

    if (filename.endsWith('.txt') || filename.endsWith('.text')) {
      const text = buffer.toString('utf-8');
      articles = parseTXT(text, file.name);
    } else if (filename.endsWith('.epub')) {
      // Write buffer to temp file for the epub parser (requires file path)
      tmpPath = join(
        tmpdir(),
        `typing-import-${randomBytes(8).toString('hex')}.epub`,
      );
      await writeFile(tmpPath, buffer);
      articles = await parseEPUB(tmpPath);
    } else {
      return NextResponse.json(
        { error: '不支持的文件格式，请上传 .txt 或 .epub 文件' },
        { status: 400 },
      );
    }

    if (articles.length === 0) {
      return NextResponse.json(
        { error: '未能从文件中提取到有效内容' },
        { status: 400 },
      );
    }

    return NextResponse.json({ articles });
  } catch (err) {
    const message = err instanceof Error ? err.message : '导入失败';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Clean up temp file
    if (tmpPath) {
      try {
        await unlink(tmpPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
