import { Camera, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/shared/ui/primitives'

/**
 * Cámara dentro de la app (getUserMedia). Si el navegador no da acceso,
 * llama a `onUnavailable` para que se use el selector nativo de cámara.
 */
export function CameraCapture({
  onCapture,
  onClose,
  onUnavailable,
}: {
  onCapture: (file: File) => void
  onClose: () => void
  onUnavailable: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    const stop = () => streamRef.current?.getTracks().forEach((t) => t.stop())
    if (!navigator.mediaDevices?.getUserMedia) {
      onUnavailable()
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        if (!cancelled) onUnavailable()
      })
    return () => {
      cancelled = true
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const snap = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], `albaran-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.85,
    )
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Cámara" className="fixed inset-0 z-50 flex flex-col bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="min-h-0 flex-1 object-contain" />
      <div className="flex items-center justify-center gap-3 p-4">
        <Button variant="secondary" onClick={onClose}>
          <X className="size-4" /> Cancelar
        </Button>
        <Button onClick={snap}>
          <Camera className="size-4" /> Hacer foto
        </Button>
      </div>
    </div>
  )
}
