import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

export type UserRole = "student" | "professor" | "admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Check Professor/Admin table first
        const professor = await prisma.professor.findUnique({
          where: { email: credentials.email },
        });

        if (professor) {
          const valid = await bcrypt.compare(credentials.password, professor.password_hash);
          if (!valid) return null;

          const role: UserRole = professor.role === "Admin" ? "admin" : "professor";
          return {
            id: professor.professor_id,
            email: professor.email,
            name: professor.full_name,
            role,
          };
        }

        // Check Student table
        const student = await prisma.student.findUnique({
          where: { email: credentials.email },
        });

        if (student) {
          const valid = await bcrypt.compare(credentials.password, student.password_hash);
          if (!valid) return null;

          return {
            id: student.student_id,
            email: student.email,
            name: `${student.first_name} ${student.last_name}`,
            role: "student" as UserRole,
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
