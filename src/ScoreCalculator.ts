import { ResultMessageRetriever } from "./ResultMessageRetriever";

export class CategoriesImageStore {
    static readonly categoryAverage: { [key: string]: number } = {
        "家屋": 29.15,
        "情報": 13.25,
        "コミュニティ": 15.90,
        "お金": 7.95,
        "家族": 21.20,
        "その他": 5.30
    }
    static readonly images: { [key: string]: { high: string; low: string } } = {
        '家屋': {
            high: 'residence_high.webp',
            low: 'residence_low.webp'
        },
        '情報': {
            high: 'information_high.webp',
            low: 'information_low.webp'
        },
        'コミュニティ': {
            high: 'community_high.webp',
            low: 'community_low.webp'
        },
        'お金': {
            high: 'money_high.webp',
            low: 'money_low.webp'
        },
        '家族': {
            high: 'family_high.webp',
            low: 'family_low.webp'
        },
        'その他': {
            high: 'etc_high.webp',
            low: 'etc_low.webp'
        }
    }

    // カテゴリ名とスコアを受け取り、そのスコアが平均値以上かどうかを判定してファイル名を返す
    static getImageName(category: string, score: number): string {
        const threshold = CategoriesImageStore.categoryAverage[category];
        return score >= threshold ? CategoriesImageStore.images[category].high : CategoriesImageStore.images[category].low;
    }
}

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

    // カテゴリ別のスコアの平均値を取得
    getCategoryAverageScore(category: string): number | null {
        if (!this.categories[category] || this.categories[category].entries.length === 0) {
            return null;
        }
        return this.categories[category].totalScore / this.categories[category].entries.length;
    }

    // 指定したカテゴリのスコアの平均値が、指定した値以上かどうかを判定
    isCategoryAverageScoreAbove(category: string, threshold: number): boolean {
        const average = this.getCategoryAverageScore(category);
        if (average === null) {
            return false;
        }
        return average >= threshold;
    }

    // カテゴリ名を指定して、スコア平均値を取得し、平均値をつかってファイル名を取得します。
    getCategoryImageName(category: string): string {
        const average = this.getCategoryAverageScore(category);
        if (average === null) {
            return '';
        }

        const score = this.getCategoryTotalScore(category);
        if (score === null) {
            return '';
        }
        return CategoriesImageStore.getImageName(category, score);
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
