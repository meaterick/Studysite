import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "고객별 특성 만들기와 안전한 표 결합",
    prompt: md`

주문 표 \`orders\`(order_id, customer_id, product, amount)와 고객 표 \`customers\`(customer_id, region)가 주어집니다.

1. \`customer_features(orders)\`: 고객마다 한 행인 DataFrame. 열은 \`customer_id\`, \`n_orders\`(주문 수), \`total\`(금액 합), \`n_products\`(서로 다른 상품 수)이고, 인덱스는 0부터입니다. \`groupby\`와 \`agg\`를 씁니다.
2. \`attach_region(orders, customers)\`: 주문 표의 모든 행을 유지하며 \`region\`을 붙인 표. 고객 표에 같은 고객이 두 번 있으면 오류가 나도록 \`validate="many_to_one"\`을 쓰고, 지역이 없는 주문은 \`"unknown"\`으로 채웁니다.
3. \`group_accuracy(df, group_col)\`: \`y\`(정답)와 \`pred\`(예측) 열이 있는 표에서 집단별 정확도를 담은 Series
`,
    starter: py`
import pandas as pd

orders = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6],
    "customer_id": [10, 11, 10, 12, 11, 10],
    "product": ["pen", "note", "bag", "pen", "bag", "pen"],
    "amount": [4500, 6000, 25000, 15000, 50000, 3000],
})
customers = pd.DataFrame({"customer_id": [10, 11, 13], "region": ["Seoul", "Busan", "Daegu"]})

def customer_features(orders):
    # TODO: groupby("customer_id").agg(n_orders=..., total=..., n_products=...).reset_index()
    return pd.DataFrame()

def attach_region(orders, customers):
    # TODO: how="left", validate="many_to_one"으로 결합하고 region의 결측을 채웁니다.
    return orders

def group_accuracy(df, group_col):
    # TODO: 맞은 예측(bool)의 집단별 평균
    return pd.Series(dtype=float)

print(customer_features(orders))
print(attach_region(orders, customers))
res = pd.DataFrame({"group": ["A", "A", "B", "B", "B"], "y": [1, 0, 1, 1, 0], "pred": [1, 0, 0, 1, 1]})
print(group_accuracy(res, "group"))          # 기대: A 1.0, B 0.333...
`,
    tests: py`
import pandas as pd

O = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6],
    "customer_id": [10, 11, 10, 12, 11, 10],
    "product": ["pen", "note", "bag", "pen", "bag", "pen"],
    "amount": [4500, 6000, 25000, 15000, 50000, 3000],
})
C = pd.DataFrame({"customer_id": [10, 11, 13], "region": ["Seoul", "Busan", "Daegu"]})

@test("customer_features: 고객 3명, 열 4개, 인덱스 0부터")
def _():
    f = customer_features(O)
    assert list(f.columns) == ["customer_id", "n_orders", "total", "n_products"], f"열: {list(f.columns)}"
    assert len(f) == 3 and f.index.tolist() == [0, 1, 2], f"행: {len(f)}, 인덱스: {f.index.tolist()}"

@test("customer_features: 고객 10은 주문 3건, 합 32500, 상품 2종류")
def _():
    f = customer_features(O).set_index("customer_id")
    assert f.loc[10, "n_orders"] == 3 and f.loc[10, "total"] == 32500 and f.loc[10, "n_products"] == 2, f"결과: {f.loc[10].to_dict()}"

@test("attach_region: 행 수 유지, 고객 12는 unknown")
def _():
    m = attach_region(O, C)
    assert len(m) == 6 and "region" in m.columns, f"행 {len(m)}, 열 {list(m.columns)}"
    assert m.loc[m["customer_id"] == 12, "region"].tolist() == ["unknown"]
    assert m["region"].isna().sum() == 0

@test("attach_region: 고객 표의 키가 중복되면 오류")
def _():
    dup = pd.concat([C, pd.DataFrame({"customer_id": [10], "region": ["Jeju"]})])
    try:
        attach_region(O, dup)
    except pd.errors.MergeError:
        return
    raise AssertionError("키가 중복된 고객 표를 결합했는데 오류가 나지 않았습니다. validate='many_to_one'을 쓰십시오.")

@test("group_accuracy: A 1.0, B 1/3")
def _():
    res = pd.DataFrame({"group": ["A", "A", "B", "B", "B"], "y": [1, 0, 1, 1, 0], "pred": [1, 0, 0, 1, 1]})
    acc = group_accuracy(res, "group")
    assert approx(acc["A"], 1.0) and approx(acc["B"], 1 / 3), f"결과: {acc.to_dict()}"
`,
    hints: [
      "`orders.groupby('customer_id').agg(n_orders=('order_id', 'count'), total=('amount', 'sum'), n_products=('product', 'nunique')).reset_index()`입니다.",
      "`m = orders.merge(customers, on='customer_id', how='left', validate='many_to_one')` 다음 `m['region'] = m['region'].fillna('unknown')`입니다.",
      "`(df['y'] == df['pred']).groupby(df[group_col]).mean()`처럼 bool Series를 집단 열로 묶어 평균을 냅니다.",
    ],
    solution: py`
import pandas as pd

orders = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6],
    "customer_id": [10, 11, 10, 12, 11, 10],
    "product": ["pen", "note", "bag", "pen", "bag", "pen"],
    "amount": [4500, 6000, 25000, 15000, 50000, 3000],
})
customers = pd.DataFrame({"customer_id": [10, 11, 13], "region": ["Seoul", "Busan", "Daegu"]})

def customer_features(orders):
    return orders.groupby("customer_id").agg(
        n_orders=("order_id", "count"),
        total=("amount", "sum"),
        n_products=("product", "nunique"),
    ).reset_index()

def attach_region(orders, customers):
    m = orders.merge(customers, on="customer_id", how="left", validate="many_to_one")
    m["region"] = m["region"].fillna("unknown")
    return m

def group_accuracy(df, group_col):
    return (df["y"] == df["pred"]).groupby(df[group_col]).mean()

print(customer_features(orders))
print(attach_region(orders, customers))
res = pd.DataFrame({"group": ["A", "A", "B", "B", "B"], "y": [1, 0, 1, 1, 0], "pred": [1, 0, 0, 1, 1]})
print(group_accuracy(res, "group"))
`,
  },
]);
