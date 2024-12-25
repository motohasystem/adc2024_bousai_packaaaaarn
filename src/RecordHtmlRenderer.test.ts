import { describe, it, expect } from "vitest";
import { RecordHtmlRenderer } from "./RecordHtmlRenderer";
import { Impact } from "./RecordData";

// composeImpactRatioStringの引数にRiskPointを追加

describe("RecordHtmlRenderer", () => {
    describe("composeImpactRatioString", () => {
        it("should return a correctly formatted impact ratio string", () => {
            const mockImpactTable: Impact[][] = [
                [
                    { id: "1", description: "Impact 1", coefficient: 1.5, condition: ">", expect: 0, target: "7" },
                    { id: "2", description: "Impact 2", coefficient: 2.0, condition: ">", expect: 0, target: "7" }
                ]
            ];

            const renderer = new RecordHtmlRenderer({} as any, true);
            const result = renderer.composeImpactRatioString("2", mockImpactTable);

            expect(result).toBe("1*1.50 & 2*2.00");
        });

        it("should handle an empty impact table", () => {
            const mockImpactTable: Impact[][] = [];

            const renderer = new RecordHtmlRenderer({} as any, true);
            const result = renderer.composeImpactRatioString("2", mockImpactTable);

            expect(result).toBe("");
        });

        it("should handle a single impact in the table", () => {
            const mockImpactTable: Impact[][] = [
                [
                    { id: "1", description: "Impact 1", coefficient: 1.5, condition: ">", expect: 0, target: "7" }
                ]
            ];

            const renderer = new RecordHtmlRenderer({} as any, true);
            const result = renderer.composeImpactRatioString("2", mockImpactTable);

            expect(result).toBe("1*1.50");
        });

        it("should handle a single impact in the table", () => {
            const mockImpactTable: Impact[][] = [
                [
                    { id: "1", description: "Impact 1", coefficient: 1, condition: ">", expect: 0, target: "7" }
                ]
            ];

            const renderer = new RecordHtmlRenderer({} as any, true);
            const result = renderer.composeImpactRatioString("2", mockImpactTable);

            expect(result).toBe("1*1.00");
        });

        it("should handle a single impact in the table", () => {
            const mockImpactTable: Impact[][] = [
                [
                    { id: "1", description: "Impact 1", coefficient: 0, condition: ">", expect: 0, target: "7" }
                ]
            ];

            const renderer = new RecordHtmlRenderer({} as any, true);
            const result = renderer.composeImpactRatioString("2", mockImpactTable);

            expect(result).toBe("1*0.00");
        });
    });
});
