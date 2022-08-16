'use strict';
import fs from 'fs-extra';
import moment from 'moment';
import OptionsValidator from '../optionsValidator';
import LoggerManager from '../../logger';

/**
 * Packet logger options
 * @typedef {Object} PacketLoggerOpts
 * @property {Boolean} [enabled] whether packet logger is enabled
 * @property {Number} [fileNumberLimit] maximum amount of files per account, default value is 12
 * @property {Number} [logFileSizeInHours] amount of logged hours per account file, default value is 4
 * @property {Boolean} [compressSpecifications] whether to compress specifications packets, default value is true
 * @property {Boolean} [compressPrices] whether to compress specifications packets, default value is true
 */

/**
 * A class which records packets into log files
 */
export default class PacketLogger {

  /**
   * Constructs the class
   * @param {PacketLoggerOpts} opts packet logger options
   */
  constructor(opts) {
    const validator = new OptionsValidator();
    opts = opts || {};
    this._fileNumberLimit = validator.validateNonZero(opts.fileNumberLimit, 12, 'packetLogger.fileNumberLimit');
    this._logFileSizeInHours = validator.validateNonZero(opts.logFileSizeInHours, 4,
      'packetLogger.logFileSizeInHours');
    this._compressSpecifications = validator.validateBoolean(opts.compressSpecifications, true,
      'packetLogger.compressSpecifications');
    this._compressPrices =  validator.validateBoolean(opts.compressPrices, true, 'packetLogger.compressPrices');
    this._previousPrices = {};
    this._lastSNPacket = {};
    this._writeQueue = {};
    this._root = './.metaapi/logs';
    this._logger = LoggerManager.getLogger('PacketLogger');
    fs.ensureDir(this._root);
  }

  _ensurePreviousPriceObject(accountId) {
    if(!this._previousPrices[accountId]) {
      this._previousPrices[accountId] = {};
    }
  }

  /**
   * Processes packets and pushes them into save queue
   * @param {Object} packet packet to log
   */
  // eslint-disable-next-line complexity
  logPacket(packet) {
    const instanceIndex = packet.instanceIndex || 0;
    if(!this._writeQueue[packet.accountId]) {
      this._writeQueue[packet.accountId] = {isWriting: false, queue: []};
    }
    if(packet.type === 'status') {
      return;
    }
    if(!this._lastSNPacket[packet.accountId]) {
      this._lastSNPacket[packet.accountId] = {};
    }
    if(['keepalive', 'noop'].includes(packet.type)) {
      this._lastSNPacket[packet.accountId][instanceIndex] = packet;
      return;
    }
    const queue = this._writeQueue[packet.accountId].queue;
    if(!this._previousPrices[packet.accountId]) {
      this._previousPrices[packet.accountId] = {};
    }
    
    const prevPrice = this._previousPrices[packet.accountId][instanceIndex];
    
    if(packet.type !== 'prices') {
      if(prevPrice) {
        this._recordPrices(packet.accountId, instanceIndex);
      }
      if(packet.type === 'specifications' && this._compressSpecifications) {
        queue.push(JSON.stringify({type: packet.type, sequenceNumber: packet.sequenceNumber, 
          sequenceTimestamp: packet.sequenceTimestamp, instanceIndex}));
      } else {
        queue.push(JSON.stringify(packet));
      }
    } else {
      if(!this._compressPrices) {
        queue.push(JSON.stringify(packet));
      } else {
        if(prevPrice) {
          const validSequenceNumbers = [prevPrice.last.sequenceNumber, prevPrice.last.sequenceNumber + 1];
          if(this._lastSNPacket[packet.accountId][instanceIndex]) {
            validSequenceNumbers.push(this._lastSNPacket[packet.accountId][instanceIndex].sequenceNumber + 1);
          }
          if(!validSequenceNumbers.includes(packet.sequenceNumber)) {
            this._recordPrices(packet.accountId, instanceIndex);
            this._ensurePreviousPriceObject(packet.accountId);
            this._previousPrices[packet.accountId][instanceIndex] = {first: packet, last: packet};
            queue.push(JSON.stringify(packet));
          } else {
            this._previousPrices[packet.accountId][instanceIndex].last = packet;
          }
        } else {
          this._ensurePreviousPriceObject(packet.accountId);
          this._previousPrices[packet.accountId][instanceIndex] = {first: packet, last: packet};
          queue.push(JSON.stringify(packet));
        }
      }
    }
  }

