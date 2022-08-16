'use strict';

import MetaApiClient from '../metaApi.client';

/**
 * metaapi.cloud MetaTrader account API client (see https://metaapi.cloud/docs/provisioning/)
 */
export default class MetatraderAccountClient extends MetaApiClient {

  /**
   * Extension model
   * @typedef Extension
   * @property {String} id extension id
   * @property {Object} configuration extension configuration
   */

  /**
   * Metatrader account replica model
   * @typedef {Object} MetatraderAccountReplicaDto
   * @property {String} _id account unique identifier
   * @property {String} name MetaTrader account human-readable name in the MetaApi app
   * @property {String} type account type, can be cloud, cloud-g1, cloud-g2 or self-hosted. Cloud and cloud-g2 are
   * aliases.
   * @property {String} login MetaTrader account number
   * @property {String} server MetaTrader server which hosts the account
   * @property {Version} version MT version
   * @property {String} [provisioningProfileId] id of the account's provisioning profile
   * @property {String} application application name to connect the account to. Currently allowed values are MetaApi
   * and AgiliumTrade
   * @property {Number} magic MetaTrader magic to place trades using
   * @property {String} state account deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED,
   * DELETING
   * @property {String} connectionStatus terminal & broker connection status, one of CONNECTED, DISCONNECTED,
   * DISCONNECTED_FROM_BROKER
   * @property {String} accessToken authorization token to be used for accessing single account data.
   * Intended to be used in browser API.
   * @property {Boolean} [manualTrades] flag indicating if trades should be placed as manual trades. Default is false.
   * Supported on G2 only
   * @property {Number} quoteStreamingIntervalInSeconds Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Object} [metadata] extra information which can be stored together with your account
   * @property {String} [reliability] used to increase the reliability of the account. Allowed values are regular and
   * high. Default is regular
   * @property {String} [baseCurrency] 3-character ISO currency code of the account base currency. Default value is USD.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   * @property {Array<string>} [copyFactoryRoles] Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   * @property {Number} [resourceSlots] Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.  Default is 1.
   * @property {number} [copyFactoryResourceSlots] Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @property {String} [symbol] any symbol provided by broker (required for G1 only) 
   * @property {String} region region id to deploy account at. One of returned by the /users/current/regions endpoint
   * @property {Number} [slippage] default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   */

  /**
   * MetaTrader account model
   * @typedef {Object} MetatraderAccountDto
   * @property {String} _id account unique identifier
   * @property {String} userId user id
   * @property {String} name MetaTrader account human-readable name in the MetaApi app
   * @property {String} type account type, can be cloud, cloud-g1, cloud-g2 or self-hosted. Cloud and cloud-g2 are
   * aliases.
   * @property {String} login MetaTrader account number
   * @property {String} server MetaTrader server which hosts the account
   * @property {Version} version MT version
   * @property {String} [provisioningProfileId] id of the account's provisioning profile
   * @property {String} application application name to connect the account to. Currently allowed values are MetaApi
   * and AgiliumTrade
   * @property {Number} magic MetaTrader magic to place trades using
   * @property {String} state account deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED,
   * DELETING
   * @property {String} connectionStatus terminal & broker connection status, one of CONNECTED, DISCONNECTED,
   * DISCONNECTED_FROM_BROKER
   * @property {String} accessToken authorization token to be used for accessing single account data.
   * Intended to be used in browser API.
   * @property {Boolean} [manualTrades] flag indicating if trades should be placed as manual trades. Default is false.
   * Supported on G2 only
   * @property {Number} quoteStreamingIntervalInSeconds Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Object} [metadata] extra information which can be stored together with your account
   * @property {String} reliability used to increase the reliability of the account. Allowed values are regular and
   * high. Default is regular
   * @property {String} [baseCurrency] 3-character ISO currency code of the account base currency. Default value is USD.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   * @property {Array<string>} [copyFactoryRoles] Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   * @property {Number} resourceSlots Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.  Default is 1.
   * @property {number} [copyFactoryResourceSlots] Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @property {String} [symbol] any symbol provided by broker (required for G1 only) 
   * @property {String} region region id to deploy account at. One of returned by the /users/current/regions endpoint
   * @property {Number} [slippage] default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   * @property {Boolean} [primaryReplica] flag indicating that account is primary
   * @property {Boolean} [riskManagementApiEnabled] flag indicating that risk management API should be enabled on
   * account. Default is false
   * @property {Array<MetatraderAccountReplicaDto>} [accountReplicas] MetaTrader account replicas
   * @property {Array<AccountConnection>} connections active account connections
   */

