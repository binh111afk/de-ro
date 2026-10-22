import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer, Header } from '@/components/Layout'
import { cn } from '@/lib/cn'
import Home from '@/pages/Home'
import ComposeDoc from '@/pages/ComposeDoc'
import Community from '@/pages/Community'
import MyExams from '@/pages/MyExams'
import MyDocs from '@/pages/MyDocs'
import Slides from '@/pages/Slides'
import Library from '@/pages/Library'
import Grading from '@/pages/Grading'
import Quiz from '@/pages/Quiz'
import ExamView from '@/pages/ExamView'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

/** Trang soạn đề chạy full-screen, không dùng header/footer chung của site. */
const FULLSCREEN_ROUTES = ['/soan-de', '/soan-slide']

export default function App() {
  const { pathname } = useLocation()
  const fullscreen = FULLSCREEN_ROUTES.includes(pathname)

  return (
    <div className={cn('flex min-h-dvh flex-col', fullscreen && 'h-dvh overflow-hidden')}>
      <ScrollToTop />
      {fullscreen ? null : <Header />}
      <main className={cn('flex-1', fullscreen && 'min-h-0 overflow-hidden')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/soan-de" element={<ComposeDoc />} />
          <Route path="/soan-slide" element={<Slides />} />
          <Route path="/de-cong-dong" element={<Community />} />
          <Route path="/de-cua-toi" element={<MyDocs />} />
          <Route path="/de-cua-toi/phan-tich" element={<MyExams />} />
          <Route path="/kho-tai-lieu" element={<Library />} />
          <Route path="/cham-trac-nghiem" element={<Grading />} />
          <Route path="/lam-de/:id" element={<Quiz />} />
          <Route path="/de/:id" element={<ExamView />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {fullscreen ? null : <Footer />}
    </div>
  )
}
