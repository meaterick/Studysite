import { TRACKS, getTrack } from "./curriculum/tracks";
import type { TrackId } from "./types";

const fieldInfo: Record<TrackId, { title: string; description: string; topics: string[] }> = {
  intro: { title: "학습 안내", description: "레슨과 실습을 이용하는 방법을 알아봅니다.", topics: [] },
  programming: { title: "Python", description: "작은 프로그램을 작성하고 파일을 읽고 쓰는 데 필요한 문법과 도구를 익힙니다.", topics: ["문법과 함수", "자료구조", "파일·오류 처리"] },
  math: { title: "수학과 통계", description: "데이터와 모델을 설명하는 수학 개념을 손계산과 코드로 확인합니다.", topics: ["벡터와 행렬", "미분과 최적화", "확률과 통계"] },
  data: { title: "데이터 처리", description: "원본 데이터를 읽고 정리해 분석에 쓸 수 있는 형태로 바꿉니다.", topics: ["NumPy", "pandas", "데이터 정제와 탐색"] },
  ml: { title: "머신러닝", description: "예측 모델을 학습시키고 어떤 실험과 지표로 성능을 평가할지 익힙니다.", topics: ["회귀와 분류", "교차검증", "모델 평가"] },
  dl: { title: "딥러닝", description: "신경망이 학습하는 원리를 이해하고 이미지와 시퀀스 모델을 실습합니다.", topics: ["신경망과 역전파", "PyTorch", "CNN과 RNN"] },
  genai: { title: "생성형 AI와 언어 모델", description: "언어 모델의 구조와 학습 방법을 살펴보고 검색과 도구를 결합한 시스템을 실습합니다.", topics: ["트랜스포머", "LLM 학습", "RAG와 에이전트"] },
  capstone: { title: "프로젝트", description: "관심 있는 문제를 정해 실험을 설계하고 결과와 한계를 정리합니다.", topics: ["문제 정의", "실험과 평가", "보고서와 모델카드"] },
  extension: { title: "확장 주제", description: "책임 있는 AI, 컴퓨터 비전, 생성 모델 등 관심 주제를 더 깊이 탐색합니다.", topics: ["책임 있는 AI", "컴퓨터 비전", "생성 모델"] },
};

export function learningField(id: TrackId) {
  return { ...getTrack(id), ...fieldInfo[id] };
}

export const LEARNING_FIELDS = TRACKS.filter((track) => track.id !== "intro").map((track) => learningField(track.id));
