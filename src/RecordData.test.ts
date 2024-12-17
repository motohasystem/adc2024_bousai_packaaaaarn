import { describe, it, expect, beforeEach } from "vitest";
import { RecordData } from "./RecordData"; // クラスのファイルパスを指定

// テスト用のモックデータ
const mockData = {
    Count: 1,
    Items: [
        {
            作成者: { M: { name: { S: "作成者A" }, code: { S: "codeA" } } },
            更新日時: { S: "2024-12-17T04:13:00Z" },
            質問文: { S: "質問テキストA" },
            選択肢テーブル: {
                L: [
                    {
                        M: {
                            id: { S: "1001" },
                            value: {
                                M: {
                                    回答項目: { M: { value: { S: "回答1" }, type: "string" } }, // 'type' プロパティを追加
                                    リスクポイント: { M: { value: { S: "5" }, type: "string" } }, // 'type' プロパティを追加
                                },
                            },
                        },
                    },
                ],
            },
            影響する設問テーブル: {
                L: [
                    {
                        M: {
                            id: { S: "2001" },
                            value: {
                                M: {
                                    説明: { M: { value: { S: "説明A" }, type: "string" } }, // 'type' プロパティを追加
                                    係数: { M: { value: { S: "2.5" }, type: "string" } }, // 'type' プロパティを追加
                                },
                            },
                        },
                    },
                ],
            },
            備考: { S: "備考A" },
            カテゴリ: { S: "カテゴリA" },
            更新者: { M: { name: { S: "更新者A" }, code: { S: "codeB" } } },
            作成日時: { S: "2024-12-16T04:13:00Z" },
            レコード番号: { S: "12345" },
            Systemid: { N: "1" },
            __appid__: { N: "100" },
            課題: { S: "課題A" },
            Systemrevision: { S: "1.0" },
            "requestContext.stage": { S: "dev" }
        },
    ],
};


describe("RecordData クラスのテスト", () => {
    let recordData: RecordData;

    beforeEach(() => {
        // @ts-ignore
        return recordData = new RecordData(mockData);
    });

    it("getCreators メソッドが正しく作成者情報を取得する", () => {
        const creators = recordData.getCreators();
        expect(creators).toEqual([{ name: { S: "作成者A" }, code: { S: "codeA" } }]);
    });

    it("getQuestions メソッドが正しく質問文を取得する", () => {
        const questions = recordData.getQuestions();
        expect(questions).toEqual(["質問テキストA"]);
    });

    it("calculateRiskPoints メソッドが正しくリスクポイントを計算する", () => {
        const totalRiskPoints = recordData.calculateRiskPoints();
        expect(totalRiskPoints).toBe(5);
    });

    it("getChoiceTable メソッドが正しく選択肢テーブルを取得する", () => {
        const choiceTable = recordData.getChoiceTable();
        expect(choiceTable).toEqual([
            [
                { id: "1001", answer: "回答1", riskPoint: 5 },
            ],
        ]);
    });

    it("getImpactTable メソッドが正しく影響する設問テーブルを取得する", () => {
        const impactTable = recordData.getImpactTable();
        expect(impactTable).toEqual([
            [
                { id: "2001", description: "説明A", coefficient: 2.5 },
            ],
        ]);
    });

    it("getValue メソッドが指定したキーの値を正しく取得する", () => {
        const values = recordData.getValue("質問文");
        expect(values).toEqual(["質問テキストA"]);

        const invalidKeyValues = recordData.getValue("存在しないキー");
        expect(invalidKeyValues).toEqual([null]);
    });
});
