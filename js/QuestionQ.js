import { watch } from "vue";
import { useWordSort, speakText } from "./utils.js";

export default {
  props: ["questionData", "isChecked"],
  emits: ["update-answer"],
  setup(props, { emit }) {
    const { poolList, answerList, answerContainer, moveWord } = useWordSort(props, emit);
    
    // マスク用の色とラベルの定義
    const maskStyles = [
      { bg: 'black', color: 'white', label: 'A' },
      { bg: 'red', color: 'white', label: 'B' },
      { bg: 'pink', color: 'white', label: 'C' },
      { bg: 'yellow', color: 'black', label: 'D' }
    ];

    // 単語リストが生成・シャッフルされた後に、マスク情報を割り当てる
    watch(poolList, (newList) => {
      if (newList.length > 0) {
        newList.forEach((word, index) => {
          if (!word.maskStyle) {
            // 4色を順番に割り当てる
            word.maskStyle = maskStyles[index % maskStyles.length];
          }
        });
      }
    }, { deep: true, immediate: true });

    return { poolList, answerList, answerContainer, moveWord, speakText };
  },
  template: `
    <div class="dataContent">
      <!-- タイプIは最初からすべて表示する -->
      <p class="pinyin">{{ questionData[3] }}</p>
      <p class="hanyu" @click="speakText(questionData[2])">{{ questionData[2].split('/')[0] }}</p>
      <p class="japanese">{{ questionData[4] }}</p>
      <button @click="speakText(questionData[2])">Speak</button>
      <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px;">問題のブロックをクリックして問いに対して最も適しているものを選んでください。</p>

      <div class="answer member" ref="answerContainer">
        <span class="label">回答</span>
        <span v-for="word in answerList" :key="word.id" 
              class="word-chip" 
              :style="!isChecked && word.maskStyle ? { backgroundColor: word.maskStyle.bg, color: word.maskStyle.color, borderColor: word.maskStyle.bg } : {}"
              @click="moveWord(word, answerList, poolList)">
          <!-- チェック前はA,B,C,Dを表示、チェック後は実際の単語を表示 -->
          {{ isChecked ? word.text : (word.maskStyle ? word.maskStyle.label : '') }}
        </span>
      </div>
      
      <div class="question member">
        <span class="label">問題</span>
        <span v-for="word in poolList" :key="word.id" 
              class="word-chip" 
              :style="!isChecked && word.maskStyle ? { backgroundColor: word.maskStyle.bg, color: word.maskStyle.color, borderColor: word.maskStyle.bg } : {}"
              @click="moveWord(word, poolList, answerList)">
          {{ isChecked ? word.text : (word.maskStyle ? word.maskStyle.label : '') }}
        </span>
      </div>
    </div>`,
};