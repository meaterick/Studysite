import DiagramFrame, { colors, ink, inkMuted, card2Bg } from "./DiagramFrame";
import { ArrowDefs, Arrow, Box, Label } from "./primitives";

export function RagPipeline() {
  const w = 108;
  const h = 46;
  const gap = 16;
  const offlineY = 30;
  const onlineY = 150;
  const offline = ["문서", "청킹\n(300~500토큰)", "임베딩", "벡터 DB"];
  const online = ["질문", "임베딩", "Top-k 검색", "프롬프트\n(지시+청크+질문)", "LLM"];
  return (
    <DiagramFrame
      title="RAG 파이프라인: 오프라인 색인 + 온라인 질의"
      viewBox="0 0 680 300"
      caption="실패 지점: ① 청킹이 문맥을 끊음 ② 검색 누락(recall↓) ③ 무관한 청크 혼입 ④ LLM이 컨텍스트 무시/왜곡 ⑤ 질문이 모호함."
    >
      <ArrowDefs />
      <Label x={20} y={offlineY - 10} text="오프라인 색인" color={colors.blue} weight={700} anchor="start" />
      {offline.map((label, i) => {
        const x = 20 + i * (w + gap);
        const [l1, l2] = label.split("\n");
        return (
          <g key={i}>
            <Box x={x} y={offlineY} w={w} h={h} label={l1} sub={l2} fill={card2Bg} fontSize={11.5} subSize={9.5} />
            {i < offline.length - 1 && <Arrow x1={x + w} y1={offlineY + h / 2} x2={x + w + gap - 4} y2={offlineY + h / 2} />}
          </g>
        );
      })}
      <Arrow x1={20 + 3 * (w + gap) + w / 2} y1={offlineY + h} x2={20 + 3 * (w + gap) + w / 2} y2={onlineY + h + 30} color={colors.blue} dashed />

      <Label x={20} y={onlineY - 10} text="온라인 질의" color={colors.orange} weight={700} anchor="start" />
      {online.map((label, i) => {
        const x = 20 + i * (w + gap);
        const [l1, l2] = label.split("\n");
        return (
          <g key={i}>
            <Box
              x={x}
              y={onlineY}
              w={w}
              h={h}
              label={l1}
              sub={l2}
              fill={i === online.length - 1 ? colors.violet : card2Bg}
              labelColor={i === online.length - 1 ? "#fff" : ink}
              fontSize={11}
              subSize={9}
            />
            {i < online.length - 1 && <Arrow x1={x + w} y1={onlineY + h / 2} x2={x + w + gap - 4} y2={onlineY + h / 2} />}
          </g>
        );
      })}
      <Box x={20 + 4 * (w + gap)} y={onlineY + h + 30} w={w + 40} h={40} label="근거 인용 답변" fill={colors.aqua} labelColor="#fff" fontSize={11.5} />
      <Arrow x1={20 + 4 * (w + gap) + (w + 40) / 2} y1={onlineY + h} x2={20 + 4 * (w + gap) + (w + 40) / 2} y2={onlineY + h + 28} color={colors.aqua} />
    </DiagramFrame>
  );
}

export function AgentLoop() {
  const cx = 300;
  const cy = 150;
  const r = 110;
  const nodes = [
    { angle: -90, label: "목표 + 히스토리", },
    { angle: -18, label: "LLM: 계획/도구 선택" },
    { angle: 54, label: "도구 실행\n(검색·코드·API)" },
    { angle: 126, label: "관찰 결과를\n히스토리에 추가" },
    { angle: 198, label: "완료? → 최종 답변" },
  ];
  const pos = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  return (
    <DiagramFrame
      title="에이전트 루프 (ReAct 스타일)"
      viewBox="0 0 600 320"
      caption="실패 유형: 무한 루프 · 잘못된 도구 인자 · 오류 결과 무시 · 목표 이탈 · 비용 폭주. 안전장치: 최대 스텝 수, 최소 권한, 사람 승인, 로그."
    >
      <ArrowDefs />
      {nodes.map((n, i) => {
        const p = pos(n.angle);
        const [l1, l2] = n.label.split("\n");
        return (
          <g key={i}>
            <Box x={p.x - 62} y={p.y - 26} w={124} h={52} label={l1} sub={l2} fill={i === 4 ? colors.violet : card2Bg} labelColor={i === 4 ? "#fff" : ink} fontSize={10.5} subSize={9.5} />
          </g>
        );
      })}
      {nodes.map((n, i) => {
        const a = pos(n.angle);
        const b = pos(nodes[(i + 1) % nodes.length].angle);
        // shorten line to box edges roughly
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        const x1 = a.x + ux * 66;
        const y1 = a.y + uy * 30;
        const x2 = b.x - ux * 66;
        const y2 = b.y - uy * 30;
        return <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} color={colors.orange} strokeWidth={1.4} />;
      })}
      <Label x={cx} y={cy + 4} text="max_steps까지 반복" color={inkMuted} />
    </DiagramFrame>
  );
}
