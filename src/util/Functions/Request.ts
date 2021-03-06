import * as http from "http";
import * as https from "https";
import qs from "querystring";
import config from "../../config";
import Logger from "../Logger";
import URL from "url";

export default class Request {
	private constructor() {
		throw new TypeError("This class may not be instantiated, use static methods.");
	}

	/**
	 * Create a pastebin paste.
	 *
	 * @static
	 * @param {string} content - The content of the paste.
	 * @param {string} name - The title of the paste.
	 * @param {string} [expire] - The expiry of the paste. (default 1Day)
	 * @param {(0 | 1 | 2)} [privacy] - The privacy of the paste.
	 * @returns {string}
	 * @memberof Request
	 * @example Request.createPaste("Example Content", "Example Title");
	 * @example Request.createPaste("Example Content", "Example Title", "1D");
	 * @example Request.createPaste("Example Content", "Example Title", "1W", 1);
	 */
	// expiries can ONLY be these
	static async createPaste(content: string, name: string, expire?: "N" | "10M" | "1H" | "1D" | "1W" | "2W" | "1M" | "6M" | "1Y", privacy?: 0 | 1 | 2) {
		return new Promise<string>((a, b) => {
			const d = qs.stringify({
				api_option: "paste",
				api_dev_key: config.keys.pastebin.devKey,
				api_user_key: config.keys.pastebin.userKey,
				api_paste_code: content,
				api_paste_private: privacy ?? 2,
				api_paste_name: name,
				api_paste_expire_date: expire || "1D"
			});

			const req = https.request({
				hostname: "pastebin.com",
				port: 443,
				path: "/api/api_post.php",
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				}
			}, (res) => {
				const data: Buffer[] = [];
				res
					.on("data", (d) => data.push(d))
					.on("error", (err) => b(err))
					.on("end", () => a(Buffer.concat(data).toString()));
			});
			req.write(d);
			req.end();
		});
	}

	/**
	 * get the image at a url as a buffer
	 *
	 * @static
	 * @param {string} url
	 * @returns {Promise<Buffer>}
	 * @memberof Request
	 * @example Request.fetchURL("https://api.furry.bot/V2/furry/yiff/gay/image");
	 * @example Request.fetchURL("https://api.furry.bot/V2/furry/yiff/gay/image", true);
	 */
	static async fetchURL(url: string, withHeaders: true): Promise<{
		headers: http.IncomingHttpHeaders;
		body: Buffer;
		statusCode: number;
		statusMessage: string;
	}>;
	static async fetchURL(url: string, withHeaders?: false): Promise<Buffer>;
	static async fetchURL(url: string, withHeaders?: boolean): Promise<Buffer | {
		headers: http.IncomingHttpHeaders;
		body: Buffer;
		statusCode: number;
		statusMessage: string;
	}> {
		withHeaders = !!withHeaders;
		return new Promise((a, b) => {
			const uri = URL.parse(url);
			(uri.protocol === "https:" ? https : http).request({
				method: "GET",
				host: uri.host,
				path: uri.path,
				protocol: uri.protocol,
				port: uri.port || uri.protocol === "https:" ? 443 : 80,
				timeout: 3e4,
				headers: {
					"User-Agent": config.web.userAgent
				},
				rejectUnauthorized: false
			}, (res) => {
				const data: Buffer[] = [];
				res
					.on("data", (d) => data.push(d))
					.on("error", (err) => b(err))
					.on("end", () => a(withHeaders === true ? ({
						headers: res.headers,
						body: Buffer.concat(data),
						statusCode: res.statusCode!,
						statusMessage: res.statusMessage!
					}) : Buffer.concat(data))
					);
			}).end();
		});
	}

	static get getImageFromURL() {
		return this.fetchURL;
	}

	/**
	 * Download an image to a directory
	 *
	 * @static
	 * @param {string} url - The url of the image to download.
	 * @param {string} filename - The filename to save the image to
	 * @returns {Promise<void>}
	 * @memberof Request
	 * @example Request.downloadImage("https://api.furry.bot/V2/furry/bulge/image", "/opt/NPMBot/bulge.png");
	 */
	static async downloadImage(url: string, filename: string): Promise<void> {
		return this.fetchURL(url, false).then(img => fs.writeFileSync(filename, img));
	}
}
