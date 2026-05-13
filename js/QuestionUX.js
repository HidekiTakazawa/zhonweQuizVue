import { useWordSort, speakText } from "./utils.js";

export default {
  props: ["questionData", "isChecked"],
  emits: ["update-answer"],
  setup(props, { emit }) {
    const { poolList, answerList, answerContainer, moveWord } = useWordSort(props, emit);
    return { speakText };
  },
  template: `
    <div class="dataContent">
      <p class="pinyin" >{{ questionData[3] }}</p>
      <p class="hanyu" @click="speakText(questionData[2])">{{ questionData[2] }}</p>
      <p class="japanese">{{ questionData[4] }}</p>
      <button @click="speakText(questionData[2])">Speak</button>
      
      
    </div>`,
};