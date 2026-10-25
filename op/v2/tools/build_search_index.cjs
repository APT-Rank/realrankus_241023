const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const month = process.argv[2] || "202610";
if (!/^\d{6}$/.test(month)) throw new Error("Month must use YYYYMM format.");

const sourceDir = path.join(root, "op", month);
const outputDir = path.join(__dirname, "../search-index");
const files = fs.readdirSync(sourceDir).filter((name) => name.endsWith("_OPST.json")).sort();
if (!files.length) throw new Error(`No OPST data files found for ${month}.`);

const entries = [];
for (const filename of files) {
  const regionFile = filename.replace(/_OPST\.json$/, "");
  const region = regionFile.split("_")[1] || "";
  const json = JSON.parse(fs.readFileSync(path.join(sourceDir, filename), "utf8"));
  (json.data || []).forEach((item, index) => {
    const name = item["오피스텔명"] || "";
    const address = item["도로명주소"] || item["법정동주소"] || "";
    entries.push([name, address, region, regionFile, index, item["검색코드"] || ""]);
  });
}

fs.mkdirSync(outputDir, { recursive: true });
const output = path.join(outputDir, `${month}.json`);
fs.writeFileSync(output, JSON.stringify({ month, fields: ["name", "address", "region", "sub", "index", "code"], entries }));
console.log(`Wrote ${entries.length.toLocaleString()} entries to ${path.relative(root, output)} (${(fs.statSync(output).size / 1024 / 1024).toFixed(1)} MB).`);
