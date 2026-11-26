# 주제별 흔한 오개념

레슨의 "오개념 방지" 항목을 채점할 때 쓰는 목록이다. 레슨이 **자기 핵심 개념에 해당하는 오해**를 다루는지 본다. 목록의 모든 항목을 다룰 필요는 없다. 레슨 id는 그 오해를 다루기에 알맞은 곳이다.

좋은 대응 순서(반박 텍스트, Tippett 2010; Guzzetti 외 1993): 오해를 분명히 밝힌다 → 왜 그럴듯한지 인정한다 → 학습자가 직접 계산·실행할 수 있는 반례로 반박한다 → 올바른 설명을 준다. "주의한다"만 적은 문구는 대응이 아니다.

실수(slip)와 오개념을 구분한다. 한 번의 오타·부호 실수는 실수이고, 여러 문제에서 같은 잘못된 규칙을 쓰면 오개념이다. 레슨은 오개념을 다룬다.

## Python (1-x)

| 오해 | 반박(반례·근거) | 레슨 |
| --- | --- | --- |
| `=`는 수학의 등호다 | `x = 5; x = x + 1`을 줄마다 추적하면 6. "계산해서 이름에 다시 묶는다"는 명령이다 | variables-types |
| 프로그램의 모든 줄이 동시에 성립한다 | 줄마다 변수 값을 적는 추적표에서 값이 시간에 따라 바뀐다 | variables-types, loops |
| 입력·파일에서 읽은 숫자는 수다 | `"3" + "4"`는 `"34"`, `int("3") + 4`는 7 | variables-types, file-io |
| 부동소수 연산은 정확하다 | `0.1 + 0.2 == 0.3`은 `False`. `math.isclose`로 비교한다 | operators |
| `round`는 사사오입이다 | `round(2.5)`는 2, `round(2.675, 2)`는 2.67(이진 표현 오차) | operators |
| `and`·`or`는 항상 `True`/`False`를 돌려준다 | `0 or "기본값"`은 `"기본값"`. 피연산자 하나를 돌려준다 | conditionals |
| 조건문은 변수가 바뀌면 다시 검사된다 | `if` 뒤에서 값을 바꿔도 이미 지난 분기는 다시 실행되지 않는다 | conditionals |
| `range(1, 5)`는 5를 포함한다 | `list(range(1, 5))`는 `[1, 2, 3, 4]` | loops |
| 반복 중에 리스트 원소를 지워도 된다 | `for x in a: a.remove(x)`는 원소를 건너뛴다 | loops, collections |
| 딕셔너리는 순서가 없다 | Python 3.7부터 삽입 순서를 유지한다. 집합은 순서를 보장하지 않는다 | collections |
| 슬라이스 끝 인덱스도 포함된다 | `"python"[1:3]`은 `"yt"` | indexing-slicing |
| `b = a`는 리스트를 복사한다 | `b.append(1)` 뒤 `a`도 바뀐다. 이름 두 개가 객체 하나를 가리킨다 | mutability-copy |
| `[[0] * 3] * 3`은 독립된 행 세 개다 | 한 행을 바꾸면 세 행이 모두 바뀐다 | mutability-copy |
| `==`와 `is`는 같다 | 내용이 같은 리스트 두 개는 `==`가 `True`, `is`가 `False` | mutability-copy |
| 함수에서 `print`하면 값을 돌려준다 | `r = f()` 뒤 `r`은 `None` | functions-scope |
| 매개변수에 다시 대입하면 호출한 쪽 변수가 바뀐다 | 재대입은 지역 이름만 바꾼다. 리스트를 넘겨 원소를 바꾸면 호출한 쪽도 바뀐다 | functions-scope, mutability-copy |
| 기본 인자 `def f(x=[])`는 호출마다 새로 만들어진다 | 정의할 때 한 번 만들어져 호출 사이에 공유된다 | functions-scope |
| 함수는 정의할 때 실행된다 | 본문에 `print`를 넣고 정의만 하면 아무것도 출력되지 않는다 | functions-scope |
| 반복자는 여러 번 순회할 수 있다 | 제너레이터를 `list`로 한 번 바꾸면 두 번째는 빈 리스트다 | comprehensions-iterators |
| `except:`로 모든 오류를 잡으면 안전하다 | 오타로 난 `NameError`까지 숨긴다. 처리할 예외만 잡는다 | errors-debugging |
| 오류 메시지는 건너뛰어도 된다 | 마지막 줄의 예외 종류와 메시지, 위로 올라가며 내 코드의 줄 번호를 읽는다 | errors-debugging |
| 내 파일 이름을 `random.py`로 지어도 된다 | 표준 모듈 대신 내 파일을 불러온다(이름 가림) | modules-environments |
| 파일은 열면 저절로 닫힌다 | `with`가 블록을 벗어날 때 닫는다. 인코딩은 `encoding="utf-8"`로 정한다 | file-io |
| 클래스 속성과 인스턴스 속성은 같다 | 가변 클래스 속성은 모든 인스턴스가 공유한다 | classes-objects |
| 리스트의 `in`과 집합의 `in`은 속도가 같다 | 리스트는 $O(n)$, 집합은 평균 $O(1)$. 원소 수를 늘려 시간을 잰다 | complexity |

