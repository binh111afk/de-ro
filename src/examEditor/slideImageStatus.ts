export type SlideImageSlot = 'image' | 'image2'
type ImageStatus = 'pending' | 'failed'
type ImageResult = { src: string; credit?: string }
type ImageJob = {
  slideId: string
  status: ImageStatus
  load: () => Promise<ImageResult>
  apply: (result: ImageResult) => boolean
}

export const slideImageElementIds = {
  image: ['image-1', 'hero-image'],
  image2: ['image-2'],
} as const

const imageKey = (slideId: string, slot: SlideImageSlot) => `${slideId}:${slot}`

export class SlideImageJobs {
  private jobs = new Map<string, ImageJob>()
  private arrivals = new Map<string, { slideId: string; src: string; until: number }>()

  constructor(private changed: () => void) {}

  status(slideId: string, slot: SlideImageSlot) {
    return this.jobs.get(imageKey(slideId, slot))?.status
  }

  justArrived(slideId: string, slot: SlideImageSlot, src: string) {
    const arrival = this.arrivals.get(imageKey(slideId, slot))
    return arrival?.src === src && Date.now() < arrival.until
  }

  start(slideId: string, slot: SlideImageSlot, load: ImageJob['load'], apply: ImageJob['apply']) {
    return this.run(imageKey(slideId, slot), { slideId, status: 'pending', load, apply })
  }

  retry(slideId: string, slot: SlideImageSlot) {
    const key = imageKey(slideId, slot)
    const job = this.jobs.get(key)
    if (job?.status === 'failed') return this.run(key, { ...job, status: 'pending' })
  }

  removeMissingSlides(slideIds: ReadonlySet<string>) {
    let removed = false
    for (const [key, job] of this.jobs) {
      if (!slideIds.has(job.slideId)) {
        this.jobs.delete(key)
        removed = true
      }
    }
    for (const [key, arrival] of this.arrivals) {
      if (!slideIds.has(arrival.slideId)) this.arrivals.delete(key)
    }
    if (removed) this.changed()
  }

  clear() {
    this.jobs.clear()
    this.arrivals.clear()
  }

  private async run(key: string, job: ImageJob) {
    this.jobs.set(key, job)
    this.changed()
    try {
      const result = await job.load()
      if (this.jobs.get(key) !== job) return
      if (job.apply(result)) {
        // Các bản xem đang mở nhận hiệu ứng khi ảnh tải xong. Mở lại ảnh sau đó dùng cách vẽ cũ.
        this.arrivals.set(key, { slideId: job.slideId, src: result.src, until: Date.now() + 1000 })
      }
      this.jobs.delete(key)
    } catch {
      if (this.jobs.get(key) !== job) return
      job.status = 'failed'
    }
    this.changed()
  }
}
