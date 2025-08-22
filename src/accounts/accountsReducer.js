import * as AccountsActions from './constants'

const initialState = {}

const accountsReducer = (state = initialState, action) => {
  if (action.type === AccountsActions.ACCOUNTS_FETCHING) {
    return state
  }

  if (action.type === AccountsActions.ACCOUNTS_FETCHED) {
    return {
      ...state,
      accounts: action.accounts
    }
  }

  if (action.type === AccountsActions.ACCOUNTS_POLLING) {
    return {
      ...state,
      accounts: action.accounts
    }
  }

  return state
}

export default accountsReducer
