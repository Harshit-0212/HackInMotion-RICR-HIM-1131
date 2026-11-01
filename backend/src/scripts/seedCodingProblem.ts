import { getDb, closeDb } from '../lib/db.js';
import { codingProblemStore, newProblemId, newTestCaseId } from '../lib/codingStore.js';
import { journeyStore, stageStore, activityStore, knowledgeQuestionStore, newActivityId } from '../lib/journeyStore.js';
import type { StoredCodingProblem } from '../types/coding.js';

async function seed() {
  await getDb();
  let shiftProblem = await codingProblemStore.findBySlug('shift-and-count');
  const now = new Date().toISOString();

  if (!shiftProblem) {
    const probId = newProblemId();
    const prob: StoredCodingProblem = {
      _id: probId,
      slug: 'shift-and-count',
      title: 'Shift and Count',
      difficulty: 'easy',
      topic: 'Arrays',
      tags: ['arrays', 'traversal', 'simulation'],
      statement: 'Given an array of integers and a shift amount k, decrement each number by k and print how many numbers are strictly positive (> 0).',
      inputFormat: 'First line has n and k. Second line has n space-separated integers.',
      outputFormat: 'Print the count of numbers that remain strictly positive.',
      constraints: '1 <= n <= 10^5, -10^9 <= a[i], k <= 10^9',
      supportedLanguages: ['c', 'cpp', 'java', 'python'],
      starterCodeByLanguage: {
        python: 'import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    if not data:\n        return\n    n, k = int(data[0]), int(data[1])\n    nums = [int(x) for x in data[2:2+n]]\n    res = sum(1 for x in nums if x - k > 0)\n    print(res)\n\nif __name__ == "__main__":\n    main()\n',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    int n; long long k;\n    if (!(cin >> n >> k)) return 0;\n    int ans = 0;\n    for (int i = 0; i < n; ++i) {\n        long long x; cin >> x;\n        if (x - k > 0) ans++;\n    }\n    cout << ans << endl;\n    return 0;\n}\n',
      },
      executionLimits: { timeLimitMs: 2000, memoryLimitMb: 256 },
      checkerPolicy: { type: 'exact', ignoreTrailingWhitespace: true, trimNewlines: true, caseSensitive: true },
      status: 'published',
      contentVersion: 1,
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
    };
    shiftProblem = await codingProblemStore.create(prob);

    await codingProblemStore.createTestCase({
      _id: newTestCaseId(),
      problemId: probId,
      caseKey: 'sample_1',
      visibility: 'sample',
      input: '4 2\n5 1 3 0\n',
      expectedOutput: '2',
      explanation: '5-2=3, 1-2=-1, 3-2=1, 0-2=-2. Exactly 2 positive elements.',
      order: 1,
      createdAt: now,
      updatedAt: now,
    });

    await codingProblemStore.createTestCase({
      _id: newTestCaseId(),
      problemId: probId,
      caseKey: 'hidden_1',
      visibility: 'hidden',
      input: '5 0\n-2 -1 0 1 2\n',
      expectedOutput: '2',
      order: 2,
      createdAt: now,
      updatedAt: now,
    });

    console.log('Created published problem shift-and-count.');
  } else {
    console.log('Problem shift-and-count exists:', shiftProblem._id);
  }

  // Check stage 3 and milestone stage, ensure coding task is configured in blueprints and activity
  const stage3 = await stageStore.findBySlug('arrays-counting-conditions');
  if (stage3) {
    const actId = newActivityId();
    const existingActs = await activityStore.listByStage(stage3._id, false);
    if (existingActs.length === 0) {
      await activityStore.create({
        _id: actId,
        stageId: stage3._id,
        journeyId: stage3.journeyId,
        title: 'Practice: ' + shiftProblem.title,
        type: 'coding_practice',
        isRequired: true,
        order: 1,
        status: 'published',
        codingProblemId: shiftProblem._id,
        createdAt: now,
        updatedAt: now,
      });
      await stageStore.update(stage3._id, {
        activityIds: [actId],
        checkpoint: {
          minKnowledgeQuestions: 2,
          minCodingTasks: 1,
          knowledgePassPercent: 75,
          codingPassCount: 1,
          knowledgeQuestionCount: 2,
          codingTaskCount: 1,
        },
      });
      console.log('Updated stage 3 with coding activity and blueprint minCodingTasks=1');
    }
  }

  // Update stage 4 activities if empty
  const stage4 = await stageStore.findBySlug('arrays-boundary-cases');
  if (stage4) {
    const existingActs = await activityStore.listByStage(stage4._id, false);
    if (existingActs.length === 0) {
      const actId = newActivityId();
      await activityStore.create({
        _id: actId,
        stageId: stage4._id,
        journeyId: stage4.journeyId,
        title: 'Defensive Array Guards & Edge Cases',
        type: 'lesson',
        isRequired: true,
        order: 1,
        status: 'published',
        lessonContent: {
          body: `<h3>Defensive Programming in Arrays</h3><p>Always inspect: 1. Null/empty collections. 2. Single element arrays. 3. Identical elements. 4. Monotonic boundary conditions.</p>`,
          hints: [{ step: 1, title: 'Check size first', content: 'Never access index 0 without verifying size > 0.' }],
        },
        createdAt: now,
        updatedAt: now,
      });
      await stageStore.update(stage4._id, { activityIds: [actId] });
      console.log('Added defensive guards lesson to stage 4');
    }
  }

  // Update milestone stage 5
  const stage5 = await stageStore.findBySlug('arrays-comprehensive-checkpoint');
  if (stage5) {
    const existingActs = await activityStore.listByStage(stage5._id, false);
    if (existingActs.length === 0) {
      const actId = newActivityId();
      await activityStore.create({
        _id: actId,
        stageId: stage5._id,
        journeyId: stage5.journeyId,
        title: 'Milestone Review: ' + shiftProblem.title,
        type: 'coding_practice',
        isRequired: true,
        order: 1,
        status: 'published',
        codingProblemId: shiftProblem._id,
        createdAt: now,
        updatedAt: now,
      });
      await stageStore.update(stage5._id, {
        activityIds: [actId],
        checkpoint: {
          minKnowledgeQuestions: 3,
          minCodingTasks: 1,
          knowledgePassPercent: 80,
          codingPassCount: 1,
          knowledgeQuestionCount: 3,
          codingTaskCount: 1,
        },
      });
      console.log('Updated stage 5 with coding practice and blueprint minCodingTasks=1');
    }
  }

  await closeDb();
  console.log('Seed sync complete.');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
