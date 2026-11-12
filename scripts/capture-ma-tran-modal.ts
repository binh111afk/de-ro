import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withPage, waitFor } from './lib/cdp.mjs'
import { Packer } from 'docx'
import { emptyDoc, type QuestionBlock } from '../src/data/docTypes.ts'
import {
  buildMatrixData,
  buildSpecData,
  buildMatrixTableBlock,
  buildSpecTableBlock,
  buildMatrixAndSpecExamDoc,
  DEFAULT_SCORE_CONFIG,
  extractQuestionsFromDoc,
} from '../src/lib/matrixExam.ts'
import { buildDocx } from '../src/examEditor/docxBlocks.ts'

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/1970d297-c1cf-4d55-8648-bda71635268d'
const LOCAL_DIR = join(process.cwd(), 'scripts/output')

if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true })
if (!existsSync(ARTIFACT_DIR)) mkdirSync(ARTIFACT_DIR, { recursive: true })

async function checkPort(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}`)
    return res.ok || res.status === 404
  } catch {
    return false
  }
}

async function main() {
  console.log('--- 1. Xuất file Word mẫu Ma trận & Đặc tả ---')
  const sampleDoc = {
    ...emptyDoc(),
    title: 'Đề kiểm tra học kỳ II - Môn Toán 12',
    subject: 'Toán',
    grade: '12',
    duration: '90 phút',
    term: 'Cuối học kỳ II',
    schoolYear: '2025 - 2026',
    blocks: [
      ...Array.from({ length: 12 }, (_, i) => ({
        type: 'question',
        no: i + 1,
        kind: 'mcq',
        text: i < 6 ? `Cho hàm số y = f(x). Khảo sát hàm số tại điểm x = ${i + 1}.` : `Trong không gian Oxyz, cho điểm M(${i}, 1, 2) và vectơ v.`,
        options: [
          { label: 'A', text: 'y = 2x + 1' },
          { label: 'B', text: 'y = -x + 3' },
          { label: 'C', text: 'y = 3x - 2' },
          { label: 'D', text: 'y = x^2' },
        ],
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        type: 'question',
        no: 12 + i + 1,
        kind: 'tf',
        text: `Cho hàm số bậc ba y = f(x). Xét tính đúng sai của các mệnh đề:`,
        options: [
          { label: 'a', text: 'Hàm số đồng biến trên R' },
          { label: 'b', text: 'Đồ thị có điểm cực đại tại x = 0' },
          { label: 'c', text: 'Giá trị nhỏ nhất bằng -2' },
          { label: 'd', text: 'Phương trình f(x) = 0 có đúng 3 nghiệm' },
        ],
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        type: 'question',
        no: 16 + i + 1,
        kind: 'short',
        text: `Tính tích phân I = \\int_0^1 (2x + ${i}) dx.`,
        options: [],
      })),
    ],
  }

  const questions = extractQuestionsFromDoc(sampleDoc)
  const ch1 = 'Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số'
  const ch2 = 'Toạ độ của vectơ trong không gian'
  const ch3 = 'Nguyên hàm và tích phân'

  questions.forEach((q, i) => {
    if (i < 6) {
      q.chuDe = ch1
      q.mucDo = i < 4 ? 'NB' : 'TH'
      q.yeuCau = 'Nhận biết và tính đạo hàm, tính đơn điệu của hàm số'
    } else if (i < 12) {
      q.chuDe = ch2
      q.mucDo = i < 9 ? 'NB' : 'TH'
      q.yeuCau = 'Xác định toạ độ vectơ và điểm trong không gian'
    } else if (i < 16) {
      q.chuDe = i < 14 ? ch1 : ch3
      q.mucDoTf = ['NB', 'TH', 'TH', 'VD']
      q.yeuCau = 'Vận dụng tính chất hàm số và tích phân xét tính đúng sai'
    } else {
      q.chuDe = ch3
      q.mucDo = i < 19 ? 'VD' : 'VDC'
      q.yeuCau = 'Tính tích phân và giải bài toán thực tế'
    }
  })

  const config = DEFAULT_SCORE_CONFIG('Toán')
  const matrixData = buildMatrixData(questions, config, { grade: 12, separateVdc: false })
  const specData = buildSpecData(questions, { grade: 12, separateVdc: false })

  const matrixTable = buildMatrixTableBlock(matrixData)
  const specTable = buildSpecTableBlock(specData)

  const wordDoc = buildMatrixAndSpecExamDoc(sampleDoc, matrixTable, specTable, {
    subject: 'Toán',
    grade: 12,
    duration: '90 phút',
    term: 'Cuối học kỳ II',
    schoolYear: '2025 - 2026',
  })

  const docxObj = buildDocx(wordDoc, { landscape: true })
  const docxBuf = await Packer.toBuffer(docxObj)

  const docxLocalPath = join(LOCAL_DIR, 'ma-tran-toan-12.docx')
  const docxArtifactPath = join(ARTIFACT_DIR, 'ma-tran-toan-12.docx')
  writeFileSync(docxLocalPath, docxBuf)
  writeFileSync(docxArtifactPath, docxBuf)
  console.log(`✅ Đã lưu file Word mẫu tại:\n  - ${docxLocalPath}\n  - ${docxArtifactPath}`)

  console.log('\n--- 2. Khởi động dev server và chụp ảnh modal ---')
  const PORT = 5184
  let viteProcess = null
  let running = await checkPort(PORT)

  if (!running) {
    console.log(`Đang khởi động Vite dev server trên port ${PORT}...`)
    viteProcess = spawn('npx', ['vite', '--port', String(PORT), '--host', '127.0.0.1'], {
      shell: true,
      stdio: 'pipe',
    })

    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 500))
      if (await checkPort(PORT)) {
        running = true
        break
      }
    }
  }

  if (!running) {
    throw new Error('Không thể khởi động Vite dev server.')
  }
  console.log(`Vite server đang chạy tại http://127.0.0.1:${PORT}`)

  try {
    const url = `http://127.0.0.1:${PORT}/preview-ma-tran`
    console.log(`Đang mở trang ${url} trong Chrome headless để chụp ảnh...`)

    await withPage(url, { width: 1400, height: 900 }, async ({ evaluate, screenshot }) => {
      console.log('Đang đợi modal hiển thị...')
      await waitFor(evaluate, '!!document.querySelector(".anim-pop")', 40000)
      console.log('Modal đã xuất hiện! Đợi 3s để dữ liệu ma trận nạp xong...')
      await new Promise((r) => setTimeout(r, 3000))

      const rect = await evaluate(`
        (() => {
          const el = document.querySelector('.anim-pop');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height), scale: 1 };
        })()
      `)

      console.log('Đang chụp ảnh tab Bảng Ma trận...')
      const pngBuf = await screenshot(rect || undefined)

      const pngLocalPath = join(LOCAL_DIR, 'anh-chup-modal-ma-tran.png')
      const pngArtifactPath = join(ARTIFACT_DIR, 'anh-chup-modal-ma-tran.png')
      writeFileSync(pngLocalPath, pngBuf)
      writeFileSync(pngArtifactPath, pngBuf)
      console.log(`✅ Đã chụp và lưu ảnh modal Ma trận tại:\n  - ${pngLocalPath}\n  - ${pngArtifactPath}`)

      // Chuyển sang tab Bản Đặc tả và chụp tiếp
      console.log('Đang chuyển sang tab Bản Đặc tả...')
      await evaluate(`
        const radios = document.querySelectorAll('[role="radio"]');
        if (radios.length >= 2) radios[1].click();
      `)
      await new Promise((r) => setTimeout(r, 600))

      const pngDacTaBuf = await screenshot(rect || undefined)
      const dacTaLocalPath = join(LOCAL_DIR, 'anh-chup-modal-dac-ta.png')
      const dacTaArtifactPath = join(ARTIFACT_DIR, 'anh-chup-modal-dac-ta.png')
      writeFileSync(dacTaLocalPath, pngDacTaBuf)
      writeFileSync(dacTaArtifactPath, pngDacTaBuf)
      console.log(`✅ Đã chụp và lưu ảnh modal Đặc tả tại:\n  - ${dacTaLocalPath}\n  - ${dacTaArtifactPath}`)
    })
  } finally {
    if (viteProcess) {
      console.log('Đang tắt Vite dev server...')
      viteProcess.kill()
    }
  }

  console.log('\n🎉 Hoàn thành xuất file Word và chụp ảnh modal!')
}

main().catch((err) => {
  console.error('Lỗi:', err)
  process.exit(1)
})
