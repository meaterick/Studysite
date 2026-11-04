import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "공동 임베딩으로 zero-shot 분류하고 프롬프트 앙상블 효과 재기",
    prompt: md`
본문의 zero-shot 분류를 직접 구현합니다. 공동 임베딩 공간의 이미지 벡터 \`img\`(300장, 단위벡터)와 실제 클래스 \`labels\`, 그리고 문장 템플릿 6개와 클래스 5개를 조합한 문장 벡터 \`txt\`(모양 \`(6, 5, 16)\`, 단위벡터)가 주어져 있습니다. \`txt[j, c]\`는 템플릿 \`templates[j]\`에 클래스 \`classes[c]\`를 넣은 문장의 임베딩입니다.

1. \`zero_shot_probs(img, txt, tau=0.01)\`: 이미지마다 클래스 확률 $\text{softmax}(\cos(u, t_c)/\tau)$를 담은 \`(이미지 수, 클래스 수)\` 배열. 벡터가 단위벡터라 코사인 유사도는 내적입니다. $\tau = 0.01$이면 로짓이 수십~수백이 되므로 각 행에서 최댓값을 빼고 \`exp\`를 취합니다.
2. \`ensemble(txt_by_template)\`: 템플릿 축(0번 축)으로 평균 낸 뒤 클래스마다 다시 길이 1로 정규화한 \`(클래스 수, 차원)\` 배열.
3. \`recall_at_k(S, k)\`: 이미지 $i$와 캡션 $i$가 짝인 $N \times N$ 유사도 행렬에서, 행마다 짝의 유사도 $S_{ii}$보다 **큰** 칸의 수 + 1을 순위로 보고 순위가 $k$ 이하인 행의 비율.
`,
    starter: py`
import numpy as np
rng = np.random.default_rng(0)
unit = lambda A: A / np.linalg.norm(A, axis=-1, keepdims=True)

K, d, T, n = 5, 16, 6, 300
classes = ["고양이", "강아지", "자동차", "비행기", "꽃"]
templates = ["{} 사진", "흐릿한 {} 사진", "{}의 그림", "작은 {}", "{}를 찍은 사진", "{}가 나온 장면"]
concept = unit(rng.normal(size=(K, d)))                       # 공동 임베딩 공간에서 각 개념의 방향
# txt[j, c]: 템플릿 j에 클래스 c를 넣은 문장의 임베딩. 템플릿마다 조금씩 다르게 어긋난다
txt = unit(concept[None] + 0.3 * rng.normal(size=(T, 1, d)) + 0.3 * rng.normal(size=(T, K, d)))
labels = rng.integers(K, size=n)                              # 이미지 300장의 실제 클래스
img = unit(concept[labels] + 0.3 * rng.normal(size=(n, d)))   # 이미지 임베딩

def zero_shot_probs(img, txt, tau=0.01):
    return np.full((len(img), len(txt)), 1 / len(txt))  # TODO: 행마다 softmax(img @ txt.T / tau), 최댓값 빼기

def ensemble(txt_by_template):
    return txt_by_template[0]  # TODO: 템플릿 평균 → 클래스마다 단위벡터로

def recall_at_k(S, k):
    return 0.0  # TODO

for j, tpl in enumerate(templates):
    acc = np.mean(zero_shot_probs(img, txt[j]).argmax(1) == labels)
    print(f"템플릿 '{tpl.format('…')}': 정확도 {acc:.3f}")
print(f"템플릿 {len(templates)}개 앙상블: {np.mean(zero_shot_probs(img, ensemble(txt)).argmax(1) == labels):.3f}")
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(0)
unit = lambda A: A / np.linalg.norm(A, axis=-1, keepdims=True)

K, d, T, n = 5, 16, 6, 300
classes = ["고양이", "강아지", "자동차", "비행기", "꽃"]
templates = ["{} 사진", "흐릿한 {} 사진", "{}의 그림", "작은 {}", "{}를 찍은 사진", "{}가 나온 장면"]
concept = unit(rng.normal(size=(K, d)))                       # 공동 임베딩 공간에서 각 개념의 방향
# txt[j, c]: 템플릿 j에 클래스 c를 넣은 문장의 임베딩. 템플릿마다 조금씩 다르게 어긋난다
txt = unit(concept[None] + 0.3 * rng.normal(size=(T, 1, d)) + 0.3 * rng.normal(size=(T, K, d)))
labels = rng.integers(K, size=n)                              # 이미지 300장의 실제 클래스
img = unit(concept[labels] + 0.3 * rng.normal(size=(n, d)))   # 이미지 임베딩

@test("확률: 모양 (300, 5), 행의 합 1, τ = 0.01에서도 nan 없음")
def _():
    P = zero_shot_probs(img, txt[0])
    assert P.shape == (n, K) and approx(P.sum(1), np.ones(n)) and not np.isnan(P).any(), P[:2]
    P2 = zero_shot_probs(img[:3], txt[0], tau=0.001)
    assert not np.isnan(P2).any(), "로짓이 커도 nan이 나오지 않게 행의 최댓값을 빼십시오."

@test("온도가 낮을수록 확률이 뾰족해진다")
def _():
    t = ensemble(txt)
    p1, p01 = zero_shot_probs(img[:1], t, 1.0)[0], zero_shot_probs(img[:1], t, 0.1)[0]
    assert approx(p1, [0.134, 0.139, 0.306, 0.162, 0.258], 2e-3), np.round(p1, 3)
    assert p01.max() > 0.8 > p1.max(), (np.round(p1, 3), np.round(p01, 3))

@test("템플릿 하나는 0.68~0.85, 앙상블은 약 0.933으로 어느 템플릿보다 높다")
def _():
    accs = [np.mean(zero_shot_probs(img, txt[j]).argmax(1) == labels) for j in range(T)]
    ens = ensemble(txt)
    assert ens.shape == (K, d) and approx(np.linalg.norm(ens, axis=1), np.ones(K)), "앙상블 벡터는 클래스마다 길이 1이어야 합니다."
    acc = np.mean(zero_shot_probs(img, ens).argmax(1) == labels)
    assert approx(acc, 0.9333, 2e-2) and acc > max(accs), (np.round(accs, 3), acc)

@test("이미지 → 캡션 검색의 Recall@k")
def _():
    S = np.array([[0.9, 0.2, 0.1], [0.8, 0.7, 0.1], [0.3, 0.4, 0.2]])
    assert [recall_at_k(S, k) for k in (1, 2, 3)] == [1 / 3, 2 / 3, 1.0], [recall_at_k(S, k) for k in (1, 2, 3)]
`,
    hints: ["`z = img @ txt.T / tau`, `z = z - z.max(axis=1, keepdims=True)`, `e = np.exp(z)`, `e / e.sum(axis=1, keepdims=True)`. 최댓값을 빼도 softmax 결과는 같지만 `exp`가 넘치지 않습니다.", "`m = txt_by_template.mean(axis=0)` 다음 `m / np.linalg.norm(m, axis=1, keepdims=True)`. 평균을 내면 길이가 1보다 짧아지므로 다시 정규화해야 코사인 유사도가 유지됩니다.", "`ranks = (S > np.diag(S)[:, None]).sum(axis=1) + 1`, `np.mean(ranks <= k)`. 「검색 품질 지표」의 Recall@k와 같은 정의를 이미지 → 텍스트 검색에 쓴 것입니다."],
    solution: py`
import numpy as np
rng = np.random.default_rng(0)
unit = lambda A: A / np.linalg.norm(A, axis=-1, keepdims=True)

K, d, T, n = 5, 16, 6, 300
classes = ["고양이", "강아지", "자동차", "비행기", "꽃"]
templates = ["{} 사진", "흐릿한 {} 사진", "{}의 그림", "작은 {}", "{}를 찍은 사진", "{}가 나온 장면"]
concept = unit(rng.normal(size=(K, d)))                       # 공동 임베딩 공간에서 각 개념의 방향
# txt[j, c]: 템플릿 j에 클래스 c를 넣은 문장의 임베딩. 템플릿마다 조금씩 다르게 어긋난다
txt = unit(concept[None] + 0.3 * rng.normal(size=(T, 1, d)) + 0.3 * rng.normal(size=(T, K, d)))
labels = rng.integers(K, size=n)                              # 이미지 300장의 실제 클래스
img = unit(concept[labels] + 0.3 * rng.normal(size=(n, d)))   # 이미지 임베딩

def zero_shot_probs(img, txt, tau=0.01):
    z = img @ txt.T / tau
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def ensemble(txt_by_template):
    m = txt_by_template.mean(axis=0)
    return m / np.linalg.norm(m, axis=1, keepdims=True)

def recall_at_k(S, k):
    ranks = (S > np.diag(S)[:, None]).sum(axis=1) + 1
    return float(np.mean(ranks <= k))

for j, tpl in enumerate(templates):
    acc = np.mean(zero_shot_probs(img, txt[j]).argmax(1) == labels)
    print(f"템플릿 '{tpl.format('…')}': 정확도 {acc:.3f}")
print(f"템플릿 {len(templates)}개 앙상블: {np.mean(zero_shot_probs(img, ensemble(txt)).argmax(1) == labels):.3f}")
`,
  },
]);
