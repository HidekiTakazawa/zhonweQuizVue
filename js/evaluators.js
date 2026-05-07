import { evaluatePronunciation, cleanText, speakText } from "./utils.js";

// --- 各タイプの評価ロジック ---

// 標準的な評価（A, B, C, D, F, G, I, W など）
const evaluateStandard = (questionData, currentAnswer) => {
  const correctAnswers = questionData[2].split("/");
  const isSuccess = correctAnswers.includes(currentAnswer);
  const comment = isSuccess ? "好！赞👍" : "错×　再加油！！";
  const speech = isSuccess ? "好！赞" : "错，再加油"; // 読み上げ用（絵文字なし）

  speakText(speech); // ★ 音声出力
  return { isSuccess, comment };
};

// タイプEの評価
const evaluateE = (questionData, currentAnswer) => {
  const correctAnswers = questionData[3].split("/");
  const isSuccess = correctAnswers.includes(currentAnswer);
  const comment = isSuccess ? "好！赞👍" : "错×　再加油！！";
  const speech = isSuccess ? "好！赞" : "错，再加油";

  speakText(speech);
  return { isSuccess, comment };
};

// タイプHの評価（音声入力のスコア判定）
const evaluateH = (questionData, currentAnswer) => {
  if (!currentAnswer) {
    speakText("未收到音频输入");
    return { isSuccess: false, comment: "未收到音频输入。" };
  }
  const targetText = questionData[2].split("/")[0];
  const result = evaluatePronunciation(targetText, currentAnswer);

  speakText(result.message); // ★ メッセージ部分を読み上げ
  return {
    isSuccess: result.score >= 80,
    comment: `得分: ${result.score}分 - ${result.message}`,
  };
};

// タイプLの評価（模範解答とのマッチング）
const evaluateL = (questionData, currentAnswer) => {
  if (!currentAnswer) {
    speakText("未收到音频输入");
    return { isSuccess: false, comment: "未收到音频输入。" };
  }
  const answersData = questionData
    .slice(5)
    .filter((w) => w !== undefined && w !== null && String(w).trim() !== "");
  const cleanSpoken = cleanText(currentAnswer);

  for (const data of answersData) {
    const parts = String(data).split("/");
    const modelAnswer = cleanText(parts[0]);
    const modelComment = parts[1] || "好！赞👍";
    const speechComment = parts[1] ? parts[1].replace(/[👍×]/g, "") : "好！赞"; // 絵文字を除去して読み上げ

    if (modelAnswer === cleanSpoken) {
      speakText(speechComment); // ★ 音声出力
      return { isSuccess: true, comment: modelComment };
    }
  }

  speakText("错，再加油");
  return { isSuccess: false, comment: "错×　再加油！！" };
};

// タイプMの評価（特殊処理）
const evaluateM = (questionData, currentAnswer) => {
  if (!currentAnswer) {
    speakText("未回答");
    return { isSuccess: false, comment: "未回答。" };
  }

  const correctAnswers = questionData[2].split("/");
  const isSuccess = correctAnswers.includes(currentAnswer.split("/")[0]);
  const comment = isSuccess ? "好！赞👍" : "错×　再加油！！";
  const speech = isSuccess ? "好！赞" : "错，再加油";

  speakText(speech);
  return { isSuccess, comment };
};
// タイプNの評価（特殊処理）
const evaluateN = (questionData, currentAnswer) => {
  if (!currentAnswer) {
    speakText("未回答");
    return { isSuccess: false, comment: "未回答。" };
  }

  const [template, expected] = questionData[2].split("/");

  // '()' を回答で置換し、期待される完成文と一致するか判定
  const isSuccess = template.replace("()", currentAnswer) === expected;

  const comment = isSuccess ? "好！赞👍" : "错×　再加油！！";
  const speech = isSuccess ? "好！赞" : "错，再加油";

  speakText(speech);
  return { isSuccess, comment };
};

// --- 評価関数のマッピング（辞書） ---
export const evaluators = {
  DEFAULT: evaluateStandard,
  E: evaluateE,
  H: evaluateH,
  L: evaluateL,
  M: evaluateM,
  N: evaluateN,
};
