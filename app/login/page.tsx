"use client"

import BackgroundStars from "@/components/effects/BackgroundStars"
import ParticleText from "@/components/effects/ParticleText"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { signIn } from "next-auth/react";

export default function LoginPage() {
  
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      <BackgroundStars />
      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="relative">
              <ParticleText
                text="File Chat"
                canvasWidth={800}
                canvasHeight={300}
                fontSize={180}
                particleSize={2}
                particleColor="#FFFFFF"
                animationSpeed={0.05}
                particleSpacing={5}
              />
            </div>

          </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-48 bg-white text-slate-900 hover:bg-gray-100 gap-3 font-semibold transition-all duration-200 hover:scale-105"
                    onClick={() => signIn("google", { callbackUrl: "/chat" })}
                  >
                    <FcGoogle className="h-5 w-5" />
                    Continue with Google
                  </Button>
        </div>
      </main>
    </div>
  )
}
