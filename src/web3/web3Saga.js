import { eventChannel } from 'redux-saga';
import { take, put, call, fork, takeLatest } from 'redux-saga/effects';
import * as Action from './constants'
import * as AccountsActions from '../accounts/constants'

import { Web3 } from 'web3'

export function * initializeWallet () {
  if (typeof window.ethereum !== 'undefined') {
    const { ethereum } = window
    const walletConnection = new Web3()
    walletConnection.setProvider(ethereum)
    try {
      const accounts = yield call(ethereum.request, { method: 'eth_requestAccounts' })
      yield put({ type: AccountsActions.ACCOUNTS_FETCHED, accounts })

      if (!accounts || !accounts.length) {
        yield put({ type: Action.WEB3_USER_DENIED })
        yield put({ type: Action.WALLET_FAILED, error: 'User denied account access' })
        return
      }

      yield put({ type: Action.WALLET_SET, wallet: ethereum, web3: walletConnection })
      return walletConnection
    } catch (error) {
      console.error(error)
      yield put({ type: Action.WEB3_FAILED, error })
    }
  }
  return null
}

/*
 * Initialization
 */

export function * initializeWeb3 (options, networkId) {
  let connections = {
    https: null,
    wss: null,
  }
  if (!options.providers) return connections
  const providers = options.providers[networkId]
  if (!providers) return connections
  try {
    if (providers.httpsProvider) {
      connections.https = new Web3()
      connections.https.setProvider(providers.httpsProvider)
      yield put({ type: Action.HTTPS_PROVIDER_SET, httpsProvider: providers.httpsProvider, web3: connections.https })
    }
    if (providers.wssProvider) {
      yield put({ type: Action.WSS_PROVIDER_SET, wssProvider: providers.wssProvider })
      connections.wss = new Web3()
      connections.wss.setProvider(providers.wssProvider)
      yield put({ type: Action.WSS_PROVIDER_SET, wssProvider: providers.wssProvider, web3: connections.wss })
    }

    yield put({ type: Action.WEB3_INITIALIZED, connections })
    return connections
    
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
    if (!window || !window.ethereum) {
      throw new Error('Metamask is not available')
    }
    // const networkId = yield call([web3.eth, 'getChainId'])
    const chainIdPromise = window.ethereum.request({ method: 'eth_chainId' });
    const chainIdHex = yield chainIdPromise;
    const chainId = parseInt(chainIdHex, 16); // Convert to decimal if needed
    yield put({ type: Action.NETWORK_ID_FETCHED, networkId: chainId.toString() })

    return chainId.toString()
  } catch (error) {
    yield put({ type: Action.NETWORK_ID_FAILED, error })

    console.error('Error fetching network ID:')
    console.error(error)
  }
}

// Create an event channel for chainChanged
function createChainChangedChannel() {
  return eventChannel((emit) => {
    const handler = (chainId) => {
      emit(chainId);
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handler);
    }

    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handler);
      }
    };
  });
}

// Saga to watch for chain changes
export function* watchChainChanged() {
  const channel = yield call(createChainChangedChannel);

  while (true) {
    const chainIdHex = yield take(channel);
    const chainId = parseInt(chainIdHex, 16); // Convert to decimal if needed

    yield put({ type: Action.NETWORK_ID_CHANGED, networkId: chainId });
  }
}
