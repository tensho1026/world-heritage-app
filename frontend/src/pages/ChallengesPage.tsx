import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  createChallenge,
  deleteChallenge,
  getChallenges,
  updateChallenge,
} from '../api/challenges'
import { getApiErrorMessage } from '../api/client'
import { getDiscoveryFilters, getThemes } from '../api/discovery'
import { AppShell } from '../components/AppShell'
import { PageError, PageLoading } from '../components/AsyncState'
import type {
  ChallengeMetric,
  MonthlyChallenge,
  MonthlyChallengeInput,
} from '../types'

const metricLabels: Record<ChallengeMetric, string> = {
  unique_sites: '世界遺産を読む（ユニーク件数）',
  new_countries: '新しい国を読む',
  filtered_reads: '条件に合う世界遺産を読む',
  vocabulary_saved: '新しい語彙を保存する',
  vocabulary_reviews: '語彙を復習する',
  quiz_attempts: '読解クイズに挑戦する',
  dictation_attempts: 'ディクテーションに挑戦する',
  writing_attempts: '英作文に挑戦する',
}

function currentMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return `${values.year}-${values.month}`
}

function emptyForm(month: string): MonthlyChallengeInput {
  return {
    name: '',
    month,
    metric: 'unique_sites',
    target: 5,
    filters: {},
    note: '',
  }
}

