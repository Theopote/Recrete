import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
