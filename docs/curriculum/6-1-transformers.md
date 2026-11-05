<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 6-1 트랜스포머

[전체 목차](README.md) · 트랙 6 생성형 AI와 언어 모델 · [모듈 원본](../../src/content/modules/transformers/index.ts)

토큰화와 위치 정보, attention의 필요성, self-attention, 멀티헤드 attention과 causal mask, 디코더 블록

## 목표 문제

GPT 같은 언어 모델은 문장을 토큰으로 나누고, 토큰마다 앞의 토큰들을 참조해 다음 토큰의 확률을 계산한다. 이 모듈은 그 계산의 핵심인 Transformer 디코더 블록을 NumPy로 직접 구현한다. BPE로 문장을 토큰으로 나누고 토큰 임베딩에 위치 벡터를 더해 입력을 만든다. Seq2Seq의 고정 크기 문맥 벡터가 긴 문장에서 정보를 잃는 문제에서 출발해, 토큰마다 다른 토큰들의 값을 가중합하는 self-attention $\text{softmax}(QK^\top/\sqrt{d_k})V$를 손으로 계산한다. 헤드를 여러 개로 나누고, causal mask로 뒤쪽 토큰을 가리며, 잔차 연결과 LayerNorm으로 블록을 쌓는다. 마지막 토큰을 바꿔도 앞 토큰의 출력이 그대로인지 검사해 구현이 맞는지 확인한다.

## 학습 목표

