import * as Action from './constants'

const initialState = {
  status: ''
}

const web3Reducer = (state = initialState, action) => {
  if (action.type === Action.WEB3_INITIALIZING) {
    return {
      ...state,
      status: 'initializing'
    }
  }

  if (action.type === Action.WEB3_INITIALIZED) {
    return {
      ...state,
      status: 'initialized',
      connections: action.connections
    }
  }

  if (action.type === Action.WEB3_FAILED) {
    return {
      ...state,
      status: 'failed'
    }
  }

  if (action.type === Action.WEB3_USER_DENIED) {
    return {
      ...state,
      status: 'UserDeniedAccess'
    }
  }

  if (action.type === Action.NETWORK_ID_FETCHED) {
    return {
      ...state,
      networkId: action.networkId
    }
  }

  if (action.type === Action.NETWORK_ID_FAILED) {
    return {
      ...state,
      networkId: action.networkId
    }
  }
  if (action.type === Action.NETWORK_MISMATCH) {
    return {
      ...state,
      networkMismatch: true
    }
  }
  if (action.type === Action.HTTPS_PROVIDER_SET) {
    return {
      ...state,
      httpsProvider: action.httpsProvider,
      httpsConnection: action.web3
    }
  }
  if (action.type === Action.WSS_PROVIDER_SET) {
    return {
      ...state,
      wssProvider: action.wssProvider,
      wssConnection: action.web3
    }
  }
  if (action.type === Action.WALLET_SET) {
    return {
      ...state,
      wallet: action.wallet,
      walletConnection: action.web3
    }
  }

  return state
}

export default web3Reducer
