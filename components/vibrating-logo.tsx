"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"

interface VibrationProps {
  intensity?: number
  noTitle?: boolean
}

export function VibratingLogo({ intensity = 5, noTitle = false }: VibrationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const logo = logoRef.current

    if (!container || !canvas || !logo) return

    // Set up canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    // Vibration parameters
    const vibrationSpeed = 0.05 * intensity
    const vibrationAmount = 0.4 * intensity
    const waveSpeed = 0.1 * intensity
    const waveCount = 3

    let time = 0
    let frame: number

    const animate = () => {
      time += vibrationSpeed

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply vibration to logo
      const offsetX = Math.sin(time * 25) * vibrationAmount
      const offsetY = Math.cos(time * 30) * vibrationAmount
      const rotation = Math.sin(time * 15) * vibrationAmount * 0.5

      logo.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`

      // Draw pressure waves
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const maxRadius = Math.max(canvas.width, canvas.height) * 0.6

      for (let i = 0; i < waveCount; i++) {
        const progress = (time * waveSpeed + i / waveCount) % 1
        const radius = progress * maxRadius
        const opacity = 0.4 * (1 - progress)

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = 1 + (1 - progress) * 2
        ctx.stroke()
      }

      // Draw distortion waves
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const waveOffset = Math.sin(time * 20) * 5

        const startX = centerX + Math.cos(angle) * 40
        const startY = centerY + Math.sin(angle) * 40

        const endX = centerX + Math.cos(angle) * (80 + waveOffset)
        const endY = centerY + Math.sin(angle) * (80 + waveOffset)

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      frame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [intensity])

  return (
    <div ref={containerRef} className="relative w-48 h-48 flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div ref={logoRef} className="relative z-10">
        <div className="relative w-40 h-40">
          <Image src="/logo-tpf.png" alt="TPulseFi Logo" width={160} height={160} className="w-full h-full" priority />
        </div>
      </div>
    </div>
  )
}
