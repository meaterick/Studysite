import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "data-card-eda",
  kind: "track",
  title: "중고차 매물 데이터 점검과 데이터 카드",
  summary: md`

중고차 매물 125건이 담긴 CSV를 pandas로 읽어, 자료형을 바로잡고 품질 문제(표기 불일치·중복·잘못된 값·결측)를 점검해 고친 뒤, 학습 데이터에서만 계산한 기준으로 모델 입력 표를 만듭니다. 마지막으로 무엇을 발견하고 어떻게 처리했는지 데이터 카드로 정리합니다. 목표 변수는 매물 가격(\`price\`, 만 원)입니다. 트랙 3의 NumPy·pandas·정제·탐색·특성 공학을 한 작업 공간에서 함께 씁니다. 모든 코드는 브라우저에서 실행됩니다.

**핵심** 단계 네 개(읽기와 자료형·품질 점검·모델 입력 만들기·데이터 카드)만 채점합니다. **보충**(그래프로 확인하기)과 **심화**(학습·테스트 분포 비교) 단계는 선택이며 피드백만 받습니다. 제출하기 전에 "실행 환경 초기화" 후 "전체 실행"으로 처음부터 같은 결과가 나오는지 확인합니다.
`,
  requirements: [
    "`load_listings`와 `clean_types`로 \"N/A\"를 결측으로 읽고, 브랜드 표기를 네 가지로 통일하며, 주행거리를 숫자로, 등록일을 날짜로 바꾼다.",
    "`quality_report`로 결측·완전 중복·키 중복·범위 밖 값을 세고, `fix_quality`로 고쳐 119행·매물 번호가 유일한 표를 만든다.",
    "시드 42로 나눈 학습 데이터에서만 대체값과 범주 목록을 계산해 학습·테스트 데이터의 모델 입력 표(결측 없음)를 만들고, 누수 열을 찾아 제외한다.",
    "데이터 카드에 출처·행의 뜻·목표 변수·열 설명·품질 문제와 처리·제외한 열과 이유·한계를 정리한다.",
    "실행 환경을 초기화한 뒤 처음부터 실행해도 같은 결과가 나온다.",
  ],
  tasks: [
    {
      id: "load",
      title: "데이터 읽기와 자료형 바로잡기",
      tier: "core",
      instructions: md`

첫 코드 셀은 과제 데이터 \`used_cars.csv\`를 만듭니다. 고치지 말고 그대로 실행합니다. 열은 매물 번호(\`listing_id\`), 브랜드(\`brand\`), 연식(\`year\`), 주행거리(\`mileage_km\`), 연료(\`fuel\`), 사고 횟수(\`accidents\`), 등록일(\`listed_date\`), 등록 가격(\`price\`), 판매 완료 가격(\`final_price\`)입니다.

두 번째 셀의 두 함수를 완성합니다([[lesson:pandas-selection]], [[lesson:data-types]]).
- \`load_listings(path)\`: \`"N/A"\`도 결측값으로 읽습니다.
- \`clean_types(raw)\`: 복사본에서 브랜드의 앞뒤 공백을 지우고 \`BRAND_MAP\`으로 표기를 통일합니다. 주행거리는 쉼표를 지운 뒤 숫자로 바꾸고(\`errors="coerce"\`), 등록일은 \`format="%Y-%m-%d"\`로 날짜로 바꿉니다.
`,
      cells: [
        { kind: "code", id: "load-data", label: "과제 데이터 만들기(고치지 않습니다)", starter: py`
DATA = """listing_id,brand,year,mileage_km,fuel,accidents,listed_date,price,final_price
C1109,기아,2022,46200,diesel,0,2024-05-27,2384,2251
C1100,현대,2018,55000,hybrid,1,2024-02-19,1829,
C1099,기아,2018,66600,gasoline,0,2024-05-13,1508,
C1082,기아,2013,133200,hybrid,1,2024-04-11,830,802
C1040,현대,2014,"110,400",electric,1,2024-04-03,1519,1414
C1022,현대,2015,"95,800",gasoline,1,2024-01-05,841,808
C1041,현대 ,2011,"183,300",diesel,0,2024-05-06,212,204
C1049,현대,2023,N/A,gasoline,0,2024-04-10,2841,2649
C1005,Hyundai,2021,36700,gasoline,0,2024-02-20,2212,2088
C1116,기아,2018,"80,400",gasoline,1,2024-03-11,1310,1241
C1097,기아,2020,45700,gasoline,0,2024-04-07,1789,1743
C1052,현대,2023,9400,diesel,2,2024-05-15,2624,2455
C1085,기아,2011,"162,000",hybrid,0,2024-02-02,542,527
C1066,기아,2012,136100,diesel,0,2024-05-08,415,406
C1071,현대,2021,43400,hybrid,0,2024-02-19,2443,2418
C1108,현대,2016,"128,400",gasoline,0,2024-04-25,1052,993
C1065,현대,2013,N/A,hybrid,1,2024-05-08,782,757
C1013,KIA,2017,87100,gasoline,1,2024-05-07,1179,1114
C1077,기아,2023,65600,electric,0,2024-04-01,3211,
C1026,쉐보레,2014,151700,gasoline,0,2024-01-12,388,
C1107,르노,2010,"159,900",hybrid,0,2024-02-20,235,224
C1050,KIA,2017,151900,hybrid,0,2024-06-12,1138,
C1051,현대,2022,60700,gasoline,1,2024-04-08,2183,2085
C1059,기아,2019,72400,diesel,0,2024-04-24,1723,
C1043,기아,2011,145900,hybrid,0,2024-01-23,574,546
C1015,기아,2012,"154,600",gasoline,0,2024-02-07,376,372
C1106,현대,2019,166500,electric,2,2024-01-21,1629,1603
C1020,현대,2011,170000,gasoline,0,2024-04-30,268,260
C1093,현대,2011,122600,gasoline,0,2024-04-05,488,477
C1076,기아,2020,54600,gasoline,1,2024-05-11,1602,
C1114,쉐보레,2012,119000,gasoline,0,2024-01-14,233,
C1081,현대,2018,54600,diesel,1,2024-03-15,1503,1411
C1058,현대,2022,"40,900",hybrid,0,2024-05-08,2807,
C1046,현대,2022,44100,gasoline,,2024-04-11,2479,2340
C1045,쉐보레,2012,"122,000",diesel,1,2024-04-15,205,201
C1012,현대,2023,"13,500",diesel,0,2024-01-14,2772,
C1119,현대,2011,165200,gasoline,0,2024-01-07,315,308
C1011,기아,2023,"37,700",diesel,1,2024-03-02,2409,2336
C1084,현대,2020,60600,diesel,0,2024-05-14,2098,
C1095,현대,2015,121000,gasoline,0,2024-04-05,869,859
C1018,기아,2014,143200,electric,1,2024-03-08,1127,
C1050,KIA,2017,151900,hybrid,0,2024-01-04,1258,1205
C1002,현대,2012,121000,gasoline,,2024-05-17,503,488
C1077,기아,2023,65600,electric,0,2024-04-01,3211,
C1017,쉐보레,2015,87100,gasoline,1,2024-03-31,572,
C1029,현대,2013,106600,gasoline,1,2024-03-20,545,539
C1079,현대,2021,29100,hybrid,0,2024-04-02,2527,2427
C1037,르노,2013,107000,gasoline,1,2024-01-17,244,
C1030,기아 ,2018,92200,diesel,0,2024-01-06,1403,1343
C1054,현대,2019,,gasoline,,2024-03-05,1530,
C1088,현대,2016,106700,diesel,-1,2024-05-15,1196,1158
C1080,쉐보레,2022,50300,gasoline,0,2024-02-09,1985,
C1062,기아,2013,"116,700",gasoline,1,2024-05-16,628,619
C1096,르노,2016,"106,100",gasoline,0,2024-04-04,590,573
C1115,기아,2016,164700,hybrid,1,2024-05-23,951,
C1027,현대,2010,"153,900",hybrid,0,2024-02-13,406,398
C1003,쉐보레,2018,73900,gasoline,1,2024-05-18,936,919
C1033,현대,2017,72200,gasoline,1,2024-01-08,1251,
C1104,기아,2011,"195,500",gasoline,3,2024-05-13,200,187
C1036,기아,2022,45800,gasoline,1,2024-05-14,2248,
C1021,기아,2011,134300,electric,1,2024-05-18,974,
C1032,쉐보레,2010,159200,gasoline,0,2024-05-16,200,188
C1111,현대,2018,"72,200",diesel,0,2024-05-20,1493,1455
C1028,현대,2011,"157,900",diesel,2,2024-01-15,215,
C1070,현대,2021,60200,gasoline,1,2024-02-12,2064,1970
C1105,기아,2021,"57,300",diesel,0,2024-04-28,2056,1937
C1087,기아,2013,112800,gasoline,2,2024-05-28,433,
C1074,쉐보레,2019,72500,gasoline,0,2024-01-10,1150,1115
C1035,기아,2022,44000,hybrid,1,2024-05-26,2482,2416
C1010,기아,2019,"51,700",gasoline,1,2024-04-03,1486,1439
C1113,현대,2022,56000,gasoline,1,2024-01-01,2364,2314
C1094,쉐보레,2010,N/A,diesel,0,2024-04-28,200,192
C1031,Hyundai,2015,85200,diesel,1,2024-04-09,799,770
C1016,르노,2020,"58,900",diesel,1,2024-05-29,1150,1121
C1086,현대,2010,139400,hybrid,,2024-02-22,517,508
C1001,현대,2018,"63,500",gasoline,0,2024-01-08,1519,1459
C1117,르노,2014,"125,700",gasoline,1,2024-03-22,311,305
C1112,쉐보레,2010,180700,diesel,1,2024-03-17,200,
C1005,Hyundai,2021,36700,gasoline,0,2024-02-20,2212,2088
C1009,현대,2013,108800,diesel,1,2024-02-04,696,669
C1004,르노,2021,"68,200",diesel,0,2024-01-03,1471,
C1038,쉐보레,2021,35500,gasoline,0,2024-04-14,1662,
C1078,기아,2020,38000,gasoline,0,2024-03-19,1757,1731
C1073,기아,2021,43100,gasoline,1,2024-05-04,2100,2013
C1091,현대,2012,"126,300",hybrid,2,2024-01-18,516,
C1034,쉐보레,2022,,gasoline,1,2024-01-21,1540,
C1064,현대,2023,22200,diesel,1,2024-02-22,2745,
C1061,기아,2014,127400,gasoline,1,2024-02-26,514,488
C1053,현대,2011,"142,000",diesel,2,2024-03-28,208,200
C1098,현대,2011,161500,diesel,0,2024-05-03,362,343
C1024,현대,2015,110400,hybrid,3,2024-05-15,823,772
C1056,현대,2021,38500,hybrid,1,2024-02-08,2398,2297
C1069,현대,2023,"38,100",gasoline,1,2024-03-04,2647,2503
C1063,르노,199,,diesel,0,2024-01-16,485,476
C1101,현대,2017,"77,000",electric,1,2024-01-31,99999,1769
C1060,기아,2013,"139,100",gasoline,2,2024-04-19,398,
C1019,Hyundai,2015,87100,hybrid,1,2024-02-21,1234,1179
C1006,현대,2014,"119,800",diesel,0,2024-04-25,625,
C1055,기아,2020,51500,diesel,1,2024-02-22,1794,1772
C1075,현대,2017,101000,gasoline,0,2024-01-11,1072,1058
C1000,기아,2015,"85,200",diesel,0,2024-03-20,867,
C1044,현대,2017,102000,diesel,2,2024-03-31,1168,1089
C1007,현대,2011,"138,500",hybrid,1,2024-02-11,631,617
C1048,현대,2016,"98,900",diesel,0,2024-04-15,996,983
C1020,현대,2011,170000,gasoline,0,2024-06-10,148,
C1102,현대,2010,144500,diesel,0,2024-05-21,282,
C1039,현대,2012,"132,900",diesel,1,2024-01-13,483,462
C1008,현대 ,2022,73900,gasoline,2,2024-03-15,2179,
C1090,현대,2020,82400,gasoline,0,2024-04-21,1832,1813
C1042,르노,2021,55600,gasoline,0,2024-04-26,1548,1469
C1110,현대,2010,"157,000",gasoline,0,2024-05-27,299,
C1089,현대,2022,N/A,gasoline,1,2024-02-11,2561,2444
C1072,현대,2014,107100,hybrid,0,2024-03-09,1207,
C1040,현대,2014,"110,400",electric,1,2024-04-03,1519,1414
C1014,현대,2099,"93,200",gasoline,1,2024-02-13,912,
C1057,기아,2010,154300,gasoline,0,2024-03-02,240,235
C1092,기아,2018,75700,gasoline,1,2024-04-16,1283,
C1103,현대,2020,"84,400",diesel,0,2024-03-29,1942,
C1023,쉐보레,2018,"109,900",diesel,,2024-05-04,825,785
C1083,기아,2022,27000,diesel,2,2024-04-18,2176,2110
C1067,기아,2017,"87,900",gasoline,0,2024-05-22,1191,1170
C1118,기아,2014,127500,gasoline,0,2024-05-18,651,607
C1025,현대,2010,"167,400",gasoline,0,2024-03-23,280,
C1068,현대,2019,67600,diesel,0,2024-05-21,1562,1497
C1047,기아,2013,114700,gasoline,0,2024-04-19,695,
"""
with open("used_cars.csv", "w", encoding="utf-8") as f:
    f.write(DATA)
print("used_cars.csv를 만들었습니다:", DATA.count("\n") - 1, "행")
` },
        { kind: "code", id: "load-code", label: "읽기와 자료형", starter: py`
import numpy as np
import pandas as pd

BRAND_MAP = {"Hyundai": "현대", "KIA": "기아"}

def load_listings(path):
    """CSV를 읽는다. "N/A"도 결측으로 읽는다."""
    return pd.read_csv(path)  # TODO: na_values로 "N/A"를 결측으로 지정합니다.

def clean_types(raw):
    """브랜드 표기 통일, 주행거리 숫자 변환, 등록일 날짜 변환을 한 복사본"""
    df = raw.copy()
    # TODO: brand의 앞뒤 공백을 지우고 BRAND_MAP으로 바꿉니다.
    # TODO: mileage_km의 쉼표를 지우고 숫자로 바꿉니다(errors="coerce").
    # TODO: listed_date를 날짜로 바꿉니다.
    return df

raw = load_listings("used_cars.csv")
cars = clean_types(raw)
print(cars.dtypes)
print(cars["brand"].value_counts())
print("변환 때문에 새로 생긴 결측:", int((raw["mileage_km"].notna() & cars["mileage_km"].isna()).sum()))
` },
        { kind: "text", id: "load-answer", prompt: "읽으면서 발견한 표기·형식 문제(브랜드, 주행거리, 등록일)를 정리하고, 숫자로 바꾸며 새로 생긴 결측이 있는지 확인한 방법을 적어 주십시오.", minChars: 100 },
      ],
    },
    {
      id: "quality",
      title: "품질 점검과 수정",
      tier: "core",
      instructions: md`

\`quality_report\`로 문제를 센 뒤 \`fix_quality\`로 고칩니다([[lesson:eda]], [[lesson:data-cleaning]]).
- \`quality_report(df, key, ranges)\`: 행 수, 결측이 있는 열의 결측 개수, 완전 중복의 수, \`key\` 기준 중복의 수, \`ranges\`의 열마다 범위 밖 값의 개수(결측은 세지 않음)를 딕셔너리로 돌려줍니다.
- \`fix_quality(df)\`: 다음 순서로 고친 복사본을 돌려줍니다. (1) 완전 중복 행을 지웁니다. (2) 같은 \`listing_id\`가 여러 번 있으면 \`listed_date\`가 가장 늦은 행(다시 등록한 매물)만 남깁니다. (3) 연식이 2000~2025 밖이거나 사고 횟수가 0~10 밖이면 그 값을 결측으로 바꿉니다. 정수 열에 결측을 넣기 전에 \`astype(float)\`로 바꿉니다. (4) 가격이 1~20000 밖인 행은 목표 변수가 잘못되었으므로 지웁니다. (5) \`listing_id\` 순으로 정렬하고 인덱스를 0부터 다시 매깁니다.
`,
      cells: [
        { kind: "code", id: "quality-code", label: "품질 점검", starter: py`
RANGES = {"year": (2000, 2025), "accidents": (0, 10), "price": (1, 20000)}

def quality_report(df, key, ranges):
    """{"rows", "missing", "full_duplicates", "key_duplicates", "out_of_range"}"""
    # TODO: 결측(있는 열만), 완전 중복, 키 중복, 범위 밖 개수를 셉니다.
    return {"rows": len(df), "missing": {}, "full_duplicates": 0, "key_duplicates": 0, "out_of_range": {}}

def fix_quality(df):
    """중복 제거 → 최신 등록만 → 잘못된 연식·사고 횟수는 결측 → 가격 오류 행 제거 → 정렬"""
    out = df.copy()
    # TODO: 본문의 순서대로 고칩니다.
    return out

report = quality_report(cars, "listing_id", RANGES)
print(report)
clean = fix_quality(cars)
print(len(cars), "→", len(clean), "행, 매물 번호 유일:", clean["listing_id"].is_unique)
` },
        { kind: "text", id: "quality-answer", prompt: "발견한 품질 문제를 표로 정리해 주십시오. 다시 등록한 매물을 최신 행으로 남긴 이유와, 잘못된 가격 행을 채우지 않고 지운 이유도 적습니다.", minChars: 200, template: "| 품질 기준 | 문제 | 개수 | 처리 |\n| --- | --- | --- | --- |\n| 일관성 |  |  |  |\n| 유일성 |  |  |  |\n| 유효성 |  |  |  |\n| 완전성 |  |  |  |\n\n최신 행을 남긴 이유:\n\n가격 오류 행을 지운 이유:" },
      ],
    },
    {
      id: "features",
      title: "학습 데이터 기준으로 모델 입력 만들기",
      tier: "core",
      instructions: md`

데이터를 시드 42로 학습 80%·테스트 20%로 나눈 뒤, 기준은 학습 데이터에서만 계산합니다([[lesson:encoding-scaling]], [[lesson:feature-engineering]]).
- \`leakage_candidates(df, target, threshold)\`: 목표 변수를 뺀 수치형 열 중 목표 변수와 상관계수의 절댓값이 \`threshold\`보다 큰 열(상관이 큰 순서). 후보가 모두 누수는 아니므로, 후보마다 예측 시점에 알 수 있는 값인지 판단해 답안에 적습니다.
- \`fit_cleaner(train)\`: \`year\`, \`mileage_km\`, \`accidents\`의 학습 데이터 중앙값과, 학습 데이터의 연료·브랜드 목록(정렬)을 돌려줍니다.
- \`make_features(df, params)\`: 다음 열을 이 순서로 만든 표를 돌려줍니다. \`mileage_km_missing\`, \`accidents_missing\`(원래 결측이면 1) → 중앙값으로 채운 \`year\`, \`mileage_km\`, \`accidents\` → \`age\`(2024 − 연식) → \`km_per_year\`(주행거리를 나이로 나눈 값, 나이는 최소 1) → 연료마다 \`fuel_<값>\` → 브랜드마다 \`brand_<값>\`(해당하면 1). 매물 번호·날짜·가격 관련 열은 넣지 않습니다.
`,
      cells: [
        { kind: "code", id: "features-code", label: "분할·기준·특성", starter: py`
def split(df, test_ratio=0.2, seed=42):
    order = np.random.default_rng(seed).permutation(len(df))
    k = round(len(df) * test_ratio)
    return df.iloc[order[k:]].reset_index(drop=True), df.iloc[order[:k]].reset_index(drop=True)

def leakage_candidates(df, target, threshold=0.9):
    return []  # TODO: 수치형 열의 목표 변수와의 |상관계수|가 threshold보다 큰 열(큰 순서)

NUMERIC = ["year", "mileage_km", "accidents"]

def fit_cleaner(train):
    return {
        "medians": {},  # TODO: NUMERIC 열마다 학습 데이터의 중앙값(float)
        "fuels": sorted(train["fuel"].dropna().unique()),
        "brands": sorted(train["brand"].dropna().unique()),
    }

def make_features(df, params):
    X = pd.DataFrame(index=df.index)
    # TODO: 결측 표시 → 중앙값 채우기 → age, km_per_year → fuel_·brand_ 원-핫
    return X

train, test = split(clean)
print(len(train), len(test))
print("누수 후보:", leakage_candidates(train, "price"))
params = fit_cleaner(train)
X_train, X_test = make_features(train, params), make_features(test, params)
print(X_train.shape, X_test.shape, "테스트 입력의 결측:", int(X_test.isna().sum().sum()))
print(list(X_train.columns))
` },
        { kind: "text", id: "features-answer", prompt: "누수 후보로 나온 열마다 예측 시점에 알 수 있는 값인지 판단하고, 제외한 열과 남긴 열의 이유를 적어 주십시오. 대체값을 학습 데이터로만 계산한 이유도 설명합니다.", minChars: 150 },
      ],
    },
    {
      id: "card",
      title: "데이터 카드",
      tier: "core",
      instructions: md`

지금까지 확인한 내용을 데이터 카드로 정리합니다. 다른 사람이 이 카드만 읽고도 데이터의 구성, 정제 과정, 쓸 때 주의할 점을 알 수 있어야 합니다([[lesson:eda]]). 수치는 위 셀의 출력에서 가져옵니다.
`,
      cells: [
        { kind: "text", id: "card-answer", prompt: "아래 틀을 채워 데이터 카드를 작성해 주십시오.", minChars: 400, template: "## 데이터 카드: 중고차 매물\n\n- 출처와 수집 기간:\n- 한 행의 뜻:\n- 행·열의 수(정제 전 → 정제 후):\n- 목표 변수와 분포:\n\n| 열 | 뜻 | 자료형(정제 후) | 처리 |\n| --- | --- | --- | --- |\n\n- 발견한 품질 문제와 처리:\n- 제외한 열과 이유:\n- 학습·테스트 분할 방법:\n- 한계와 쓸 때 주의할 점:" },
      ],
    },
    {
      id: "viz",
      title: "보충: 그래프로 확인하기",
      tier: "supplement",
      instructions: md`

정제한 학습 데이터로 그래프 세 개를 그리고 해석합니다([[lesson:visualization]]). 그래프 안의 글자는 영문으로 씁니다.
- 가격의 히스토그램과, 로그를 취한 가격의 히스토그램
- 주행거리와 가격의 산점도(연료별로 색을 나눔)
- 브랜드별 가격의 상자그림
`,
      cells: [
        { kind: "code", id: "viz-code", label: "그래프", starter: py`
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 3, figsize=(13, 3.5))
# TODO: axes[0]에 가격과 로그 가격의 히스토그램(또는 그림을 하나 더 만들어도 됩니다)
# TODO: axes[1]에 연료별 색으로 주행거리-가격 산점도
# TODO: axes[2]에 브랜드별 가격 상자그림
plt.tight_layout()
plt.show()
` },
        { kind: "text", id: "viz-answer", prompt: "세 그래프에서 확인한 점을 적고, 그래프를 보고 추가하거나 바꾸고 싶은 특성이 있다면 이유와 함께 적어 주십시오." },
      ],
    },
    {
      id: "advanced",
      title: "심화: 학습·테스트 분포 비교",
      tier: "advanced",
      instructions: md`

다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않습니다.

- 전체 데이터로 계산한 중앙값과 학습 데이터로 계산한 중앙값을 비교하고, 차이가 작더라도 학습 데이터로만 계산해야 하는 이유를 설명합니다.
- 학습·테스트 데이터의 가격·연식 분포를 히스토그램이나 요약 통계로 비교하고, 분할 시드를 바꾸면 차이가 어떻게 변하는지 확인합니다([[lesson:sampling]]).
- 테스트 데이터에 학습 데이터에 없는 범주가 생기면 \`make_features\`가 어떻게 동작하는지 확인하고, 필요하면 고칩니다.
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: py`
# 선택한 실험을 이 셀에서 진행합니다. 필요하면 '+ 코드 셀 추가'로 셀을 늘릴 수 있습니다.
` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "clean", label: "정제와 자료형 변환의 정확성", points: 3, guide: "결측 표기·브랜드 표기·주행거리·등록일을 바르게 처리하고, 중복과 잘못된 값을 본문의 순서대로 고쳐 119행을 얻었습니다." },
    { id: "judgement", label: "품질 점검과 누수 판단", points: 3, guide: "품질 문제를 기준별로 정리하고, 누수 후보마다 예측 시점에 알 수 있는지 근거를 들어 판단했으며, 대체값을 학습 데이터로만 계산했습니다." },
    { id: "card", label: "데이터 카드의 완성도", points: 3, guide: "틀의 항목을 출력 수치와 함께 빠짐없이 채웠고, 다른 사람이 데이터를 쓸 때 주의할 점(한계)을 구체적으로 적었습니다." },
    { id: "repro", label: "재현성과 가독성", points: 1, guide: "핵심 단계의 모든 셀이 처음부터 순서대로 실행되고, 답안이 간결하며 출력과 잘 연결됩니다." },
  ],
  gradingNotes: md`
- **읽기와 자료형**: 브랜드는 현대 64, 기아 40, 쉐보레 13, 르노 8건으로 통일된다. "N/A"와 빈칸이 결측이 되어 주행거리 결측은 7건이고, 쉼표를 지운 뒤 숫자로 바꿀 때 새로 생긴 결측은 0건이다.
- **품질 점검**: 행 125, 결측 \`{mileage_km: 7, accidents: 5, final_price: 42}\`, 완전 중복 3, 키 중복 5(완전 중복 3 + 다시 등록 2), 범위 밖 연식 2(2099, 199)·사고 횟수 1(−1)·가격 1(99999)이다. 고친 뒤 119행이고, 연식 결측 2·사고 횟수 결측 6·주행거리 결측 7이다.
- **모델 입력**: 학습 95행·테스트 24행이다. 학습 데이터 중앙값은 연식 2016, 주행거리 104050, 사고 횟수 0이다(전체 데이터 중앙값은 연식 2017, 주행거리 97350). 입력 표는 15열이고 테스트 입력에 결측이 없다.
- **누수 판단**: 상관계수 0.9 기준 후보는 \`final_price\`(0.999)와 \`year\`(0.924)다. \`final_price\`는 판매가 끝난 뒤 기록되는 값이라 제외해야 하고, \`year\`는 등록 시점에 아는 값이라 남긴다. 상관만 보고 둘 다 빼거나 둘 다 남기면 감점한다.
- 우수 답안은 다시 등록한 매물의 처리 근거(최신 가격이 현재 시장 가격에 가깝다 등)와 데이터 카드의 한계(브랜드 4개, 6개월 기간, 판매 완료 여부에 따른 편향 등)를 구체적으로 적는다.
`,
  maxScore: 10,
  autoTests: [
    { id: "eda-at-types", taskId: "load", title: "결측 표기·브랜드·주행거리·등록일이 바르게 바뀌었다", hint: "`na_values=['N/A']`, `str.strip()`과 `replace(BRAND_MAP)`, 쉼표를 지운 `pd.to_numeric`, `pd.to_datetime`을 확인하십시오.", code: py`
assert set(cars["brand"].dropna()) == {"현대", "기아", "쉐보레", "르노"}, f"브랜드: {sorted(cars['brand'].dropna().unique())}"
assert pd.api.types.is_numeric_dtype(cars["mileage_km"]), f"주행거리 자료형: {cars['mileage_km'].dtype}"
assert pd.api.types.is_datetime64_any_dtype(cars["listed_date"]), f"등록일 자료형: {cars['listed_date'].dtype}"
assert int(cars["mileage_km"].isna().sum()) == 7, f"주행거리 결측: {int(cars['mileage_km'].isna().sum())}"
` },
    { id: "eda-at-quality", taskId: "quality", title: "품질 점검 수치와 고친 표가 맞다", hint: "중복은 완전 중복을 먼저 지운 뒤 매물 번호 기준으로 최신 행만 남깁니다. 가격이 범위 밖인 행은 지웁니다.", code: py`
r = quality_report(cars, "listing_id", RANGES)
assert r["rows"] == 125 and r["full_duplicates"] == 3 and r["key_duplicates"] == 5, f"보고서: {r}"
assert r["missing"] == {"mileage_km": 7, "accidents": 5, "final_price": 42}, f"결측: {r['missing']}"
assert r["out_of_range"] == {"year": 2, "accidents": 1, "price": 1}, f"범위 밖: {r['out_of_range']}"
assert len(clean) == 119 and clean["listing_id"].is_unique, f"고친 표: {len(clean)}행"
assert clean["year"].dropna().between(2000, 2025).all() and clean["price"].between(1, 20000).all()
` },
    { id: "eda-at-features", taskId: "features", title: "학습 데이터 기준으로 결측 없는 입력 표를 만들었다", hint: "중앙값은 `train`에서만 계산하고, 결측 표시 열은 결측을 채우기 전에 만듭니다.", code: py`
assert len(train) == 95 and len(test) == 24, f"분할: {len(train)}, {len(test)}"
assert params["medians"] == {"year": float(train["year"].median()), "mileage_km": float(train["mileage_km"].median()), "accidents": float(train["accidents"].median())}, f"중앙값: {params['medians']}"
expected = ["mileage_km_missing", "accidents_missing", "year", "mileage_km", "accidents", "age", "km_per_year"] + [f"fuel_{v}" for v in params["fuels"]] + [f"brand_{v}" for v in params["brands"]]
assert list(X_train.columns) == expected, f"열: {list(X_train.columns)}"
assert int(X_test.isna().sum().sum()) == 0 and int(X_train["mileage_km_missing"].sum()) == int(train["mileage_km"].isna().sum())
` },
    { id: "eda-at-leak", taskId: "features", title: "누수 후보를 상관이 큰 순서로 찾고 누수 열을 입력에서 뺐다", code: py`
assert leakage_candidates(train, "price") == ["final_price", "year"], f"후보: {leakage_candidates(train, 'price')}"
assert "final_price" not in X_train.columns and "price" not in X_train.columns
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "그룹별 중앙값으로 결측 채우기",
      prompt: md`

브랜드마다 주행거리 분포가 다를 수 있으므로, 전체 중앙값 대신 **브랜드별 중앙값**으로 결측을 채웁니다. 기준은 학습 데이터에서만 계산하고, 학습 데이터에 없는 브랜드는 전체 중앙값으로 채웁니다.

- \`fit_group_medians(train, value_col, group_col)\`: \`{"by_group": {그룹: 중앙값}, "overall": 전체 중앙값}\`
- \`fill_by_group(df, value_col, group_col, params)\`: \`value_col\`의 결측을 그룹별 중앙값으로 채운 복사본. 학습 데이터에 없던 그룹은 전체 중앙값을 씁니다.
`,
      starter: py`
import numpy as np
import pandas as pd

def fit_group_medians(train, value_col, group_col):
    # TODO: 그룹별 중앙값 딕셔너리와 전체 중앙값
    return {"by_group": {}, "overall": 0.0}

def fill_by_group(df, value_col, group_col, params):
    out = df.copy()
    # TODO: 그룹별 중앙값을 행마다 붙여 결측을 채우고, 없는 그룹은 전체 중앙값
    return out

train = pd.DataFrame({"brand": ["a", "a", "b", "b", "b"], "km": [10.0, 30.0, 100.0, np.nan, 200.0]})
test = pd.DataFrame({"brand": ["a", "b", "c"], "km": [np.nan, np.nan, np.nan]})
params = fit_group_medians(train, "km", "brand")
print(params)
print(fill_by_group(test, "km", "brand", params)["km"].tolist())    # 기대: [20.0, 150.0, 65.0]
`,
      tests: py`
import numpy as np
import pandas as pd
TR = pd.DataFrame({"brand": ["a", "a", "b", "b", "b"], "km": [10.0, 30.0, 100.0, np.nan, 200.0]})
TE = pd.DataFrame({"brand": ["a", "b", "c"], "km": [np.nan, np.nan, np.nan]})

@test("학습 데이터의 그룹별 중앙값과 전체 중앙값")
def _():
    p = fit_group_medians(TR, "km", "brand")
    assert approx(p["by_group"]["a"], 20) and approx(p["by_group"]["b"], 150) and approx(p["overall"], 65), f"결과: {p}"

@test("테스트의 결측을 그룹별로 채우고, 없는 그룹은 전체 중앙값")
def _():
    out = fill_by_group(TE, "km", "brand", fit_group_medians(TR, "km", "brand"))
    assert approx(out["km"].tolist(), [20.0, 150.0, 65.0]), f"결과: {out['km'].tolist()}"

@test("결측이 아닌 값은 바꾸지 않고, 원래 표는 그대로")
def _():
    df = pd.DataFrame({"brand": ["a", "b"], "km": [5.0, np.nan]})
    out = fill_by_group(df, "km", "brand", fit_group_medians(TR, "km", "brand"))
    assert out["km"].tolist() == [5.0, 150.0] and np.isnan(df["km"][1])
`,
      hints: [
        "`train.groupby(group_col)[value_col].median().to_dict()`가 그룹별 중앙값입니다.",
        "`df[group_col].map(params['by_group']).fillna(params['overall'])`로 행마다 채울 값을 만듭니다.",
        "`out[value_col] = out[value_col].fillna(채울 값)`처럼 결측인 자리만 채웁니다.",
      ],
      solution: py`
import numpy as np
import pandas as pd

def fit_group_medians(train, value_col, group_col):
    return {
        "by_group": {k: float(v) for k, v in train.groupby(group_col)[value_col].median().items()},
        "overall": float(train[value_col].median()),
    }

def fill_by_group(df, value_col, group_col, params):
    out = df.copy()
    fill = out[group_col].map(params["by_group"]).fillna(params["overall"])
    out[value_col] = out[value_col].fillna(fill)
    return out

train = pd.DataFrame({"brand": ["a", "a", "b", "b", "b"], "km": [10.0, 30.0, 100.0, np.nan, 200.0]})
test = pd.DataFrame({"brand": ["a", "b", "c"], "km": [np.nan, np.nan, np.nan]})
params = fit_group_medians(train, "km", "brand")
print(params)
print(fill_by_group(test, "km", "brand", params)["km"].tolist())
`,
    },
  ],
});
