import fs from "node:fs";
const source = fs.readFileSync("/home/ubuntu/leadflow-ops/client/src/pages/Conversas.tsx", "utf8");
const marker = "</CardContent></Card>";
let index = source.indexOf(marker);
while (index >= 0) {
  console.log(JSON.stringify(source.slice(index, index + 140)));
  index = source.indexOf(marker, index + marker.length);
}
