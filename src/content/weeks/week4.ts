import type { WeekMeta } from "../types";

const week4: WeekMeta = {
  slug: "week-4",
  number: 4,
  phase: "Phase 2 · 딥러닝",
  title: "딥러닝 실전: CNN · 정규화 · 학습 진단",
  subtitle: "합성곱, ResNet, BatchNorm, Dropout, 데이터 증강, 전이학습",
  selfHours: "개인 8h",
  sessionHours: "세션 2h",
  difficulty: 4,
  keywords: ["합성곱", "ResNet", "BatchNorm", "Dropout", "전이학습"],
  objectives: [
    "합성곱의 파라미터 공유·국소성 귀납편향을 설명하고 출력 크기를 계산한다.",
    "ResNet의 잔차연결이 왜 깊은 망 학습을 가능케 하는지 기울기 관점에서 설명한다.",
    "Karpathy의 '학습 레시피'에 따라 학습 실패를 진단한다.",
    "전이학습으로 적은 데이터에서 성능을 끌어올린다.",
  ],
  learningOrder: [
    "CS231n Notes: Convolutional Networks, Neural Networks Part 2/3 (cs231n.github.io)",
    "d2l.ai 7~8장(CNN, 현대 CNN)",
    'He et al. "Deep Residual Learning for Image Recognition" (arXiv 1512.03385) — 1~3절 정독',
    'Karpathy "A Recipe for Training Neural Networks" (karpathy.github.io/2019/04/25/recipe)',
  ],
  conceptsMd: `
### 2.1 합성곱

[[diagram:conv-operation]]

\`\`\`formula
출력 크기 = floor((N + 2P − K)/S) + 1
\`\`\`

- **귀납편향**: (1) 지역성 (2) 평행이동 등변성 (3) 파라미터 공유 → FC 대비 파라미터 수 대폭 감소.
- 예: 224×224×3 → 64채널 3×3 conv = 3×3×3×64+64 = 1,792 파라미터 (FC라면 수십억).
- 층이 깊어질수록 수용영역(receptive field)이 확대된다: 엣지 → 질감 → 부분 → 객체.

### 2.2 ResNet: 잔차 연결

[[diagram:resnet-skip]]

깊이 56층 plain 망이 20층보다 *학습 오차*도 높던 "degradation 문제"가 잔차 학습으로 해결되었다. 이후 거의 모든 현대 아키텍처(Transformer 포함)가 skip connection을 사용한다.

### 2.3 정규화 & 일반화 기법

| 기법 | 원리 | 주의 |
| --- | --- | --- |
| BatchNorm | 배치 통계로 정규화 후 γ,β 학습 → 학습 안정·속도↑ | train/eval 모드 차이(running mean) |
| Dropout | 학습 시 뉴런 무작위 제거 → 앙상블 효과 | eval에서 끄기 |
| Weight Decay | L2 페널티 | AdamW에서는 분리형 사용 |
| 데이터 증강 | 뒤집기·크롭·컬러지터로 데이터 다양화 | 라벨 보존 변환만 |
| Early Stopping | 검증 손실 상승 시 중단 | 검증셋 필요 |

### 2.4 전이학습

[[diagram:transfer-learning]]

### 2.5 학습 진단 체크리스트 (Karpathy Recipe 요약)

1. 데이터를 눈으로 본다(라벨 오류, 불균형).
2. 초기 손실이 \`ln(클래스 수)\`와 맞는지 확인 (10클래스 → 2.30).
3. 배치 하나에 **과적합**시켜 파이프라인 버그부터 제거.
4. train/val 곡선으로 과·소적합 진단 → 정규화/용량 조절.
5. 한 번에 하나만 바꾼다(ablation).
`,
  practiceMd: `
Colab GPU 런타임에서 실행한다.

\`\`\`python
import torch, torch.nn as nn, torchvision as tv, torchvision.transforms as T
dev = "cuda" if torch.cuda.is_available() else "cpu"
tf_tr = T.Compose([T.RandomCrop(32, padding=4), T.RandomHorizontalFlip(), T.ToTensor(),
                   T.Normalize((0.49,0.48,0.45),(0.25,0.24,0.26))])
tf_te = T.Compose([T.ToTensor(), T.Normalize((0.49,0.48,0.45),(0.25,0.24,0.26))])
tr = tv.datasets.CIFAR10("data", True,  tf_tr, download=True)
te = tv.datasets.CIFAR10("data", False, tf_te, download=True)
trl = torch.utils.data.DataLoader(tr, 128, shuffle=True, num_workers=2)
tel = torch.utils.data.DataLoader(te, 256)

def block(i, o): return nn.Sequential(nn.Conv2d(i,o,3,padding=1), nn.BatchNorm2d(o), nn.ReLU(), nn.MaxPool2d(2))
net = nn.Sequential(block(3,32), block(32,64), block(64,128), nn.Flatten(),
                    nn.Dropout(0.3), nn.Linear(128*4*4, 10)).to(dev)
opt = torch.optim.AdamW(net.parameters(), 1e-3, weight_decay=5e-4)
for ep in range(10):
    net.train()
    for x, y in trl:
        x, y = x.to(dev), y.to(dev)
        loss = nn.functional.cross_entropy(net(x), y)
        opt.zero_grad(); loss.backward(); opt.step()
    net.eval(); ok = n = 0
    with torch.no_grad():
        for x, y in tel:
            ok += (net(x.to(dev)).argmax(1).cpu() == y).sum().item(); n += len(y)
    print(ep, loss.item(), ok / n)

# 전이학습
m = tv.models.resnet18(weights="IMAGENET1K_V1")
for p in m.parameters(): p.requires_grad = False
m.fc = nn.Linear(512, 10)   # 이후 32x32를 128x128로 리사이즈하여 fc만 학습
\`\`\`
`,
  quiz: [
    "입력 32×32, 커널 5×5, padding 2, stride 1의 출력 크기는? stride 2이면?",
    "3×3 conv 두 층을 쌓은 수용영역 크기는?",
    '잔차 블록의 역전파에서 "+1" 항의 의미는?',
    "BatchNorm을 사용하는 모델을 eval()로 바꾸지 않으면 생기는 일은?",
    "10클래스 분류 초기 손실이 5.0이라면 무엇을 의심하는가?",
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "왜 이미지엔 FC 대신 합성곱인가?"' },
    { label: "② 키워드 6개" },
    { label: "③ 그림 — 합성곱 연산, 잔차 블록, 전이학습 구조 중 2개" },
    { label: "④ 수식 — 출력 크기 공식, 잔차 기울기 (F'+1)" },
    { label: '⑤ 설명하기 — "학습이 안 될 때 나는 어떤 순서로 원인을 찾을 것인가?" (Recipe 기반)' },
    { label: "⑥ 막힌 곳 / 보완" },
  ],
  assignmentMd: `
### 필수 「CIFAR-10 Ablation 실험 노트」

1. 기본 CNN(실습 코드)을 기준선으로 10 epoch 학습, train/val 곡선 제출.
2. 다음 중 **4개**를 골라 한 번에 하나씩 바꾸며 ablation 표를 만들 것: BatchNorm 제거 / Dropout 제거 / 데이터 증강 제거 / 학습률 ×10, ×0.1 / weight decay 0 / 채널 수 2배 / 잔차연결 추가.
3. 각 실험의 결과를 (val 정확도, train-val gap, 학습시간)으로 요약하고 왜 그런 결과가 나왔는지 가설과 근거를 서술.
4. ResNet18 전이학습(특징추출 vs 파인튜닝)과 기준선을 비교. 소량 데이터(클래스당 500장) 조건에서도 비교.
5. 오분류 이미지 16장을 시각화하고 오류 패턴을 분석.

### 심화

- Grad-CAM으로 모델이 어디를 보는지 시각화.
- ResNet 논문의 Figure 1(plain vs residual)을 직접 재현.

### 채점 (10점)

| 항목 | 점수 |
| --- | --- |
| 실험 통제(한 번에 하나) | 3 |
| 가설·해석의 깊이 | 3 |
| 전이학습 비교 | 2 |
| 시각화·재현성(시드 고정) | 2 |
`,
  dueNote: "제출: 일요일 23:59",
  furtherReading: [
    "Krizhevsky et al., AlexNet (2012)",
    "Ioffe & Szegedy, Batch Normalization (2015)",
    'Zhang et al., "Understanding deep learning requires rethinking generalization" (2017)',
  ],
};

export default week4;
