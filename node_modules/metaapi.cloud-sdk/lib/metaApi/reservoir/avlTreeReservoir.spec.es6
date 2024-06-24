import should from 'should';
import reservoir from './avlTreeReservoir';
import sinon from 'sinon';

/**
 * @test {Reservoir}
 */
describe('Reservoir', () => {

  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  /**
   * @test {Reservoir#pushSome}
   */
  it('should be able to accumulate measurements', () => {
    var res = reservoir(3);
    res.pushSome('test1');
    res.pushSome('test2');
    res.size().should.eql(2);
    res.at(0).data.should.eql('test1');
    res.at(1).data.should.eql('test2');
  });

  /**
   * @test {Reservoir#pushSome}
   */
  it('should randomly remove old elements from Reservoir', () => {
    var res = reservoir(3);
    res.pushSome(5);
    res.pushSome(4);
    res.pushSome(3);
    res.pushSome(2);
    res.pushSome(1);
    res.size().should.eql(3);
  });

  /**
   * @test {Reservoir#getPercentile}
   */

  it('should calculate percentiles when Reservoir has 5 elements', () => {
    var res = reservoir(5);
    let data = [5, 1, 3, 2, 4];
    data.forEach(function(e) {
      res.pushSome(e);
    });

    let pers1 = res.getPercentile(75.13);
    let pers2 = res.getPercentile(75.1);
    let pers3 = res.getPercentile(0.05);
    let pers4 = res.getPercentile(50);
    let pers5 = res.getPercentile(75);

    pers1.should.eql(4.0052);
    pers2.should.eql(4.004);
    pers3.should.eql(1.002);
    pers4.should.eql(3);
    pers5.should.eql(4);
  });

  /**
   * @test {Reservoir#removeOldRecords}
   */
  it('should return percentiles for actual records only', () => {
    var res = reservoir(15, 60000);
    [5, 15, 20, 35, 40, 50].forEach(item => {
      res.pushSome(item);
      clock.tick(10001);
    });
    let pers50 = res.getPercentile(50);
    pers50.should.eql(35);
  });

  it('should run X algorithm', () => {
    var res = reservoir(15, 60000);
    for (let i = 0; i < 1000; i++) {
      let item = Math.random();
      res.pushSome(item);
      clock.tick(1001);
    }
    sinon.assert.match(res.size(), 15);
    const max = res.max();
    max.index.should.be.approximately(999, 2);
    max.time.should.be.approximately(999999, 3000);
    clock.tick(60000);
    res.getPercentile(0);
    sinon.assert.match(res.size(), 0);
  });

  it('should run Z algorithm', () => {
    var res = reservoir(10, 60000);
    for (let i = 0; i < 3000; i++) {
      let item = Math.random();
      res.pushSome(item);
      clock.tick(100);
    }
    sinon.assert.match(res.size(), 10);
  });

});
