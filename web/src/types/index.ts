import { User } from "firebase/auth";

export type ExtendedUser = User & {
    onboardingCompleted: boolean;
    onboardingAnswers: string[];
    photoURL: string | null;
}
