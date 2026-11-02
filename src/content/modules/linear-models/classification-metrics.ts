import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/classification-metrics";

export default defineLesson({
  id: "classification-metrics",
  title: "혼동행렬, 정확도, 정밀도, 재현율, F1",
  tier: "core",
  concepts: ["classification-metrics"],
  goal: "혼동행렬에서 Accuracy·Precision·Recall·F1·Specificity를 계산하고, 임계값과 ROC 곡선·AUC의 의미를 확률적 해석까지 설명할 수 있다.",
  why: "",
  body: md`
혼동행렬(confusion matrix)은 모델의 예측과 실제 정답을 표 하나에 정리한 것이다. 실제로 양성인데 양성이라 맞힌 것(True Positive), 실제로 음성인데 양성이라 잘못 판단한 것(False Positive), 실제로 양성인데 음성이라 놓친 것(False Negative), 실제로 음성인데 음성이라 맞힌 것(True Negative)이다. 이 네 칸만 알면 원하는 지표를 얼마든지 계산할 수 있다.

[[diagram:confusion-matrix]]

\`\`\`math
\text{Precision} = \dfrac{TP}{TP+FP} \qquad \text{Recall} = \dfrac{TP}{TP+FN} \qquad F_1 = \dfrac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision}+\text{Recall}}
\`\`\`

Precision은 "양성이라 판정한 것 중 실제 양성의 비율", Recall은 "실제 양성을 놓치지 않은 비율"이라는 말로 기억해두면 두 지표를 헷갈릴 일이 없다. F1은 이 둘의 조화평균이라, 둘 중 하나라도 심하게 낮으면 F1도 함께 끌려 내려간다. 산술평균과 달리 한쪽 지표만 높아서는 점수가 올라가지 않는다.

숫자를 직접 넣어서 계산해보면 두 지표의 차이가 훨씬 분명해진다.

:::example 스팸 필터로 메일 100통을 검사한다면
메일 100통 중 실제 스팸은 30통, 정상 메일은 70통이다. 모델이 "스팸"이라고 판단한 메일은 총 25통이었는데, 그중 20통은 실제 스팸(TP=20)이었고 5통은 억울하게 스팸으로 몰린 정상 메일(FP=5)이었다. 나머지 75통(정상으로 분류된 메일) 중에는 놓친 실제 스팸 10통(FN=10)과 제대로 걸러낸 정상 메일 65통(TN=65)이 섞여 있다.

- $\text{Accuracy} = \dfrac{TP+TN}{\text{전체}} = \dfrac{20+65}{100} = 85\%$
- $\text{Precision} = \dfrac{TP}{TP+FP} = \dfrac{20}{25} = 80\%$: "스팸이라 판단한 메일 중 80%가 실제 스팸이었다"
- $\text{Recall} = \dfrac{TP}{TP+FN} = \dfrac{20}{30} \approx 66.7\%$: "실제 스팸 30통 중 이 필터는 3분의 2 정도만 걸러냈다"
- $F_1 = \dfrac{2 \times 0.8 \times 0.667}{0.8+0.667} \approx 72.7\%$

같은 모델을 정확도(85%) 하나만 보고 판단하면 상당히 괜찮아 보이지만, Recall을 보면 실제 스팸 3통 중 1통은 여전히 받은편지함으로 새어 들어간다는 것을 알 수 있다. 스팸 필터 정도면 어느 정도 용인될 수 있어도, 이것이 암 진단 모델이었다면 "환자 3명 중 1명을 놓친다"는 뜻이 되므로 절대 받아들일 수 없는 수치다.
:::

[[diagram:spam-waffle]]

Precision과 Recall 중 무엇을 더 중시할지는 문제마다 다르다. 암 진단처럼 양성을 놓치는 대가(False Negative)가 치명적인 경우엔 Recall을 우선시하고, 스팸 필터처럼 정상 메일을 잘못 거르는 대가(False Positive)가 더 성가신 경우엔 Precision을 우선시한다. 클래스가 99:1처럼 극단적으로 불균형한 데이터에서는 정확도가 특히 위험한 지표가 된다. 양성 비율이 1%인 데이터에서 무조건 "전부 음성"이라고만 답하는 모델도 정확도는 99%가 나오지만, Recall은 0%다. 존재하는 양성을 단 하나도 잡아내지 못한다는 뜻이다. 정확도라는 숫자 하나만 보고 "우리 모델 99% 정확해요!"라고 자랑하는 순간이 사실 가장 위험한 순간이다.

정밀도·재현율과 짝을 이루는 지표로 특이도(Specificity)도 알아두면 좋다. 특이도는 "실제 음성 중 음성이라 맞힌 비율"로, Recall(재현율, 민감도라고도 부른다)을 양성 클래스가 아니라 음성 클래스 기준으로 계산한 것과 정확히 같다.

\`\`\`math
\text{Specificity} = \dfrac{TN}{TN+FP}
\`\`\`

위 스팸 필터 예제의 숫자를 그대로 대입하면 $\text{Specificity}=\dfrac{65}{65+5}=\dfrac{65}{70}\approx92.9\%$다. Recall(민감도)이 "실제 스팸을 얼마나 놓치지 않는가"를 재는 것과 대칭적으로, Specificity는 "실제 정상 메일을 얼마나 억울하게 스팸 처리하지 않는가"를 잰다. 이 둘은 서로 트레이드오프 관계에 있다. 아래에서 다룰 ROC 곡선의 세로축(TPR)이 사실 Recall이고, 가로축(FPR)은 $1-\text{Specificity}$와 정확히 같다는 점도 미리 짚어두자.

이제 방금 손으로 계산했던 Precision·Recall을 코드로도 재현해서 검산해보자. sklearn의 confusion_matrix가 출력하는 TP/FP/FN/TN 숫자를 공식에 직접 대입한 값과, sklearn이 제공하는 precision_score/recall_score 함수의 결과가 정확히 일치하는지 확인하는 것이 목적이다. 이 셀은 앞 단계와 똑같은 데이터 분할·모델을 그 자리에서 다시 만들어 쓰므로, 이 셀만 따로 실행해도 된다.

\`\`\`python
# 혼동행렬을 직접 손으로도 계산해서 검산
# 앞 단계와 동일한 데이터 분할·모델을 이 셀 안에서 다시 만든다: 어떤 순서로 실행해도 되도록.
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, precision_score, recall_score

X, y = load_breast_cancer(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
clf = make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=1000)).fit(Xtr, ytr)

yte_pred = clf.predict(Xte)
tn, fp, fn, tp = confusion_matrix(yte, yte_pred).ravel()  # .ravel(): 2x2 표를 1차원 배열 [tn,fp,fn,tp]로 펼침
precision_by_hand = tp / (tp + fp)
recall_by_hand = tp / (tp + fn)
print(f"TP={tp}, FP={fp}, FN={fn}, TN={tn}")
print(f"손으로 계산: precision={precision_by_hand:.3f}, recall={recall_by_hand:.3f}")
print(f"sklearn 함수: precision={precision_score(yte, yte_pred):.3f}, recall={recall_score(yte, yte_pred):.3f}")
\`\`\`

\`confusion_matrix(...)\`는 원래 2행 2열의 표(2차원 배열)를 돌려주는데, \`.ravel()\`은 이 표를 한 줄로 펼쳐 \`[tn, fp, fn, tp]\` 순서의 1차원 배열로 만들어준다. 그래서 \`tn, fp, fn, tp = confusion_matrix(...).ravel()\`이라는 한 줄로 네 칸의 숫자를 각각의 변수에 바로 담을 수 있다.

### classification_report 읽는 법: macro와 weighted 평균

「데이터 분할」 단계 코드의 \`classification_report\`는 클래스마다 precision·recall·f1-score와 **support**(그 클래스의 실제 샘플 수)를 보여 주고, 아래에 평균 두 가지를 붙인다. **macro avg**는 클래스별 점수를 그냥 평균하고, **weighted avg**는 support로 가중평균한다. 이 차이는 클래스가 불균형할 때 결정적이다.

| 클래스 | support | recall |
| --- | --- | --- |
| A(다수) | 80 | 0.9 |
| B | 15 | 0.6 |
| C(소수) | 5 | 0.2 |

macro recall은 $(0.9 + 0.6 + 0.2)/3 \approx 0.567$이고, weighted recall은 $(0.9 \times 80 + 0.6 \times 15 + 0.2 \times 5)/100 = 0.82$다. weighted만 보면 괜찮아 보이지만, 소수 클래스 C는 다섯 개 중 네 개를 놓치고 있다. 소수 클래스가 중요한 문제라면 macro 평균과 클래스별 줄을 함께 봐야 한다.

:::warn 관찰
위 코드에서 손으로 계산한 precision/recall과 sklearn 함수의 결과가 소수점까지 정확히 일치하는가?
:::

### ROC 곡선과 AUC: 분류기를 점이 아니라 곡선으로 보기


여기까지의 Precision·Recall은 사실 어떤 전제를 하나 깔고 있었다. "모델이 스팸이라고 판단한 메일"이라는 말 자체가, 모델이 내놓은 확률 $p$를 0.5라는 경계선에서 뚝 잘라 "0.5 이상이면 스팸, 미만이면 정상"으로 바꿔치기했다는 뜻이다. 그런데 이 0.5라는 경계선(임계값, threshold)은 하늘이 정해준 숫자가 아니라 우리가 임의로 그은 선이다. 스팸 필터를 아주 예민하게 만들어서 "조금이라도 의심스러우면(예: $p \geq 0.1$) 무조건 스팸함으로 보내라"고 설정할 수도 있고, 반대로 아주 둔감하게 만들어서 "확실할 때만(예: $p \geq 0.9$) 스팸으로 걸러라"고 설정할 수도 있다. 임계값을 낮출수록 필터는 더 많은 메일을 스팸으로 잡아내지만(실제 스팸을 놓치는 일이 줄어든다) 그만큼 억울하게 걸리는 정상 메일도 늘어난다. 임계값을 높일수록 그 반대다. 즉 Precision과 Recall은 이 임계값을 어디에 긋느냐에 따라 함께 미끄러지듯 움직이는, 서로 묶인 한 쌍의 숫자다.

이 "임계값을 낮췄다 높였다 하면서 필터의 민감도를 조절해보는" 과정을 두 개의 축으로 관찰한 것이 바로 ROC 곡선(Receiver Operating Characteristic curve)이다. 세로축은 TPR(True Positive Rate, Recall과 같은 식)이고, 가로축은 FPR(False Positive Rate, "실제 음성인데 양성으로 잘못 판정된 비율")이다.

\`\`\`math
\text{TPR} = \dfrac{TP}{TP+FN} \qquad \text{FPR} = \dfrac{FP}{FP+TN}
\`\`\`

임계값을 1(모두 정상으로 판단)에서 0(모두 스팸으로 판단)까지 촘촘하게 낮춰가면서 그때그때의 (FPR, TPR) 점을 하나씩 찍으면, 그 점들이 이어져 왼쪽 아래 (0,0)에서 시작해 오른쪽 위 (1,1)로 끝나는 하나의 곡선이 그려진다. 여기서 짚어야 할 중요한 사실은, 분류기 하나는 "점 하나"가 아니라 "곡선 하나"로 표현된다는 점이다. 우리가 흔히 "이 모델의 Precision·Recall은 얼마다"라고 말할 때는 암묵적으로 어떤 특정 임계값(보통 0.5) 하나를 고정해놓고 그 점 하나만 보고 있는 것이다. 하지만 모델 자체의 변별력, 즉 "양성과 음성을 얼마나 잘 갈라놓는가"라는 능력은 임계값과 무관하게 그 모델이 매긴 점수 자체에 담겨 있다. ROC 곡선은 임계값이라는 사람의 선택을 걷어내고 그 능력만을 남겨서 보여주는 그림이다.

[[diagram:threshold-roc]]

\`\`\`image
src: /images/week2/roc-curve.svg
alt: False Positive Rate를 가로축, True Positive Rate를 세로축으로 하는 ROC 곡선 그래프. 대각선은 무작위 분류기, 그보다 왼쪽 위로 볼록한 세 곡선은 서로 다른 성능의 분류기를 나타낸다.
caption: 대각선(회색 점선)은 AUC=0.5인 무작위 분류기의 기준선이다. 곡선이 왼쪽 위 모서리 (0,1)에 가까울수록 분류기의 변별력이 높고 AUC 값도 1.0에 가까워진다.
credit: cmglee, MartinThoma / Wikimedia Commons, CC BY-SA 4.0
width: 480
height: 480
\`\`\`

이 곡선 아래의 면적을 AUC(Area Under the Curve)라 부른다. 아무 정보도 없이 동전을 던져 양성·음성을 무작위로 찍는 분류기는 대각선 $(0,0)$–$(1,1)$을 그리고, 그 아래 면적은 정확히 0.5다. 반대로 모든 양성 샘플에 모든 음성 샘플보다 높은 점수를 매기는 완벽한 분류기는 왼쪽 위 모서리 $(0,1)$을 스치듯 지나가고, 그 아래 면적은 1.0이다. 그래서 AUC는 0.5(무작위 추측과 다를 바 없음)와 1.0(완벽한 분류) 사이의 어딘가로, 모델이 "찍는 것보다 얼마나 더 잘 가려내는가"를 임계값 선택과 무관하게 하나의 숫자로 요약해준다.

AUC를 외우기보다 확실히 이해하고 넘어가는 가장 좋은 방법은 다음의 확률적 해석이다.

:::info AUC의 확률적 해석
AUC는 "데이터에서 양성 샘플 하나와 음성 샘플 하나를 각각 무작위로 뽑았을 때, 모델이 그 양성 샘플에 그 음성 샘플보다 더 높은 점수를 줄 확률"과 정확히 같다. 곡선이니 면적이니 하는 기하학적인 정의보다, 이 한 문장이 AUC가 실제로 무엇을 재는 숫자인지 훨씬 직접적으로 말해준다.
:::

숫자로 직접 확인해보면 이 해석이 왜 성립하는지 훨씬 분명해진다.

:::example 샘플 5개로 손수 그려보는 ROC 곡선
양성 샘플 2개(P1, P2)와 음성 샘플 3개(N1, N2, N3)에 대해 모델이 아래와 같은 점수(높을수록 "스팸일 확률이 높다"는 의미)를 매겼다고 하자.

| 샘플 | 실제 클래스 | 모델 점수 |
| --- | --- | --- |
| P1 | 양성 | 0.9 |
| N1 | 음성 | 0.8 |
| P2 | 양성 | 0.6 |
| N2 | 음성 | 0.5 |
| N3 | 음성 | 0.2 |

임계값을 점수가 높은 쪽부터 하나씩 낮춰가며 그때마다 "임계값 이상이면 양성으로 예측"했을 때의 TP·FP와 TPR·FPR을 계산해보자.

| 임계값 | 양성으로 예측된 샘플 | TP | FP | TPR(=TP/2) | FPR(=FP/3) |
| --- | --- | --- | --- | --- | --- |
| 0.85 이상 | P1 | 1 | 0 | 0.50 | 0.00 |
| 0.70 이상 | P1, N1 | 1 | 1 | 0.50 | 0.33 |
| 0.55 이상 | P1, N1, P2 | 2 | 1 | 1.00 | 0.33 |
| 0.30 이상 | P1, N1, P2, N2 | 2 | 2 | 1.00 | 0.67 |
| 0.00 이상 | 전부(P1, N1, P2, N2, N3) | 2 | 3 | 1.00 | 1.00 |

이 (FPR, TPR) 점들을 (0,0)에서 시작해 (1,1)로 끝나도록 이어 그리면 그것이 이 모델의 ROC 곡선이고, 각 구간을 사다리꼴로 보고 면적을 다 더하면 $\text{AUC} \approx 0.833$이 나온다. 이제 확률적 해석으로 검산해보자. 양성-음성 쌍은 $2 \times 3 = 6$개(P1-N1, P1-N2, P1-N3, P2-N1, P2-N2, P2-N3)이고, 이 중 양성 점수가 음성 점수보다 높은 쌍은 P1(0.9)이 이기는 3개(N1, N2, N3 모두)와 P2(0.6)가 이기는 2개(N2, N3만: P2는 N1의 0.8에는 짐)를 합친 5개다. $5/6 \approx 0.833$으로, 곡선 아래 면적을 직접 적분한 값과 정확히 일치한다.
:::

[[diagram:roc-five-samples]]

ROC-AUC는 이렇게 임계값을 아예 고정하지 않고 모델의 변별력 자체를 재기 때문에, 클래스 비율이 어느 정도 기울어져 있어도 Precision·Recall처럼 쉽게 왜곡되지는 않는다. 다만 이것이 "클래스 불균형의 영향을 전혀 받지 않는다"는 뜻은 아니다. 양성이 극단적으로 희귀한 문제(예: 사기 탐지처럼 양성이 0.1% 미만인 경우)에서는 음성 샘플이 워낙 많아 FPR의 분모(FP+TN)가 항상 크게 나오는 탓에 ROC-AUC가 실제 체감 성능보다 낙관적으로 보일 수 있어서, 이런 경우엔 Precision과 Recall만으로 그린 PR-AUC를 함께, 혹은 더 우선해서 보는 쪽을 권하기도 한다(보충 과정의 「불균형 데이터와 임계값 결정」 단계).

이제 방금 손으로 그려본 ROC 곡선을 sklearn으로도 그대로 재현해보자. \`predict\`가 돌려주는 0/1 라벨이 아니라 \`predict_proba\`가 돌려주는 확률(양성 클래스 쪽 두 번째 열)을 넘겨야 한다는 점이 핵심이다. ROC 곡선 자체가 "임계값을 바꿔가며" 그리는 그림이므로, 이미 0.5로 잘려버린 예측값으로는 곡선을 그릴 수 없다. 이 셀도 동일한 데이터 분할·모델을 이 자리에서 다시 만들어 쓴다.

\`\`\`python
# ROC 곡선과 AUC
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_curve, roc_auc_score

X, y = load_breast_cancer(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
clf = make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=1000)).fit(Xtr, ytr)

yte_score = clf.predict_proba(Xte)[:, 1]  # 양성(클래스 1)일 확률만 뽑음: [:, 1]은 "모든 행, 1번(두 번째) 열"
fpr, tpr, thresholds = roc_curve(yte, yte_score)
auc = roc_auc_score(yte, yte_score)
print(f"AUC = {auc:.4f}  (계산에 쓰인 임계값 개수 = {len(thresholds)})")

# 그래프 대신, 임계값을 훑어가는 대표 지점 6개를 표로 확인한다
sample_idx = np.linspace(0, len(thresholds) - 1, 6).astype(int)  # 0~len-1 사이를 6등분한 정수 인덱스
print(f"\n{'threshold':>10} {'FPR':>8} {'TPR':>8}")
for i in sample_idx:
    print(f"{thresholds[i]:10.3f} {fpr[i]:8.3f} {tpr[i]:8.3f}")
\`\`\`

\`predict_proba(Xte)\`는 (샘플 수, 클래스 수) 모양의 표를 돌려주는데, 열 0은 "클래스 0일 확률", 열 1은 "클래스 1일 확률"이다. \`[:, 1]\`은 "모든 행에서 1번 열만" 뽑아내는 2차원 인덱싱으로, 「특징 공학·인코딩·스케일링과 EDA」 단계에서 본 \`axis\`와 짝을 이루는 개념이다. \`axis\`가 "어느 방향으로 계산할지"를 정한다면, \`[:, 1]\`은 "어느 방향에서 몇 번째만 꺼낼지"를 정한다. \`roc_curve\`는 데이터에 등장하는 점수들을 기준으로 가능한 모든 임계값을 자동으로 훑어서 (fpr, tpr, thresholds) 세 배열을 돌려준다. 바로 위 표를 손으로 만든 과정을 그대로 자동화한 것이다. 임계값 개수가 많아 전부 출력하면 표가 너무 길어지므로, \`np.linspace\`로 그중 6개 지점만 골라 threshold가 커질수록(1에 가까울수록) FPR·TPR이 함께 0에 가까워지고, threshold가 작아질수록(0에 가까울수록) 둘 다 1에 가까워지는 흐름을 확인해보자.

:::warn 관찰
위 코드에서 나온 AUC 값이 1.0에 아주 가까운가? 유방암 데이터셋처럼 두 클래스가 비교적 잘 갈라지는 문제에서는 AUC가 0.99 이상으로 나오는 일이 흔한데, 그렇다면 왜 여전히 Precision·Recall도 함께 봐야 하는지 바로 위 마지막 문단을 참고해 설명해보라.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$TP = 40$, $FP = 10$, $FN = 20$일 때 Precision과 Recall은?",
      choices: ["Precision 0.8, Recall 0.667", "Precision 0.667, Recall 0.8", "Precision 0.8, Recall 0.8", "Precision 0.4, Recall 0.2"],
      answer: 0,
      explanation: "Precision $= 40/50 = 0.8$, Recall $= 40/60 \\approx 0.667$.",
    },
    {
      key: "c2",
      question: "암을 놓치는 것(False Negative)이 가장 치명적인 검진 모델에서 우선할 지표는?",
      choices: ["Precision", "Recall", "Specificity", "Accuracy"],
      answer: 1,
      explanation: "Recall은 실제 양성 중 놓치지 않은 비율이다. 임계값을 낮춰 Recall을 높이는 대신 FP 증가를 감수한다.",
    },
    {
      key: "c3",
      question: "AUC $= 0.83$의 가장 정확한 해석은?",
      choices: ["정확도가 83%다", "임계값 0.5에서 Recall이 0.83이다", "양성 하나와 음성 하나를 무작위로 뽑으면 양성에 더 높은 점수를 줄 확률이 0.83이다", "83%의 샘플을 양성으로 예측한다"],
      answer: 2,
      explanation: "AUC는 임계값과 무관한 순위 능력이다. 본문 예제에서 6쌍 중 5쌍의 순서가 맞아 $5/6 \\approx 0.833$이었다.",
    },
    {
      key: "c4",
      question: "클래스 A(support 90, recall 1.0)와 B(support 10, recall 0.0)의 macro 평균 recall과 weighted 평균 recall은?",
      choices: ["macro 0.5, weighted 0.9", "macro 0.9, weighted 0.5", "둘 다 0.5", "둘 다 0.9"],
      answer: 0,
      explanation: "macro는 $(1.0 + 0.0)/2 = 0.5$, weighted는 $(1.0 \\times 90 + 0.0 \\times 10)/100 = 0.9$다. weighted는 다수 클래스가 소수 클래스의 실패를 가린다.",
    },
    {
      key: "c5",
      question: "$TN = 90$, $FP = 10$일 때 특이도(Specificity)와 FPR은?",
      choices: ["특이도 0.9, FPR 0.1", "특이도 0.1, FPR 0.9", "특이도 0.9, FPR 0.9", "특이도 0.5, FPR 0.5"],
      answer: 0,
      explanation: "특이도는 $\\frac{TN}{TN + FP} = \\frac{90}{100} = 0.9$이고, FPR은 $\\frac{FP}{FP + TN} = 0.1$로 항상 $1 - \\text{특이도}$다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
y_true = [1, 1, 0, 0, 0]
scores = [0.9, 0.6, 0.8, 0.5, 0.2]
for t in (0.85, 0.55):
    pred = [int(s >= t) for s in scores]
    tp = sum(p == 1 and y == 1 for p, y in zip(pred, y_true))
    fp = sum(p == 1 and y == 0 for p, y in zip(pred, y_true))
    print(t, tp, fp)
`,
      expected: "0.85 1 0\n0.55 2 1",
      explanation: "임계값 0.85에서는 0.9 하나만 양성으로 예측해 TP 1, FP 0입니다. 0.55로 낮추면 0.9, 0.8, 0.6이 양성으로 예측되어 TP 2(0.9, 0.6), FP 1(0.8)이 됩니다. 임계값을 낮출수록 Recall은 오르고 FP도 늘어납니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "양성 비율 1%인 데이터에서 항상 음성이라 답하는 모델의 정확도·Recall은?",
      answer: md`
정확도 99%, Recall 0%.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "$TP=40, FP=10, FN=20$일 때 Precision, Recall, F1은?",
      answer: md`
$P=40/50=0.8$, $R=40/60\approx 0.667$, $F1=2\times 0.8\times 0.667/(1.467)\approx 0.727$.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "어떤 분류기가 양성 샘플 2개(점수 0.9, 0.6)와 음성 샘플 3개(점수 0.8, 0.5, 0.2)에 점수를 매겼다. '무작위로 양성 하나, 음성 하나를 뽑았을 때 양성 점수가 더 높을 확률'이라는 정의를 이용해 AUC를 직접 계산해보라.",
      answer: md`
6쌍($2\times 3$) 중 양성 점수가 더 높은 쌍은 (0.9,0.8)(0.9,0.5)(0.9,0.2)(0.6,0.5)(0.6,0.2) 5쌍이고 (0.6,0.8)만 실패 $\to$ $\text{AUC} = 5/6 \approx 0.833$.
`,
      keyPoints: [],
    },
    {
      key: "d4",
      question: "같은 분류기의 Precision과 Recall이 임계값에 따라 계속 달라지는데, 왜 ROC-AUC는 임계값과 무관한 '하나의 숫자'로 나오는지 설명하라.",
      answer: md`
Precision/Recall은 특정 임계값 하나를 고정했을 때의 결과라 임계값을 바꾸면 값도 바뀌지만, ROC-AUC는 가능한 모든 임계값에서의 TPR/FPR을 전부 훑어 곡선 전체의 면적으로 요약하므로 특정 임계값 선택과 무관한 하나의 값이 된다.
`,
      keyPoints: [],
    },
    {
      key: "d5",
      question: "Specificity와 Recall(민감도)의 관계를 정의하고, ROC 곡선의 가로축(FPR)이 Specificity와 어떤 수식으로 연결되는지 밝혀라.",
      answer: md`
특이도(Specificity, 실제 음성 중 음성으로 맞힌 비율)와 민감도(Recall, 실제 양성 중 양성으로 맞힌 비율)는 서로 대칭 관계에 있고, ROC 곡선의 x축인 FPR은 $1-\text{Specificity}$로 정의된다.
`,
      keyPoints: [],
    },
    {
      key: "d6",
      question: "유방암 데이터로 **악성 종양 검진**을 한다면 임계값을 어느 방향으로 움직여야 합니까? 이 데이터에서 클래스 0이 악성이라는 점과, 코드의 `score = clf.predict_proba(Xte)[:, 1]`이 무엇의 확률인지에 주의해 설명하십시오.",
      answer: md`
\`predict_proba(...)[:, 1]\`은 클래스 1, 즉 **양성 종양**일 확률입니다. 악성을 놓치는 것(악성인데 양성 종양으로 판정)이 치명적이므로, 양성 종양이라고 판정하는 기준을 까다롭게 해야 합니다. 즉 \`score >= t\`일 때만 양성 종양으로 보고 나머지는 악성 의심으로 보낸다면 임계값 t를 **올려야** 합니다. 그러면 악성에 대한 Recall이 올라가는 대신, 실제로는 양성 종양인 사람을 정밀 검사로 더 많이 보내게 됩니다(오진 비용 증가). 반대로 악성 확률(1 − score)을 기준으로 삼는다면 그 임계값은 낮추는 것이 같은 결정입니다.
`,
      keyPoints: ["[:, 1]은 클래스 1(양성 종양)의 확률이다", "악성을 놓치지 않는 것(악성 Recall)이 우선이다", "양성 종양 판정 임계값을 올린다", "대신 불필요한 정밀 검사(오진)가 늘어난다"],
    },
  ],
  references: [
    { title: "Google ML Crash Course — Classification: Accuracy, precision, recall", url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall", note: "지표 정의와 임계값의 관계" },
    { title: "MLU-Explain — ROC & AUC", url: "https://mlu-explain.github.io/roc-auc/", note: "임계값을 움직이며 ROC 곡선을 그려보는 인터랙티브 자료" },
  ],
});
