import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'admin' | 'user';
    };
  }

  interface User {
    id: string;
    role: 'admin' | 'user';
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'admin' | 'user';
    picture?: string | null;
    name?: string | null;
  }
}
