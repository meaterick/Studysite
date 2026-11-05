import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "주문 데이터를 읽어 조건으로 고르고 정렬하기",
    prompt: md`

CSV 문자열 \`ORDERS\`에는 주문 번호(\`order_id\`), 도시(\`city\`), 단가(\`price\`), 수량(\`qty\`), 상태(\`status\`)가 있습니다. 결측값은 빈칸이나 \`-\`로 적혀 있습니다.

1. \`load_orders(text)\`: \`-\`도 결측값으로 읽은 DataFrame
2. \`paid_in(df, cities)\`: 상태가 \`"paid"\`이고 도시가 \`cities\` 중 하나인 주문만, \`order_id\` 오름차순으로 정렬하고 인덱스를 0부터 다시 매긴 DataFrame
3. \`top_revenue(df, n)\`: 매출(\`price * qty\`, 수량이 결측이면 0으로 봄)이 큰 순서로 \`n\`개 주문의 \`order_id\` 리스트. 매출이 같으면 \`order_id\`가 작은 주문이 먼저입니다.
4. \`fill_status(df)\`: 상태가 결측인 행을 \`"unknown"\`으로 바꾼 **복사본**. 원래 \`df\`는 바꾸지 않습니다.
`,
    starter: py`
import io
import pandas as pd

ORDERS = """order_id,city,price,qty,status
1001,Seoul,1500,3,paid
1002,Busan,3000,,paid
1003,Seoul,25000,1,cancel
1004,Incheon,1500,10,paid
1005,Busan,25000,2,paid
1006,Seoul,3000,5,-
"""

def load_orders(text):
    return pd.read_csv(io.StringIO(text))  # TODO: "-"도 결측값으로 읽습니다.

def paid_in(df, cities):
    # TODO: 두 조건으로 고르고, order_id로 정렬한 뒤 reset_index(drop=True)
    return df

def top_revenue(df, n):
    d = df.copy()
    # TODO: d["revenue"]를 만들고, revenue 내림차순·order_id 오름차순으로 정렬합니다.
    return []

def fill_status(df):
    out = df.copy()
    # TODO: out.loc[결측 조건, "status"] = "unknown"
    return out

df = load_orders(ORDERS)
print(df.isna().sum().to_dict())                     # 기대: qty와 status에 결측 1개씩
print(paid_in(df, ["Busan", "Incheon"]))             # 기대: 1002, 1004, 1005
print(top_revenue(df, 3))                            # 기대: [1005, 1003, 1004]
print(fill_status(df)["status"].tolist())
`,
    tests: py`
import io
import pandas as pd

TEXT = """order_id,city,price,qty,status
1001,Seoul,1500,3,paid
1002,Busan,3000,,paid
1003,Seoul,25000,1,cancel
1004,Incheon,1500,10,paid
1005,Busan,25000,2,paid
1006,Seoul,3000,5,-
"""

@test("load_orders: qty와 status에 결측값이 1개씩")
def _():
    df = load_orders(TEXT)
    assert df.isna().sum().to_dict() == {"order_id": 0, "city": 0, "price": 0, "qty": 1, "status": 1}, f"결측: {df.isna().sum().to_dict()}"

@test("paid_in: 결제된 부산·인천 주문 1002, 1004, 1005, 인덱스 0부터")
def _():
    got = paid_in(load_orders(TEXT), ["Busan", "Incheon"])
    assert got["order_id"].tolist() == [1002, 1004, 1005], f"결과: {got['order_id'].tolist()}"
    assert got.index.tolist() == [0, 1, 2], f"인덱스: {got.index.tolist()}"

@test("paid_in: 취소·결측 상태는 빠진다")
def _():
    got = paid_in(load_orders(TEXT), ["Seoul"])
    assert got["order_id"].tolist() == [1001], f"결과: {got['order_id'].tolist()}"

@test("top_revenue: 매출 상위 3개 [1005, 1003, 1004]")
def _():
    assert top_revenue(load_orders(TEXT), 3) == [1005, 1003, 1004], f"결과: {top_revenue(load_orders(TEXT), 3)}"

@test("top_revenue: 매출이 같으면 order_id가 작은 주문이 먼저")
def _():
    df = pd.DataFrame({"order_id": [3, 1, 2], "city": ["a"] * 3, "price": [100, 100, 50], "qty": [2, 2, 1], "status": ["paid"] * 3})
    assert top_revenue(df, 3) == [1, 3, 2], f"결과: {top_revenue(df, 3)}"

@test("fill_status: 결측 → unknown, 원래 df는 그대로")
def _():
    df = load_orders(TEXT)
    out = fill_status(df)
    assert out["status"].tolist()[-1] == "unknown" and out["status"].isna().sum() == 0
    assert df["status"].isna().sum() == 1, "원래 df가 바뀌었습니다."
`,
    hints: [
      "`pd.read_csv(io.StringIO(text), na_values=['-'])`처럼 결측 표기를 넘깁니다.",
      "`df[(df['status'] == 'paid') & df['city'].isin(cities)].sort_values('order_id').reset_index(drop=True)`입니다.",
      "`d['revenue'] = d['price'] * d['qty'].fillna(0)` 다음 `d.sort_values(['revenue', 'order_id'], ascending=[False, True])['order_id'].head(n).tolist()`입니다.",
    ],
    solution: py`
import io
import pandas as pd

ORDERS = """order_id,city,price,qty,status
1001,Seoul,1500,3,paid
1002,Busan,3000,,paid
1003,Seoul,25000,1,cancel
1004,Incheon,1500,10,paid
1005,Busan,25000,2,paid
1006,Seoul,3000,5,-
"""

def load_orders(text):
    return pd.read_csv(io.StringIO(text), na_values=["-"])

def paid_in(df, cities):
    picked = df[(df["status"] == "paid") & df["city"].isin(cities)]
    return picked.sort_values("order_id").reset_index(drop=True)

def top_revenue(df, n):
    d = df.copy()
    d["revenue"] = d["price"] * d["qty"].fillna(0)
    ordered = d.sort_values(["revenue", "order_id"], ascending=[False, True])
    return ordered["order_id"].head(n).tolist()

def fill_status(df):
    out = df.copy()
    out.loc[out["status"].isna(), "status"] = "unknown"
    return out

df = load_orders(ORDERS)
print(df.isna().sum().to_dict())
print(paid_in(df, ["Busan", "Incheon"]))
print(top_revenue(df, 3))
print(fill_status(df)["status"].tolist())
`,
  },
]);
