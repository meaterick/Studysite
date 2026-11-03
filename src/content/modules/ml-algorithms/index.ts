import { defineModule, md } from "../../kit";
import knnTrees from "./knn-trees";
import boosting from "./boosting";
import kmeansPcaPipeline from "./kmeans-pca-pipeline";
import naiveBayes from "./naive-bayes";
import svm from "./svm";
import assignment from "./assignment";

export default defineModule({
  slug: "ml-algorithms",
  track: "ml",
  order: 4,
  title: "대표 알고리즘과 파이프라인",
  summary: "k최근접 이웃과 트리 앙상블, 그래디언트 부스팅과 특성 중요도, K-means·PCA와 전처리 파이프라인",
  anchor: md`
유방암 진단 데이터로 깊이를 제한하지 않은 결정트리, 깊이 3인 트리, 랜덤 포레스트를 같은 교차검증으로 비교해 평균의 효과를 숫자로 확인하고, 잔차를 학습한 트리를 차례로 더하는 그래디언트 부스팅을 직접 구현해 트리 수가 늘 때 검증 오차가 어떻게 바뀌는지 본다. 정답과 무관한 특성을 넣어 불순도 기반 중요도와 순열 중요도가 다르게 나오는 것을 확인한다. 같은 데이터의 특성 30개를 표준화한 뒤 PCA로 주성분 10개로 줄이고, 숫자·범주 열이 섞인 표 데이터는 ColumnTransformer로 전처리를 모델과 하나의 파이프라인에 넣는다.
`,
  objectives: [
    "KNN의 거리 계산과 다수결 예측을 구현하고, K와 스케일링이 결과에 주는 영향을 설명한다.",
    "지니 불순도로 결정트리의 분할을 계산하고, 랜덤 포레스트가 부트스트랩과 특성 무작위 선택으로 분산을 줄이는 원리를 설명한다.",
    "그래디언트 부스팅이 잔차를 순서대로 줄이는 과정을 구현하고, 학습률·트리 수로 복잡도를 조절하며 배깅과 비교한다.",
    "불순도 기반 중요도와 순열 중요도를 계산하고, 두 값이 다르게 나오는 이유와 중요도 해석의 한계를 설명한다.",
    "K-means와 PCA를 표준화한 데이터에 적용하고, ColumnTransformer로 전처리와 모델을 하나의 파이프라인으로 묶는다.",
  ],
  lessons: [knnTrees, boosting, kmeansPcaPipeline, naiveBayes, svm],
  recall: [
    { prompt: "KNN에서 K와 스케일링이 예측에 주는 영향을 쓰고, 결정트리가 지니 불순도와 정보이득으로 분할을 고르는 방법을 쓰라." },
    { prompt: "랜덤 포레스트가 결정트리 하나보다 분산이 작은 이유를 부트스트랩과 특성 무작위 선택으로 쓰고, 그래디언트 부스팅과 학습 순서·주로 줄이는 오차 성분·트리 수의 영향을 비교하라." },
    { prompt: "불순도 기반 중요도와 순열 중요도의 계산 방법을 쓰고, 정답과 무관한 특성의 불순도 기반 중요도가 높게 나올 수 있는 이유와 중요도를 원인으로 해석하면 안 되는 이유를 쓰라." },
    { prompt: "K-means의 두 단계와 K를 정하는 방법, PCA가 찾는 방향과 주성분 수를 정하는 방법을 쓰고, 두 방법 앞에 표준화가 필요한 이유를 쓰라." },
    { prompt: "숫자 열과 범주 열이 섞인 데이터의 전처리를 ColumnTransformer로 묶어 파이프라인에 넣어야 하는 이유와 handle_unknown=\"ignore\"가 필요한 경우를 쓰라." },
  ],
  assignment,
});
