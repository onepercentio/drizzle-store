import { call, put } from 'redux-saga/effects'
import * as Action from './constants'
import * as AccountsActions from '../accounts/constants'

import { Web3 } from 'web3'

/*
 * Initialization
 */

export function * initializeWeb3 (options) {
  let connections = {
    https: null,
    wss: null,
    wallet: null
  }
  try {
    if (options.httpsProvider) {
      connections.https = new Web3()
      connections.https.setProvider(options.httpsProvider)
      yield put({ type: Action.HTTPS_PROVIDER_SET, httpsProvider: options.httpsProvider, web3: connections.https })
    }
    if (options.wssProvider) {
      yield put({ type: Action.WSS_PROVIDER_SET, wssProvider: options.wssProvider })
      connections.wss = new Web3()
      connections.wss.setProvider(options.wssProvider)
      yield put({ type: Action.WSS_PROVIDER_SET, wssProvider: options.wssProvider, web3: connections.wss })
    }
    if (typeof window.ethereum !== 'undefined') {
      const { ethereum } = window
      connections.wallet = new Web3()
      connections.wallet.setProvider(ethereum)
      yield put({ type: Action.WALLET_SET, wallet: ethereum, web3: connections.wallet })
      try {
        const accounts = yield call(ethereum.request, { method: 'eth_requestAccounts' })
        yield put({ type: AccountsActions.ACCOUNTS_FETCHED, accounts })

        if (!accounts || !accounts.length) {
          yield put({ type: Action.WEB3_USER_DENIED })
          return
        }

        yield put({ type: Action.WEB3_INITIALIZED, connections })

        return connections
      } catch (error) {
        console.error(error)
        yield put({ type: Action.WEB3_FAILED, error })
      }
    } else {
      // Out of web3 options; throw.
      throw new Error('Cannot find injected web3 or valid fallback.')
    }
  } catch (error) {
    console.error(error)
    yield put({ type: Action.WEB3_FAILED, error })
  }
}

/*
 * Network ID
 */
export function * getNetworkId ({ web3 }) {
  try {
    if (!web3 || !web3.eth) {
      throw new Error('web3.eth is not available')
    }
    const networkId = yield call([web3.eth, 'getChainId'])
    yield put({ type: Action.NETWORK_ID_FETCHED, networkId: networkId.toString() })

    return networkId.toString()
  } catch (error) {
    yield put({ type: Action.NETWORK_ID_FAILED, error })

    console.error('Error fetching network ID:')
    console.error(error)
  }
}
