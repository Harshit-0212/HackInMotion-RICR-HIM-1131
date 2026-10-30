import type { SupportedDebuggerLanguage } from '@/types/debugger';

export interface CodeExample {
  title: string;
  language: SupportedDebuggerLanguage;
  description: string;
  code: string;
}

export const DEBUGGER_EXAMPLES: Record<SupportedDebuggerLanguage, CodeExample[]> = {
  cpp: [
    {
      title: 'Array Out-of-Bounds Loop',
      language: 'cpp',
      description: 'Loop condition traverses one element beyond array boundary causing undefined behavior.',
      code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {10, 20, 30, 40, 50};
    int n = nums.size();
    int sum = 0;

    // Bug: loop condition <= n instead of < n
    for (int i = 0; i <= n; i++) {
        sum += nums[i];
        std::cout << "Step i=" << i << ", sum=" << sum << std::endl;
    }

    std::cout << "Total Sum: " << sum << std::endl;
    return 0;
}`,
    },
    {
      title: 'Missing Base Case Recursion',
      language: 'cpp',
      description: 'Recursion with faulty termination condition causing stack overflow.',
      code: `#include <iostream>

int factorial(int n) {
    // Bug: no handling for n <= 1
    if (n == 0) return 1;
    return n * factorial(n - 1);
}

int main() {
    int res = factorial(4);
    std::cout << "Factorial: " << res << std::endl;
    return 0;
}`,
    },
  ],
  python: [
    {
      title: 'Recursive Factorial & Stack Trace',
      language: 'python',
      description: 'Recursive calculation tracing function calls and call stack frames.',
      code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

number = 4
result = factorial(number)
print(f"Factorial of {number} is {result}")`,
    },
    {
      title: 'Off-by-One Array Index & Average',
      language: 'python',
      description: 'Calculating running average with an out-of-range indexing mistake.',
      code: `def calculate_average(scores):
    total = 0
    # Bug: range(1, len(scores) + 1) causes IndexError on scores[i]
    for i in range(len(scores) + 1):
        total += scores[i]
    return total / len(scores)

test_scores = [85, 92, 78, 90]
avg = calculate_average(test_scores)
print("Average score:", avg)`,
    },
  ],
  javascript: [
    {
      title: 'Array Mutation in Filter Loop',
      language: 'javascript',
      description: 'Modifying array length during iteration skipping elements.',
      code: `function filterEvens(arr) {
  let evens = [];
  for (let i = 0; i <= arr.length; i++) {
    // Bug: <= causes arr[i] to be undefined on last iteration
    if (arr[i] % 2 === 0) {
      evens.push(arr[i]);
    }
  }
  return evens;
}

const numbers = [1, 2, 3, 4, 5, 6];
const result = filterEvens(numbers);
console.log("Evens:", result);`,
    },
    {
      title: 'Fibonacci Sequence Generator',
      language: 'javascript',
      description: 'Dynamic generation of Fibonacci numbers with iteration inspection.',
      code: `function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    const nextVal = seq[i - 1] + seq[i - 2];
    seq.push(nextVal);
  }
  return seq;
}

const terms = 6;
const fib = fibonacci(terms);
console.log("Fibonacci:", fib);`,
    },
  ],
  java: [
    {
      title: 'Null Pointer & Array Sum',
      language: 'java',
      description: 'Iterating through an array that contains uninitialized reference.',
      code: `public class Main {
    public static void main(String[] args) {
        int[] numbers = {5, 12, 19, 26};
        int sum = 0;

        // Bug: i <= numbers.length causes ArrayIndexOutOfBoundsException
        for (int i = 0; i <= numbers.length; i++) {
            sum += numbers[i];
            System.out.println("Current sum: " + sum);
        }

        System.out.println("Final sum: " + sum);
    }
}`,
    },
  ],
  c: [
    {
      title: 'String Null-Terminator Bug',
      language: 'c',
      description: 'Copying characters without leaving space for string null-terminator.',
      code: `#include <stdio.h>
#include <string.h>

int main() {
    int arr[] = {3, 7, 2, 9, 5};
    int n = 5;
    int maxVal = arr[0];

    // Bug: loop condition goes to index n
    for (int i = 0; i <= n; i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i];
        }
    }

    printf("Max value: %d\\n", maxVal);
    return 0;
}`,
    },
  ],
};

