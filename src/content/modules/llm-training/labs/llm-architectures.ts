import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "GPT(CLM)와 BERT(MLM)의 학습 문제와 attention 마스크",
    prompt: md`

같은 문장에서 두 목적함수가 만드는 학습 문제를 비교합니다.

1. \`clm_examples(tokens)\`: 위치 1부터 \`(" ".join(앞 토큰들), 다음 토큰)\` 리스트
2. \`mlm_input(tokens, positions)\`: 주어진 위치를 \`"[MASK]"\`로 바꾼 입력 리스트와, 그 위치의 정답 리스트
3. \`attention_mask(n, kind)\`: \`"encoder"\`면 모두 1(양방향), \`"decoder"\`면 자기 자신과 과거만 1인 정수 행렬
`,
    starter: py`
import numpy as np

def clm_examples(tokens):
    return []  # TODO

def mlm_input(tokens, positions):
    masked = list(tokens)  # TODO
    answers = []           # TODO
    return masked, answers

def attention_mask(n, kind):
    return np.zeros((n, n), dtype=int)  # TODO

tokens = "나는 어제 친구 와 맛있는 저녁 을 먹었다".split()
print(len(clm_examples(tokens)), mlm_input(tokens, [5]))
print(attention_mask(3, "decoder"))
`,
    tests: py`
import numpy as np
tokens = "나는 어제 친구 와 맛있는 저녁 을 먹었다".split()

@test("CLM: 8토큰 문장 → 예제 7개")
def _():
    ex = clm_examples(tokens)
    assert len(ex) == 7 and ex[2] == ("나는 어제 친구", "와"), f"예: {ex[2] if len(ex) > 2 else ex}"

@test("MLM: 가린 자리만 정답으로 쓴다")
def _():
    masked, answers = mlm_input(tokens, [1, 5])
    assert masked[1] == masked[5] == "[MASK]" and masked[0] == "나는" and answers == ["어제", "저녁"]
    assert tokens[1] == "어제", "원본 리스트를 바꾸면 안 됩니다."

@test("encoder 마스크: 64칸 모두 1, decoder: 하삼각 36칸")
def _():
    assert attention_mask(8, "encoder").sum() == 64 and attention_mask(8, "decoder").sum() == 36

@test("decoder의 3번째 토큰은 앞 세 토큰만 본다")
def _():
    m = attention_mask(8, "decoder")
    assert [tokens[j] for j in range(8) if m[2, j]] == ["나는", "어제", "친구"]
`,
    hints: ["`[(\" \".join(tokens[:t]), tokens[t]) for t in range(1, len(tokens))]`", "`masked = list(tokens)`로 복사한 뒤 `for i in positions: masked[i] = \"[MASK]\"`, 정답은 `[tokens[i] for i in positions]`", "`np.ones((n, n), dtype=int)`와 `np.tril(np.ones((n, n), dtype=int))`"],
    solution: py`
import numpy as np

def clm_examples(tokens):
    return [(" ".join(tokens[:t]), tokens[t]) for t in range(1, len(tokens))]

def mlm_input(tokens, positions):
    masked = list(tokens)
    for i in positions:
        masked[i] = "[MASK]"
    answers = [tokens[i] for i in positions]
    return masked, answers

def attention_mask(n, kind):
    if kind == "encoder":
        return np.ones((n, n), dtype=int)
    return np.tril(np.ones((n, n), dtype=int))

tokens = "나는 어제 친구 와 맛있는 저녁 을 먹었다".split()
print(len(clm_examples(tokens)), mlm_input(tokens, [5]))
print(attention_mask(3, "decoder"))
`,
  },
]);
