import type { Track, TrackId } from "../types";

// 트랙: 80개 개념의 여섯 분류에 과정 개요(0)·캡스톤(7)·확장(X)을 더한 최상위 단위.
// 화면의 표시 순서와 이름·설명·색은 이 파일 한 곳에서 정한다.

export const TRACKS: Track[] = [
  {
    id: "intro",
    number: 0,
    code: "0",
    title: "과정 개요",
    summary: "AI 시스템의 구성 요소와 예측·생성 시스템의 실행 흐름을 먼저 확인한다.",
    why: "이후 여섯 트랙에서 배우는 개념이 하나의 AI 시스템 안에서 각각 어떤 역할을 하는지 먼저 확인하면, 각 레슨을 배우는 이유가 분명해진다.",
    color: "var(--track-0)",
  },
  {
    id: "programming",
    number: 1,
    code: "1",
    title: "프로그래밍 기초",
    summary: "파이썬 문법, 자료구조, 파일·오류 처리, 개발 도구와 재현 가능한 실행.",
    why: "이 과정의 모든 실습·과제·도구 호출은 파이썬 코드로 작성한다. 데이터 처리, 모델 학습, LLM 응용은 모두 이 트랙의 문법과 실행 환경 위에서 동작한다.",
    color: "var(--track-1)",
  },
  {
    id: "math",
    number: 2,
    code: "2",
    title: "수학 기초",
    summary: "함수, 벡터·행렬, 미분과 최적화, 확률, 통계, 가능도와 엔트로피.",
    why: "모델은 입력을 출력으로 바꾸는 함수이고, 데이터는 벡터와 행렬로 표현된다. 학습은 미분으로 손실을 줄이는 최적화이며, 예측의 불확실성과 실험 결과의 신뢰도는 확률과 통계로 판단한다.",
    color: "var(--track-2)",
  },
  {
    id: "data",
    number: 3,
    code: "3",
    title: "데이터 처리 기초",
    summary: "NumPy 배열 연산, pandas 표 데이터 처리, 정제·탐색·특성 준비.",
    why: "모델의 성능은 입력 데이터의 품질과 형태에 크게 좌우된다. 이 트랙에서는 원시 데이터를 모델이 학습할 수 있는 수치 표로 바꾸는 과정을 다룬다.",
    color: "var(--track-3)",
  },
  {
    id: "ml",
    number: 4,
    code: "4",
    title: "머신러닝 기초",
    summary: "문제 설정과 데이터 분할, 선형 모델, 평가 지표, 일반화와 검증, 대표 알고리즘.",
    why: "데이터에서 예측 규칙을 학습하는 방법과, 학습한 모델의 성능을 신뢰할 수 있는 방식으로 측정하는 방법을 다룬다. 이후 신경망과 LLM의 평가도 같은 원칙을 따른다.",
    color: "var(--track-4)",
  },
  {
    id: "dl",
    number: 5,
    code: "5",
    title: "딥러닝 기초",
    summary: "신경망과 역전파, 최적화기, 깊은 신경망의 학습 기법, PyTorch, CNN과 RNN.",
    why: "여러 층으로 이루어진 신경망이 특성을 직접 학습하는 원리와, 깊은 신경망을 안정적으로 학습시키는 기법, 이미지·시퀀스 데이터를 위한 구조를 다룬다.",
    color: "var(--track-5)",
  },
  {
    id: "genai",
    number: 6,
    code: "6",
    title: "생성형 AI와 언어 모델",
    summary: "토큰화와 트랜스포머, 사전학습과 디코딩, 미세조정과 정렬, RAG·도구·에이전트, 평가와 운영.",
    why: "앞의 다섯 트랙에서 배운 개념을 결합해 대규모 언어 모델의 구조와 학습, 생성 방식, 이를 활용하는 시스템의 설계·평가·운영을 다룬다.",
    color: "var(--track-6)",
  },
  {
    id: "capstone",
    number: 7,
    code: "7",
    title: "캡스톤",
    summary: "스스로 정한 문제를 문제 정의부터 평가와 보고까지 수행한다.",
    why: "앞의 트랙에서 배운 개념과 도구를 하나의 프로젝트에 적용하고, 결과를 재현 가능한 형태로 보고한다.",
    color: "var(--track-7)",
  },
  {
    id: "extension",
    number: -1,
    code: "X",
    title: "확장",
    summary: "필수 과정 밖의 주제: 책임 있는 AI, 비전과 생성 모델.",
    why: "필수 트랙을 마친 뒤 관심 분야를 선택해 더 깊이 학습한다. 확장 모듈은 완료 조건이 없다.",
    color: "var(--track-x)",
  },
];

const BY_ID = new Map(TRACKS.map((t) => [t.id, t]));

export function getTrack(id: TrackId): Track {
  const track = BY_ID.get(id);
  if (!track) throw new Error(`알 수 없는 트랙: ${id}`);
  return track;
}
