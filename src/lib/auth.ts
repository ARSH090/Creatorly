
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import bcrypt from 'bcryptjs';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import NextAuth from 'next-auth';

// Build a MongoDB client promise for the adapter using mongoose's underlying client
const clientPromise = (async () => {
    const conn = await connectToDatabase();
    // mongoose.connection.getClient() returns the underlying MongoClient
    // @ts-ignore
    return mongoose.connection.getClient();
})();

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise as any),
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email", placeholder: "arsh@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please enter an email and password');
                }

                // Rate limit per-account/email to prevent credential stuffing
                try {
                    const allowed = await RedisRateLimiter.check('signin', 20, 60 * 60 * 1000, credentials.email.toLowerCase());
                    if (!allowed) throw new Error('Too many login attempts. Try again later.');
                } catch (err) {
                    // If rate limiter fails for any reason, log but proceed (to avoid locking out all users)
                    console.warn('Rate limiter check failed:', err);
                }

                await connectToDatabase();

                const user = await User.findOne({
                    email: credentials.email.toLowerCase()
                });

                if (!user || !user.password) {
                    throw new Error('No user found with this email');
                }

                // Lockout protection: if too many failed attempts in short window
                const MAX_FAILED = 10;
                const LOCK_WINDOW_MS = 60 * 60 * 1000; // 1 hour
                if (user.failedLoginAttempts && user.lastFailedLoginAt) {
                    const since = Date.now() - new Date(user.lastFailedLoginAt).getTime();
                    if (user.failedLoginAttempts >= MAX_FAILED && since < LOCK_WINDOW_MS) {
                        throw new Error('Account locked due to too many failed attempts. Try again later.');
                    }
                }

                const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordCorrect) {
                    // Increment failed attempts
                    await User.updateOne({ _id: user._id }, {
                        $inc: { failedLoginAttempts: 1 },
                        $set: { lastFailedLoginAt: new Date() }
                    }).catch(() => { });
                    throw new Error('Invalid credentials');
                }

                // Reset failed attempts on success and update lastLogin
                await User.updateOne({ _id: user._id }, {
                    $set: { failedLoginAttempts: 0, lastLogin: new Date() }
                }).catch(() => { });

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.displayName,
                    username: user.username,
                    role: user.role, // Added role to user object
                    image: user.avatar,
                };
            }
        }),
        // Google OAuth for social login
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
        updateAge: 60 * 60, // Re-issue if older than 1 hour
    },
    callbacks: {
        async jwt({ token, user }: { token: any, user: any }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
                token.picture = user.image;
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.role = token.role;
                session.user.image = token.picture;
            }
            return session;
        }
    },
    events: {
        // When an OAuth user is created via the adapter (e.g., Google), ensure we have a corresponding
        // document in our `users` collection so application logic that uses `User` model remains consistent.
        async createUser({ user }: { user: any }) {
            try {
                await connectToDatabase();
                // Upsert into our User model using email
                if (user?.email) {
                    await User.findOneAndUpdate(
                        { email: user.email.toLowerCase() },
                        {
                            $setOnInsert: {
                                email: user.email.toLowerCase(),
                                displayName: user.name || user.email.split('@')[0],
                                username: (user.email.split('@')[0] || `user_${Date.now()}`).toLowerCase(),
                                avatar: user.image || undefined,
                                emailVerified: true,
                            }
                        },
                        { upsert: true }
                    );
                }
            } catch (err) {
                console.error('Error syncing OAuth user to User model:', err);
            }
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/auth/login',
        error: '/auth/login',
    }
};

// NextAuth handler should be defined in api/auth/[...nextauth]/route.ts only
// to avoid confusion and circular dependencies.
