export function PageLoading({
  label = '読み込んでいます',
}: {
  label?: string
}) {
  return (
    <div
      className="mx-auto grid min-h-[55vh] w-[min(1100px,calc(100%-48px))] place-items-center"
      role="status"
    >
      <div className="text-center">
        <span className="mx-auto block size-10 animate-spin rounded-full border-2 border-[#18352f]/15 border-t-[#b85635] motion-reduce:animate-none" />
        <p className="mt-4 text-sm text-[#18352f]/60">{label}</p>
      </div>
    </div>
  )
}

export function PageError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="mx-auto grid min-h-[55vh] w-[min(700px,calc(100%-48px))] place-items-center py-16">
      <div className="w-full border border-[#b85635]/30 bg-white/55 p-8 text-center">
        <p className="font-serif text-2xl">読み込みに失敗しました</p>
        <p className="mt-3 text-sm leading-7 text-[#18352f]/65">{message}</p>
        {onRetry && (
          <button
            className="mt-6 border border-[#18352f] bg-[#18352f] px-5 py-3 text-xs font-bold text-white"
            onClick={onRetry}
            type="button"
          >
            もう一度試す
          </button>
        )}
      </div>
    </div>
  )
}
