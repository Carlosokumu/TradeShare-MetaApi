/**
 * metaapi.cloud MetaTrader account API client (see https://metaapi.cloud/docs/provisioning/)
 */
export default class MetatraderAccountClient {
  
  /**
   * Retrieves MetaTrader accounts owned by user (see https://metaapi.cloud/docs/provisioning/api/account/readAccounts/)
   * Method is accessible only with API access token
   * @param {AccountsFilter} accountsFilter optional filter
   * @return {Promise<Array<MetatraderAccountDto>>} promise resolving with MetaTrader accounts found
   */
  getAccounts(accountsFilter?: AccountsFilter): Promise<Array<MetatraderAccountDto>>;
  
  /**
   * Retrieves a MetaTrader account by id (see https://metaapi.cloud/docs/provisioning/api/account/readAccount/). Throws
   * an error if account is not found.
   * @param {string} id MetaTrader account id
   * @return {Promise<MetatraderAccountDto>} promise resolving with MetaTrader account found
   */
  getAccount(id: string): Promise<MetatraderAccountDto>;
  
  /**
   * Retrieves a MetaTrader account by token (see https://metaapi.cloud/docs/provisioning/api/account/readAccount/).
   * Throws an error if account is not found.
   * Method is accessible only with account access token
   * @return {Promise<MetatraderAccountDto>} promise resolving with MetaTrader account found
   */
  getAccountByToken(): Promise<MetatraderAccountDto>;
  
  /**
   * Starts cloud API server for a MetaTrader account using specified provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/account/createAccount/). It takes some time to launch the terminal and
   * connect the terminal to the broker, you can use the connectionStatus field to monitor the current status of the
   * terminal.
   * Method is accessible only with API access token
   * @param {NewMetatraderAccountDto} account MetaTrader account to create
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id of the MetaTrader account created
   */
  createAccount(account: NewMetatraderAccountDto): Promise<MetatraderAccountIdDto>;

  /**
   * Starts cloud API server for a MetaTrader account replica using specified primary account (see
   * https://metaapi.cloud/docs/provisioning/api/accountReplica/createAccountReplica/). It takes some time to launch the terminal and
   * connect the terminal to the broker, you can use the connectionStatus field to monitor the current status of the
   * terminal.
   * Method is accessible only with API access token
   * @param {String} accountId primary MetaTrader account id
   * @param {NewMetaTraderAccountReplicaDto} account MetaTrader account to create
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id of the MetaTrader account replica created
   */
  createAccountReplica(accountId: string, account: NewMetaTraderAccountReplicaDto): Promise<MetatraderAccountIdDto>;

  /**
   * Starts API server for MetaTrader account. This request will be ignored if the account has already been deployed.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deployAccount/)
   * @param {string} id MetaTrader account id to deploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deployment
   */
  deployAccount(id: string): Promise<any>

  /**
   * Starts API server for MetaTrader account replica. This request will be ignored if the replica has already been deployed.
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/deployAccountReplica/)
   * @param {string} primaryAccountId MetaTrader account id
   * @param {string} replicaId MetaTrader account replica id to deploy
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for deployment
   */
  deployAccountReplica(primaryAccountId: string, replicaId: string): Promise<any>

  /**
   * Stops API server for a MetaTrader account. Terminal data such as downloaded market history data will be preserved.
   * (see https://metaapi.cloud/docs/provisioning/api/account/undeployAccount/)
   * @param {string} id MetaTrader account id to undeploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for undeployment
   */
  undeployAccount(id: string): Promise<any>

  /**
   * Stops API server for MetaTrader account replica. Terminal data such as downloaded market history data will be preserved.
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/undeployAccountReplica/)
   * @param {string} primaryAccountId MetaTrader account id
   * @param {string} replicaId MetaTrader account replica id to undeploy
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for undeployment
   */
  undeployAccountReplica(primaryAccountId: string, replicaId: string): Promise<any>
  
  /**
   * Redeploys MetaTrader account. This is equivalent to undeploy immediately followed by deploy.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deployAccount/)
   * @param {string} id MetaTrader account id to redeploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for redeployment
   */
  redeployAccount(id: string): Promise<any>

  /**
   * Redeploys MetaTrader account. This is equivalent to undeploy immediately followed by deploy.
   * (see https://metaapi.cloud/docs/provisioning/api/account/redeployAccountReplica/)
   * @param {string} primaryAccountId MetaTrader account id
   * @param {string} replicaId MetaTrader account replica id to redeploy
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for redeployment
   */
  redeployAccountReplica(primaryAccountId: string, replicaId: string): Promise<any>

