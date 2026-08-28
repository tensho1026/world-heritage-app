import type { WorldHeritageSite } from '../types'

function chatGptUrl(prompt: string) {
  return `https://chatgpt.com/?prompt=${encodeURIComponent(prompt)}`
}

export function buildGrammarCheckUrl(
  selection: string,
  context: string,
  siteName: string,
) {
  return chatGptUrl(`次の世界遺産記事の英文について、日本語で文法・構文を解説してください。

世界遺産: ${siteName}
選択した英文: ${selection}
前後の文脈: ${context}

次の順で説明してください。
1. 文型と主語・動詞・目的語・補語
2. 句・節のまとまり
3. 関係代名詞、分詞構文、修飾関係など重要な文法
4. 難しい箇所の自然な日本語説明
5. 意味を変えない、より簡単な英語への言い換え
記事にない事実を追加しないでください。`)
}

export function buildSentenceRewriteUrl(
  selection: string,
  context: string,
  siteName: string,
  level: 'B1' | 'A2',
) {
  return chatGptUrl(`次の世界遺産記事の英文を、CEFR ${level}程度の学習者向け英語に書き換えてください。

世界遺産: ${siteName}
対象文: ${selection}
前後の文脈: ${context}

固有名詞と事実関係は維持し、元の文にない情報は加えないでください。書き換えた英文と、変更した表現の短い日本語解説を出してください。`)
}

export function buildFullRewriteUrl(
  site: WorldHeritageSite,
  level: 'B1' | 'A2',
) {
  const text = [
    site.nameEn,
    site.shortDescriptionEn,
    site.descriptionEn,
    site.justificationEn,
    site.criteriaText,
  ]
    .filter(Boolean)
    .join('\n\n')
  return chatGptUrl(`以下の世界遺産記事を、CEFR ${level}程度の学習者向け英語に全文書き換えてください。

固有名詞、登録年、場所、登録理由などの事実は維持し、元の記事にない情報は加えないでください。段落構成を保ち、書き換えた英文だけを最初に出してください。

${text}`)
}
