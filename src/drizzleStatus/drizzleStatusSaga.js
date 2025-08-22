import { call, put, takeLatest } from 'redux-saga/effects'

// Initialization Functions
import { initializeWeb3, getNetworkId } from '../web3/web3Saga'
import { getAccountBalances } from '../accountBalances/accountBalancesSaga'
import * as DrizzleActions from './constants'
import * as BlocksActions from '../blocks/constants'
import { getAccounts } from '../accounts/accountsSaga'

export function * initializeDrizzle (action) {
  const { drizzle, options } = action
  try {
    // Initialize web3 and get the current network ID.
    const web3 = yield call(initializeWeb3, options)
    drizzle.web3 = web3

    // Client may opt out of connecting their account to the dapp Guard against
    // further web3 interaction, and note web3 will be undefined
    //
    if (web3) {
      yield call(getNetworkId, { web3 })

      // Get initial accounts list and balances.
      const accounts = yield call(getAccounts, { web3 })
      yield call(getAccountBalances, { web3, accounts })

      // Instantiate contracts passed through via options.
      for (let i = 0; i < options.contracts.length; i++) {
        const contractConfig = options.contracts[i]
        let events = []
        const contractName = contractConfig.contractName

        if (contractName in options.events) {
          events = options.events[contractName]
        }

        yield call([drizzle, drizzle.addContract], contractConfig, events)
      }

      const syncAlways = options.syncAlways

      // Protect server-side environments by ensuring ethereum access is
      // guarded by isMetaMask which should only be in browser environment.
      //
      if (web3.currentProvider.isMetaMask && !window.ethereum) {
        // Using old MetaMask, attempt block polling.
        const interval = options.polls.blocks
        yield put({ type: BlocksActions.BLOCKS_POLLING, drizzle, interval, web3, syncAlways })
      } else {
        // Not using old MetaMask, attempt subscription block listening.
        yield put({ type: BlocksActions.BLOCKS_LISTENING, drizzle, web3, syncAlways })
      }
    }
  } catch (error) {
    yield put({ type: DrizzleActions.DRIZZLE_FAILED, error })
    console.error('Error initializing Drizzle:')
    console.error(error)

    return
  }

  yield put({ type: DrizzleActions.DRIZZLE_INITIALIZED, drizzle })
}

function * drizzleStatusSaga () {
  yield takeLatest(DrizzleActions.DRIZZLE_INITIALIZING, initializeDrizzle)
}

export default drizzleStatusSaga
