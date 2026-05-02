import { ref, watch, onMounted, nextTick } from "vue";
import { useWordSort, speakText } from "./utils.js";
export default {
  props: ["questionData", "isChecked"],
  emits: ["update-answer"],
  setup(props, { emit }) {
    const { poolList } = useWordSort(props, emit);
    const textAnswer = ref("");
     const inputRef = ref(null); // ★ 入力ボックスのDOMを参照するための変数
    watch(textAnswer, (newVal) => {
      emit("update-answer", newVal);
    });
    watch(
      () => props.questionData,
      () => {
        textAnswer.value = "";
        // ★ 次の問題に進んだときにフォーカスを当てる
        nextTick(() => {
          if (inputRef.value && !props.isChecked) {
            inputRef.value.focus();
          }
        });
      },
    
    );
      // ★ 初回表示時（マウント時）にもフォーカスを当てる
    onMounted(() => {
      nextTick(() => {
        if (inputRef.value && !props.isChecked) {
          inputRef.value.focus();
        }
      });
    });
    return { poolList, speakText, textAnswer, inputRef };
  },
  template: `
    <div class="dataContent">
      <p class="pinyin" v-if="isChecked">{{ questionData[3] }}</p>
      <p class="hanyu" v-if="isChecked" @click="speakText(questionData[2])">{{ questionData[2] }}</p>
      <p class="japanese" v-if="isChecked">{{ questionData[4] }}</p>
      <button @click="speakText(questionData[2])">Speak</button>
      <div class="answerInput">
         <!-- ★ ref="inputRef" を追加 -->
        <input type="text" ref="inputRef" v-model="textAnswer" @keyup.enter="$emit('submit')" :disabled="isChecked">
      </div>
    </div>`,
};