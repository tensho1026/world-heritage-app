import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import {
  getHeritage,
  getLearningState,
  getRandomHeritage,
  recordHeritageRead,
  recordHeritageView,
  undoHeritageRead,
  updateComprehension,
  updateFavorite,
  updateReadLater,
} from '../api/heritage'
import { translateArticle } from '../api/translations'
import { AppShell } from '../components/AppShell'
import { PageError } from '../components/AsyncState'
import { SpeechControls } from '../components/SpeechControls'
import {
  SelectableText,
  VocabularyCapture,
} from '../components/VocabularyCapture'
import { buildChatGptTranslationUrl } from '../lib/chatgpt'
import type {
  ArticleTranslation,
  ComprehensionLevel,
  HeritageMode,
  LearningState,
  WorldHeritageSite,
} from '../types'

const comprehensionOptions: Array<{
  value: ComprehensionLevel
  label: string
  symbol: string
}> = [
  { value: 'difficult', label: '難しかった', symbol: '△' },
  { value: 'partial', label: 'だいたい分かった', symbol: '○' },
  { value: 'understood', label: 'よく分かった', symbol: '◎' },
]

export default function RandomHeritagePage() {
  const { id: routeId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setModeState] = useState<HeritageMode>(() => {
    if (searchParams.get('mode') === 'famous') return 'famous'
    return window.localStorage.getItem('heritage-mode') === 'famous'
      ? 'famous'
      : 'all'
  })
  const [randomSequence, setRandomSequence] = useState(0)
  const [previousId, setPreviousId] = useState<string>()
  const [showTranslation, setShowTranslation] = useState(false)
  const [captureMode, setCaptureMode] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [readNotice, setReadNotice] = useState<number | null>(null)
  const viewedIdRef = useRef<string | undefined>(undefined)

  const heritageQuery = useQuery({
    queryKey: routeId
      ? ['heritage', routeId]
      : ['heritage', 'random', mode, randomSequence],
    queryFn: () =>
      routeId ? getHeritage(routeId) : getRandomHeritage(mode, previousId),
    staleTime: routeId ? 60_000 : 0,
  })
  const site = heritageQuery.data
  const learningQuery = useQuery({
    queryKey: ['learning-state', site?.uuid],
    queryFn: () => getLearningState(site!.uuid),
    enabled: Boolean(site),
  })
  const translationQuery = useQuery({
    queryKey: ['article-translation', site?.uuid],
    queryFn: () => translateArticle(site!.uuid),
    enabled: false,
    retry: false,
  })

  useEffect(() => {
    if (!site || viewedIdRef.current === site.uuid) return
    viewedIdRef.current = site.uuid
    void recordHeritageView(site.uuid)
      .then(() => queryClient.invalidateQueries({ queryKey: ['stats'] }))
      .catch(() => undefined)
  }, [queryClient, site])

  useEffect(() => {
    if (readNotice === null) return
    const timeout = window.setTimeout(() => setReadNotice(null), 30_000)
    return () => window.clearTimeout(timeout)
  }, [readNotice])

  const learningMutation = useMutation({
    mutationFn: (operation: () => Promise<LearningState>) => operation(),
    onSuccess: (data) => {
      queryClient.setQueryData<LearningState>(
        ['learning-state', data.heritageSiteId],
        (current) => ({ ...data, readCount: current?.readCount }),
      )
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
      void queryClient.invalidateQueries({ queryKey: ['read-later'] })
    },
  })
  const readMutation = useMutation({
    mutationFn: () => recordHeritageRead(site!.uuid),
    onSuccess: (record) => {
      setReadNotice(record.id)
      queryClient.setQueryData<LearningState>(
        ['learning-state', site!.uuid],
        (current) =>
          current
            ? {
                ...current,
                isReadLater: false,
                readCount: (current.readCount ?? 0) + 1,
              }
            : current,
      )
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      void queryClient.invalidateQueries({ queryKey: ['read-later'] })
      void queryClient.invalidateQueries({
        queryKey: ['learning-state', site!.uuid],
      })
    },
  })
  const undoMutation = useMutation({
    mutationFn: (readId: number) => undoHeritageRead(site!.uuid, readId),
    onSuccess: () => {
      setReadNotice(null)
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      void queryClient.invalidateQueries({
        queryKey: ['learning-state', site!.uuid],
      })
    },
  })

  function changeMode(nextMode: HeritageMode) {
    window.localStorage.setItem('heritage-mode', nextMode)
    setModeState(nextMode)
    setSearchParams(nextMode === 'famous' ? { mode: 'famous' } : {})
    setPreviousId(site?.uuid)
    setRandomSequence((value) => value + 1)
  }

  function showNext() {
    setShowTranslation(false)
    setCaptureMode(false)
    setImageFailed(false)
    setReadNotice(null)
    if (routeId) {
      navigate(`/random-heritage${mode === 'famous' ? '?mode=famous' : ''}`)
      return
    }
    setPreviousId(site?.uuid)
    setRandomSequence((value) => value + 1)
  }

  async function toggleTranslation() {
    if (showTranslation) return setShowTranslation(false)
    const result = translationQuery.data
      ? { data: translationQuery.data }
      : await translationQuery.refetch()
    if (result.data) setShowTranslation(true)
  }

  if (heritageQuery.isPending) {
    return (
      <AppShell>
        <ReaderSkeleton />
      </AppShell>
    )
  }
  if (heritageQuery.isError || !site) {
    return (
      <AppShell>
        <PageError
          message={getApiErrorMessage(heritageQuery.error)}
          onRetry={() => heritageQuery.refetch()}
        />
      </AppShell>
    )
  }

  const learning = learningQuery.data
  const translation = translationQuery.data
  const imageUrl = site.mainImageUrl ?? site.wikipediaImageUrl
  const imageSourceUrl = site.mainImageSourceUrl ?? site.wikipediaPageUrl
  const criteria = [...site.culturalCriteria, ...site.naturalCriteria]
  const speechText = [
    site.nameEn,
    site.shortDescriptionEn,
    site.descriptionEn,
    site.justificationEn,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <AppShell>
      <section className="mx-auto w-[min(1240px,calc(100%-48px))] py-10 max-[760px]:w-[min(100%-32px,720px)]">
        {!routeId && <ModeSelector mode={mode} onChange={changeMode} />}

        <div className="grid grid-cols-[minmax(320px,0.82fr)_minmax(0,1fr)] items-center gap-[clamp(48px,7vw,100px)] max-[900px]:grid-cols-1">
          <figure className="m-0">
            <div className="aspect-[4/5] overflow-hidden bg-[#d9d0bd] shadow-[0_24px_55px_rgb(32_48_43_/_18%)]">
              {imageUrl && !imageFailed ? (
                <img
                  className="size-full object-cover"
                  src={imageUrl}
                  alt={site.mainImageCaptionEn ?? site.nameEn}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
            <figcaption className="mt-3 text-right text-[0.62rem] leading-5 text-[#18352f]/50">
              {site.mainImageCaptionEn && (
                <span>{site.mainImageCaptionEn} </span>
              )}
              {site.mainImageAuthor && (
                <span>Photo: {site.mainImageAuthor} </span>
              )}
              {!site.mainImageAuthor && site.wikipediaImageAuthor && (
                <span>Photo: {site.wikipediaImageAuthor} </span>
              )}
              {(site.mainImageLicense || site.wikipediaImageLicense) && (
                <span>
                  {site.mainImageLicense ?? site.wikipediaImageLicense}{' '}
                </span>
              )}
              {imageSourceUrl && (
                <a
                  className="underline hover:text-[#b85635]"
                  href={imageSourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Source
                </a>
              )}
              {showTranslation && translation?.mainImageCaptionEn && (
                <span className="mt-1 block text-[#b85635]">
                  {translation.mainImageCaptionEn}
                </span>
              )}
            </figcaption>
          </figure>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-[#18352f]/25 px-3 py-1.5 text-[0.65rem] font-bold">
                {categoryLabel(site.category)}
              </span>
              <span className="text-[0.58rem] font-bold tracking-[0.14em] text-[#18352f]/45">
                UNESCO ID {site.unescoId}
              </span>
            </div>
            <p className="mt-10 text-[0.68rem] font-extrabold tracking-[0.17em] text-[#b85635] uppercase">
              {site.region ?? 'WORLD'} · {site.statesNames.join(' / ')}
            </p>
            <VocabularyCapture enabled={captureMode} heritageSiteId={site.uuid}>
              <h1 className="mt-4 font-serif text-[clamp(2.7rem,5vw,4.8rem)] leading-[1.08] font-medium tracking-[-0.04em]">
                <SelectableText
                  as="span"
                  text={site.nameEn}
                  sectionType="title"
                />
              </h1>
            </VocabularyCapture>
            {showTranslation && translation?.nameEn && (
              <p className="mt-3 font-serif text-xl text-[#b85635]">
                {translation.nameEn}
              </p>
            )}
            {site.shortDescriptionEn && (
              <VocabularyCapture
                enabled={captureMode}
                heritageSiteId={site.uuid}
              >
                <SelectableText
                  className="mt-7 text-base leading-8 text-[#18352f]/72"
                  text={site.shortDescriptionEn}
                  sectionType="short-description"
                />
              </VocabularyCapture>
            )}
            {showTranslation && translation?.shortDescriptionEn && (
              <JapaneseTranslation text={translation.shortDescriptionEn} />
            )}
            <Facts site={site} criteria={criteria} />
          </div>
        </div>

        <ActionBar
          captureMode={captureMode}
          learning={learning}
          site={site}
          showTranslation={showTranslation}
          translating={translationQuery.isFetching}
          onCapture={() => setCaptureMode((value) => !value)}
          onFavorite={() =>
            learningMutation.mutate(() =>
              updateFavorite(site.uuid, !learning?.isFavorite),
            )
          }
          onReadLater={() =>
            learningMutation.mutate(() =>
              updateReadLater(site.uuid, !learning?.isReadLater),
            )
          }
          onTranslate={toggleTranslation}
        />
        {translationQuery.isError && (
          <p className="mt-3 text-xs text-[#b85635]">
            {getApiErrorMessage(translationQuery.error)}
          </p>
        )}

        <section className="grid grid-cols-[minmax(0,1fr)_330px] gap-[clamp(50px,8vw,120px)] py-16 max-[900px]:grid-cols-1">
          <article>
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635] uppercase">
              ABOUT THE SITE
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,3vw,3rem)]">
              Read the story in English.
            </h2>
            <div className="mt-7">
              <SpeechControls text={speechText} />
            </div>
            <VocabularyCapture enabled={captureMode} heritageSiteId={site.uuid}>
              <div className="mt-9 space-y-6">
                {paragraphs(site.descriptionEn).map((paragraph, index) => (
                  <SelectableText
                    className="text-[1.02rem] leading-[2.05] text-[#18352f]/78"
                    key={`description-${index}`}
                    text={paragraph}
                    sectionType="description"
                  />
                ))}
                {showTranslation && translation?.descriptionEn && (
                  <JapaneseTranslation text={translation.descriptionEn} />
                )}
              </div>
              {site.justificationEn && (
                <div className="mt-12 border-l-2 border-[#c98c47] pl-6">
                  <h3 className="font-serif text-xl">Why it was inscribed</h3>
                  <SelectableText
                    className="mt-4 text-sm leading-7 text-[#18352f]/70"
                    text={site.justificationEn}
                    sectionType="justification"
                  />
                  {showTranslation && translation?.justificationEn && (
                    <JapaneseTranslation text={translation.justificationEn} />
                  )}
                </div>
              )}
            </VocabularyCapture>
          </article>

          <ReaderSidebar
            captureMode={captureMode}
            learning={learning}
            mutationPending={learningMutation.isPending}
            site={site}
            showTranslation={showTranslation}
            translation={translation}
            onComprehension={(value) =>
              learningMutation.mutate(() =>
                updateComprehension(site.uuid, value),
              )
            }
          />
        </section>

        <AdditionalMedia site={site} />

        {(site.mainVideoUrl || site.videoUrls[0]) && (
          <section className="border-t border-[#18352f]/15 py-12">
            <h2 className="font-serif text-2xl">Related video</h2>
            <video
              className="mt-5 max-h-[620px] w-full bg-black"
              controls
              preload="metadata"
              src={site.mainVideoUrl ?? site.videoUrls[0]}
            />
          </section>
        )}

        <section className="flex flex-wrap items-center justify-between gap-5 border-t border-[#18352f]/15 py-10">
          <div>
            <p className="text-xs font-bold">読み終わったら記録しましょう</p>
            <p className="mt-1 text-xs text-[#18352f]/50">
              同じ世界遺産の再読も回数に含まれます。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="border border-[#b85635] bg-[#b85635] px-6 py-3 text-xs font-bold text-white disabled:opacity-50"
              disabled={readMutation.isPending}
              onClick={() => readMutation.mutate()}
              type="button"
            >
              {readMutation.isPending
                ? '記録中…'
                : learning?.readCount
                  ? 'もう一度読了として記録'
                  : '読了にする'}
            </button>
            <button
              className="border border-[#18352f] bg-[#18352f] px-6 py-3 text-xs font-bold text-white"
              onClick={showNext}
              type="button"
            >
              {routeId ? 'ランダムに読む' : '次の世界遺産へ'} →
            </button>
          </div>
        </section>

        {readNotice !== null && (
          <div
            className="fixed right-5 bottom-5 z-50 flex items-center gap-4 bg-[#18352f] px-5 py-4 text-xs text-white shadow-xl"
            role="status"
          >
            読了を記録しました
            <button
              className="font-bold text-[#e7c778] underline disabled:opacity-50"
              disabled={undoMutation.isPending}
              onClick={() => undoMutation.mutate(readNotice)}
              type="button"
            >
              取り消す
            </button>
          </div>
        )}
        {(learningMutation.isError ||
          readMutation.isError ||
          undoMutation.isError) && (
          <p className="fixed right-5 bottom-5 z-50 max-w-sm bg-[#b85635] px-5 py-4 text-xs text-white shadow-xl">
            {getApiErrorMessage(
              learningMutation.error ??
                readMutation.error ??
                undoMutation.error,
            )}
          </p>
        )}
        <Link
          className="inline-block pb-8 text-xs font-bold text-[#18352f]/55 underline hover:text-[#b85635]"
          to="/"
        >
          ← ホームへ戻る
        </Link>
      </section>
    </AppShell>
  )
}

function ModeSelector({
  mode,
  onChange,
}: {
  mode: HeritageMode
  onChange: (mode: HeritageMode) => void
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#18352f]/15 pb-5">
      <div>
        <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
          RANDOM READING MODE
        </p>
        <p className="mt-1 text-sm text-[#18352f]/60">
          過去に読んだ世界遺産も抽選対象です
        </p>
      </div>
      <div className="inline-flex border border-[#18352f]/20 p-1">
        {(['all', 'famous'] as const).map((value) => (
          <button
            className={`px-4 py-2 text-xs font-bold ${
              mode === value ? 'bg-[#18352f] text-white' : 'text-[#18352f]/60'
            }`}
            key={value}
            onClick={() => onChange(value)}
            type="button"
          >
            {value === 'all' ? 'すべて' : '有名な世界遺産'}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReaderSkeleton() {
  return (
    <section
      className="mx-auto grid min-h-[70vh] w-[min(1240px,calc(100%-48px))] animate-pulse grid-cols-2 items-center gap-20 py-14 motion-reduce:animate-none max-[800px]:grid-cols-1 max-[760px]:w-[calc(100%-32px)]"
      aria-label="次の世界遺産を探しています"
      role="status"
    >
      <div className="aspect-[4/5] bg-[#d9d0bd]/70" />
      <div>
        <div className="h-5 w-28 bg-[#d9d0bd]" />
        <div className="mt-10 h-4 w-52 bg-[#d9d0bd]" />
        <div className="mt-5 h-20 w-full bg-[#d9d0bd]/80" />
        <div className="mt-8 h-28 w-full bg-[#d9d0bd]/55" />
      </div>
    </section>
  )
}

function Facts({
  site,
  criteria,
}: {
  site: WorldHeritageSite
  criteria: string[]
}) {
  return (
    <dl className="mt-8 grid grid-cols-3 border-y border-[#18352f]/15 py-5 text-sm max-[520px]:grid-cols-1 max-[520px]:gap-4">
      <Fact label="登録年" value={site.dateInscribed?.toString() ?? '—'} />
      <Fact
        bordered
        label="登録基準"
        value={criteria.length ? criteria.map(formatCriterion).join(', ') : '—'}
      />
      <Fact
        label="面積"
        value={
          site.areaHectares ? `${site.areaHectares.toLocaleString()} ha` : '—'
        }
      />
    </dl>
  )
}

function Fact({
  label,
  value,
  bordered = false,
}: {
  label: string
  value: string
  bordered?: boolean
}) {
  return (
    <div
      className={
        bordered
          ? 'border-x border-[#18352f]/15 px-6 max-[520px]:border-0 max-[520px]:px-0'
          : 'px-6 first:pl-0 last:pr-0 max-[520px]:px-0'
      }
    >
      <dt className="text-[0.58rem] font-bold tracking-[0.12em] text-[#18352f]/45">
        {label}
      </dt>
      <dd className="mt-2 font-serif text-xl">{value}</dd>
    </div>
  )
}

function ActionBar({
  site,
  learning,
  captureMode,
  showTranslation,
  translating,
  onCapture,
  onTranslate,
  onFavorite,
  onReadLater,
}: {
  site: WorldHeritageSite
  learning?: LearningState
  captureMode: boolean
  showTranslation: boolean
  translating: boolean
  onCapture: () => void
  onTranslate: () => void
  onFavorite: () => void
  onReadLater: () => void
}) {
  const button = 'border px-4 py-2.5 text-xs font-bold disabled:opacity-50'
  return (
    <div className="mt-12 border-y border-[#18352f]/15 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`${button} border-[#18352f] bg-[#18352f] text-white`}
          disabled={translating}
          onClick={onTranslate}
          type="button"
        >
          {translating
            ? 'DeepLで翻訳中…'
            : showTranslation
              ? '英語だけに戻す'
              : '日本語訳を表示'}
        </button>
        <a
          className={`${button} border-[#b85635] text-[#b85635] hover:bg-[#b85635] hover:text-white`}
          href={buildChatGptTranslationUrl(site)}
          rel="noreferrer"
          target="_blank"
        >
          AIで全文翻訳 ↗
        </a>
        <button
          className={`${button} ${captureMode ? 'border-[#c98c47] bg-[#c98c47]' : 'border-[#18352f]/25'}`}
          onClick={onCapture}
          type="button"
          aria-pressed={captureMode}
        >
          {captureMode ? '単語記録モード ON' : '単語を記録する'}
        </button>
        <button
          className={`${button} ${learning?.isFavorite ? 'border-[#b85635] bg-[#b85635]/10 text-[#b85635]' : 'border-[#18352f]/25'}`}
          disabled={!learning}
          onClick={onFavorite}
          type="button"
          aria-pressed={learning?.isFavorite ?? false}
        >
          {learning?.isFavorite ? '♥ お気に入り済み' : '♡ お気に入り'}
        </button>
        <button
          className={`${button} ${learning?.isReadLater ? 'border-[#4f8871] bg-[#4f8871]/10 text-[#315f4c]' : 'border-[#18352f]/25'}`}
          disabled={!learning}
          onClick={onReadLater}
          type="button"
          aria-pressed={learning?.isReadLater ?? false}
        >
          {learning?.isReadLater ? '✓ 後で読むに保存済み' : '＋ 後で読む'}
        </button>
      </div>
      {captureMode && (
        <p className="mt-3 text-xs leading-5 text-[#18352f]/60">
          単語はクリック、句動詞や複数語はドラッグまたは長押しで選択してください。
        </p>
      )}
    </div>
  )
}

function ReaderSidebar({
  site,
  learning,
  captureMode,
  showTranslation,
  translation,
  mutationPending,
  onComprehension,
}: {
  site: WorldHeritageSite
  learning?: LearningState
  captureMode: boolean
  showTranslation: boolean
  translation?: ArticleTranslation
  mutationPending: boolean
  onComprehension: (value: ComprehensionLevel) => void
}) {
  return (
    <aside className="space-y-9 border-l border-[#18352f]/15 pl-9 max-[900px]:border-0 max-[900px]:pl-0">
      <div>
        <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
          UNDERSTANDING
        </p>
        <p className="mt-2 text-xs text-[#18352f]/55">
          今回の記事の理解度を記録
        </p>
        <div className="mt-4 grid gap-2">
          {comprehensionOptions.map((option) => (
            <button
              className={`flex items-center justify-between border px-4 py-3 text-left text-xs font-bold ${learning?.comprehensionLevel === option.value ? 'border-[#b85635] bg-[#b85635]/8 text-[#b85635]' : 'border-[#18352f]/20'}`}
              disabled={!learning || mutationPending}
              key={option.value}
              onClick={() => onComprehension(option.value)}
              type="button"
            >
              {option.label} <span>{option.symbol}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
          LOCATION
        </p>
        <p className="mt-3 font-serif text-xl leading-8">
          {coordinate(site.latitude, 'N', 'S')}
          <br />
          {coordinate(site.longitude, 'E', 'W')}
        </p>
        {site.latitude !== null && site.longitude !== null && (
          <div className="mt-4 overflow-hidden border border-[#18352f]/15 bg-[#e3dccd]">
            <iframe
              className="h-44 w-full"
              loading="lazy"
              src={openStreetMapEmbedUrl(site.latitude, site.longitude)}
              title={`${site.nameEn}の地図`}
            />
            <a
              className="block px-3 py-2 text-[0.6rem] text-[#18352f]/55 underline"
              href={`https://www.openstreetmap.org/?mlat=${site.latitude}&mlon=${site.longitude}#map=8/${site.latitude}/${site.longitude}`}
              rel="noreferrer"
              target="_blank"
            >
              OpenStreetMapで開く
            </a>
          </div>
        )}
      </div>
      {site.criteriaText && (
        <div>
          <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
            HERITAGE CRITERIA
          </p>
          <VocabularyCapture enabled={captureMode} heritageSiteId={site.uuid}>
            <SelectableText
              className="mt-3 text-xs leading-6 text-[#18352f]/65"
              text={site.criteriaText}
              sectionType="criteria"
            />
          </VocabularyCapture>
          {showTranslation && translation?.criteriaText && (
            <JapaneseTranslation text={translation.criteriaText} />
          )}
        </div>
      )}
      {site.danger && (
        <div className="border border-[#b85635]/35 bg-[#b85635]/6 p-4">
          <p className="text-xs font-bold text-[#b85635]">
            危機遺産リスト掲載中
          </p>
          {site.dangerList && (
            <p className="mt-2 text-xs leading-5 text-[#18352f]/60">
              {site.dangerList}
            </p>
          )}
        </div>
      )}
    </aside>
  )
}

function AdditionalMedia({ site }: { site: WorldHeritageSite }) {
  const excluded = new Set(
    [site.mainImageUrl, site.wikipediaImageUrl].filter(Boolean),
  )
  const images = [...new Set(site.imageUrls)].filter(
    (url) => url && !excluded.has(url),
  )
  if (!images.length) return null

  return (
    <section className="border-t border-[#18352f]/15 py-12">
      <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
        IMAGE GALLERY
      </p>
      <h2 className="mt-3 font-serif text-3xl">More views</h2>
      <div className="mt-6 grid grid-cols-3 gap-4 max-[720px]:grid-cols-2 max-[480px]:grid-cols-1">
        {images.slice(0, 9).map((url) => (
          <MediaImage key={url} siteName={site.nameEn} url={url} />
        ))}
      </div>
    </section>
  )
}

function MediaImage({ url, siteName }: { url: string; siteName: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <a
      className="block aspect-[4/3] overflow-hidden bg-[#d9d0bd] focus-visible:outline-3 focus-visible:outline-[#b85635]"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      <img
        className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
        src={url}
        alt={`${siteName}の追加画像`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  )
}

function JapaneseTranslation({ text }: { text: string }) {
  return (
    <div className="mt-4 border-l-2 border-[#b85635]/45 bg-white/45 px-5 py-4">
      <p className="mb-2 text-[0.58rem] font-bold tracking-[0.14em] text-[#b85635]">
        DEEPL 日本語訳
      </p>
      {paragraphs(text).map((paragraph, index) => (
        <p className="mt-2 text-sm leading-7 text-[#18352f]/72" key={index}>
          {paragraph}
        </p>
      ))}
    </div>
  )
}

function ImagePlaceholder() {
  return (
    <div className="grid size-full place-items-center bg-[linear-gradient(145deg,#d9d0bd,#8aa098)] text-center text-white/80">
      <div>
        <span className="block text-5xl">◇</span>
        <span className="mt-3 block text-xs tracking-[0.14em]">
          IMAGE UNAVAILABLE
        </span>
      </div>
    </div>
  )
}

function paragraphs(text: string | null) {
  return text
    ? text
        .split(/\n\s*\n/)
        .map((value) => value.trim())
        .filter(Boolean)
    : []
}

function categoryLabel(category: WorldHeritageSite['category']) {
  return { Cultural: '文化遺産', Natural: '自然遺産', Mixed: '複合遺産' }[
    category
  ]
}

function formatCriterion(value: string) {
  return `(${value.replace(/^[cn]/, '')})`
}

function coordinate(value: number | null, positive: string, negative: string) {
  return value === null
    ? '—'
    : `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`
}

function openStreetMapEmbedUrl(latitude: number, longitude: number) {
  const delta = 0.35
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude}%2C${longitude}`
}
