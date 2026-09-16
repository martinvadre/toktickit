import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('Seeding database for E2E tests...');
  execSync('npm --prefix server run prisma:seed', { stdio: 'inherit' });
}
