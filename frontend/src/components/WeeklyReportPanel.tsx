import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getWeeklyReport } from '../api/reports'
import type { ComprehensionLevel } from '../types'

const levels: Record<ComprehensionLevel, string> = {
  difficult: '難しかった',
  partial: 'だいたい分かった',
  understood: 'よく分かった',
}

export function WeeklyReportPanel() {
  const report = useQuery({
    queryKey: ['weekly-report'],
    queryFn: getWeeklyReport,
  })
  const data = report.data
  return (
    <section className="border border-[#18352f]/15 bg-white/40 p-6">
      <p className="text-[0.6rem] font-extrabold tracking-[0.16em] text-[#b85635]">
        WEEKLY REPORT
      </p>
      <h2 className="mt-2 font-serif text-3xl">今週の振り返り</h2>
      {report.isPending && (
        <p className="mt-6 text-sm text-[#18352f]/45">集計中…</p>
      )}
      {report.isError && (
        <p className="mt-6 text-sm text-[#b85635]">
          週次レポートを取得できませんでした。
        </p>
      )}
      {data && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-px bg-[#18352f]/12 text-center">
            <Metric value={data.readSites.length} label="読んだ遺産" />
            <Metric value={data.reviewCount} label="語彙復習" />
            <Metric
              value={data.quizAccuracy === null ? '—' : `${data.quizAccuracy}%`}
              label="クイズ正答率"
            />
          </div>
          <ReportList title="今週読んだ世界遺産">
            {data.readSites.length ? (
              data.readSites.map((item) => (
                <li key={item.heritageSiteId}>
                  <Link
                    className="underline hover:text-[#b85635]"
                    to={`/heritage/${item.heritageSiteId}`}
                  >
                    {item.nameEn}
                  </Link>
                  <span className="float-right text-[#18352f]/45">
                    × {item.count}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-[#18352f]/40">まだありません</li>
            )}
          </ReportList>
          <ReportList title="新しく保存した単語">
            {data.newVocabulary.length ? (
              data.newVocabulary.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <strong>{item.expression}</strong>
                  <span className="ml-2 text-[#18352f]/50">
                    {item.translationJa}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-[#18352f]/40">まだありません</li>
            )}
          </ReportList>
          <ReportList title="よく間違えた単語">
            {data.difficultVocabulary.length ? (
              data.difficultVocabulary.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <strong>{item.expression}</strong>
                  <span className="float-right text-[#b85635]">
                    要復習 {item.difficultReviews}回
                  </span>
                </li>
              ))
            ) : (
              <li className="text-[#18352f]/40">
                難しい判定の単語はありません
              </li>
            )}
          </ReportList>
          <ReportList title="理解度の変化">
            {data.comprehensionChanges.length ? (
              data.comprehensionChanges.slice(0, 8).map((item) => (
                <li key={item.id}>
                  {item.heritageNameEn}
                  <span className="mt-1 block text-[#18352f]/50">
                    {item.previousLevel ? levels[item.previousLevel] : '未選択'}{' '}
                    → {item.nextLevel ? levels[item.nextLevel] : '未選択'}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-[#18352f]/40">今週の変更はありません</li>
            )}
          </ReportList>
          <div className="mt-6 border-l-4 border-[#c98c47] bg-[#c98c47]/8 p-4 text-sm">
            来週までに復習予定の単語は{' '}
            <strong>{data.nextWeekReviewCount}件</strong> です。
          </div>
        </>
      )}
    </section>
  )
}

function Metric({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-[#fbf8f1] p-3">
      <strong className="font-serif text-xl">{value}</strong>
      <span className="mt-1 block text-[0.58rem]">{label}</span>
    </div>
  )
}

function ReportList({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6">
      <h3 className="font-serif text-lg">{title}</h3>
      <ul className="mt-3 space-y-2 text-xs leading-5">{children}</ul>
    </section>
  )
}
