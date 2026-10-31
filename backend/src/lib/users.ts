import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  full_name: string;
  role?: 'admin' | 'user';
  created_at: string;
  avatar_image?: string;
}

async function usersCollection() {
  const db = await getDb();
  const col = db.collection<StoredUser>('users');
  await col.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

export const userStore = {
  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const col = await usersCollection();
    const doc = await col.findOne({ email: email.toLowerCase() });
    return doc ?? undefined;
  },

  async findById(id: string): Promise<StoredUser | undefined> {
    const col = await usersCollection();
    const doc = await col.findOne({ id });
    return doc ?? undefined;
  },

  async create(email: string, password: string, fullName: string): Promise<StoredUser> {
    const col = await usersCollection();
    const existing = await col.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email,
      passwordHash,
      full_name: fullName,
      created_at: new Date().toISOString(),
    };
    await col.insertOne(user);
    return user;
  },

  async findOrCreateByGoogle(email: string, googleId: string, fullName: string): Promise<StoredUser> {
    const col = await usersCollection();
    const normalizedEmail = email.toLowerCase();
    const existing = await col.findOne({ email: normalizedEmail });

    if (existing) {
      if (!existing.googleId) {
        await col.updateOne({ email: normalizedEmail }, { $set: { googleId } });
        existing.googleId = googleId;
      }
      return existing;
    }

    const user: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: normalizedEmail,
      googleId,
      full_name: fullName,
      created_at: new Date().toISOString(),
    };
    await col.insertOne(user);
    return user;
  },

  async verifyPassword(user: StoredUser, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  },

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const col = await usersCollection();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await col.updateOne({ id: userId }, { $set: { passwordHash } });
  },

  async updateAvatar(userId: string, avatarImage: string): Promise<void> {
    const col = await usersCollection();
    await col.updateOne({ id: userId }, { $set: { avatar_image: avatarImage } });
  },

  async setRole(userId: string, role: 'admin' | 'user'): Promise<boolean> {
    const col = await usersCollection();
    const res = await col.updateOne({ id: userId }, { $set: { role } });
    return res.matchedCount > 0;
  },
};
