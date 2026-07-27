/**
 * Leaderboard Redux State Slice — Real-time rankings & scores for 10,000+ users
 */

const initialState = {
  leaderboard: [],
  selectedHackathonId: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Lightweight Redux / State management store action creators
export const setLeaderboard = (data) => ({ type: 'LEADERBOARD_SET', payload: data });
export const updateSubmissionScore = (submissionId, newScore) => ({ type: 'LEADERBOARD_SCORE_UPDATE', payload: { submissionId, newScore } });
export const setLoading = (loading) => ({ type: 'LEADERBOARD_SET_LOADING', payload: loading });

export default function leaderboardReducer(state = initialState, action) {
  switch (action.type) {
    case 'LEADERBOARD_SET':
      return {
        ...state,
        leaderboard: action.payload,
        loading: false,
        lastUpdated: Date.now(),
      };
    case 'LEADERBOARD_SCORE_UPDATE':
      const updated = state.leaderboard.map(item => {
        if (item.submissionId === action.payload.submissionId) {
          return { ...item, averageScore: action.payload.newScore, totalScore: action.payload.newScore };
        }
        return item;
      }).sort((a, b) => b.averageScore - a.averageScore)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

      return {
        ...state,
        leaderboard: updated,
        lastUpdated: Date.now(),
      };
    case 'LEADERBOARD_SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
}
