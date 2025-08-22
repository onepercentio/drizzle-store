import * as DrizzleActions from './constants'

const initialState = {
  initialized: false,
  drizzle: null
}

const drizzleStatusReducer = (state = initialState, action) => {
  /*
   * Drizzle Status
   */

  if (action.type === DrizzleActions.DRIZZLE_INITIALIZED) {
    return {
      ...state,
      initialized: true,
      drizzle: action.drizzle
    }
  }

  if (action.type === DrizzleActions.DRIZZLE_INITIALIZING) {
    return {
      ...state,
      drizzle: action.drizzle
    }
  }
  return state
}

export default drizzleStatusReducer
