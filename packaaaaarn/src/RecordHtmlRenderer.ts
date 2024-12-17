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

    // カテゴリ別の質問一覧を HTML として出力
    renderCategoryQuestions(): string {
        const categories = this.recordData.getCategories();
        let html = `
        <h1>防災ぱっかーんアンケート</h1>
      <link rel="stylesheet" href="./styles.css">
      <div>`;

        categories.forEach((category) => {
            const categoryClass = this.getCategoryClass(category);
            const items = this.recordData.getItemsByCategory(category);

            html += `<h2 class="${categoryClass}">カテゴリ: ${category}</h2>`;
            items.forEach((item, index) => {
                html += `<div class="${categoryClass}">
          <p>質問 ${index + 1}: ${item.質問文.S}</p>
          <form>`;

                item.選択肢テーブル.L.forEach((choice) => {
                    const choiceId = (choice.M.id as SValue).S;
                    const choiceText = (choice.M.value.M.回答項目.M.value as SValue).S;
                    html += `
            <label>
              <input type="radio" name="question_${item.レコード番号.S}" value="${choiceId}">
              ${choiceText}
            </label>`;
                });

                html += `</form></div>`;
            });
        });

        html += `</div>`;
        return html;
    }
}

export { RecordHtmlRenderer };
