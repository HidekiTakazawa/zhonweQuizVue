import { ref, watch, onMounted, nextTick, computed } from "vue";
import { speakText } from "./utils.js";

export default {
  props: ["questionData", "isChecked"],
  emits: ["update-answer", "submit"],
  setup(props, { emit }) {
    const textAnswer = ref("");
    const inputRef = ref(null);

    // F列以降の単語リスト
    const wordList = computed(() => {
      if (!props.questionData) return [];
      return props.questionData.slice(5).filter(w => w !== undefined && w !== null && String(w).trim() !== '');
    });

    watch(textAnswer, (newVal) => {
      emit("update-answer", newVal);
    });

    watch(
      () => props.questionData,
      () => {
        textAnswer.value = "";
        nextTick(() => {
          if (inputRef.value && !props.isChecked) {
            inputRef.value.focus();
          }
        });
      },
    );

    onMounted(() => {
      nextTick(() => {
        if (inputRef.value && !props.isChecked) {
          inputRef.value.focus();
        }
      });
    });

    // 一覧の単語をクリックしたときに入力欄に追記する機能
    const addWord = (wordRaw) => {
      if (props.isChecked) return;
      const chineseWord = wordRaw.split('/')[0]; // 中国語部分だけを抽出
      textAnswer.value += chineseWord;
      inputRef.value.focus();
    };

    return { speakText, textAnswer, inputRef, wordList, addWord };
  },
  template: `
    <div class="dataContent">
      <p class="pinyin" v-if="isChecked">{{ questionData[3] }}</p>
      <!-- 補正済みの質問文（1つ目）だけを表示 -->
      <p class="hanyu" v-if="isChecked">{{ questionData[2]}}</p>
      <p class="japanese" v-if="isChecked">{{ questionData[4].split('/')[0] }}</p>
      
      <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px;">Speakボタンからの音声を聞いて、返答を入力してください。</p>
      
      <div style="margin-bottom: 20px;">
        <button @click="speakText(questionData[2].split('/')[0])" style="background-color: #06b6d4;">Speak</button>
      </div>

      <div class="question member">
        <span class="label">一覧：</span>
        <span v-for="(word, index) in wordList" :key="index" class="word-chip" @click="addWord(word)">
          {{ word }}
        </span>
      </div>
      
      <div class="answerInput">
        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #4b5563;">中国語入力</label>
        <input type="text" ref="inputRef" v-model="textAnswer" @keyup.enter="$emit('submit')" :disabled="isChecked">
      </div>
    </div>`,
};