import * as DrizzleActions from './drizzleStatus/constants'
import * as AccountsActions from './accounts/constants'
import * as ContractActions from './contracts/constants'
import * as Web3Actions from './web3/constants'

const createDrizzleMiddleware = () => {
  let drizzleInstance = null
  let options = null
  return store => next => action => {
    const { type } = action

    if (type === DrizzleActions.DRIZZLE_INITIALIZING) {
      drizzleInstance = action.drizzle
      options = action.options
    }

    if (
      type === AccountsActions.ACCOUNTS_FETCHED &&
      drizzleInstance &&
      drizzleInstance.contractList.length
    ) {
      const newAccount = action.accounts[0]
      const oldAccount = drizzleInstance.contractList[0].options.from

      // Update `from` fields with newAccount
      if (oldAccount !== newAccount) {
        drizzleInstance.contractList.forEach(contract => {
          contract.options.from = newAccount
        })
      }
    }

    if (type === ContractActions.ADD_CONTRACT && drizzleInstance) {
      try {
        const { contractConfig, events, wss } = action
        drizzleInstance.addContract(contractConfig, events, wss)
      } catch (error) {
        console.error('Attempt to add a duplicate contract.\n', error)

        // Notify user via
        const notificationAction = {
          type: ContractActions.ERROR_ADD_CONTRACT,
          error,
          attemptedAction: action
        }
        store.dispatch(notificationAction)

        // Don't propogate current action
        return
      }
    }

    if (type === Web3Actions.NETWORK_ID_CHANGED && drizzleInstance) {
      store.dispatch({ 
        type: DrizzleActions.DRIZZLE_INITIALIZING,
        drizzle: drizzleInstance,
        options,
        networkId: action.networkId
      })
    }
    return next(action)
  }
}

export default createDrizzleMiddleware