- BPE로 어휘를 만들고 새 단어를 토큰화하며, 토큰 임베딩에 사인파 위치 인코딩을 더해 입력을 만든다.
- Seq2Seq의 병목과 attention의 해법을 설명하고, RNN과 self-attention의 경로 길이와 연산량을 비교한다.
- $\text{softmax}(QK^\top/\sqrt{d_k})V$를 손과 코드로 계산하고, 각 부분이 필요한 이유를 설명한다.
- 멀티헤드 attention의 텐서 모양을 계산하고, causal mask를 구현해 올바르게 적용되었는지 검사한다.
- 디코더 블록에서 attention, MLP, 잔차 연결, LayerNorm의 역할과 위치 정보가 필요한 이유를 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [토큰화, 서브워드, 토큰 임베딩, 위치 정보](#lesson-tokenization) | 핵심 | 45분 | #75 토큰화, 서브워드, 토큰 임베딩, 위치 정보 |
| 2 | [어텐션의 필요성: Seq2Seq의 병목](#lesson-attention-motivation) | 핵심 | 35분 | #76 쿼리·키·값, 셀프 어텐션, 트랜스포머 |
| 3 | [셀프 어텐션: 쿼리·키·값](#lesson-self-attention) | 핵심 | 45분 | #76 쿼리·키·값, 셀프 어텐션, 트랜스포머 |
| 4 | [멀티헤드 어텐션과 인과 마스크](#lesson-multi-head-attention) | 핵심 | 40분 | #76 쿼리·키·값, 셀프 어텐션, 트랜스포머 |
| 5 | [트랜스포머 디코더 블록](#lesson-transformer-block) | 핵심 | 40분 | #76 쿼리·키·값, 셀프 어텐션, 트랜스포머 |
| 6 | [긴 문맥의 비용: 온라인 softmax와 FlashAttention](#lesson-efficient-attention) | 심화 | 30분 | — |
| 7 | [선형 어텐션](#lesson-linear-attention) | 심화 | 30분 | — |
| 8 | [위치 인코딩의 수학과 길이 외삽](#lesson-position-extrapolation) | 심화 | 35분 | — |

## 핵심 레슨

<a id="lesson-tokenization"></a>

### 1. 토큰화, 서브워드, 토큰 임베딩, 위치 정보

핵심 · 45분 · [본문 원본](../../src/content/modules/transformers/tokenization.ts) · [실습 원본](../../src/content/modules/transformers/labs/tokenization.ts)

**학습 목표:** BPE가 가장 자주 나오는 쌍을 반복해서 병합해 어휘를 만드는 과정을 직접 계산하고 OOV 완화·한국어 토큰 수·철자 세기 약점과의 관계를 설명하며, 토큰 임베딩에 사인파 위치 인코딩을 더해 Transformer의 입력을 만든다.

**쓰이는 곳:** LLM의 입력과 출력은 모두 토큰 단위이므로 API 비용과 문맥 창의 길이도 토큰 수로 정해진다. 토큰화 방식을 알아야 한국어 사용 비용이 큰 이유와 철자 세기 같은 과제에서 LLM이 틀리는 이유를 설명할 수 있고, 토큰 임베딩과 위치 정보는 Transformer 입력층의 구성 요소다([6-1 트랜스포머 디코더 블록](#lesson-transformer-block)).

**본문 절:** 토큰화와 BPE · 학습한 규칙으로 새 단어 토큰화하기 · 토큰화가 만드는 현상 · 토큰 임베딩 · 위치 정보

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 3 · Colab 코드 1 · 그림 3

**실습**

- `ex1` BPE 병합 규칙 학습과 새 단어 토큰화

**서술형**

- `d1` 같은 내용의 한국어 문장이 영어 문장보다 토큰 수가 많은 이유를 BPE의 학습 방식으로 쓰고, 이것이 비용과 문맥 창에 주는 영향을 쓰라.
- `d2` Transformer의 입력에 위치 벡터를 더하는 이유를 쓰고, 사인파 위치 인코딩이 위치마다 다른 벡터를 만드는 방법을 식으로 쓰라.

**참고 자료**

- [Sennrich et al. (2016) — Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — BPE를 NLP에 도입한 논문: 알고리즘 1이 본문 코드와 같다 (영문)
- [Vaswani et al. (2017) — Attention Is All You Need](https://arxiv.org/abs/1706.03762) — 3.5절: 사인파 위치 인코딩 (영문)
- [Karpathy — Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE) — 바이트 수준 BPE를 처음부터 구현하는 영상 (영문)
- [Tiktokenizer](https://tiktokenizer.vercel.app/) — 문장을 넣으면 GPT 토크나이저의 토큰 경계를 보여 주는 웹 도구 (영문)

<a id="lesson-attention-motivation"></a>

### 2. 어텐션의 필요성: Seq2Seq의 병목

핵심 · 35분 · [본문 원본](../../src/content/modules/transformers/attention-motivation.ts) · [실습 원본](../../src/content/modules/transformers/labs/attention-motivation.ts)

**학습 목표:** Seq2Seq의 인코더-디코더 구조와 Teacher Forcing을 설명하고, 고정 크기 문맥 벡터의 병목이 attention으로 이어진 이유와 RNN 대비 self-attention의 경로 길이·연산량($O(1)$ 대 $O(n)$, $O(n^2)$)을 비교한다.

**쓰이는 곳:** Transformer와 LLM의 핵심 연산인 attention은 Seq2Seq 번역 모델의 병목을 해결하려고 제안되었다. attention이 해결한 문제와 그 대가($O(n^2)$ 연산량)를 알아야, 긴 문맥 처리가 비싼 이유와 효율적인 attention 연구([6-1 긴 문맥의 비용: 온라인 softmax와 FlashAttention](#lesson-efficient-attention))의 목적을 이해할 수 있다.

**본문 절:** Seq2Seq: 인코더와 디코더 · Teacher Forcing과 노출 편향 · 고정 크기 문맥 벡터의 병목 · Attention: 스텝마다 새로 만드는 문맥 벡터 · 경로 길이와 병렬화

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3 · 이미지 1

**실습**

- `ex1` 디코더가 필요할 때마다 다시 보는 attention

**서술형**

- `d1` Seq2Seq에서 인코더와 디코더가 각각 하는 일을 쓰고, Teacher Forcing이 학습을 안정시키는 이유와 그 대가인 노출 편향을 쓰라.
- `d2` Seq2Seq의 병목 문제를 쓰고, attention이 이를 해결하는 방법을 식으로 쓰라. RNN과 self-attention의 정보 경로 길이와 연산량도 비교하라.

**참고 자료**

- [Jay Alammar — Visualizing A Neural Machine Translation Model](https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/) — Seq2Seq와 Attention을 애니메이션으로 (영문)
- [Bahdanau et al. (2014) — Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) — attention을 처음 제안한 논문: 그림 1과 3절 (영문)

<a id="lesson-self-attention"></a>

### 3. 셀프 어텐션: 쿼리·키·값

핵심 · 45분 · [본문 원본](../../src/content/modules/transformers/self-attention.ts) · [실습 원본](../../src/content/modules/transformers/labs/self-attention.ts)

**학습 목표:** $\text{softmax}(QK^\top/\sqrt{d_k})V$의 각 부분($QK^\top$, softmax, $\sqrt{d_k}$, Value의 가중합)이 필요한 이유를 설명하고, 작은 예제를 손과 코드로 계산한다.

**쓰이는 곳:** self-attention은 Transformer와 LLM의 핵심 연산이다. 이 식을 계산할 수 있어야 multi-head attention([6-1 멀티헤드 어텐션과 인과 마스크](#lesson-multi-head-attention))과 디코더 블록([6-1 트랜스포머 디코더 블록](#lesson-transformer-block))을 구현할 수 있고, 문맥이 길수록 비용이 커지는 이유와 KV 캐시([6-2 생성 단계의 트랜스포머: KV 캐시와 RoPE](6-2-llm-training.md#lesson-kv-cache-rope))가 저장하는 값을 이해할 수 있다.

**본문 절:** Query, Key, Value · 코드로 확인하기 · 모든 Query를 한꺼번에 계산하기 · $\sqrt{d_k}$의 효과

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 4

**실습**

- `ex1` softmax(QKᵀ/√d_k)V 직접 계산하기

**서술형**

- `d1` $\text{softmax}(QK^\top/\sqrt{d_k})V$에서 $QK^\top$, softmax, $V$의 가중합이 각각 하는 일을 쓰고, 출력이 Key가 아니라 Value의 가중합인 이유를 쓰라.
- `d2` $\sqrt{d_k}$로 나누지 않으면 생기는 문제를 내적의 분산과 softmax의 기울기로 쓰고, 토큰 수 $n = 1000$일 때 헤드 하나의 점수 행렬 크기와 문맥이 2배가 될 때 계산량의 변화를 쓰라.

**참고 자료**

- [Jay Alammar — The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) — Q, K, V의 계산을 벡터 단위로 그린 자료 (영문)
- [3Blue1Brown — Attention in transformers, visually explained](https://www.3blue1brown.com/lessons/attention) — attention의 계산을 그림으로 설명하는 영상 (영문)
- [Vaswani et al. (2017) — Attention Is All You Need](https://arxiv.org/abs/1706.03762) — 3.2절 Scaled Dot-Product Attention, 각주 4에 √dk로 나누는 이유 (영문)

<a id="lesson-multi-head-attention"></a>

### 4. 멀티헤드 어텐션과 인과 마스크

핵심 · 40분 · [본문 원본](../../src/content/modules/transformers/multi-head-attention.ts) · [실습 원본](../../src/content/modules/transformers/labs/multi-head-attention.ts)

**학습 목표:** 멀티헤드 attention의 헤드 나누기, 헤드별 attention, 이어 붙이기, $W^O$ 투영 과정을 모양과 함께 계산하고, causal mask가 필요한 이유와 올바르게 적용되었는지 검사하는 방법을 설명한다.

**쓰이는 곳:** GPT를 포함한 모든 Transformer는 멀티헤드 causal attention을 쓴다. 텐서를 헤드별로 나누고 합치는 조작과 마스크를 정확히 구현해야 미니 GPT 블록을 만들 수 있으며, 마스크가 잘못되면 오류 없이 학습 결과만 틀리므로 검사 방법도 함께 알아야 한다.

**본문 절:** 헤드를 여러 개 쓰는 이유 · Causal mask · NumPy로 구현하기 · 마스크가 제대로 적용되었는지 검사하기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · Colab 코드 1 · 그림 2 · 이미지 1

**실습**

- `ex1` 헤드 나누기·합치기와 causal mask

**서술형**

- `d1` causal mask가 없으면 다음 토큰 예측 학습에서 어떤 문제가 생기는지 쓰고, 마스크가 올바르게 적용되었는지 검사하는 방법을 쓰라.
- `d2` 총 차원이 같을 때 헤드 여러 개가 헤드 하나보다 유리한 이유를 softmax 분포의 관점에서 쓰고, $d = 512$, $h = 8$일 때 헤드 나누기에서 $W^O$ 투영까지의 텐서 모양을 쓰라.

**참고 자료**

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) — 논문을 PyTorch 코드로 옮긴 자료: MultiHeadedAttention과 subsequent_mask 부분 (영문)
- [Karpathy — Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) — causal self-attention을 처음부터 구현하는 약 2시간 분량의 영상 (영문)
- [Karpathy — nanoGPT](https://github.com/karpathy/nanoGPT) — 작은 GPT를 학습하는 최소 구현 코드 (영문)

<a id="lesson-transformer-block"></a>

### 5. 트랜스포머 디코더 블록

핵심 · 40분 · [본문 원본](../../src/content/modules/transformers/transformer-block.ts) · [실습 원본](../../src/content/modules/transformers/labs/transformer-block.ts)

**학습 목표:** 마스크 없는 self-attention이 순열 등변 연산이라 위치 정보가 필요한 이유와 causal mask가 이를 바꾸는 방식을 설명하고, GPT형 디코더 블록에서 attention, MLP, 잔차 연결, LayerNorm이 맡는 역할을 코드로 확인한다.

**쓰이는 곳:** GPT를 포함한 현재의 LLM은 이 레슨의 디코더 블록을 수십 개 쌓은 구조다([6-2 LLM 구조: BERT, GPT, T5](6-2-llm-training.md#lesson-llm-architectures)). 블록의 구성 요소별 역할을 알아야 모델의 파라미터 수와 계산량을 계산할 수 있고([6-3 트랜스포머의 크기 계산](6-3-llm-systems.md#lesson-transformer-params)), 미니 GPT 블록을 직접 구현할 수 있다.

**본문 절:** 인코더와 디코더 · 위치 정보가 필요한 이유 · Attention과 MLP · 잔차 연결과 LayerNorm

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 3 · 이미지 1

**실습**

- `ex1` 사인·코사인 위치 인코딩으로 순서 구별하기

**서술형**

- `d1` 위치 정보 없는 self-attention에 "고양이가 생선을 먹었다"와 "먹었다 생선을 고양이가"를 넣으면 각 단어의 출력은 같고 문장 전체 출력의 평균도 같다. 두 성질이 각각 순열 등변과 순열 불변 중 무엇인지 쓰고, causal mask를 쓰면 위치 정보 없이도 '고양이가'의 출력이 달라지는 이유를 쓰라.
- `d2` Transformer 디코더 블록에서 attention과 MLP가 각각 하는 일을 쓰고, 잔차 연결과 LayerNorm이 블록을 깊게 쌓는 데 필요한 이유를 쓰라.

**참고 자료**

- [Jay Alammar — The Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/) — 디코더 전용 블록과 masked self-attention을 그림으로 (영문)
- [Haviv et al. (2022) — Transformer Language Models without Positional Encodings Still Learn Positional Information](https://arxiv.org/abs/2203.16634) — causal mask만으로 위치 정보를 학습하는 디코더 (영문)
- [Meng et al. (2022) — Locating and Editing Factual Associations in GPT](https://arxiv.org/abs/2202.05262) — 사실 관계 정보와 MLP 층의 관계 (영문)

## 심화 레슨

<a id="lesson-efficient-attention"></a>

### 6. 긴 문맥의 비용: 온라인 softmax와 FlashAttention

심화 · 30분 · [본문 원본](../../src/content/modules/transformers/efficient-attention.ts) · [실습 원본](../../src/content/modules/transformers/labs/efficient-attention.ts)

**학습 목표:** 최댓값을 빼는 안전한 softmax와 온라인 softmax 갱신식을 유도하고 구현하며, FlashAttention이 GPU 메모리 계층에서 HBM 읽기·쓰기를 줄여 빨라지는 이유와 한계를 설명한다.

**쓰이는 곳:** LLM의 문맥 길이와 학습·추론 속도는 attention의 메모리 사용량에 크게 좌우된다. PyTorch의 `scaled_dot_product_attention`과 대부분의 LLM 서빙 엔진이 FlashAttention 계열의 방법을 쓰므로, 그 원리를 알아야 긴 문맥의 비용을 추정하고 서빙 비용([6-3 모델 서빙과 추론 비용](6-3-llm-systems.md#lesson-serving-cost))을 이해할 수 있다.

**본문 절:** 안전한 softmax와 온라인 softmax · 빨라지는 이유: GPU의 메모리 계층

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2 · 이미지 1

**실습**

- `ex1` 온라인 softmax로 블록 단위 attention 계산하기

**서술형**

- `d1` softmax를 계산할 때 최댓값을 빼는 이유는? 온라인 softmax가 점수를 블록 단위로 보면서도 정확한 결과를 내는 갱신식을 쓰고, FlashAttention이 FLOPs를 줄이지 않고도 빨라지는 이유를 GPU 메모리 계층으로 설명하라.

**참고 자료**

- [Dao et al. (2022) — FlashAttention](https://arxiv.org/abs/2205.14135) — IO를 고려한 정확한 attention (영문)
- [Milakov & Gimelshein (2018) — Online normalizer calculation for softmax](https://arxiv.org/abs/1805.02867) — 온라인 softmax (영문)

<a id="lesson-linear-attention"></a>

### 7. 선형 어텐션

심화 · 30분 · [본문 원본](../../src/content/modules/transformers/linear-attention.ts) · [실습 원본](../../src/content/modules/transformers/labs/linear-attention.ts)

**학습 목표:** attention을 커널 가중평균으로 쓰고 결합법칙으로 선형 attention을 유도하며, 인과적 선형 attention이 고정 크기 상태를 가진 RNN과 같음을 구현으로 확인하고 그 대가를 설명한다.

**쓰이는 곳:** Mamba 같은 상태공간 모델과 게이트 선형 attention처럼 문맥 길이에 대해 선형인 모델은 긴 문맥의 비용을 줄이려는 연구의 주요 방향이다. 이 모델들이 softmax attention과 무엇을 바꾸고 무엇을 잃는지 알아야 긴 문맥 모델을 비교하고 선택할 수 있다.

**본문 절:** 유사도 커널의 가중평균으로 쓴 attention · 인과적 선형 attention과 RNN

**구성:** 확인 문제 6 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 인과적 선형 어텐션: 행렬 계산과 RNN 계산

**서술형**

- `d1` attention을 커널 가중평균으로 쓰고, 커널을 $\phi(q)^\top\phi(k)$로 분해할 때 결합법칙으로 연산량이 $O(n^2d)$에서 $O(nd^2)$로 바뀌는 이유를 쓰라. 인과적 선형 attention이 RNN과 같아지는 이유와 그 대가(정보 병목)도 쓰라.

**참고 자료**

- [Katharopoulos et al. (2020) — Transformers are RNNs](https://arxiv.org/abs/2006.16236) — 선형 어텐션과 RNN의 등가성 (영문)
- [Gu & Dao (2023) — Mamba](https://arxiv.org/abs/2312.00752) — 입력에 따라 상태 갱신을 조절하는 상태공간 모델 (영문)

<a id="lesson-position-extrapolation"></a>

### 8. 위치 인코딩의 수학과 길이 외삽

심화 · 35분 · [본문 원본](../../src/content/modules/transformers/position-extrapolation.ts) · [실습 원본](../../src/content/modules/transformers/labs/position-extrapolation.ts)

**학습 목표:** 사인파 위치 인코딩의 회전 성질을 덧셈 정리로 증명하고, RoPE가 학습 길이를 넘는 입력에서 성능이 떨어지는 이유를 성분별 파장으로 설명하며, 위치 보간의 원리와 대가를 계산한다.

**쓰이는 곳:** LLM의 문맥 길이는 사전학습 뒤 위치 보간 같은 방법으로 늘리는 경우가 많다. 그 원리와 대가를 알아야 긴 문맥 모델의 사양을 해석하고, 학습 길이보다 긴 문서를 넣었을 때 성능이 떨어지는 이유를 설명할 수 있다.

**본문 절:** 사인파 인코딩의 상대 위치 성질 · 학습 길이를 넘는 위치의 문제 · 위치 보간과 그 대가

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` RoPE의 파장·상대 위치와 위치 보간

**서술형**

- `d1` 사인파 위치 인코딩에서 $PE(p+k)$가 $PE(p)$의 회전으로 얻어지는 이유를 덧셈 정리로 보여라. RoPE 모델이 학습 길이를 넘는 문맥에서 성능이 떨어지는 이유를 학습 중 한 바퀴도 돌지 않은 성분으로 쓰고, 위치 보간의 원리와 대가를 쓰라.
- `d2` 4K 토큰으로 사전학습한 RoPE 모델을 32K 문맥에서 쓰려고 한다. 아무 조치 없이 쓰면 생기는 문제를 성분별 파장으로 쓰고, 위치 보간과 NTK-aware(또는 YaRN) 방식을 비교해 어떤 방식을 고를지 근거와 함께 쓰라.

**참고 자료**

- [Su et al. (2021) — RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) — RoPE 원 논문 (영문)
- [Chen et al. (2023) — Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) — 위치 보간 (영문)
- [Peng et al. (2023) — YaRN](https://arxiv.org/abs/2309.00071) — 주파수별 보간으로 문맥 확장 (영문)

## 백지 복습

1. Seq2Seq의 병목 문제를 쓰고, attention이 출력 스텝마다 문맥 벡터 $c_t$를 만드는 식을 쓰라. RNN과 self-attention의 정보 경로 길이와 연산량도 비교하라.
2. self-attention에서 Query, Key, Value가 하는 일과 $\text{softmax}(QK^\top/\sqrt{d_k})V$의 계산 순서를 쓰라. 토큰 $n$개일 때 $Q$, $QK^\top$, 출력의 모양도 쓰라.
3. 점수를 $\sqrt{d_k}$로 나누는 이유를 내적의 분산과 softmax의 기울기로 쓰라.
4. causal mask가 가리는 칸과 마스크 없이 학습하면 생기는 문제를 쓰고, 헤드를 여러 개 쓰는 이유와 $d = 512$, $h = 8$일 때 헤드별 텐서의 모양을 쓰라.
5. 위치 정보가 없는 self-attention이 단어의 순서를 구별하지 못하는 이유를 순열 등변성으로 쓰고, 사인파 위치 인코딩의 식을 쓰라.

## 과제: 나만의 미니 GPT 블록

저장 키 `mini-gpt-block` · 자기 점검 · [과제 원본](../../src/content/modules/transformers/assignment.ts)

GPT 블록의 핵심인 멀티헤드 causal self-attention을 NumPy로 직접 구현하고, 세 가지 독립적인 방법으로 정확성을 검증합니다. [6-1 셀프 어텐션: 쿼리·키·값](#lesson-self-attention)의 숫자 예제를 코드로 재현하고 Query를 바꿔 비교하며, 마스크와 $\sqrt{d_k}$ 스케일링이 attention 가중치에 어떤 영향을 주는지 히트맵으로 관찰합니다. 마지막으로 "Attention Is All You Need" 논문을 읽고 리포트를 작성합니다.

**핵심** 항목은 모두 핵심 레슨만으로 풀 수 있고 자기 점검 기준도 핵심 항목을 확인합니다. **심화** 항목은 선택이며 과제 점수는 매기지 않습니다.

### 요구사항

- `multi_head_attention`의 점수 계산 TODO를 채우고, 모든 중간 텐서 옆에 shape 주석을 적는다($W^O$ 출력 투영 포함).
- 검증 (a) 헤드별 계산과 비교, (b) causal 테스트, (c) 반복문 참조 구현과 비교가 모두 `True`가 된다.
- 본문 숫자 예제(가중치 18.8% · 51.0% · 11.4% · 18.8%, 출력 $[1.24, 1.65]$)를 재현하고, Query를 두 가지 이상 바꿔 표로 비교한다.
- 마스크·스케일링 네 조합의 히트맵과 $d_k$별 최대 가중치를 근거로 관찰을 세 문장 이상 쓴다.
- "Attention Is All You Need" 리포트를 출처와 함께 작성한다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| 멀티헤드 causal self-attention 구현 | 핵심 | 코드 `mha-code` |
| 정확성 검증 세 가지 | 핵심 | 코드 `verify-code`, 답안 `verify-answer`(최소 120자) |
| 숫자 예제 재현과 변형 | 핵심 | 코드 `example-code`, 답안 `example-answer`(최소 250자) |
| 마스크와 스케일링 관찰 실험 | 핵심 | 코드 `observe-heatmap`, 코드 `observe-dk`, 답안 `observe-answer`(최소 150자) |
| 논문 리포트 | 핵심 | 답안 `paper-answer`(최소 500자) |
| 심화: 문자 단위 언어 모델·KV 캐시·효율적 attention | 심화 | 코드 `advanced-code`, 답안 `advanced-answer` |

### 자기 점검 기준

| 기준 | 확인 내용 |
| --- | --- |
| 구현 정확성 | 검증 세 가지(헤드별 계산, causal 테스트, 참조 구현)를 모두 통과했습니다. |
| shape 추적과 설명 | 모든 중간 텐서의 shape을 정확히 적고, 각 검증의 의미를 설명했습니다. |
| 숫자 예제 재현과 변형 | 본문 결과를 재현하고, Query 변형에 따른 변화를 내적으로 설명했습니다. |
| 관찰 실험 | 마스크·스케일링의 효과와 d_k에 따른 쏠림을 수치와 그림으로 설명했습니다. |
| 논문 리포트 | 설계 선택의 이유와 이후 변화를 출처와 함께 정확히 정리했습니다. |

### 자동 테스트

- `mha`: multi_head_attention이 독립 구현과 일치하고 가중치가 올바르다
- `mha`: scale=False면 √d_k로 나누지 않는다
- `verify`: 반복문 참조 구현이 벡터화 구현과 일치한다(새 입력에서도)
- `example`: 본문 예제 재현 + Query를 하나 이상 더 추가했다

### 선택 심화 문제

- `ch1` GPT형 디코더 블록 전체 순전파
- `ch2` 바이트 수준 BPE로 한국어 토큰 수 줄이기
