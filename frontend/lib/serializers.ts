import type { IUser } from "./models/User";
import type { IQuestCatalog } from "./models/QuestCatalog";
import type { IWeeklyQuest } from "./models/WeeklyQuest";
import type { IVerificationJob } from "./models/VerificationJob";
import type { INotification } from "./models/Notification";

export function serializeUser(user: IUser) {
  return {
    id: user._id.toString(),
    username: user.username,
    trustScore: user.trustScore,
    streak: user.streak,
    xp: user.xp,
    strength: user.strength,
    agility: user.agility,
    intelligence: user.intelligence,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeQuestCatalogItem(q: IQuestCatalog) {
  return {
    id: q._id.toString(),
    title: q.title,
    description: q.description,
    toughness: q.toughness,
    statFocus: q.statFocus,
    categories: q.categories,
  };
}

export function serializeWeeklyQuest(
  wq: IWeeklyQuest & { quest?: IQuestCatalog }
) {
  return {
    id: wq._id.toString(),
    userId: wq.userId,
    weekStart: wq.weekStart,
    slot: wq.slot,
    status: wq.status,
    proofDescription: wq.proofDescription,
    proofUrl: wq.proofUrl,
    submittedAt: wq.submittedAt?.toISOString() ?? null,
    verifiedAt: wq.verifiedAt?.toISOString() ?? null,
    rerollUsed: wq.rerollUsed,
    createdAt: wq.createdAt.toISOString(),
    quest: wq.quest ? serializeQuestCatalogItem(wq.quest) : null,
  };
}

export function serializeVerificationJob(job: IVerificationJob) {
  return {
    id: job._id.toString(),
    weeklyQuestId: job.weeklyQuestId.toString(),
    submitterUserId: job.submitterUserId,
    status: job.status,
    approvals: job.approvals,
    rejections: job.rejections,
    requiredVotes: job.requiredVotes,
    proofUrl: job.proofUrl,
    proofDescription: job.proofDescription,
    createdAt: job.createdAt.toISOString(),
  };
}

export function serializeNotification(n: INotification) {
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    metadata: n.metadata,
    createdAt: n.createdAt.toISOString(),
  };
}
