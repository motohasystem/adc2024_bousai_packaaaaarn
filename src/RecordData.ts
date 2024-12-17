// 文字列型のデータ
export type SValue = { S: string };

// 数値型のデータ
export type NValue = { N: string };

// NULL値
type NullValue = { NULL: boolean };

// Map型のデータ
type MValue<T> = { M: T };

// List型のデータ
type LValue<T> = { L: T[] };

// 汎用的な型
type FieldType =
    | SValue
    | NValue
    | NullValue
    | MValue<any>
    | LValue<any>;

// 基本フィールド型
interface RecordField {
    type: SValue;
    value: SValue | NValue;
}

// 作成者・更新者フィールド
interface CreatorUpdater {
    name: SValue;
    code: SValue;
}

// 選択肢テーブル・影響する設問テーブルの項目
interface TableItem {
    id: SValue;
    value: MValue<{
        [key: string]: MValue<RecordField>;
    }>;
}

// レコードの型
interface RecordItem {
    [key: string]: FieldType; // インデックスシグネチャを追加
    作成者: MValue<CreatorUpdater>;
    更新日時: SValue;
    備考: SValue;
    カテゴリ: SValue;
    更新者: MValue<CreatorUpdater>;
    作成日時: SValue;
    レコード番号: SValue;
    選択肢テーブル: LValue<MValue<TableItem>>;
    影響する設問テーブル: LValue<MValue<TableItem>>;
    Systemid: NValue;
    __appid__: NValue;
    質問文: SValue;
    課題: SValue;
    Systemrevision: SValue;
    "requestContext.stage": SValue;
}

// ルートオブジェクト
interface RootObject {
    Count: number;
    Items: RecordItem[];
}

export class RecordData {
    public count: number;
    public items: RecordItem[];

    constructor(data: RootObject) {
        this.count = data.Count;
        this.items = data.Items;
    }

    // 作成者情報を取得するメソッド
    getCreators(): CreatorUpdater[] {
        return this.items.map((item) => item.作成者.M);
    }

    // 質問文一覧を取得するメソッド
    getQuestions(): string[] {
        return this.items.map((item) => item.質問文.S);
    }

    // リスクポイントの合計を計算するメソッド
    calculateRiskPoints(): number {
        return this.items.reduce((total, item) => {
            const riskPoints = item.選択肢テーブル.L.map((choice) => {
                const riskValue = (choice.M.value.M.リスクポイント.M.value as SValue).S;
                return parseInt(riskValue, 10) || 0;
            });
            return total + riskPoints.reduce((sum, value) => sum + value, 0);
        }, 0);
    }

    // 選択肢テーブルを扱いやすい形で取得するメソッド
    getChoiceTable(): { id: string; answer: string; riskPoint: number }[][] {
        return this.items.map((item) => {
            return item.選択肢テーブル.L.map((choice) => ({
                id: choice.M.id.S,
                answer: (choice.M.value.M.回答項目.M.value as SValue).S,
                riskPoint: parseInt((choice.M.value.M.リスクポイント.M.value as SValue).S, 10) || 0,
            }));
        });
    }

    // 影響する設問テーブルを扱いやすい形で取得するメソッド
    getImpactTable(): { id: string; description: string; coefficient: number }[][] {
        return this.items.map((item) => {
            return item.影響する設問テーブル.L.map((impact) => ({
                id: impact.M.id.S,
                description: (impact.M.value.M.説明.M.value as SValue).S,
                coefficient: parseFloat((impact.M.value.M.係数.M.value as SValue).S) || 0,
            }));
        });
    }

    // 任意のキー名で値を直接取得するメソッド
    getValue(keyName: string): any[] {
        return this.items.map((item) => {
            const field = item[keyName];
            if ('S' in field) {
                return field.S;
            } else if ('N' in field) {
                return field.N;
            }
            return field || null;
        });
    }

    // カテゴリの一覧を取得するメソッド
    getCategories(): string[] {
        return Array.from(new Set(this.items.map((item) => item.カテゴリ?.S || "")));
    }

    // カテゴリを指定してitemsを取得するメソッド
    getItemsByCategory(category: string): RecordItem[] {
        return this.items.filter((item) => item.カテゴリ?.S === category);
    }
}
