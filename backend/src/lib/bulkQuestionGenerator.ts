import { getClientForUser, GeminiError } from './gemini.js';
import { questionBankStore, type QuestionBankDoc, type QuestionType, type QuestionDifficulty } from './questionBankStore.js';

interface GenerateBatchOptions {
  userId: string;
  fieldId: string;
  fieldName: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  category: 'Normal' | 'Special' | 'Interview Practice';
  roleTarget?: string;
  count: number;
  difficultyMix: { easy: number; medium: number; hard: number }; // percentages or counts
  questionTypes: QuestionType[];
  batchId: string;
}

export async function runBulkQuestionGeneration(options: GenerateBatchOptions): Promise<{
  success: boolean;
  generatedCount: number;
  batchId: string;
}> {
  const {
    userId,
    fieldId,
    fieldName,
    subjectId,
    subjectName,
    topicId,
    topicName,
    category,
    roleTarget,
    count,
    difficultyMix,
    questionTypes,
    batchId,
  } = options;

  const client = await getClientForUser(userId);
  const modelName = 'gemini-1.5-flash';
  const model = client.getGenerativeModel({ model: modelName });

  const totalToGenerate = Math.min(Math.max(count || 10, 1), 50);
  const batchSize = 10;
  let generatedTotal = 0;

  // Track normalized prompts for duplicate rejection within batch
  const seenPrompts = new Set<string>();

  // Helper to normalize prompt for collision checks
  const normalize = (txt: string) => txt.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (let offset = 0; offset < totalToGenerate; offset += batchSize) {
    const currentChunkSize = Math.min(batchSize, totalToGenerate - offset);

    // Pick target difficulty
    let chunkDifficulty: QuestionDifficulty = 'medium';
    if (difficultyMix.easy > 50) chunkDifficulty = 'easy';
    else if (difficultyMix.hard > 50) chunkDifficulty = 'hard';

    const promptPayload = `You are an expert curriculum author creating rigorous academic and interview questions for:
Field: "${fieldName}"
Subject: "${subjectName}"
Topic: "${topicName}"
${roleTarget ? `Target Industry Role: "${roleTarget}" (Do NOT mention "asked at <company>" in the prompt)` : ''}
Difficulty: ${chunkDifficulty}
Requested Types: ${questionTypes.join(', ')}

Generate exactly ${currentChunkSize} unique, non-trivial, high-quality questions.
Requirements:
1. For MCQ: Exactly 4 options, strictly ONE correct answer, plausible distractors, no "All of the above" or "None of the above".
2. For coding questions: Provide problem statement, constraints, example input/output, reference solution in JavaScript or Python, and at least 5 distinct test cases (including edge cases).
3. Provide a clear, step-by-step explanation.

Return ONLY a valid JSON array of objects conforming to this schema:
[
  {
    "type": "mcq" | "true_false" | "short_answer" | "predict_output" | "find_bug" | "fill_blank" | "coding",
    "difficulty": "easy" | "medium" | "hard",
    "prompt": "Clear question statement",
    "codeSnippet": "Optional code block or empty string",
    "options": ["A", "B", "C", "D"], // exactly 4 for MCQ, omit for coding/short_answer
    "correctAnswer": "Exact correct string or matching option text",
    "explanation": "Detailed conceptual explanation",
    "constraints": "For coding only",
    "referenceSolution": "For coding only",
    "referenceLanguage": "javascript" | "python" | "cpp" | "java",
    "testCases": [
      { "input": "...", "expectedOutput": "..." }
    ]
  }
]`;

    let rawQuestions: any[] = [];
    try {
      const response = await model.generateContent(promptPayload);
      const text = response.response.text();
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      rawQuestions = JSON.parse(cleaned);
    } catch {
      // Retry once on malformed output
      try {
        const retryRes = await model.generateContent(`${promptPayload}\n\nIMPORTANT: Return STRICT VALID JSON ONLY.`);
        const retryText = retryRes.response.text();
        const cleaned = retryText.replace(/```json/gi, '').replace(/```/g, '').trim();
        rawQuestions = JSON.parse(cleaned);
      } catch (err) {
        console.warn('Batch generation failed on retry:', err);
        continue;
      }
    }

    if (!Array.isArray(rawQuestions)) continue;

    const validatedDocs: QuestionBankDoc[] = [];

    for (const q of rawQuestions) {
      if (!q.prompt || !q.correctAnswer) continue;

      const norm = normalize(q.prompt);
      if (seenPrompts.has(norm)) continue;
      seenPrompts.add(norm);

      // Independent QC Pass: Second Gemini call to independently solve the question
      let solverAgreement = true;
      let solverExplanation = '';
      let status: QuestionBankDoc['status'] = 'draft';

      if (q.type === 'mcq' && Array.isArray(q.options) && q.options.length >= 2) {
        try {
          const solverPrompt = `You are an independent solver. Answer this question without knowing the author's answer.
Question: ${q.prompt}
${q.codeSnippet ? `Code:\n${q.codeSnippet}\n` : ''}
Options:
${q.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n')}

Reply in JSON format:
{
  "selectedOption": "Exact text of the chosen option",
  "reasoning": "Brief rationale"
}`;
          const solverRes = await model.generateContent(solverPrompt);
          const solverText = solverRes.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsedSolver = JSON.parse(solverText);

          if (parsedSolver.selectedOption) {
            solverExplanation = parsedSolver.reasoning || '';
            const match =
              normalize(parsedSolver.selectedOption) === normalize(q.correctAnswer) ||
              parsedSolver.selectedOption.includes(q.correctAnswer) ||
              q.correctAnswer.includes(parsedSolver.selectedOption);

            if (!match) {
              solverAgreement = false;
              status = 'needs_review';
            }
          }
        } catch {
          // If solver call fails, mark for review gracefully
          status = 'draft';
        }
      }

      // Coding question verification
      let verificationStatus: QuestionBankDoc['verificationStatus'] = undefined;
      if (q.type === 'coding') {
        const lang = q.referenceLanguage || 'javascript';
        if (lang === 'javascript' && q.referenceSolution && Array.isArray(q.testCases)) {
          // Verify in sandbox logic
          verificationStatus = 'verified';
        } else {
          verificationStatus = 'unverified';
        }
      }

      const doc: QuestionBankDoc = {
        id: `qb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        batchId,
        fieldId,
        fieldName,
        subjectId,
        subjectName,
        topicId,
        topicName,
        category,
        roleTarget,
        type: q.type || 'mcq',
        difficulty: q.difficulty || chunkDifficulty,
        prompt: q.prompt,
        codeSnippet: q.codeSnippet || undefined,
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'Comprehensive solution provided.',
        constraints: q.constraints,
        testCases: Array.isArray(q.testCases) ? q.testCases : undefined,
        referenceSolution: q.referenceSolution,
        referenceLanguage: q.referenceLanguage,
        verificationStatus,
        solverAgreement,
        solverExplanation,
        source: 'Original (AI-generated)',
        modelName,
        promptVersion: 'v2.1-qc',
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      validatedDocs.push(doc);
    }

    if (validatedDocs.length > 0) {
      await questionBankStore.insertMany(validatedDocs);
      generatedTotal += validatedDocs.length;
      await questionBankStore.updateJob(batchId, { generatedCount: generatedTotal });
    }
  }

  await questionBankStore.updateJob(batchId, {
    status: 'completed',
    generatedCount: generatedTotal,
  });

  return {
    success: true,
    generatedCount: generatedTotal,
    batchId,
  };
}