  /**
   * Stops and deletes an API server for a specified MetaTrader account. The terminal state such as downloaded market
   * data history will be deleted as well when you delete the account. (see
   * https://metaapi.cloud/docs/provisioning/api/account/deleteAccount/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deletion
   */
  deleteAccount(id: string): Promise<any>

  /**
   * Stops and deletes an API server for a specified MetaTrader account. The terminal state such as downloaded market
   * data history will be deleted as well when you delete the account. (see
   * https://metaapi.cloud/docs/provisioning/api/account/deleteAccountReplica/).
   * Method is accessible only with API access token
   * @param {string} primaryAccountId MetaTrader account id
   * @param {string} replicaId MetaTrader account replica id to undeploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deletion
   */
  deleteAccountReplica(primaryAccountId: string, replicaId: string): Promise<any>
  
  /**
   * Updates existing metatrader account data (see
   * https://metaapi.cloud/docs/provisioning/api/account/updateAccount/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @param {MetatraderAccountUpdateDto} account updated MetaTrader account
   * @return {Promise} promise resolving when MetaTrader account is updated
   */
  updateAccount(id: string, account: MetatraderAccountUpdateDto): Promise<any>

  /**
   * Updates existing metatrader account replica data (see
   * https://metaapi.cloud/docs/provisioning/api/account/updateAccountReplica/).
   * Method is accessible only with API access token
   * @param {string} primaryAccountId MetaTrader account id
   * @param {string} replicaId MetaTrader account replica id
   * @param {UpdatedMetatraderAccountReplicaDto} account updated MetaTrader account replica
   * @return {Promise} promise resolving when MetaTrader account replica is updated
   */
  updateAccountReplica(primaryAccountId: string, replicaId: string, account: UpdatedMetatraderAccountReplicaDto): Promise<any>
  
  /**
   * Increases MetaTrader account reliability. The account will be temporary stopped to perform this action. (see
   * https://metaapi.cloud/docs/provisioning/api/account/increaseReliability/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account reliability is increased
   */
  increaseReliability(id: string): Promise<any>
}

/**
 * Extension model
 */
export declare type Extension = {

  /**
   * extension id
   */
  id: string,

  /**
   * extension configuration
   */
  configuration: Object
}

/**
 * Account type
 */
export declare type Type = 'cloud' | 'self-hosted'

/**
 * Account state
 */
export declare type State = 'CREATED' | 'DEPLOYING' | 'DEPLOYED' | 'DEPLOY_FAILED' | 'UNDEPLOYING' | 'UNDEPLOYED' |
 'UNDEPLOY_FAILED' | 'DELETING' | 'DELETE_FAILED' | 'REDEPLOY_FAILED'

/**
 * MT version
 */
export declare type Version = 4 | 5

/**
 * Account connection status
 */
export declare type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'DISCONNECTED_FROM_BROKER'

/**
 * Account filter
 */
export declare type AccountsFilter = {

  /**
   * search offset (defaults to 0) (must be greater or equal to 0)
   */
  offset?: number,

  /**
   * search limit (defaults to 1000) 
   * (must be greater or equal to 1 and less or equal to 1000)
   */
  limit?: number,

  /**
   * MT version
   */
  version?: Array<Version> | Version,

  /**
   * account type
   */
  type?: Array<Type> | Type,

  /**
   * account state
   */
  state?: Array<State> | State,

  /**
   * connection status
   */
  connectionStatus?: Array<ConnectionStatus> | ConnectionStatus,

  /**
   * searches over _id, name, server and login to match query
   */
  query?: string,

  /**
   * provisioning profile id
   */
  provisioningProfileId?: string
}

/**
 * Metatrader account replica model
 */
