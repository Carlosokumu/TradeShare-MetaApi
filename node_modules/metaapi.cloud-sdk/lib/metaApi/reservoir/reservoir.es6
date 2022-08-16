'use strict';

/**
 * FIFO-like reservoir of a fixed size capable
 * calculating running sums, min/max, average, msdev and stddev
 * msdev and stddev calculation by Naive algorithm
 * (Mean square deviation) msdev = sqrt((∑{i = from 1 to n}(Xi)^2 -(∑{i = from 1 to n}Xi)^2 / N) / N)
 * (Standard deviation) stddev = sqrt((∑{i = from 1 to n}(Xi)^2 -(∑{i = from 1 to n}Xi)^2 / N) / N - 1)
 * link: https://goo.gl/MAEGP2
 */
export default class Reservoir {

  /**
   * Constructs Reservoir
   * @param {number} size Reservoir size
   * @param {number} observationIntervalInMS Reservoir observation Interval In ms
   */
  constructor(size, observationIntervalInMS, object) {
    if (!object) {
      this.array = new Array();
      this.size = size;
      this._interval = (observationIntervalInMS / size);
      this._queueEndTime = Date.now();
      this._fisrtQueueIndex = 0;
      this._intermediaryRecord = undefined;
      this.statistics = {
        count: 0,
        sum: 0,
        max: undefined,
        min: undefined,
        average: 0,
        sumOfSquares: 0,
        msdev: 0,
        stddev: 0
      };
    } else {
      this.array = object.array;
      this.size = object.size;
      this._interval = object._interval;
      this._queueEndTime = object._queueEndTime;
      this._fisrtQueueIndex = object._fisrtQueueIndex;
      this._intermediaryRecord = object._intermediaryRecord;
      this.statistics = this.checkStatisticsOnRestore(object.statistics);
    }
  }

  checkStatisticsOnRestore(statistics) {
    if (statistics.count === 0) {
      statistics = {
        count: 0,
        sum: 0,
        max: undefined,
        min: undefined,
        average: undefined,
        sumOfSquares: 0,
        msdev: undefined,
        stddev: undefined
      };
    } else if (statistics.count < 2) {
      statistics.msdev = undefined;
      statistics.stddev = undefined;
    }
    return statistics;
  }

  /**
   * Add element to Reservoir
   * @param {Number} data to add
   */
  pushMeasurement(data) {
    if (isFinite(data)) {
      this._updateQueue();
      this._updateIntermediaryRecord(data);
      this._updateStatisticsOnAdd(data);
    }
  }

  /**
   * return Reservoir statistics
   * @return {Object} Reservoir statistics
   */
  getStatistics() {
    this._updateQueue();
    return this.statistics;
  }

  toPlainObject() {
    this._updateQueue(true);
    return {
      array: this.array,
      size: this.size,
      _interval: this._interval,
      _queueEndTime: this._queueEndTime,
      _fisrtQueueIndex: this._fisrtQueueIndex,
      _intermediaryRecord: this._intermediaryRecord,
      statistics: this.statistics
    };
  }

  _updateQueue() {
    let intervalsCount = this._takeTimeIntervalsCount();
    let emptyElementsCount = this._takeEmptyElementsAddCount();
    if (emptyElementsCount > 0) {
      this._addRecord(emptyElementsCount);
      this._queueEndTime += intervalsCount * this._interval;
    }
  }

  _takeEmptyElementsAddCount() {
    let emptyElementsCount = this._takeTimeIntervalsCount();
    if (emptyElementsCount > this.size) {
      emptyElementsCount = this.size;
    }
    return emptyElementsCount;
  }

  _takeTimeIntervalsCount() {
    let timeNow = Date.now();
    let timeDiff = timeNow - this._queueEndTime;
    let timeIntervalsCount = Math.floor(timeDiff / this._interval);
    return timeIntervalsCount;
  }

  _updateRunningStatisticsOnRemove(removeCount) {
    let removeElementIndex = this._fisrtQueueIndex + 1;
    for (let i = 0; i < removeCount; i++) {
      if (removeElementIndex >= this.size) {
        removeElementIndex = 0;
      }

      this._updateStatisticsOnRemove(this.array[removeElementIndex], removeElementIndex);
      this.array[removeElementIndex] = {
        count: 0,
        sum: 0,
        max: undefined,
        min: undefined,
        average: 0,
        sumOfSquares: 0
      };
      removeElementIndex++;
    }
    removeElementIndex--;
    if (removeElementIndex < 0) {
      removeElementIndex = this.size - 1;
    }
    return removeElementIndex;
  }

