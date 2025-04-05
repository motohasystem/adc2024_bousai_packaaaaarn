import { CONSTANTS as C } from "./constants";
import { Impact, RecordData, SValue } from "./RecordData";
import { ScoreCalculator } from "./ScoreCalculator";
import { GetParamsManager } from "./GetParamsManager";

export type CategoryScore = {
    sum: number;
    count: number;
    max_question: number;
    min_question: number;
};


class RecordHtmlRenderer {
    private recordData: RecordData;
    private debugMode: boolean;
    private paramsManager: GetParamsManager;

    constructor(recordData: RecordData, debugMode: boolean = false) {
        this.recordData = recordData;
        this.debugMode = debugMode;
        this.paramsManager = new GetParamsManager();
    }

    static createButton(label: string): HTMLButtonElement {
        const button = document.createElement("button");
        button.textContent = label;
        button.className = "btn";

        return button;

    }

    // カテゴリごとにCSSクラス名を取得するメソッド
    private getCategoryClass(category: string): string {
        const categoryClasses: { [key: string]: string } = {
            "家族": "category-1",
            "コミュニティ": "category-2",
            "家屋": "category-3",
            "情報": "category-4",
            "お金": "category-5",
        };
        return categoryClasses[category] || "category-default";
    }

    // 影響係数の式を文字列として構築する
    composeImpactRatioString(riskPoint: string, impactTable: Impact[][]): string {
        // console.log({ impactTable });
        const rp = parseInt(riskPoint) || null

        const impactRatio = impactTable.reduce((conds: string[], row) => {
            if (rp == null) {
                return conds;
            }

            const rowString = row.map((impact) => {
                if (impact.expect == null) {
                    return ""
                }

                // 係数を算出する
                const efficient = ((rp: number, cond: string, exp: number) => {
                    let isMet = false;
                    switch (cond) {
                        case ">":
                            isMet = rp > exp ? true : false;
                            break;
                        case "<":
                            isMet = rp < exp ? true : false;
                            break;
                        case "≧":
                            isMet = rp >= exp ? true : false;
                            break;
                        case "≦":
                            isMet = rp <= exp ? true : false;
                            break;
                        case "=":
                            isMet = rp == exp ? true : false;
                            break;
                    }

                    return isMet ? impact.coefficient : null;

                })(rp, impact.condition, impact.expect)

                if (efficient == null) {
                    return "";
                }

                return `${impact.target}*${impact.coefficient.toFixed(2)}`; // 係数は小数点以下2桁で表現する
            }).filter(formula => formula != "").join(", ");
            if (rowString != "") {
                conds.push(`${rowString}`);
            }
            return conds;
        }, []).join(" / ");
        // console.log({ impactRatio })
        return impactRatio
    }

