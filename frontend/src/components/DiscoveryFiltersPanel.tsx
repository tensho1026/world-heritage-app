import type {
  ComprehensionLevel,
  DiscoveryFilterOptions,
  DiscoveryFilters,
  HeritageCategory,
} from '../types'

const categoryLabels: Record<HeritageCategory, string> = {
  Cultural: '文化遺産',
  Natural: '自然遺産',
  Mixed: '複合遺産',
}

const comprehensionLabels: Record<ComprehensionLevel, string> = {
  difficult: '難しかった',
  partial: 'だいたい分かった',
  understood: 'よく分かった',
}

export function DiscoveryFiltersPanel({
  value,
  options,
  onChange,
  onApply,
  onReset,
}: {
  value: DiscoveryFilters
  options?: DiscoveryFilterOptions
  onChange: (value: DiscoveryFilters) => void
  onApply: () => void
  onReset: () => void
}) {
  const update = <K extends keyof DiscoveryFilters>(
    key: K,
    nextValue: DiscoveryFilters[K],
  ) => onChange({ ...value, [key]: nextValue })

  return (
    <form
      className="border border-[#18352f]/15 bg-white/45 p-5"
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
    >
      <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        <label className="text-xs font-bold">
          キーワード
          <input
            className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
            onChange={(event) => update('q', event.target.value)}
            placeholder="遺産名・国名・英文"
            value={value.q ?? ''}
          />
        </label>
        <label className="text-xs font-bold">
          国
          <select
            className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
            onChange={(event) => update('country', event.target.value)}
            value={value.country ?? ''}
          >
            <option value="">すべて</option>
            {options?.countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold">
          地域
          <select
            className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
            onChange={(event) => update('region', event.target.value)}
            value={value.region ?? ''}
          >
            <option value="">すべて</option>
            {options?.regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold">
          カテゴリー
          <select
            className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
            onChange={(event) =>
              update('category', event.target.value as HeritageCategory | '')
            }
            value={value.category ?? ''}
          >
            <option value="">すべて</option>
            {options?.categories.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold">
          登録年
          <select
            className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
            onChange={(event) => update('year', event.target.value)}
            value={value.year ?? ''}
          >
            <option value="">すべて</option>
            {options?.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold">
          読了状態
          <select
            className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
            onChange={(event) =>
              update(
                'readStatus',
                event.target.value as DiscoveryFilters['readStatus'],
              )
            }
            value={value.readStatus ?? ''}
          >
            <option value="">すべて</option>
            <option value="unread">未読</option>
            <option value="read">読了済み</option>
          </select>
        </label>
        <label className="text-xs font-bold">
          理解度
          <select
            className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
            onChange={(event) =>
              update(
                'comprehension',
                event.target.value as ComprehensionLevel | '',
              )
            }
            value={value.comprehension ?? ''}
          >
            <option value="">すべて</option>
            {options?.comprehensionLevels.map((level) => (
              <option key={level} value={level}>
                {comprehensionLabels[level]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-4 pb-1 text-xs font-bold">
          <label className="flex items-center gap-2">
            <input
              checked={value.featured ?? false}
              onChange={(event) => update('featured', event.target.checked)}
              type="checkbox"
            />
            有名のみ
          </label>
          <label className="flex items-center gap-2">
            <input
              checked={value.favorite ?? false}
              onChange={(event) => update('favorite', event.target.checked)}
              type="checkbox"
            />
            お気に入りのみ
          </label>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="bg-[#18352f] px-5 py-2.5 text-xs font-bold text-white"
          type="submit"
        >
          この条件で探す
        </button>
        <button
          className="border border-[#18352f]/25 px-5 py-2.5 text-xs font-bold"
          onClick={onReset}
          type="button"
        >
          条件をリセット
        </button>
      </div>
    </form>
  )
}
