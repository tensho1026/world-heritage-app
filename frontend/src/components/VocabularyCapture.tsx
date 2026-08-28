import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import { translateSelection } from '../api/translations'
import { saveVocabulary } from '../api/vocabulary'

type SelectionDetails = {
  expression: string
  sourceSentenceEn: string
  sectionType: string
  x: number
  y: number
}

export function SelectableText({
  text,
  sectionType,
  className,
  as: Component = 'p',
  sectionKey,
  highlights = [],
}: {
  text: string
  sectionType: string
  className?: string
  as?: 'p' | 'span'
  sectionKey?: string
  highlights?: Array<{
    id: number
    startOffset: number
    endOffset: number
    noteJa: string
    difficultyReason: string | null
  }>
}) {
  const ranges = highlights
    .filter(
      (item) =>
        item.startOffset >= 0 &&
        item.endOffset <= text.length &&
        item.endOffset > item.startOffset,
    )
    .sort((a, b) => a.startOffset - b.startOffset)
  const segments: Array<{
    text: string
    highlight?: (typeof ranges)[number]
  }> = []
  let cursor = 0
  for (const range of ranges) {
    if (range.startOffset < cursor) continue
    if (range.startOffset > cursor) {
      segments.push({ text: text.slice(cursor, range.startOffset) })
    }
    segments.push({
      text: text.slice(range.startOffset, range.endOffset),
      highlight: range,
    })
    cursor = range.endOffset
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) })

  const tokenized = (value: string, keyPrefix: string) =>
    value.split(/(\b[A-Za-z]+(?:[’'-][A-Za-z]+)*\b)/g).map((token, index) =>
      /^[A-Za-z]+(?:[’'-][A-Za-z]+)*$/.test(token) ? (
        <span data-vocabulary-word="true" key={`${keyPrefix}-${index}`}>
          {token}
        </span>
      ) : (
        token
      ),
    )
  return (
    <Component
      className={className}
      data-section-type={sectionType}
      data-highlight-section={sectionKey}
      data-source-text={text}
    >
      {segments.map((segment, index) =>
        segment.highlight ? (
          <mark
            className="rounded-sm bg-[#e7c778]/65 px-0.5 text-inherit"
            data-highlight-id={segment.highlight.id}
            key={`highlight-${segment.highlight.id}`}
            title={
              segment.highlight.noteJa ||
              segment.highlight.difficultyReason ||
              '保存したハイライト'
            }
          >
            {tokenized(segment.text, `marked-${index}`)}
          </mark>
        ) : (
          <span key={`plain-${index}`}>
            {tokenized(segment.text, `plain-${index}`)}
          </span>
        ),
      )}
    </Component>
  )
}

export function VocabularyCapture({
  enabled,
  heritageSiteId,
  children,
}: {
  enabled: boolean
  heritageSiteId: string
  children: ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [details, setDetails] = useState<SelectionDetails | null>(null)
  const [savedMessage, setSavedMessage] = useState('')
  const queryClient = useQueryClient()
  const translation = useMutation({
    mutationFn: (selection: SelectionDetails) =>
      translateSelection(selection.expression, selection.sourceSentenceEn),
  })
  const save = useMutation({
    mutationFn: () => {
      if (!details || !translation.data) throw new Error('No translation')
      return saveVocabulary({
        expression: details.expression,
        translationJa: translation.data.translationJa,
        sourceSentenceEn: details.sourceSentenceEn,
        heritageSiteId,
        sectionType: details.sectionType,
      })
    },
    onSuccess: () => {
      setSavedMessage('単語帳に保存しました')
      void queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  function showSelection(next: SelectionDetails) {
    setDetails(next)
    setSavedMessage('')
    translation.reset()
    save.reset()
  }

  function handleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!enabled) return
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed && selection.toString().trim())
      return
    const target = event.target as HTMLElement
    const word = target.closest<HTMLElement>('[data-vocabulary-word]')
    const source = word?.closest<HTMLElement>('[data-source-text]')
    if (!word || !source) return
    const expression = word.textContent?.trim() ?? ''
    const sourceText = source.dataset.sourceText ?? ''
    showSelection({
      expression,
      sourceSentenceEn: sentenceContaining(sourceText, expression),
      sectionType: source.dataset.sectionType ?? 'description',
      x: Math.min(event.clientX, window.innerWidth - 340),
      y: Math.min(event.clientY + 18, window.innerHeight - 250),
    })
  }

  function handleNativeSelection() {
    if (!enabled) return
    const selection = window.getSelection()
    const expression = selection?.toString().replace(/\s+/g, ' ').trim() ?? ''
    if (
      !selection ||
      selection.isCollapsed ||
      !expression ||
      expression.length > 100
    )
      return
    const startElement = parentElement(selection.anchorNode)
    const endElement = parentElement(selection.focusNode)
    const startSource = startElement?.closest<HTMLElement>('[data-source-text]')
    const endSource = endElement?.closest<HTMLElement>('[data-source-text]')
    if (!startSource || startSource !== endSource) return
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const sourceText = startSource.dataset.sourceText ?? ''
    showSelection({
      expression,
      sourceSentenceEn: sentenceContaining(sourceText, expression),
      sectionType: startSource.dataset.sectionType ?? 'description',
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 340)),
      y: Math.max(12, Math.min(rect.bottom + 10, window.innerHeight - 250)),
    })
  }

  function handleTouchEnd() {
    window.setTimeout(handleNativeSelection, 50)
  }

  return (
    <div
      className={enabled ? 'vocabulary-capture--enabled' : ''}
      onClick={handleClick}
      onMouseUp={handleNativeSelection}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {children}
      {enabled && details && (
        <aside
          className="fixed z-50 w-[min(330px,calc(100vw-24px))] border border-[#18352f]/25 bg-[#fbf8f1] p-4 shadow-[0_18px_45px_rgb(24_53_47_/_22%)]"
          style={{ left: details.x, top: details.y }}
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-4">
            <strong className="font-serif text-lg">{details.expression}</strong>
            <button
              className="text-lg leading-none text-[#18352f]/45"
              onClick={() => setDetails(null)}
              type="button"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#18352f]/55">
            {details.sourceSentenceEn}
          </p>
          {!translation.data && (
            <button
              className="mt-4 w-full bg-[#18352f] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              disabled={translation.isPending}
              onClick={() => translation.mutate(details)}
              type="button"
            >
              {translation.isPending ? 'DeepLで翻訳中…' : '訳を見る'}
            </button>
          )}
          {translation.isError && (
            <p className="mt-3 text-xs leading-5 text-[#b85635]">
              {getApiErrorMessage(translation.error)}
            </p>
          )}
          {translation.data && (
            <div className="mt-4 border-t border-[#18352f]/15 pt-3">
              <p className="font-serif text-base">
                {translation.data.translationJa}
              </p>
              <button
                className="mt-3 w-full border border-[#b85635] bg-[#b85635] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                disabled={save.isPending || Boolean(savedMessage)}
                onClick={() => save.mutate()}
                type="button"
              >
                {save.isPending ? '保存中…' : savedMessage || '単語帳に保存'}
              </button>
            </div>
          )}
          {save.isError && (
            <p className="mt-2 text-xs text-[#b85635]">
              {getApiErrorMessage(save.error)}
            </p>
          )}
        </aside>
      )}
    </div>
  )
}

function parentElement(node: Node | null) {
  if (!node) return null
  return node instanceof HTMLElement ? node : node.parentElement
}

function sentenceContaining(source: string, expression: string) {
  const lowerSource = source.toLocaleLowerCase('en')
  const index = lowerSource.indexOf(expression.toLocaleLowerCase('en'))
  if (index < 0) return source.trim()
  const before = source.slice(0, index)
  const after = source.slice(index + expression.length)
  const startBoundary = Math.max(
    before.lastIndexOf('.'),
    before.lastIndexOf('!'),
    before.lastIndexOf('?'),
  )
  const candidates = [
    after.indexOf('.'),
    after.indexOf('!'),
    after.indexOf('?'),
  ]
    .filter((value) => value >= 0)
    .sort((a, b) => a - b)
  const endBoundary = candidates[0]
  const start = startBoundary < 0 ? 0 : startBoundary + 1
  const end =
    endBoundary === undefined
      ? source.length
      : index + expression.length + endBoundary + 1
  return source.slice(start, end).trim()
}
