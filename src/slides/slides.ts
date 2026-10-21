import { createElement } from 'react';
import type { JSX } from 'react';
import type { ActivityId, SectionId } from '../lib/types';
import PlaceholderActivity from '../activities/PlaceholderActivity';
import Placeholder from './Placeholder';

export interface SlideDef {
  id: string;
  section: SectionId;
  kind: 'content' | 'activity';
  activity?: ActivityId;
  render: () => JSX.Element;
}

export const sectionLabels: Record<SectionId, string> = {
  0: '開場',
  1: '認識 AI 助手',
  2: '日常習慣',
  3: '實際需求',
  4: '查核實作',
  5: '情境練習',
  6: '收尾',
};

function content(id: string, section: SectionId, title: string, body: string): SlideDef {
  return { id, section, kind: 'content', render: () => createElement(Placeholder, { title, body }) };
}

function activity(id: string, section: SectionId, activityId: ActivityId, title: string): SlideDef {
  return {
    id,
    section,
    kind: 'activity',
    activity: activityId,
    render: () => createElement(Placeholder, { title, body: '互動活動即將開放。' }),
  };
}

function habitsActivity(id: string, section: SectionId): SlideDef {
  return { id, section, kind: 'activity', activity: 'habits', render: () => createElement(PlaceholderActivity) };
}

export const slides: SlideDef[] = [
  content('opening', 0, 'AI 分享會', '歡迎，請保持這個頁面開啟。'),
  activity('warmup', 0, 'warmup', '暖身：你現在用到哪裡'),
  content('what-is-agent', 1, 'AI 助手能做什麼', '從對話到動手做事。'),
  habitsActivity('habits', 1),
  content('rules-files', 2, '把規則寫下來', '讓助手每次都照同樣的規矩做事。'),
  content('wish-intro', 3, '你最想交給助手的事', '先想，再分類。'),
  activity('wishlist', 3, 'wishlist', '願望清單'),
  activity('race', 4, 'race', '查核競賽'),
  content('scenario-intro', 5, '帶回工作的情境', '挑一件你下週就能試的事。'),
  activity('scenario', 5, 'scenario', '情境練習'),
  content('closing', 6, '謝謝大家', '後續協助請留下意見。'),
];
