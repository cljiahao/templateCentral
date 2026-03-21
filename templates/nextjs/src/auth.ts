import { isDev } from '@/lib/constants/env';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

const DEV_USER = {
  id: 'dev',
  name: 'Dev User',
  email: 'dev@local',
  image: null as string | null,
};

function getProviders(): NextAuthConfig['providers'] {
  const providers: NextAuthConfig['providers'] = [];

  // --- Add your SSO providers here ---
  // Example: Microsoft Entra ID
  // const hasEntraId =
  //   process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  //   process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  //   process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER;
  //
  // if (hasEntraId) {
  //   providers.push(
  //     MicrosoftEntraID({
  //       clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
  //       clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
  //       issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
  //     })
  //   );
  // }

  if (isDev) {
    providers.push(
      Credentials({
        name: 'Dev',
        credentials: {
          email: { label: 'Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize() {
          return DEV_USER;
        },
      })
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: getProviders(),
  callbacks: {
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }

      if (profile?.picture) {
        token.image = profile.picture;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }

      return session;
    },

    authorized: async ({ auth }) => !!auth,
  },
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
});