## 수학 (2-x)

| 오해 | 반박(반례·근거) | 레슨 |
| --- | --- | --- |
| 모든 함수는 $f(a+b) = f(a) + f(b)$다 | $f(x) = x^2$: $f(1+1) = 4 \ne 2$ | functions-composition |
| 합성 순서는 상관없다 | $f(x) = x + 1$, $g(x) = 2x$: $f(g(1)) = 3$, $g(f(1)) = 4$ | functions-composition |
| $\log(a + b) = \log a + \log b$ | 로그는 곱을 합으로 바꾼다. $a = b = 1$: $\log 1 + \log 1 = 0$, $\log 2 \approx 0.693$. $a = b = 2$는 $2 + 2 = 2 \times 2$라 우연히 같으므로 반례로 쓰지 않는다 | elementary-functions |
| $(\sum a_i)(\sum b_i) = \sum a_i b_i$ | $a = b = (1, 1)$: 좌변 4, 우변 2 | sigma-sequences |
| 행렬곱은 교환법칙이 성립한다 | 2×2 행렬 두 개로 $AB \ne BA$를 계산한다 | matrix-multiplication |
| $(AB)^\top = A^\top B^\top$ | 모양부터 맞지 않는다. $B^\top A^\top$이다 | matrix-multiplication |
| `*`는 행렬곱이다 | NumPy의 `*`는 원소별 곱, 행렬곱은 `@` | matrix-multiplication, numpy-arrays |
| 벡터의 "차원"과 배열의 축 수는 같다 | 길이 3인 벡터는 3차원 공간의 원소지만 배열로는 축이 1개다 | scalars-tensors |
| 코사인 유사도 0은 반대 방향이다 | 0은 직교, −1이 반대 방향 | dot-product |
| 선형독립이면 서로 직교한다 | $(1, 0)$과 $(1, 1)$은 독립이지만 직교하지 않는다 | linear-maps-basis |
| 기저는 하나뿐이다 | 같은 공간에 기저는 무수히 많다. 표준기저는 그중 하나다 | linear-maps-basis |
| 고유벡터는 유일하다 | $Av = \lambda v$이면 $A(2v) = \lambda(2v)$ | rank-eigen |
| 랭크는 행의 수다 | 같은 행이 두 번 있으면 랭크가 줄어든다 | rank-eigen |
| 연속이면 미분 가능하다 | $\lvert x \rvert$는 0에서 연속이지만 미분 불가 | derivatives |
| 도함수가 0인 점은 최솟값이다 | $x^3$의 0은 최솟값이 아니다. 최댓값·안장점도 있다 | derivatives, gradient-descent |
| $(fg)' = f'g'$ | $f = g = x$: $(x^2)' = 2x$, $f'g' = 1$ | derivatives |
| 기울기는 함수가 줄어드는 방향이다 | 기울기는 가장 빨리 **증가**하는 방향, 경사하강법은 반대로 간다 | gradient |
| 연쇄법칙은 도함수를 더한다 | 한 경로에서는 곱하고, 여러 경로가 모이면 경로별 곱을 더한다 | chain-rule |
| 학습률이 클수록 빨리 수렴한다 | $f(w) = w^2$에서 $\eta > 1$이면 발산한다 | gradient-descent, gd-convergence |
| 경사하강법은 전역 최솟값을 찾는다 | 비볼록 함수에서는 시작점에 따라 다른 극솟값에 멈춘다 | gradient-descent |
| 독립과 배반은 같다 | 확률이 양수인 배반 사건은 독립일 수 없다($P(A \cap B) = 0 \ne P(A)P(B)$) | probability-rules |
| 앞면이 다섯 번 나왔으니 뒷면이 나올 차례다 | 독립 시행에서 다음 확률은 그대로 1/2(도박사의 오류) | probability-rules |
| $P(A \mid B) = P(B \mid A)$ | 1000명 빈도표로 양성 판정과 실제 질병의 비대칭을 보인다(기준율) | bayes |
| $\mathrm{Var}(aX) = a\,\mathrm{Var}(X)$ | $a^2$배다 | random-variables |
| $\mathrm{Var}(X + Y)$는 항상 분산의 합이다 | 독립(또는 무상관)일 때만. $Y = X$이면 $4\,\mathrm{Var}(X)$ | random-variables |
| 확률밀도 값은 확률이다 | $N(0, 0.1^2)$의 밀도는 0에서 약 3.99로 1을 넘는다. 확률은 넓이다 | distributions |
| 표본이 크면 표본편향이 사라진다 | 편향된 추출 방식은 크기를 늘려도 그대로다 | sampling |
| 평균은 언제나 좋은 대표값이다 | 이상치 하나로 평균이 크게 움직인다. 중앙값과 비교한다 | summary-statistics |
| 상관계수 0이면 관계가 없다 | $y = x^2$($x$가 −1~1 대칭)은 상관계수 0이지만 완전히 결정된다 | correlation |
| 상관관계는 인과관계다 | 공통 원인(교란 변수)을 보인다 | correlation |
| 중심극한정리로 데이터 자체가 정규분포가 된다 | 정규분포에 가까워지는 것은 **표본평균의 분포**다 | lln-clt |
| p값은 귀무가설이 참일 확률이다 | 귀무가설이 참이라고 가정했을 때 관찰만큼 극단적인 결과가 나올 확률이다 | statistical-inference |
| 95% 신뢰구간은 모수가 그 안에 있을 확률이 95%다 | 같은 절차를 반복하면 구간의 95%가 모수를 포함한다 | statistical-inference |
| 유의하면 효과가 크다 | 표본이 크면 작은 효과도 유의하다. 효과 크기를 따로 본다 | statistical-inference |
| 가능도는 파라미터의 확률이다 | 데이터를 고정한 파라미터의 함수이며 합이 1일 필요가 없다 | likelihood-entropy |
| KL 발산은 대칭이다 | 두 분포를 바꿔 계산하면 값이 다르다 | entropy-kl |

