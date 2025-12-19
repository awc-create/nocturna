import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  jwt: { secret: process.env.NEXTAUTH_SECRET },

  providers: [
    Credentials({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(creds): Promise<import('next-auth').User | null> {
        const email = creds?.email?.toLowerCase?.();
        const password = creds?.password;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
            image: true,
          },
        });

        if (!user?.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role === 'admin' ? 'admin' : 'user',
          image: user.image ?? null,
        };
      },
    }),
  ],

  pages: { signIn: '/auth/signin' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.name = user.name ?? null;
        token.picture = user.image ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      // session.user always exists in our augmentation
      session.user.role = token.role ?? 'user';
      session.user.name = token.name ?? session.user.name ?? null;
      session.user.image = token.picture ?? session.user.image ?? null;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
