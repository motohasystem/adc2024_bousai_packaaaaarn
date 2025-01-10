import { ResultMessageRetriever } from "./ResultMessageRetriever";

export class ScoreCalculator {
    private jsonUrl: string;
    private categories: Record<string, CategoryData>;

    constructor(jsonUrl: string) {
        this.jsonUrl = jsonUrl;
        this.categories = {}; // カテゴリごとのデータを保存するオブジェクト
    }

    // カテゴリ名、スコア、質問番号のセットを追加する
    addEntry(category: string, score: number, questionNumber: number): void {
        if (!this.categories[category]) {
            this.categories[category] = {
                totalScore: 0,
                entries: []
            };
        }

        this.categories[category].totalScore += score;
        this.categories[category].entries.push({
            score,
            questionNumber
        });
    }

    // カテゴリ別スコアが最大となるカテゴリを取得する
    getMaxScoreCategory(): string {
        if (Object.keys(this.categories).length === 0) {
            throw new Error('No categories found');
        }

        let maxCategory = Object.entries(this.categories).reduce((max, [category, data]) => {
            return data.totalScore > max.totalScore ? { category, totalScore: data.totalScore } : max;
        }, { category: '', totalScore: -Infinity });

        return maxCategory.category;
    }

    // カテゴリ別スコアが最小となるカテゴリを取得する
    getMinScoreCategory(): string {
        if (Object.keys(this.categories).length === 0) {
            throw new Error('No categories found');
        }

        let minCategory = Object.entries(this.categories).reduce((min, [category, data]) => {
            return data.totalScore < min.totalScore ? { category, totalScore: data.totalScore } : min;
        }, { category: '', totalScore: Infinity });

        return minCategory.category;
    }

    // カテゴリ別のスコアの合計を取得
    getCategoryTotalScore(category: string): number | null {
        if (!this.categories[category]) {
            return null; // カテゴリが存在しない場合
        }
        return this.categories[category].totalScore;
    }

    // カテゴリ別の最大スコアを持つ質問番号を取得
    getCategoryMaxScoreQuestion(category: string): number | null {
        if (!this.categories[category] || this.categories[category].entries.length === 0) {
            return null;
        }

        let maxEntry = this.categories[category].entries.reduce((max, entry) => {
            return entry.score > max.score ? entry : max;
        });

        return maxEntry.questionNumber;
    }

    // カテゴリ別の最小スコアを持つ質問番号を取得
    getCategoryMinScoreQuestion(category: string): number | null {
        if (!this.categories[category] || this.categories[category].entries.length === 0) {
            return null;
        }

        let minEntry = this.categories[category].entries.reduce((min, entry) => {
            return entry.score < min.score ? entry : min;
        });

        return minEntry.questionNumber;
    }



    // ResultMessageRetrieverを使用して、カテゴリ別の最大スコアを持つ質問のメッセージを取得
    // withBrTagがtrueの場合、改行を改行タグ<BR/>に変換する
    private async getRiskMessage(category: string, isHighRisk: boolean, withBrTag = false): Promise<string> {
        const questionNumber = isHighRisk ? this.getCategoryMaxScoreQuestion(category) : this.getCategoryMinScoreQuestion(category);
        if (!questionNumber) {
            return '質問が見つかりませんでした';
        }

        const retriever = new ResultMessageRetriever(this.jsonUrl, category, questionNumber.toString());
        return await retriever.build().then((msg_highlow) => {
            return isHighRisk ? msg_highlow['high_risk'] : msg_highlow['low_risk'];
        }).then((message) => {
            return withBrTag ? message.replace(/\n/g, '<br>') : message;
        });
    }

    async getHighRiskMessage(category: string, withBrTag = false): Promise<string> {
        return this.getRiskMessage(category, true, withBrTag);
    }

    async getLowRiskMessage(category: string, withBrTag = false): Promise<string> {
        return this.getRiskMessage(category, false, withBrTag);
    }

}

// 型定義
interface Entry {
    score: number;
    questionNumber: number;
}

interface CategoryData {
    totalScore: number;
    entries: Entry[];
}
