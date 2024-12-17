import { RecordData, SValue } from "./RecordData";

class RecordHtmlRenderer {
    private recordData: RecordData;

    constructor(recordData: RecordData) {
        this.recordData = recordData;
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
        title.textContent = "防災ぱっかーんスコアリング";
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

                const questionText = document.createElement("p");
                questionText.textContent = `質問 ${index + 1}: ${item.質問文.S}`;
                questionDiv.appendChild(questionText);

                const form = document.createElement("form");
                questionDiv.appendChild(form);

                item.選択肢テーブル.L.forEach((choice) => {
                    // const choiceId = (choice.M.id as SValue).S;
                    const choiceText = (choice.M.value.M.回答項目.M.value as SValue).S;
                    const choiseRP = (choice.M.value.M.リスクポイント.M.value as SValue).S;

                    const label = document.createElement("label");
                    const input = document.createElement("input");
                    input.type = "radio";
                    input.name = `question_${item.レコード番号.S}`;
                    input.value = choiseRP;

                    label.appendChild(input);
                    label.appendChild(document.createTextNode(choiceText));
                    form.appendChild(label);
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

        // parentElement にボタンを追加する前に確認
        console.log("Button textContent:", button.textContent);

        // 余計な要素を追加しないことを確認
        if (button.textContent) {
            parentElement.appendChild(button);
        } else {
            console.error("Button textContent is undefined");
        }

        // 採点ロジック
        const calculateScore = () => {
            console.log("採点ボタンがクリックされました");
            const inputs = parentElement.querySelectorAll('input[type=radio]:checked');
            let totalScore = 0;
            inputs.forEach((input) => {
                const value = parseInt((input as HTMLInputElement).value) || 0;
                totalScore += value;
            });
            alert(`リスクポイントの合計: ${totalScore}`);
        };

        button.addEventListener("click", calculateScore);
    }
}

export { RecordHtmlRenderer };