/**
 * A class which records packets into log files
 */
export default class PacketLogger {
  
  /**
   * Constructs the class
   * @param {PacketLoggerOpts} opts packet logger options
   */
  constructor(opts: PacketLoggerOpts);
  
  /**
   * Processes packets and pushes them into save queue
   * @param {Object} packet packet to log
   */
  logPacket(packet: Object): void;
  
  /**
   * Returns log messages within date bounds as an array of objects
   * @param {string} accountId account id 
   * @param {Date} dateAfter date to get logs after
   * @param {Date} dateBefore date to get logs before
   * @returns {Array<Object>} log messages
   */
  readLogs(accountId: string, dateAfter: Date, dateBefore: Date): Promise<Array<Object>>;
  
  /**
   * Returns path for account log file
   * @param {string} accountId account id
   * @returns {string} file path
   */
  getFilePath(accountId: string): Promise<string>;
  
  /**
   * Initializes the packet logger
   */
  start(): void;
  
  /**
   * Deinitializes the packet logger
   */
  stop(): void;  
}

/**
 * Packet logger options
 */
declare type PacketLoggerOpts = {  

  /**
   * whether packet logger is enabled
   */
  enabled?: boolean,

  /**
   * maximum amount of files per account, default value is 12
   */
  fileNumberLimit?: number,

  /**
   * amount of logged hours per account file, default value is 4
   */
  logFileSizeInHours?: number,

  /**
   * whether to compress specifications packets, default value is true
   */
  compressSpecifications?: boolean,

  /**
   * whether to compress specifications packets, default value is true
   */
  compressPrices?: boolean
}