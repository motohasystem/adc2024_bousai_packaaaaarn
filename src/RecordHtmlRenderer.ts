import { RecordData, SValue } from "./RecordData";

class RecordHtmlRenderer {
    private recordData: RecordData;
    private debugMode: boolean;

    constructor(recordData: RecordData, debugMode: boolean = false) {
        this.recordData = recordData;
        this.debugMode = debugMode;
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

    // カテゴリ別の質問一覧をDOMとして出力
    renderCategoryQuestions(parentElement: HTMLElement): void {
        const categories = this.recordData.getCategories();

        const title = document.createElement("h1");
        title.textContent = "防災ぱっかーんアンケート";
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
                questionDiv.style.transition = "all 0.5s ease";

                const questionText = document.createElement("p");
                questionText.textContent = `質問 ${index + 1}: ${item.質問文.S}`;
                questionDiv.appendChild(questionText);

                const form = document.createElement("form");
                form.setAttribute("data-question-form", item.レコード番号.S);
                questionDiv.appendChild(form);

                item.選択肢テーブル.L.forEach((choice) => {
                    // const choiceId = (choice.M.id as SValue).S;
                    const choiceText = (choice.M.value.M.回答項目.M.value as SValue).S;
                    const choiceValue = (choice.M.value.M.リスクポイント.M.value as SValue).S;

                    const label = document.createElement("label");
                    const input = document.createElement("input");
                    input.type = "radio";
                    input.name = `question_${item.レコード番号.S}`;
                    input.value = choiceValue;

                    label.appendChild(input);
                    label.appendChild(document.createTextNode(choiceText));
                    form.appendChild(label);

                    // イベントリスナーで選択時のアニメーションと表示更新
                    input.addEventListener("change", () => {
                        if (input.checked) {
                            questionText.textContent = `✅ 質問 ${index + 1}: ${item.質問文.S} - 選択: ${choiceText}`;

                            // 選択肢とフォームを非表示
                            form.style.display = "none";

                            // 質問ブロック全体をアニメーションして縮小
                            questionDiv.style.transition = "transform 1s ease-in-out, opacity 1s ease-in-out, background-color 1s ease-in-out";

                            questionDiv.style.transform = "scale(1) translateY(-5px)";
                            questionDiv.style.opacity = "0.7";
                            questionDiv.style.backgroundColor = "#f0f0f0"; // 背景色を変更
                        }
                    });
                });

                // ホバー時のスタイル追加
                questionDiv.addEventListener("mouseenter", () => {
                    questionDiv.style.transform = "scale(1) translateY(-5px)";
                    questionDiv.style.opacity = "1";
                    questionDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
                });

                questionDiv.addEventListener("mouseleave", () => {
                    const hasCheckedInput = questionDiv.querySelector('input[type=radio]:checked');
                    if (hasCheckedInput != null) {
                        questionDiv.style.transform = "scale(1) translateY(-5px)";
                        questionDiv.style.opacity = "0.7";
                        questionDiv.style.boxShadow = "none";
                    }
                    else {
                        questionDiv.style.transform = "scale(1) translateY(5px)";
                    }
                });

                // クリックで再選択可能にする
                questionDiv.addEventListener("click", () => {
                    const hasCheckedInput = questionDiv.querySelector('input[type=radio]:checked');

                    if (hasCheckedInput != null) {
                        form.style.display = "block";
                        questionText.textContent = `質問 ${index + 1}: ${item.質問文.S}`;
                        // questionDiv.style.transform = "scale(1)";
                        // questionDiv.style.opacity = "1";
                    }
                });

                parentElement.appendChild(questionDiv);
            });
        });

        // 採点ボタン
        const button = document.createElement("button");
        button.id = "calculateScore";
        button.textContent = "採点する";
        button.style.position = "fixed";
        button.style.bottom = "20px";
        button.style.right = "20px";
        button.style.padding = "10px 20px";
        button.style.backgroundColor = "#007BFF";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.cursor = "pointer";
        parentElement.appendChild(button);

        // 採点ロジック
        const calculateScore = () => {
            console.log("採点ボタンがクリックされました");
            let allQuestionsAnswered = true;
            const forms = parentElement.querySelectorAll('form[data-question-form]');
            let totalScore = 0;

            forms.forEach((form) => {
                const checkedInput = form.querySelector('input[type=radio]:checked');
                if (!checkedInput) {
                    allQuestionsAnswered = false;
                } else {
                    const value = parseInt((checkedInput as HTMLInputElement).value) || 0;
                    totalScore += value;
                }
            });

            if (!allQuestionsAnswered && this.debugMode != true) {
                alert("全ての質問に回答してください。");
            } else {
                alert(`リスクポイントの合計: ${totalScore}`);
            }
        };

        button.addEventListener("click", calculateScore);
    }
}

export { RecordHtmlRenderer };
