import leaderboardReducer from './leaderboardSlice';

/**
 * Centralized Store Container for frontend state
 */
class AppStore {
  constructor() {
    this.state = {
      leaderboard: leaderboardReducer(undefined, { type: '@@INIT' }),
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  dispatch(action) {
    this.state = {
      ...this.state,
      leaderboard: leaderboardReducer(this.state.leaderboard, action),
    };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const store = new AppStore();
export default store;
