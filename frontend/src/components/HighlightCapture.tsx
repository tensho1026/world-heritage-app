import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import { saveHighlight } from '../api/highlights'
import {
  buildGrammarCheckUrl,
  buildSentenceRewriteUrl,
} from '../lib/learning-tools'

type HighlightSelection = {
  sectionKey: string
  selectedText: string
  sourceText: string
  startOffset: number
  endOffset: number
}

const reasons = [
  ['vocabulary', '語彙が分からない'],
  ['grammar', '文法・構文が難しい'],
  ['long-sentence', '文が長くて追えない'],
  ['reference', '指示語・修飾先が不明'],
  ['other', 'その他'],
] as const

export function HighlightCapture({
  enabled,
  heritageSiteId,
  heritageName,
  children,
}: {
  enabled: boolean
  heritageSiteId: string
  heritageName: string
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [selection, setSelection] = useState<HighlightSelection | null>(null)
  const [noteJa, setNoteJa] = useState('')
  const [difficultyReason, setDifficultyReason] = useState('grammar')
  const [reasonDetail, setReasonDetail] = useState('')
  const mutation = useMutation({
    mutationFn: () => {
      if (!selection) throw new Error('英文を選択してください。')
      return saveHighlight({
        heritageSiteId,
        sectionKey: selection.sectionKey,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        selectedText: selection.selectedText,
        noteJa,
        difficultyReason,
        reasonDetail,
      })
    },
    onSuccess: () => {
      setSelection(null)
      setNoteJa('')
      setReasonDetail('')
      window.getSelection()?.removeAllRanges()
      void queryClient.invalidateQueries({
        queryKey: ['highlights', heritageSiteId],
      })
    },
  })

  function handleSelection() {
    if (!enabled) return
    const nativeSelection = window.getSelection()
    if (
      !nativeSelection ||
      nativeSelection.isCollapsed ||
      !nativeSelection.rangeCount
    )
      return
    const range = nativeSelection.getRangeAt(0)
    const startElement = parentElement(range.startContainer)
    const endElement = parentElement(range.endContainer)
    const source = startElement?.closest<HTMLElement>(
      '[data-highlight-section]',
    )
    if (!source || source !== endElement?.closest('[data-highlight-section]'))
      return
    const sectionKey = source.dataset.highlightSection
    const sourceText = source.dataset.sourceText
    if (!sectionKey || !sourceText) return
    let startOffset = offsetIn(source, range.startContainer, range.startOffset)
    let endOffset = offsetIn(source, range.endContainer, range.endOffset)
    if (endOffset < startOffset)
      [startOffset, endOffset] = [endOffset, startOffset]
    const raw = sourceText.slice(startOffset, endOffset)
    const leadingWhitespace = raw.length - raw.trimStart().length
    const selectedText = raw.trim()
    if (!selectedText || selectedText.length > 4_000) return
    startOffset += leadingWhitespace
    endOffset = startOffset + selectedText.length
    setSelection({
      sectionKey,
      sourceText,
      selectedText,
      startOffset,
      endOffset,
    })
    mutation.reset()
  }

  const context = selection?.sourceText ?? ''

  return (
    <div
      className={enabled ? 'highlight-capture--enabled' : ''}
      onMouseUp={handleSelection}
      onTouchEnd={() => window.setTimeout(handleSelection, 50)}
    >
      {children}
      {enabled && selection && (
        <aside className="mt-5 border border-[#c98c47]/55 bg-[#fffaf0] p-5 shadow-[6px_6px_0_rgb(231_199_120_/_28%)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.6rem] font-extrabold tracking-[0.16em] text-[#b85635]">
                HIGHLIGHT & NOTE
              </p>
              <blockquote className="mt-2 font-serif text-lg leading-7">
                “{selection.selectedText}”
              </blockquote>
            </div>
            <button
              aria-label="閉じる"
              className="text-xl text-[#18352f]/45"
              onClick={() => setSelection(null)}
              type="button"
            >
              ×
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 max-[620px]:grid-cols-1">
            <label className="text-xs font-bold">
              分からなかった理由
              <select
                className="mt-2 w-full border border-[#18352f]/20 bg-white px-3 py-2.5 font-normal"
                onChange={(event) => setDifficultyReason(event.target.value)}
                value={difficultyReason}
              >
                {reasons.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold">
              理由の補足
              <input
                className="mt-2 w-full border border-[#18352f]/20 bg-white px-3 py-2.5 font-normal"
                onChange={(event) => setReasonDetail(event.target.value)}
                placeholder="例：whichの修飾先が不明"
                value={reasonDetail}
              />
            </label>
          </div>
          <label className="mt-3 block text-xs font-bold">
            日本語メモ
            <textarea
              className="mt-2 min-h-24 w-full border border-[#18352f]/20 bg-white px-3 py-2.5 font-normal leading-6"
              onChange={(event) => setNoteJa(event.target.value)}
              placeholder="自分なりの解釈や注意点"
              value={noteJa}
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="bg-[#b85635] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              type="button"
            >
              {mutation.isPending ? '保存中…' : '黄色でハイライト保存'}
            </button>
            <a
              className="border border-[#18352f]/25 px-4 py-2.5 text-xs font-bold"
              href={buildGrammarCheckUrl(
                selection.selectedText,
                context,
                heritageName,
              )}
              rel="noreferrer"
              target="_blank"
            >
              文法・構文を確認 ↗
            </a>
            {(['B1', 'A2'] as const).map((level) => (
              <a
                className="border border-[#18352f]/25 px-4 py-2.5 text-xs font-bold"
                href={buildSentenceRewriteUrl(
                  selection.selectedText,
                  context,
                  heritageName,
                  level,
                )}
                key={level}
                rel="noreferrer"
                target="_blank"
              >
                {level}に言い換え ↗
              </a>
            ))}
          </div>
          {mutation.isError && (
            <p className="mt-3 text-xs text-[#b85635]">
              {getApiErrorMessage(mutation.error)}
            </p>
          )}
        </aside>
      )}
    </div>
  )
}

function parentElement(node: Node | null) {
  return node instanceof HTMLElement ? node : (node?.parentElement ?? null)
}

function offsetIn(container: HTMLElement, node: Node, offset: number) {
  const range = document.createRange()
  range.selectNodeContents(container)
  range.setEnd(node, offset)
  return range.toString().length
}
