import { ref, watch, onMounted, nextTick } from "vue";

// 音声再生ヘルパー関数
export const speakText = (text) => {
  if (!text) return;
  const textToSpeak = text.split("/")[0];
  const uttr = new SpeechSynthesisUtterance(textToSpeak);
  uttr.lang = "zh-CN";
  speechSynthesis.cancel();
  speechSynthesis.speak(uttr);
};

// 共通のロジック
export const useWordSort = (props, emit) => {
  const poolList = ref([]);
  const answerList = ref([]);
  const answerContainer = ref(null); // Sortableを適用するDOM要素
  let sortableInstance = null;

  // データ初期化
  watch(
    () => props.questionData,
    (newData) => {
      if (!newData) return;
      const words = newData
        .slice(5)
        .filter(
          (w) => w !== undefined && w !== null && String(w).trim() !== "",
        );

      // フィッシャー–イェーツのシャッフルで単語をランダム化
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }

      poolList.value = words.map((text, i) => ({
        id: `${i}-${text}`,
        text: String(text),
      }));
      answerList.value = [];
      emit("update-answer", "");
    },
    { immediate: true },
  );

  // 単語移動処理（クリック時）
  const moveWord = (wordObj, fromList, toList) => {
    const type = props.questionData ? props.questionData[1] : null;
    if (type !== "E") {
      speakText(wordObj.text);

    }
    // タイプDとEの場合は、回答欄に1つしか置けないように制御
    if (toList === answerList.value && (type === "D" || type === "E" || type === "I" || type === "J" || type === "K" || type === "M" || type === "N" || type === "O" || type === "O" || type === "P" || type === "Q" || type === "R" || type === " S" || type === "T")) {
      while (answerList.value.length > 0) {
        const removed = answerList.value.pop();
        poolList.value.push(removed);
      }
    }

    const index = fromList.indexOf(wordObj);
    if (index > -1) {
      fromList.splice(index, 1);
      toList.push(wordObj);
      emit("update-answer", answerList.value.map((w) => w.text).join(""));
    }
  };

  // SortableJSの初期化
  const initSortable = () => {
    if (answerContainer.value && typeof Sortable !== "undefined") {
      if (sortableInstance) {
        sortableInstance.destroy();
      }
      sortableInstance = new Sortable(answerContainer.value, {
        animation: 150,
        draggable: ".word-chip", // 単語チップのみドラッグ可能
        ghostClass: "sortable-ghost",
        onEnd: (evt) => {
          const oldIdx = evt.oldDraggableIndex;
          const newIdx = evt.newDraggableIndex;

          if (oldIdx !== undefined && newIdx !== undefined && oldIdx !== newIdx) {
            // Vueの仮想DOMエラーを防ぐため、Sortableが移動したDOMを一旦元の位置に戻す
            const itemEl = evt.item;
            const parent = evt.from;
            const oldDomIndex = evt.oldIndex;

            parent.removeChild(itemEl);
            if (oldDomIndex >= parent.children.length) {
              parent.appendChild(itemEl);
            } else {
              parent.insertBefore(itemEl, parent.children[oldDomIndex]);
            }

            // Vueのデータを更新して再レンダリングさせる
            const item = answerList.value.splice(oldIdx, 1)[0];
            answerList.value.splice(newIdx, 0, item);
            emit("update-answer", answerList.value.map((w) => w.text).join(""));
          }
        },
      });
    }
  };

  onMounted(() => {
    nextTick(() => {
      initSortable();
    });
  });

  return { poolList, answerList, answerContainer, moveWord };
};
// --- ここから下を追加 ---

// 句読点や記号を除去する関数
export const cleanText = (text) => {
  return text.replace(/[，。？！、,.\?!]/g, '').trim();
};

