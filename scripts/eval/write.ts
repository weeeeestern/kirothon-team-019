import { writeFileSync } from 'node:fs';
import { evaluate } from './run';
const result = evaluate();
writeFileSync(new URL('../../src/data/evaluation.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.ordinaryDayNotices !== 0 || result.detectionRate < .8 || result.reductionVsFixed < .5) process.exitCode = 1;
