import { call, put } from 'redux-saga/effects'
import * as Action from './constants'
import * as AccountsActions from '../accounts/constants'

import { Web3 } from 'web3'

/*
 * Initialization
 */

export function * initializeWeb3 (options) {
  try {
    let web3 = null

    if (options.customProvider) {
      yield put({ type: Action.CUSTOM_PROVIDER_SET, customProvider: options.customProvider })
      web3 = new Web3()
      web3.setProvider(options.customProvider)
      yield put({ type: Action.WEB3_INITIALIZED, web3 })
    }

    if (typeof window.ethereum !== 'undefined') {
      const { ethereum } = window
      if (!web3) {
        web3 = new Web3()
        web3.setProvider(ethereum)
        yield put({ type: Action.WEB3_INITIALIZED, web3 })
      }
      try {
        const accounts = yield call(ethereum.request, { method: 'eth_requestAccounts' })
        yield put({ type: AccountsActions.ACCOUNTS_FETCHED, accounts })

        if (!accounts || !accounts.length) {
          yield put({ type: Action.WEB3_USER_DENIED })
          return
        }
        return web3
      } catch (error) {
        console.error(error)
        yield put({ type: Action.WEB3_FAILED, error })
      }
    } else if (options.fallback) {
      // Attempt fallback if no web3 injection.
      switch (options.fallback.type) {
        case 'ws':
          const provider = new Web3.providers.WebsocketProvider(
            options.fallback.url
          )
          web3 = new Web3()
          web3.setProvider(provider)
          yield put({ type: Action.WEB3_INITIALIZED, web3 })
          return web3
        default:
          // Invalid options; throw.
          throw new Error('Invalid web3 fallback provided.')
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
