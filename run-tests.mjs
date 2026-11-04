import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=import.meta.dirname;
let failures=0;
const files=readdirSync(root).filter(name=>name==='test.mjs'||name.endsWith('-test.mjs')).sort();
for(const file of files){
 const result=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,stdio:'inherit',windowsHide:true});
 if(result.status!==0){failures++;console.error(`FAIL: ${file}`);}
}
console.log(`${files.length-failures}/${files.length} test suites passed.`);
process.exitCode=failures?1:0;
