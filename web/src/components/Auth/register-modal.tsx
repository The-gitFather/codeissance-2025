"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RegisterModal() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleClick = () => {
    if (user) {
      router.push("/onboarding");
      toast({
        title: "You are already logged in!",
        description: "You can now start using our services.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password, name);
      toast({
        title: "Account created successfully!",
        description: "You can now start using our services.",
      });
      router.push("/onboarding");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Signed in successfully!",
        description: "Welcome to our platform.",
      });
      router.push("/onboarding");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing in with Google",
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={handleClick}
          className="bg-white text-gray-900 font-medium py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md border-none"
        >
          Register
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900 mb-2">
            Create an account
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Enter your details to create your account
          </DialogDescription>
        </DialogHeader>
        {/* <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition duration-200 ease-in-out"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition duration-200 ease-in-out"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition duration-200 ease-in-out"
            />
          </div>
          <Button
            type="submit"
            className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-all duration-200 ease-in-out"
          >
            Sign Up
          </Button>
        </form> */}
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-md transition-all duration-200 ease-in-out"
            onClick={handleGoogleLogin}
          >
            Sign up with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
