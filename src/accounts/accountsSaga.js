import { call, put, takeLatest } from 'redux-saga/effects'
import * as AccountsActions from './constants'

/*
 * Fetch Accounts List
 */

export function * getAccounts () {
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

function * accountsSaga () {
  yield takeLatest(AccountsActions.ACCOUNTS_FETCHING, getAccounts)
}

export default accountsSaga
