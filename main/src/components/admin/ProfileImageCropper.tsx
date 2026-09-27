'use client'

import classNames from 'classnames'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import { buttonClass } from './styles'

/*
 * 프로필 이미지 자르기 → 투명 PNG로 저장
 * - 그대로: 투명 PNG 아이콘용. 자르지 않고 정사각형 안에 통째로 맞춘다 (남는 곳은 투명)
 * - 원 · 사각형 · 별: 배경이 있는 사진용. 모양 밖은 투명
 * 모양을 더하려면 SHAPES에 항목과 clip 경로를 추가하면 된다.
 */

type ShapeId = 'original' | 'circle' | 'square' | 'star'

/** size×size 정사각형 안에 모양 경로를 그린다 (null이면 자르지 않음) */
const SHAPES: { id: ShapeId; label: string; clip: ((ctx: CanvasRenderingContext2D, size: number) => void) | null }[] = [
  { id: 'original', label: '그대로', clip: null },
  {
    id: 'circle',
    label: '원',
    clip: (ctx, size) => ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2),
  },
  { id: 'square', label: '사각형', clip: (ctx, size) => ctx.rect(0, 0, size, size) },
  {
    id: 'star',
    label: '별',
    clip: (ctx, size) => {
      // 꼭짓점이 위를 향한 5각 별 (안쪽 반지름 = 바깥의 0.48)
      const center = size / 2
      const outer = size / 2
      const inner = outer * 0.48
      for (let index = 0; index < 10; index++) {
        const radius = index % 2 === 0 ? outer : inner
        const angle = -Math.PI / 2 + (index * Math.PI) / 5
        const x = center + radius * Math.cos(angle)
        // 별의 무게중심이 가운데 오도록 살짝 아래로
        const y = center + outer * 0.06 + radius * Math.sin(angle)
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    },
  },
]

/** 저장 크기 (px) */
const OUTPUT = 1024
/** 화면 미리보기 크기 (CSS px) */
const PREVIEW = 288

type Framing = { zoom: number; x: number; y: number }

/** 모양 · 확대 · 위치대로 이미지를 그린다 (미리보기와 저장이 같은 함수를 쓴다) */
function draw(ctx: CanvasRenderingContext2D, image: HTMLImageElement, shape: ShapeId, framing: Framing, size: number) {
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  const clip = SHAPES.find((item) => item.id === shape)?.clip
  if (clip) {
    ctx.beginPath()
    clip(ctx, size)
    ctx.clip()
  }
  // 그대로는 통째로 보이게(contain), 모양으로 자를 때는 꽉 차게(cover)
  const fit = shape === 'original' ? Math.min : Math.max
  const scale = fit(size / image.naturalWidth, size / image.naturalHeight) * framing.zoom
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  // 위치는 저장 크기 기준 값이라 미리보기 크기에 맞게 줄인다
  const ratio = size / OUTPUT
  ctx.drawImage(image, (size - width) / 2 + framing.x * ratio, (size - height) / 2 + framing.y * ratio, width, height)
  ctx.restore()
}

