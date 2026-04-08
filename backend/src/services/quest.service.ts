import {
  assignWeeklyQuestsRepo,
  deleteWeeklyQuestsRepo,
  getQuestCatalogRepo,
  getRandomQuestIdsRepo,
  getWeeklyHistoryRepo,
  getWeeklyQuestByIdRepo,
  getWeeklyQuestsRepo,
  hasRerolledRepo,
  markQuestRejectedRepo,
  markQuestVerifiedRepo,
  submitProofRepo,
  useRerollRepo,
} from "../repositories/quest.repo.ts";

export const questService = {
  getCatalog: getQuestCatalogRepo,
  getWeeklyQuests: getWeeklyQuestsRepo,
  assignWeeklyQuests: assignWeeklyQuestsRepo,
  deleteWeeklyQuests: deleteWeeklyQuestsRepo,
  getRandomQuestIds: getRandomQuestIdsRepo,
  hasRerolled: hasRerolledRepo,
  useReroll: useRerollRepo,
  submitProof: submitProofRepo,
  getWeeklyQuestById: getWeeklyQuestByIdRepo,
  getWeeklyHistory: getWeeklyHistoryRepo,
  markQuestVerified: markQuestVerifiedRepo,
  markQuestRejected: markQuestRejectedRepo,
};
