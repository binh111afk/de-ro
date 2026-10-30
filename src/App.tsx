import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { DialogHost } from '@/components/Dialog'
import { Footer, Header } from '@/components/Layout'
import { cn } from '@/lib/cn'
import Home from '@/pages/Home'
import ComposeDoc from '@/pages/ComposeDoc'
import Community from '@/pages/Community'
import MyExams from '@/pages/MyExams'
import MyDocs from '@/pages/MyDocs'
import Library from '@/pages/Library'
import Grading from '@/pages/Grading'
import Quiz from '@/pages/Quiz'
import OnlineList from '@/pages/OnlineList'
import OnlineBuilder from '@/pages/OnlineBuilder'
import OnlineOpen from '@/pages/OnlineOpen'
import ExamView from '@/pages/ExamView'
import Auth from '@/pages/Auth'
import Profile from '@/pages/Profile'
import { consumeAuthRedirect } from '@/lib/auth'
import { startSync } from '@/lib/sync'
import { useSession } from '@/lib/useSession'

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

  useEffect(() => {
    consumeAuthRedirect().catch(() => {})
  }, [])

  // đăng nhập thì đồng bộ đề, slide và lịch sử tạo đề với tài khoản; đăng xuất thì dừng
  const userId = useSession()?.user.id
  useEffect(() => {
    if (!userId) return
    let stop: (() => void) | undefined
    let dead = false
    startSync()
      .then((fn) => (dead ? fn() : (stop = fn)))
      .catch(() => {})
    return () => {
      dead = true
      stop?.()
    }
  }, [userId])

  return (
    <div className={cn('flex min-h-dvh flex-col', fullscreen && 'h-dvh overflow-hidden')}>
      <ScrollToTop />
      <DialogHost />
      {fullscreen ? null : <Header />}
      <main className={cn('flex-1', fullscreen && 'min-h-0 overflow-hidden')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/soan-de" element={<ComposeDoc />} />
          <Route path="/soan-slide" element={<Navigate to="/soan-de" replace />} />
          <Route path="/tao-de-online" element={<OnlineList />} />
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
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {fullscreen || authPage ? null : <Footer />}
    </div>
  )
}