## 데이터 처리 (3-x)

| 오해 | 반박(반례·근거) | 레슨 |
| --- | --- | --- |
| NumPy 슬라이스는 복사본이다 | 슬라이스(뷰)를 바꾸면 원본이 바뀐다. 리스트 슬라이스는 복사본이다 | array-indexing |
| 브로드캐스팅은 앞쪽 축부터 맞춘다 | 뒤쪽 축부터 비교한다. `(3, 1)`과 `(4,)` → `(3, 4)` | array-indexing |
| 정수 배열은 넘치지 않는다 | 고정 크기 정수는 범위를 넘으면 값이 돌아간다. Pyodide 기본 정수는 `int32` | numpy-arrays |
| `NaN == NaN`은 참이다 | 거짓이다. `isna()`로 찾는다 | data-cleaning, pandas-selection |
| `loc`와 `iloc`의 슬라이스는 같다 | `loc`는 끝 이름표를 포함, `iloc`는 끝 위치를 제외 | pandas-selection |
| 필터링한 표에 대입하면 원본이 바뀐다 | 연쇄 인덱싱 대입은 사본에 쓰일 수 있다. `loc[행 조건, 열]`로 한 번에 쓴다 | pandas-selection |
| `merge`는 행 수를 유지한다 | 키가 중복되면 행이 늘어난다. `validate=`로 확인한다 | pandas-aggregation |
| 결측은 지우면 된다 | 결측이 특정 집단에 몰려 있으면 삭제가 표본을 편향시킨다 | data-cleaning |
| 이상치는 오류다 | 실제 드문 값일 수 있다. 원인을 확인하고 처리한다 | data-cleaning, eda |
| 표준화와 정규화(min-max)는 같다 | 평균 0·표준편차 1 대 범위 [0, 1]. 이상치에 대한 민감도가 다르다 | encoding-scaling |
| 스케일러를 전체 데이터로 학습해도 된다 | 평가 데이터의 통계가 학습에 새어 들어간다(누수). 학습 데이터로만 `fit`한다 | encoding-scaling, data-splits |
| 명목형 변수를 정수로 바꾸면 충분하다 | 서울=0, 부산=1, 대구=2는 없는 순서를 만든다. 원-핫을 쓴다 | encoding-scaling |
| 특성이 많을수록 좋다 | 차원이 늘면 점 사이 거리가 비슷해지고 필요한 데이터가 급격히 는다 | feature-engineering |
| 그래프 축은 아무 데서나 시작해도 된다 | 막대그래프의 y축을 자르면 차이가 과장된다 | visualization |

