import { ref, watch } from "vue";
import { speakText } from "./utils.js";

export default {
  props: ["questionData", "isChecked"],
  emits: ["update-answer"],
  setup(props, { emit }) {
    const history = ref([]);
    const isRecording = ref(false);

    // 問題が切り替わったら履歴をリセット
    watch(() => props.questionData, () => {
      history.value = [];
      emit("update-answer", "");
    });

    const startRecording = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("お使いのブラウザは音声認識に対応していません。Chromeをご利用ください。");
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isRecording.value = true;
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // pinyin-pro でピンインを取得
        let py = "";
        if (window.pinyinPro) {
          py = window.pinyinPro.pinyin(transcript);
        }

        // 履歴に追加
        history.value.push({ text: transcript, pinyin: py });
        
        // 最後の入力を親コンポーネントに渡す
        emit("update-answer", transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        isRecording.value = false;
        alert("音声認識エラーが発生しました: " + event.error);
      };

      recognition.onend = () => {
        isRecording.value = false;
      };

      recognition.start();
    };

    return { history, isRecording, startRecording, speakText };
  },
  template: `
    <div class="dataContent">
      <p class="pinyin">{{ questionData[3] }}</p>
      <p class="hanyu">{{ questionData[2].split('/')[0] }}</p>
      <p class="japanese">{{ questionData[4] }}</p>
      
      <div style="margin: 20px 0; display: flex; gap: 10px; justify-content: center;">
        <button @click="speakText(questionData[2])" style="background-color: #06b6d4;">Speak</button>
        <button @click="startRecording" :class="{ recording: isRecording }" :disabled="isChecked">
          {{ isRecording ? '録音中...' : '音声入力' }}
        </button>
      </div>

      <!-- 音声入力の履歴表示 -->
      <div v-if="history.length > 0" style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 12px;">
        <h4 style="margin-top: 0; color: #4b5563; font-size: 0.9rem;">入力履歴</h4>
        <div v-for="(item, index) in history" :key="index" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
          <div style="color: #9ca3af; font-size: 0.8rem;">{{ index + 1 }}回目</div>
          <div style="font-size: 1.2rem; font-weight: bold; color: #1f2937;">{{ item.text }}</div>
          <div style="color: #6366f1; font-style: italic;">{{ item.pinyin }}</div>
        </div>
      </div>
    </div>`,
};