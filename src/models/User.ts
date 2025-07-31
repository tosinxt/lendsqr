import db from '../config/database';
import * as bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at?: Date;
  updated_at?: Date;
}

type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at'>;
type UpdateUserInput = Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'email'>> & {
  password?: string;
};

const SALT_ROUNDS = 10;

// Hash a password
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify a password
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export const createUser = async (userData: CreateUserInput): Promise<User> => {
  const { password, ...rest } = userData;
  const hashedPassword = await hashPassword(password);
  
  const [userId] = await (await db)('users').insert({
    ...rest,
    password: hashedPassword,
  });
  
  const newUser = await findUserById(userId);
  if (!newUser) {
    throw new Error('Failed to create user');
  }
  
  return newUser;
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  return (await db)('users').where({ email }).first();
};

export const findUserById = async (id: number): Promise<User | undefined> => {
  return (await db)('users').where({ id }).first();
};

export const updateUser = async (id: number, updates: UpdateUserInput): Promise<User | undefined> => {
  const updateData: any = { ...updates };
  
  // Hash new password if provided
  if (updates.password) {
    updateData.password = await hashPassword(updates.password);
  }
  
  await (await db)('users')
    .where({ id })
    .update({
      ...updateData,
      updated_at: (await db).fn.now(),
    });
    
  return findUserById(id);
};

export const deleteUser = async (id: number): Promise<number> => {
  return (await db)('users').where({ id }).del();
};

export const verifyUserCredentials = async (email: string, password: string): Promise<User | null> => {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password);
  return isValid ? user : null;
};

export const sanitizeUser = (user: User): Omit<User, 'password'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
