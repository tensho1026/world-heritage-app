export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav
      className="mt-8 flex items-center justify-center gap-4 text-xs"
      aria-label="ページ移動"
    >
      <button
        className="border border-[#18352f]/25 px-4 py-2 font-bold disabled:opacity-35"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        type="button"
      >
        ← 前へ
      </button>
      <span aria-live="polite">
        {page} / {totalPages} ページ（全{total}件）
      </span>
      <button
        className="border border-[#18352f]/25 px-4 py-2 font-bold disabled:opacity-35"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        次へ →
      </button>
    </nav>
  )
}
