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
    speakText(wordObj.text);
    const type = props.questionData ? props.questionData[1] : null;

    // タイプDとEの場合は、回答欄に1つしか置けないように制御
    if (toList === answerList.value && (type === "D" || type === "E" || type === "I" || type === "J")) {
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
const cleanText = (text) => {
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
    return { score: 100, message: "完璧です！素晴らしい発音です。" };
  }

  // pinyin-pro が読み込まれていない場合のフォールバック
  if (!window.pinyinPro) {
    return { score: 0, message: "ピンイン変換ライブラリが読み込まれていません。" };
  }

  // 2. ピンイン配列に変換して比較
  const { pinyin } = window.pinyinPro;
  const targetPinyinArr = pinyin(cleanTarget, { type: 'array' });
  const spokenPinyinArr = pinyin(cleanSpoken, { type: 'array' });

  // ピンインが完全一致する場合（同音異義語など）
  if (targetPinyinArr.join('') === spokenPinyinArr.join('')) {
    return { score: 100, message: "完璧です！素晴らしい発音です。" };
  }

  // 3. レーベンシュタイン距離で類似度を計算
  const distance = levenshteinDistance(targetPinyinArr, spokenPinyinArr);
  const maxLength = Math.max(targetPinyinArr.length, spokenPinyinArr.length);
  
  // スコア算出 (0〜100)
  let score = Math.round((1 - distance / maxLength) * 100);
  if (score < 0) score = 0;

  // スコアに応じたメッセージ
  let message = "";
  if (score >= 80) {
    message = "とても良いです！少しの修正で完璧になります。";
  } else if (score >= 60) {
    message = "惜しいです。もう少し練習しましょう。";
  } else {
    message = "もう一度よく聞いて、発音してみましょう。";
  }

  return { score, message };
};