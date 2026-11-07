import fs from 'node:fs'
const f=process.argv[2]; const a=JSON.parse(fs.readFileSync(f,'utf8'))
a.forEach((q,i)=>{console.log(`#${i+1} [${q.type} ${q.level}] ${q.prompt}`)
;(q.options||[]).forEach(o=>console.log(`  ${o.key}) ${o.text}`))
console.log(`  => ${q.answer}${q.figure?'  FIG '+JSON.stringify(q.figure):''}`)
if(process.argv[3])console.log('  EXP '+(q.explanation||'').slice(0,400))})
