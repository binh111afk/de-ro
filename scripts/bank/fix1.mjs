import fs from 'node:fs'
const f = process.argv[2]
const a = JSON.parse(fs.readFileSync(f, 'utf8'))
a[2].options[2].text = '$2x+y+z-7=0$'
fs.writeFileSync(f, JSON.stringify(a, null, 2))
console.log(a[2].options)
