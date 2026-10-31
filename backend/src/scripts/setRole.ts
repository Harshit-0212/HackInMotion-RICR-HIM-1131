import { userStore } from '../lib/users.js';
import { closeDb } from '../lib/db.js';

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim().toLowerCase();
  const role = (args[1]?.trim().toLowerCase() || 'admin') as 'admin' | 'user';

  if (!email) {
    console.error('Usage: node --import tsx/esm src/scripts/setRole.ts <email> [admin|user]');
    process.exit(1);
  }

  const user = await userStore.findByEmail(email);
  if (!user) {
    console.error(`Error: User with email "${email}" not found.`);
    process.exit(1);
  }

  const success = await userStore.setRole(user.id, role);
  if (success) {
    console.log(`Success: Set role for ${user.email} (${user.id}) to "${role}".`);
  } else {
    console.error(`Failed to update role for ${user.email}.`);
  }

  await closeDb();
}

main().catch((err) => {
  console.error('Error running setRole script:', err);
  process.exit(1);
});

