import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { deleteHighlight, updateHighlight } from '../api/highlights'
import type { ArticleHighlight } from '../types'

const reasonLabels: Record<string, string> = {
  vocabulary: '語彙が分からない',
  grammar: '文法・構文が難しい',
  'long-sentence': '文が長くて追えない',
  reference: '指示語・修飾先が不明',
  other: 'その他',
}

export function HighlightsPanel({
  heritageSiteId,
  highlights,
}: {
  heritageSiteId: string
  highlights: ArticleHighlight[]
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<number | null>(null)
  const [noteJa, setNoteJa] = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['highlights', heritageSiteId] })
  const remove = useMutation({
    mutationFn: deleteHighlight,
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: (highlight: ArticleHighlight) =>
      updateHighlight(highlight.id, {
        noteJa,
        difficultyReason: highlight.difficultyReason,
        reasonDetail,
      }),
    onSuccess: () => {
      setEditing(null)
      void invalidate()
    },
  })

  if (!highlights.length) {
    return (
      <p className="text-xs leading-6 text-[#18352f]/48">
        ハイライトモードで気になる英文を選択すると、ここにメモが残ります。
      </p>
    )
  }

  return (
    <ol className="space-y-4">
      {highlights.map((highlight) => (
        <li className="border-l-4 border-[#e7c778] pl-4" key={highlight.id}>
          <blockquote className="text-xs leading-6">
            “{highlight.selectedText}”
          </blockquote>
          <p className="mt-1 text-[0.65rem] font-bold text-[#b85635]">
            {reasonLabels[highlight.difficultyReason ?? ''] ?? 'メモ'}
            {highlight.reasonDetail ? ` · ${highlight.reasonDetail}` : ''}
          </p>
          {editing === highlight.id ? (
            <div className="mt-2">
              <textarea
                className="min-h-20 w-full border border-[#18352f]/20 bg-white p-2 text-xs"
                onChange={(event) => setNoteJa(event.target.value)}
                value={noteJa}
              />
              <input
                className="mt-2 w-full border border-[#18352f]/20 bg-white p-2 text-xs"
                onChange={(event) => setReasonDetail(event.target.value)}
                placeholder="理由の補足"
                value={reasonDetail}
              />
              <button
                className="mt-2 bg-[#18352f] px-3 py-2 text-[0.65rem] font-bold text-white"
                onClick={() => update.mutate(highlight)}
                type="button"
              >
                更新
              </button>
            </div>
          ) : (
            highlight.noteJa && (
              <p className="mt-2 text-xs leading-5 text-[#18352f]/60">
                {highlight.noteJa}
              </p>
            )
          )}
          <div className="mt-2 flex gap-3 text-[0.62rem] font-bold">
            <button
              className="underline"
              onClick={() => {
                setEditing(highlight.id)
                setNoteJa(highlight.noteJa)
                setReasonDetail(highlight.reasonDetail)
              }}
              type="button"
            >
              編集
            </button>
            <button
              className="text-[#b85635] underline"
              disabled={remove.isPending}
              onClick={() => remove.mutate(highlight.id)}
              type="button"
            >
              削除
            </button>
          </div>
        </li>
      ))}
    </ol>
  )
}
