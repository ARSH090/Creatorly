import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import InstagramProvider from 'next-auth/providers/instagram';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcryptjs from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(connectToDatabase().then(conn => conn.connection.getClient())),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcryptjs.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.displayName,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      if (account) {
        token.provider = account.provider;
        token.accessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // Handle social login
      if (account?.provider === 'google' || account?.provider === 'instagram') {
        await connectToDatabase();

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser && user.email) {
          // Create new user from social provider
          const username = profile?.name?.replace(/\s+/g, '_').toLowerCase() || user.email?.split('@')[0] || 'user';

          const newUser = await User.create({
            email: user.email,
            username: username + '_' + Date.now().toString().slice(-4),
            displayName: profile?.name || user.name || 'Creator',
            avatar: user.image || (profile as any)?.picture,
            password: await bcryptjs.hash(Math.random().toString(36), 12), // Random password for social users
            emailVerified: true,
            emailVerifiedAt: new Date(),
          });

          user.id = newUser._id.toString();
        }
      }

      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  events: {
    async signIn({ user }) {
      console.log(`User ${user.email} signed in`);
    },
    async signOut() {
      console.log('User signed out');
    },
  },
};
