import assert from "node:assert/strict";
import { test } from "node:test";
import { CONCEPTS, CORE_PATH, MODULES, getLesson, getModule, prerequisitesOf } from "../../src/content/course";
import { learningField } from "../../src/content/fields";
import { CAPSTONE_PLAN, CAPSTONE_PLAN_HREF } from "../../src/content/curriculum/capstone-plan";
import { SCHEDULE } from "../../src/content/curriculum/schedule";
import { emptyRecord } from "../../src/lib/learningStore";
import { canOpenLesson, moduleStatus } from "../../src/lib/study";

function prerequisites(id: string) {
  const lesson = getLesson(id);
  assert.ok(lesson, `Missing lesson ${id}`);
  return prerequisitesOf(lesson).map((l) => l.id).sort();
}

test("explicit optional prerequisites replace the unrelated mod-wide fallback", () => {
  assert.deepEqual(prerequisites("mle-map"), ["bayes", "likelihood-entropy"]);
  assert.deepEqual(prerequisites("gd-convergence"), ["gradient-descent", "rank-eigen"]);
  assert.deepEqual(prerequisites("entropy-kl"), ["likelihood-entropy"]);
  assert.deepEqual(prerequisites("naive-bayes"), ["baselines", "bayes"]);
  assert.ok(prerequisites("model-evaluation-stats").includes("statistical-inference"));
  assert.ok(prerequisites("loss-likelihood").includes("likelihood-entropy"));
});

test("optional lessons without requires still use the mod core fallback", () => {
  const lesson = getLesson("cnn-architectures")!;
  assert.equal(lesson.requires, undefined);
  assert.deepEqual(prerequisites(lesson.id), getModule(lesson.module)!.lessons.filter((l) => l.tier === "core").map((l) => l.id).sort());
});

test("every extension lesson has explicit, nonempty preparation guidance", () => {
  for (const mod of MODULES.filter((m) => m.track === "extension")) {
    for (const lesson of mod.lessons) {
      assert.ok(lesson.requires?.length, lesson.id);
      assert.ok(prerequisitesOf(lesson).length, lesson.id);
    }
  }
});

test("resolved lesson prerequisites contain no missing references or cycles", () => {
  const visiting = new Set<string>();
  const done = new Set<string>();
  function visit(id: string) {
    if (done.has(id)) return;
    assert.ok(!visiting.has(id), `Prerequisite cycle at ${id}`);
    visiting.add(id);
    const lesson = getLesson(id)!;
    for (const required of lesson.requires ?? []) assert.ok(getLesson(required), `${id} -> ${required}`);
    for (const required of prerequisitesOf(lesson)) visit(required.id);
    visiting.delete(id);
    done.add(id);
  }
  for (const mod of MODULES) for (const lesson of mod.lessons) visit(lesson.id);
});

test("concept numbering follows prerequisites while keeping IDs and the core lesson order", () => {
  assert.equal(CONCEPTS.length, 80);
  assert.equal(CONCEPTS.find((c) => c.id === "functions-scope")!.order, 7);
  assert.equal(CONCEPTS.find((c) => c.id === "mutability-copy")!.order, 8);
  assert.ok(CORE_PATH.findIndex((l) => l.id === "functions-scope") < CORE_PATH.findIndex((l) => l.id === "mutability-copy"));
  for (const concept of CONCEPTS) {
    for (const id of concept.requires) assert.ok(CONCEPTS.find((c) => c.id === id)!.order < concept.order, `${concept.id} -> ${id}`);
  }
});

test("capstone preparation links outside locked lessons and matches milestone weeks", () => {
  const status = moduleStatus(getModule("capstone-project")!, emptyRecord(), "lock");
  assert.equal(canOpenLesson(status, "capstone-design", false), false);
  assert.equal(CAPSTONE_PLAN_HREF, "/curriculum/details#capstone-plan");
  for (const week of SCHEDULE.filter((w) => w.milestone)) {
    assert.equal(CAPSTONE_PLAN.find((step) => step.week === week.week)?.title, week.milestone);
  }
  assert.equal(CAPSTONE_PLAN.at(-1)?.week, 16);
});

test("fields and tracks share their displayed names", () => {
  for (const mod of MODULES) assert.equal(learningField(mod.track).title, mod.trackInfo.title);
});

test("assignment summaries describe self-checking instead of promising operator grades", () => {
  for (const mod of MODULES) {
    if (mod.assignment) assert.doesNotMatch(mod.assignment.summary, /점수 대신 피드백|채점 기준|항목들만 채점/, mod.slug);
  }
});
