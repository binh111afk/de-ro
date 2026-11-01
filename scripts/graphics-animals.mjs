/**
 * 43 con vật nhóm Sinh học, nhập từ bộ SVG Repo (khung 1024, nét là khối tô #663333).
 * Đổi sang style kho: nét → #22333B, màu tô → bảng pastel. Thay các con vật vẽ cũ
 * (giữ id bio-meo/cho/ho/rua/buom để slide cũ vẫn hiện hình).
 */
import { readFileSync } from 'node:fs'

const DIR = 'C:/Users/Lenovo/Downloads/'

const INK = '#22333B'
const COLORS = {
  none: 'none',
  '#663333': INK,
  '#1C274C': INK,
  '#000000': INK,
  '#B2ABAC': '#D8CFF0', // xám → tím nhạt
  '#D2CDCE': '#ECE8F6',
  '#FFFFFF': '#FFFFFF',
  'white': '#FFFFFF',
  '#FFCC66': '#F7E6A8',
  '#FDCB81': '#F7E6A8',
  '#B88D5B': '#E8C9A0', // nâu
  '#F9DCB2': '#F6E8D2',
  '#F2EBDC': '#F6EFE3',
  '#CA5F38': '#F6C6A8',
  '#C85E4C': '#F2B8A8',
  '#FE6865': '#F5C2C8',
  '#F8464E': '#F5C2C8',
  '#6A973A': '#C6E5B3',
  '#9ACE57': '#DFF0CF',
  '#4EC8D8': '#B9D4EA',
}

/** [file, id, tên, keyword] — thứ tự là thứ tự trong kho */
const LIST = [
  ['cat', 'bio-meo', 'Con mèo', 'meo thu cung dong vat co vu'],
  ['dog', 'bio-cho', 'Con chó', 'cho thu cung dong vat co vu'],
  ['husky', 'bio-cho-husky', 'Chó husky', 'cho husky soi thu cung dong vat'],
  ['mouse', 'bio-chuot', 'Con chuột', 'chuot gam nham dong vat co vu'],
  ['the-cow', 'bio-bo', 'Con bò', 'bo sua gia suc vat nuoi nong trai'],
  ['mianyang', 'bio-cuu', 'Con cừu', 'cuu long cuu gia suc vat nuoi'],
  ['duck', 'bio-vit', 'Con vịt', 'vit gia cam vat nuoi chim nuoc'],
  ['tiger', 'bio-ho', 'Con hổ', 'ho cop thu du an thit rung'],
  ['lion', 'bio-su-tu', 'Sư tử', 'su tu chua son lam thu du an thit thao nguyen'],
  ['panda', 'bio-gau-truc', 'Gấu trúc', 'gau truc panda dong vat quy hiem'],
  ['monkey', 'bio-khi', 'Con khỉ', 'khi linh truong dong vat rung'],
  ['sloth', 'bio-con-luoi', 'Con lười', 'con luoi dong vat rung nhiet doi cham chap'],
  ['squirrel', 'bio-soc', 'Con sóc', 'soc gam nham rung cay'],
  ['raccoon', 'bio-gau-meo', 'Gấu mèo', 'gau meo racoon dong vat'],
  ['elk', 'bio-nai', 'Nai sừng tấm', 'nai huou sung tam dong vat an co'],
  ['kangaroo', 'bio-kangaroo', 'Chuột túi', 'chuot tui kangaroo thu co tui uc'],
  ['alpaca', 'bio-alpaca', 'Lạc đà alpaca', 'lac da alpaca nam my dong vat'],
  ['camel', 'bio-lac-da', 'Lạc đà', 'lac da sa mac buou dong vat'],
  ['rhino', 'bio-te-giac', 'Tê giác', 'te giac sung dong vat quy hiem chau phi'],
  ['hippo', 'bio-ha-ma', 'Hà mã', 'ha ma dong vat chau phi song nuoc'],
  ['anteater', 'bio-thu-an-kien', 'Thú ăn kiến', 'thu an kien dong vat nam my'],
  ['bat', 'bio-doi', 'Con dơi', 'doi thu biet bay ban dem'],
  ['owl', 'bio-cu-meo', 'Cú mèo', 'cu meo chim san moi ban dem'],
  ['macaw', 'bio-vet', 'Con vẹt', 'vet chim nhiet doi biet noi'],
  ['toucan', 'bio-toucan', 'Chim toucan', 'chim toucan mo to nhiet doi'],
  ['penguin', 'bio-chim-canh-cut', 'Chim cánh cụt', 'chim canh cut nam cuc bang gia'],
  ['ostrich', 'bio-da-dieu', 'Đà điểu', 'da dieu chim lon chay nhanh'],
  ['swan', 'bio-thien-nga', 'Thiên nga', 'thien nga chim nuoc ho'],
  ['pelican', 'bio-bo-nong', 'Bồ nông', 'bo nong chim nuoc mo tui'],
  ['frog', 'bio-ech', 'Con ếch', 'ech luong cu nong noc bien thai'],
  ['turtle', 'bio-rua', 'Con rùa', 'rua bo sat mai cham chap'],
  ['crocodile', 'bio-ca-sau', 'Cá sấu', 'ca sau bo sat dam lay'],
  ['snake', 'bio-ran', 'Con rắn', 'ran bo sat'],
  ['cobra', 'bio-ran-ho-mang', 'Rắn hổ mang', 'ran ho mang bo sat noc doc'],
  ['shark', 'bio-ca-map', 'Cá mập', 'ca map bien dai duong san moi'],
  ['whale', 'bio-ca-voi', 'Cá voi', 'ca voi bien dai duong thu co vu'],
  ['sea-ray', 'bio-ca-duoi', 'Cá đuối', 'ca duoi bien dai duong'],
  ['manatee', 'bio-lon-bien', 'Lợn biển', 'lon bien bo bien thu co vu bien'],
  ['octopus', 'bio-bach-tuoc', 'Bạch tuộc', 'bach tuoc dong vat than mem bien'],
  ['crab', 'bio-cua', 'Con cua', 'cua giap xac bien'],
  ['spider', 'bio-nhen', 'Con nhện', 'nhen chan khop to nhen'],
  ['beetle', 'bio-bo-canh-cung', 'Bọ cánh cứng', 'bo canh cung con trung'],
  ['butterfly', 'bio-buom', 'Con bướm', 'buom con trung bien thai'],
]

function convert(file) {
  const raw = readFileSync(`${DIR}${file}-svgrepo-com.svg`, 'utf8')
  const body = raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'))
  if (/<(?!path\b|\/path)/.test(body)) throw new Error(`${file}: có thẻ khác <path>`)
  const paths = body.replace(/fill="([^"]*)"/g, (_, c) => {
    const to = COLORS[c] ?? COLORS[c.toUpperCase()]
    if (!to) throw new Error(`${file}: chưa có màu thay cho ${c}`)
    return `fill="${to}"`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${paths.replace(/\s+/g, ' ').trim()}</svg>`
}

export const ANIMALS = LIST.map(([file, id, name, keywords]) => ({ id, name, category: 'bio', keywords, svg: convert(file) }))

/** con vật vẽ cũ bỏ đi (id dùng lại ở trên thì bản mới thay vào) */
export const ANIMALS_REMOVED = ['bio-meo', 'bio-cho', 'bio-ga-trong', 'bio-trau', 'bio-voi', 'bio-ho', 'bio-tho', 'bio-ca-heo', 'bio-buom', 'bio-rua']
