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

// 影響する設問テーブル
export interface Impact {
    id: string;
    description: string;
    coefficient: number;
    condition: string;
    expect: number | null;
    target: string;

};

// レコードの型
interface RecordItem {
    [key: string]: FieldType; // インデックスシグネチャを追加
    作成者: MValue<CreatorUpdater>;
    更新日時: SValue;
    備考: SValue;
    カテゴリ: SValue;
    カテゴリ内の表示順序: SValue;
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
    アンケート表示: SValue;
}

// ルートオブジェクト
interface RootObject {
    Count: number;
    Items: RecordItem[];
}

export class RecordData {
    public count: number;
    public items: RecordItem[];
    public VisibleFlagFieldCode: string = 'アンケート表示';

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
    // record_number: string | undefined = undefined のときは全ての影響テーブルを取得
    getImpactTable(record_number: string | undefined = undefined): Impact[][] {


        return this.items.reduce((table: Impact[][], item) => {
            // console.log({ item: item.レコード番号.S, record_number });
            if (record_number !== undefined && item.レコード番号.S !== record_number) {
                // console.log('一致してない')
                return table;
            }
            // console.log('一致してる')

            const subtable = item.影響する設問テーブル.L.reduce((acc: Impact[], impact) => {
                // 設問のレコード番号
                // const target = impact.M.value.M.設問のレコード番号.M.value as SValue;
                // if (record_number === undefined) {
                //     acc.push(this.composeImpact(impact));
                // }
                // else if (target.S == record_number) {
                //     console.log({ record_number, tareget: target.S });
                // }
                acc.push(this.composeImpact(impact));
                return acc;
            }, []);

            if (subtable.length > 0) {
                table.push(subtable);
            }

            return table;
        }, [])
    }

    // 影響する設問テーブルの項目を扱いやすい形に変換するメソッド
    composeImpact(impact: MValue<TableItem>): Impact {

        // console.log({ impact });
        const cond = impact.M.value.M.条件.M.value as SValue;   // 条件式
        const target_question = impact.M.value.M.設問のレコード番号.M.value as SValue; // 対象設問番号
        const expect = impact.M.value.M.条件の値.M.value as SValue; // 評価値

        return {
            id: impact.M.id.S,
            target: target_question.S,
            description: (impact.M.value.M.説明.M.value as SValue).S,
            coefficient: parseFloat((impact.M.value.M.係数.M.value as SValue).S) || 0,
            condition: cond.S ? cond.S : "",
            expect: expect.S ? parseInt(expect.S) : null
        };

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
        return this.items.filter((item) => {
            // @ts-ignore
            const visibleFlag = item[this.VisibleFlagFieldCode]?.S;
            if (visibleFlag === '無効') {
                return false;
            }

            return item.カテゴリ?.S === category
        }).sort((a, b) => {
            const orderA = parseInt(a.カテゴリ内の表示順序.S, 10) || Infinity;
            const orderB = parseInt(b.カテゴリ内の表示順序.S, 10) || Infinity;
            return orderA - orderB;
        });
    }
}
