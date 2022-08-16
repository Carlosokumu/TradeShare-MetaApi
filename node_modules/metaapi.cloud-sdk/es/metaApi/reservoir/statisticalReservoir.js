import reservoir from './avlTreeReservoir';

/**
 * Statistical reservoir of a fixed size capable calculating percentiles
 * This reservoir is derived from https://www.npmjs.com/package/reservoir
 * and was integrated with an avl tree (https://www.npmjs.com/package/avl-sorted-list)
 */
export default class StatisticalReservoir {

  /**
   * Constructs reservoir
   * @param {number} size Reservoir size
   * @param {number} interval reservoir interval in milliseconds
   * @param {Function} randomNumberGen custom random generator
   */
  constructor(size, interval, randomNumberGen) {
    this.reservoir = reservoir(size, interval, randomNumberGen);
    this.length = this.reservoir.size();
  }

  /**
   * Add element to reservoir
   * @param {Number} data to add
   */
  pushMeasurement(data) {
    this.reservoir.pushSome(data);
    this.length = this.reservoir.size();
  }

  /**
   * Calculate percentile statistics for values stored in reservoir.
   * @param {Number} p - value in percents from 0 to 100
   * @return {Number} percentile value
   */
  getPercentile(p) {
    this.length = this.reservoir.size();
    return this.reservoir.getPercentile(p);
  }

  /**
   * Restore reservoir from saving data
   * @param {Object} value - stored value 
   */
  restoreValues(value) {
    this.reservoir.restoreValues(value);
  }

  /**
   * 
   * @return {Array} - reservoir array
   */
  toArray() {
    return this.reservoir.toArray();
  }

  toValueArray() {
    return this.reservoir.toValueArray();
  }
}
