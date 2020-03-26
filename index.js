"use strict";

const chalk = require("chalk");
const table = require("table");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

const tableConfig = {
	drawHorizontalLine: () => false,
	border: {
		topBody: "",
		topJoin: "",
		topLeft: "",
		topRight: "",
		bottomBody: "",
		bottomJoin: "",
		bottomLeft: "",
		bottomRight: "",
		bodyLeft: "",
		bodyRight: "",
		bodyJoin: "",
		joinBody: "",
		joinLeft: "",
		joinRight: "",
		joinJoin: "",
	},
};

const iota = i => Array(i).fill(i).map((_, i) => i);


(async () => {
	const [,user] = /^@([\w-@]+)$/.exec(process.argv[2]) || [];
	if (!user) {
		console.log("Usage: analyze @<username>");
		process.exit(1);
	}

	const [locale] = process.env.LANG.split(",");

	const resp = await fetch(`https://qiita.com/${user}`, {
		headers: {
			"Accept-Language": locale || "en-US",
		},
	});
	if (!resp.ok) {
		console.log(resp.statusText);
		process.exit(1);
	}

	const $ = cheerio.load(await resp.text());

	const stats = $("[class^=UserAnalyzeResult__TagStats-]").toArray().map(stat => ({
		title: $("> div", stat).text(),
		items: $("> ul li", stat).toArray().map(item => ({
			name: $("span:first-child", item).text(),
			value: $("span:last-child", item).text(),
		})),
	}));

	const rows = iota(Math.max(...stats.map(s => s.items.length)))
		.map(i => iota(stats.length)
			.map(j => stats[j].items[i])
			.map(e => e ? `  ${e.name} ${chalk.green(e.value)}` : "")
		);

	console.log(table.table([
		stats.map(s => chalk.yellow(s.title)),
		...rows,
	], tableConfig));
})();
