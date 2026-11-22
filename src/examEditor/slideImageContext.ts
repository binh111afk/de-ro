import { createContext, useContext, useMemo, type SyntheticEvent } from 'react'
import { slideImageElementIds, type SlideImageJobs } from './slideImageStatus'

export const SlideImageContext = createContext<{ jobs: SlideImageJobs } | null>(null)

export function useSlideImagePresentation(slideId: string | undefined, elementId: string, src: string | undefined) {
  const jobs = useContext(SlideImageContext)?.jobs
  const slot = elementId === slideImageElementIds.image2[0] ? 'image2' : 'image'
  const isSlot = slideImageElementIds[slot].some(id => id === elementId)
  const fade = useMemo(
    () => !!(jobs && slideId && src && isSlot && jobs.justArrived(slideId, slot, src)),
    [jobs, slideId, slot, src, isSlot],
  )
  const status = jobs && slideId && isSlot && !src ? jobs.status(slideId, slot) : undefined
  return { status, fadeOnLoad: fade ? fadeLoadedImage : undefined }
}

function fadeLoadedImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.classList.add('slide-img-fade')
}
