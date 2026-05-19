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
      <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px;">Speakボタンからの音声を聞いて、聞いた内容を中国語で手書きしてください。次に進むときは次に進むを押してください。</p>
      <button @click="speakText(questionData[2])">Speak</button>
      
      
    </div>`,
};