// レーベンシュタイン距離（配列同士の比較）
const levenshteinDistance = (arr1, arr2) => {
  const matrix = [];
  for (let i = 0; i <= arr1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= arr2.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= arr1.length; i++) {
    for (let j = 1; j <= arr2.length; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[arr1.length][arr2.length];
};

// 発音の評価を行う関数
export const evaluatePronunciation = (targetText, spokenText) => {
  const cleanTarget = cleanText(targetText);
  const cleanSpoken = cleanText(spokenText);

  // 1. 中国語の文字列が完全一致する場合
  if (cleanTarget === cleanSpoken) {
    return { score: 100, message: "完美！发音非常标准。" };
  }

  // pinyin-pro が読み込まれていない場合のフォールバック
  if (!window.pinyinPro) {
    return { score: 0, message: "拼音转换库未加载。" };
  }

  // 2. ピンイン配列に変換して比較
  const { pinyin } = window.pinyinPro;
  const targetPinyinArr = pinyin(cleanTarget, { type: 'array' });
  const spokenPinyinArr = pinyin(cleanSpoken, { type: 'array' });

  // ピンインが完全一致する場合（同音異義語など）
  if (targetPinyinArr.join('') === spokenPinyinArr.join('')) {
    return { score: 100, message: "完美！发音非常标准。" };
  }

  // 3. レーベンシュタイン距離で類似度を計算
  const distance = levenshteinDistance(targetPinyinArr, spokenPinyinArr);
  const maxLength = Math.max(targetPinyinArr.length, spokenPinyinArr.length);
  
  // スコア算出 (0〜100)
  let score = Math.round((1 - distance / maxLength) * 100);
  if (score < 0) score = 0;

  // スコアに応じたメッセージ（中国語化）
  let message = "";
  if (score >= 80) {
    message = "非常好！稍加练习就完美了。";
  } else if (score >= 60) {
    message = "很遗憾。再多练习一下吧。";
  } else {
    message = "请再仔细听一遍，然后发音。";
  }

  return { score, message };
};
// --- ここから下を追加 ---

// タイプWのデータ補正処理（()をランダムな単語で埋める）
export const processTypeW = (question) => {
  const q = [...question]; // 元のデータを壊さないようにコピー
  const hanyuParts = String(q[2]).split('/');
  const riyuParts = String(q[4]).split('/');
  
  const hanyuQuestion = hanyuParts[0];
  const numPlaceholders = (hanyuQuestion.match(/\(\)/g) || []).length;
  
  // F列以降の有効な選択肢を抽出
  const validOptions = [];
  for (let i = 5; i < q.length; i++) {
    if (q[i] && String(q[i]).trim() !== "") {
      validOptions.push(String(q[i]));
    }
  }

  if (validOptions.length === 0 || numPlaceholders === 0) {
    return q; // 補正できない場合はそのまま返す
  }

  // ランダムに選択肢を選ぶ
  const selectedOptions = [];
  const optionsCopy = [...validOptions];
  for (let i = 0; i < numPlaceholders; i++) {
    if (optionsCopy.length > 0) {
      const randomIndex = Math.floor(Math.random() * optionsCopy.length);
      const selectedOptionRaw = optionsCopy.splice(randomIndex, 1)[0];
      const parts = selectedOptionRaw.split('/');
      if (parts.length >= 3) {
        selectedOptions.push(parts); // [中国語, ピンイン, 日本語]
      } else {
        selectedOptions.push(["无", "wú", "なし"]);
      }
    } else {
      selectedOptions.push(["无", "wú", "なし"]);
    }
  }

  // 中国語の補正
  let hoseiHanyuQuestion = hanyuParts[0];
  for (let i = 0; i < numPlaceholders; i++) {
    hoseiHanyuQuestion = hoseiHanyuQuestion.replace('()', selectedOptions[i][0]);
  }
  const hoseiHanyu = [hoseiHanyuQuestion];

  for (let i = 1; i < hanyuParts.length; i++) {
    if (hanyuParts[i].includes('()')) {
      for (let j = 0; j < selectedOptions.length; j++) {
        let hoseiAnswer = hanyuParts[i].replace('()', selectedOptions[j][0]);
        hoseiHanyu.push(hoseiAnswer);
      }
    } else {
      hoseiHanyu.push(hanyuParts[i]);
    }
  }
  q[2] = hoseiHanyu.join('/'); // 補正済みの中国語文章で上書き

  // 日本語の補正
  let hoseiRiyuQuestion = riyuParts[0];
  for (let i = 0; i < numPlaceholders; i++) {
    hoseiRiyuQuestion = hoseiRiyuQuestion.replace('()', selectedOptions[i][2]);
  }
  const hoseiRiyu = [hoseiRiyuQuestion];

  for (let i = 1; i < riyuParts.length; i++) {
    if (riyuParts[i].includes('()')) {
      for (let j = 0; j < selectedOptions.length; j++) {
        let hoseiAnswer = riyuParts[i].replace('()', selectedOptions[j][2]);
        hoseiRiyu.push(hoseiAnswer);
      }
    } else {
      hoseiRiyu.push(riyuParts[i]);
    }
  }
  q[4] = hoseiRiyu.join('/'); // 補正済みの日本語訳で上書き

  return q;
};