## 머신러닝 (4-x)

| 오해 | 반박(반례·근거) | 레슨 |
| --- | --- | --- |
| 학습 정확도가 높으면 좋은 모델이다 | $K = 1$ 최근접 이웃의 학습 정확도는 1이다. 새 데이터 성능을 본다 | bias-variance, knn-trees |
| 테스트 세트로 하이퍼파라미터를 골라도 된다 | 고른 순간 테스트 점수가 낙관적으로 편향된다. 검증 세트·교차검증을 쓴다 | data-splits, cross-validation |
| 분할 전에 전체 데이터로 전처리해도 된다 | 스케일링·결측 대체·특성 선택이 평가 데이터를 본다(누수) | data-splits |
| 시계열도 무작위로 나누면 된다 | 미래로 과거를 예측하게 된다. 시간 순서로 나눈다 | cross-validation |
| 정확도 하나로 충분하다 | 양성 1%에서 모두 음성이라고 해도 정확도 99% | classification-metrics |
| 정밀도와 재현율은 같은 것을 잰다 | 분모가 다르다: 예측 양성 대 실제 양성 | classification-metrics |
| 불균형 데이터에서는 ROC-AUC가 충분하다 | 음성이 많으면 FPR이 작게 보인다. PR-AUC와 기준선(양성 비율)을 함께 본다 | roc-pr |
| 분류 임계값은 0.5로 정해져 있다 | 오류 비용에 따라 임계값을 고른다 | logistic-regression, cost-threshold |
| 로지스틱 회귀는 회귀 모델이다 | 확률을 출력하는 분류 모델이다 | logistic-regression |
| 예측 확률 0.8은 실제로 80%가 양성이라는 뜻이다 | 보정되지 않은 모델은 다르다. 보정 곡선으로 확인한다 | cost-threshold |
| $R^2$는 0 이상이다 | 평균보다 나쁜 모델은 테스트에서 음수가 된다 | linear-regression |
| 규제는 성능을 항상 올린다 | λ가 너무 크면 과소적합한다 | regularization |
| 모델을 복잡하게 하면 편향과 분산이 함께 준다 | 편향은 줄고 분산은 는다 | bias-variance |
| 교차검증 최고 점수가 최종 성능이다 | 여러 후보 중 최고를 고르면 선택 편향이 생긴다 | cross-validation, model-evaluation-stats |
| 기준 모델은 필요 없다 | 최빈값·평균 예측보다 나은지 모르면 모델의 가치를 판단할 수 없다 | baselines |
| 손실이 줄면 평가 지표도 반드시 좋아진다 | 교차엔트로피가 줄어도 정확도가 그대로일 수 있다 | loss-functions |
| 자기지도학습은 비지도학습이다 | 데이터에서 만든 정답(다음 토큰 등)으로 지도학습처럼 학습한다 | learning-paradigms |
| K-means의 결과는 시드와 관계없다 | 초기 중심에 따라 다른 군집에 수렴한다 | kmeans-pca-pipeline |
| 스케일링 없이 PCA를 해도 된다 | 단위가 큰 특성이 주성분을 차지한다 | kmeans-pca-pipeline |
| 특성 중요도는 인과 효과다 | 모델이 그 특성을 얼마나 썼는지일 뿐이다. 상관된 특성끼리 중요도를 나눠 갖는다 | boosting |
| 결정트리는 스케일링이 필요하다 | 분할 기준이 순서만 쓰므로 필요 없다. KNN은 거리 때문에 필요하다 | knn-trees |
| 나이브 베이즈는 독립 가정이 틀리면 분류도 틀린다 | 확률은 부정확해도 순위가 맞으면 분류는 맞을 수 있다 | naive-bayes |

