import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Check if users table exists
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) {
    console.log('Users table does not exist, skipping seed');
    return;
  }

  // Check if users already exist
  const users = await knex('users').select('id').limit(1);
  if (users.length > 0) {
    console.log('Users already exist, skipping seed');
    return;
  }

  // Hash passwords
  const saltRounds = 10;
  const password = await bcrypt.hash('password123', saltRounds);

  // Insert test users
  await knex('users').insert([
    {
      email: 'admin@example.com',
      password,
      first_name: 'Admin',
      last_name: 'User',
    },
    {
      email: 'user@example.com',
      password,
      first_name: 'Regular',
      last_name: 'User',
    },
  ]);
  
  console.log('Added test users');
}
