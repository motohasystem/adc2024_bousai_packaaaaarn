/**
 * GETパラメータを管理するクラス
 * このクラスのインスタンスは、GETパラメータの key=value を辞書として保持し、
 * keyのsetterで同時にURLのGETパラメータを更新します。
 */
export class GetParamsManager {
    // GETパラメータの key-value を保持する辞書
    private params: { [key: string]: string } = {};

    constructor() {
        this.loadFromUrl();
    }

    // 現在のURLからGETパラメータを読み込み、paramsに設定する
    private loadFromUrl(): void {
        if (typeof window !== "undefined" && window.location) {
            const query = window.location.search;
            if (query) {
                const urlParams = new URLSearchParams(query);
                urlParams.forEach((value, key) => {
                    this.params[key] = value;
                });
            }
        }
    }

    // 指定したキーの値を更新する。辞書とURLの両方を更新する
    public setParam(key: string, value: string): void {
        this.params[key] = value;
        if (typeof window !== "undefined" && window.location) {
            const url = new URL(window.location.href);
            url.searchParams.set(key, value);
            // URLを更新。pushStateを使って履歴を変更します。
            history.pushState(null, "", url.toString());
        }
    }

    // キーとバリューを指定して、すでにそのパラメータが存在していて、指定したバリューが選択されていればtrueを返す。
    // それ以外はfalseを返す
    public isSelected(key: string, value: string): boolean {
        return this.params[key] === value;
    }

    // 指定したキーの値を取得する。存在しない場合はundefinedを返す
    public getParam(key: string): string | undefined {
        return this.params[key];
    }

    // 全てのGETパラメータを取得する
    public getAllParams(): { [key: string]: string } {
        return { ...this.params };
    }
}
