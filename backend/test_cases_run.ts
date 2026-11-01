import { executeCodeSync } from './src/lib/codeExecution.js';

async function runUITests() {
  console.log('--- EXECUTING SPECIFIED WORKSPACE UI TESTS ---');

  // Test 1: Java Hello World
  console.log('\n[Test 1] Java Hello World:');
  const t1 = await executeCodeSync({
    language: 'java',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.print("Hello World !");
    }
}`,
    input: '',
  });
  console.log('Result 1:', JSON.stringify(t1, null, 2));

  // Test 2: stdin sum test: 2 3 -> 5
  console.log('\n[Test 2] stdin sum test (2 3 -> 5):');
  const t2 = await executeCodeSync({
    language: 'java',
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            System.out.println(a + b);
        }
    }
}`,
    input: '2 3',
  });
  console.log('Result 2:', JSON.stringify(t2, null, 2));

  // Test 3: Intentional compilation error
  console.log('\n[Test 3] Intentional compilation error:');
  const t3 = await executeCodeSync({
    language: 'java',
    code: `public class Main {
    public static void main(String[] args) {
        SYNTAX_ERROR_HERE;;;
    }
}`,
    input: '',
  });
  console.log('Result 3:', JSON.stringify(t3, null, 2));
}

runUITests().catch((err) => {
  console.error(err);
  process.exit(1);
});

