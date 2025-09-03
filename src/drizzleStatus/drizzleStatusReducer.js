import * as DrizzleActions from './constants'

const initialState = {
  initialized: false,
  drizzle: null,
  options: {}
}

const drizzleStatusReducer = (state = initialState, action) => {
  /*
   * Drizzle Status
   */

  if (action.type === DrizzleActions.DRIZZLE_INITIALIZED) {
    return {
      ...state,
      initialized: true,
      drizzle: action.drizzle,
      options: action.options
    }
  }

  if (action.type === DrizzleActions.DRIZZLE_INITIALIZING) {
    return {
      ...state,
      drizzle: action.drizzle,
      options: action.options
    }
  }
  return state
}

export default drizzleStatusReducer
