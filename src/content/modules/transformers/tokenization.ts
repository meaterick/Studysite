import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/tokenization";

export default defineLesson({
  id: "tokenization",
  title: "토큰화, 서브워드, 토큰 임베딩, 위치 정보",
  tier: "core",
  concepts: ["tokenization"],
  goal: "BPE가 가장 잦은 쌍을 반복 병합해 어휘를 만드는 과정을 직접 따라가고, 이 방식이 OOV 완화·한국어 토큰 수·철자 세기 약점으로 이어지는 이유를 설명할 수 있다.",
  why: "",
  body: md`
[[diagram:tokenizer-bpe]]

LLM은 사실 글자를 곧바로 읽지 않는다. 문장을 먼저 "토큰"이라는 조각들로 잘게 썬 다음에야 숫자로 바꿔서 처리한다. 이 자르는 규칙을 정하는 것이 토크나이저이고, 오늘날 대부분의 LLM이 쓰는 방식이 BPE(Byte-Pair Encoding)다. 「시퀀스 데이터와 단어 임베딩」 단계에서 언급했듯이 BPE 이전에는 공백이나 형태소 분석기로 자르는 단어 단위(word-level) 토큰화가 표준이었다. 그러나 이 방식은 사전에 없는 새 단어(OOV, Out-Of-Vocabulary)를 만나면 처리할 방법이 없고, 다양한 활용형·오탈자까지 어휘 사전에 전부 담으려면 어휘 크기가 감당하기 어려울 만큼 커진다는 문제가 있었다. BPE는 문자 단위와 단어 단위 사이의 절충안으로, 자주 쓰이는 부분단어(subword)는 통째로 하나의 토큰으로 묶고 희귀한 조합은 더 잘게 쪼갬으로써 이 문제를 완화한다. 아이디어는 뜻밖에 단순하다. 방대한 텍스트를 놓고, 가장 자주 붙어서 나타나는 문자(또는 조각) 쌍을 찾아 하나로 합치는 과정을 정해둔 횟수만큼 반복한다. 위 그림에서 "low", "lower", "lowest"라는 세 단어가 문자 단위로 쪼개진 상태에서 시작해, 가장 흔한 쌍부터 순서대로 병합되어 결국 "low"라는 조각(subword)이 하나의 토큰으로 굳어지는 과정을 볼 수 있다. 이렇게 자주 나오는 조각은 통째로 하나의 토큰이 되고, 희귀한 단어는 여러 개의 작은 조각으로 쪼개진 채 남는다.

BPE의 병합 규칙이 학습 데이터의 통계를 그대로 반영하다 보니, 실제로 LLM을 쓸 때 체감되는 특이한 현상 세 가지가 여기서 함께 따라 나온다. ① 한국어는 영어보다 토큰이 많아 같은 문장이라도 비용이 더 크다, ② 철자 세기·숫자 연산이 약한 이유의 일부가 여기 있다, ③ 희귀 단어는 여러 조각으로 쪼개진다. 이 세 가지 현상은 모두 "학습 데이터에 영어가 압도적으로 많았고, 그래서 어휘 병합 규칙도 영어 위주로 만들어졌다"는 하나의 원인에서 갈라져 나온다. 영어는 자주 쓰는 단어가 통째로 하나의 토큰이 되는 경우가 많은 반면, 한국어는 조사와 어미가 계속 붙는 교착어 특성 때문에 같은 뜻이라도 상대적으로 더 많은 토큰으로 쪼개지는 경우가 흔하다. 그래서 같은 내용을 담은 문장이라도 한국어 쪽의 토큰 수가 더 많아지고, API 비용은 토큰 수에 비례해 매겨지므로 실제로 비용도 더 커진다. 철자를 한 글자씩 세거나("strawberry에 r이 몇 개인가?") 여러 자리 숫자를 정확히 계산하는 데 LLM이 약한 것도 같은 이유의 연장선이다. 모델은 애초에 "s-t-r-a-w-b-e-r-r-y"라는 개별 글자들을 하나씩 본 적이 없고, "straw"와 "berry" 같은 뭉텅이 토큰만 보았기 때문에, 글자 하나하나를 세는 일이 원리적으로 서툴 수밖에 없다.

BPE가 하는 일을 말로만 듣기보다, 앞서 말한 병합 알고리즘을 그대로 코드로 옮겨서 직접 돌려보는 편이 훨씬 확실하다. 실제 LLM이 쓰는 tiktoken 같은 라이브러리는 브라우저 실행 환경에 없으므로, 위 그림과 똑같이 "low", "lower", "lowest", "newer", "newest"라는 아주 작은 말뭉치로 병합 규칙을 처음부터 직접 학습시켜보자. 오히려 이렇게 작은 예제라야 병합이 한 단계씩 진행되는 과정을 눈으로 낱낱이 따라갈 수 있다.

:::info 이 코드에서 처음 나오는 문법: Counter와 딕셔너리 컴프리헨션
- **\`Counter\`**: \`from collections import Counter\`로 불러오는, "무엇이 몇 번 나왔는지"를 세는 데 특화된 딕셔너리의 사촌이다. \`pairs[(a, b)] += 1\`처럼 값을 더해나가면 각 쌍이 등장한 횟수가 자동으로 누적되고, \`pairs.most_common(1)\`은 가장 많이 등장한 항목 하나를 \`[(쌍, 등장 횟수)]\` 형태로 돌려준다.
- **딕셔너리 컴프리헨션**: \`{tok: idx for idx, tok in enumerate(all_tokens)}\`처럼 \`{키: 값 for ...}\` 형태로 한 줄 만에 딕셔너리를 만드는 문법이다. \`enumerate(리스트)\`는 리스트의 각 원소를 \`(인덱스, 원소)\` 쌍으로 하나씩 꺼내주므로, 이 한 줄로 「시퀀스 데이터와 단어 임베딩」 단계에서 말한 "토큰 $\to$ 정수 인덱스" 어휘 사전을 그대로 만들 수 있다.
:::

\`\`\`python
# 아주 작은 말뭉치로 BPE 병합 규칙을 직접 학습해보기
from collections import Counter

def train_bpe(words, n_merges):
    # 각 단어를 "글자 하나씩 + 단어 끝 표시(</w>)" 리스트로 쪼갠 상태에서 시작한다.
    # 예: "low" -> ['l', 'o', 'w', '</w>']. </w>가 없으면 "low"의 마지막 'w'와
    # "wide"의 첫 'w'를 병합 알고리즘이 구별하지 못하므로, 단어 경계를 표시해두는 것이다.
    corpus = [list(w) + ["</w>"] for w in words]
    merges = []
    for _ in range(n_merges):
        pairs = Counter()
        for tokens in corpus:
            for i in range(len(tokens) - 1):
                pairs[(tokens[i], tokens[i + 1])] += 1   # 바로 옆에 붙어 나온 조각 쌍의 빈도 세기
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]                # 가장 자주 등장한 쌍 하나
        merges.append(best)
        merged_corpus = []
        for tokens in corpus:
            merged, i = [], 0
            while i < len(tokens):
                if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == best:
                    merged.append(tokens[i] + tokens[i + 1])   # 두 조각을 하나로 합치기
                    i += 2
                else:
                    merged.append(tokens[i])
                    i += 1
            merged_corpus.append(merged)
        corpus = merged_corpus
    return merges, corpus

words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]
merges, corpus = train_bpe(words, n_merges=8)

for step, (a, b) in enumerate(merges, 1):
    print(f"{step}번째 병합: {a!r} + {b!r} -> {a + b!r}")

print()
seen = set()
for w, tokens in zip(words, corpus):
    if w not in seen:
        print(w, "->", tokens)
        seen.add(w)

# 최종적으로 남은 조각들을 모아 "토큰 -> 정수 인덱스" 어휘 사전(vocab)을 만든다 (「시퀀스 데이터와 단어 임베딩」 단계 참고)
all_tokens = sorted({tok for tokens in corpus for tok in tokens})
vocab = {tok: idx for idx, tok in enumerate(all_tokens)}
print(f"\n어휘 사전 크기 |V| = {len(vocab)}")
print(vocab)
\`\`\`

실행해보면 1번째 병합이 \`'w'+'e'\`인 것부터 눈에 띈다. "newer"와 "newest"에 공통으로 들어 있는 "we"가 이 작은 말뭉치 안에서 가장 자주 붙어 나오는 쌍이기 때문이다(빈도가 가장 큰 쌍부터 합친다는 규칙을 그대로 따른 결과다). 두 번 반복된 "low"는 6번째 병합에서 \`'low'\`, 7번째 병합에서 \`'low</w>'\`라는 조각 하나로 완전히 뭉쳐지지만("low" 출력 결과가 \`['low</w>']\` 한 조각인 것을 확인해보라), "lower"는 \`['lo', 'wer</w>']\`로, "lowest"는 \`['lo', 'wes', 't', '</w>']\`로 서로 다르게 쪼개진다. 자주 나오는 만큼 우선적으로 뭉쳐지는 조각과, 병합 순서상 뒤로 밀려 상대적으로 잘게 남는 조각이 갈린다는 것을 직접 눈으로 확인할 수 있다.

### 학습한 규칙으로 새 단어 토큰화하기

BPE를 "학습"한다는 것은 결국 **병합 규칙의 목록과 그 순서**를 얻는 것이다. 새 단어를 토큰화할 때는 그 단어를 글자로 쪼갠 뒤, 학습 때 생긴 순서 그대로 규칙을 하나씩 적용하면 된다. 위 코드가 출력한 8개의 병합 규칙을 그대로 가져와 처음 보는 단어에 적용해 보자.

\`\`\`python
# 위 코드가 학습한 병합 규칙 8개 (순서가 중요하다)
merges = [("w", "e"), ("l", "o"), ("we", "r"), ("wer", "</w>"),
          ("n", "e"), ("lo", "w"), ("low", "</w>"), ("we", "s")]

def merge_pair(tokens, pair):
    out, i = [], 0
    while i < len(tokens):
        if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == pair:
            out.append(tokens[i] + tokens[i + 1]); i += 2
        else:
            out.append(tokens[i]); i += 1
    return out

def encode(word):
    tokens = list(word) + ["</w>"]
    for pair in merges:                # 학습할 때 생긴 순서 그대로 병합을 적용한다
        tokens = merge_pair(tokens, pair)
    return tokens

for w in ["lower", "slow", "slower", "renew", "west"]:
    print(f"{w:6s} -> {encode(w)}")
\`\`\`

학습 말뭉치에 없던 "slow", "slower", "west"도 \`<unk>\` 없이 이미 아는 조각들의 조합으로 표현된다. "renew"처럼 아는 조각이 거의 없는 단어는 글자 단위에 가깝게 잘게 쪼개진다. 어떤 단어든 최악의 경우 글자 단위까지는 쪼갤 수 있으니 OOV가 크게 줄어든다.

:::info 바이트 수준 BPE: OOV가 아예 없는 이유
그래도 학습 때 한 번도 못 본 **글자**(이모지, 희귀 한자 등)가 나오면 어떻게 할까? GPT-2 이후 대부분의 LLM은 글자 대신 **바이트**에서 출발하는 바이트 수준(byte-level) BPE를 쓴다. 컴퓨터의 모든 텍스트는 UTF-8로 인코딩하면 0~255의 바이트 열이 되므로, 기본 어휘 256개만 있으면 어떤 문자열이든 표현할 수 있다. 예컨대 한글 한 글자 "안"은 UTF-8로 3바이트다. 그 위에 병합 규칙을 쌓으므로 어휘 크기는 "256 + 병합 횟수"(+ 특수 토큰 몇 개)가 된다. 한국어가 학습 데이터에 적으면 병합이 덜 일어나 글자 하나가 여러 토큰으로 쪼개지기도 하는데, 이것이 한국어 토큰 수가 많아지는 또 하나의 이유다.
:::

[[diagram:bpe-segmentation]]

실제 tiktoken 같은 라이브러리는 이 코드와 완전히 같은 병합 알고리즘을 단지 (1) 몇 개가 아니라 수백 GB의 실제 텍스트에 대해, (2) 몇 번이 아니라 수만~십만 번(cl100k_base 기준 약 10만 개) 반복해서 학습해둔 것뿐이다. 학습에 쓰인 텍스트가 압도적으로 영어 위주였기 때문에, 위에서 "결과적 현상"으로 정리했던 한국어 토큰 수 증가나 숫자·철자 처리의 어려움도 결국 지금 우리가 손으로 확인한 것과 같은 원리(자주 등장한 조합일수록 먼저, 더 크게 뭉쳐진다)에서 비롯된다. 실제 라이브러리로 이 현상을 눈으로 직접 재현해보고 싶다면 아래 코드를 Colab에 붙여넣어 실행해보라.

\`\`\`python-colab
# tiktoken으로 실제 토큰화 결과 관찰: Colab에서 실행 (브라우저에서는 실행되지 않음)
# !pip install tiktoken
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
for s in ["Hello world", "안녕하세요 반갑습니다", "strawberry", "12345 + 67890"]:
    ids = enc.encode(s)
    print(s, len(ids), [enc.decode([i]) for i in ids])
\`\`\`
`,
  checks: [
    {
      key: "c1",
      question: "BPE 학습의 한 단계에서 하는 일은?",
      choices: ["가장 드문 글자를 삭제한다", "말뭉치에서 가장 자주 붙어 나오는 조각 쌍을 하나로 합친다", "단어를 공백 기준으로 자른다", "모든 단어를 소문자로 바꾼다"],
      answer: 1,
      explanation: "이 병합을 정해진 횟수만큼 반복한 기록이 곧 토크나이저의 병합 규칙(merges)이다.",
    },
    {
      key: "c2",
      question: "학습 데이터에 없던 단어 \"slow\"가 `['s', 'low</w>']`로 토큰화된 것이 보여주는 것은?",
      choices: ["BPE는 새 단어를 처리하지 못한다", "학습된 조각을 재사용해 본 적 없는 단어도 처리한다(OOV 완화)", "\"slow\"가 어휘 사전에 있었다", "글자 단위 토큰화와 같다"],
      answer: 1,
      explanation: "자주 나온 조각은 크게, 처음 보는 조합은 잘게 쪼개진다.",
    },
    {
      key: "c3",
      question: "LLM이 \"strawberry에 r이 몇 개인가?\"에 자주 틀리는 이유와 가장 관련 있는 것은?",
      choices: ["모델이 영어를 모르기 때문에", "모델은 글자 대신 여러 글자가 뭉친 토큰 단위로 입력을 보기 때문에", "r이 특수문자라서", "문장이 너무 길어서"],
      answer: 1,
      explanation: "토큰 경계 안의 글자 구성은 모델에게 직접 보이지 않는다. 숫자 연산이 약한 이유의 일부도 같다.",
    },
    {
      key: "c4",
      question: "바이트 수준 BPE가 기본 어휘 256개에서 시작해 병합을 50,000번 했다면 어휘 크기는 약?",
      choices: ["50,256개", "50,000개", "256개", "100,000개"],
      answer: 0,
      explanation: "병합 한 번마다 새 토큰이 하나 생기므로 $256 + 50{,}000 = 50{,}256$개다. GPT-2의 어휘 크기 50,257은 여기에 특수 토큰 하나를 더한 값이다.",
    },
    {
      key: "c5",
      question: "학습된 BPE로 새 단어를 토큰화하는 방법은?",
      choices: ["글자로 쪼갠 뒤 학습 때 생긴 순서대로 병합 규칙을 적용한다", "어휘 사전에서 가장 긴 단어를 찾아 통째로 매칭한다", "새 단어를 보고 병합 규칙을 다시 학습한다", "사전에 없으면 `<unk>`로 바꾼다"],
      answer: 0,
      explanation: "BPE 학습의 결과물은 순서가 있는 병합 규칙 목록이다. 토큰화는 그 규칙을 같은 순서로 재생할 뿐이라, 처음 보는 단어도 아는 조각들로 표현된다.",
    },
    {
      key: "c6",
      question: "BPE 학습에서 각 단어 끝에 `</w>`를 붙이는 이유는?",
      choices: ["단어 수를 세기 위해", "\"low\"의 끝 w와 \"wide\"의 첫 w처럼 단어 끝 조각과 단어 안 조각을 구별하기 위해", "토큰 수를 줄이기 위해", "대문자를 표시하기 위해"],
      answer: 1,
      explanation: "경계 표시가 없으면 단어 끝에서만 의미 있는 조각(예: 'est</w>')과 단어 중간의 같은 글자열을 구별할 수 없고, 토큰을 다시 이어 붙일 때 단어 경계도 복원할 수 없습니다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
from collections import Counter
words = ["low", "low", "lower"]
corpus = [list(w) + ["</w>"] for w in words]
pairs = Counter((t[i], t[i + 1]) for t in corpus for i in range(len(t) - 1))
print(pairs.most_common(2))
print(len(pairs))
`,
      expected: "[(('l', 'o'), 3), (('o', 'w'), 3)]\n6",
      explanation: "인접 쌍은 (l,o)와 (o,w)가 세 단어 모두에서 3번, (w,</w>)가 2번, (w,e)·(e,r)·(r,</w>)가 1번씩으로 모두 6종류입니다. 빈도가 같으면 먼저 등장한 쌍이 앞에 옵니다. BPE는 다음 단계에서 (l,o)를 'lo'로 병합합니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "한국어 문장이 영어보다 토큰이 많은 이유와 비용 영향은?",
      answer: md`
토크나이저 학습 데이터가 영어 중심이라 한국어가 더 잘게 쪼개지고, 같은 내용에 더 많은 토큰이 든다. 그래서 비용은 늘고, 같은 컨텍스트 창에 담을 수 있는 내용은 줄어든다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Sennrich et al. (2016) — Neural Machine Translation of Rare Words with Subword Units", url: "https://arxiv.org/abs/1508.07909", note: "BPE를 NLP에 도입한 논문: 알고리즘 1이 본문 코드와 같다" },
    { title: "Karpathy — Let's build the GPT Tokenizer", url: "https://www.youtube.com/watch?v=zduSFxRajkE", note: "byte-level BPE를 처음부터 구현하는 영상 (과제 선택 항목에 직결)" },
    { title: "Tiktokenizer", url: "https://tiktokenizer.vercel.app/", note: "문장을 넣으면 GPT 토크나이저의 토큰 경계를 바로 보여주는 웹 도구: 한국어·영어를 비교해 보자" },
  ],
});
