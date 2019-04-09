import open = require("open");

export default class Utils {
    public static OpenUrl(url: string, app?: string) {
        open(url, { app });
    }
}