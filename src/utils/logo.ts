/** Tamanho que cabe em `maxW` x `maxH` mantendo a proporção; nunca amplia além do original. */
export function fitSize(width: number, height: number, maxW: number, maxH: number): { width: number; height: number } {
  const scale = Math.min(1, maxW / width, maxH / height)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * Logo para a térmica: canvas com a largura da área útil (centralizada, fundo branco para PNG transparente)
 * e até `maxH` pontos de altura (uma faixa só de GS v 0).
 */
export async function logoToCanvas(blob: Blob, area: number, maxH = 140): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(blob)
  const size = fitSize(bitmap.width, bitmap.height, Math.min(area, 280), maxH)
  const canvas = document.createElement('canvas')
  canvas.width = area
  canvas.height = size.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, Math.floor((area - size.width) / 2), 0, size.width, size.height)
  bitmap.close()
  return canvas
}
