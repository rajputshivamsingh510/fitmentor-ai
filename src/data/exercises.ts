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
    { id: "c1",  name: "Push-up",                muscle: "Chest", equipment: ["Bodyweight"],         sets: 3, reps: "10-15", difficulty: "Beginner",     aiRecommendation: "Perfect for foundational muscular endurance." },
    { id: "c2",  name: "Bench Press",             muscle: "Chest", equipment: ["Barbell", "Bench"],   sets: 4, reps: "6-10",  difficulty: "Intermediate", aiRecommendation: "Primary mass builder. Focus on controlled eccentrics." },
    { id: "c3",  name: "Cable Fly",               muscle: "Chest", equipment: ["Cable"],              sets: 3, reps: "12-15", difficulty: "Intermediate", aiRecommendation: "Optimal for peak sternal contraction at full stretch." },
    { id: "c4",  name: "Incline Dumbbell Press",  muscle: "Chest", equipment: ["Dumbbells", "Bench"], sets: 4, reps: "8-12",  difficulty: "Intermediate", aiRecommendation: "Targets the upper chest for a full, rounded look." },
    { id: "c5",  name: "Dumbbell Fly",            muscle: "Chest", equipment: ["Dumbbells", "Bench"], sets: 3, reps: "12-15", difficulty: "Beginner",     aiRecommendation: "Great isolation with a deep stretch at the bottom." },
    { id: "c6",  name: "Decline Bench Press",     muscle: "Chest", equipment: ["Barbell", "Bench"],   sets: 4, reps: "8-10",  difficulty: "Intermediate", aiRecommendation: "Emphasizes the lower pec line for definition." },
    { id: "c7",  name: "Chest Dip",               muscle: "Chest", equipment: ["Bodyweight"],         sets: 3, reps: "8-12",  difficulty: "Intermediate", aiRecommendation: "Lean forward to maximally load the pecs over triceps." },
    { id: "c8",  name: "Pec Deck Machine",        muscle: "Chest", equipment: ["Machine"],            sets: 3, reps: "12-15", difficulty: "Beginner",     aiRecommendation: "Safe isolation; ideal finisher for a chest session." },
    { id: "c9",  name: "Landmine Press",          muscle: "Chest", equipment: ["Barbell"],            sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Joint-friendly press that allows natural arc of motion." },
    { id: "c10", name: "Svend Press",             muscle: "Chest", equipment: ["Plates"],             sets: 3, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Squeezing plates together maximises pec activation." },
  ],
  back: [
    { id: "bk1",  name: "Deadlift",              muscle: "Back", equipment: ["Barbell"],          sets: 4, reps: "4-6",   difficulty: "Advanced",     aiRecommendation: "The single best posterior chain builder in existence." },
    { id: "bk2",  name: "Barbell Row",           muscle: "Back", equipment: ["Barbell"],          sets: 4, reps: "6-10",  difficulty: "Intermediate", aiRecommendation: "Drives upper back thickness like no other row variation." },
    { id: "bk3",  name: "Seated Cable Row",      muscle: "Back", equipment: ["Cable"],            sets: 3, reps: "10-12", difficulty: "Beginner",     aiRecommendation: "Maintains constant tension throughout the movement." },
    { id: "bk4",  name: "Single-Arm DB Row",     muscle: "Back", equipment: ["Dumbbells"],        sets: 3, reps: "10-12", difficulty: "Beginner",     aiRecommendation: "Lets you feel each side independently for balance." },
    { id: "bk5",  name: "T-Bar Row",             muscle: "Back", equipment: ["Barbell"],          sets: 4, reps: "8-10",  difficulty: "Intermediate", aiRecommendation: "Neutral grip reduces shoulder strain, more lat drive." },
    { id: "bk6",  name: "Face Pull",             muscle: "Back", equipment: ["Cable"],            sets: 3, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Essential for rear delt and rotator cuff health." },
    { id: "bk7",  name: "Chest-Supported Row",   muscle: "Back", equipment: ["Dumbbells", "Bench"], sets: 3, reps: "10-12", difficulty: "Beginner",  aiRecommendation: "Removes lower back from the equation, pure upper back." },
    { id: "bk8",  name: "Meadows Row",           muscle: "Back", equipment: ["Barbell"],          sets: 3, reps: "10-12", difficulty: "Advanced",     aiRecommendation: "Superior lat stretch under load at end range." },
    { id: "bk9",  name: "Rack Pull",             muscle: "Back", equipment: ["Barbell"],          sets: 4, reps: "4-6",   difficulty: "Advanced",     aiRecommendation: "Overload the top portion of the deadlift safely." },
    { id: "bk10", name: "Inverted Row",          muscle: "Back", equipment: ["Bodyweight"],       sets: 3, reps: "10-15", difficulty: "Beginner",     aiRecommendation: "Bodyweight row perfect for beginners building base." },
  ],
  lats: [
    { id: "l1", name: "Pull-up",              muscle: "Lats", equipment: ["Bodyweight"],  sets: 3, reps: "AMRAP", difficulty: "Intermediate", aiRecommendation: "Crucial for lat sweep and upper back width." },
    { id: "l2", name: "Lat Pulldown",         muscle: "Lats", equipment: ["Cable"],       sets: 4, reps: "10-12", difficulty: "Beginner",     aiRecommendation: "Excellent for establishing the mind-muscle connection." },
    { id: "l3", name: "Straight-Arm Pulldown",muscle: "Lats", equipment: ["Cable"],       sets: 3, reps: "12-15", difficulty: "Intermediate", aiRecommendation: "Isolates lats by keeping arms straight; great finisher." },
    { id: "l4", name: "Wide-Grip Pull-up",    muscle: "Lats", equipment: ["Bodyweight"],  sets: 4, reps: "6-10",  difficulty: "Advanced",     aiRecommendation: "Maximises lat width through a larger ROM." },
    { id: "l5", name: "Close-Grip Pulldown",  muscle: "Lats", equipment: ["Cable"],       sets: 3, reps: "10-12", difficulty: "Beginner",     aiRecommendation: "Neutral grip reduces shoulder stress while loading lats." },
    { id: "l6", name: "Archer Pull-up",       muscle: "Lats", equipment: ["Bodyweight"],  sets: 3, reps: "5-8",   difficulty: "Advanced",     aiRecommendation: "Unilateral loading prepares you for one-arm pulls." },
  ],
  shoulders: [
    { id: "s1",  name: "Overhead Press",         muscle: "Shoulders", equipment: ["Barbell"],           sets: 4, reps: "6-8",   difficulty: "Intermediate", aiRecommendation: "King of shoulder mass. Engages all three deltoid heads." },
    { id: "s2",  name: "Lateral Raise",          muscle: "Shoulders", equipment: ["Dumbbells"],          sets: 4, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Essential for side delt width and capped shoulder look." },
    { id: "s3",  name: "Arnold Press",           muscle: "Shoulders", equipment: ["Dumbbells"],          sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Hits all three heads through its unique rotational arc." },
    { id: "s4",  name: "Rear Delt Fly",          muscle: "Shoulders", equipment: ["Dumbbells"],          sets: 3, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Critical for posture and posterior shoulder balance." },
    { id: "s5",  name: "Cable Lateral Raise",    muscle: "Shoulders", equipment: ["Cable"],              sets: 3, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Constant tension throughout compared to dumbbells." },
    { id: "s6",  name: "Upright Row",            muscle: "Shoulders", equipment: ["Barbell"],            sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Combines front delt and trap activation effectively." },
    { id: "s7",  name: "Dumbbell Shoulder Press",muscle: "Shoulders", equipment: ["Dumbbells"],          sets: 4, reps: "8-12",  difficulty: "Beginner",     aiRecommendation: "Greater ROM than barbell version, great for beginners." },
    { id: "s8",  name: "Landmine Lateral Raise", muscle: "Shoulders", equipment: ["Barbell"],            sets: 3, reps: "12-15", difficulty: "Intermediate", aiRecommendation: "Arc of motion mimics delt fibre direction perfectly." },
    { id: "s9",  name: "Pike Push-up",           muscle: "Shoulders", equipment: ["Bodyweight"],         sets: 3, reps: "10-15", difficulty: "Beginner",     aiRecommendation: "Overhead pressing pattern needing zero equipment." },
    { id: "s10", name: "Behind-Neck Press",      muscle: "Shoulders", equipment: ["Barbell"],            sets: 3, reps: "8-10",  difficulty: "Advanced",     aiRecommendation: "High rear delt involvement — only if mobility allows." },
  ],
  biceps: [
    { id: "bi1", name: "Barbell Curl",           muscle: "Biceps", equipment: ["Barbell"],   sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Core mass builder for the biceps brachii." },
    { id: "bi2", name: "Hammer Curl",            muscle: "Biceps", equipment: ["Dumbbells"], sets: 3, reps: "12-15", difficulty: "Beginner",     aiRecommendation: "Targets the brachialis for superior arm thickness." },
    { id: "bi3", name: "Incline Dumbbell Curl",  muscle: "Biceps", equipment: ["Dumbbells", "Bench"], sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Long head stretch at the bottom maximises peak." },
    { id: "bi4", name: "Concentration Curl",     muscle: "Biceps", equipment: ["Dumbbells"], sets: 3, reps: "12-15", difficulty: "Beginner",     aiRecommendation: "Highest bicep peak activation per EMG studies." },
    { id: "bi5", name: "Cable Curl",             muscle: "Biceps", equipment: ["Cable"],     sets: 3, reps: "12-15", difficulty: "Beginner",     aiRecommendation: "Constant tension maintains load at the top position." },
    { id: "bi6", name: "Preacher Curl",          muscle: "Biceps", equipment: ["Barbell", "Bench"], sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Eliminates momentum; pure short-head isolation." },
    { id: "bi7", name: "Chin-up",                muscle: "Biceps", equipment: ["Bodyweight"], sets: 3, reps: "AMRAP", difficulty: "Intermediate", aiRecommendation: "Supinated grip means heavy bicep loading with pull." },
    { id: "bi8", name: "Spider Curl",            muscle: "Biceps", equipment: ["Dumbbells", "Bench"], sets: 3, reps: "12-15", difficulty: "Intermediate", aiRecommendation: "Prevents shoulder flexion cheating; strict isolation." },
  ],
  triceps: [
    { id: "t1", name: "Close-Grip Bench Press",  muscle: "Triceps", equipment: ["Barbell", "Bench"], sets: 4, reps: "6-10",  difficulty: "Intermediate", aiRecommendation: "Heaviest tricep movement for overall mass." },
    { id: "t2", name: "Tricep Pushdown",         muscle: "Triceps", equipment: ["Cable"],            sets: 3, reps: "12-15", difficulty: "Beginner",     aiRecommendation: "Constant tension; great as warm-up or finisher." },
    { id: "t3", name: "Overhead Tricep Extension",muscle:"Triceps", equipment: ["Dumbbells"],        sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Stretches the long head fully for complete development." },
    { id: "t4", name: "Skull Crusher",           muscle: "Triceps", equipment: ["Barbell", "Bench"], sets: 3, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Elbow extension under load is superior for hypertrophy." },
    { id: "t5", name: "Tricep Dip",              muscle: "Triceps", equipment: ["Bodyweight"],       sets: 3, reps: "AMRAP", difficulty: "Beginner",     aiRecommendation: "Stay upright to keep tension on triceps not pecs." },
    { id: "t6", name: "Diamond Push-up",         muscle: "Triceps", equipment: ["Bodyweight"],       sets: 3, reps: "12-20", difficulty: "Beginner",     aiRecommendation: "No equipment needed; effective medial head focus." },
    { id: "t7", name: "Kickback",                muscle: "Triceps", equipment: ["Dumbbells"],        sets: 3, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Squeeze at full extension; best as a finisher." },
    { id: "t8", name: "JM Press",               muscle: "Triceps", equipment: ["Barbell", "Bench"], sets: 4, reps: "8-10",  difficulty: "Advanced",     aiRecommendation: "Hybrid between skull crusher and close-grip press." },
  ],
  legs: [
    { id: "lg1",  name: "Back Squat",            muscle: "Legs", equipment: ["Barbell"],   sets: 4, reps: "5-8",   difficulty: "Intermediate", aiRecommendation: "The undisputed king of lower body hypertrophy." },
    { id: "lg2",  name: "Leg Press",             muscle: "Legs", equipment: ["Machine"],   sets: 4, reps: "10-15", difficulty: "Beginner",     aiRecommendation: "Safe loading for isolated quad focus without spinal load." },
    { id: "lg3",  name: "Walking Lunge",         muscle: "Legs", equipment: ["Dumbbells"], sets: 3, reps: "12/leg", difficulty: "Intermediate", aiRecommendation: "Unilateral movement that corrects imbalances effectively." },
    { id: "lg4",  name: "Romanian Deadlift",     muscle: "Legs", equipment: ["Barbell"],   sets: 4, reps: "8-10",  difficulty: "Intermediate", aiRecommendation: "Superior hamstring stretch under load at full extension." },
    { id: "lg5",  name: "Leg Curl",              muscle: "Legs", equipment: ["Machine"],   sets: 3, reps: "12-15", difficulty: "Beginner",     aiRecommendation: "Direct hamstring isolation; use as a secondary movement." },
    { id: "lg6",  name: "Hack Squat",            muscle: "Legs", equipment: ["Machine"],   sets: 4, reps: "10-12", difficulty: "Intermediate", aiRecommendation: "Deep quad activation with reduced lower back involvement." },
    { id: "lg7",  name: "Bulgarian Split Squat", muscle: "Legs", equipment: ["Dumbbells", "Bench"], sets: 3, reps: "8-10/leg", difficulty: "Advanced", aiRecommendation: "Most demanding unilateral quad movement available." },
    { id: "lg8",  name: "Front Squat",           muscle: "Legs", equipment: ["Barbell"],   sets: 4, reps: "5-8",   difficulty: "Advanced",     aiRecommendation: "More upright torso means greater quad and upper back demand." },
    { id: "lg9",  name: "Leg Extension",         muscle: "Legs", equipment: ["Machine"],   sets: 3, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Pure quad isolation; use as a warm-up or finisher." },
    { id: "lg10", name: "Step-up",               muscle: "Legs", equipment: ["Dumbbells"], sets: 3, reps: "10/leg", difficulty: "Beginner",    aiRecommendation: "Functional lower body strength with minimal equipment." },
  ],
  glutes: [
    { id: "g1", name: "Hip Thrust",              muscle: "Glutes", equipment: ["Barbell", "Bench"], sets: 4, reps: "8-12",  difficulty: "Intermediate", aiRecommendation: "Highest EMG activation for maximal glute recruitment." },
    { id: "g2", name: "Romanian Deadlift",       muscle: "Glutes", equipment: ["Barbell"],          sets: 3, reps: "8-10",  difficulty: "Intermediate", aiRecommendation: "Develops immense posterior chain power through stretch." },
    { id: "g3", name: "Cable Kickback",          muscle: "Glutes", equipment: ["Cable"],            sets: 3, reps: "15/leg", difficulty: "Beginner",    aiRecommendation: "Constant tension isolates the glute through full extension." },
    { id: "g4", name: "Sumo Deadlift",           muscle: "Glutes", equipment: ["Barbell"],          sets: 4, reps: "5-8",   difficulty: "Advanced",     aiRecommendation: "Wide stance shifts emphasis to glutes and inner thighs." },
    { id: "g5", name: "Glute Bridge",            muscle: "Glutes", equipment: ["Bodyweight"],       sets: 3, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Entry-level hip extension pattern; great for activation." },
    { id: "g6", name: "Donkey Kick",             muscle: "Glutes", equipment: ["Bodyweight"],       sets: 3, reps: "15/leg", difficulty: "Beginner",    aiRecommendation: "Targets the gluteus maximus through hip hyperextension." },
    { id: "g7", name: "Curtsy Lunge",            muscle: "Glutes", equipment: ["Bodyweight"],       sets: 3, reps: "12/leg", difficulty: "Intermediate", aiRecommendation: "Challenges glutes in adduction for outer glute shape." },
  ],
  abs: [
    { id: "ab1", name: "Plank",                  muscle: "Abs", equipment: ["Bodyweight"], sets: 3, reps: "30-60s", difficulty: "Beginner",     aiRecommendation: "Anti-extension core stability is the base of all strength." },
    { id: "ab2", name: "Crunch",                 muscle: "Abs", equipment: ["Bodyweight"], sets: 3, reps: "15-20",  difficulty: "Beginner",     aiRecommendation: "Basic spinal flexion for rectus abdominis activation." },
    { id: "ab3", name: "Hanging Leg Raise",      muscle: "Abs", equipment: ["Bar"],        sets: 3, reps: "10-15",  difficulty: "Advanced",     aiRecommendation: "Advanced anterior core with hip flexor integration." },
    { id: "ab4", name: "Cable Crunch",           muscle: "Abs", equipment: ["Cable"],      sets: 3, reps: "15-20",  difficulty: "Intermediate", aiRecommendation: "Loaded flexion allows progressive overload on abs." },
    { id: "ab5", name: "Ab Wheel Rollout",       muscle: "Abs", equipment: ["Ab Wheel"],   sets: 3, reps: "8-12",   difficulty: "Advanced",     aiRecommendation: "Brutally effective anti-extension core exercise." },
    { id: "ab6", name: "Russian Twist",          muscle: "Abs", equipment: ["Bodyweight"], sets: 3, reps: "20-30",  difficulty: "Intermediate", aiRecommendation: "Rotational core strength for oblique development." },
    { id: "ab7", name: "Bicycle Crunch",         muscle: "Abs", equipment: ["Bodyweight"], sets: 3, reps: "20-30",  difficulty: "Beginner",     aiRecommendation: "High oblique and rectus activation in one movement." },
    { id: "ab8", name: "Dragon Flag",            muscle: "Abs", equipment: ["Bench"],      sets: 3, reps: "5-8",    difficulty: "Advanced",     aiRecommendation: "Elite full-body core tension — Bruce Lee's signature move." },
    { id: "ab9", name: "Dead Bug",               muscle: "Abs", equipment: ["Bodyweight"], sets: 3, reps: "10/side", difficulty: "Beginner",    aiRecommendation: "Anti-extension with limb dissociation; safe for lower back." },
  ],
  calves: [
    { id: "cv1", name: "Standing Calf Raise",    muscle: "Calves", equipment: ["Bodyweight"], sets: 4, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Full ROM with a pause at the top for maximal stretch." },
    { id: "cv2", name: "Seated Calf Raise",      muscle: "Calves", equipment: ["Machine"],    sets: 4, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Targets the soleus under the gastrocnemius." },
    { id: "cv3", name: "Donkey Calf Raise",      muscle: "Calves", equipment: ["Bodyweight"], sets: 3, reps: "15-20", difficulty: "Intermediate", aiRecommendation: "Hip-hinge position produces a superior gastrocnemius stretch." },
    { id: "cv4", name: "Jump Rope",              muscle: "Calves", equipment: ["Jump Rope"],  sets: 3, reps: "60s",   difficulty: "Beginner",     aiRecommendation: "High-rep explosive training builds calf endurance rapidly." },
  ],
  forearms: [
    { id: "f1", name: "Wrist Curl",              muscle: "Forearms", equipment: ["Barbell"],   sets: 3, reps: "15-20", difficulty: "Beginner",     aiRecommendation: "Direct flexor training for forearm mass and grip." },
    { id: "f2", name: "Reverse Curl",            muscle: "Forearms", equipment: ["Barbell"],   sets: 3, reps: "12-15", difficulty: "Intermediate", aiRecommendation: "Hits the brachioradialis and extensor compartment." },
    { id: "f3", name: "Farmer's Carry",          muscle: "Forearms", equipment: ["Dumbbells"], sets: 3, reps: "30-40m", difficulty: "Intermediate", aiRecommendation: "Functional loaded carry that builds brutal grip strength." },
    { id: "f4", name: "Dead Hang",               muscle: "Forearms", equipment: ["Bar"],       sets: 3, reps: "30-60s", difficulty: "Beginner",     aiRecommendation: "Passive grip strength and shoulder decompression." },
  ],
};

// Flat list helper — used by the library page for filtering
export const ALL_EXERCISES: Exercise[] = Object.values(EXERCISE_DB).flat();

export const MUSCLE_GROUPS = Object.keys(EXERCISE_DB).map(
  (k) => k.charAt(0).toUpperCase() + k.slice(1)
);

export const ALL_EQUIPMENT = [
  ...new Set(ALL_EXERCISES.flatMap((e) => e.equipment)),
].sort();