export declare type MetatraderAccountReplicaDto = {

  /**
   * account unique identifier
   */
  _id: string,

  /**
   * MetaTrader account human-readable name in the MetaApi app
   */
  name: string,

  /**
   * account type, can be cloud, cloud-g1, cloud-g2 or self-hosted. Cloud and cloud-g2 are
   * aliases.
   */
  type: string,

  /**
   * MetaTrader account number
   */
  login: string,

  /**
   * MetaTrader server which hosts the account
   */
  server: string,

  /**
   * MT version
   */
  version: Version,

  /**
   * id of the account's provisioning profile
   */
  provisioningProfileId?: string,

  /**
   * application name to connect the account to. Currently allowed values are MetaApi and
   * AgiliumTrade
   */
  application: string,

  /**
   * MetaTrader magic to place trades using
   */
  magic: number,

  /**
   * account deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED,
   * DELETING
   */
  state: string,

  /**
   * terminal & broker connection status, one of CONNECTED, DISCONNECTED,
   * DISCONNECTED_FROM_BROKER
   */
  connectionStatus: string,

  /**
   * authorization token to be used for accessing single account data.
   * Intended to be used in browser API.
   */
  accessToken: string,

  /**
   * flag indicating if trades should be placed as manual trades. Default is false.
   * Supported on G2 only
   */
  manualTrades?: boolean,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds: number,

  /**
   * MetaTrader account tags
   */
  tags?: Array<string>,

  /**
   * extra information which can be stored together with your account
   */
  metadata?: Object,

  /**
   * used to increase the reliability of the account. Allowed values are regular and
   * high. Default is regular
   */
  reliability: string,

  /**
   * 3-character ISO currency code of the account base currency. Default value is USD.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   */
  baseCurrency?: string,

  /**
   * Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   */
  copyFactoryRoles?: Array<string>,

  /**
   * number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.  Default is 1.
   */
  resourceSlots?: number,

  /**
   * number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number,

  /**
   * any symbol provided by broker (required for G1 only) 
   */
  symbol?: string,

  /**
   * region id to deploy account at. One of returned by the /users/current/regions endpoint
   */
  region: string,

  /**
   * default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   */
  slippage?: number
}

/**
 * MetaTrader account model
 */
export declare type MetatraderAccountDto = {

  /**
   * account unique identifier
   */
  _id: string,

  /**
   * user id
   */
  userId: string,
  
  /**
   * MetaTrader account human-readable name in the MetaApi app
   */
  name: string,

  /**
   * account type, can be cloud, cloud-g1, cloud-g2 or self-hosted. Cloud and cloud-g2 are
   * aliases.
   */
  type: string,

  /**
   * MetaTrader account number
   */
  login: string,

  /**
   * MetaTrader server which hosts the account
   */
  server: string,

  /**
   * MT version
   */
  version: Version,

  /**
   * id of the account's provisioning profile
   */
  provisioningProfileId?: string,

  /**
   * application name to connect the account to. Currently allowed values are MetaApi and
   * AgiliumTrade
   */
  application: string,

  /**
   * MetaTrader magic to place trades using
   */
  magic: number,

  /**
   * account deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED,
   * DELETING
   */
  state: string,

  /**
   * terminal & broker connection status, one of CONNECTED, DISCONNECTED,
   * DISCONNECTED_FROM_BROKER
   */
  connectionStatus: string,

  /**
   * authorization token to be used for accessing single account data.
   * Intended to be used in browser API.
   */
  accessToken: string,

  /**
   * flag indicating if trades should be placed as manual trades. Default is false.
   * Supported on G2 only
   */
  manualTrades?: boolean,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds: number,

  /**
   * MetaTrader account tags
   */
  tags?: Array<string>,

  /**
   * extra information which can be stored together with your account
   */
  metadata?: Object,

  /**
   * used to increase the reliability of the account. Allowed values are regular and
   * high. Default is regular
   */
  reliability: string,

  /**
   * 3-character ISO currency code of the account base currency. Default value is USD.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   */
  baseCurrency?: string,

  /**
   * Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   */
  copyFactoryRoles?: Array<string>,

  /**
   * number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.  Default is 1.
   */
  resourceSlots?: number,

  /**
   * number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number,

  /**
   * any symbol provided by broker (required for G1 only) 
   */
  symbol?: string,

  /**
   * region id to deploy account at. One of returned by the /users/current/regions endpoint
   */
  region: string,

  /**
   * default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   */
  slippage?: number,

  /**
   * flag indicating that account is primary
   */
  primaryReplica?: boolean,

  /**
   * flag indicating that risk management API should be enabled on account. Default is false
   */
  riskManagementApiEnabled?: boolean,

  /**
   * MetaTrader account replicas
   */
  accountReplicas?: Array<MetatraderAccountReplicaDto>,

  /**
   * Active account connections
   */
  connections: Array<AccountConnection>
}

/**
 * Account connection
 */
export declare type AccountConnection = {

  /**
   * Region the account is connected at
   */
  region: string,

  /**
   * Availability zone the account is connected at
   */
  zone: string,

  /**
   * Application the account is connected to
   */
  application: string

}

/**
 * New MetaTrader account model
 */
