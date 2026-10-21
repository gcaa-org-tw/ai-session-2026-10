import JSZip from 'jszip';
import type { AnswerKey, MockRelease } from './types';

export interface KitDoc {
  files: Record<string, string>;
}

export const MAX_KIT_BYTES = 900_000;

const SKIPPED_ENTRY = /(^|\/)(__MACOSX\/|\.DS_Store$)/;

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('不是有效的 JSON。');
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseMockRelease(text: string): MockRelease {
  const data = parseJson(text);
  if (!isRecord(data) || typeof data.title !== 'string' || !Array.isArray(data.sentences)) {
    throw new Error('格式不符：需要 title 與 sentences。');
  }
  const sentences = data.sentences.map((s: unknown) => {
    if (!isRecord(s) || typeof s.id !== 'string' || typeof s.text !== 'string') {
      throw new Error('格式不符：每個句子都要有 id 與 text。');
    }
    return { id: s.id, text: s.text };
  });
  return { title: data.title, sentences };
}

export function parseAnswerKey(text: string): AnswerKey {
  const data = parseJson(text);
  if (!isRecord(data)) throw new Error('格式不符：需要以句子編號為鍵的物件。');
  const key: AnswerKey = {};
  for (const [id, entry] of Object.entries(data)) {
    if (
      !isRecord(entry) ||
      (entry.verdict !== 'mismatch' && entry.verdict !== 'nosource') ||
      typeof entry.explanation !== 'string'
    ) {
      throw new Error(`格式不符：${id} 需要 verdict（mismatch 或 nosource）與 explanation。`);
    }
    key[id] = { verdict: entry.verdict, explanation: entry.explanation };
  }
  return key;
}

export function parseNotes(text: string): Record<string, string> {
  const data = parseJson(text);
  if (!isRecord(data)) throw new Error('格式不符：需要以頁面編號為鍵的物件。');
  const notes: Record<string, string> = {};
  for (const [id, note] of Object.entries(data)) {
    if (typeof note !== 'string') throw new Error(`格式不符：${id} 的內容必須是文字。`);
    notes[id] = note;
  }
  return notes;
}

function stripTopFolder(files: Record<string, string>): Record<string, string> {
  const paths = Object.keys(files);
  if (paths.length === 0 || !paths.every((p) => p.includes('/'))) return files;
  const top = paths[0]?.split('/')[0];
  if (!top || !paths.every((p) => p.startsWith(`${top}/`))) return files;
  const out: Record<string, string> = {};
  for (const [p, text] of Object.entries(files)) out[p.slice(top.length + 1)] = text;
  return out;
}

export async function parseKit(buffer: ArrayBuffer): Promise<KitDoc> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error('不是有效的 zip 檔。');
  }
  const files: Record<string, string> = {};
  let bytes = 0;
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || SKIPPED_ENTRY.test(path)) continue;
    const text = await entry.async('string');
    bytes += new TextEncoder().encode(path + text).length;
    files[path] = text;
  }
  if (Object.keys(files).length === 0) throw new Error('壓縮檔內沒有任何檔案。');
  if (bytes > MAX_KIT_BYTES) throw new Error('素材包超過 Firestore 單一文件的大小上限，請縮小後再傳。');
  return { files: stripTopFolder(files) };
}