export function ProfileImageCropper({
  file,
  onCancel,
  onConfirm,
}: {
  /** 자를 원본 이미지 (null이면 닫힘) */
  file: File | null
  onCancel: () => void
  /** 잘라낸 투명 PNG */
  onConfirm: (file: File) => Promise<void> | void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  // 투명 PNG는 대개 아이콘이라 '그대로', 그 밖의 사진은 '원'으로 시작
  const [shape, setShape] = useState<ShapeId>('original')
  const [framing, setFraming] = useState<Framing>({ zoom: 1, x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const drag = useRef<{ x: number; y: number } | null>(null)

  // 파일 → 이미지
  useEffect(() => {
    if (!file) return setImage(null)
    const url = URL.createObjectURL(file)
    const next = new Image()
    next.onload = () => setImage(next)
    next.src = url
    setShape(file.type === 'image/png' ? 'original' : 'circle')
    setFraming({ zoom: 1, x: 0, y: 0 })
    return () => URL.revokeObjectURL(url)
  }, [file])

  // 미리보기 다시 그리기 (선명하게 기기 픽셀 비율만큼)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const size = Math.round(PREVIEW * (window.devicePixelRatio || 1))
    canvas.width = size
    canvas.height = size
    draw(canvas.getContext('2d')!, image, shape, framing, size)
  }, [image, shape, framing])

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!drag.current) return
    // 화면에서 움직인 만큼을 저장 크기 기준으로 바꾼다
    const factor = OUTPUT / PREVIEW
    const dx = (event.clientX - drag.current.x) * factor
    const dy = (event.clientY - drag.current.y) * factor
    drag.current = { x: event.clientX, y: event.clientY }
    setFraming((current) => ({ ...current, x: current.x + dx, y: current.y + dy }))
  }, [])

  const confirm = async () => {
    if (!image) return
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    draw(canvas.getContext('2d')!, image, shape, framing, OUTPUT)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    setSaving(true)
    try {
      await onConfirm(new File([blob], 'profile.png', { type: 'image/png' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={Boolean(file)}
      onClose={() => !saving && onCancel()}
      title='프로필 이미지'
      meta='투명한 PNG 아이콘은 그대로, 배경이 있는 사진은 모양으로 오려서 저장해요.'
      footer={
        <>
          <button type='button' disabled={saving} onClick={onCancel} className={buttonClass('ghost', 'sm')}>
            취소
          </button>
          <button
            type='button'
            disabled={!image || saving}
            onClick={confirm}
            className={buttonClass('primary', 'sm', 'ml-auto')}
          >
            {saving ? '저장 중…' : '이대로 저장'}
          </button>
        </>
      }
    >
      <div className='flex flex-col items-center gap-4'>
        {/* 모양 */}
        <div className='flex w-full rounded-lg bg-tile p-0.5'>
          {SHAPES.map((item) => (
            <button
              key={item.id}
              type='button'
              onClick={() => {
                setShape(item.id)
                setFraming({ zoom: 1, x: 0, y: 0 })
              }}
              className={classNames(
                'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                shape === item.id ? 'bg-surface text-ink' : 'text-mute hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 미리보기: 체크무늬로 투명한 곳을 보여주고, 실제 표시처럼 모양을 따라 그림자 */}
        <div
          className='rounded-xl bg-[conic-gradient(#e7e7e3_25%,#f6f6f4_0_50%,#e7e7e3_0_75%,#f6f6f4_0)] bg-size-[16px_16px] p-4'
          style={{ width: PREVIEW + 32 }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: PREVIEW, height: PREVIEW }}
            className='cursor-grab touch-none drop-shadow-[0_8px_18px_rgba(17,17,17,0.18)] active:cursor-grabbing'
            onPointerDown={(event) => {
              drag.current = { x: event.clientX, y: event.clientY }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onWheel={(event) =>
              setFraming((current) => ({
                ...current,
                zoom: Math.min(4, Math.max(0.3, current.zoom * (event.deltaY < 0 ? 1.06 : 0.94))),
              }))
            }
          />
        </div>

        {/* 크기 */}
        <label className='flex w-full max-w-80 items-center gap-3 text-xs text-mute'>
          크기
          <input
            type='range'
            min={0.3}
            max={4}
            step={0.01}
            value={framing.zoom}
            onChange={(event) => setFraming((current) => ({ ...current, zoom: Number(event.target.value) }))}
            // globals.css가 input의 appearance를 지우므로 기본 슬라이더 모양을 되살린다
            className='flex-1 cursor-pointer appearance-auto accent-ink'
          />
          <button
            type='button'
            onClick={() => setFraming({ zoom: 1, x: 0, y: 0 })}
            className='rounded-md px-2 py-1 transition-colors hover:bg-tile hover:text-ink'
          >
            처음대로
          </button>
        </label>
        <p className='text-xs text-mute'>드래그해서 위치를, 슬라이더나 스크롤로 크기를 맞춰요.</p>
      </div>
    </Modal>
  )
}
