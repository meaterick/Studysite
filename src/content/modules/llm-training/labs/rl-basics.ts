import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "점진적 평균과 벨만 방정식으로 Q값 배우기",
    prompt: md`

1. \`update_mean(est, n, r)\`: 지금까지 \`n\`번의 평균 \`est\`에 새 보상 \`r\`을 반영한 평균. 모든 보상을 저장하지 않고 $est + (r - est)/(n+1)$로 갱신합니다.
2. \`q_learning(n_states, gamma, lr, episodes, eps, seed)\`: 칸 0~(n−1) 복도에서 행동 0=왼쪽, 1=오른쪽. 오른쪽 끝에 닿으면 보상 1로 에피소드가 끝납니다. $\varepsilon$-탐욕으로 행동을 고르고(두 Q값이 같으면 무작위) $Q(s,a) \leftarrow Q(s,a) + \eta\,[r + \gamma \max_{a'} Q(s', a') - Q(s,a)]$로 갱신합니다(끝 상태의 미래 가치는 0). Q 테이블 (n_states, 2)를 돌려줍니다.

학습이 끝나면 오른쪽을 고를 때의 Q값이 $\gamma^{\text{남은 거리}-1}$과 같아야 합니다.
`,
    starter: py`
import numpy as np

def update_mean(est, n, r):
    return est  # TODO

def q_learning(n_states=5, gamma=0.9, lr=0.5, episodes=200, eps=0.3, seed=0):
    rng = np.random.default_rng(seed)
    Q = np.zeros((n_states, 2))
    for _ in range(episodes):
        s = 0
        while s != n_states - 1:
            explore = rng.random() < eps or Q[s, 0] == Q[s, 1]   # 동점이면 무작위로 고릅니다.
            a = int(rng.integers(2)) if explore else int(np.argmax(Q[s]))
            s2 = min(max(s + (1 if a == 1 else -1), 0), n_states - 1)
            r = 1.0 if s2 == n_states - 1 else 0.0
            # TODO: 벨만 목표값으로 Q[s, a]를 갱신합니다.
            s = s2
    return Q

print(update_mean(0.5, 2, 1.0))
print(np.round(q_learning()[:-1], 3))
`,
    tests: py`
import numpy as np

@test("점진적 평균 = 전체 평균")
def _():
    rs, est = [1, 0, 1, 1, 0, 1], 0.0
    for n, r in enumerate(rs):
        est = update_mean(est, n, r)
    assert approx(est, np.mean(rs)), f"결과: {est}"

@test("복도 5칸: 오른쪽 Q값 = [0.729, 0.81, 0.9, 1.0]")
def _():
    Q = q_learning()
    assert approx(Q[:-1, 1], [0.729, 0.81, 0.9, 1.0], 1e-3), f"결과: {np.round(Q[:-1, 1], 4)}"

@test("모든 칸에서 오른쪽(→)을 고른다")
def _():
    Q = q_learning(n_states=6, episodes=300)
    assert all(q[1] > q[0] for q in Q[:-1])

@test("γ = 0.5면 칸 0의 값이 0.125로 크게 할인된다")
def _():
    Q = q_learning(gamma=0.5, episodes=300)
    assert approx(Q[0, 1], 0.125, 1e-3), f"결과: {Q[0, 1]:.4f}"
`,
    hints: ["`est + (r - est) / (n + 1)`", "목표값은 `target = r + (0 if s2 == n_states - 1 else gamma * Q[s2].max())`", "`Q[s, a] += lr * (target - Q[s, a])`. 끝에서 받은 보상이 한 칸씩 $\\gamma$배로 할인되며 거꾸로 전파됩니다."],
    solution: py`
import numpy as np

def update_mean(est, n, r):
    return est + (r - est) / (n + 1)

def q_learning(n_states=5, gamma=0.9, lr=0.5, episodes=200, eps=0.3, seed=0):
    rng = np.random.default_rng(seed)
    Q = np.zeros((n_states, 2))
    for _ in range(episodes):
        s = 0
        while s != n_states - 1:
            explore = rng.random() < eps or Q[s, 0] == Q[s, 1]   # 동점이면 무작위로 고릅니다.
            a = int(rng.integers(2)) if explore else int(np.argmax(Q[s]))
            s2 = min(max(s + (1 if a == 1 else -1), 0), n_states - 1)
            r = 1.0 if s2 == n_states - 1 else 0.0
            target = r + (0 if s2 == n_states - 1 else gamma * Q[s2].max())
            Q[s, a] += lr * (target - Q[s, a])
            s = s2
    return Q

print(update_mean(0.5, 2, 1.0))
print(np.round(q_learning()[:-1], 3))
`,
  },
]);
