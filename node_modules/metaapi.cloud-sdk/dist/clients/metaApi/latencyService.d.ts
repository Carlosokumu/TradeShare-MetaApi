import MetaApiWebsocketClient from "./metaApiWebsocket.client"

/**
 * Service for managing account replicas based on region latency
 */
 export default class LatencyService {

    /**
     * Constructs latency service instance
     * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
     * @param {string} token authorization token
     * @param {number} connectTimeout websocket connect timeout in seconds
     */
    constructor(websocketClient: MetaApiWebsocketClient, token: string, connectTimeout: number);

    /**
     * Returns the list of regions sorted by latency
     * @returns {string[]} list of regions sorted by latency
     */
    get regionsSortedByLatency(): string[];

    /**
     * Invoked when an instance has been disconnected
     * @param {string} instanceId instance id
     */
    onDisconnected(instanceId: string): Promise<void>;

    /**
     * Invoked when an account has been unsubscribed
     * @param {string} accountId account id
     */
    onUnsubscribe(accountId: string): void;

    /**
     * Invoked when an instance has been connected
     * @param {string} instanceId instance id
     */
    onConnected(instanceId: string): Promise<void>;

    /**
     * Invoked when an instance has been synchronized
     * @param {string} instanceId instance id
     */
    onDealsSynchronized(instanceId: string): Promise<void>;

    /**
     * Returns the list of currently connected account instances
     * @param {string} accountId account id
     * @returns {string[]} list of connected account instances
     */
    getActiveAccountInstances(accountId: string): string[];

    /**
     * Returns the list of currently synchronized account instances
     * @param {string} accountId account id
     * @returns {string[]} list of synchronized account instances
     */
    getSynchronizedAccountInstances(accountId: string): string[];

}