  _updateStatisticsOnRemove(removeElement, removeElementIndex) {
    if (removeElement !== undefined && removeElement !== null) {
      this.statistics.count -= removeElement.count;
      this.statistics.sumOfSquares -= removeElement.sumOfSquares;
      this.statistics.sum -= removeElement.sum;
      this._updateStatisticsMinAndMaxOnRemove(removeElement, removeElementIndex);
      if (this.statistics.count > 0) {
        this.statistics.average = this.statistics.sum / this.statistics.count;
        if (this.statistics.count > 1) {
          let difOfSums = this._calculateDifferenceOfSums(this.statistics.sumOfSquares,
            this.statistics.sum, this.statistics.count);
          this.statistics.msdev = parseFloat(Math.sqrt(difOfSums / this.statistics.count));
          this.statistics.stddev = parseFloat(Math.sqrt(difOfSums / (this.statistics.count - 1)));
        } else {
          this.statistics.stddev = undefined;
          this.statistics.msdev = undefined;
        }
      } else {
        this.statistics.average = undefined;
        this.statistics.stddev = undefined;
        this.statistics.msdev = undefined;
      }
    }
  }

  _updateStatisticsMinAndMaxOnRemove(removeElement, removeElementIndex) {
    if (removeElement.max !== undefined && removeElement.max === this.statistics.max) {
      this.statistics.max = this._findMax(removeElementIndex);
    }

    if (removeElement.min !== undefined && removeElement.min === this.statistics.min) {
      this.statistics.min = this._findMin(removeElementIndex);
    }
  }

  _updateStatisticsOnAdd(el) {
    if (el !== undefined && el !== null) {
      this.statistics.count += 1;
      this.statistics.sum += el;
      this._updateStatisticsMinAndMaxOnAdd(el);
      this.statistics.sumOfSquares += Math.pow(el, 2);
      if (this.statistics.count > 0) {
        this.statistics.average = this.statistics.sum / this.statistics.count;
        let difOfSums = this._calculateDifferenceOfSums(this.statistics.sumOfSquares,
          this.statistics.sum, this.statistics.count);
        if (this.statistics.count > 1) {
          this.statistics.msdev = parseFloat(Math.sqrt(difOfSums / this.statistics.count));
          this.statistics.stddev = parseFloat(Math.sqrt(difOfSums / (this.statistics.count - 1)));
        } else {
          this.statistics.msdev = undefined;
          this.statistics.stddev = undefined;
        }
      }
    }
  }

  _updateStatisticsMinAndMaxOnAdd(el) {
    if (this.statistics.max < el || this.statistics.max === undefined || this.statistics.max === null) {
      this.statistics.max = el;
    }
    if (this.statistics.min > el || this.statistics.min === undefined || this.statistics.min === null) {
      this.statistics.min = el;
    }
  }

  _addRecord(emptyElementsCount) {
    if (this._intermediaryRecord !== undefined) {
      this.array[this._fisrtQueueIndex] = this._intermediaryRecord;
      this._intermediaryRecord = undefined;
    }
    let curIndexInArray = this._updateRunningStatisticsOnRemove(emptyElementsCount);
    this._fisrtQueueIndex = curIndexInArray;
  }

  _calculateDifferenceOfSums(sum1, sum2, count) {
    let dif = sum1 - Math.pow(sum2, 2) / count;
    return dif;
  }

  _updateIntermediaryRecord(el) {
    if (this._intermediaryRecord === undefined) {
      this._intermediaryRecord = {
        count: 1,
        sum: el,
        max: el,
        min: el,
        average: el,
        sumOfSquares: Math.pow(el, 2)
      };
    } else {
      if (this._intermediaryRecord.max < el) {
        this._intermediaryRecord.max = el;
      }
      if (this._intermediaryRecord.min > el) {
        this._intermediaryRecord.min = el;
      }
      this._intermediaryRecord.count += 1;
      this._intermediaryRecord.sum += el;
      this._intermediaryRecord.sumOfSquares += Math.pow(el, 2);
    }
  }

  _findMin(index) {
    let min = Infinity;
    this.array.forEach((el, i) => {
      if (el !== null && el !== undefined && el.min !== undefined && el.min < min && i !== index) {
        min = el.min;
      }
    });
    if (min === Infinity) {
      return (this._intermediaryRecord !== undefined) ? this._intermediaryRecord.min : undefined;
    }
    return min;
  }

  _findMax(index) {
    let max = -Infinity;

    this.array.forEach((el, i) => {
      if (el !== null && el !== undefined && el.max !== undefined && el.max > max && i !== index) {
        max = el.max;
      }
    });
    if (max === -Infinity) {
      return (this._intermediaryRecord !== undefined) ? this._intermediaryRecord.max : undefined;
    }
    return max;
  }
}
