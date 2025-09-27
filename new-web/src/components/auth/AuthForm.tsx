"use client";

import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"owner" | "worker">("owner");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Helper function to set user cookie
  const setUserCookie = (userData: any) => {
    const cookieData = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      type: userData.type,
    };
    
    document.cookie = `user=${encodeURIComponent(
      JSON.stringify(cookieData)
    )}; path=/; secure; samesite=strict; max-age=604800`; // 7 days
  };

  // Helper function to redirect based on user type
  const redirectUser = (userType: string) => {
    if (userType === 'owner') {
      router.push('/dashboard/owner');
    } else if (userType === 'worker') {
      router.push('/dashboard/worker');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in existing user
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          toast.error("User profile not found. Please contact support.");
          return;
        }

        const userData = userDoc.data();
        
        // Set cookie with user data
        setUserCookie({
          id: user.uid,
          email: user.email,
          name: userData.name,
          type: userData.type,
        });

        toast.success(`Welcome back, ${userData.name}!`);
        redirectUser(userData.type);

      } else {
        // Create new user
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Prepare user data
        const userData = {
          id: user.uid,
          email: user.email,
          name,
          type: userType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(userType === "worker" && {
            shiftAvailability: [],
            shiftPreferences: [],
            maxShiftsPerWeek: 5,
            totalHoursWorked: 0,
          }),
          ...(userType === "owner" && {
            businessName: "",
            businessAddress: "",
            establishedDate: new Date().toISOString(),
          }),
        };

        // Create user document in Firestore
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, userData);

        // Set cookie with user data
        setUserCookie(userData);

        toast.success(`Account created successfully! Welcome, ${name}!`);
        redirectUser(userType);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // Handle specific Firebase auth errors
      let errorMessage = "An error occurred. Please try again.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = error.message || "Authentication failed.";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Sign up to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>User Type</Label>
                  <Select
                    value={userType}
                    onValueChange={(value: "owner" | "worker") =>
                      setUserType(value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                // Reset form when switching modes
                setEmail("");
                setPassword("");
                setName("");
                setUserType("owner");
              }}
              disabled={loading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}