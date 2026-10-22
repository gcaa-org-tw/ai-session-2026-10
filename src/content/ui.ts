import type { SectionId } from '../lib/types';

export const ui = {
  reveal: '揭曉',
  exportCsv: '匯出 CSV',
  suggestedBin: '建議分類',
  kitFileName: '練習包.zip',
  kitMissing: '尚未上傳練習包。',
  releaseMissing: '尚未上傳模擬稿。',
  keyMissing: '尚未上傳答案。',
  toc: '目錄',
  closeToc: '關閉目錄',
  sectionNav: '段落導覽',
  nextSection: '下一段：',
  previousSection: '上一段：',
  skipActivity: '略過這個活動',
  presenterAt: '主持人正在：',
  presenterJump: '跳過去',
  autoFollow: '自動跟著主持人',
  presenterError: '無法取得主持人進度',
  reloadPage: '重試',
  presenterStatus: '主持人進度',
};

export const sectionNumerals: Record<SectionId, string> = {
  0: '一',
  1: '二',
  2: '三',
  3: '四',
  4: '五',
  5: '六',
  6: '七',
};
