// カテゴリ名と質問番号を受け取り、そのカテゴリの質問に対する回答をJSONから探索して返す

export type HighLowMessage = { high_risk: string; low_risk: string };

export class ResultMessageRetriever {
    private jsonFileUrl: string;
    private records: Record<string, Record<string, { messages: { high_risk: string; low_risk: string } }>> | null = null;
    private category: string;
    private questionNumber: string;

    constructor(jsonFileUrl: string, category: string, questionNumber: string) {
        this.jsonFileUrl = jsonFileUrl;
        this.category = category;
        this.questionNumber = questionNumber;
    }

    private async loadRecords(): Promise<void> {
        if (!this.records) {
            console.log({ jsonFileUrl: this.jsonFileUrl })
            const fileContent = await this.fetchJsonFile(this.jsonFileUrl);
            console.log({ fileContent })
            this.records = JSON.parse(fileContent);
        }
    }

    private async fetchJsonFile(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch JSON file. Status code: ${response.status}`);
            }
            const data = await response.text();
            return data;
        } catch (error) {
            // @ts-ignore
            throw new Error(`Error fetching JSON file: ${error.message}`);
        }
    }

    public async build(): Promise<HighLowMessage> {
        await this.loadRecords();
        const record = this.records?.[this.category]?.[this.questionNumber]?.messages;
        if (!record) {
            console.error(`回答が見つかりませんでした: ${this.questionNumber}`)
            const notfoundmsg = (pattern: string, index = "") => {
                return `メッセージデータのリビルドが必要です。設問${index}に対応する ${pattern} メッセージが見つかりませんでした`
            }
            return {
                high_risk: notfoundmsg('High risk', this.questionNumber),
                low_risk: notfoundmsg('Low risk', this.questionNumber),
            };
        }
        return record;
        // return JSON.stringify(record);
    }

    public async getHighRiskMessage(): Promise<string> {
        await this.loadRecords();
        const record = this.records?.[this.category]?.[this.questionNumber]?.messages;
        if (!record || !record.high_risk) {
            return 'High riskメッセージが見つかりませんでした';
        }
        return record.high_risk;
    }

    public async getLowRiskMessage(): Promise<string> {
        await this.loadRecords();
        const record = this.records?.[this.category]?.[this.questionNumber]?.messages;
        if (!record || !record.low_risk) {
            return 'Low riskメッセージが見つかりませんでした';
        }
        return record.low_risk;
    }
}
