import { PrismaAdapter } from "@auth/prisma-adapter";
import { type AuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        secure: process.env.EMAIL_SERVER_SECURE === "true",
        tls: { rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== "false" },
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { memberships: true },
      }) as (User & { memberships: { id: string }[] }) | null;
      if (dbUser?.pendingOrgName && dbUser.memberships.length === 0) {
        const orgName = dbUser.pendingOrgName;
        await prisma.$transaction([
          prisma.organisation.create({
            data: {
              name: orgName,
              members: { create: { userId: dbUser.id, role: "OWNER" } },
              profiles: { create: { name: "Default", type: "SMALL", isDefault: true } },
            },
          }),
          prisma.user.update({
            where: { id: dbUser.id },
            data: { pendingOrgName: null },
          }),
        ]);
      }
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
