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
