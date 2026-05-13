import { useWordSort, speakText } from "./utils.js";

export default {
  props: ["questionData", "isChecked"],
  emits: ["update-answer"],
  setup(props, { emit }) {
    const { poolList, answerList, answerContainer, moveWord } = useWordSort(props, emit);
    return { poolList, answerList, answerContainer, moveWord, speakText };
  },
  template: `
    <div class="dataContent">
      <p class="pinyin" v-if="isChecked">{{ questionData[3] }}</p>
      <p class="hanyu" v-if="isChecked" @click="speakText(questionData[2])">{{ questionData[2].split('/')[0] }}</p>
      <p class="japanese">{{ questionData[4] }}</p>
      
      <div class="answer member" ref="answerContainer">
        <span class="label">回答</span>
        <span v-for="word in answerList" :key="word.id" class="word-chip" @click="moveWord(word, answerList, poolList)">{{ word.text }}</span>
      </div>
      
      <div class="question member">
        <span class="label">単語</span>
        <span v-for="word in poolList" :key="word.id" class="word-chip" @click="moveWord(word, poolList, answerList)">{{ word.text }}</span>
      </div>
    </div>`,
};