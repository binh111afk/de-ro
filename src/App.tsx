import { Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { DialogHost } from '@/components/Dialog'
import { Footer, Header } from '@/components/Layout'
import { SiteStatus } from '@/components/SiteStatus'
import { cn } from '@/lib/cn'
import Home from '@/pages/Home'
import { consumeAuthRedirect } from '@/lib/auth'
import { startSync } from '@/lib/sync'
import { startPresence } from '@/lib/presence'
import { useSession } from '@/lib/useSession'
import { Analytics } from '@vercel/analytics/react'
import { lazyPage } from '@/lib/lazyPage'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'

// mỗi trang một chunk riêng: học sinh mở link làm đề không phải tải trình soạn slide, đồ hoạ, xuất Word…
const pages = {
  ComposeDoc: () => import('@/pages/ComposeDoc'),
  Community: () => import('@/pages/Community'),
  MyExams: () => import('@/pages/MyExams'),
  MyDocs: () => import('@/pages/MyDocs'),
  Library: () => import('@/pages/Library'),
  Grading: () => import('@/pages/Grading'),
  Quiz: () => import('@/pages/Quiz'),
  OnlineList: () => import('@/pages/OnlineList'),
  OnlineResults: () => import('@/pages/OnlinePublished'),
  OnlineBuilder: () => import('@/pages/OnlineBuilder'),
  OnlineOpen: () => import('@/pages/OnlineOpen'),
  ExamView: () => import('@/pages/ExamView'),
  Auth: () => import('@/pages/Auth'),
  Profile: () => import('@/pages/Profile'),
  MyUploads: () => import('@/pages/MyUploads'),
}
const ComposeDoc = lazyPage(pages.ComposeDoc)
const Community = lazyPage(pages.Community)
const MyExams = lazyPage(pages.MyExams)
const MyDocs = lazyPage(pages.MyDocs)
const Library = lazyPage(pages.Library)
const Grading = lazyPage(pages.Grading)
const Quiz = lazyPage(pages.Quiz)
const OnlineList = lazyPage(pages.OnlineList)
const OnlineResults = lazyPage(pages.OnlineResults)
const OnlineBuilder = lazyPage(pages.OnlineBuilder)
const OnlineOpen = lazyPage(pages.OnlineOpen)
const ExamView = lazyPage(pages.ExamView)
const Auth = lazyPage(pages.Auth)
const Profile = lazyPage(pages.Profile)
const MyUploads = lazyPage(pages.MyUploads)
const PreviewDesigns = lazyPage(() => import('@/pages/PreviewDesigns'))
// không đưa vào `pages` (không tải ngầm): người dùng thường không phải tải code admin
const AdminPage = lazyPage(() => import('@/pages/admin/AdminPage'))

/** Trang đầu hiện xong thì tải ngầm các trang còn lại (lần lượt, lúc trình duyệt rảnh)
 *  → bấm sang trang khác không còn khựng / "Đang tải…". */
function usePrefetchPages() {
  useEffect(() => {
    const idle = (cb: () => void) =>
      'requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout: 3000 }) : setTimeout(cb, 1500)
    const queue = Object.values(pages)
    const next = () => {
      const load = queue.shift()
      if (load) load().catch(() => {}).finally(() => idle(next))
    }
    const t = setTimeout(() => idle(next), 1500)
    return () => {
      clearTimeout(t)
      queue.length = 0
    }
  }, [])
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

/** Trang soạn chạy full-screen, không dùng header/footer chung của site. */
const FULLSCREEN_ROUTES = ['/soan-de', '/soan-slide']
/** Trang đăng nhập/đăng ký: vừa một màn hình, không có footer. */
const AUTH_ROUTES = ['/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau']

export default function App() {
  const { pathname } = useLocation()
  const fullscreen = FULLSCREEN_ROUTES.includes(pathname)
  const authPage = AUTH_ROUTES.includes(pathname)
  usePrefetchPages()

  useEffect(() => {
    consumeAuthRedirect().catch(() => {})
  }, [])

  // đăng nhập thì đồng bộ dữ liệu và gửi nhịp đang online; đăng xuất thì dừng
  const userId = useSession()?.user.id
  useEffect(() => {
    if (!userId) return
    let stopSync: (() => void) | undefined
    let dead = false
    startSync()
      .then((fn) => (dead ? fn() : (stopSync = fn)))
      .catch(() => {})
    const stopPresence = startPresence()
    return () => {
      dead = true
      stopSync?.()
      stopPresence()
    }
  }, [userId])

  return (
    <div className={cn('flex min-h-dvh flex-col', fullscreen && 'h-dvh overflow-hidden')}>
      <ScrollToTop />
      <DialogHost />
      {fullscreen ? null : <Header />}
      <main className={cn('flex-1', fullscreen && 'min-h-0 overflow-hidden')}>
        <SiteStatus>
        {/* lỗi trong một trang (hoặc tải hụt file sau khi deploy) chỉ hiện thông báo, không trắng cả web */}
        <PageErrorBoundary resetKey={pathname}>
        <Suspense fallback={<div className="flex h-full min-h-[50vh] items-center justify-center text-[13px] text-ink-3">Đang tải…</div>}>
        {/* các tab trong /admin dùng chung một khoá: chuyển tab không dựng lại cả trang admin */}
        <div key={pathname.startsWith('/admin') ? '/admin' : pathname} className={cn('page-enter', fullscreen && 'h-full')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/soan-de" element={<ComposeDoc />} />
          <Route path="/bang-ve" element={<Navigate to="/soan-de" replace />} />
          <Route path="/soan-slide" element={<Navigate to="/soan-de" replace />} />
          <Route path="/tao-de-online" element={<OnlineList />} />
          <Route path="/tao-de-online/ket-qua/:id" element={<OnlineResults />} />
          <Route path="/tao-de-online/:id" element={<OnlineBuilder />} />
          <Route path="/de-online/:id" element={<OnlineOpen />} />
          <Route path="/de-cong-dong" element={<Community />} />
          <Route path="/de-cua-toi" element={<MyDocs />} />
          <Route path="/de-cua-toi/phan-tich" element={<MyExams />} />
          <Route path="/kho-tai-lieu" element={<Library />} />
          <Route path="/cham-trac-nghiem" element={<Grading />} />
          <Route path="/lam-de/:id" element={<Quiz />} />
          <Route path="/de/:id" element={<ExamView />} />
          <Route path="/dang-nhap" element={<Auth mode="login" />} />
          <Route path="/dang-ky" element={<Auth mode="register" />} />
          <Route path="/quen-mat-khau" element={<Auth mode="forgot" />} />
          <Route path="/dat-lai-mat-khau" element={<Auth mode="reset" />} />
          <Route path="/ho-so" element={<Profile />} />
          <Route path="/ho-so/de-tai-len" element={<MyUploads />} />
          <Route path="/preview-designs" element={<PreviewDesigns />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
        </div>
        </Suspense>
        </PageErrorBoundary>
        </SiteStatus>
      </main>
      {fullscreen || authPage ? null : <Footer />}
      {import.meta.env.PROD ? <Analytics /> : null}
    </div>
  )
}
