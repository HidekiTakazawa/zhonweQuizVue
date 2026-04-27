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
    if (toList === answerList.value && (type === "D" || type === "E" || type === "I")) {
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