  /**
   * Returns log messages within date bounds as an array of objects
   * @param {String} accountId account id 
   * @param {Date} dateAfter date to get logs after
   * @param {Date} dateBefore date to get logs before
   * @returns {Array<Object>} log messages
   */
  async readLogs(accountId, dateAfter, dateBefore) {
    const folders = await fs.readdir(this._root);
    const packets = [];
    for (let folder of folders) {
      const filePath = `${this._root}/${folder}/${accountId}.log`;
      if(await fs.pathExists(filePath)) {
        const contents = await fs.readFile(filePath, 'utf8');
        let messages = contents.split('\r\n').filter(message => message.length).map(message => {
          return {date: new Date(message.slice(1, 24)), message: message.slice(26)};
        });
        if(dateAfter) {
          messages = messages.filter(message => message.date > dateAfter);
        }
        if(dateBefore) {
          messages = messages.filter(message => message.date < dateBefore);
        }
        packets.push(...messages);
      }
    }

    return packets;
  }

  /**
   * Returns path for account log file
   * @param {String} accountId account id
   * @returns {String} file path
   */
  async getFilePath(accountId) {
    const fileIndex = Math.floor(new Date().getHours() / this._logFileSizeInHours);
    const folderName = `${moment().format('YYYY-MM-DD')}-${fileIndex > 9 ? fileIndex : '0' + fileIndex}`;
    await fs.ensureDir(`${this._root}/${folderName}`);
    return `${this._root}/${folderName}/${accountId}.log`;
  }

  /**
   * Initializes the packet logger
   */
  start() {
    this._previousPrices = {};
    if (!this._recordInteval) {
      this._recordInteval = setInterval(() => this._appendLogs(), 1000);
      this._deleteOldLogsInterval = setInterval(() => this._deleteOldData(), 10000);
    }
  }

  /**
   * Deinitializes the packet logger
   */
  stop() {
    clearInterval(this._recordInteval);
    clearInterval(this._deleteOldLogsInterval);
  }

  /**
   * Records price packet messages to log files
   * @param {String} accountId account id
   */
  _recordPrices(accountId, instanceNumber) {
    const prevPrice = this._previousPrices[accountId][instanceNumber] || {first: {}, last:{}};
    const queue = this._writeQueue[accountId].queue;
    delete this._previousPrices[accountId][instanceNumber];
    if(!Object.keys(this._previousPrices[accountId]).length) {
      delete this._previousPrices[accountId];
    }
    if(prevPrice.first.sequenceNumber !== prevPrice.last.sequenceNumber) {
      queue.push(JSON.stringify(prevPrice.last));
      queue.push(`Recorded price packets ${prevPrice.first.sequenceNumber}` +
        `-${prevPrice.last.sequenceNumber}, instanceIndex: ${instanceNumber}`);
    }
  }

  /**
   * Writes logs to files
   */
  async _appendLogs() {
    Object.keys(this._writeQueue).forEach(async accountId => {
      const queue = this._writeQueue[accountId];
      if (!queue.isWriting && queue.queue.length) {
        queue.isWriting = true;
        try {
          const filePath = await this.getFilePath(accountId);
          const writeString = queue.queue.reduce((a,b) => a + 
          `[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${b}\r\n` ,'');
          queue.queue = [];
          await fs.appendFile(filePath, writeString);  
        } catch(err) {
          this._logger.error(`${accountId}: Failed to record packet log`, err);
        }
        queue.isWriting = false;
      }
    });
  }

  /**
   * Deletes folders when the folder limit is exceeded
   */
  async _deleteOldData() {
    const contents = await fs.readdir(this._root);
    contents.reverse().slice(this._fileNumberLimit).forEach(async folderName => {
      await fs.remove(`${this._root}/${folderName}`); 
    });
  }

}
