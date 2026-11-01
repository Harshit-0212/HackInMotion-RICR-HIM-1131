/**
 * seedArraysJourney.ts — Seed the initial "Arrays Fundamentals" curriculum slice.
 *
 * Slices modeled:
 * 1. Accessing elements & traversal
 * 2. Comparing adjacent elements
 * 3. Counting with conditions (reuses/links Shift & Count problem)
 * 4. Boundary cases
 * 5. Arrays Checkpoint Milestone
 *
 * Idempotent: checks for existing slug before inserting.
 */
import { journeyStore, stageStore, activityStore, knowledgeQuestionStore, newJourneyId, newStageId, newActivityId, newKnowledgeQuestionId } from '../lib/journeyStore.js';
import { codingProblemStore } from '../lib/codingStore.js';

export async function seedArraysJourneyIfMissing(): Promise<void> {
  const existing = await journeyStore.findBySlug('arrays-fundamentals');
  if (existing) {
    console.log('[journey-seed] Arrays Fundamentals journey already exists.');
    return;
  }

  console.log('[journey-seed] Seeding Arrays Fundamentals journey slice...');
  const now = new Date().toISOString();
  const journeyId = newJourneyId();

  // Find or verify existing coding problem to reuse
  let shiftCountProblem = await codingProblemStore.findBySlug('shift-and-count');
  if (!shiftCountProblem) {
    const list = await codingProblemStore.listPublished({ limit: 1 });
    if (list.problems.length > 0) {
      shiftCountProblem = list.problems[0];
    }
  }

  // Define 5 stages
  const stage1Id = newStageId();
  const stage2Id = newStageId();
  const stage3Id = newStageId();
  const stage4Id = newStageId();
  const milestoneStageId = newStageId();

  const stagesData = [
    {
      id: stage1Id,
      slug: 'arrays-access-traversal',
      title: 'Accessing Elements & Traversal',
      learningGoal: 'Master 0-indexed memory offsets, sequential iteration, and standard loop idioms.',
      type: 'topic' as const,
      prerequisites: [],
      topicTags: ['indexing', 'traversal', 'loops', 'time-complexity'],
      blueprint: {
        minKnowledgeQuestions: 2,
        minCodingTasks: 0,
        knowledgePassPercent: 70,
        codingPassCount: 0,
        knowledgeQuestionCount: 2,
        codingTaskCount: 0,
      },
    },
    {
      id: stage2Id,
      slug: 'arrays-adjacent-elements',
      title: 'Comparing Adjacent Elements',
      learningGoal: 'Learn two-element windows, monotonic checks, and lookahead boundary protection.',
      type: 'pattern' as const,
      prerequisites: [stage1Id],
      topicTags: ['two-pointer', 'sliding-window', 'lookahead', 'bounds'],
      blueprint: {
        minKnowledgeQuestions: 2,
        minCodingTasks: 0,
        knowledgePassPercent: 70,
        codingPassCount: 0,
        knowledgeQuestionCount: 2,
        codingTaskCount: 0,
      },
    },
    {
      id: stage3Id,
      slug: 'arrays-counting-conditions',
      title: 'Counting with Conditions',
      learningGoal: 'Accumulate counts and filter frequencies using predicates and state trackers.',
      type: 'pattern' as const,
      prerequisites: [stage2Id],
      topicTags: ['predicates', 'filtering', 'frequency-tracking'],
      blueprint: {
        minKnowledgeQuestions: 2,
        minCodingTasks: shiftCountProblem ? 1 : 0,
        knowledgePassPercent: 75,
        codingPassCount: shiftCountProblem ? 1 : 0,
        knowledgeQuestionCount: 2,
        codingTaskCount: shiftCountProblem ? 1 : 0,
      },
    },
    {
      id: stage4Id,
      slug: 'arrays-boundary-cases',
      title: 'Boundary Cases & Empty States',
      learningGoal: 'Guard against off-by-one errors, singletons, capacity overflows, and empty arrays.',
      type: 'pattern' as const,
      prerequisites: [stage3Id],
      topicTags: ['edge-cases', 'off-by-one', 'defensive-programming'],
      blueprint: {
        minKnowledgeQuestions: 2,
        minCodingTasks: 0,
        knowledgePassPercent: 80,
        codingPassCount: 0,
        knowledgeQuestionCount: 2,
        codingTaskCount: 0,
      },
    },
    {
      id: milestoneStageId,
      slug: 'arrays-comprehensive-checkpoint',
      title: 'Arrays Core Checkpoint',
      learningGoal: 'Comprehensive milestone assessing memory model, boundary handling, and algorithmic patterns.',
      type: 'milestone' as const,
      prerequisites: [stage4Id],
      topicTags: ['arrays', 'milestone', 'comprehensive'],
      blueprint: {
        minKnowledgeQuestions: 3,
        minCodingTasks: shiftCountProblem ? 1 : 0,
        knowledgePassPercent: 80,
        codingPassCount: shiftCountProblem ? 1 : 0,
        knowledgeQuestionCount: 3,
        codingTaskCount: shiftCountProblem ? 1 : 0,
      },
    },
  ];

  for (const s of stagesData) {
    await stageStore.create({
      _id: s.id,
      journeyId,
      slug: s.slug,
      title: s.title,
      learningGoal: s.learningGoal,
      type: s.type,
      prerequisiteStageIds: s.prerequisites,
      activityIds: [],
      topicTags: s.topicTags,
      checkpoint: s.blueprint,
      previewUnlocked: false,
      status: 'published',
      contentVersion: 1,
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create Activities
  // Stage 1: Lesson + Predict Output Comprehension
  const act1Id = newActivityId();
  await activityStore.create({
    _id: act1Id,
    stageId: stage1Id,
    journeyId,
    title: 'Anatomy of an Array in Memory',
    type: 'lesson',
    isRequired: true,
    order: 1,
    status: 'published',
    lessonContent: {
      body: `<h3>How Arrays Work Under the Hood</h3>
<p>An array stores elements in <strong>contiguous memory blocks</strong>. Because each element has a fixed size, the CPU can locate any index in $O(1)$ time using basic pointer arithmetic:</p>
<pre><code>address(A[i]) = base_address + (i * element_size)</code></pre>
<h4>Key Properties:</h4>
<ul>
  <li><strong>Instant random access:</strong> Reading or writing an index is instant ($O(1)$).</li>
  <li><strong>Linear scans:</strong> Searching for a value requires checking items sequentially ($O(N)$).</li>
  <li><strong>Cache efficiency:</strong> Contiguous allocation maximizes CPU cache line hits.</li>
</ul>`,
      hints: [
        { step: 1, title: 'Think about memory', content: 'Continuous memory means no extra lookups are needed to reach index i.' },
        { step: 2, title: 'Boundaries', content: 'Index 0 is the base offset; index N-1 is the final valid slot.' },
      ],
    },
    createdAt: now,
    updatedAt: now,
  });

  const act2Id = newActivityId();
  await activityStore.create({
    _id: act2Id,
    stageId: stage1Id,
    journeyId,
    title: 'Predict Output: Indexing & Mutability',
    type: 'comprehension_predict',
    isRequired: true,
    order: 2,
    status: 'published',
    comprehensionContent: {
      language: 'cpp',
      codeSnippet: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {10, 20, 30, 40};
    nums[1] += nums[3];
    nums[3] = nums[0];
    std::cout << nums[1] << " " << nums[3] << std::endl;
    return 0;
}`,
      prompt: 'What will be printed to stdout? Enter two numbers separated by a single space.',
      reviewedAnswer: '60 10',
      expectedOutput: '60 10',
      explanation: 'nums[1] initially is 20. nums[1] += nums[3] (40) results in 60. Then nums[3] becomes nums[0] (10). Thus, 60 10 is printed.',
      relevance: 'Predicting state changes without running the code ensures you correctly model in-place mutations.',
    },
    createdAt: now,
    updatedAt: now,
  });

  // Stage 2: Lesson + Find Bug Comprehension
  const act3Id = newActivityId();
  await activityStore.create({
    _id: act3Id,
    stageId: stage2Id,
    journeyId,
    title: 'Pairwise Comparisons and Bounds',
    type: 'lesson',
    isRequired: true,
    order: 1,
    status: 'published',
    lessonContent: {
      body: `<h3>The Lookahead Pattern</h3>
<p>When comparing adjacent elements, such as checking if an array is sorted, loops typically inspect <code>arr[i]</code> and <code>arr[i+1]</code>.</p>
<p><strong>Common Pitfall:</strong> If loop condition is <code>i &lt; arr.length</code>, inspecting <code>i+1</code> causes an out-of-bounds index on the final iteration.</p>`,
      hints: [{ step: 1, title: 'Loop bounds', content: 'Loop until length - 1 when inspecting i + 1.' }],
    },
    createdAt: now,
    updatedAt: now,
  });

  const act4Id = newActivityId();
  await activityStore.create({
    _id: act4Id,
    stageId: stage2Id,
    journeyId,
    title: 'Find the Bug: Boundary Access',
    type: 'comprehension_find_bug',
    isRequired: true,
    order: 2,
    status: 'published',
    comprehensionContent: {
      language: 'python',
      codeSnippet: `def is_sorted(arr):
    for i in range(len(arr)):
        if arr[i] > arr[i + 1]:
            return False
    return True`,
      prompt: 'What causes this function to crash for non-empty arrays?',
      reviewedAnswer: 'IndexError: arr[i + 1] exceeds array bounds when i reaches len(arr) - 1',
      explanation: 'range(len(arr)) reaches len(arr)-1. At that point, arr[i + 1] attempts to read index len(arr), throwing an IndexError.',
      relevance: 'Boundary mistakes in adjacent checks are the number one cause of production index crashes.',
    },
    createdAt: now,
    updatedAt: now,
  });

  // Stage 3: Coding Practice Activity
  if (shiftCountProblem) {
    const act5Id = newActivityId();
    await activityStore.create({
      _id: act5Id,
      stageId: stage3Id,
      journeyId,
      title: 'Practice: ' + shiftCountProblem.title,
      type: 'coding_practice',
      isRequired: true,
      order: 1,
      status: 'published',
      codingProblemId: shiftCountProblem._id,
      createdAt: now,
      updatedAt: now,
    });
    await stageStore.update(stage3Id, { activityIds: [act5Id] });
  }

  // Update activity lists on stages
  await stageStore.update(stage1Id, { activityIds: [act1Id, act2Id] });
  await stageStore.update(stage2Id, { activityIds: [act3Id, act4Id] });

  // Seed Knowledge Questions for Checkpoints
  const questions = [
    // Stage 1
    {
      stageId: stage1Id,
      prompt: 'What is the time complexity of reading an element at index i in a contiguous memory array?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'O(1) constant time' },
        { id: 'opt_b', text: 'O(log N) logarithmic time' },
        { id: 'opt_c', text: 'O(N) linear time' },
        { id: 'opt_d', text: 'O(i) proportional to index' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'Array access uses simple arithmetic (base + i * size) to reach the offset in a single memory operation.',
      difficulty: 'easy' as const,
      conceptTags: ['indexing', 'time-complexity'],
    },
    {
      stageId: stage1Id,
      prompt: 'An array has length 5. What are the lowest and highest valid index numbers in 0-indexed languages?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: '1 and 5' },
        { id: 'opt_b', text: '0 and 4' },
        { id: 'opt_c', text: '0 and 5' },
        { id: 'opt_d', text: '-1 and 4' },
      ],
      correctOptionId: 'opt_b',
      explanation: 'In 0-indexed systems, an array of size N starts at index 0 and terminates at N - 1 (here 4).',
      difficulty: 'easy' as const,
      conceptTags: ['indexing', 'bounds'],
    },
    // Stage 2
    {
      stageId: stage2Id,
      prompt: 'When looping over an array of length N comparing arr[i] with arr[i+1], what should the upper loop boundary be?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'i < N' },
        { id: 'opt_b', text: 'i < N - 1' },
        { id: 'opt_c', text: 'i <= N' },
        { id: 'opt_d', text: 'i < N + 1' },
      ],
      correctOptionId: 'opt_b',
      explanation: 'Stopping at i < N - 1 ensures i+1 will at most reach N - 1, preventing out-of-bounds memory access.',
      difficulty: 'medium' as const,
      conceptTags: ['bounds', 'lookahead'],
    },
    {
      stageId: stage2Id,
      prompt: 'True or False: Comparing arr[i] and arr[i-1] starting the loop at index 1 is mathematically equivalent to comparing arr[i] and arr[i+1] stopping at N-2.',
      type: 'true_false' as const,
      options: [
        { id: 'opt_a', text: 'True' },
        { id: 'opt_b', text: 'False' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'Both lookahead from [0..N-2] and lookbehind from [1..N-1] inspect identical pairs in the same sequence.',
      difficulty: 'easy' as const,
      conceptTags: ['lookahead', 'two-pointer'],
    },
    // Stage 3
    {
      stageId: stage3Id,
      prompt: 'Which data structure allows counting frequency of arbitrary integer values in an array in O(N) overall time?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'Hash map / frequency table' },
        { id: 'opt_b', text: 'Binary Search Tree' },
        { id: 'opt_c', text: 'Linked List' },
        { id: 'opt_d', text: 'Stack' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'Hash maps provide average O(1) insert and update, aggregating N elements in O(N) total time.',
      difficulty: 'medium' as const,
      conceptTags: ['frequency-tracking', 'predicates'],
    },
    {
      stageId: stage3Id,
      prompt: 'If you only need to count elements satisfying a predicate without storing counts, what is the optimal auxiliary space complexity?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'O(1) constant auxiliary space' },
        { id: 'opt_b', text: 'O(N) linear space' },
        { id: 'opt_c', text: 'O(log N) space' },
        { id: 'opt_d', text: 'O(N^2) quadratic space' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'A single scalar counter variable incremented whenever the condition matches uses O(1) extra space.',
      difficulty: 'easy' as const,
      conceptTags: ['space-complexity', 'predicates'],
    },
    // Stage 4
    {
      stageId: stage4Id,
      prompt: 'What should a well-designed function checking if an array is sorted return when passed an array with 0 or 1 elements?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'True (vacuously sorted)' },
        { id: 'opt_b', text: 'False' },
        { id: 'opt_c', text: 'Raise an exception' },
        { id: 'opt_d', text: 'Null / Undefined' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'Arrays of length 0 or 1 have no inverted pairs and are considered vacuously sorted by definition.',
      difficulty: 'medium' as const,
      conceptTags: ['edge-cases', 'defensive-programming'],
    },
    {
      stageId: stage4Id,
      prompt: 'Which edge case is most commonly overlooked when implementing array two-pointer algorithms?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'Array containing all duplicate values' },
        { id: 'opt_b', text: 'Array with prime numbers' },
        { id: 'opt_c', text: 'Array with even length' },
        { id: 'opt_d', text: 'Floating point values' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'All-duplicate arrays can cause infinite loops or skipped comparisons if pointer increments rely on strict inequality.',
      difficulty: 'medium' as const,
      conceptTags: ['edge-cases', 'off-by-one'],
    },
    // Milestone Stage
    {
      stageId: milestoneStageId,
      prompt: 'Suppose an array of length N is rotated to the right by K positions. If K == N, how does the resulting array compare to the original?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'It is identical to the original array' },
        { id: 'opt_b', text: 'It is reversed' },
        { id: 'opt_c', text: 'It is emptied' },
        { id: 'opt_d', text: 'First and last elements are swapped' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'Rotating by N positions returns each element back to its original slot since (i + N) % N == i.',
      difficulty: 'medium' as const,
      conceptTags: ['arrays', 'milestone', 'indexing'],
    },
    {
      stageId: milestoneStageId,
      prompt: 'In place array operations aim for which auxiliary space complexity?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'O(1) extra space' },
        { id: 'opt_b', text: 'O(N) extra space' },
        { id: 'opt_c', text: 'O(N log N) space' },
        { id: 'opt_d', text: 'O(2^N) space' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'In-place algorithms modify the existing memory buffer directly, utilizing at most O(1) auxiliary variables.',
      difficulty: 'easy' as const,
      conceptTags: ['space-complexity', 'milestone'],
    },
    {
      stageId: milestoneStageId,
      prompt: 'Why are CPU cache misses much less frequent during sequential array traversal than linked list traversal?',
      type: 'mcq' as const,
      options: [
        { id: 'opt_a', text: 'Spatial locality from contiguous memory' },
        { id: 'opt_b', text: 'Arrays use 64-bit pointers' },
        { id: 'opt_c', text: 'Linked lists have slower garbage collection' },
        { id: 'opt_d', text: 'CPUs can only cache primitives' },
      ],
      correctOptionId: 'opt_a',
      explanation: 'Contiguous memory ensures when one element is read, neighboring elements are automatically loaded into the CPU cache line.',
      difficulty: 'hard' as const,
      conceptTags: ['memory-model', 'milestone'],
    },
  ];

  for (const q of questions) {
    await knowledgeQuestionStore.create({
      _id: newKnowledgeQuestionId(),
      stageId: q.stageId,
      journeyId,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      difficulty: q.difficulty,
      conceptTags: q.conceptTags,
      status: 'approved',
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create Journey document
  await journeyStore.create({
    _id: journeyId,
    slug: 'arrays-fundamentals',
    title: 'Arrays Fundamentals & Algorithmic Patterns',
    description: 'A mastery-based curriculum covering sequential traversal, pairwise comparisons, conditional counting, and defensive boundary guarantees.',
    stageIds: [stage1Id, stage2Id, stage3Id, stage4Id, milestoneStageId],
    milestoneStageIds: [milestoneStageId],
    status: 'published',
    contentVersion: 1,
    createdBy: 'system',
    createdAt: now,
    updatedAt: now,
  });

  console.log('[journey-seed] Arrays Fundamentals journey seeded successfully.');
}

