export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string[];
  sets: number;
  reps: string;
  difficulty: Difficulty;
  aiRecommendation: string;
}

export const EXERCISE_DB: Record<string, Exercise[]> = {
  chest: [
    { id: "c1", name: "Push-up", muscle: "Chest", equipment: ["Bodyweight"], sets: 3, reps: "10-15", difficulty: "Beginner", aiRecommendation: "Perfect for foundational muscular endurance." },
    { id: "c2", name: "Bench Press", muscle: "Chest", equipment: ["Barbell", "Bench"], sets: 4, reps: "8-10", difficulty: "Intermediate", aiRecommendation: "Primary mass builder. Focus on controlled eccentrics." },
    { id: "c3", name: "Cable Fly", muscle: "Chest", equipment: ["Cables"], sets: 3, reps: "12-15", difficulty: "Advanced", aiRecommendation: "Optimal for peak sternal contraction." }
  ],
  biceps: [
    { id: "b1", name: "Barbell Curl", muscle: "Biceps", equipment: ["Barbell"], sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Core mass builder for the biceps brachii." },
    { id: "b2", name: "Hammer Curl", muscle: "Biceps", equipment: ["Dumbbells"], sets: 3, reps: "12-15", difficulty: "Beginner", aiRecommendation: "Targets the brachialis for superior arm thickness." }
  ],
  quads: [
    { id: "q1", name: "Squat", muscle: "Quads", equipment: ["Barbell"], sets: 4, reps: "6-8", difficulty: "Intermediate", aiRecommendation: "The undisputed king of lower body hypertrophy." },
    { id: "q2", name: "Leg Press", muscle: "Quads", equipment: ["Machine"], sets: 4, reps: "10-12", difficulty: "Beginner", aiRecommendation: "Safe loading parameter for isolated quad focus." }
  ],
  glutes: [
    { id: "g1", name: "Hip Thrust", muscle: "Glutes", equipment: ["Barbell", "Bench"], sets: 4, reps: "8-12", difficulty: "Intermediate", aiRecommendation: "Highest EMG activation for maximal glute recruitment." },
    { id: "g2", name: "Romanian Deadlift", muscle: "Glutes", equipment: ["Barbell"], sets: 3, reps: "8-10", difficulty: "Advanced", aiRecommendation: "Develops immense posterior chain power." }
  ],
  lats: [
    { id: "l1", name: "Pull-up", muscle: "Lats", equipment: ["Bodyweight"], sets: 3, reps: "AMRAP", difficulty: "Intermediate", aiRecommendation: "Crucial for lat sweep and upper back width." },
    { id: "l2", name: "Lat Pulldown", muscle: "Lats", equipment: ["Cable"], sets: 4, reps: "10-12", difficulty: "Beginner", aiRecommendation: "Excellent for establishing mind-muscle connection." }
  ],
  abs: [
    { id: "a1", name: "Crunch", muscle: "Abs", equipment: ["Bodyweight"], sets: 3, reps: "15-20", difficulty: "Beginner", aiRecommendation: "Basic spinal flexion for rectus abdominis." },
    { id: "a2", name: "Hanging Leg Raise", muscle: "Abs", equipment: ["Bar"], sets: 3, reps: "12-15", difficulty: "Advanced", aiRecommendation: "Advanced anterior core stabilization." }
  ]
};
