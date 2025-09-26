"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"

export function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const router = useRouter()
  const { signUp } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signUp(email, password, name)
      toast({
        title: "Account created successfully!",
        description: "You can now start using our services.",
      })
      router.push("/onboarding")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-lg shadow-md space-y-8">
      <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-orange-400 to-pink-600 text-transparent bg-clip-text">
        Create an Account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-lg font-medium text-gray-700">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200 ease-in-out"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-lg font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200 ease-in-out"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-lg font-medium text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200 ease-in-out"
          />
        </div>
        <Button
          type="submit"
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Sign Up
        </Button>
      </form>
    </div>
  )
}