export declare type NewMetatraderAccountDto = {

  /**
   * MetaTrader account human-readable name in the MetaApi app
   */
  name: string,

  /**
   * account type, can be cloud, cloud-g1, cloud-g2 or self-hosted. cloud-g2 and cloud are
   * aliases. When you create MT5 cloud account the type is automatically converted to cloud-g1 because MT5 G2 support
   * is still experimental. You can still create MT5 G2 account by setting type to cloud-g2.
   */
  type?: string,

  /**
   * MetaTrader account number
   */
  login: string,

  /**
   * MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features. Required for cloud account
   */
  password: string,

  /**
   * MetaTrader server which hosts the account
   */
  server: string,

  /**
   * Platform id (mt4 or mt5)
   */
  platform?: string

  /**
   * id of the account's provisioning profile
   */
  provisioningProfileId?: string,

  /**
   * application name to connect the account to. Currently allowed values are MetaApi and
   * AgiliumTrade
   */
  application: string,

  /**
   * MetaTrader magic to place trades using
   */
  magic: number,

  /**
   * flag indicating if trades should be placed as manual trades. Default is false
   */
  manualTrades?: boolean,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds?: number,

  /**
   * MetaTrader account tags
   */
  tags?: Array<string>,

  /**
   * extra information which can be stored together with your account
   */
  metadata?: Object,

  /**
   * used to increase the reliability of the account. Allowed values are regular and high. Default is regular
   */
  reliability?: string,

  /**
   * 3-character ISO currency code of the account base currency. Default value is USD.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   */
  baseCurrency?: string,

  /**
   * Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   */
  copyFactoryRoles?: Array<string>,

  /**
   * number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   */
  resourceSlots?: number,

  /**
   * any MetaTrader symbol your broker provides historical market data for. This value
   * should be specified for G1 accounts only and only in case your MT account fails to connect to broker
   */
  symbol?: string,

  /**
   * Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number,

  /**
   * region id to deploy account at. One of returned by the /users/current/regions endpoint
   */
  region?: string,

  /**
   * default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   */
  slippage?: number
}

/**
 * New MetaTrader account replica model
 */
 export declare type NewMetaTraderAccountReplicaDto = {

  /**
   * any MetaTrader symbol your broker provides historical market data for. This value
   * should be specified for G1 accounts only and only in case your MT account fails to connect to broker
   */
  symbol?: string,

  /**
   * MetaTrader magic to place trades using
   */
  magic: number,
  
  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds?: number,

  /**
   * MetaTrader account tags
   */
  tags?: Array<string>,

  /**
   * extra information which can be stored together with your account
   */
  metadata?: Object,

  /**
   * used to increase the reliability of the account. Allowed values are regular and high. Default is regular
   */
  reliability?: string,
  
  /**
   * number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   */
  resourceSlots?: number,

  /**
   * Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number,

  /**
   * region id to deploy account at. One of returned by the /users/current/regions endpoint
   */
  region?: string,

}

/**
 * MetaTrader account id model
 */
export declare type MetatraderAccountIdDto = {

  /**
   * MetaTrader account unique identifier
   */
  id: string
}

/**
 * Updated MetaTrader account data
 */
export declare type MetatraderAccountUpdateDto = {

  /**
   * MetaTrader account human-readable name in the MetaApi app
   */
  name: string,

  /**
   * MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features. Required for cloud account
   */
  password: string,

  /**
   * MetaTrader server which hosts the account
   */
  server: string,

  /**
   * MetaTrader magic to place trades using
   */
  magic: number,

  /**
   * flag indicating if trades should be placed as manual trades. Default is false
   */
  manualTrades?: boolean,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds?: number,

  /**
   * MetaTrader account tags
   */
  tags?: Array<string>,

  /**
   * API extensions
   */
  extensions?: Array<Extension>,

  /**
   * extra information which can be stored together with your account
   */
  metadata?: Object,

  /**
   * Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   */
  copyFactoryRoles?: Array<string>,

  /**
   * number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   */
  resourceSlots?: number
}

/**
 * Updated MetaTrader account replica data
 */
export declare type UpdatedMetatraderAccountReplicaDto = {

  /**
   * MetaTrader magic to place trades using
   */
  magic: number,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds?: number,

  /**
   * MetaTrader account tags
   */
  tags?: Array<string>,

  /**
   * extra information which can be stored together with your account
   */
  metadata?: Object,

  /**
   * number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   */
  resourceSlots?: number,

  /**
   * number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number
}