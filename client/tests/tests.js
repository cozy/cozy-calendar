(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.brunch = true;
})();

var createSinonServer;

createSinonServer = function() {
  var createAutoResponse, server;

  this.server = server = sinon.fakeServer.create();
  createAutoResponse = function(method, url, code, JSONResponder) {
    return server.respondWith(method, url, function(req) {
      var body, headers, res;

      body = JSON.parse(req.requestBody);
      res = JSONResponder(req, body);
      headers = {
        'Content-Type': 'application/json'
      };
      return req.respond(code, headers, JSON.stringify(res));
    });
  };
  this.server.checkLastRequestIs = function(method, url) {
    var req;

    req = server.requests[server.requests.length - 1];
    expect(req.url).to.equal(url);
    return expect(req.method).to.equal(method);
  };
  return this.server;
};
;
describe('helpers', function() {
  var fixtures, helpers;

  helpers = require('helpers');
  fixtures = {
    invalidDates: ['15/04/20#09:40', '15/2013#09:40', 'azdza#09:40', '#09:40', '1//#09:40'],
    invalidTimes: ['15/04/2013#', '15/04/2013#3:1', '15/04/2013#3:13', '15/04/2013#31:', '15/04/2013#:'],
    invalidICal: ['20130415094000Z', '20130415T094000', '20130415094000'],
    invalidICalDates: ['undefinedT094000Z', '201415T094000Z'],
    invalidICalTimes: ['20130415T0940Z', '20130415TundefinedZ', '20130415TZ']
  };
  describe('.formatDateISO8601', function() {
    it('should return a valid iso8601 full date if the input is correct', function() {
      var expected, given;

      given = '15/04/2013#09:40';
      expected = '2013-04-15T09:40:00';
      return expect(helpers.formatDateISO8601(given)).to.equal(expected);
    });
    it('should return an undefined date part if the date is incorrect', function() {
      var expected;

      expected = 'undefinedT09:40:00';
      return fixtures.invalidDates.forEach(function(item) {
        return expect(helpers.formatDateISO8601(item)).to.equal(expected);
      });
    });
    return it('should return an undefined time part if the time is incorrect', function() {
      var expected;

      expected = '2013-04-15Tundefined';
      return fixtures.invalidTimes.forEach(function(item) {
        return expect(helpers.formatDateISO8601(item)).to.equal(expected);
      });
    });
  });
  describe('.isDatePartValid', function() {
    it('should be true if the date part is valid', function() {
      return fixtures.invalidICalTimes.forEach(function(item) {
        return expect(helpers.isDatePartValid(item)).to.equal(true);
      });
    });
    return it('should be false if the date part is not valid', function() {
      return fixtures.invalidICalDates.forEach(function(item) {
        return expect(helpers.isDatePartValid(item)).to.equal(false);
      });
    });
  });
  describe('.isTimePartvalid', function() {
    it('should be true if the time part is valid', function() {
      return fixtures.invalidICalDates.forEach(function(item) {
        return expect(helpers.isTimePartValid(item)).to.equal(true);
      });
    });
    return it('should be false if the time part is not valid', function() {
      return fixtures.invalidICalTimes.forEach(function(item) {
        return expect(helpers.isTimePartValid(item)).to.equal(false);
      });
    });
  });
  return describe('.icalToISO8601', function() {
    return it('should return a valid full date', function() {
      var expected, given;

      given = '20130415T094000Z';
      expected = '2013-04-15T09:40Z';
      return expect(helpers.icalToISO8601(given)).to.equal(expected);
    });
  });
});
;
