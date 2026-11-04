/**
 * 과제 자동 테스트 검증용 참조 노트북(scripts/content/check-labs.ts 전용). 과제 저장 키 → 셀 id → [시작 코드에서 찾을 문자열, 바꿀 문자열].
 * 시작 코드의 TODO를 채운 "모범 답안"이므로 화면에는 쓰지 않는다.
 */
export const ASSIGNMENT_FIXTURES: Record<string, Record<string, [string, string][]>> = {
  "data-card-eda": {
    "load-code": [
      ['    return pd.read_csv(path)  # TODO: na_values로 "N/A"를 결측으로 지정합니다.', '    return pd.read_csv(path, na_values=["N/A"])'],
      ["    # TODO: brand의 앞뒤 공백을 지우고 BRAND_MAP으로 바꿉니다.", '    df["brand"] = df["brand"].str.strip().replace(BRAND_MAP)'],
      ['    # TODO: mileage_km의 쉼표를 지우고 숫자로 바꿉니다(errors="coerce").', '    df["mileage_km"] = pd.to_numeric(df["mileage_km"].str.replace(",", ""), errors="coerce")'],
      ["    # TODO: listed_date를 날짜로 바꿉니다.", '    df["listed_date"] = pd.to_datetime(df["listed_date"], format="%Y-%m-%d")'],
    ],
    "quality-code": [
      ["    # TODO: 결측(있는 열만), 완전 중복, 키 중복, 범위 밖 개수를 셉니다.", `    missing = df.isna().sum()
    out_of_range = {}
    for name, (lo, hi) in ranges.items():
        col = df[name].dropna()
        out_of_range[name] = int(((col < lo) | (col > hi)).sum())
    return {
        "rows": len(df),
        "missing": {k: int(v) for k, v in missing.items() if v > 0},
        "full_duplicates": int(df.duplicated().sum()),
        "key_duplicates": int(df.duplicated(subset=[key]).sum()),
        "out_of_range": out_of_range,
    }`],
      ["    # TODO: 본문의 순서대로 고칩니다.", `    out = out.drop_duplicates()
    out = out.sort_values("listed_date").drop_duplicates(subset=["listing_id"], keep="last").copy()
    out["year"] = out["year"].astype(float)
    out.loc[~out["year"].between(2000, 2025), "year"] = np.nan
    out.loc[out["accidents"].notna() & ~out["accidents"].between(0, 10), "accidents"] = np.nan
    out = out[out["price"].between(1, 20000)]
    out = out.sort_values("listing_id").reset_index(drop=True)`],
    ],
    "features-code": [
      ["    return []  # TODO: 수치형 열의 목표 변수와의 |상관계수|가 threshold보다 큰 열(큰 순서)", `    numeric = df.select_dtypes("number").drop(columns=[target])
    corr = numeric.corrwith(df[target]).abs()
    return corr[corr > threshold].sort_values(ascending=False).index.tolist()`],
      ['        "medians": {},  # TODO: NUMERIC 열마다 학습 데이터의 중앙값(float)', '        "medians": {c: float(train[c].median()) for c in NUMERIC},'],
      ["    # TODO: 결측 표시 → 중앙값 채우기 → age, km_per_year → fuel_·brand_ 원-핫", `    for c in ["mileage_km", "accidents"]:
        X[f"{c}_missing"] = df[c].isna().astype(int)
    for c in NUMERIC:
        X[c] = df[c].fillna(params["medians"][c])
    X["age"] = 2024 - X["year"]
    X["km_per_year"] = X["mileage_km"] / X["age"].clip(lower=1)
    for v in params["fuels"]:
        X[f"fuel_{v}"] = (df["fuel"] == v).astype(int)
    for v in params["brands"]:
        X[f"brand_{v}"] = (df["brand"] == v).astype(int)`],
    ],
  },
  "python-records-report": {
    "load-code": [
      [
        "            pass  # TODO: 열 개수 → 정수 변환 → 점수 범위 순서로 검사하고, 문제가 있으면 (line_no, 사유)를 problems에 추가합니다.",
        `            if len(row) != 3:
                problems.append((line_no, "열 개수 오류"))
                continue
            name, subject, raw = (c.strip() for c in row)
            try:
                score = int(raw)
            except ValueError:
                problems.append((line_no, "점수가 정수가 아님"))
                continue
            if not 0 <= score <= 100:
                problems.append((line_no, "점수 범위 밖"))
                continue
            records.append({"name": name, "subject": subject, "score": score})`,
      ],
    ],
    "summary-code": [
      ["    # TODO: 과목별 점수 리스트를 groups에 모읍니다.", `    for r in records:
        groups.setdefault(r["subject"], []).append(r["score"])`],
      ["    return {}  # TODO: groups로 과목별 요약 딕셔너리를 만듭니다.", `    return {s: {"count": len(v), "mean": round(sum(v) / len(v), 2), "max": max(v)} for s, v in groups.items()}`],
      ["    return {}  # TODO: 학생별 평균을 계산합니다.", `    groups = {}
    for r in records:
        groups.setdefault(r["name"], []).append(r["score"])
    return {n: round(sum(v) / len(v), 2) for n, v in groups.items()}`],
      ["    return []  # TODO: sorted(means.items(), key=...)로 정렬해 이름만 고릅니다.", `    return [name for name, _ in sorted(means.items(), key=lambda kv: (-kv[1], kv[0]))[:n]]`],
    ],
    "class-code": [
      ["        # TODO: 점수가 int가 아니거나 0~100 밖이면 ValueError를 일으킵니다.", `        if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 100:
            raise ValueError(f"잘못된 점수: {score!r}")`],
      ["        # TODO: by_name과 by_subject에 점수를 추가하고 count를 1 늘립니다.", `        self.by_name.setdefault(record["name"], []).append(score)
        self.by_subject.setdefault(record["subject"], []).append(score)
        self.count += 1`],
      ["        return []  # TODO: 복사본을 돌려줍니다.", "        return list(self.by_name.get(name, []))"],
      ["        return 0.0  # TODO: by_subject에서 평균을 계산합니다.", `        scores = self.by_subject[subject]
        return sum(scores) / len(scores)`],
    ],
    "report-code": [
      ['        "sample": [],  # TODO: random.Random(seed).sample(sorted(means), 3)으로 학생 3명을 고릅니다.', '        "sample": random.Random(seed).sample(sorted(means), 3),'],
      ["    pass  # TODO: report를 JSON 파일로 저장합니다.", `    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)`],
    ],
    "missing-code": [
      ["    return {}  # TODO: 학생마다 subjects 중 taken에 없는 과목을 순서대로 모읍니다(빠진 것이 있는 학생만).", `    result = {}
    for name, got in taken.items():
        lack = [s for s in subjects if s not in got]
        if lack:
            result[name] = lack
    return result`],
    ],
  },
  "math-gd-bayes": {
    "gd-code": [
      ["dw = 0.0  # TODO: ∂L/∂w", "dw = np.mean(2 * err * x)"],
      ["db = 0.0  # TODO: ∂L/∂b", "db = np.mean(2 * err)"],
    ],
    "bayes-code": [
      ["p_positive = 0.0  # TODO: 전체 확률의 법칙으로 P(양성)", "p_positive = sensitivity * prevalence + false_positive * (1 - prevalence)"],
      ["return 0.0        # TODO", "return sensitivity * prevalence / p_positive"],
    ],
  },
  "ml-model-comparison": {
    "compare-code": [
      [
        `"Logistic Regression": DummyClassifier(strategy="most_frequent"),  # TODO: StandardScaler + LogisticRegression 파이프라인`,
        `"Logistic Regression": make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)),`,
      ],
    ],
    "leak-code": [
      ["X_scaled_all = Xw  # TODO: StandardScaler().fit_transform(Xw)", "X_scaled_all = StandardScaler().fit_transform(Xw)"],
      ["X_leaky = Xw  # TODO: np.column_stack([Xw, leaky_col])", "X_leaky = np.column_stack([Xw, leaky_col])"],
    ],
    "threshold-code": [["t_star = 0.5  # TODO: 비용으로 정한 임계값 C_FP / (C_FP + C_FN)", "t_star = C_FP / (C_FP + C_FN)"]],
  },
  "autograd-mlp": {
    "extend-code": [
      [
        "pass  # TODO: ∂(a/b)/∂a, ∂(a/b)/∂b 를 유도해 self.grad, o.grad에 누적합니다.",
        "self.grad += out.grad / o.data; o.grad += -self.data / o.data ** 2 * out.grad",
      ],
      ["pass  # TODO: d(e^x)/dx 를 이용해 self.grad에 누적합니다.", "self.grad += e * out.grad"],
    ],
    "mlp-code": [
      ["# TODO ①: 모든 파라미터의 grad를 0으로 초기화합니다.", "for p in model.parameters(): p.grad = 0.0"],
      ["# TODO ②: 경사하강법으로 모든 파라미터의 data를 갱신합니다.", "for p in model.parameters(): p.data -= lr * p.grad"],
    ],
    "gradcheck-code": [
      [
        "num = 0.0  # TODO: p.data를 original ± h로 바꿔 total_loss(model)[0].data를 두 번 계산해 중심차분을 구합니다.",
        "p.data = original + h; lp = total_loss(model)[0].data; p.data = original - h; lm = total_loss(model)[0].data; num = (lp - lm) / (2 * h)",
      ],
    ],
  },
  "cnn-ablation": {
    "ablation-code": [
      ['# "Dropout 제거": dict(dropout=0.0),', '"Dropout 제거": dict(dropout=0.0),'],
      ['# "데이터 증강 제거": dict(augment=False),', '"데이터 증강 제거": dict(augment=False),'],
    ],
    "conv-code": [["return 0  # TODO: 본문의 출력 크기 공식을 직접 써 넣습니다. (정수 나눗셈은 //)", "return (n + 2 * p - k) // s + 1"]],
  },
  "mini-gpt-block": {
    "mha-code": [
      [
        "scores = np.zeros((n_heads, T, T))          # TODO: Qh와 Kh로 점수를 계산하고, scale=True면 √d_k로 나눕니다. shape: ?",
        "scores = Qh @ Kh.transpose(0, 2, 1) / (np.sqrt(d_k) if scale else 1.0)",
      ],
    ],
    "verify-code": [
      [
        "pass\n    return concat @ Wo",
        "s = np.array([Q[i, c0:c0 + d_k] @ K[j, c0:c0 + d_k] / np.sqrt(d_k) for j in range(i + 1)]); a = np.exp(s - s.max()); a /= a.sum(); concat[i, c0:c0 + d_k] = a @ V[:i + 1, c0:c0 + d_k]\n    return concat @ Wo",
      ],
    ],
    "example-code": [["# TODO: 직접 고른 Query를 하나 이상 추가합니다.", '"먹었다의 Key와 같은 Query": [1, 1, 0, -1],']],
  },
  "llm-anatomy": {
    "decoding-code": [["q = p  # TODO: 필터 flt를 적용합니다.", "q = flt(p)"]],
    "scaling-code": [
      ["N = 0.0  # TODO", "N = (C / 120) ** 0.5"],
      ["D = 0.0  # TODO", "D = 20 * N"],
    ],
  },
  "rag-qa-bot": {
    "hybrid-code": [
      [
        "        # TODO: char와 word를 각각 순위(1부터)로 바꿔, 점수가 0보다 큰 조각에만 1 / (self.rrf_k + 순위)를 더합니다.",
        [
          "        for s in (char, word):",
          '            rank = np.argsort(np.argsort(-s, kind="stable"), kind="stable") + 1',
          "            fused += np.where(s > 0, 1 / (self.rrf_k + rank), 0)",
        ].join("\n"),
      ],
    ],
    "golden-code": [
      [
        "# TODO: 나머지 17문항을 추가합니다. (쉬운 질문 10개, 어려운 질문 10개, 자료에 없는 질문 3개 이상)",
        [
          ["perplexity는 무엇을 재는 지표인가?", "llm-training", "perplexity", "easy"],
          ["LoRA는 어떻게 학습 파라미터를 줄이나?", "llm-training", "LoRA", "easy"],
          ["합성곱 층은 무엇을 학습하나?", "cnn-rnn", "합성곱", "easy"],
          ["잔차 연결은 왜 쓰나?", "deep-training", "잔차 연결", "easy"],
          ["역전파는 무엇을 계산하나?", "neural-networks", "역전파", "easy"],
          ["과적합이란 무엇인가?", "generalization", "과적합", "easy"],
          ["Recall@k는 무엇을 재나?", "llm-systems", "Recall@k", "easy"],
          ["사람 승인은 언제 필요한가?", "llm-systems", "사람 승인", "easy"],
          ["데이터 드리프트란 무엇인가?", "llm-systems", "드리프트", "easy"],
          ["학습률이 너무 크면 경사하강법은 어떻게 되나?", "calculus-optimization", "학습률", "hard"],
          ["배치를 키우면 처리량과 지연시간은 어떻게 변하나?", "llm-systems", "처리량", "hard"],
          ["self-attention이 RNN보다 병렬화에 유리한 이유는?", "transformers", "self-attention", "hard"],
          ["CNN에서 과적합을 줄이는 방법 두 가지는?", "cnn-rnn", "과적합", "hard"],
          ["LoRA와 양자화를 함께 쓰면 무엇이 좋아지나?", "llm-training", "LoRA", "hard"],
          ["깊은 신경망의 역전파에서 기울기가 작아지는 이유는?", "neural-networks", "역전파", "hard"],
          ["다음 오프라인 모임 장소는 어디인가?", null, null, "hard"],
          ["동아리 회비는 얼마인가?", null, null, "hard"],
        ]
          .map(([q, src, ev, lv]) =>
            src ? `dict(q="${q}", source="${src}", evidence="${ev}", answer="${ev}", level="${lv}"),` : `dict(q="${q}", source=None, evidence=None, answer=None, level="${lv}"),`,
          )
          .join("\n    "),
      ],
    ],
    "scenario-code": [
      [
        "# TODO: 질문을 두 개 더 추가합니다.",
        '"과적합을 줄이려면 어떻게 해야 하나요?",\n    "RAG에서 청크 크기는 어떻게 정하나요?",',
      ],
      ["after = RAG(docs, chunk_size=500)   # TODO: 개선한 설정으로 바꿉니다.", "after = RAG(docs, chunk_size=300)"],
    ],
  },
  "capstone": {
    "code-experiment": [
      [
        "# baseline과 제안 방법을 같은 조건에서 비교합니다.",
        [
          "from sklearn.datasets import load_digits",
          "from sklearn.model_selection import train_test_split",
          "from sklearn.dummy import DummyClassifier",
          "from sklearn.linear_model import LogisticRegression",
          "X, y = load_digits(return_X_y=True)",
          "results = {'baseline': [], '로지스틱 회귀': []}",
          "for s in range(3):",
          "    Xtr, Xte, ytr, yte = train_test_split(X / 16.0, y, test_size=0.3, random_state=SEED + s)",
          "    results['baseline'].append(DummyClassifier().fit(Xtr, ytr).score(Xte, yte))",
          "    results['로지스틱 회귀'].append(LogisticRegression(max_iter=500).fit(Xtr, ytr).score(Xte, yte))",
          "print({k: (round(float(np.mean(v)), 3), round(float(np.std(v, ddof=1)), 3)) for k, v in results.items()})",
        ].join("\n"),
      ],
    ],
  },
};
