'use strict';

import should from 'should';
import OptionsValidator from './optionsValidator';


/**
 * @test {OptionsValidator#request}
 */
describe('OptionsValidator', () => {

  let validator;

  before(() => {
    validator = new OptionsValidator();
  });

  /**
   * @test {OptionsValidator#validateNumber}
   */
  describe('validateNumber', () => {

    /**
     * @test {OptionsValidator#validateNumber}
     */
    it('should validate option', () => {
      const value = validator.validateNumber(3, 5, 'opt');
      value.should.eql(3);
    });

    /**
     * @test {OptionsValidator#validateNumber}
     */
    it('should set option to default value if not specified', () => {
      const value = validator.validateNumber(undefined, 5, 'opt');
      value.should.eql(5);
    });

    /**
     * @test {OptionsValidator#validateNumber}
     */
    it('should allow zero value', () => {
      const value = validator.validateNumber(0, 5, 'opt');
      value.should.eql(0);
    });

    /**
     * @test {OptionsValidator#validateNumber}
     */
    it('should throw error if value is not number', () => {
      try {
        validator.validateNumber('test', 5, 'opt');
        should.not.exist('Should not exist this assertion');
      } catch (err) {
        err.name.should.eql('ValidationError');
        err.message.should.eql('Parameter opt must be a number');
      }
    });

    /**
     * @test {OptionsValidator#validateNumber}
     */
    it('should throw error if value negative', () => {
      try {
        validator.validateNumber(-3, 5, 'opt');
        should.not.exist('Should not exist this assertion');
      } catch (err) {
        err.name.should.eql('ValidationError');
        err.message.should.eql('Parameter opt cannot be lower than 0');
      }
    });

  });

  describe('validateNonZero', () => {

    /**
     * @test {OptionsValidator#validateNonZero}
     */
    it('should validate option', () => {
      const value = validator.validateNonZero(3, 5, 'opt');
      value.should.eql(3);
    });

    /**
     * @test {OptionsValidator#validateNonZero}
     */
    it('should set option to default value if not specified', () => {
      const value = validator.validateNonZero(undefined, 5, 'opt');
      value.should.eql(5);
    });

    /**
     * @test {OptionsValidator#validateNonZero}
     */
    it('should throw error if value is zero', () => {
      try {
        validator.validateNonZero(0, 5, 'opt');
        should.not.exist('Should not exist this assertion');
      } catch (err) {
        err.name.should.eql('ValidationError');
        err.message.should.eql('Parameter opt must be bigger than 0');
      }
    });

  });

  /**
   * @test {OptionsValidator#validateBoolean}
   */
  describe('validateBoolean', () => {

    /**
     * @test {OptionsValidator#validateBoolean}
     */
    it('should validate option', () => {
      const value = validator.validateBoolean(true, false, 'opt');
      value.should.eql(true);
    });

    /**
     * @test {OptionsValidator#validateBoolean}
     */
    it('should set option to default value if not specified', () => {
      const value = validator.validateBoolean(undefined, false, 'opt');
      value.should.eql(false);
    });

    /**
     * @test {OptionsValidator#validateBoolean}
     */
    it('should throw error if value is not boolean', () => {
      try {
        validator.validateBoolean('test', 5, 'opt');
        should.not.exist('Should not exist this assertion');
      } catch (err) {
        err.name.should.eql('ValidationError');
        err.message.should.eql('Parameter opt must be a boolean');
      }
    });
  });

});
