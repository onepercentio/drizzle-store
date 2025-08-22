import { call, put, takeLatest } from 'redux-saga/effects'
import * as AccountBalancesActions from './constants'

export function * getAccountBalances (action) {
  const accounts = action.accounts

  if (!accounts) {
    console.error('No accounts found while attempting to fetch balances!')
  }

  try {
    for (const i in accounts) {
      const account = accounts[i]
      const accountBalance = yield call(window.ethereum.request, { method: 'eth_getBalance', params: [account, 'latest'] })

      yield put({ type: AccountBalancesActions.ACCOUNT_BALANCE_FETCHED, account, accountBalance: parseInt(accountBalance, 16) })
    }
  } catch (error) {
    yield put({ type: AccountBalancesActions.ACCOUNT_BALANCE_FAILED, error })
    console.error('Error fetching account balance:')
    console.error(error)
  }

  yield put({ type: AccountBalancesActions.ACCOUNT_BALANCES_FETCHED })
}

export const getAccountsState = state => state.accounts

function * accountBalancesSaga () {
  yield takeLatest(AccountBalancesActions.ACCOUNT_BALANCES_FETCHING, getAccountBalances)
}

export default accountBalancesSaga
