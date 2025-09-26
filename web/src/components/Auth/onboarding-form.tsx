'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
import { Goal } from "@/context/AuthContext" // Import the Goal interface 
import { Upload } from "lucide-react"
import { steps, goalOptions, goalTitles } from "@/lib/constants"
import { BackgroundGradientAnimation } from "@/components/background-gradient-animation"

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selectedGoalTitles, setSelectedGoalTitles] = useState<string[]>([])
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const router = useRouter()
  const { user, updateOnboardingAnswers, completeOnboarding, uploadProfileImage, updateUserGoals } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.push("/dashboard")
      return
    }

    if (user?.onboardingAnswers) {
      const existingAnswers = steps.map((_, index) => user.onboardingAnswers?.[index] || "")
      setAnswers(existingAnswers)
    }

    if (user?.goals && Array.isArray(user.goals)) {
      console.log("Retrieved user goals:", user.goals);

      // Extract just the titles from the goals array
      const existingGoalTitles = user.goals.map(goal => {
        if (typeof goal === 'object' && goal !== null && 'title' in goal) {
          return goal.title;
        }
        return typeof goal === 'string' ? goal : '';
      }).filter(title => title !== '');

      setSelectedGoalTitles(existingGoalTitles);
    }
  }, [user])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 5MB",
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file",
        })
        return
      }

      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNext = async () => {
    console.log("Current step:", currentStep)
    try {
      if (currentStep === 0 && profileImage) {
        const imageUrl = await uploadProfileImage(profileImage);
        await updateOnboardingAnswers(answers);
      } else if (currentStep === steps.length + 1) {
        // This is the goals step
        // Convert selected titles to full goal objects with roadmaps
        const selectedFullGoals = goalOptions.filter(goal =>
          selectedGoalTitles.includes(goal.title)
        );

        console.log("Selected goals with roadmaps:", selectedFullGoals);
        // Make sure we're sending the complete goal objects with roadmaps
        await updateUserGoals(selectedFullGoals);
      } else {
        await updateOnboardingAnswers(answers);
      }

      if (currentStep < steps.length + 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await completeOnboarding();
        router.push("/dashboard");
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSkip = async () => {
    try {
      await completeOnboarding()
      router.push("/dashboard")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error completing onboarding",
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }

  const handleSelectChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentStep - 1] = value
    setAnswers(newAnswers)
  }

  const toggleGoalSelection = (goalTitle: string) => {
    if (selectedGoalTitles.includes(goalTitle)) {
      setSelectedGoalTitles(selectedGoalTitles.filter(title => title !== goalTitle))
    } else {
      setSelectedGoalTitles([...selectedGoalTitles, goalTitle])
    }
  }

  if (currentStep === 0) {
    return (
      <div className="space-y-8 w-full h-screen mx-auto p-8 rounded-lg mt-2 px-56 bg-white/50 z-50">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(1 / (steps.length + 2)) * 100}%` }}
          ></div>
        </div>
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Step 1 of {steps.length + 2}
        </h2>
        <div className="space-y-6">
          <Label className="text-3xl font-medium text-gray-700 block">
            Upload your profile picture
          </Label>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-40 h-40 relative">
              {imagePreview ? (
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="profile-upload"
            />
            <label
              htmlFor="profile-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {imagePreview ? "Change Photo" : "Upload Photo"}
            </label>
            <p className="text-sm text-gray-500">
              Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
        <div className="flex justify-between pt-6">
          <button
            onClick={handleSkip}
            className="text-base text-gray-500 underline hover:text-gray-700 transition-colors duration-300 ease-in-out"
          >
            Skip
          </button>
          <Button
            onClick={handleNext}
            disabled={!profileImage}
            className="text-base px-8 py-3 bg-blue-500 hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  // Goals selection step
  if (currentStep === steps.length + 1) {
    // Preview the full goal objects with roadmaps that will be saved
    const selectedFullGoals = goalOptions.filter(goal =>
      selectedGoalTitles.includes(goal.title)
    );

    console.log("Preview of selected goals with roadmaps:", selectedFullGoals);

    return (
      <div className="space-y-8 w-full max-w-4xl mx-auto p-8 h-screen rounded-lg mt-2 z-50">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / (steps.length + 2)) * 100}%` }}
          ></div>
        </div>
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Step {currentStep + 1} of {steps.length + 2}
        </h2>
        <div className="space-y-6">
          <Label className="text-3xl font-medium text-gray-700 block">
            What are your goals? (Select all that apply)
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {goalTitles.map((title) => (
              <Button
                key={title}
                onClick={() => toggleGoalSelection(title)}
                variant={selectedGoalTitles.includes(title) ? "default" : "outline"}
                className={`text-lg py-6 transition-all duration-300 ease-in-out transform hover:scale-105 ${selectedGoalTitles.includes(title)
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "hover:bg-blue-100 hover:border-blue-500"
                  }`}
              >
                {title}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-between pt-6">
          <button
            onClick={handleSkip}
            className="text-base text-gray-500 underline hover:text-gray-700 transition-colors duration-300 ease-in-out"
          >
            Skip
          </button>
          <Button
            onClick={handleNext}
            disabled={selectedGoalTitles.length === 0}
            className="text-base px-8 py-3 bg-blue-500 hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete
          </Button>
        </div>
      </div>
    )
  }

  // Regular questions steps
  const currentQuestion = steps[currentStep - 1]
  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto p-8 h-screen rounded-lg mt-2 z-50" >
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${((currentStep + 1) / (steps.length + 2)) * 100}%` }}
        ></div>
      </div>
      <h2 className="text-2xl font-semibold text-center text-gray-800">
        Step {currentStep + 1} of {steps.length + 2}
      </h2>
      <div className="space-y-6 h-[30%] flex flex-col justify-between">
        <Label htmlFor={`question-${currentStep}`} className="text-3xl font-medium text-gray-700 block">
          {currentQuestion.question}
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {currentQuestion.options.map((option) => (
            <Button
              key={option}
              onClick={() => handleSelectChange(option)}
              variant={answers[currentStep - 1] === option ? "default" : "outline"}
              className={`text-lg py-6 transition-all duration-300 ease-in-out transform hover:scale-105 ${answers[currentStep - 1] === option
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "hover:bg-blue-100 hover:border-blue-500"
                }`}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex justify-between pt-6">
        <button
          onClick={handleSkip}
          className="text-base text-gray-500 underline hover:text-gray-700 transition-colors duration-300 ease-in-out"
        >
          Skip
        </button>
        <Button
          onClick={handleNext}
          disabled={!answers[currentStep - 1]}
          className="text-base px-8 py-3 bg-blue-500 hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep < steps.length ? "Next" : "Next"}
        </Button>
      </div>
    </div>
  )
}