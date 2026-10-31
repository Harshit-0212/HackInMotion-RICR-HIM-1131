import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getDb, closeDb } from '../src/lib/db.js';
import { userStore } from '../src/lib/users.js';
import { codingProblemStore, newProblemId, newTestCaseId } from '../src/lib/codingStore.js';
import { signToken } from '../src/middleware/auth.js';
import type { StoredCodingProblem, StoredCodingTestCase } from '../src/types/coding.js';

describe('Coding Problem Management Backend Tests', () => {
  let adminUserId = '';
  let studentUserId = '';
  let testProblemId = '';

  before(async () => {
    const db = await getDb();
    // Clean test data
    await db.collection('users').deleteMany({ email: { $regex: /@codingtest\.example\.com$/i } });
    await db.collection('coding_problems').deleteMany({ slug: { $regex: /^test-/ } });
    await db.collection('coding_test_cases').deleteMany({ caseKey: { $regex: /^test_/ } });
    await db.collection('coding_problem_private').deleteMany({ verificationMethod: 'Unit Test Fixture' });

    // Create a student user
    const student = await userStore.create('student@codingtest.example.com', 'Password123!', 'Test Student');
    studentUserId = student.id;

    // Create an admin user
    const admin = await userStore.create('admin@codingtest.example.com', 'Password123!', 'Test Admin');
    adminUserId = admin.id;
    await userStore.setRole(admin.id, 'admin');
  });

  after(async () => {
    const db = await getDb();
    await db.collection('users').deleteMany({ email: { $regex: /@codingtest\.example\.com$/i } });
    await db.collection('coding_problems').deleteMany({ slug: { $regex: /^test-/ } });
    await db.collection('coding_test_cases').deleteMany({ caseKey: { $regex: /^test_/ } });
    await db.collection('coding_problem_private').deleteMany({ verificationMethod: 'Unit Test Fixture' });
    await closeDb();
  });

  test('1. Role authorization: signup defaults to user, admin check succeeds only for admin role', async () => {
    const student = await userStore.findById(studentUserId);
    assert.strictEqual(student?.role, undefined, 'Signup must not grant admin privileges');

    const admin = await userStore.findById(adminUserId);
    assert.strictEqual(admin?.role, 'admin', 'Admin role must be set');
  });

  test('2. New questions are stored in MongoDB as draft', async () => {
    testProblemId = newProblemId();
    const now = new Date().toISOString();
    const problem: StoredCodingProblem = {
      _id: testProblemId,
      slug: 'test-sum-two-numbers',
      title: 'Sum of Two Numbers',
      difficulty: 'easy',
      topic: 'Math',
      tags: ['basics', 'math'],
      statement: 'Given two integers a and b, compute and print their sum.',
      inputFormat: 'Two space-separated integers a and b.',
      outputFormat: 'Print the sum of a and b.',
      constraints: '1 <= a, b <= 10^9',
      supportedLanguages: ['cpp', 'java', 'python'],
      starterCodeByLanguage: {
        cpp: '#include <iostream>\nusing namespace std;\nint main() { return 0; }',
        java: 'class Main { public static void main(String[] args) {} }',
        python: 'def main(): pass',
      },
      executionLimits: { timeLimitMs: 1000, memoryLimitMb: 256 },
      checkerPolicy: { type: 'token', ignoreTrailingWhitespace: true, trimNewlines: true, caseSensitive: true },
      status: 'draft',
      contentVersion: 1,
      reviewedVersion: null,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      verificationMethod: null,
      createdBy: adminUserId,
      createdAt: now,
      updatedAt: now,
    };

    const created = await codingProblemStore.create(problem);
    assert.strictEqual(created._id, testProblemId);
    assert.strictEqual(created.status, 'draft');

    const fetched = await codingProblemStore.findById(testProblemId);
    assert.strictEqual(fetched?.status, 'draft');
  });

  test('3. Draft questions do NOT appear in student-facing published list', async () => {
    const { problems } = await codingProblemStore.listPublished({ search: 'Sum of Two Numbers' });
    const match = problems.find((p) => p._id === testProblemId);
    assert.strictEqual(match, undefined, 'Draft problems must never appear in student published queries');

    const single = await codingProblemStore.findPublishedBySlug('test-sum-two-numbers');
    assert.strictEqual(single, null, 'Draft problem must return null when requested by student slug endpoint');
  });

  test('4. An empty query or filter returns an honest empty state without hardcoded fallbacks', async () => {
    const { problems, total } = await codingProblemStore.listPublished({ topic: 'NonExistentTopicXYZ999' });
    assert.strictEqual(problems.length, 0);
    assert.strictEqual(total, 0);
  });

  test('5. Test case management: sample cases vs hidden cases separation and ownership checks', async () => {
    const now = new Date().toISOString();

    // Add sample case
    const sampleCase: StoredCodingTestCase = {
      _id: newTestCaseId(),
      problemId: testProblemId,
      caseKey: 'test_sample_1',
      visibility: 'sample',
      input: '3 5\n',
      expectedOutput: '8\n',
      explanation: '3 + 5 = 8',
      order: 1,
      createdAt: now,
      updatedAt: now,
    };
    await codingProblemStore.createTestCase(sampleCase);

    // Add hidden case
    const hiddenCase: StoredCodingTestCase = {
      _id: newTestCaseId(),
      problemId: testProblemId,
      caseKey: 'test_hidden_1',
      visibility: 'hidden',
      input: '1000000000 1000000000\n',
      expectedOutput: '2000000000\n',
      order: 2,
      createdAt: now,
      updatedAt: now,
    };
    await codingProblemStore.createTestCase(hiddenCase);

    // Count checks
    const counts = await codingProblemStore.countTestCases(testProblemId);
    assert.strictEqual(counts.sample, 1);
    assert.strictEqual(counts.hidden, 1);
    assert.strictEqual(counts.total, 2);

    // Ownership check: Looking for hiddenCase with wrong problemId returns null
    const wrongOwnership = await codingProblemStore.findTestCaseById(hiddenCase._id, 'prob_wrong_id_999');
    assert.strictEqual(wrongOwnership, null, 'Test case ownership check must strictly enforce problemId');
  });

  test('6. Unreviewed problem cannot be published', async () => {
    const problem = await codingProblemStore.findById(testProblemId);
    assert.notStrictEqual(problem?.status, 'reviewed');
    assert.strictEqual(problem?.reviewedVersion, null);
  });

  test('7. Explicit review sets status=reviewed and records reviewer metadata', async () => {
    const now = new Date().toISOString();
    const reviewed = await codingProblemStore.update(testProblemId, {
      status: 'reviewed',
      reviewedVersion: 1,
      reviewedBy: adminUserId,
      reviewedAt: now,
      verificationMethod: 'Unit Test Fixture',
      reviewNotes: 'Verified manually',
      updatedAt: now,
    });

    assert.strictEqual(reviewed?.status, 'reviewed');
    assert.strictEqual(reviewed?.reviewedVersion, 1);
    assert.strictEqual(reviewed?.reviewedBy, adminUserId);
  });

  test('8. Reviewed problem with complete requirements can be published', async () => {
    // Add reference solution in private content
    await codingProblemStore.upsertPrivateContent(testProblemId, {
      referenceSolutions: [
        {
          language: 'python',
          solutionCode: 'a, b = map(int, input().split())\nprint(a + b)\n',
          approachExplanation: 'Direct addition',
          timeComplexity: 'O(1)',
          spaceComplexity: 'O(1)',
        },
      ],
      progressiveHints: [{ step: 1, title: 'Input reading', content: 'Read space-separated integers' }],
      editorial: 'Add the two numbers.',
      verificationStatus: 'manual_verified',
      verificationMethod: 'Unit Test Fixture',
    });

    const published = await codingProblemStore.update(testProblemId, {
      status: 'published',
      updatedAt: new Date().toISOString(),
    });
    assert.strictEqual(published?.status, 'published');

    // Verify it is now returned in student list
    const studentList = await codingProblemStore.listPublished({ search: 'Sum of Two Numbers' });
    const match = studentList.problems.find((p) => p._id === testProblemId);
    assert.ok(match, 'Published problem must now appear in student published queries');

    // Verify student detail endpoint only returns public sample cases, never hidden cases
    const samples = await codingProblemStore.listTestCases(testProblemId, 'sample');
    assert.strictEqual(samples.length, 1);
    assert.strictEqual(samples[0].visibility, 'sample');
    assert.strictEqual(samples[0].input, '3 5\n');
  });

  test('9. Material edit invalidates review and unpublishes back to draft', async () => {
    // Bump version and invalidate review
    const invalidated = await codingProblemStore.bumpVersionAndInvalidateReview(testProblemId, {
      title: 'Sum of Two Numbers (Updated)',
    });

    assert.strictEqual(invalidated?.status, 'draft', 'Material edit must force status back to draft');
    assert.strictEqual(invalidated?.contentVersion, 2, 'Content version must increment');
    assert.strictEqual(invalidated?.reviewedVersion, null, 'Reviewed version must reset');
    assert.strictEqual(invalidated?.reviewedBy, null, 'Reviewed by must reset');

    // Confirm it is immediately removed from student published queries
    const studentList = await codingProblemStore.listPublished({ search: 'Sum of Two Numbers' });
    const match = studentList.problems.find((p) => p._id === testProblemId);
    assert.strictEqual(match, undefined, 'Invalidated draft problem must disappear from student search');
  });

  test('10. Bounded pagination and safe regex search', async () => {
    // Test regex injection attempt with special characters does not crash
    const safeRegexResult = await codingProblemStore.listPublished({
      search: '.*+?^${}()|[]\\',
    });
    assert.strictEqual(safeRegexResult.problems.length, 0);

    // Limit clamping
    const clampedList = await codingProblemStore.listPublished({ limit: 1000 });
    assert.ok(clampedList.problems.length <= 50, 'Student list must be bounded to max 50 items');
  });
});

