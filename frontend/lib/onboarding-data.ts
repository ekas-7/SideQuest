export const ONBOARDING_INTERESTS = [
  "Fitness",
  "Learning",
  "Creativity",
  "Social",
  "Mindfulness",
  "Adventure",
  "Career",
  "Finance",
  "Wellness",
] as const;

export type OnboardingInterest = (typeof ONBOARDING_INTERESTS)[number];

export type QuestDifficulty = "easy" | "medium" | "hard";

export type SuggestedSideQuest = {
  difficulty: QuestDifficulty;
  title: string;
  description: string;
  interest: OnboardingInterest;
};

const LEVELS: QuestDifficulty[] = ["easy", "medium", "hard"];

const QUEST_TEMPLATES: Record<
  OnboardingInterest,
  Record<QuestDifficulty, { title: string; description: string }>
> = {
  Fitness: {
    easy: {
      title: "10-minute movement burst",
      description: "Do a quick walk, stretch, or bodyweight circuit and log how you feel after.",
    },
    medium: {
      title: "30-minute training session",
      description: "Complete a focused workout (strength, run, or cycling) and track one metric.",
    },
    hard: {
      title: "7-day consistency streak",
      description: "Hit movement goals every day this week and upload one progress check-in.",
    },
  },
  Learning: {
    easy: {
      title: "Read & recap",
      description: "Read 5 pages or one article and write 3 takeaways in your notes.",
    },
    medium: {
      title: "Deep focus block",
      description: "Spend 45 minutes learning one topic and create a short summary card.",
    },
    hard: {
      title: "Teach what you learned",
      description: "Build a mini explanation thread or 2-minute video teaching a concept.",
    },
  },
  Creativity: {
    easy: {
      title: "Daily creative spark",
      description: "Create one small sketch, paragraph, or melody in under 15 minutes.",
    },
    medium: {
      title: "One-hour creator sprint",
      description: "Ship one complete creative piece and share a before/after snapshot.",
    },
    hard: {
      title: "Publish challenge",
      description: "Post 3 original pieces this week and reflect on feedback patterns.",
    },
  },
  Social: {
    easy: {
      title: "Meaningful check-in",
      description: "Send one thoughtful message to reconnect with someone.",
    },
    medium: {
      title: "Plan a micro meetup",
      description: "Invite a friend for coffee, walk, or call and follow through this week.",
    },
    hard: {
      title: "Host a mini gathering",
      description: "Organize a small hangout and document one thing you learned about others.",
    },
  },
  Mindfulness: {
    easy: {
      title: "5-minute reset",
      description: "Do a breathing session and capture your focus level before/after.",
    },
    medium: {
      title: "Mindful evening routine",
      description: "Follow a 20-minute low-stimulus wind-down routine for 3 nights.",
    },
    hard: {
      title: "7-day reflection log",
      description: "Journal daily with one gratitude and one growth note each day.",
    },
  },
  Adventure: {
    easy: {
      title: "Explore a new spot",
      description: "Visit a place in your area you have never checked out before.",
    },
    medium: {
      title: "Half-day local quest",
      description: "Plan a themed mini adventure route and complete all checkpoints.",
    },
    hard: {
      title: "Weekend adventure mission",
      description: "Design and execute a full challenge day outdoors with photo proof.",
    },
  },
  Career: {
    easy: {
      title: "Career micro-win",
      description: "Update one section of your resume, profile, or portfolio.",
    },
    medium: {
      title: "Skill portfolio task",
      description: "Ship one visible work sample related to your target role.",
    },
    hard: {
      title: "Network + output week",
      description: "Reach out to 3 people and publish one career-focused project update.",
    },
  },
  Finance: {
    easy: {
      title: "Money snapshot",
      description: "Track all expenses today and categorize them into needs/wants.",
    },
    medium: {
      title: "Budget tune-up",
      description: "Create a weekly budget cap and hold to it for 5 days.",
    },
    hard: {
      title: "Savings sprint",
      description: "Set and hit a stretch savings target by removing 3 non-essential spends.",
    },
  },
  Wellness: {
    easy: {
      title: "Hydration + sunlight",
      description: "Drink your hydration target and get 15 minutes of daylight.",
    },
    medium: {
      title: "Sleep routine quest",
      description: "Follow a fixed bedtime routine for 4 nights and log sleep quality.",
    },
    hard: {
      title: "Full wellness stack",
      description: "Stack sleep, food, movement, and recovery habits for 7 days straight.",
    },
  },
};

export function buildOnboardingStorageKey(clerkUserId: string) {
  return `sidequest:onboarding-interests:${clerkUserId}`;
}

/** Session flag: onboarding shown & completed for this browser session (testing / “once per open”). */
export function buildOnboardingSessionKey(clerkUserId: string) {
  return `sidequest:onboarding-session-done:${clerkUserId}`;
}

export function isOnboardingInterest(value: string): value is OnboardingInterest {
  return (ONBOARDING_INTERESTS as readonly string[]).includes(value);
}

export function generateQuestSuggestions(
  selectedInterests: OnboardingInterest[]
): SuggestedSideQuest[] {
  const fallbackInterest: OnboardingInterest = "Learning";
  const source = selectedInterests.length > 0 ? selectedInterests : [fallbackInterest];

  return LEVELS.map((difficulty, idx) => {
    const interest = source[idx % source.length];
    const template = QUEST_TEMPLATES[interest][difficulty];

    return {
      difficulty,
      interest,
      title: template.title,
      description: template.description,
    };
  });
}