  /**
   * Account connection
   * @typedef {Object} AccountConnection
   * @property {string} region region the account is connected at
   * @property {string} zone availability zone the account is connected at
   * @property {string} application application the account is connected to, one of `MetaApi`, `CopyFactory subscriber`,
   * `CopyFactory provider`, `CopyFactory history import`, `Risk management`
   */

  /**
   * MT version
   * @typedef {4 | 5} Version
   */

  /**
   * Account type
   * @typedef {'cloud' | 'self-hosted'} Type
   */

  /**
   * Account state
   * @typedef {'CREATED' | 'DEPLOYING' | 'DEPLOYED' | 'DEPLOY_FAILED' | 'UNDEPLOYING' | 'UNDEPLOYED' |
   * 'UNDEPLOY_FAILED' | 'DELETING' | 'DELETE_FAILED' | 'REDEPLOY_FAILED'} State
   */

  /**
   * Account connection status
   * @typedef {'CONNECTED' | 'DISCONNECTED' | 'DISCONNECTED_FROM_BROKER'} ConnectionStatus
   */

  /**
   * @typedef {Object} AccountsFilter
   * @property {Number} [offset] search offset (defaults to 0) (must be greater or equal to 0)
   * @property {Number} [limit] search limit (defaults to 1000) 
   * (must be greater or equal to 1 and less or equal to 1000)
   * @property {Array<Version> | Version} [version] MT version
   * @property {Array<Type> | Type} [type] account type
   * @property {Array<State> | State} [state] account state
   * @property {Array<ConnectionStatus> | ConnectionStatus} [connectionStatus] connection status
   * @property {String} [query] searches over _id, name, server and login to match query
   * @property {String} [provisioningProfileId] provisioning profile id
   */