## 딥러닝 (5-x)

| 오해 | 반박(반례·근거) | 레슨 |
| --- | --- | --- |
| 선형 층을 쌓으면 표현력이 늘어난다 | 활성화가 없으면 $W_2 W_1 x$는 선형 변환 하나다 | perceptron-mlp |
| 역전파가 가중치를 갱신한다 | 역전파는 기울기를 계산하고, 갱신은 옵티마이저가 한다 | backprop, optimizers |
| `zero_grad` 없이도 된다 | PyTorch는 기울기를 누적한다. 두 번 `backward`하면 두 배가 된다 | pytorch |
| 에폭과 반복(갱신)은 같다 | 데이터 2000개, 배치 50이면 한 에폭은 40번 갱신이다 | optimizers |
| Adam은 언제나 SGD보다 낫다 | 일반화가 더 나쁜 사례가 있다. 문제마다 비교한다 | optimizers, adam-theory |
| 가중치를 0으로 초기화해도 된다 | 같은 층의 뉴런이 같은 기울기를 받아 끝까지 같다(대칭) | initialization |
| BatchNorm은 추론 때도 배치 통계를 쓴다 | `eval()`에서는 학습 중 모은 이동 평균을 쓴다 | normalization-layers |
| 드롭아웃은 추론 때도 뉴런을 끈다 | 추론 때는 끄지 않는다. 학습 때 남은 값을 $1/(1-p)$배 한다 | dropout-residual |
| 잔차 연결은 파라미터를 늘려 성능을 올린다 | 덧셈은 파라미터가 없다. 기울기가 항등 경로로 전달된다 | dropout-residual |
| 딥러닝의 합성곱은 커널을 뒤집는다 | 라이브러리의 합성곱은 뒤집지 않는 교차상관이다 | convolution |
| 풀링 층에 학습 파라미터가 있다 | 최댓값·평균만 계산하므로 없다 | pooling |
| 데이터 증강을 평가 데이터에도 한다 | 평가는 원본으로 한다 | cnn-training |
| 임베딩은 원-핫 벡터다 | 원-핫과 임베딩 행렬의 곱, 즉 행 하나를 고르는 것이다 | embeddings |
| RNN은 시점마다 다른 가중치를 쓴다 | 모든 시점이 같은 가중치를 공유한다 | rnn |
| LSTM은 기울기 소실을 없앤다 | 줄일 뿐이다. 아주 긴 의존성은 여전히 어렵다 | lstm-gru |

## 트랜스포머·LLM (6-x)

| 오해 | 반박(반례·근거) | 레슨 |
| --- | --- | --- |
| 토큰은 단어다 | 서브워드 토큰화에서 한 단어가 여러 토큰이 된다 | tokenization |
| self-attention은 순서를 안다 | 위치 정보가 없으면 순열 등변이다 | tokenization, transformer-block |
| attention 가중치는 모델의 판단 근거다 | 가중치가 크다고 출력에 대한 기여가 크다는 보장은 없다 | self-attention |
| $\sqrt{d_k}$로 나누는 것은 정규화다 | 내적의 분산이 $d_k$에 비례해 softmax가 포화하는 것을 막는다 | self-attention |
| 헤드 수를 늘리면 파라미터가 는다 | $d$를 유지하면 $4d^2$ 그대로다 | multi-head-attention |
| 인과 마스크는 학습 때만 쓴다 | 생성 때도 같은 규칙(앞 토큰만 봄)이 성립한다 | multi-head-attention, kv-cache-rope |
| 온도 0이면 답이 정확하다 | 가장 확률 높은 토큰을 고를 뿐 사실성과 무관하다 | decoding |
| LLM은 사실을 저장했다가 찾아 준다 | 다음 토큰 확률을 학습한 모델이다. 그럴듯한 틀린 답을 만든다 | pretraining, hallucination |
| 문맥 창 안의 정보는 모두 똑같이 활용된다 | 중간에 있는 정보의 활용이 떨어진다(lost in the middle) | rag |
| LoRA는 모델을 작게 만든다 | 원래 가중치는 그대로 두고 작은 행렬만 학습한다 | instruction-tuning |
| 보상 모델의 점수는 정답이다 | 사람 선호의 근사이며 과최적화하면 보상 해킹이 생긴다 | preference-learning |
| 프롬프트로 "환각하지 말라"고 쓰면 환각이 사라진다 | 근거 문서·검증 절차가 필요하다 | prompt-design, hallucination |
| 모델만 키우면 성능이 오른다 | 계산량이 정해지면 파라미터와 데이터의 최적 비율이 있다(Chinchilla) | scaling-laws |
| KV 캐시는 학습을 빠르게 한다 | 생성 단계에서 이전 토큰의 키·값을 다시 계산하지 않게 한다 | kv-cache-rope |
| 임베딩 유사도가 높으면 답이 들어 있다 | 주제가 비슷할 뿐 질문에 답하지 않는 문서도 가깝다 | retrieval |
| RAG를 쓰면 환각이 없어진다 | 검색 실패·문서 오독으로 여전히 생긴다 | rag, hallucination |
| Recall@k가 높으면 답변도 좋다 | 생성 단계가 문서를 잘못 쓰면 답이 틀린다. 단계별로 평가한다 | retrieval-metrics |
| 에이전트에 도구를 많이 줄수록 좋다 | 선택 오류와 위험이 는다. 승인은 되돌릴 수 없는 행동에 둔다 | agent-design |
| LLM 심판은 객관적이다 | 위치·길이 편향이 있다. 순서를 바꿔 두 번 평가한다 | llm-evaluation |
| 벤치마크 1~2점 차이는 의미 있다 | 문항 수가 적으면 신뢰구간이 그보다 넓다 | eval-statistics |
| 입력 필터로 프롬프트 인젝션을 막을 수 있다 | 우회 표현이 무한하다. 권한 분리 같은 설계 수준 방어가 필요하다 | injection-defense |
| 투기적 디코딩은 출력 분포를 바꾼다 | 수락-거절 규칙을 지키면 큰 모델의 분포와 같다 | speculative-decoding |

