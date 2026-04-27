import { ref, watch } from "vue";
import { useWordSort, speakText } from "./utils.js";
export default {
  props: ["questionData", "isChecked"],
  emits: ["update-answer"],
  setup(props, { emit }) {
    const { poolList } = useWordSort(props, emit);
    const textAnswer = ref("");
    watch(textAnswer, (newVal) => {
      emit("update-answer", newVal);
    });
    watch(
      () => props.questionData,
      () => {
        textAnswer.value = "";
      },
    );
    return { poolList, speakText, textAnswer };
  },
  template: `
    <div class="dataContent">
      <p class="pinyin" v-if="isChecked">{{ questionData[3] }}</p>
      <p class="hanyu" v-if="isChecked" @click="speakText(questionData[2])">{{ questionData[2].split('/')[0] }}</p>
      <p class="japanese">{{ questionData[4] }}</p>
      <div class="answerInput">
        <input type="text" v-model="textAnswer">
      </div>
    </div>`,
};