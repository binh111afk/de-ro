import type { ToolDoc } from '@/lib/toolSpec'

export type SubjectKey = 'math' | 'physics' | 'chem' | 'bio'

export interface SubjectToolDemo {
  id: string
  title: string
  caption: string
  doc: ToolDoc
}

export interface SubjectGroup {
  key: SubjectKey
  label: string
  count: number
  summary: string
  allTools: string[]
  demos: SubjectToolDemo[]
}

export const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    key: 'math',
    label: 'Toán học',
    count: 12,
    summary: 'Đồ thị, bảng biến thiên, hệ trục Oxy miền nghiệm, hình không gian và đường tròn lượng giác đúng quy ước SGK.',
    allTools: [
      'Đồ thị hàm số',
      'Bảng biến thiên',
      'Bảng xét dấu',
      'Hệ trục Oxy & miền nghiệm',
      'Biểu đồ thống kê',
      'Mẫu số liệu ghép nhóm',
      'Hình học phẳng',
      'Hình học không gian',
      'Đường tròn lượng giác',
      'Sơ đồ cây xác suất',
      'Trục số & khoảng',
      'Biểu đồ Ven',
    ],
    demos: [
      {
        id: 'vartable',
        title: 'Bảng biến thiên',
        caption: 'Hàm bậc ba có mũi tên đồng biến / nghịch biến và điểm cực trị.',
        doc: {
          kind: 'vartable',
          spec: {
            fname: 'y',
            points: [
              { x: '−∞', mark: '', y: '−∞' },
              { x: '0', mark: '0', y: '2' },
              { x: '2', mark: '0', y: '−2' },
              { x: '+∞', mark: '', y: '+∞' },
            ],
            signs: ['+', '-', '+'],
          },
        },
      },
      {
        id: 'geo3d',
        title: 'Hình học không gian',
        caption: 'Hình chóp S.ABCD vuông đáy, tự phân biệt nét liền – nét đứt.',
        doc: {
          kind: 'geo3d',
          spec: {
            shape: 'pyramid4-sa',
            names: ['S', 'A', 'B', 'C', 'D'],
            height: true,
            diagonals: true,
            marks: true,
            tall: 1.0,
          },
        },
      },
      {
        id: 'trig',
        title: 'Đường tròn lượng giác',
        caption: 'Điểm biểu diễn góc, nét chiếu xuống trục cos, sin và giá trị.',
        doc: {
          kind: 'trig',
          spec: {
            angles: 'M: π/6\nN: 2π/3',
            projections: true,
            tan: false,
            values: true,
          },
        },
      },
    ],
  },
  {
    key: 'physics',
    label: 'Vật lí',
    count: 8,
    summary: 'Từ mạch điện nối tiếp – song song, sơ đồ tia tạo ảnh qua thấu kính đến dao động điều hoà và đường sức trường.',
    allTools: [
      'Mạch điện',
      'Sơ đồ chuyển động',
      'Mặt phẳng nghiêng',
      'Quá trình khí lý tưởng',
      'Đồ thị chuyển pha',
      'Dao động · Xoay chiều · Sóng dừng',
      'Sơ đồ thấu kính',
      'Đường sức điện — từ trường',
    ],
    demos: [
      {
        id: 'circuit',
        title: 'Mạch điện SGK',
        caption: 'Nhập biểu thức nối tiếp / song song, tự xếp nhánh mạch và nguồn.',
        doc: {
          kind: 'circuit',
          spec: {
            text: 'nguồn E = 12V, r = 1Ω\nK - A - R1=4Ω - (R2=6Ω // R3=3Ω)',
            values: true,
          },
        },
      },
      {
        id: 'lens',
        title: 'Thấu kính mỏng',
        caption: 'Tính đúng vị trí d′, vẽ đủ 3 tia đặc biệt tạo ảnh thật hoặc ảnh ảo.',
        doc: {
          kind: 'lens',
          spec: {
            type: 'converging',
            f: 12,
            d: 18,
            h: 2,
            rays: ['parallel', 'center', 'focal'],
            show2F: true,
            showValues: true,
          },
        },
      },
      {
        id: 'osc',
        title: 'Dao động điều hoà',
        caption: 'Đồ thị li độ x(t), vận tốc v(t), xoay chiều u-i và sóng dừng.',
        doc: {
          kind: 'osc',
          spec: {
            mode: 'osc',
            qty: 'x',
            A: 4,
            period: { by: 'T', value: 2 },
            start: { by: 'state', x0: 'A/2', dir: 'up' },
            tEnd: 2.5,
            yName: 'x (cm)',
            tName: 't (s)',
            grid: 'T/4',
            ticks: 'symbol',
            second: null,
          },
        },
      },
    ],
  },
  {
    key: 'chem',
    label: 'Hoá học',
    count: 4,
    summary: 'Cấu hình electron theo quy tắc Hund, công thức cấu tạo hữu cơ và phương trình cân bằng hệ số tự động.',
    allTools: [
      'Cấu hình electron & ô orbital',
      'Công thức cấu tạo',
      'Đồ thị phản ứng',
      'Phương trình hoá học',
    ],
    demos: [
      {
        id: 'electron',
        title: 'Cấu hình electron & orbital',
        caption: 'Tự tính từ H đến Ba (kể cả Cr, Cu bán bão hoà) và điền mũi tên orbital.',
        doc: {
          kind: 'electron',
          spec: { element: 'Fe', valenceOnly: true },
        },
      },
      {
        id: 'struct',
        title: 'Công thức cấu tạo hữu cơ',
        caption: 'Hỗ trợ mạch nhánh, liên kết đôi/ba, vòng benzen và kiểu khung zigzag.',
        doc: {
          kind: 'struct',
          spec: {
            formula: '[benzen](1:CH3)(4:NO2)',
            style: 'skeletal',
            number: false,
            ringStyle: 'kekule',
          },
        },
      },
      {
        id: 'chemeq',
        title: 'Phương trình hoá học',
        caption: 'Tự xuống chỉ số chân, ghi điều kiện trên/dưới mũi tên và cân bằng.',
        doc: {
          kind: 'chemeq',
          spec: {
            equations: '2KMnO4 -> K2MnO4 + MnO2 + O2 [t°]\nN2 + 3H2 <=> 2NH3 [t°, xt, p | Fe]',
            autoBalance: false,
            fontSize: 17,
            align: 'center',
          },
        },
      },
    ],
  },
  {
    key: 'bio',
    label: 'Sinh học',
    count: 3,
    summary: 'Phả hệ quy chuẩn di truyền học, bảng lai Punnett tới 3 cặp gen và sơ đồ lưới thức ăn theo bậc dinh dưỡng.',
    allTools: [
      'Sơ đồ phả hệ',
      'Bảng lai Punnett',
      'Chuỗi & lưới thức ăn',
    ],
    demos: [
      {
        id: 'pedigree',
        title: 'Sơ đồ phả hệ',
        caption: 'Tự chia thế hệ I, II, III, kí hiệu người bệnh / mang gen và dấu hỏi đề bài.',
        doc: {
          kind: 'pedigree',
          spec: {
            text: '1: nam bt\n2: nữ mang gen\n1 x 2 -> 3, 4, 5\n3: nam bệnh\n4: nữ bt\n5: ?',
            legend: true,
            carrierStyle: 'half',
          },
        },
      },
      {
        id: 'punnett',
        title: 'Bảng lai Punnett',
        caption: 'Liệt kê giao tử GP, kẻ khung giao tử đực – cái và rút gọn tỉ lệ KG / KH.',
        doc: {
          kind: 'punnett',
          spec: {
            cross: 'AaBb x Aabb',
            showGametes: true,
            showGrid: true,
            showGenotypeRatio: true,
            showPhenotypeRatio: false,
          },
        },
      },
      {
        id: 'foodweb',
        title: 'Chuỗi & lưới thức ăn',
        caption: 'Tự xếp tầng dinh dưỡng, tránh đè nhãn và hỗ trợ ẩn tên loài (?A).',
        doc: {
          kind: 'foodweb',
          spec: {
            text: 'Cỏ -> Thỏ -> Cáo -> Hổ\nCỏ -> Sâu -> Chim -> Diều hâu\nThỏ -> Diều hâu',
            direction: 'bottom-up',
            nodeStyle: 'box',
            showLevels: false,
          },
        },
      },
    ],
  },
]
