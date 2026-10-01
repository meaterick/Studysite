import type { ComponentType } from "react";
import { AiHierarchy, MlLoop, NumpyAxis, BayesFrequency, DotProductAngle } from "./w1";
import { ConfusionMatrix, DataSplitDiagram, SigmoidCurve, LearningCurves } from "./w2";
import { ComputationalGraph, MlpDiagram } from "./w3";
import { ResNetSkip, TransferLearning } from "./w4";
import { TransformerDecoderBlock, TokenizerBpe } from "./w5";
import { LlmPipeline, ScalingLawPlot } from "./w6";
import { RagPipeline, AgentLoop } from "./w7";
import { NistFramework, CapstoneTimeline } from "./w8";
import { PhaseRoadmap, DifficultyCurve } from "./shared";
import InteractiveGradientDescent from "./InteractiveGradientDescent";
import InteractiveBiasVariance from "./InteractiveBiasVariance";
import InteractiveConv from "./InteractiveConv";
import InteractiveAttention from "./InteractiveAttention";
import InteractiveDecodingTemperature from "./InteractiveDecodingTemperature";

export const DIAGRAMS: Record<string, ComponentType> = {
  "ai-hierarchy": AiHierarchy,
  "ml-loop": MlLoop,
  "numpy-axis": NumpyAxis,
  "bayes-frequency": BayesFrequency,
  "dot-product-angle": DotProductAngle,
  "gradient-descent-curve": InteractiveGradientDescent,
  "bias-variance-curve": InteractiveBiasVariance,
  "confusion-matrix": ConfusionMatrix,
  "data-split": DataSplitDiagram,
  "sigmoid-curve": SigmoidCurve,
  "learning-curves": LearningCurves,
  "computational-graph": ComputationalGraph,
  "mlp-diagram": MlpDiagram,
  "conv-operation": InteractiveConv,
  "resnet-skip": ResNetSkip,
  "transfer-learning": TransferLearning,
  "attention-qkv": InteractiveAttention,
  "transformer-decoder-block": TransformerDecoderBlock,
  "tokenizer-bpe": TokenizerBpe,
  "llm-pipeline": LlmPipeline,
  "scaling-law-plot": ScalingLawPlot,
  "decoding-temperature": InteractiveDecodingTemperature,
  "rag-pipeline": RagPipeline,
  "agent-loop": AgentLoop,
  "nist-framework": NistFramework,
  "capstone-timeline": CapstoneTimeline,
  "phase-roadmap": PhaseRoadmap,
  "difficulty-curve": DifficultyCurve,
};
