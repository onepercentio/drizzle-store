import { call, put, takeLatest } from 'redux-saga/effects'

// Initialization Functions
import { initializeWeb3, getNetworkId, initializeWallet } from '../web3/web3Saga'
import { getAccountBalances } from '../accountBalances/accountBalancesSaga'
import * as DrizzleActions from './constants'
import * as BlocksActions from '../blocks/constants'
import { getAccounts } from '../accounts/accountsSaga'

export function * initializeDrizzle (action) {
  const { drizzle, options } = action
  try {
    drizzle.web3 = yield call(initializeWallet)

    if (drizzle.web3) {
      const networkId = yield call(getNetworkId, { web3: drizzle.web3 })

      // Get initial accounts list and balances.
      const accounts = yield call(getAccounts, { web3 })
      yield call(getAccountBalances, { web3, accounts })

      const connections = yield call(initializeWeb3, options, networkId)

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

      if (connections.wss) {
        const interval = options.polls.blocks
        yield put({ type: BlocksActions.BLOCKS_LISTENING, drizzle, interval, web3: connections.wss, syncAlways })
      } else if (connections.https) {
        yield put({ type: BlocksActions.BLOCKS_POLLING, drizzle, web3: connections.https, syncAlways })
      }
    }
  } catch (error) {
    yield put({ type: DrizzleActions.DRIZZLE_FAILED, error })
    console.error('Error initializing Drizzle:')
    console.error(error)

    return
  }

  yield put({ type: DrizzleActions.DRIZZLE_INITIALIZED, drizzle, options })
}

function * drizzleStatusSaga () {
  yield takeLatest(DrizzleActions.DRIZZLE_INITIALIZING, initializeDrizzle)
}

export default drizzleStatusSaga
