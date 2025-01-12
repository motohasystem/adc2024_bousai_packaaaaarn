import './styles.css'
import { RecordData } from './RecordData.ts';
import { RecordHtmlRenderer } from './RecordHtmlRenderer.ts';

// デバッグモード用のjsonファイル
import apiSample from './resource/api_sample.json';


// 定数定義
let DEBUGMODE = false;  // デバッグモード
let MOCKMODE = false;   // APIを呼び出さないモックモード

const API_URL = 'https://f56gy9u3sa.execute-api.ap-northeast-1.amazonaws.com/dev/items'
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Start of Selection

function rendering(records: RecordData) {
  try {
    // HTMLの親要素を取得
    const parentElement = document.getElementById("app");
    if (!parentElement) {
      throw new Error('Parent element not found');
    }

    // @ts-ignore
    const renderer = new RecordHtmlRenderer(records, DEBUGMODE);
    renderer.renderCategoryQuestions(parentElement);
    // document.querySelector<HTMLDivElement>('#app')!.innerHTML += htmlContent;
  } catch (error) {
    console.error('Error rendering HTML:', error);
  }
}

// 
function opening(debugMode: boolean = false) {
  if (debugMode) {
    console.log('Opening dialog');
    return;
  }
  // 画像を1枚と、このアンケートは個人情報を収集しませんという文言を表示したオープニングダイアログを構築する
  const dialog = document.createElement('dialog');
  dialog.id = 'opening-dialog';
  dialog.classList.add('opening-dialog');
  dialog.style.width = '80%';
  dialog.innerHTML = `
    <img src="./img/title.webp" alt="Kitten" width="100%"/>
    <h2>防災ぱっかーんについて</h2>
    <p>表示された質問にお答えいただき、最後に結果をご確認ください。このアンケートは個人情報を収集することを目的としません。入力内容は保存されず、ブラウザを閉じると消去されます。</p>
    <p>それでは、始めましょう！</p>
  `;
  const button = RecordHtmlRenderer.createButton('閉じる');
  button.classList.add('close-dialog');
  button.style.display = 'block';
  button.style.margin = '0 auto';
  button.addEventListener('click', () => {
    dialog.close();
  });

  dialog.appendChild(button);
  document.body.appendChild(dialog);

  dialog.showModal();
}


// GETパラメータにDEBUG=trueがあるときはデバッグモード
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('DEBUG')) {
  DEBUGMODE = true;
}
if (urlParams.has('MOCK')) {
  MOCKMODE = true;
}



// let recordData: RecordData;
if (MOCKMODE) {
  try {
    // @ts-ignore
    const recordData = new RecordData(apiSample);
    // RecordDataを使用して何かを行う
    console.log(recordData);
    rendering(recordData);
  } catch (error) {
    console.error('Error loading JSON:', error);
  }

}
else {
  console.log('MOCKMODE: OFF');
  // API_URLにGETリクエストを送信
  console.log(API_KEY)
  fetch(API_URL, {
    method: 'GET',
    mode: 'cors', // CORS対応
    headers: {
      'x-api-key': API_KEY
    }
  })
    .then(response => response.json())
    .then(data => {
      // レスポンスデータをRecordDataクラスに変換
      const recordData = new RecordData(data);
      // RecordDataを使用して何かを行う
      console.log(recordData);
      rendering(recordData);

      // オープニングダイアログを表示
      opening(DEBUGMODE);
    })
    .catch(error => {
      console.error('Error loading JSON:', error);
    });
}