    // カテゴリ別の質問一覧をDOMとして出力
    renderCategoryQuestions(parentElement: HTMLElement): void {
        const categories = this.recordData.getCategories();
        const header = document.createElement("h2")
        header.textContent = C.ProjectName
        parentElement.appendChild(header);

        const title = document.createElement("h1");
        title.textContent = C.ProductName + C.Subtitle;
        parentElement.appendChild(title);

        categories.forEach((category) => {
            const categoryClass = this.getCategoryClass(category);
            const categoryHeader = document.createElement("h2");
            categoryHeader.className = categoryClass;
            categoryHeader.textContent = `カテゴリ: ${category}`;
            parentElement.appendChild(categoryHeader);

            const items = this.recordData.getItemsByCategory(category);

            items.forEach((item, index) => {
                const questionDiv = document.createElement("div");
                questionDiv.className = categoryClass;
                questionDiv.classList.add("question-div");
                questionDiv.id = `index_${index}`;

                const questionText = document.createElement("p");

                questionText.textContent = `質問 ${index + 1}: ${item.質問文.S}`;
                if (this.debugMode) {
                    questionText.textContent += `(表示順序: ${item.カテゴリ内の表示順序.S})`;
                }
                questionDiv.appendChild(questionText);

                const form = document.createElement("form");
                const record_number = item.レコード番号.S;
                form.setAttribute("data-question-form", record_number);
                questionDiv.appendChild(form);

                // 選択肢をラジオボタンとして追加
                item.選択肢テーブル.L.forEach((choice, optionNumber) => {
                    // const choiceId = (choice.M.id as SValue).S;
                    let choiceText = (choice.M.value.M.回答項目.M.value as SValue).S;
                    const choiceValue = (choice.M.value.M.リスクポイント.M.value as SValue).S;

                    const label = document.createElement("label");
                    const input = document.createElement("input");
                    input.type = "radio";
                    input.name = `question_${record_number}`;
                    input.value = choiceValue
                    input.setAttribute('category', category);

                    if (this.paramsManager.isSelected(record_number, optionNumber.toString())) {
                        input.checked = true;
                    }

                    // クリックイベントでGETパラメータを設定
                    input.addEventListener("click", () => {
                        this.paramsManager.setParam(record_number, optionNumber.toString());
                    });

                    const impactTable = this.recordData.getImpactTable(record_number);
                    const impactRatio = this.composeImpactRatioString(choiceValue, impactTable); // 他の回答に与える係数
                    input.setAttribute("data-effect-ratio", impactRatio);

                    label.appendChild(input);
                    if (this.debugMode) {
                        choiceText += ` (Num: ${record_number} / RP: ${choiceValue} / Effect: ${impactRatio ? impactRatio : "none"})`;
                    }
                    label.appendChild(document.createTextNode(choiceText));
                    form.appendChild(label);

                    // イベントリスナーで選択時のアニメーションと表示更新
                    input.addEventListener("change", () => {
                        if (input.checked) {
                            questionText.textContent = `✅ 質問 ${index + 1}: ${item.質問文.S} - 選択: ${choiceText}`;

                            // 選択肢とフォームを非表示
                            form.classList.add("hidden");

                            // 質問ブロック全体をアニメーションして縮小
                            questionDiv.classList.add("question-div-transition", "question-div-selected");

                            // 次の質問までスクロールする
                            const nextQuestionDiv = parentElement.querySelector(`div[id="index_${index + 1}"]`);
                            if (nextQuestionDiv) {
                                nextQuestionDiv.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                            // 選択肢を非表示にする
                        }
                    });
                });

                // ホバー時のスタイル追加
                questionDiv.addEventListener("mouseenter", () => {
                    questionDiv.classList.add("question-div-hover");
                });

                // マウスアウト時のスタイル追加
                questionDiv.addEventListener("mouseleave", () => {
                    questionDiv.classList.remove("question-div-hover");
                    if (questionDiv.querySelector('input[type=radio]:checked') != null) {
                        questionDiv.classList.add("question-div-selected");
                    } else {
                        questionDiv.classList.add("question-div-unhover");
                    }
                });

                // クリックで再選択可能にする
                questionDiv.addEventListener("click", () => {
                    const hasCheckedInput = questionDiv.querySelector('input[type=radio]:checked');

                    if (hasCheckedInput != null) {
                        form.classList.remove("hidden");
                        questionText.textContent = `質問 ${index + 1}: ${item.質問文.S}`;
                        // questionDiv.style.transform = "scale(1)";
                        // questionDiv.style.opacity = "1";
                    }
                });

                parentElement.appendChild(questionDiv);
            });
        });

        // 採点ボタン
        const button = RecordHtmlRenderer.createButton("採点する");
        button.classList.add("fixed-button");

        parentElement.appendChild(button);

        // 採点ロジック
        button.addEventListener("click", () => this.calculateScore(parentElement));
    }

    // 採点ボタンがクリックされたときの処理
    private calculateScore(parentElement: HTMLElement): void {
        console.log("採点ボタンがクリックされました");
        let allQuestionsAnswered = true;
        const forms = parentElement.querySelectorAll('form[data-question-form]');
        let totalScore = 0;

        // let categoryScores: { [key: string]: CategoryScore } = {};    // カテゴリ別のスコア
        // スコアの合計を表示
        const calculator = new ScoreCalculator('messages.json');


        const effectRatios: string[] = [];
        const answers: {
            [key: string]: {
                value: number,
                effectRatio: string[],
                category: string
            }
        } = {}
        forms.forEach((form) => {
            const checkedInput = form.querySelector('input[type=radio]:checked');
            if (!checkedInput) {
                allQuestionsAnswered = false;
            } else {
                const record_number = (checkedInput as HTMLInputElement).name.split("_")[1];
                console.log(`設問レコード番号: ${record_number}`);
                // スコアの計算を行う
                const value = parseInt((checkedInput as HTMLInputElement).value) || 0;
                answers[record_number] = {
                    value: value,
                    effectRatio: [],
                    category: checkedInput.getAttribute('category') || ""
                }

                // 影響係数を取得
                const effectRatio = (checkedInput as HTMLInputElement).getAttribute("data-effect-ratio");
                if (effectRatio) {
                    console.log(`選択肢の影響係数: ${effectRatio}`);
                    effectRatios.push(effectRatio);
                }
            }
        });

        // 影響係数を割り当てる
        effectRatios.forEach((ratio) => {
            const ratioItems = ratio.split(", ");
            ratioItems.forEach((item) => {
                const [target, coefficient] = item.split("*");
                if (answers[target]) {
                    answers[target].effectRatio.push(coefficient)
                }
                else {
                    console.warn(`対象が見つかりません: ${target}`);
                }
            });
        });

        // 割り当てられた影響係数を計算する
        for (const [_key, value] of Object.entries(answers)) {
            let score = value.value;
            value.effectRatio.forEach((ratio) => {
                score = score * parseFloat(ratio);
            });
            totalScore += score;

            // カテゴリ別の集計
            const category = value.category;
            const questionNumber = parseInt(_key);
            calculator.addEntry(category, score, questionNumber);
        }

        if ((!allQuestionsAnswered && this.debugMode != true)) {
            alert("全ての質問に回答してください。");
        } else {
            const maxCategory = calculator.getMaxScoreCategory();
            const maxScore = calculator.getCategoryTotalScore(maxCategory);
            const minCategory = calculator.getMinScoreCategory();
            const minScore = calculator.getCategoryTotalScore(minCategory);

            console.log(`最大合計カテゴリ: ${maxCategory} - 合計: ${maxScore}`);
            console.log(`最小合計カテゴリ: ${minCategory} - 合計: ${minScore}`);

            // スコアが最大となるカテゴリと最小となるカテゴリのメッセージを取得し、両方のメッセージが出揃った段階でダイアログを表示する
            Promise.all([
                calculator.getHighRiskMessage(maxCategory, true),
                calculator.getLowRiskMessage(minCategory, true)
            ]).then(([highRiskMessage, lowRiskMessage]) => {
                console.log(`High riskメッセージ: ${highRiskMessage}`);
                console.log(`Low riskメッセージ: ${lowRiskMessage}`);
                // alert(`High riskメッセージ: ${highRiskMessage}\nLow riskメッセージ: ${lowRiskMessage}`);

                // high risk / low riskメッセージを、いい感じのダイアログで表示する
                const dialog = document.createElement('dialog');
                dialog.className = 'result-dialog';

                // トータルスコア
                const scoreParagraph = document.createElement('p');
                const headline = document.createElement('h2');
                headline.textContent = 'あなたの生活困窮リスクポイント';
                headline.className = 'dialog-headline';
                dialog.appendChild(headline);

                scoreParagraph.innerHTML = `${totalScore} RP`;
                scoreParagraph.className = 'dialog-score';
                dialog.appendChild(scoreParagraph);

                // 閉じるボタン
                const closeButton = RecordHtmlRenderer.createButton('閉じる');
                closeButton.className = 'dialog-close-button';
                closeButton.onclick = () => dialog.close();
                dialog.appendChild(closeButton);

                // 表示する画像を取得する
                const highRiskImage = calculator.getCategoryImageName(maxCategory);
                const lowRiskImage = calculator.getCategoryImageName(minCategory);

                const highRiskResult = this.createImageWithCaption(highRiskImage, highRiskMessage, "高リスク", "#990000");
                const lowRiskResult = this.createImageWithCaption(lowRiskImage, lowRiskMessage, "低リスク", "#009900");

                dialog.appendChild(scoreParagraph);
                dialog.appendChild(highRiskResult);

                dialog.appendChild(lowRiskResult);

                // 現在のURLから、#を除いたURLを取得する
                const currentUrl = window.location.href.split("#")[0];

                // ダイアログの下部に現在のURLをQRコードとして表示する
                const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;
                const qrCodeImage = document.createElement('img');
                qrCodeImage.src = qrCodeUrl;
                qrCodeImage.alt = 'QRコード';
                qrCodeImage.className = 'qr-code-image'; // クラス名を追加
                dialog.appendChild(qrCodeImage);

                // URLをクリップボードにコピーするボタンを配置する
                const copyButton = RecordHtmlRenderer.createButton('URLをコピーする');
                copyButton.className = 'copy-url-button'; // クラス名を追加
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(currentUrl).then(() => {
                        alert('URLがクリップボードにコピーされました。');
                    }).catch(err => {
                        console.error('URLのコピーに失敗しました: ', err);
                    });
                };
                dialog.appendChild(copyButton);

                // ダイアログの下部に閉じるボタンを追加
                dialog.appendChild(closeButton);

                document.body.appendChild(dialog);
                dialog.showModal();

                dialog.scrollTop = 0;
            });

            // alert(`リスクポイントの合計: ${totalScore}`);
        }
    };

    // img要素とp要素を受け取り、画像の上にP要素を重ねた要素を作成して返す
    private createImageWithCaption(imageFilename: string, caption: string, label: string, color: string): HTMLDivElement {
        // url形式にする
        const imageUrl = `./img/${imageFilename}`;

        const lowRiskParagraph = document.createElement('p');
        lowRiskParagraph.innerHTML = `<h3>${label}:</h3>${caption}`;
        lowRiskParagraph.className = 'caption-text'; // クラス名を追加
        lowRiskParagraph.style.color = color; // 色は動的に設定

        const container = document.createElement("div");
        container.className = 'image-caption-container'; // クラス名を追加

        const image = document.createElement("img");
        image.src = imageUrl;
        image.className = 'caption-image'; // クラス名を追加

        container.appendChild(image);
        container.appendChild(lowRiskParagraph);

        return container;
    }
}

export { RecordHtmlRenderer };
