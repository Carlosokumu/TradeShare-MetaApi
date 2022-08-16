'use strict';

import AvlTree from './avlTree';

/* jscs:disable */
/* eslint-disable */
const Reservoir = (function () {

  var switchToAlgorithmZConstant = 22;
  var debug = 'none';

  /**
   * Statistical reservoir of a fixed size capable calculating percentile
   * This reservoir taken from https://www.npmjs.com/package/reservoir
   * This reservoir has been modified by avl tree (https://www.npmjs.com/package/avl-sorted-list)
   * Array which contains all data was removed and instead of it add tree
   */
  function _Reservoir(reservoirSize, storagePeriodInMilliseconds, randomNumberGen) {
    let interval = storagePeriodInMilliseconds;
    var rng = randomNumberGen || Math.random;
    var reservoirSize = Math.max(1, (Math.floor(reservoirSize) >> 0) || 1);
    var totalItemCount = 0;
    var lastDeletedIndex = -1;
    var numToSkip = -1;
    var currentAlgorithm = algorithmX;
    var switchThreshold =
      switchToAlgorithmZConstant * reservoirSize;

    if (debug === 'R') {
      currentAlgorithm = algorithmR;
    } else if (debug === 'X') {
      switchThreshold = Infinity;
    } else if (debug === 'Z') {
      currentAlgorithm = algorithmZ;
    }

    var algorithmXCount = 0;
    var W = Math.exp(-Math.log(rng()) / reservoirSize);
    var evictNext = null;

    let indexTree = new AvlTree(function (a, b) {
      return a.index - b.index;
    });

    let valueTree = new AvlTree(function (a, b) {
      return a - b;
    });
    let initialIndex = 0;

    indexTree.removeOldRecords = function () {
      while (true) {
        let element = this.at(0);
        if (element !== null && Date.now() > element.time + interval) {
          this.removeAt(0);
          var deletedIndexDiff = element.index - lastDeletedIndex;
          lastDeletedIndex = element.index;
          valueTree.remove(element.data);
          totalItemCount -= deletedIndexDiff;
          algorithmXCount = Math.max(0, algorithmXCount - deletedIndexDiff);
        } else {
          break;
        }
      }
    };

    indexTree.getPercentile = function () {
      let percent = arguments[0];
      this.removeOldRecords();
      const index = (this.size() - 1) * percent / 100;
      const lower = Math.floor(index);
      const fractionPart = index - lower;
      let percentile = valueTree.at(lower);
      if (fractionPart > 0) {
        percentile += fractionPart * (valueTree.at(lower + 1) - valueTree.at(lower));
      }
      return parseFloat(percentile);
    };

    indexTree.pushSome = function () {
      let len = Math.min(this.size(), reservoirSize);
      for (var i = 0; i < arguments.length; i++) {
        this.removeOldRecords();
        var value = {index: initialIndex, time: Date.now(), data: arguments[i]};
        addSample.call(this, value);
        initialIndex++;
      }
      return len;
    };

    indexTree.fromPlainObject = function () {
      let len = Math.min(this.size(), reservoirSize);
      for (var i = 0; i < arguments.length; i++) {
        var value = {index: arguments[i].index, time: arguments[i].time, data: arguments[i].data};
        addSample.call(this, value);
        initialIndex++;
      }
      return len;
    };

    var addSample = function (sample) {
      if (this.size() < reservoirSize) {
        this.insert(sample);
        valueTree.insert(sample.data);
      } else {
        if (numToSkip < 0) {
          numToSkip = currentAlgorithm();
        }
        if (numToSkip === 0) {
          replaceRandomSample(sample, this);
        }
        numToSkip--;
      }
      totalItemCount++;
      return this;
    };

    function replaceRandomSample(sample, reservoir) {
      var randomIndex;
      if (evictNext !== null) {
        randomIndex = evictNext;
        evictNext = null;
      } else {
        randomIndex = Math.floor(rng() * reservoirSize);
      }
      let value = reservoir.at(randomIndex);
      reservoir.removeAt(randomIndex);
      valueTree.remove(value.data);
      valueTree.insert(sample.data);
      reservoir.insert(sample);
    }

    /**
     * "Algorithm R"
     * Selects random elements from an unknown-length input.
     * Has a time-complexity of: O(N)
     * Number of random numbers required:
     * N - n
     * Where:
     * n = the size of the reservoir
     * N = the size of the input
     */
    function algorithmR() {
      var localItemCount = totalItemCount + 1,
        randomValue = Math.floor(rng() * localItemCount),
        toSkip = 0;

      while (randomValue >= reservoirSize) {
        toSkip++;
        localItemCount++;
        randomValue = Math.floor(rng() * localItemCount);
      }
      evictNext = randomValue;
      return toSkip;
    }

    /** "Algorithm X"
     * Selects random elements from an unknown-length input.
     * Has a time-complexity of: O(N)
     * Number of random numbers required:
     *  2 * n * ln( N / n )
     * Where:
     *  n = the size of the reservoir
     *  N = the size of the input
     */
    function algorithmX() {
      var localItemCount = totalItemCount,
        randomValue = rng(),
        toSkip = 0,
        quotient;

      if (totalItemCount <= switchThreshold) {
        localItemCount++;
        algorithmXCount++;
        quotient = algorithmXCount / localItemCount;

        while (quotient > randomValue) {
          toSkip++;
          localItemCount++;
          algorithmXCount++;
          quotient = (quotient * algorithmXCount) / localItemCount;
        }
        return toSkip;
      } else {
        currentAlgorithm = algorithmZ;
        return currentAlgorithm();
      }
    }

    /** "Algorithm Z"
     * Selects random elements from an unknown-length input.
     * Has a time-complexity of:
     *  O(n(1 + log (N / n)))
     * Number of random numbers required:
     *  2 * n * ln( N / n )
     * Where:
     *  n = the size of the reservoir
     *  N = the size of the input
     */
    function algorithmZ() {
      var term = totalItemCount - reservoirSize + 1,
        denom,
        numer,
        numer_lim;

      while (true) {
        var randomValue = rng();
        var x = totalItemCount * (W - 1);
        var toSkip = Math.floor(x);

        var subterm = ((totalItemCount + 1) / term);
        subterm *= subterm;
        var termSkip = term + toSkip;
        var lhs = Math.exp(Math.log(((randomValue * subterm) * termSkip) / (totalItemCount + x)) / reservoirSize);
        var rhs = (((totalItemCount + x) / termSkip) * term) / totalItemCount;

        if (lhs <= rhs) {
          W = rhs / lhs;
          break;
        }

        var y = (((randomValue * (totalItemCount + 1)) / term) * (totalItemCount + toSkip + 1)) / (totalItemCount + x);

        if (reservoirSize < toSkip) {
          denom = totalItemCount;
          numer_lim = term + toSkip;
        } else {
          denom = totalItemCount - reservoirSize + toSkip;
          numer_lim = totalItemCount + 1;
        }

        for (numer = totalItemCount + toSkip; numer >= numer_lim; numer--) {
          y = (y * numer) / denom;
          denom--;
        }

        W = Math.exp(-Math.log(rng()) / reservoirSize);

        if (Math.exp(Math.log(y) / reservoirSize) <= (totalItemCount + x) / totalItemCount) {
          break;
        }
      }
      return toSkip;
    }
    return indexTree;
  }
  return _Reservoir;
}());

export default Reservoir;
