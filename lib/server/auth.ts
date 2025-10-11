import NextAuth from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { firestore } from "@/lib/server/firestore"
import GoogleProvider from "next-auth/providers/google"
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: FirestoreAdapter(firestore),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    error: 'api/auth/error',
    signIn: '/login'
  },
  callbacks: {}
})