export default function ChallengesPage() {
  const queryClient = useQueryClient()
  const [month, setMonth] = useState(currentMonth)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MonthlyChallengeInput>(() =>
    emptyForm(currentMonth()),
  )
  const challenges = useQuery({
    queryKey: ['monthly-challenges', month],
    queryFn: () => getChallenges(month),
  })
  const filterOptions = useQuery({
    queryKey: ['discovery-filters'],
    queryFn: getDiscoveryFilters,
  })
  const themes = useQuery({ queryKey: ['themes'], queryFn: getThemes })
  const save = useMutation({
    mutationFn: () =>
      editingId ? updateChallenge(editingId, form) : createChallenge(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['monthly-challenges'] })
      setEditingId(null)
      setForm(emptyForm(month))
    },
  })
  const remove = useMutation({
    mutationFn: deleteChallenge,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['monthly-challenges'] }),
  })

  function edit(challenge: MonthlyChallenge) {
    setEditingId(challenge.id)
    setForm({
      name: challenge.name,
      month: challenge.month,
      metric: challenge.metric,
      target: challenge.target,
      filters: challenge.filters,
      note: challenge.note,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppShell>
      <section className="mx-auto min-h-[75vh] w-[min(1120px,calc(100%-48px))] py-12 max-[760px]:w-[calc(100%-32px)]">
        <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635]">
          MONTHLY CHALLENGES
        </p>
        <h1 className="mt-3 font-serif text-[clamp(2.8rem,5vw,4.5rem)]">
          今月の目標を、自分で決める
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#18352f]/60">
          読む地域も、学習量も、自分のペースに合わせて設定できます。進捗は既存の学習記録から自動集計されます。
        </p>

        <form
          className="mt-9 border border-[#18352f]/15 bg-white/45 p-6"
          onSubmit={(event) => {
            event.preventDefault()
            save.mutate()
          }}
        >
          <h2 className="font-serif text-2xl">
            {editingId ? 'チャレンジを編集' : '新しいチャレンジ'}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 max-[680px]:grid-cols-1">
            <label className="text-xs font-bold">
              チャレンジ名
              <input
                className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
                maxLength={120}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="例: 自然遺産を5件読む"
                required
                value={form.name}
              />
            </label>
            <label className="text-xs font-bold">
              対象月
              <input
                className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
                onChange={(event) =>
                  setForm({ ...form, month: event.target.value })
                }
                required
                type="month"
                value={form.month}
              />
            </label>
            <label className="text-xs font-bold">
              目標の種類
              <select
                className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
                onChange={(event) =>
                  setForm({
                    ...form,
                    metric: event.target.value as ChallengeMetric,
                    filters:
                      event.target.value === 'filtered_reads'
                        ? form.filters
                        : {},
                  })
                }
                value={form.metric}
              >
                {Object.entries(metricLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold">
              目標値
              <input
                className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2.5 font-normal"
                max={10000}
                min={1}
                onChange={(event) =>
                  setForm({ ...form, target: Number(event.target.value) })
                }
                required
                type="number"
                value={form.target}
              />
            </label>
          </div>

          {form.metric === 'filtered_reads' && (
            <fieldset className="mt-5 border border-[#18352f]/12 p-4">
              <legend className="px-2 text-xs font-bold">
                読む世界遺産の条件
              </legend>
              <div className="grid grid-cols-4 gap-3 max-[850px]:grid-cols-2 max-[520px]:grid-cols-1">
                <FilterSelect
                  label="国"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      filters: { ...form.filters, country: value },
                    })
                  }
                  options={filterOptions.data?.countries ?? []}
                  value={form.filters.country ?? ''}
                />
                <FilterSelect
                  label="地域"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      filters: { ...form.filters, region: value },
                    })
                  }
                  options={filterOptions.data?.regions ?? []}
                  value={form.filters.region ?? ''}
                />
                <FilterSelect
                  label="遺産区分"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      filters: {
                        ...form.filters,
                        category:
                          value as MonthlyChallengeInput['filters']['category'],
                      },
                    })
                  }
                  options={filterOptions.data?.categories ?? []}
                  value={form.filters.category ?? ''}
                />
                <FilterSelect
                  label="テーマ"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      filters: { ...form.filters, theme: value },
                    })
                  }
                  options={(themes.data ?? []).map((theme) => ({
                    value: theme.slug,
                    label: theme.nameJa,
                  }))}
                  value={form.filters.theme ?? ''}
                />
              </div>
            </fieldset>
          )}

          <label className="mt-5 block text-xs font-bold">
            メモ（任意）
            <textarea
              className="mt-2 min-h-20 w-full border border-[#18352f]/20 bg-[#fbf8f1] p-3 font-normal"
              maxLength={1000}
              onChange={(event) =>
                setForm({ ...form, note: event.target.value })
              }
              value={form.note}
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="bg-[#18352f] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40"
              disabled={save.isPending}
              type="submit"
            >
              {save.isPending
                ? '保存中…'
                : editingId
                  ? '変更を保存'
                  : 'チャレンジを作成'}
            </button>
            {editingId && (
              <button
                className="border border-[#18352f]/25 px-5 py-2.5 text-xs font-bold"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm(month))
                }}
                type="button"
              >
                編集をやめる
              </button>
            )}
          </div>
          {save.isError && (
            <p className="mt-3 text-xs text-[#b85635]">
              {getApiErrorMessage(save.error)}
            </p>
          )}
        </form>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-bold text-[#18352f]/45">
              CHALLENGE HISTORY
            </p>
            <h2 className="mt-1 font-serif text-3xl">{month} の目標</h2>
          </div>
          <label className="text-xs font-bold">
            表示する月
            <input
              className="ml-2 border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2"
              onChange={(event) => {
                setMonth(event.target.value)
                if (!editingId) setForm(emptyForm(event.target.value))
              }}
              type="month"
              value={month}
            />
          </label>
        </div>

        {challenges.isPending && <PageLoading label="目標を集計しています" />}
        {challenges.isError && (
          <PageError
            message="月間チャレンジを取得できませんでした。"
            onRetry={() => challenges.refetch()}
          />
        )}
        {challenges.data?.length ? (
          <div className="mt-6 grid grid-cols-2 gap-5 max-[760px]:grid-cols-1">
            {challenges.data.map((challenge) => (
              <ChallengeCard
                challenge={challenge}
                key={challenge.id}
                onDelete={() => {
                  if (
                    window.confirm(
                      `「${challenge.name}」を削除しますか？この操作は取り消せません。`,
                    )
                  ) {
                    remove.mutate(challenge.id)
                  }
                }}
                onEdit={() => edit(challenge)}
              />
            ))}
          </div>
        ) : challenges.data ? (
          <p className="mt-10 text-center text-sm text-[#18352f]/50">
            この月のチャレンジはまだありません。
          </p>
        ) : null}
      </section>
    </AppShell>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<string | { value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="text-xs font-bold">
      {label}
      <select
        className="mt-2 w-full border border-[#18352f]/20 bg-[#fbf8f1] px-3 py-2 font-normal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">すべて</option>
        {options.map((option) => {
          const item =
            typeof option === 'string'
              ? { value: option, label: option }
              : option
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function ChallengeCard({
  challenge,
  onEdit,
  onDelete,
}: {
  challenge: MonthlyChallenge
  onEdit: () => void
  onDelete: () => void
}) {
  const statusLabel =
    challenge.status === 'upcoming'
      ? '開始前'
      : challenge.status === 'ended'
        ? '終了'
        : '進行中'
  return (
    <article className="border border-[#18352f]/15 bg-white/45 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.58rem] font-bold tracking-[0.1em] text-[#b85635]">
            {statusLabel} · {metricLabels[challenge.metric]}
          </p>
          <h3 className="mt-2 font-serif text-2xl">{challenge.name}</h3>
        </div>
        {challenge.completed && (
          <span className="shrink-0 bg-[#4f8871] px-2 py-1 text-[0.58rem] font-bold text-white">
            達成
          </span>
        )}
      </div>
      <div className="mt-5 flex items-end justify-between">
        <strong className="font-serif text-4xl">
          {challenge.progress}
          <span className="text-lg text-[#18352f]/45">
            {' '}
            / {challenge.target}
          </span>
        </strong>
        <span className="text-xs font-bold">{challenge.percentage}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden bg-[#18352f]/10">
        <div
          className="h-full bg-[#c98c47] transition-[width]"
          style={{ width: `${challenge.percentage}%` }}
        />
      </div>
      {challenge.note && (
        <p className="mt-4 text-xs leading-6 text-[#18352f]/55">
          {challenge.note}
        </p>
      )}
      <div className="mt-5 flex gap-4 text-xs font-bold">
        <button
          className="text-[#b85635] underline"
          onClick={onEdit}
          type="button"
        >
          編集
        </button>
        <button
          className="text-[#18352f]/45 underline"
          onClick={onDelete}
          type="button"
        >
          削除
        </button>
      </div>
    </article>
  )
}
