import type { ComponentType } from "react";
import { AiHierarchy, MlLoop, GradientDescentCurve } from "./w1";
import { BiasVarianceCurve, ConfusionMatrix, DataSplitDiagram } from "./w2";
import { ComputationalGraph, MlpDiagram } from "./w3";
import { ConvOperation, ResNetSkip, TransferLearning } from "./w4";
import { AttentionQkv, TransformerDecoderBlock, TokenizerBpe } from "./w5";
import { LlmPipeline, ScalingLawPlot, DecodingTemperature } from "./w6";
import { RagPipeline, AgentLoop } from "./w7";
import { NistFramework, CapstoneTimeline } from "./w8";
import { PhaseRoadmap, DifficultyCurve } from "./shared";

export const DIAGRAMS: Record<string, ComponentType> = {
  "ai-hierarchy": AiHierarchy,
  "ml-loop": MlLoop,
  "gradient-descent-curve": GradientDescentCurve,
  "bias-variance-curve": BiasVarianceCurve,
  "confusion-matrix": ConfusionMatrix,
  "data-split": DataSplitDiagram,
  "computational-graph": ComputationalGraph,
  "mlp-diagram": MlpDiagram,
  "conv-operation": ConvOperation,
  "resnet-skip": ResNetSkip,
  "transfer-learning": TransferLearning,
  "attention-qkv": AttentionQkv,
  "transformer-decoder-block": TransformerDecoderBlock,
  "tokenizer-bpe": TokenizerBpe,
  "llm-pipeline": LlmPipeline,
  "scaling-law-plot": ScalingLawPlot,
  "decoding-temperature": DecodingTemperature,
  "rag-pipeline": RagPipeline,
  "agent-loop": AgentLoop,
  "nist-framework": NistFramework,
  "capstone-timeline": CapstoneTimeline,
  "phase-roadmap": PhaseRoadmap,
  "difficulty-curve": DifficultyCurve,
};
