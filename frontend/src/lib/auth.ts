import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/models";
import bcrypt from "bcryptjs"; // Need to install this

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-please-set-in-env",
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    // Fix for Hugging Face proxy: cookies must allow cross-site delivery
    ...(process.env.NODE_ENV === "production" && {
        cookies: {
            sessionToken: {
                name: `__Secure-next-auth.session-token`,
                options: {
                    httpOnly: true,
                    sameSite: "none" as const,
                    path: "/",
                    secure: true,
                },
            },
            callbackUrl: {
                name: `__Secure-next-auth.callback-url`,
                options: {
                    sameSite: "none" as const,
                    path: "/",
                    secure: true,
                },
            },
            csrfToken: {
                name: `__Host-next-auth.csrf-token`,
                options: {
                    httpOnly: true,
                    sameSite: "none" as const,
                    path: "/",
                    secure: true,
                },
            },
        },
    } as Partial<NextAuthOptions>),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                
                await dbConnect();
                const user = await User.findOne({ email: credentials.email });

                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                return { id: user._id.toString(), email: user.email, name: user.name };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login'
    }
};