## 책임 있는 AI·비전·생성 (X-1, X-2)

| 오해 | 반박(반례·근거) | 레슨 |
| --- | --- | --- |
| 민감 속성 열을 빼면 공정해진다 | 우편번호처럼 민감 속성과 상관된 대리 변수가 남는다 | fairness, bias-mitigation |
| 공정성 기준을 모두 동시에 만족할 수 있다 | 집단 간 기저율이 다르고 예측이 완벽하지 않으면 보정과 오류율 균형을 함께 만족할 수 없다 | fairness-impossibility |
| 이름을 지우면 익명이다 | 우편번호·생년월일·성별로 재식별된다 | privacy |
| $\varepsilon$이 클수록 보호가 강하다 | 작을수록 강하다 | privacy, privacy-math |
| 적대적 예제는 사람 눈에 보이는 잡음이다 | 사람이 구별하지 못하는 작은 섭동으로 예측이 바뀐다 | adversarial-examples |
| VAE는 잠재 공간이 있는 오토인코더일 뿐이다 | 잠재 변수의 분포를 학습하고 KL 항으로 사전분포에 맞춘다 | generative-models |
| GAN 손실이 작으면 생성 품질이 좋다 | 판별자와 생성자의 손실은 서로 맞물려 품질의 척도가 아니다 | generative-models |
| IoU 0.5를 넘으면 정답이다 | 임계값은 평가 규칙이다. COCO는 0.5~0.95 평균을 쓴다 | detection-segmentation |

## 실험·도구 (7-1, T-1)

| 오해 | 반박(반례·근거) | 레슨 |
| --- | --- | --- |
| 시드 하나로 두 방법을 비교하면 된다 | 시드에 따른 변동이 방법 차이보다 클 수 있다 | research-methods |
| 모델카드는 성능표다 | 의도된 용도, 평가 집단별 성능, 한계와 위험을 함께 적는다 | model-cards |
| `commit`하면 서버에 저장된다 | `commit`은 로컬 기록, `push`해야 원격에 올라간다 | git-basics |
| 노트북은 위에서부터 실행된 상태다 | 셀 실행 순서가 숨은 상태를 만든다. 커널을 다시 시작해 처음부터 실행한다 | notebooks-reproducibility |

---

Python·수학 항목 일부는 [cdmorozov/claude-tutors](https://github.com/cdmorozov/claude-tutors)의 `programming-tutor/references/misconceptions.md`와 `math-tutor/references/misconceptions.md`를 참고해 고쳐 썼다.

```text
MIT License

Copyright (c) 2026 Artem

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
