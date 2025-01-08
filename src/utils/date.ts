import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

// JSTタイムゾーンのオフセット (ミリ秒)
const JST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * 現在時刻をJST ISOStringで取得
 */
export const getJstIsoString = (): string => {
  const date = new Date();
  const jstDate = new Date(date.getTime() + JST_OFFSET);
  return jstDate.toISOString();
};

/**
 * 相対時間を日本語で表示 (例: 3分前)
 */
export const formatJstDistance = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { 
    addSuffix: true,
    locale: ja 
  });
};

/**
 * 日時を指定フォーマットで表示 (YYYY-MM-DD HH:mm:ss)
 */
export const formatJstDateTime = (dateString: string): string => {
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: ja });
};

/**
 * Date型をJST考慮して変換
 */
export const toJstDate = (date: Date): Date => {
  return new Date(date.getTime() + JST_OFFSET);
};

/**
 * テキストをクリップボードにコピーする
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}; 