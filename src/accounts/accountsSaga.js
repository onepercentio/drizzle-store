import { eventChannel } from 'redux-saga'
import { call, put, take, takeLatest } from 'redux-saga/effects'
import { getAccountBalances } from '../accountBalances/accountBalancesSaga'
import * as AccountsActions from './constants'

/*
  * Get current account
*/
export function * getCurrentAccount() {
  return window.ethereum.request({
    method: 'eth_requestAccounts',
    params: []
  })
}

/*
 * Fetch Accounts List
 */

export function * getAccounts (action) {
  try {
    if (!window.ethereum) return []
    const accounts = yield call([window.ethereum, 'request'], { method: 'eth_requestAccounts' })

    if (!accounts) {
      throw new Error('No accounts found!')
    }

    yield put({ type: AccountsActions.ACCOUNTS_FETCHED, accounts })
    return accounts
  } catch (error) {
    yield put({ type: AccountsActions.ACCOUNTS_FAILED, error })
    console.error('Error fetching accounts:')
    console.error(error)
  }
}

/*
 * Poll for Account Changes
 */

function * createAccountsPollChannel ({ interval, web3 }) {
  return eventChannel(emit => {
    const persistedWeb3 = web3

    const accountsPoller = setInterval(() => {
      emit({ type: AccountsActions.SYNCING_ACCOUNTS, persistedWeb3 })
    }, interval) // options.polls.accounts

    const unsubscribe = () => {
      clearInterval(accountsPoller)
    }

    return unsubscribe
  })
}

function * callCreateAccountsPollChannel ({ interval, web3, accounts }) {
  const accountsChannel = yield call(createAccountsPollChannel, {
    interval,
    web3
  })

  try {
    while (true) {
      const event = yield take(accountsChannel)

      if (event.type === AccountsActions.SYNCING_ACCOUNTS) {
        yield call(getAccounts, { web3: event.persistedWeb3 })
        yield call(getAccountBalances, { web3: event.persistedWeb3 })
      }

      yield put({ ...event, accounts })
    }
  } finally {
    accountsChannel.close()
  }
}

function * accountsSaga () {
  yield takeLatest(AccountsActions.ACCOUNTS_FETCHING, getAccounts)
  yield takeLatest(AccountsActions.ACCOUNTS_POLLING, callCreateAccountsPollChannel)
}

export default accountsSaga
