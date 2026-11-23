import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "인덱스로 짝짓는 Series 계산",
    prompt: md`

상품별 재고 \`stock\`과 오늘 판매량 \`sold\`가 Series로 주어집니다. \`sold\`에는 판매되지 않은 상품이 없습니다.

1. \`remaining\`: \`stock - sold\`. 판매 기록이 없는 상품은 결측값이 되는 것을 확인합니다.
2. \`remaining_filled\`: 판매 기록이 없으면 0개 팔린 것으로 보고 계산한 남은 재고. \`stock.sub(sold, fill_value=0)\`을 씁니다.
3. \`in_stock\`: 재고(\`stock\`)가 0보다 큰 상품 이름의 리스트(원래 순서대로)
`,
    starter: py`
import pandas as pd

stock = pd.Series([5, 0, 12], index=["pen", "note", "bag"])
sold = pd.Series({"pen": 2, "bag": 4})

remaining = None          # TODO
remaining_filled = None   # TODO
in_stock = None           # TODO

print(remaining)
print(remaining_filled)
print(in_stock)
`,
    tests: py`
import math

@test("stock - sold: note는 결측")
def _():
    assert remaining is not None, "remaining을 계산하십시오."
    assert math.isnan(remaining["note"]), f"note: {remaining['note']}"
    assert remaining["pen"] == 3 and remaining["bag"] == 8, f"결과: {remaining.to_dict()}"

@test("fill_value=0으로 계산한 남은 재고")
def _():
    assert remaining_filled is not None, "remaining_filled를 계산하십시오."
    assert remaining_filled.to_dict() == {"bag": 8.0, "note": 0.0, "pen": 3.0}, f"결과: {remaining_filled.to_dict()}"

@test("재고가 있는 상품")
def _():
    assert in_stock == ["pen", "bag"], f"결과: {in_stock}"
`,
    hints: [
      "Series끼리의 `-`는 인덱스 이름이 같은 값끼리 계산합니다. `remaining = stock - sold`입니다.",
      "조건으로 고른 Series의 인덱스를 리스트로 바꿉니다: `stock[stock > 0].index.tolist()`",
    ],
    solution: py`
import pandas as pd

stock = pd.Series([5, 0, 12], index=["pen", "note", "bag"])
sold = pd.Series({"pen": 2, "bag": 4})

remaining = stock - sold
remaining_filled = stock.sub(sold, fill_value=0)
in_stock = stock[stock > 0].index.tolist()

print(remaining)
print(remaining_filled)
print(in_stock)
`,
  },
  {
    key: "ex1",
    title: "레코드 목록으로 DataFrame을 만들고 열 추가하기",
    prompt: md`

주문 기록이 딕셔너리의 리스트로 주어집니다. 각 딕셔너리에는 \`item\`(상품), \`price\`(단가), \`qty\`(수량)가 있습니다.

1. \`to_frame(records)\`: 레코드 목록으로 DataFrame을 만듭니다.
2. \`add_total(df)\`: \`total = price * qty\` 열을 추가한 **새** DataFrame을 돌려줍니다. 원래 \`df\`는 바꾸지 않습니다(\`df.copy()\`).
3. \`summary(df)\`: 행 수, 총매출(\`total\`의 합), 서로 다른 상품의 수를 담은 딕셔너리 \`{"rows": ..., "revenue": ..., "n_items": ...}\`를 돌려줍니다. 같은 상품이 여러 번 나올 수 있으므로 \`value_counts()\`로 상품별 개수를 센 결과의 길이를 씁니다. 합계는 \`int(...)\`로 파이썬 정수로 바꿉니다.
`,
    starter: py`
import pandas as pd

records = [
    {"item": "pen", "price": 1500, "qty": 3},
    {"item": "note", "price": 3000, "qty": 2},
    {"item": "pen", "price": 1500, "qty": 4},
    {"item": "bag", "price": 25000, "qty": 1},
]

def to_frame(records):
    return None  # TODO: pd.DataFrame(records)

def add_total(df):
    out = df.copy()
    # TODO: out["total"]에 price * qty를 넣습니다.
    return out

def summary(df):
    # TODO: 행 수, total의 합, 서로 다른 item의 수
    return {"rows": 0, "revenue": 0, "n_items": 0}

df = to_frame(records)
print(df)
if df is not None:
    df2 = add_total(df)
    print(df2)
    print(summary(df2))        # 기대: {'rows': 4, 'revenue': 41500, 'n_items': 3}
`,
    tests: py`
import pandas as pd
records = [
    {"item": "pen", "price": 1500, "qty": 3},
    {"item": "note", "price": 3000, "qty": 2},
    {"item": "pen", "price": 1500, "qty": 4},
    {"item": "bag", "price": 25000, "qty": 1},
]

@test("to_frame: 모양 (4, 3), 열 이름 item·price·qty")
def _():
    df = to_frame(records)
    assert isinstance(df, pd.DataFrame), f"자료형: {type(df).__name__}"
    assert df.shape == (4, 3) and list(df.columns) == ["item", "price", "qty"], f"모양 {df.shape}, 열 {list(df.columns)}"

@test("add_total: total 열 = price × qty")
def _():
    out = add_total(pd.DataFrame(records))
    assert "total" in out.columns and out["total"].tolist() == [4500, 6000, 6000, 25000], f"결과: {out.get('total')}"

@test("add_total: 원래 DataFrame은 바뀌지 않는다")
def _():
    df = pd.DataFrame(records)
    add_total(df)
    assert "total" not in df.columns, "원래 df에 total 열이 생겼습니다. copy()한 뒤 열을 추가하십시오."

@test("summary: 행 4개, 총매출 41500, 상품 3종류")
def _():
    got = summary(add_total(pd.DataFrame(records)))
    assert got["rows"] == 4 and got["revenue"] == 41500 and got["n_items"] == 3, f"결과: {got}"

@test("summary: 같은 상품만 있으면 n_items = 1, 합계는 파이썬 정수")
def _():
    df = add_total(pd.DataFrame([{"item": "a", "price": 100, "qty": 5}, {"item": "a", "price": 100, "qty": 1}]))
    got = summary(df)
    assert got["n_items"] == 1 and got["revenue"] == 600 and type(got["revenue"]) is int, f"결과: {got!r}"
`,
    hints: [
      "`to_frame`은 `pd.DataFrame(records)`입니다. 딕셔너리의 키가 열 이름이 됩니다.",
      "`out['total'] = out['price'] * out['qty']`처럼 열끼리 곱합니다.",
      "`len(df)`가 행 수, `int(df['total'].sum())`가 총매출, `len(df['item'].value_counts())`가 서로 다른 상품의 수입니다.",
    ],
    solution: py`
import pandas as pd

records = [
    {"item": "pen", "price": 1500, "qty": 3},
    {"item": "note", "price": 3000, "qty": 2},
    {"item": "pen", "price": 1500, "qty": 4},
    {"item": "bag", "price": 25000, "qty": 1},
]

def to_frame(records):
    return pd.DataFrame(records)

def add_total(df):
    out = df.copy()
    out["total"] = out["price"] * out["qty"]
    return out

def summary(df):
    return {
        "rows": len(df),
        "revenue": int(df["total"].sum()),
        "n_items": len(df["item"].value_counts()),
    }

df = to_frame(records)
print(df)
if df is not None:
    df2 = add_total(df)
    print(df2)
    print(summary(df2))
`,
  },
]);
