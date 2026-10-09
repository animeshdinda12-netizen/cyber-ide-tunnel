const fs = require("fs");
const html = fs.readFileSync("C:\\Users\\anime\\Downloads\\Programs\\index.html", "utf8");
const code = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/)[1];
fs.writeFileSync("C:\\Users\\anime\\Downloads\\Programs\\babel_source.txt", code);
console.log("source lines:", code.split("\n").length);