  /**
   * Retrieves MetaTrader accounts owned by user (see https://metaapi.cloud/docs/provisioning/api/account/readAccounts/)
   * Method is accessible only with API access token
   * @param {AccountsFilter} accountsFilter optional filter
   * @return {Promise<Array<MetatraderAccountDto>>} promise resolving with MetaTrader accounts found
   */
  getAccounts(accountsFilter = {}) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('getAccounts');
    }
    const opts = {
      url: `${this._host}/users/current/accounts`,
      method: 'GET',
      qs: accountsFilter,
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getAccounts');
  }

  /**
   * Retrieves a MetaTrader account by id (see https://metaapi.cloud/docs/provisioning/api/account/readAccount/). Throws
   * an error if account is not found.
   * @param {String} id MetaTrader account id
   * @return {Promise<MetatraderAccountDto>} promise resolving with MetaTrader account found
   */
  getAccount(id) {
    const opts = {
      url: `${this._host}/users/current/accounts/${id}`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getAccount');
  }

  /**
   * Retrieves a MetaTrader account replica by id (see 
   * https://metaapi.cloud/docs/provisioning/api/accountReplica/readAccountReplica/).
   * Throws an error if account is not found.
   * @param {String} primaryAccountId MetaTrader account id
   * @param {String} replicaId MetaTrader account replica id
   * @return {Promise<MetatraderAccountReplicaDto>} promise resolving with MetaTrader account replica found
   */
  getAccountReplica(primaryAccountId, replicaId) {
    const opts = {
      url: `${this._host}/users/current/accounts/${primaryAccountId}/replicas/${replicaId}`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getAccountReplica');
  }

  /**
   * Retrieves a MetaTrader account by token (see https://metaapi.cloud/docs/provisioning/api/account/readAccount/).
   * Throws an error if account is not found.
   * Method is accessible only with account access token
   * @return {Promise<MetatraderAccountDto>} promise resolving with MetaTrader account found
   */
  getAccountByToken() {
    if (this._isNotAccountToken()) {
      return this._handleNoAccessError('getAccountByToken');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/accessToken/${this._token}`,
      method: 'GET',
      json: true
    };
    return this._httpClient.request(opts, 'getAccountByToken');
  }

  /**
   * New MetaTrader account model
   * @typedef {Object} NewMetatraderAccountDto
   * @property {String} name MetaTrader account human-readable name in the MetaApi app
   * @property {String} [type] account type, can be cloud, cloud-g1, cloud-g2 or self-hosted. cloud-g2 and cloud are
   * aliases. When you create MT5 cloud account the type is automatically converted to cloud-g1 because MT5 G2 support
   * is still experimental. You can still create MT5 G2 account by setting type to cloud-g2.
   * @property {String} login MetaTrader account number
   * @property {String} password MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features. Required for cloud account
   * @property {String} server MetaTrader server which hosts the account
   * @property {String} [platform] platform id (mt4 or mt5)
   * @property {String} [provisioningProfileId] id of the account's provisioning profile
   * @property {String} application application name to connect the account to. Currently allowed values are MetaApi and
   * AgiliumTrade
   * @property {Number} magic MetaTrader magic to place trades using. When manualTrades field is set to true,
   * magic value must be 0
   * @property {Boolean} [manualTrades] flag indicating if trades should be placed as manual trades. Default is false
   * @property {Number} [quoteStreamingIntervalInSeconds] Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Object} [metadata] extra information which can be stored together with your account
   * @property {String} [reliability] used to increase the reliability of the account. Allowed values are regular and high.
   * Default is regular
   * @property {String} [baseCurrency] 3-character ISO currency code of the account base currency. Default value is USD.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   * @property {Array<string>} [copyFactoryRoles] Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   * @property {Number} [resourceSlots] Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   * @property {String} [symbol] any MetaTrader symbol your broker provides historical market data for. This value
   * should be specified for G1 accounts only and only in case your MT account fails to connect to broker
   * @property {number} [copyFactoryResourceSlots] Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @property {String} [region] region id to deploy account at. One of returned by the /users/current/regions endpoint
   * @property {Number} [slippage] default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   */

  /**
   * MetaTrader account id model
   * @typedef {Object} MetatraderAccountIdDto
   * @property {String} id MetaTrader account unique identifier
   */

  /**
   * Starts cloud API server for a MetaTrader account using specified provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/account/createAccount/). It takes some time to launch the terminal and
   * connect the terminal to the broker, you can use the connectionStatus field to monitor the current status of the
   * terminal.
   * Method is accessible only with API access token
   * @param {NewMetatraderAccountDto} account MetaTrader account to create
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id of the MetaTrader account created
   */
  createAccount(account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts, 'createAccount');
  }

  /**
   * New MetaTrader account replica model
   * @typedef {Object} NewMetaTraderAccountReplicaDto
   * @property {String} [symbol] any symbol provided by broker (required for G1 only) 
   * @property {Number} magic MetaTrader magic to place trades using
   * @property {Number} [quoteStreamingIntervalInSeconds] Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Object} [metadata] extra information which can be stored together with your account
   * @property {String} [reliability] used to increase the reliability of the account. Allowed values are regular and high.
   * Default is regular
   * @property {Number} [resourceSlots] number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   * @property {number} [copyFactoryResourceSlots] number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @property {String} region region id to deploy account at. One of returned by the /users/current/regions endpoint
   */

  /**
   * Starts cloud API server for a MetaTrader account replica using specified primary account (see
   * https://metaapi.cloud/docs/provisioning/api/accountReplica/createAccountReplica/). It takes some time to launch the terminal and
   * connect the terminal to the broker, you can use the connectionStatus field to monitor the current status of the
   * terminal.
   * Method is accessible only with API access token
   * @param {String} accountId primary MetaTrader account id
   * @param {NewMetaTraderAccountReplicaDto} replica MetaTrader account to create
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id of the MetaTrader account replica created
   */
  createAccountReplica(accountId, replica) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: replica
    };
    return this._httpClient.request(opts, 'createAccountReplica');
  }

  /**
   * Starts API server for MetaTrader account. This request will be ignored if the account has already been deployed.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deployAccount/)
   * @param {String} id MetaTrader account id to deploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deployment
   */
  deployAccount(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deployAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/deploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'deployAccount');
  }

  /**
   * Starts API server for MetaTrader account replica. This request will be ignored if the replica has already been deployed.
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/deployAccountReplica/)
   * @param {String} primaryAccountId MetaTrader account id
   * @param {String} replicaId MetaTrader account replica id to deploy
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for deployment
   */
  deployAccountReplica(primaryAccountId, replicaId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deployAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${primaryAccountId}/replicas/${replicaId}/deploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'deployAccountReplica');
  }

  /**
   * Stops API server for a MetaTrader account. Terminal data such as downloaded market history data will be preserved.
   * (see https://metaapi.cloud/docs/provisioning/api/account/undeployAccount/)
   * @param {String} id MetaTrader account id to undeploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for undeployment
   */
  undeployAccount(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('undeployAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/undeploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'undeployAccount');
  }

  /**
   * Stops API server for MetaTrader account replica. Terminal data such as downloaded market history data will be preserved.
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/undeployAccountReplica/)
   * @param {String} primaryAccountId MetaTrader account id
   * @param {String} replicaId MetaTrader account replica id to undeploy
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for undeployment
   */
  undeployAccountReplica(primaryAccountId, replicaId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('undeployAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${primaryAccountId}/replicas/${replicaId}/undeploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'undeployAccountReplica');
  }

  /**
   * Redeploys MetaTrader account. This is equivalent to undeploy immediately followed by deploy.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deployAccount/)
   * @param {String} id MetaTrader account id to redeploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for redeployment
   */
  redeployAccount(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('redeployAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/redeploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'redeployAccount');
  }

  /**
   * Redeploys MetaTrader account. This is equivalent to undeploy immediately followed by deploy.
   * (see https://metaapi.cloud/docs/provisioning/api/account/redeployAccountReplica/)
   * @param {String} primaryAccountId MetaTrader account id
   * @param {String} replicaId MetaTrader account replica id to redeploy
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for redeployment
   */
  redeployAccountReplica(primaryAccountId, replicaId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('redeployAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${primaryAccountId}/replicas/${replicaId}/redeploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'redeployAccountReplica');
  }

  /**
   * Stops and deletes an API server for a specified MetaTrader account. The terminal state such as downloaded market
   * data history will be deleted as well when you delete the account. (see
   * https://metaapi.cloud/docs/provisioning/api/account/deleteAccount/).
   * Method is accessible only with API access token
   * @param {String} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deletion
   */
  deleteAccount(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deleteAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}`,
      method: 'DELETE',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'deleteAccount');
  }

  /**
   * Stops and deletes an API server for a specified MetaTrader account. The terminal state such as downloaded market
   * data history will be deleted as well when you delete the account. (see
   * https://metaapi.cloud/docs/provisioning/api/account/deleteAccountReplica/).
   * Method is accessible only with API access token
   * @param {String} primaryAccountId MetaTrader account id
   * @param {String} replicaId MetaTrader account replica id to delete
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deletion
   */
  deleteAccountReplica(primaryAccountId, replicaId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deleteAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${primaryAccountId}/replicas/${replicaId}`,
      method: 'DELETE',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'deleteAccountReplica');
  }

  /**
   * Updated MetaTrader account data
   * @typedef {Object} MetatraderAccountUpdateDto
   * @property {String} name MetaTrader account human-readable name in the MetaApi app
   * @property {String} password MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features. Required for cloud account
   * @property {String} server MetaTrader server which hosts the account
   * @property {Number} [magic] MetaTrader magic to place trades using
   * @property {Boolean} [manualTrades] flag indicating if trades should be placed as manual trades. Default is false
   * @property {Number} [quoteStreamingIntervalInSeconds] Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Array<Extension>} [extensions] API extensions
   * @property {Object} [metadata] extra information which can be stored together with your account
   * @property {Array<string>} [copyFactoryRoles] Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   * @property {Number} [resourceSlots] Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   */

  /**
   * Updates existing metatrader account data (see
   * https://metaapi.cloud/docs/provisioning/api/account/updateAccount/).
   * Method is accessible only with API access token
   * @param {String} id MetaTrader account id
   * @param {MetatraderAccountUpdateDto} account updated MetaTrader account
   * @return {Promise} promise resolving when MetaTrader account is updated
   */
  updateAccount(id, account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('updateAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}`,
      method: 'PUT',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts, 'updateAccount');
  }

  /**
   * Updated MetaTrader account replica data
   * @typedef {Object} UpdatedMetatraderAccountReplicaDto
   * @property {Number} [magic] MetaTrader magic to place trades using
   * @property {Number} [quoteStreamingIntervalInSeconds] Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Object} [metadata] extra information which can be stored together with your account
   * @property {Number} [resourceSlots] Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   * @property {number} [copyFactoryResourceSlots] number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */

  /**
   * Updates existing metatrader account replica data (see
   * https://metaapi.cloud/docs/provisioning/api/account/updateAccountReplica/).
   * Method is accessible only with API access token
   * @param {String} primaryAccountId MetaTrader account id
   * @param {String} replicaId MetaTrader account replica id
   * @param {UpdatedMetatraderAccountReplicaDto} account updated MetaTrader account replica
   * @return {Promise} promise resolving when MetaTrader account replica is updated
   */
  updateAccountReplica(primaryAccountId, replicaId, account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('updateAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${primaryAccountId}/replicas/${replicaId}`,
      method: 'PUT',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts, 'updateAccountReplica');
  }

  /**
   * Increases MetaTrader account reliability. The account will be temporary stopped to perform this action. (see
   * https://metaapi.cloud/docs/provisioning/api/account/increaseReliability/).
   * Method is accessible only with API access token
   * @param {String} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account reliability is increased
   */
  increaseReliability(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('increaseReliability');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/increase-reliability`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'increaseReliability');
  }

}
