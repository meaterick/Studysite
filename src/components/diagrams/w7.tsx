import DiagramFrame, { colors, ink, inkMuted, inkSecondary, card2Bg } from "./DiagramFrame";
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

export function ChunkOverlap() {
  // 슬라이딩 윈도우 청킹: size 글자씩 자르되 overlap만큼 겹쳐 다음 조각을 시작한다.
  const x0 = 30;
  const scale = 0.5; // 글자 1개 = 0.5px
  const total = 1000;
  const size = 200;
  const step = 160;
  const starts = [0, 160, 320, 480, 640, 800];
  const px = (c: number) => x0 + c * scale;
  return (
    <DiagramFrame
      title="겹치게 자르는 청킹 (size 200, overlap 40)"
      caption="1,000자 문서를 200자씩 자르되 다음 조각은 160자 뒤(200 − 40)에서 시작한다. 그래서 조각은 6개가 되고, 이웃한 두 조각은 40자(진한 부분)를 함께 갖는다. 경계에 걸린 문장도 적어도 한 조각에는 온전히 남는다."
      viewBox="0 0 640 250"
      minWidth={500}
    >
      <rect x={px(0)} y={30} width={total * scale} height={22} rx={4} fill={card2Bg} stroke="var(--border-strong)" />
      <text x={px(total / 2)} y={45} textAnchor="middle" fontSize={11} fill={ink}>
        원본 문서 1,000자
      </text>
      {[0, 200, 400, 600, 800, 1000].map((c) => (
        <text key={c} x={px(c)} y={24} textAnchor="middle" fontSize={9.5} fill={inkSecondary}>
          {c}
        </text>
      ))}
      {starts.map((s, i) => {
        const end = Math.min(s + size, total);
        const y = 70 + i * 26;
        return (
          <g key={s}>
            <rect x={px(s)} y={y} width={(end - s) * scale} height={20} rx={4} fill={colors.blue} fillOpacity={0.22} stroke={colors.blue} />
            {i > 0 && <rect x={px(s)} y={y} width={40 * scale} height={20} rx={4} fill={colors.orange} fillOpacity={0.75} />}
            <text x={px(end) + 6} y={y + 14} fontSize={10.5} fill={ink}>
              조각 {i} ({s}~{end})
            </text>
          </g>
        );
      })}
      <text x={px(step) - 6} y={110} textAnchor="end" fontSize={10} fill={colors.orange} fontWeight={700}>
        겹치는 40자 →
      </text>
    </DiagramFrame>
  );
}

export function LethalTrifecta() {
  // 세 능력이 한 에이전트에 모두 모이면 유출 경로가 생긴다. 하나만 끊어도 경로가 닫힌다.
  const circles = [
    { cx: 250, cy: 150, label: "개인 데이터 접근", sub: "메일함·내부 문서", color: colors.blue, lx: 150, ly: 30 },
    { cx: 390, cy: 150, label: "신뢰하지 않는 콘텐츠", sub: "외부 메일·웹페이지", color: colors.orange, lx: 490, ly: 30 },
    { cx: 320, cy: 250, label: "바깥으로 내보내기", sub: "메일 발송·웹 요청·이미지 링크", color: colors.violet, lx: 320, ly: 368 },
  ];
  return (
    <DiagramFrame
      title="치명적 삼박자(lethal trifecta)"
      caption="세 능력이 한 에이전트에 모두 있으면, 외부 콘텐츠에 숨은 지시가 개인 데이터를 읽어 바깥으로 내보내게 만들 수 있다(가운데). 셋 중 하나만 없애도 이 경로는 닫힌다."
      viewBox="0 0 640 392"
      minWidth={480}
    >
      {circles.map((c) => (
        <circle key={c.label} cx={c.cx} cy={c.cy} r={95} fill={c.color} fillOpacity={0.14} stroke={c.color} strokeWidth={2} />
      ))}
      {circles.map((c) => (
        <g key={`${c.label}-t`}>
          <text x={c.lx} y={c.ly} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={c.color}>
            {c.label}
          </text>
          <text x={c.lx} y={c.ly + 15} textAnchor="middle" fontSize={10.5} fill={inkSecondary}>
            {c.sub}
          </text>
        </g>
      ))}
      <circle cx={320} cy={185} r={26} fill={colors.red} fillOpacity={0.85} />
      <text x={320} y={182} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
        유출
      </text>
      <text x={320} y={196} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">
        가능
      </text>
    </DiagramFrame>
  );
}
