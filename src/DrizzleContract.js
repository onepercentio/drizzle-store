import * as ContractActions from './contracts/constants'
import * as TransactionsActions from './transactions/constants'
import { isGetterFunction, isSetterFunction } from './contractStateUtils'
class DrizzleContract {
  constructor (
    web3Contract,
    web3,
    name,
    store,
    events = [],
    contractArtifact = {},
    wssConnection = null
  ) {
    this.abi = web3Contract.options.jsonInterface
    this.address = web3Contract.options.address
    this.web3 = web3
    this.wssConnection = wssConnection
    this.contractName = name
    this.contractArtifact = contractArtifact
    this.store = store
    this.methods = web3Contract._methods
    this.events = web3Contract._events

    // Merge web3 contract instance into DrizzleContract instance.
    Object.assign(this, web3Contract)

    for (let i = 0; i < this.abi.length; i++) {
      const item = this.abi[i]
      if (isGetterFunction(item)) {
        this.methods[item.name].cacheCall = this.cacheCallFunction(item.name, i)
      }
      if (isSetterFunction(item)) {
        this.methods[item.name].cacheSend = this.cacheSendFunction(item.name, i)
      }
    }

    // Register event listeners if any events, only if WSS connection is available.
    if (events.length > 0 && this.wssConnection) {
      const wssContract = new this.wssConnection.eth.Contract(this.options.jsonInterface, this.options.address);
      for (let i = 0; i < events.length; i++) {
        const event = events[i]
        if (typeof event === 'object') {
          store.dispatch({
            type: ContractActions.LISTEN_FOR_EVENT,
            contract: {
              ...wssContract,
              contractName: this.contractName,
              events: this.events
            },
            eventName: event.eventName,
            eventOptions: event.eventOptions
          })
        } else {
          store.dispatch({
            type: ContractActions.LISTEN_FOR_EVENT,
            contract: {
              ...wssContract,
              contractName: this.contractName,
              events: this.events
            },
            eventName: event
          })
        }
      }
    }
  }

  cacheCallFunction (fnName, fnIndex) {
    const contract = this

    return function () {
      // Collect args and hash to use as key, 0x0 if no args
      let argsHash = '0x0'
      const args = arguments

      if (args.length > 0) {
        argsHash = contract.generateArgsHash(args)
      }
      const contractName = contract.contractName
      const functionState = contract.store.getState().contracts[contractName][
        fnName
      ]

      // If call result is in state and fresh, return value instead of calling
      if (argsHash in functionState) {
        if (contract.store.getState().contracts[contractName].synced === true) {
          return argsHash
        }
      }

      // Otherwise, call function and update store
      contract.store.dispatch({
        type: ContractActions.CALL_CONTRACT_FN,
        contract,
        fnName,
        fnIndex,
        args,
        argsHash
      })

      // Return nothing because state is currently empty.
      return argsHash
    }
  }

  cacheSendFunction (fnName, fnIndex) {
    // NOTE: May not need fn index
    const contract = this

    return function () {
      const args = arguments

      // Generate temporary ID
      const transactionStack = contract.store.getState().transactionStack
      const stackId = transactionStack.length
      const stackTempKey = `TEMP_${new Date().getTime()}`

      // Add ID to "transactionStack" with temp value, will be overwritten on TX_BROADCASTED
      contract.store.dispatch({ type: TransactionsActions.PUSH_TO_TXSTACK, stackTempKey })

      // Dispatch tx to saga
      // When txhash received, will be value of stack ID
      contract.store.dispatch({
        type: ContractActions.SEND_CONTRACT_TX,
        contract,
        fnName,
        fnIndex,
        args,
        stackId,
        stackTempKey
      })

      // return stack ID
      return stackId
    }
  }

  generateArgsHash (args) {
    const web3 = this.web3
    let hashString = ''

    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] !== 'function') {
        let argToHash = args[i]

        // Stringify objects to allow hashing
        if (typeof argToHash === 'object') {
          const json = JSON.stringify(argToHash, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )
          argToHash = JSON.stringify(json)
        }

        // Convert number to strong to allow hashing
        if (typeof argToHash === 'number') {
          argToHash = argToHash.toString()
        }

        // This check is in place for web3 v0.x
        const hashPiece = web3.utils.sha3(argToHash)

        hashString += hashPiece
      }
    }

    return web3.utils.sha3(hashString)
  }
}

export default DrizzleContract
