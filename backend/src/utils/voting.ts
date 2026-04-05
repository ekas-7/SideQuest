export interface VoteTally {
  approvals: number;
  rejections: number;
  majorityVote: boolean;
}

export const tallyVotes = (votes: boolean[]): VoteTally => {
  const approvals = votes.filter((vote) => vote).length;
  const rejections = votes.length - approvals;
  return {
    approvals,
    rejections,
    majorityVote: approvals >= rejections,
  };
};
