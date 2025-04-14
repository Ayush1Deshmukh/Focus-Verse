"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Shield, Trophy } from "lucide-react"
import { useEffect } from "react"

export default function Home() {
  // Check if points are already initialized, if not, set to 100
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentPoints = localStorage.getItem("totalPoints")
      if (!currentPoints) {
        localStorage.setItem("totalPoints", "100")
      }
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed w-full bg-white z-10 shadow-sm">
        <div className="container mx-auto flex justify-between items-center h-[70px] px-4">
          <div className="text-[#283593] font-bold text-xl">Focus Rewards</div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-800 hover:text-[#283593] transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="text-gray-800 hover:text-[#283593] transition-colors">
              Dashboard
            </Link>
            <Link href="#" className="text-gray-800 hover:text-[#283593] transition-colors">
              About
            </Link>
            <Link href="#" className="text-gray-800 hover:text-[#283593] transition-colors">
              Contact
            </Link>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-[70px] relative">
        <div className="bg-gradient-to-r from-[#283593]/90 to-[#283593]/80 text-white">
          <div
            className="absolute inset-0 z-0 opacity-20"
            style={{
              backgroundImage: "url('/placeholder.svg?height=800&width=1600')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="container mx-auto px-4 py-20 md:py-32 relative z-1">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Transform Your Study Time into Rewards!</h1>
              <p className="text-lg md:text-xl opacity-90">Focus, earn points, and unlock your break time.</p>
              <div className="pt-4">
                <Link href="/setup">
                  <Button className="bg-[#43A047] hover:bg-[#2E7D32] text-white px-8 py-6 text-lg rounded-md transition-all hover:scale-105 hover:shadow-md">
                    Start Studying <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-[#283593]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-[#283593]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Block Distractions</h3>
              <p className="text-gray-600">Select which websites to block during your focus sessions.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-[#283593]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-[#283593]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Focus Timer</h3>
              <p className="text-gray-600">Set your study duration and stay focused until the timer ends.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-[#283593]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-[#283593]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
              <p className="text-gray-600">Collect points for completed sessions and redeem them for breaks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">© 2023 Focus Rewards. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
