import fs from 'node:fs';
const line = fs.readFileSync('client/src/pages/Conversas.tsx', 'utf8').split('\n')[81];
const formStart = line.indexOf('<form onSubmit');
const formEnd = line.indexOf('</form>', formStart);
const segment = line.slice(formStart, formEnd + 7);
const opens = (segment.match(/<div\b/g) || []).length;
const closes = (segment.match(/<\/div>/g) || []).length;
console.log({ opens, closes, difference: opens - closes });
console.log(segment.slice(-900));
