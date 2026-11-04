import assert from 'node:assert/strict';
import {ageAtPosition} from './dist/chart-interaction.mjs';
for(const [width,left,right,displayWidth,start] of [[1100,76,16,1100,20],[580,63,16,330,35],[580,63,16,280,60]]){
 const rect={left:45,width:displayWidth};
 const screenX=age=>rect.left+(left+(age-start)/(90-start)*(width-left-right))/width*displayWidth;
 for(let age=start;age<=90;age++)assert.equal(ageAtPosition(screenX(age),rect,width,left,right,start,90),age);
 assert.equal(ageAtPosition(-10000,rect,width,left,right,start,90),start);
 assert.equal(ageAtPosition(10000,rect,width,left,right,start,90),90);
}
console.log('PASS: graph coordinates select exact ages on desktop and scaled mobile layouts, including clamped boundaries.');
