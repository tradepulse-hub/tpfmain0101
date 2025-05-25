"use client"

import { useState, useEffect } from "react"
import Image, { type ImageProps } from "next/image"

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string
  localFallback?: boolean
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = "/abstract-colorful-swirls.png",
  localFallback = true,
  ...rest
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Função para verificar se a URL é válida
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  // Função para verificar se a string é uma URL ou um caminho local
  const isExternalUrl = (path: string) => {
    return path.startsWith("http://") || path.startsWith("https://")
  }

  // Função para normalizar o caminho da imagem
  const normalizeSrc = (imageSrc: string | null | undefined) => {
    if (!imageSrc) return fallbackSrc

    // Se for uma URL externa válida, use-a diretamente
    if (isExternalUrl(imageSrc) && isValidUrl(imageSrc)) {
      return imageSrc
    }

    // Se for um caminho local, certifique-se de que começa com "/"
    if (!imageSrc.startsWith("/") && !imageSrc.startsWith("data:")) {
      return `/${imageSrc}`
    }

    return imageSrc
  }

  useEffect(() => {
    // Normalizar o src inicial
    const normalizedSrc = normalizeSrc(src as string)
    setImgSrc(normalizedSrc)

    // Pré-carregar a imagem para verificar se ela existe
    if (normalizedSrc && !normalizedSrc.startsWith("data:")) {
      const img = new Image()
      img.src = normalizedSrc
      img.onload = () => {
        setLoaded(true)
        setError(false)
      }
      img.onerror = () => {
        console.warn(`Failed to load image: ${normalizedSrc}`)
        setError(true)
        setImgSrc(fallbackSrc)
      }
    }
  }, [src, fallbackSrc])

  // Função para lidar com erros de carregamento
  const handleError = () => {
    console.warn(`Error loading image: ${imgSrc}`)
    setError(true)
    setImgSrc(fallbackSrc)
  }

  // Função para lidar com o carregamento bem-sucedido
  const handleLoad = () => {
    setLoaded(true)
    setError(false)
  }

  // Se ainda não temos um src, mostrar um placeholder
  if (!imgSrc) {
    return (
      <div
        className="bg-gray-800 animate-pulse rounded-md flex items-center justify-center"
        style={{ width: rest.width, height: rest.height }}
      >
        <svg
          className="w-10 h-10 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: rest.width, height: rest.height }}>
      {!loaded && !error && (
        <div
          className="absolute inset-0 bg-gray-800 animate-pulse rounded-md flex items-center justify-center"
          style={{ width: rest.width, height: rest.height }}
        >
          <svg
            className="w-10 h-10 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      <Image
        {...rest}
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          ...rest.style,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
    </div>
  )
}
