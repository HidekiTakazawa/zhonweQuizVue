import { evaluatePronunciation, cleanText } from './utils.js';

// --- 各タイプの評価ロジック ---

// 標準的な評価（A, B, C, D, F, G, I, W など）
// C列の中国語文章と比較する
const evaluateStandard = (questionData, currentAnswer) => {
  const correctAnswers = questionData[2].split('/');
  const isSuccess = correctAnswers.includes(currentAnswer);
  return {
    isSuccess,
    comment: isSuccess ? '大変よくできました。' : '間違っています！　もっとしっかり勉強して。'
  };
};

// タイプEの評価（D列のピンインと比較する）
const evaluateE = (questionData, currentAnswer) => {
  const correctAnswers = questionData[3].split('/');
  const isSuccess = correctAnswers.includes(currentAnswer);
  return {
    isSuccess,
    comment: isSuccess ? '大変よくできました。' : '間違っています！　もっとしっかり勉強して。'
  };
};

// タイプHの評価（音声入力のスコア判定）
const evaluateH = (questionData, currentAnswer) => {
  if (!currentAnswer) {
    return { isSuccess: false, comment: '音声が入力されていません。' };
  }
  const targetText = questionData[2].split('/')[0];
  const result = evaluatePronunciation(targetText, currentAnswer);
  return {
    isSuccess: result.score >= 80,
    comment: `スコア: ${result.score}点 - ${result.message}`
  };
};

// タイプLの評価（模範解答とのマッチング）
const evaluateL = (questionData, currentAnswer) => {
  if (!currentAnswer) {
    return { isSuccess: false, comment: '音声が入力されていません。' };
  }
  const answersData = questionData.slice(5).filter(w => w !== undefined && w !== null && String(w).trim() !== '');
  const cleanSpoken = cleanText(currentAnswer);

  for (const data of answersData) {
    const parts = String(data).split('/');
    const modelAnswer = cleanText(parts[0]);
    const modelComment = parts[1] || '正解です！';
    
    if (modelAnswer === cleanSpoken) {
      return { isSuccess: true, comment: modelComment };
    }
  }
  return { isSuccess: false, comment: '間違っています！　もっとしっかり勉強して。' };
};

// タイプMの評価（特殊処理）
const evaluateM = (questionData, currentAnswer) => {
  if (!currentAnswer) return { isSuccess: false, comment: '未回答です。' };
  
  const correctAnswers = questionData[2].split('/');
  const isSuccess = correctAnswers.includes(currentAnswer.split('/')[0]);
  return {
    isSuccess,
    comment: isSuccess ? '大変よくできました。' : '間違っています！　もっとしっかり勉強して。'
  };
};

// --- 評価関数のマッピング（辞書） ---
// 新しいタイプを追加するときは、ここに関数を登録するだけ！
export const evaluators = {
  DEFAULT: evaluateStandard, // 登録されていないタイプはすべて標準評価になる
  E: evaluateE,
  H: evaluateH,
  L: evaluateL,
  M: evaluateM
};