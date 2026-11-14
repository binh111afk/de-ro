import { AiWorkflowSection } from './home/AiWorkflowSection'
import { BoardSection } from './home/BoardSection'
import { CommunityCtaSection } from './home/CommunityCtaSection'
import { DrawingToolsSection } from './home/DrawingToolsSection'
import { HeroSection } from './home/HeroSection'
import { MobileSection } from './home/MobileSection'
import { OnlineGradingSection } from './home/OnlineGradingSection'
import { WorkspaceSection } from './home/WorkspaceSection'

/**
 * Trang giới thiệu chính (/).
 * Ảnh chụp ứng dụng nằm sẵn trong public/landing/*.webp; bộ vẽ SVG công cụ nạp động
 * để giữ tải ban đầu nhẹ nhưng vẫn hiển thị vector chuẩn SGK trên từng môn học.
 */
export function Home() {
  return (
    <div className="overflow-x-clip">
      <HeroSection />
      <WorkspaceSection />
      <DrawingToolsSection />
      <BoardSection />
      <AiWorkflowSection />
      <OnlineGradingSection />
      <MobileSection />
      <CommunityCtaSection />
    </div>
  )
}

export default Home
