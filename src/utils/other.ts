/**
 * テキストをクリップボードにコピーする
 */
export const copyToClipboard = async (
text: string,
): Promise<boolean> => {
    if (typeof text !== 'string') {
        console.error('Invalid input: text must be a string');
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text', err);
        return false;
    }
};  
  
/**
 * マスキング処理: 環境変数に設定されている AWS アカウント ID を "MASKED_ACCOUNT_ID" に置き換え
 * @param message ログメッセージ
 * @returns マスキング後のメッセージ
 */
export const maskAccountId = (message: string): string => {
    if (typeof message !== 'string') {
      console.warn('Invalid input: message must be a string');
      return '';
    }
  
    const accountId = process.env.AWS_ACCOUNT_ID;
    if (!accountId) {
      console.warn('AWS_ACCOUNT_ID is not defined');
      return message;
    }
  
    try {
      const escapedAccountId = accountId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const accountIdRegex = new RegExp(`\\b${escapedAccountId}\\b`, 'g');
      return message.replace(accountIdRegex, '************');
    } catch (err) {
      console.error('Failed to mask account ID', err);
      throw new Error('Failed to mask account ID');
    }
};
