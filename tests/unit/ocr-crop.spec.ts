import { describe, it, expect, beforeEach } from 'vitest'
import {
  extractImageData,
  findBoundingBox,
  cropToDigit,
  extractAndCropDigit,
  BoundingBox,
} from '../../src/utils'

/**
 * Testes unitários para o pipeline OCR: extração, bounding box e crop
 * Cenários: canvas vazio, dígito pequeno, dígito grande, traços finos, etc.
 */

describe('OCR: Image Processing Pipeline', () => {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    // Cria canvas 100×100 vazio
    canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas context not available')
    ctx = context

    // Limpa canvas (fundo transparente)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  })

  describe('extractImageData', () => {
    it('extrai ImageData válido do canvas', () => {
      const imageData = extractImageData(canvas)
      expect(imageData).toBeDefined()
      expect(imageData.width).toBe(100)
      expect(imageData.height).toBe(100)
      expect(imageData.data.length).toBe(100 * 100 * 4) // RGBA
    })

    it('canvas vazio tem todos pixels com alpha = 0', () => {
      const imageData = extractImageData(canvas)
      let allTransparent = true
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] !== 0) allTransparent = false
      }
      expect(allTransparent).toBe(true)
    })

    it('lança erro se context não está disponível', () => {
      const mockCanvas = {
        getContext: () => null,
        width: 100,
        height: 100,
      } as any as HTMLCanvasElement

      expect(() => extractImageData(mockCanvas)).toThrow()
    })
  })

  describe('findBoundingBox', () => {
    it('retorna null para canvas vazio', () => {
      const imageData = extractImageData(canvas)
      const box = findBoundingBox(imageData)
      expect(box).toBeNull()
    })

    it('calcula bounding box correto para dígito no centro', () => {
      // Desenha quadrado 20×20 no centro (40,40 a 60,60)
      ctx.fillStyle = 'black'
      ctx.fillRect(40, 40, 20, 20)

      const imageData = extractImageData(canvas)
      const box = findBoundingBox(imageData)

      expect(box).not.toBeNull()
      if (box) {
        // Com padding padrão de 10px
        expect(box.x1).toBeLessThanOrEqual(40)
        expect(box.y1).toBeLessThanOrEqual(40)
        expect(box.x2).toBeGreaterThanOrEqual(60)
        expect(box.y2).toBeGreaterThanOrEqual(60)
      }
    })

    it('cenário: dígito minúsculo no canto', () => {
      // Desenha 3×3 pixels no canto superior esquerdo
      ctx.fillStyle = 'black'
      ctx.fillRect(5, 5, 3, 3)

      const imageData = extractImageData(canvas)
      const box = findBoundingBox(imageData)

      expect(box).not.toBeNull()
      if (box) {
        // Verifica se isola o traço com margem
        expect(box.x1).toBeLessThanOrEqual(5)
        expect(box.y1).toBeLessThanOrEqual(5)
        expect(box.x2).toBeGreaterThanOrEqual(8) // 5+3
        expect(box.y2).toBeGreaterThanOrEqual(8)
      }
    })

    it('cenário: dígito gigante ocupando 90% do canvas', () => {
      // Desenha quadrado 90×90
      ctx.fillStyle = 'black'
      ctx.fillRect(5, 5, 90, 90)

      const imageData = extractImageData(canvas)
      const box = findBoundingBox(imageData, 50, 10)

      expect(box).not.toBeNull()
      if (box) {
        // Bounding box não deve ultrapassar limites do canvas
        expect(box.x1).toBeGreaterThanOrEqual(0)
        expect(box.y1).toBeGreaterThanOrEqual(0)
        expect(box.x2).toBeLessThanOrEqual(100)
        expect(box.y2).toBeLessThanOrEqual(100)
      }
    })

    it('respeita alphaThreshold customizado', () => {
      // Desenha com alpha baixo (50)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(30, 30, 40, 40)

      const imageData = extractImageData(canvas)

      // Com threshold alto, não encontra o traço
      const box1 = findBoundingBox(imageData, 200, 10)
      expect(box1).toBeNull()

      // Com threshold baixo, encontra
      const box2 = findBoundingBox(imageData, 25, 10)
      expect(box2).not.toBeNull()
    })

    it('respeita padding customizado', () => {
      // Desenha quadrado 20×20 no centro
      ctx.fillStyle = 'black'
      ctx.fillRect(40, 40, 20, 20)

      const imageData = extractImageData(canvas)

      // Sem padding
      const box1 = findBoundingBox(imageData, 50, 0)
      // Com padding 20px
      const box2 = findBoundingBox(imageData, 50, 20)

      expect(box1).not.toBeNull()
      expect(box2).not.toBeNull()

      if (box1 && box2) {
        // Com padding maior, box2 deve ser maior
        const area1 = (box1.x2 - box1.x1) * (box1.y2 - box1.y1)
        const area2 = (box2.x2 - box2.x1) * (box2.y2 - box2.y1)
        expect(area2).toBeGreaterThan(area1)
      }
    })

    it('limita padding aos bounds do canvas', () => {
      // Desenha no canto, padding tentaria sair dos limites
      ctx.fillStyle = 'black'
      ctx.fillRect(1, 1, 3, 3)

      const imageData = extractImageData(canvas)
      const box = findBoundingBox(imageData, 50, 20)

      expect(box).not.toBeNull()
      if (box) {
        // Não deve sair dos limites [0, 100]
        expect(box.x1).toBeGreaterThanOrEqual(0)
        expect(box.y1).toBeGreaterThanOrEqual(0)
        expect(box.x2).toBeLessThanOrEqual(100)
        expect(box.y2).toBeLessThanOrEqual(100)
      }
    })

    it('retorna coordenadas válidas (x2 > x1, y2 > y1)', () => {
      ctx.fillStyle = 'black'
      ctx.fillRect(20, 20, 60, 60)

      const imageData = extractImageData(canvas)
      const box = findBoundingBox(imageData)

      expect(box).not.toBeNull()
      if (box) {
        expect(box.x2).toBeGreaterThan(box.x1)
        expect(box.y2).toBeGreaterThan(box.y1)
      }
    })
  })

  describe('cropToDigit', () => {
    beforeEach(() => {
      // Desenha quadrado 20×20 no centro para crop
      ctx.fillStyle = 'black'
      ctx.fillRect(40, 40, 20, 20)
    })

    it('cria novo canvas com dimensões corretas', () => {
      const box: BoundingBox = { x1: 30, y1: 30, x2: 70, y2: 70 }
      const cropped = cropToDigit(canvas, box)

      expect(cropped.width).toBe(70 - 30) // 40
      expect(cropped.height).toBe(70 - 30) // 40
    })

    it('canvas original permanece intocado (função pura)', () => {
      const originalWidth = canvas.width
      const originalHeight = canvas.height

      const box: BoundingBox = { x1: 20, y1: 20, x2: 80, y2: 80 }
      cropToDigit(canvas, box)

      expect(canvas.width).toBe(originalWidth)
      expect(canvas.height).toBe(originalHeight)
    })

    it('canvas resultante é menor que original', () => {
      const box: BoundingBox = { x1: 20, y1: 20, x2: 80, y2: 80 }
      const cropped = cropToDigit(canvas, box)

      expect(cropped.width).toBeLessThanOrEqual(canvas.width)
      expect(cropped.height).toBeLessThanOrEqual(canvas.height)
    })

    it('lança erro para dimensões inválidas', () => {
      const invalidBox: BoundingBox = { x1: 50, y1: 50, x2: 50, y2: 50 }
      expect(() => cropToDigit(canvas, invalidBox)).toThrow()
    })

    it('copia pixels corretamente do canvas original', () => {
      const box: BoundingBox = { x1: 40, y1: 40, x2: 60, y2: 60 }
      const cropped = cropToDigit(canvas, box)

      // Verifica se a região recortada contém pixels pretos
      const croppedImageData = cropped.getContext('2d')?.getImageData(0, 0, cropped.width, cropped.height)
      expect(croppedImageData).toBeDefined()

      if (croppedImageData) {
        // Verifica se há pixels não-transparentes (nosso quadrado de 20×20)
        let hasPixels = false
        for (let i = 3; i < croppedImageData.data.length; i += 4) {
          if (croppedImageData.data[i] > 0) {
            hasPixels = true
            break
          }
        }
        expect(hasPixels).toBe(true)
      }
    })
  })

  describe('extractAndCropDigit (Pipeline Completo)', () => {
    it('retorna null para canvas vazio', () => {
      const result = extractAndCropDigit(canvas)
      expect(result).toBeNull()
    })

    it('retorna canvas recortado para dígito válido', () => {
      // Desenha dígito
      ctx.fillStyle = 'black'
      ctx.fillRect(30, 30, 40, 40)

      const result = extractAndCropDigit(canvas)

      expect(result).not.toBeNull()
      if (result) {
        expect(result.width).toBeGreaterThan(0)
        expect(result.height).toBeGreaterThan(0)
        expect(result.width).toBeLessThanOrEqual(canvas.width)
        expect(result.height).toBeLessThanOrEqual(canvas.height)
      }
    })

    it('cenário: traço muito fino não desaparece', () => {
      // Desenha linha de 1px
      ctx.fillStyle = 'black'
      ctx.fillRect(45, 45, 1, 10)

      const result = extractAndCropDigit(canvas)

      expect(result).not.toBeNull()
      if (result) {
        // Margin de 10px garante que traço fino não desaparece
        expect(result.width).toBeGreaterThan(1)
        expect(result.height).toBeGreaterThan(10)
      }
    })

    it('cenário: traço com transparência (alpha baixo)', () => {
      // Desenha com opacity
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(40, 40, 20, 20)

      const result = extractAndCropDigit(canvas)

      // Com threshold padrão de 50, deve capturar traço semi-transparente
      expect(result).not.toBeNull()
    })

    it('isola apenas a área com tinta', () => {
      // Desenha dígito pequeno no canto
      ctx.fillStyle = 'black'
      ctx.fillRect(10, 10, 5, 5)

      const result = extractAndCropDigit(canvas)

      expect(result).not.toBeNull()
      if (result) {
        // Canvas recortado deve ser muito menor que original
        expect(result.width).toBeLessThan(100)
        expect(result.height).toBeLessThan(100)
      }
    })
  })

  describe('Tipos TypeScript', () => {
    it('BoundingBox tem campos x1, y1, x2, y2', () => {
      const box: BoundingBox = { x1: 0, y1: 0, x2: 10, y2: 10 }

      // Se compila, tipos estão corretos
      expect(typeof box.x1).toBe('number')
      expect(typeof box.y1).toBe('number')
      expect(typeof box.x2).toBe('number')
      expect(typeof box.y2).toBe('number')
    })
  })

  describe('Conformidade Pedagógica (Maestria)', () => {
    it('permite reconhecimento preciso isolando dígito', () => {
      // Criança desenha número em tamanho variável
      // App deve recortar apenas o dígito para OCR processar
      ctx.fillStyle = 'black'
      ctx.fillRect(20, 20, 30, 30) // Dígito grande

      const cropped = extractAndCropDigit(canvas)

      expect(cropped).not.toBeNull()
      if (cropped) {
        // Dígito foi isolado corretamente para próxima etapa (resize 28×28)
        expect(cropped.width).toBeGreaterThan(0)
        expect(cropped.height).toBeGreaterThan(0)
      }
    })

    it('trata canvas vazio com gentileza (sem crash)', () => {
      // Criança não desenha nada
      expect(() => extractAndCropDigit(canvas)).not.toThrow()

      const result = extractAndCropDigit(canvas)
      expect(result).toBeNull()

      // UI pode exibir feedback: "Desenhe um número primeiro!"
    })
  })
})
