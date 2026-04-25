import { ref, watch } from "vue";

// 音声再生ヘルパー関数
export const speakText = (text) => {
  if (!text) return;
  // スラッシュで複数の正解がある場合、最初の文だけを読み上げる
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
  const draggedItemIndex = ref(null);

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

  // 単語移動処理
  const moveWord = (wordObj, fromList, toList) => {
    speakText(wordObj.text);
    const type = props.questionData ? props.questionData[1] : null;

    // タイプDとEの場合は、回答欄に1つしか置けないように制御
    if (toList === answerList.value && (type === "D" || type === "E")) {
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

  // 並べ替え（ドラッグ＆ドロップ）処理
  const onDragStart = (index) => {
    draggedItemIndex.value = index;
  };

  const onDrop = (toIndex) => {
    if (draggedItemIndex.value === null) return;
    const item = answerList.value.splice(draggedItemIndex.value, 1)[0];
    answerList.value.splice(toIndex, 0, item);
    emit("update-answer", answerList.value.map((w) => w.text).join(""));
    draggedItemIndex.value = null;
  };

  return { poolList, answerList, moveWord, onDragStart, onDrop };
};
