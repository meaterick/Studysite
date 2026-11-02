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
  summary: "k최근접 이웃과 트리 앙상블, 그래디언트 부스팅, K-means·PCA와 전처리 파이프라인",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [knnTrees, boosting, kmeansPcaPipeline, naiveBayes, svm],
  recall: [
    { prompt: "⑤ 배깅(랜덤 포레스트)과 부스팅이 오차를 줄이는 방식의 차이를 설명하십시오.", hint: "편향과 분산 중 무엇을 주로 줄이는지로 비교해 보십시오." },
  ],
  assignment,
});
