(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var has = ({}).hasOwnProperty;

  var aliases = {};

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf('components/' === 0)) {
        start = 'components/'.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return 'components/' + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var expand = (function() {
    var reg = /^\.\.?(\/|$)/;
    return function(root, name) {
      var results = [], parts, part;
      parts = (reg.test(name) ? root + '/' + name : name).split('/');
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
  })();
  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  globals.require = require;
})();
require.register("application", function(exports, require, module) {
module.exports = {
  initialize: function() {
    return $.get("users/current?keys=timezone", (function(_this) {
      return function(data) {
        _this.timezone = data;
        return _this._initialize();
      };
    })(this));
  },
  _initialize: function() {
    var CalendarsCollection, ContactCollection, EventCollection, Header, Menu, Router, SocketListener, TagCollection, e, locales, todayChecker;
    window.app = this;
    this.locale = window.locale;
    delete window.locale;
    this.polyglot = new Polyglot();
    try {
      locales = require('locales/' + this.locale);
    } catch (_error) {
      e = _error;
      locales = require('locales/en');
    }
    this.polyglot.extend(locales);
    window.t = this.polyglot.t.bind(this.polyglot);
    moment.locale(this.locale);
    Router = require('router');
    Menu = require('views/menu');
    Header = require('views/calendar_header');
    SocketListener = require('../lib/socket_listener');
    TagCollection = require('collections/tags');
    EventCollection = require('collections/events');
    ContactCollection = require('collections/contacts');
    CalendarsCollection = require('collections/calendars');
    this.tags = new TagCollection();
    this.events = new EventCollection();
    this.contacts = new ContactCollection();
    this.calendars = new CalendarsCollection();
    this.router = new Router();
    this.menu = new Menu({
      collection: this.calendars
    });
    this.menu.render().$el.prependTo('body');
    SocketListener.watch(this.events);
    if (window.inittags != null) {
      this.tags.reset(window.inittags);
      delete window.inittags;
    }
    if (window.initevents != null) {
      this.events.reset(window.initevents);
      delete window.initevents;
    }
    if (window.initcontacts) {
      this.contacts.reset(window.initcontacts);
      delete window.initcontacts;
    }
    Backbone.history.start();
    todayChecker = require('../lib/today_checker');
    todayChecker(this.router);
    if (typeof Object.freeze === 'function') {
      return Object.freeze(this);
    }
  },
  isMobile: function() {
    return $('ul#menu').height() === 40;
  }
};
});

;require.register("collections/calendars", function(exports, require, module) {
var CalendarCollection, SocketListener, Tag, TagCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

SocketListener = require('../lib/socket_listener');

Tag = require('models/tag');

TagCollection = require('collections/tags');

module.exports = CalendarCollection = (function(_super) {
  var stringify;

  __extends(CalendarCollection, _super);

  function CalendarCollection() {
    return CalendarCollection.__super__.constructor.apply(this, arguments);
  }

  CalendarCollection.prototype.model = Tag;

  CalendarCollection.prototype.initialize = function() {
    this.eventCollection = app.events;
    this.listenTo(this.eventCollection, 'add', this.onBaseCollectionAdd);
    this.listenTo(this.eventCollection, 'change:tags', this.onBaseCollectionChange);
    this.listenTo(this.eventCollection, 'remove', this.onBaseCollectionRemove);
    this.listenTo(this.eventCollection, 'reset', this.resetFromBase);
    return this.resetFromBase();
  };

  CalendarCollection.prototype.resetFromBase = function() {
    this.reset([]);
    return this.eventCollection.each((function(_this) {
      return function(model) {
        return _this.onBaseCollectionAdd(model);
      };
    })(this));
  };

  CalendarCollection.prototype.onBaseCollectionChange = function(model) {
    return this.resetFromBase();
  };

  CalendarCollection.prototype.onBaseCollectionAdd = function(model) {
    var calendar, calendarName, tags, _ref;
    _ref = model.get('tags'), calendarName = _ref[0], tags = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
    calendar = app.tags.getOrCreateByName(calendarName);
    calendar.set('visible', true);
    this.add(calendar);
    if (calendar.isNew()) {
      app.tags.add(calendar);
      return calendar.save();
    }
  };

  CalendarCollection.prototype.onBaseCollectionRemove = function(model) {
    return this.resetFromBase();
  };

  CalendarCollection.prototype._pauseModels = function(models, options) {
    return models.forEach(function(model) {
      return SocketListener.pause(model, null, options);
    });
  };

  CalendarCollection.prototype._resumeModels = function(models, options) {
    return models.forEach(function(model) {
      return SocketListener.resume(model, null, options);
    });
  };

  CalendarCollection.prototype.remove = function(calendarName, callback) {
    var eventsToRemove, options;
    eventsToRemove = this.eventCollection.getByCalendar(calendarName);
    options = {
      ignoreMySocketNotification: true
    };
    this._pauseModels(eventsToRemove, options);
    return $.ajax('events/delete', {
      type: 'DELETE',
      data: {
        calendarName: calendarName
      },
      success: (function(_this) {
        return function() {
          _this.eventCollection.remove(eventsToRemove);
          callback();
          return _this._resumeModels(eventsToRemove, options);
        };
      })(this),
      error: (function(_this) {
        return function() {
          _this._resumeModels(eventsToRemove, options);
          return callback(t('server error occured'));
        };
      })(this)
    });
  };

  CalendarCollection.prototype.rename = function(oldName, newName, callback) {
    var eventsToChange, options;
    options = {
      ignoreMySocketNotification: true
    };
    eventsToChange = this.eventCollection.getByCalendar(oldName);
    this._pauseModels(eventsToChange, options);
    return $.ajax('events/rename-calendar', {
      type: 'POST',
      data: {
        oldName: oldName,
        newName: newName
      },
      success: (function(_this) {
        return function(data) {
          _this.eventCollection.add(data, {
            merge: true
          });
          callback();
          return _this._resumeModels(eventsToChange, options);
        };
      })(this),
      error: (function(_this) {
        return function() {
          _this._resumeModels(eventsToChange, options);
          return callback(t('server error occured'));
        };
      })(this)
    });
  };

  stringify = function(tag) {
    return tag.toString();
  };

  CalendarCollection.prototype.toArray = function() {
    return this.map(stringify);
  };

  CalendarCollection.prototype.comparator = function(a, b) {
    var aName, bName;
    aName = a.get('name');
    bName = b.get('name');
    return aName.localeCompare(bName, {}, {
      sensitivity: 'base'
    });
  };

  CalendarCollection.prototype.toAutoCompleteSource = function() {
    return this.map(function(tag) {
      return _.extend({
        label: tag.get('name'),
        value: tag.get('name')
      }, tag.attributes);
    });
  };

  return CalendarCollection;

})(TagCollection);
});

;require.register("collections/contacts", function(exports, require, module) {
var Contact, ContactCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Contact = require('../models/contact');

module.exports = ContactCollection = (function(_super) {
  __extends(ContactCollection, _super);

  function ContactCollection() {
    return ContactCollection.__super__.constructor.apply(this, arguments);
  }

  ContactCollection.prototype.model = Contact;

  ContactCollection.prototype.url = 'contacts';

  ContactCollection.prototype.asTypeaheadSource = function(query) {
    var contacts, items, regexp;
    regexp = new RegExp(query);
    contacts = this.filter(function(contact) {
      return contact.match(regexp);
    });
    items = [];
    contacts.forEach(function(contact) {
      return contact.get('emails').forEach(function(email) {
        return items.push({
          id: contact.id,
          display: "" + (contact.get('name')) + " &lt;" + email.value + "&gt;",
          toString: function() {
            return "" + email.value + ";" + contact.id;
          }
        });
      });
    });
    return items;
  };

  return ContactCollection;

})(Backbone.Collection);
});

;require.register("collections/daybuckets", function(exports, require, module) {
var DayBucket, DayBucketCollection, RealEventCollection, RealEventGeneratorCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

RealEventCollection = require('./realevents');

RealEventGeneratorCollection = require('./realeventsgenerator');

DayBucket = DayBucket = (function(_super) {
  __extends(DayBucket, _super);

  function DayBucket(model) {
    DayBucket.__super__.constructor.call(this, {
      id: model.getDateHash(),
      date: moment(model.start).startOf('day')
    });
  }

  DayBucket.prototype.initialize = function() {
    return this.items = new RealEventCollection();
  };

  return DayBucket;

})(Backbone.Model);

module.exports = DayBucketCollection = (function(_super) {
  __extends(DayBucketCollection, _super);

  function DayBucketCollection() {
    return DayBucketCollection.__super__.constructor.apply(this, arguments);
  }

  DayBucketCollection.prototype.model = DayBucket;

  DayBucketCollection.prototype.comparator = 'id';

  DayBucketCollection.prototype.initialize = function() {
    this.eventCollection = new RealEventGeneratorCollection();
    this.listenTo(this.eventCollection, 'add', this.onBaseCollectionAdd);
    this.listenTo(this.eventCollection, 'change:start', this.onBaseCollectionChange);
    this.listenTo(this.eventCollection, 'remove', this.onBaseCollectionRemove);
    this.listenTo(this.eventCollection, 'reset', this.resetFromBase);
    return this.resetFromBase();
  };

  DayBucketCollection.prototype.resetFromBase = function() {
    this.reset([]);
    return this.eventCollection.each((function(_this) {
      return function(model) {
        return _this.onBaseCollectionAdd(model);
      };
    })(this));
  };

  DayBucketCollection.prototype.onBaseCollectionChange = function(model) {
    var newbucket, oldbucket;
    oldbucket = this.get(model.getPreviousDateHash());
    newbucket = this.get(model.getDateHash());
    if (oldbucket === newbucket) {
      return;
    }
    oldbucket.items.remove(model);
    if (oldbucket.items.length === 0) {
      this.remove(oldbucket);
    }
    if (!newbucket) {
      this.add(newbucket = new DayBucket(model));
    }
    return newbucket.items.add(model);
  };

  DayBucketCollection.prototype.onBaseCollectionAdd = function(model) {
    var bucket;
    bucket = this.get(model.getDateHash());
    if (!bucket) {
      this.add(bucket = new DayBucket(model));
    }
    return bucket.items.add(model);
  };

  DayBucketCollection.prototype.onBaseCollectionRemove = function(model) {
    var bucket;
    bucket = this.get(model.getDateHash());
    bucket.items.remove(model);
    if (bucket.items.length === 0) {
      return this.remove(bucket);
    }
  };

  DayBucketCollection.prototype.loadNextPage = function(callback) {
    return this.eventCollection.loadNextPage(callback);
  };

  DayBucketCollection.prototype.loadPreviousPage = function(callback) {
    return this.eventCollection.loadPreviousPage(callback);
  };

  return DayBucketCollection;

})(Backbone.Collection);
});

;require.register("collections/events", function(exports, require, module) {
var Event, EventCollection, ScheduleItemsCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ScheduleItemsCollection = require('./scheduleitems');

Event = require('../models/event');

module.exports = EventCollection = (function(_super) {
  __extends(EventCollection, _super);

  function EventCollection() {
    return EventCollection.__super__.constructor.apply(this, arguments);
  }

  EventCollection.prototype.model = Event;

  EventCollection.prototype.url = 'events';

  return EventCollection;

})(ScheduleItemsCollection);
});

;require.register("collections/realevents", function(exports, require, module) {
var RealEvent, RealEventCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

RealEvent = require('../models/realevent');

module.exports = RealEventCollection = (function(_super) {
  var model;

  __extends(RealEventCollection, _super);

  function RealEventCollection() {
    return RealEventCollection.__super__.constructor.apply(this, arguments);
  }

  model = RealEvent;

  RealEventCollection.prototype.comparator = function(re1, re2) {
    return re1.start.isBefore(re2.start);
  };

  return RealEventCollection;

})(Backbone.Collection);
});

;require.register("collections/realeventsgenerator", function(exports, require, module) {
var RealEvent, RealEventGeneratorCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

RealEvent = require('../models/realevent');

module.exports = RealEventGeneratorCollection = (function(_super) {
  var model;

  __extends(RealEventGeneratorCollection, _super);

  function RealEventGeneratorCollection() {
    return RealEventGeneratorCollection.__super__.constructor.apply(this, arguments);
  }

  model = RealEvent;

  RealEventGeneratorCollection.prototype.comparator = function(re1, re2) {
    return re1.start.isBefore(re2.start);
  };

  RealEventGeneratorCollection.prototype.initialize = function() {
    this.baseCollection = app.events;
    this.listenTo(this.baseCollection, 'add', this.resetFromBase);
    this.listenTo(this.baseCollection, 'change:start', this.resetFromBase);
    this.listenTo(this.baseCollection, 'remove', this.resetFromBase);
    this.listenTo(this.baseCollection, 'reset', this.resetFromBase);
    this.listenTo(app.calendars, 'change', function() {
      return this.resetFromBase(true);
    });
    return this._initializeGenerator();
  };

  RealEventGeneratorCollection.prototype._initializeGenerator = function() {
    var i, item, today;
    this.previousRecurringEvents = [];
    this.runningRecurringEvents = [];
    this.firstGeneratedEvent = this.baseCollection.at(this.baseCollection.length - 1);
    this.lastGeneratedEvent = null;
    today = moment().startOf('day');
    this.firstDate = today.clone();
    this.lastDate = today.clone();
    i = 0;
    while (i < this.baseCollection.length) {
      item = this.baseCollection.at(i);
      i++;
      if (!item.isVisible()) {
        continue;
      }
      if (item.getStartDateObject().isAfter(today)) {
        this.firstGeneratedEvent = item;
        this.lastGeneratedEvent = item;
        break;
      }
      if (item.isRecurrent()) {
        this.previousRecurringEvents.push(item);
        if (item.getLastOccurenceDate().isAfter(today)) {
          this.runningRecurringEvents.push(item);
        }
      }
    }
    return this.loadNextPage();
  };

  RealEventGeneratorCollection.prototype.resetFromBase = function(sync) {
    var resetProc;
    resetProc = (function(_this) {
      return function() {
        _this.reset([]);
        _this._initializeGenerator();
        return _this.trigger('reset');
      };
    })(this);
    if (sync) {
      return resetProc();
    } else {
      return setTimeout(resetProc, 1);
    }
  };

  RealEventGeneratorCollection.prototype.loadNextPage = function(callback) {
    var end, eventsInRange, i, item, multipleDaysEvents, noEventsRemaining, start;
    callback = callback || function() {};
    eventsInRange = [];
    start = this.lastDate.clone();
    this.lastDate.add(1, 'month');
    end = this.lastDate.clone();
    i = this.baseCollection.indexOf(this.lastGeneratedEvent);
    this.lastGeneratedEvent = null;
    multipleDaysEvents = [];
    if (i !== -1) {
      while (i < this.baseCollection.length && this.lastGeneratedEvent === null) {
        item = this.baseCollection.at(i);
        i++;
        if (!item.isVisible()) {
          continue;
        } else if (item.isRecurrent()) {
          this.runningRecurringEvents.push(item);
        } else if (item.isMultipleDays()) {
          multipleDaysEvents.push(item);
        } else {
          eventsInRange.push(new RealEvent({
            event: item
          }));
        }
      }
    }
    this.runningRecurringEvents.forEach((function(_this) {
      return function(item, index) {
        var evs;
        evs = item.generateRecurrentInstancesBetween(start, end, function(event, instanceStart, instanceEnd) {
          var options;
          options = {
            event: event,
            start: instanceStart,
            end: instanceEnd
          };
          return new RealEvent(options);
        });
        eventsInRange = eventsInRange.concat(evs);
        if (item.getLastOccurenceDate().isBefore(end)) {
          return _this.runningRecurringEvents.splice(index, 1);
        }
      };
    })(this));
    multipleDaysEvents.forEach(function(item, index) {
      var fakeEvents;
      fakeEvents = item.generateMultipleDaysEvents().map(function(rawEvent) {
        var options;
        options = _.extend(rawEvent, {
          event: item
        });
        return new RealEvent(options);
      });
      return eventsInRange = eventsInRange.concat(fakeEvents);
    });
    this.add(eventsInRange);
    noEventsRemaining = this.runningRecurringEvents.length === 0 && this.lastGeneratedEvent === null;
    return callback(noEventsRemaining);
  };

  RealEventGeneratorCollection.prototype.loadPreviousPage = function(callback) {
    var end, eventsInRange, i, item, noPreviousEventsRemaining, start;
    callback = callback || function() {};
    eventsInRange = [];
    end = this.firstDate.clone();
    this.firstDate.add(-1, 'month');
    start = this.firstDate.clone();
    i = this.baseCollection.indexOf(this.firstGeneratedEvent);
    this.firstGeneratedEvent = null;
    while (i >= 0 && this.firstGeneratedEvent === null) {
      item = this.baseCollection.at(i);
      i--;
      if (!item.isVisible()) {
        continue;
      } else if (item.getStartDateObject().isBefore(start)) {
        this.firstGeneratedEvent = item;
      } else if (!item.isRecurrent()) {
        eventsInRange.push(new RealEvent(item));
      }
    }
    this.previousRecurringEvents.forEach((function(_this) {
      return function(item, index) {
        var evs;
        if (item.getLastOccurenceDate().isBefore(start)) {
          return;
        }
        if (item.getStartDateObject().isAfter(end)) {
          _this.previousRecurringEvents.splice(index, 1);
          return;
        }
        evs = item.generateRecurrentInstancesBetween(start, end, function(event, instanceStart, instanceEnd) {
          return new RealEvent(event, instanceStart, instanceEnd);
        });
        return eventsInRange = eventsInRange.concat(evs);
      };
    })(this));
    this.add(eventsInRange);
    noPreviousEventsRemaining = this.previousRecurringEvents.length === 0 && this.firstGeneratedEvent === null;
    return callback(noPreviousEventsRemaining);
  };

  return RealEventGeneratorCollection;

})(Backbone.Collection);
});

;require.register("collections/scheduleitems", function(exports, require, module) {
var ScheduleItemsCollection,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = ScheduleItemsCollection = (function(_super) {
  __extends(ScheduleItemsCollection, _super);

  function ScheduleItemsCollection() {
    this.getFCEventSource = __bind(this.getFCEventSource, this);
    return ScheduleItemsCollection.__super__.constructor.apply(this, arguments);
  }

  ScheduleItemsCollection.prototype.model = require('../models/scheduleitem');

  ScheduleItemsCollection.prototype.comparator = function(si1, si2) {
    return si1.getDateObject().diff(si2.getDateObject());
  };

  ScheduleItemsCollection.prototype.getFCEventSource = function(calendars) {
    return (function(_this) {
      return function(start, end, timezone, callback) {
        var eventsInRange;
        eventsInRange = [];
        _this.each(function(item) {
          var calendar, duration, itemEnd, itemStart;
          itemStart = item.getStartDateObject();
          itemEnd = item.getEndDateObject();
          duration = itemEnd - itemStart;
          calendar = item.getCalendar();
          if (calendar && calendar.get('visible') === false) {
            return null;
          }
          if (item.isRecurrent()) {
            return eventsInRange = eventsInRange.concat(item.getRecurrentFCEventBetween(start, end));
          } else if (item.isInRange(start, end)) {
            return eventsInRange.push(item.toPunctualFullCalendarEvent());
          }
        });
        return callback(eventsInRange);
      };
    })(this);
  };

  ScheduleItemsCollection.prototype.getByCalendar = function(calendarName) {
    return this.filter(function(event) {
      return event.get('tags')[0] === calendarName;
    });
  };

  return ScheduleItemsCollection;

})(Backbone.Collection);
});

;require.register("collections/tags", function(exports, require, module) {
var Tag, TagCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Tag = require('../models/tag');

module.exports = TagCollection = (function(_super) {
  __extends(TagCollection, _super);

  function TagCollection() {
    return TagCollection.__super__.constructor.apply(this, arguments);
  }

  TagCollection.prototype.model = Tag;

  TagCollection.prototype.url = 'tags';

  TagCollection.prototype.add = function(models, options) {
    if (_.isArray(models)) {
      models = _.clone(models);
    } else {
      models = models ? [models] : [];
    }
    models = models.filter((function(_this) {
      return function(model) {
        return !_this.some(function(collectionModel) {
          var name;
          name = (model != null ? model.name : void 0) ? model.name : model.get('name');
          return collectionModel.get('name') === name;
        });
      };
    })(this));
    return TagCollection.__super__.add.call(this, models, options);
  };

  TagCollection.prototype.getByName = function(name) {
    return this.find(function(item) {
      return item.get('name') === name;
    });
  };

  TagCollection.prototype.getOrCreateByName = function(name) {
    var tag;
    tag = this.getByName(name);
    if (!tag) {
      tag = new Tag({
        name: name,
        color: ColorHash.getColor(name, 'cozy')
      });
    }
    return tag;
  };

  return TagCollection;

})(Backbone.Collection);
});

;require.register("helpers", function(exports, require, module) {
exports.formatDateISO8601 = function(fullDate) {
  var date, time;
  fullDate = fullDate.split(/#/);
  if (fullDate[0].match(/([0-9]{2}\/){2}[0-9]{4}/)) {
    date = fullDate[0].split(/[\/]/);
    date = "" + date[2] + "-" + date[1] + "-" + date[0];
  } else {
    date = "undefined";
  }
  if (fullDate[1].match(/[0-9]{2}:[0-9]{2}/)) {
    time = fullDate[1].split(/:/);
    time = "" + time[0] + ":" + time[1] + ":00";
  } else {
    time = "undefined";
  }
  return "" + date + "T" + time;
};

exports.isDatePartValid = function(date) {
  date = date.split('T');
  return date[0].match(/[0-9]{8}/) != null;
};

exports.isTimePartValid = function(date) {
  date = date.split('T');
  return date[1].match(/[0-9]{6}Z/) != null;
};

exports.icalToISO8601 = function(icalDate) {
  var date, day, hours, minutes, month, year;
  date = icalDate.split('T');
  year = date[0].slice(0, 4);
  month = date[0].slice(4, 6);
  day = date[0].slice(6, 8);
  hours = date[1].slice(0, 2);
  minutes = date[1].slice(2, 4);
  return "" + year + "-" + month + "-" + day + "T" + hours + ":" + minutes + "Z";
};

exports.isEvent = function(start, end) {
  if (start[0] === end[0]) {
    if (start[1] === "00" && end[1] === "30") {
      return false;
    }
  } else if (parseInt(start[0]) + 1 === parseInt(end[0]) && start[1] === "30" && end[1] === "00") {
    return false;
  } else {
    return true;
  }
};

exports.ambiguousToTimezoned = function(ambigM) {
  return moment.tz(ambigM, window.app.timezone);
};

exports.momentToAmbiguousString = function(m) {
  return m.format('YYYY-MM-DD[T]HH:mm:ss');
};

exports.momentToDateString = function(m) {
  return m.format('YYYY-MM-DD');
};

exports.unitValuesToiCalDuration = function(unitsValues) {
  var s, t, u, _i, _j, _len, _len1, _ref, _ref1;
  s = '-P';
  _ref = ['W', 'D'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    u = _ref[_i];
    if (u in unitsValues) {
      s += unitsValues[u] + u;
    }
  }
  t = '';
  _ref1 = ['H', 'M', 'S'];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    u = _ref1[_j];
    if (u in unitsValues) {
      t += unitsValues[u] + u;
    }
  }
  if (t) {
    s += 'T' + t;
  }
  return s;
};

exports.iCalDurationToUnitValue = function(s) {
  var m, o;
  m = s.match(/(\d+)(W|D|H|M|S)/);
  o = {};
  o[m[2]] = m[1];
  return o;
};

exports.toTimezonedMoment = function(d) {
  var m;
  m = moment(d);
  m.tz(window.app.timezone);
  return m;
};
});

;require.register("helpers/color-set", function(exports, require, module) {
module.exports = ['304FFE', '2979FF', '00B0FF', '00DCE9', '00D5B8', '00C853', 'E70505', 'FF5700', 'FF7900', 'FFA300', 'B3C51D', '64DD17', 'FF2828', 'F819AA', 'AA00FF', '6200EA', '7190AB', '51658D'];
});

;require.register("helpers/timezone", function(exports, require, module) {
exports.timezones = ["Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmara", "Africa/Bamako", "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre", "Africa/Brazzaville", "Africa/Bujumbura", "Africa/Cairo", "Africa/Casablanca", "Africa/Ceuta", "Africa/Conakry", "Africa/Dakar", "Africa/Dar_es_Salaam", "Africa/Djibouti", "Africa/Douala", "Africa/El_Aaiun", "Africa/Freetown", "Africa/Gaborone", "Africa/Harare", "Africa/Johannesburg", "Africa/Kampala", "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos", "Africa/Libreville", "Africa/Lome", "Africa/Luanda", "Africa/Lubumbashi", "Africa/Lusaka", "Africa/Malabo", "Africa/Maputo", "Africa/Maseru", "Africa/Mbabane", "Africa/Mogadishu", "Africa/Monrovia", "Africa/Nairobi", "Africa/Ndjamena", "Africa/Niamey", "Africa/Nouakchott", "Africa/Ouagadougou", "Africa/Porto-Novo", "Africa/Sao_Tome", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek", "America/Adak", "America/Anchorage", "America/Anguilla", "America/Antigua", "America/Araguaina", "America/Argentina/Buenos_Aires", "America/Argentina/Catamarca", "America/Argentina/Cordoba", "America/Argentina/Jujuy", "America/Argentina/La_Rioja", "America/Argentina/Mendoza", "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan", "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia", "America/Aruba", "America/Asuncion", "America/Atikokan", "America/Bahia", "America/Barbados", "America/Belem", "America/Belize", "America/Blanc-Sablon", "America/Boa_Vista", "America/Bogota", "America/Boise", "America/Cambridge_Bay", "America/Campo_Grande", "America/Cancun", "America/Caracas", "America/Cayenne", "America/Cayman", "America/Chicago", "America/Chihuahua", "America/Costa_Rica", "America/Cuiaba", "America/Curacao", "America/Danmarkshavn", "America/Dawson", "America/Dawson_Creek", "America/Denver", "America/Detroit", "America/Dominica", "America/Edmonton", "America/Eirunepe", "America/El_Salvador", "America/Fortaleza", "America/Glace_Bay", "America/Godthab", "America/Goose_Bay", "America/Grand_Turk", "America/Grenada", "America/Guadeloupe", "America/Guatemala", "America/Guayaquil", "America/Guyana", "America/Halifax", "America/Havana", "America/Hermosillo", "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Indiana/Marengo", "America/Indiana/Petersburg", "America/Indiana/Tell_City", "America/Indiana/Vevay", "America/Indiana/Vincennes", "America/Indiana/Winamac", "America/Inuvik", "America/Iqaluit", "America/Jamaica", "America/Juneau", "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/La_Paz", "America/Lima", "America/Los_Angeles", "America/Maceio", "America/Managua", "America/Manaus", "America/Martinique", "America/Matamoros", "America/Mazatlan", "America/Menominee", "America/Merida", "America/Mexico_City", "America/Miquelon", "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Montreal", "America/Montserrat", "America/Nassau", "America/New_York", "America/Nipigon", "America/Nome", "America/Noronha", "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/Ojinaga", "America/Panama", "America/Pangnirtung", "America/Paramaribo", "America/Phoenix", "America/Port-au-Prince", "America/Port_of_Spain", "America/Porto_Velho", "America/Puerto_Rico", "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina", "America/Resolute", "America/Rio_Branco", "America/Santa_Isabel", "America/Santarem", "America/Santiago", "America/Santo_Domingo", "America/Sao_Paulo", "America/Scoresbysund", "America/St_Johns", "America/St_Kitts", "America/St_Lucia", "America/St_Thomas", "America/St_Vincent", "America/Swift_Current", "America/Tegucigalpa", "America/Thule", "America/Thunder_Bay", "America/Tijuana", "America/Toronto", "America/Tortola", "America/Vancouver", "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife", "Antarctica/Casey", "Antarctica/Davis", "Antarctica/DumontDUrville", "Antarctica/Mawson", "Antarctica/McMurdo", "Antarctica/Palmer", "Antarctica/Rothera", "Antarctica/Syowa", "Antarctica/Vostok", "Asia/Aden", "Asia/Almaty", "Asia/Amman", "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Baghdad", "Asia/Bahrain", "Asia/Baku", "Asia/Bangkok", "Asia/Beirut", "Asia/Bishkek", "Asia/Brunei", "Asia/Choibalsan", "Asia/Chongqing", "Asia/Colombo", "Asia/Damascus", "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe", "Asia/Gaza", "Asia/Harbin", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk", "Asia/Jakarta", "Asia/Jayapura", "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka", "Asia/Karachi", "Asia/Kashgar", "Asia/Kathmandu", "Asia/Kolkata", "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Kuwait", "Asia/Macau", "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Muscat", "Asia/Nicosia", "Asia/Novokuznetsk", "Asia/Novosibirsk", "Asia/Omsk", "Asia/Oral", "Asia/Phnom_Penh", "Asia/Pontianak", "Asia/Pyongyang", "Asia/Qatar", "Asia/Qyzylorda", "Asia/Rangoon", "Asia/Riyadh", "Asia/Sakhalin", "Asia/Samarkand", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tashkent", "Asia/Tbilisi", "Asia/Tehran", "Asia/Thimphu", "Asia/Tokyo", "Asia/Ulaanbaatar", "Asia/Urumqi", "Asia/Vientiane", "Asia/Vladivostok", "Asia/Yakutsk", "Asia/Yekaterinburg", "Asia/Yerevan", "Atlantic/Azores", "Atlantic/Bermuda", "Atlantic/Canary", "Atlantic/Cape_Verde", "Atlantic/Faroe", "Atlantic/Madeira", "Atlantic/Reykjavik", "Atlantic/South_Georgia", "Atlantic/St_Helena", "Atlantic/Stanley", "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill", "Australia/Currie", "Australia/Darwin", "Australia/Eucla", "Australia/Hobart", "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney", "Canada/Atlantic", "Canada/Central", "Canada/Eastern", "Canada/Mountain", "Canada/Newfoundland", "Canada/Pacific", "Europe/Amsterdam", "Europe/Andorra", "Europe/Athens", "Europe/Belgrade", "Europe/Berlin", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest", "Europe/Chisinau", "Europe/Copenhagen", "Europe/Dublin", "Europe/Gibraltar", "Europe/Helsinki", "Europe/Istanbul", "Europe/Kaliningrad", "Europe/Kiev", "Europe/Lisbon", "Europe/London", "Europe/Luxembourg", "Europe/Madrid", "Europe/Malta", "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara", "Europe/Simferopol", "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Tirane", "Europe/Uzhgorod", "Europe/Vaduz", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd", "Europe/Warsaw", "Europe/Zaporozhye", "Europe/Zurich", "GMT", "Indian/Antananarivo", "Indian/Chagos", "Indian/Christmas", "Indian/Cocos", "Indian/Comoro", "Indian/Kerguelen", "Indian/Mahe", "Indian/Maldives", "Indian/Mauritius", "Indian/Mayotte", "Indian/Reunion", "Pacific/Apia", "Pacific/Auckland", "Pacific/Chatham", "Pacific/Easter", "Pacific/Efate", "Pacific/Enderbury", "Pacific/Fakaofo", "Pacific/Fiji", "Pacific/Funafuti", "Pacific/Galapagos", "Pacific/Gambier", "Pacific/Guadalcanal", "Pacific/Guam", "Pacific/Honolulu", "Pacific/Johnston", "Pacific/Kiritimati", "Pacific/Kosrae", "Pacific/Kwajalein", "Pacific/Majuro", "Pacific/Marquesas", "Pacific/Midway", "Pacific/Nauru", "Pacific/Niue", "Pacific/Norfolk", "Pacific/Noumea", "Pacific/Pago_Pago", "Pacific/Palau", "Pacific/Pitcairn", "Pacific/Ponape", "Pacific/Port_Moresby", "Pacific/Rarotonga", "Pacific/Saipan", "Pacific/Tahiti", "Pacific/Tarawa", "Pacific/Tongatapu", "Pacific/Truk", "Pacific/Wake", "Pacific/Wallis", "US/Alaska", "US/Arizona", "US/Central", "US/Eastern", "US/Hawaii", "US/Mountain", "US/Pacific", "UTC"];
});

;require.register("initialize", function(exports, require, module) {
var app, colorSet;

app = require('application');

colorSet = require('./helpers/color-set');

$(function() {
  moment.locale(window.locale);
  ColorHash.addScheme('cozy', colorSet);
  app.initialize();
  return $.fn.spin = function(opts, color) {
    var presets;
    presets = {
      tiny: {
        lines: 8,
        length: 2,
        width: 2,
        radius: 3
      },
      small: {
        lines: 8,
        length: 1,
        width: 2,
        radius: 5
      },
      large: {
        lines: 10,
        length: 8,
        width: 4,
        radius: 8
      }
    };
    if (Spinner) {
      return this.each(function() {
        var $this, spinner;
        $this = $(this);
        spinner = $this.data('spinner');
        if (spinner != null) {
          spinner.stop();
          return $this.data('spinner', null);
        } else if (opts !== false) {
          if (typeof opts === 'string') {
            if (opts in presets) {
              opts = presets[opts];
            } else {
              opts = {};
            }
            if (color) {
              opts.color = color;
            }
          }
          spinner = new Spinner($.extend({
            color: $this.css("color")
          }, opts));
          spinner.spin(this);
          return $this.data("spinner", spinner);
        }
      });
    } else {
      console.log("Spinner class not available.");
      return null;
    }
  };
});
});

;require.register("lib/base_view", function(exports, require, module) {
var BaseView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = BaseView = (function(_super) {
  __extends(BaseView, _super);

  function BaseView() {
    return BaseView.__super__.constructor.apply(this, arguments);
  }

  BaseView.prototype.template = function() {};

  BaseView.prototype.initialize = function() {};

  BaseView.prototype.getRenderData = function() {
    var _ref;
    return {
      model: (_ref = this.model) != null ? _ref.toJSON() : void 0
    };
  };

  BaseView.prototype.render = function() {
    this.beforeRender();
    this.$el.html(this.template(this.getRenderData()));
    this.afterRender();
    return this;
  };

  BaseView.prototype.beforeRender = function() {};

  BaseView.prototype.afterRender = function() {};

  BaseView.prototype.destroy = function() {
    this.undelegateEvents();
    this.$el.removeData().unbind();
    this.remove();
    return Backbone.View.prototype.remove.call(this);
  };

  return BaseView;

})(Backbone.View);
});

;require.register("lib/modal", function(exports, require, module) {
var Modal,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Modal = (function(_super) {
  __extends(Modal, _super);

  function Modal() {
    this.closeOnEscape = __bind(this.closeOnEscape, this);
    return Modal.__super__.constructor.apply(this, arguments);
  }

  Modal.prototype.id = 'modal-dialog';

  Modal.prototype.className = 'modal fade';

  Modal.prototype.attributes = {
    'data-backdrop': "static",
    'data-keyboard': "false"
  };

  Modal.prototype.initialize = function(options) {
    if (this.title == null) {
      this.title = options.title;
    }
    if (this.content == null) {
      this.content = options.content;
    }
    if (this.yes == null) {
      this.yes = options.yes || 'ok';
    }
    if (this.no == null) {
      this.no = options.no || 'cancel';
    }
    if (this.cb == null) {
      this.cb = options.cb || function() {};
    }
    this.render();
    this.saving = false;
    this.$el.modal('show');
    this.$('button.close').click((function(_this) {
      return function(event) {
        event.stopPropagation();
        return _this.onNo();
      };
    })(this));
    return $(document).on('keyup', this.closeOnEscape);
  };

  Modal.prototype.events = function() {
    return {
      "click #modal-dialog-no": 'onNo',
      "click #modal-dialog-yes": 'onYes',
      'click': 'onClickAnywhere'
    };
  };

  Modal.prototype.onNo = function() {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.$el.modal('hide');
    setTimeout(((function(_this) {
      return function() {
        return _this.remove();
      };
    })(this)), 500);
    return this.cb(false);
  };

  Modal.prototype.onYes = function() {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.$el.modal('hide');
    setTimeout(((function(_this) {
      return function() {
        return _this.remove();
      };
    })(this)), 500);
    return this.cb(true);
  };

  Modal.prototype.closeOnEscape = function(e) {
    if (e.which === 27) {
      return this.onNo();
    }
  };

  Modal.prototype.remove = function() {
    $(document).off('keyup', this.closeOnEscape);
    return Modal.__super__.remove.apply(this, arguments);
  };

  Modal.prototype.render = function() {
    var body, close, container, foot, head, title, yesBtn;
    close = $('<button class="close" type="button" data-dismiss="modal" aria-hidden="true">×</button>');
    title = $('<h4 class="model-title">').text(this.title);
    head = $('<div class="modal-header">').append(close, title);
    body = $('<div class="modal-body">').append(this.renderContent());
    yesBtn = $('<button id="modal-dialog-yes" class="btn btn-cozy">').text(this.yes);
    foot = $('<div class="modal-footer">').append(yesBtn);
    if (this.no) {
      foot.prepend($('<button id="modal-dialog-no" class="btn btn-link">').text(this.no));
    }
    container = $('<div class="modal-content">').append(head, body, foot);
    container = $('<div class="modal-dialog">').append(container);
    return $("body").append(this.$el.append(container));
  };

  Modal.prototype.renderContent = function() {
    return this.content;
  };

  Modal.prototype.onClickAnywhere = function(event) {
    if (event.target.id === this.id) {
      return this.onNo();
    }
  };

  return Modal;

})(Backbone.View);

Modal.alert = function(title, content, cb) {
  return new Modal({
    title: title,
    content: content,
    yes: 'ok',
    no: null,
    cb: cb
  });
};

Modal.confirm = function(title, content, yesMsg, noMsg, cb) {
  return new Modal({
    title: title,
    content: content,
    yes: yesMsg,
    no: noMsg,
    cb: cb
  });
};

Modal.error = function(text, cb) {
  return new Modal({
    title: t('modal error'),
    content: text,
    yes: t('modal ok'),
    no: false,
    cb: cb
  });
};

module.exports = Modal;
});

;require.register("lib/popover_view", function(exports, require, module) {
var BaseView, PopoverView,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('./base_view');

module.exports = PopoverView = (function(_super) {
  __extends(PopoverView, _super);

  function PopoverView() {
    this.getDirection = __bind(this.getDirection, this);
    return PopoverView.__super__.constructor.apply(this, arguments);
  }

  PopoverView.prototype.titleTemplate = function() {};

  PopoverView.prototype.initialize = function(options) {
    this.target = options.target;
    this.container = options.container;
    this.parentView = options.parentView;
    return this;
  };

  PopoverView.prototype.selfclose = function() {
    var _base;
    if (typeof (_base = this.parentView).onPopoverClose === "function") {
      _base.onPopoverClose();
    }
    return this.close();
  };

  PopoverView.prototype.close = function() {
    this.target.popover('destroy');
    this.target.data('popover', void 0);
    return this.remove();
  };

  PopoverView.prototype.render = function() {
    this.beforeRender();
    this.target.popover({
      selector: true,
      trigger: 'manual',
      title: this.titleTemplate(this.getRenderData()),
      html: true,
      placement: this.getDirection,
      content: this.template(this.getRenderData()),
      container: this.container
    }).popover('show');
    this.setElement($("#" + this.parentView.id + " .popover"));
    if ($(window).width() <= 500) {
      $('.popover').css({
        top: 0,
        left: 0
      });
    }
    this.afterRender();
    return this;
  };

  PopoverView.prototype.getDirection = function(tip) {
    var $tmp, ctnOfs, fitBottom, fitLeft, fitRight, popoverHeight, popoverWidth, pos, realHeight, realWidth;
    $tmp = $(tip).clone().appendTo('body');
    popoverWidth = $tmp.innerWidth();
    popoverHeight = $tmp.innerHeight();
    $tmp.remove();
    pos = this.target.offset();
    ctnOfs = this.container.offset();
    realWidth = pos.left + this.target.width() + popoverWidth;
    fitRight = realWidth < ctnOfs.left + this.container.width();
    fitLeft = pos.left - popoverWidth > ctnOfs.left;
    realHeight = pos.top + this.target.height() + popoverHeight;
    fitBottom = realHeight < ctnOfs.top + this.container.height();
    if (fitRight) {
      return 'right';
    } else if (fitLeft) {
      return 'left';
    } else if (fitBottom) {
      return 'bottom';
    } else {
      return 'top';
    }
  };

  return PopoverView;

})(BaseView);
});

;require.register("lib/random", function(exports, require, module) {
module.exports.randomString = function(length) {
  var string;
  if (length == null) {
    length = 32;
  }
  string = "";
  while (string.length < length) {
    string += Math.random().toString(36).substr(2);
  }
  return string.substr(0, length);
};
});

;require.register("lib/socket_listener", function(exports, require, module) {
var SocketListener,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

SocketListener = (function(_super) {
  __extends(SocketListener, _super);

  function SocketListener() {
    return SocketListener.__super__.constructor.apply(this, arguments);
  }

  SocketListener.prototype.models = {
    'event': require('models/event')
  };

  SocketListener.prototype.events = ['event.create', 'event.update', 'event.delete'];

  SocketListener.prototype.onRemoteCreate = function(model) {
    var collection, _i, _len, _ref, _results;
    _ref = this.collections;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      collection = _ref[_i];
      if (model instanceof collection.model) {
        _results.push(collection.add(model));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SocketListener.prototype.onRemoteDelete = function(model) {
    return model.trigger('destroy', model, model.collection, {});
  };

  return SocketListener;

})(CozySocketListener);

module.exports = new SocketListener();
});

;require.register("lib/today_checker", function(exports, require, module) {
module.exports = function(router) {
  var waitToChangeToday;
  return (waitToChangeToday = (function(_this) {
    return function() {
      var nextDay, nextTick, now;
      now = moment();
      nextDay = moment(now).add(1, 'days').startOf('day');
      nextTick = nextDay.valueOf() - now.valueOf();
      return setTimeout(function() {
        var view;
        view = router.mainView;
        if (view.cal != null) {
          view.cal.fullCalendar('destroy');
          view.afterRender();
        }
        return waitToChangeToday();
      }, nextTick);
    };
  })(this))();
};
});

;require.register("lib/view", function(exports, require, module) {
var View,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = View = (function(_super) {
  __extends(View, _super);

  function View() {
    return View.__super__.constructor.apply(this, arguments);
  }

  View.prototype.template = function() {};

  View.prototype.initialize = function() {};

  View.prototype.render = function(templateOptions) {
    var render;
    this.beforeRender();
    render = this.template().call(null, templateOptions);
    this.$el.html(render);
    this.afterRender();
    return this;
  };

  View.prototype.beforeRender = function() {};

  View.prototype.afterRender = function() {};

  View.prototype.destroy = function() {
    this.undelegateEvents();
    this.$el.removeData().unbind();
    this.remove();
    return Backbone.View.prototype.remove.call(this);
  };

  return View;

})(Backbone.View);
});

;require.register("lib/view_collection", function(exports, require, module) {
var BaseView, ViewCollection,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

module.exports = ViewCollection = (function(_super) {
  __extends(ViewCollection, _super);

  function ViewCollection() {
    this.removeItem = __bind(this.removeItem, this);
    this.addItem = __bind(this.addItem, this);
    return ViewCollection.__super__.constructor.apply(this, arguments);
  }

  ViewCollection.prototype.itemview = null;

  ViewCollection.prototype.views = {};

  ViewCollection.prototype.template = function() {
    return '';
  };

  ViewCollection.prototype.itemViewOptions = function() {};

  ViewCollection.prototype.collectionEl = null;

  ViewCollection.prototype.onChange = function() {
    return this.$el.toggleClass('empty', _.size(this.views) === 0);
  };

  ViewCollection.prototype.appendView = function(view) {
    return this.$collectionEl.append(view.el);
  };

  ViewCollection.prototype.initialize = function() {
    ViewCollection.__super__.initialize.apply(this, arguments);
    this.views = {};
    this.listenTo(this.collection, "reset", this.onReset);
    this.listenTo(this.collection, "add", this.addItem);
    this.listenTo(this.collection, "remove", this.removeItem);
    if (this.collectionEl == null) {
      this.collectionEl = this.el;
      return this.$collectionEl = this.$el;
    }
  };

  ViewCollection.prototype.render = function() {
    var id, view, _ref;
    _ref = this.views;
    for (id in _ref) {
      view = _ref[id];
      view.$el.detach();
    }
    return ViewCollection.__super__.render.apply(this, arguments);
  };

  ViewCollection.prototype.afterRender = function() {
    var id, view, _ref;
    if (!this.$collectionEl) {
      this.$collectionEl = this.$(this.collectionEl);
    }
    _ref = this.views;
    for (id in _ref) {
      view = _ref[id];
      this.appendView(view);
    }
    this.onReset(this.collection);
    return this.onChange(this.views);
  };

  ViewCollection.prototype.remove = function() {
    this.onReset([]);
    return ViewCollection.__super__.remove.apply(this, arguments);
  };

  ViewCollection.prototype.onReset = function(newcollection) {
    var id, view, _ref;
    _ref = this.views;
    for (id in _ref) {
      view = _ref[id];
      view.remove();
    }
    return newcollection.forEach(this.addItem);
  };

  ViewCollection.prototype.addItem = function(model) {
    var options, view;
    options = _.extend({}, {
      model: model
    }, this.itemViewOptions(model));
    view = new this.itemview(options);
    this.views[model.cid] = view.render();
    this.appendView(view);
    return this.onChange(this.views);
  };

  ViewCollection.prototype.removeItem = function(model) {
    this.views[model.cid].remove();
    delete this.views[model.cid];
    return this.onChange(this.views);
  };

  return ViewCollection;

})(BaseView);
});

;require.register("locales/de", function(exports, require, module) {
module.exports = {
  "default calendar name": "Mein Kalendar",
  "Add": "Hinzufügen",
  "event": "Ereignis",
  "create event": "Ereignis erstellen",
  "edit event": "Ereignis bearbeiten",
  "edit": "Bearbeiten",
  "create": "Erstellen",
  "creation": "Erstellung",
  "invite": "Einladen",
  "close": "Schließen",
  "delete": "Löschen",
  "change color": "Farbe ändern",
  "rename": "Umbennen",
  "export": "Exportieren",
  "remove": "Ereignis entfernen",
  "duplicate": "Ereignis duplizieren",
  "Place": "Ort",
  'all day': 'ganztags',
  'All day': 'Ganztags',
  "description": "Beschreibung",
  "date": "Datum",
  "Day": "Tag",
  "days": "Tage",
  "Edit": "Bearbeiten",
  "Email": "E-Mail",
  "Import": "Import",
  "Export": "Export",
  "show": "Anzeigen",
  "hide": "Verbergen",
  "List": "Liste",
  "list": "auflisten",
  "Calendar": "Kalendar",
  "calendar": "Kalendar",
  "Sync": "Sync",
  "ie: 9:00 important meeting": "z.B.: 9:00 wichtige Besprechung",
  "Month": "Monat",
  "Popup": "Popup",
  "Switch to List": "Umschalten zu Liste",
  "Switch to Calendar": "Umschalten zu Kalendar",
  "time": "Zeit",
  "Today": "Heute",
  'today': 'heute',
  "What should I remind you ?": "An was soll ich Sie erinnern?",
  "select an icalendar file": "Auswählen einer ICalendar Datei",
  "import your icalendar file": "Ihre ICalender Datei importieren",
  "confirm import": "Importieren bestätigen",
  "cancel": "abbrechen",
  "Create": "Erstellen",
  "Events to import": "Ereignisse zum Importieren",
  "Create Event": "Ereignis erstellen",
  "From [hours:minutes]": "von [Stunden:Minuten]",
  "To [hours:minutes]": "bis [Stunden:Minuten]",
  "To [date]": "bis [Datum]",
  "Description": "Beschreibung",
  "days after": "Tage dannach",
  "days later": "Tage später",
  "Week": "Woche",
  "Display": "Mitteilung",
  "DISPLAY": "Mitteilung",
  "EMAIL": "E-Mail",
  "BOTH": "E-Mail & Mitteilung",
  "display previous events": "vorherige Ereignisse anzeigen",
  "display next events": "nächste Ereignisse anzeigen",
  "event": "Ereignis",
  "are you sure": "Sind Sie sicher?",
  "confirm delete calendar": "Sie sind im Begriff alle Ereignisse in %{calendarName} zu löschen. Sind Sie sicher?",
  "confirm delete selected calendars": "Sie sind im Begriff alle Kalender. Sind Sie sicher?",
  "advanced": "Mehr Details",
  "enter email": "E-Mail anzeigen",
  "ON": "EIN",
  "OFF": "AUS",
  "no description": "Keine Beschreibung",
  "add calendar": "Kalendar hinzufügen",
  "new calendar": "Neuer Kalendar",
  "multiple actions": "mehrere Aktionen",
  "recurrence": "Wiederholung",
  "recurrence rule": "Wiederholungsregeln rules",
  "make reccurent": "Wiederholung erstellen",
  "repeat every": "Alle wiederholen",
  "no recurrence": "Keine Wiederholung",
  "repeat on": "Wiederholung ein",
  "repeat on date": "wiederholen an Datum",
  "repeat on weekday": "Täglich wiederholen",
  "repeat until": "Wiederholen bis",
  "after": "Nach",
  "repeat": "Wiederholen",
  "forever": "Immer",
  "occurences": "Ereignis",
  "every": "Alle",
  'minutes': 'Minuten',
  'minute': 'Minute',
  'minute ': 'Minute',
  'hours': 'Stunden',
  'hour': 'Stunde',
  "days": "Tage",
  "day": "Tag",
  "weeks": "Wochen",
  "week": "Woche",
  "months": "Monate",
  "month": "Monat",
  "years": "Jahre",
  "year": "Jahr",
  "until": "bis",
  "for": "für",
  "on": "am",
  "on the": "am",
  "th": "te",
  "nd": "te",
  "rd": "te",
  "st": "te",
  "last": "letzter",
  "and": "und",
  "times": "mal",
  "weekday": "Wochentag",
  "summary": "Titel",
  "start": "Start",
  "end": "Ende",
  "tags": "Tags",
  "add tags": "Tags hinzufügen",
  "change": "Wechsel",
  "change to": "wechseln zu",
  "change calendar": "Kalendar wechseln",
  "save changes": "Änderungen speichern",
  "save changes and invite guests": "Änderungen speichern und Gäste einladen",
  "guests": "Gäste",
  "cancel Invitation": "Einladung abbrechen",
  "From": "Von",
  "To": "Zu",
  "All day, until": "Alle Tage, bis",
  "All one day": "Alle Tage",
  'Reminders before the event': 'Errinnern vor dem Ereignis',
  "reminder": "Erinnerung",
  'send mails question': 'Eine Mitteilung senden an E-MAil:',
  'modal send mails': 'Eine Mitteilung senden',
  'yes': 'Ja',
  'no': 'Nein',
  "no summary": "Ein Titel muss vergeben werden.",
  "start after end": "Das Start-Datum liegt nach dem End-Datum.",
  "invalid start date": "Das Start-Datum ist ungültig.",
  "invalid end date": "Das End-Datum ist ungültig.",
  "invalid trigg date": "Das Datum ist ungültig.",
  "invalid action": "Die Aktion ist ungültig..",
  "server error occured": "EIn Server Fehler ist aufgetreten.",
  "synchronization": "Synchronisation",
  "mobile sync": "Mobile Sync (CalDAV)",
  "link imported events with calendar": "Ereignis auswählen um mit folgendem Kalendar zu importieren:",
  "import an ical file": "Um eine ICal Datei in Ihren Cozy Kalender zu importieren, bitte erst diese Schaltfläche zum vorladen drücken:",
  "download a copy of your calendar": "Einen Kalender auswählen und dann die Export Schaltfläche drücken um eine Kopie des Kalenders als ICal Datei zu exportieren :",
  "icalendar export": "ICalendar Export",
  "icalendar import": "ICalendar Import",
  "to sync your cal with": "Um Ihren Kalendar mit Ihren anderen Geräten zu synchronisieren müssen zwei Schritte ausgeführt werden",
  "sync headline with data": "Um Ihren Kalendar zu synchronisieren, folgende Informationen beachten:",
  "sync url": "URL:",
  "sync login": "Benutzername:",
  "sync password": "Passwort:",
  "sync help": "Sind Sie verloren? Folgen Sie der",
  "sync help link": "Schritt-für-Schritt Anleitung!",
  "install the sync module": "Installieren Sie das Sync Module vom dem Cozy App Store",
  "connect to it and follow": "Verbinden Sie sich mit ihm und folgend den Anweisungen zu CalDAV.",
  "some event fail to save": "Ein Ereignis wurde nicht gespeichert (ein Fehler ist aufgetreten).",
  "imported events": "Anzahl der importierten Ereignisse",
  "import finished": "Ihr Import ist nun fertig gestellt",
  "import error occured for": "Fehler bei Import für folgende Elemente aufgetreten ",
  "export your calendar": "Exportieren Sie Ihren Kalendar",
  'please select existing calendar': 'Bitte wählen Sie einen bestehenden Kalendar aus.',
  "January": "Januar",
  "February": "Februar",
  "March": "März",
  "April": "April",
  "May": "Mai",
  "June": "Juni",
  "July": "Juli",
  "August": "August",
  "September": "September",
  "October": "Oktober",
  "November": "November",
  "December": "Dezember",
  "January": "Januar",
  "February": "Februar",
  'Jan': 'Jan',
  'Feb': 'Feb',
  'Mar': 'Mär',
  'Apr': 'Apr',
  'Jun': 'Jun',
  'Jul': 'Jul',
  'Aug': 'Aug',
  'Sep': 'Sep',
  'Oct': 'Okt',
  'Nov': 'Nov',
  'Dec': 'Dez',
  'calendar exist error': 'Ein Kalendar mit dem Namenn "Neuer Kalendar" existiert bereits.',
  'email date format': 'DD/MM/YYYY [à] HH[h]mm',
  'email date format allday': 'DD/MM/YYYY, [ganztags]',
  'email invitation title': 'Einladung z "%{description}"',
  'email invitation content': "Hallo, ich lade Sie zu folgendem Ereignis ein:\n%{description} %{place}\nam %{date}\nBitte um Zusage/Absage?\nJa\n%{url}?status=ACCEPTED&key=%{key}\nNein\n%{url}?status=DECLINED&key=%{key}",
  'email update title': "Betreff \"%{description}\" a changé",
  'email update content': "Ein Ereignis zu dem Sie eingeladen wurden, hat sich geändert:\n%{description} %{place}\nam %{date}\nWeiterhin; Zusage\n%{url}?status=ACCEPTED&key=%{key}\nNein leider; Absage\n%{url}?status=DECLINED&key=%{key}",
  'email delete title': 'Diese Ereignis wurde abgesagt: %{description}',
  'email delete content': "Dieses Ereignis wurde abgesagt:\n%{description} %{place}\nam %{date}"
};
});

;require.register("locales/en", function(exports, require, module) {
module.exports = {
  "default calendar name": "my calendar",
  "Add": "Add",
  "event": "Event",
  "create event": "Event creation",
  "edit event": "Event edition",
  "edit": "Edit",
  "create": "Create",
  "creation": "Creation",
  "invite": "Invite",
  "close": "Close",
  "delete": "Delete",
  "change color": "Change color",
  "rename": "Rename",
  "export": "Export",
  "remove": "Remove event",
  "duplicate": "Duplicate event",
  "Place": "Place",
  'all day': 'all day',
  'All day': 'All day',
  "description": "Description",
  "date": "date",
  "Day": "Day",
  "days": "days",
  "Edit": "Edit",
  "Email": "Email",
  "Import": "Import",
  "Export": "Export",
  "show": "Show",
  "hide": "Hide",
  "List": "List",
  "list": "list",
  "Calendar": "Calendar",
  "calendar": "Calendar",
  "Sync": "Sync",
  "ie: 9:00 important meeting": "ie: 9:00 important meeting",
  "Month": "Month",
  "Popup": "Popup",
  "Switch to List": "Switch to List",
  "Switch to Calendar": "Switch to Calendar",
  "time": "time",
  "Today": "Today",
  'today': 'today',
  "What should I remind you ?": "What should I remind you?",
  "select an icalendar file": "Select an icalendar file",
  "import your icalendar file": "import your icalendar file",
  "confirm import": "confirm import",
  "cancel": "cancel",
  "Create": "Create",
  "Events to import": "Events to import",
  "Create Event": "Create Event",
  "From [hours:minutes]": "From [hours:minutes]",
  "To [hours:minutes]": "To [hours:minutes]",
  "To [date]": "To [date]",
  "Description": "Description",
  "days after": "days after",
  "days later": "days later",
  "Week": "Week",
  "Display": "Notification",
  "DISPLAY": "Notification",
  "EMAIL": "E-mail",
  "BOTH": "E-mail & Notification",
  "display previous events": "Display previous events",
  "display next events": "Display next events",
  "event": "Event",
  "are you sure": "Are you sure?",
  "confirm delete calendar": "You are about to delete all the events related to %{calendarName}. Are you sure?",
  "confirm delete selected calendars": "You are about to delete all the selected calendars. Are you sure?",
  "advanced": "More details",
  "enter email": "Enter email",
  "ON": "on",
  "OFF": "off",
  "no description": "No description",
  "add calendar": "Add calendar",
  "new calendar": "New calendar",
  "multiple actions": "Multiple actions",
  "recurrence": "Recurrence",
  "recurrence rule": "Recurrence rules",
  "make reccurent": "Make recurrent",
  "repeat every": "Repeat every",
  "no recurrence": "No recurrence",
  "repeat on": "Repeat on",
  "repeat on date": "Repeat on dates",
  "repeat on weekday": "Repeat on weekday",
  "repeat until": "Repeat until",
  "after": "After",
  "repeat": "Repeat",
  "forever": "Forever",
  "occurences": "occurences",
  "every": "Every",
  'minutes': 'minutes',
  'minute ': 'minute',
  'minute': 'minute',
  'hours': 'hours',
  'hour': 'hour',
  "days": "days",
  "day": "day",
  "weeks": "weeks",
  "week": "week",
  "months": "months",
  "month": "month",
  "years": "years",
  "year": "year",
  "until": "until",
  "for": "for",
  "on": "on",
  "on the": "on the",
  "th": "th",
  "nd": "nd",
  "rd": "rd",
  "st": "st",
  "last": "last",
  "and": "and",
  "times": "times",
  "weekday": "weekday",
  "summary": "Summary",
  "start": "Start",
  "end": "End",
  "tags": "Tags",
  "add tags": "Add tags",
  "change": "Change",
  "change to": "Change to",
  "change calendar": "Change calendar",
  "save changes": "Save changes",
  "save changes and invite guests": "Save changes and invite guests",
  "guests": "Guests",
  "cancel Invitation": "Cancel the invitation",
  "From": "From",
  "To": "To",
  "All day, until": "All day, until",
  "All one day": "All day",
  'Reminders before the event': 'Reminders before the event',
  "reminder": "Reminder",
  'send mails question': 'Send a notification email to:',
  'modal send mails': 'Send a notification',
  'yes': 'Yes',
  'no': 'No',
  "no summary": "A summary must be set.",
  "start after end": "The start date is after the end date.",
  "invalid start date": "The start date is invalid.",
  "invalid end date": "The end date is invalid.",
  "invalid trigg date": "The date is invalid.",
  "invalid action": "The action is invalid.",
  "server error occured": "A server error occured.",
  "synchronization": "Synchronization",
  "mobile sync": "Mobile Sync (CalDAV)",
  "link imported events with calendar": "Link events to import with following calendar:",
  "import an ical file": "To import an ICal file into your cozy calendar, first click on this button to preload it:",
  "download a copy of your calendar": "Select one calendar and then click on the export button, to download a copy if the calendar as an ICal file, :",
  "icalendar export": "ICalendar Export",
  "icalendar import": "ICalendar Import",
  "to sync your cal with": "To synchronize your calendar with your devices, you must follow two steps",
  "sync headline with data": "To synchronize your calendar, use the following information:",
  "sync url": "URL:",
  "sync login": "Username:",
  "sync password": "Password:",
  "sync help": "Are you lost? Follow the",
  "sync help link": "step-by-step guide!",
  "install the sync module": "Install the Sync module from the Cozy App Store",
  "connect to it and follow": "Connect to it and follow the instructions related to CalDAV.",
  "some event fail to save": "An event was not saved (an error occured).",
  "imported events": "Amount of imported events",
  "import finished": "Your import is now finished",
  "import error occured for": "Import error occured for following elements:",
  "export your calendar": "Export your calendar",
  'please select existing calendar': 'Please select an existing calendar.',
  "January": "January",
  "February": "February",
  "March": "March",
  "April": "April",
  "May": "May",
  "June": "June",
  "July": "July",
  "August": "August",
  "September": "September",
  "October": "October",
  "November": "November",
  "December": "December",
  "January": "January",
  "February": "February",
  'Jan': 'Jan',
  'Feb': 'Feb',
  'Mar': 'Mar',
  'Apr': 'Apr',
  'Jun': 'Jun',
  'Jul': 'Jul',
  'Aug': 'Aug',
  'Sep': 'Sep',
  'Oct': 'Oct',
  'Nov': 'Nov',
  'Dec': 'Dec',
  'calendar exist error': 'A calendar named "New Calendar" already exists.',
  'email date format': 'MMMM Do YYYY, h:mm a',
  'email date format allday': 'MMMM Do YYYY, [all day long]',
  'email invitation title': 'Invitation to "%{description}"',
  'email invitation content': "Hello, I would like to invite you to the following event:\n\n%{description} %{place}\non %{date}\nWould you be there?\n\nYes\n%{url}?status=ACCEPTED&key=%{key}\n\nNo\n%{url}?status=DECLINED&key=%{key}",
  'email update title': "Event \"%{description}\" has changed",
  'email update content': "An event you were invited to has changed:\n%{description} %{place}\nOn %{date}\n\nI'm still going\n%{url}?status=ACCEPTED&key=%{key}\n\nI'm not going anymore\n%{url}?status=DECLINED&key=%{key}",
  'email delete title': 'This event has been canceled: %{description}',
  'email delete content': "This event has been canceled:\n%{description} %{place}\nOn %{date}"
};
});

;require.register("locales/es", function(exports, require, module) {
module.exports = {
  "default calendar name": "mi agenda",
  "Add": "Añadir",
  "event": "Evento",
  "create event": "Creación de un evento",
  "edit event": "Modificar un evento",
  "edit": "Mofificar",
  "create": "Crear",
  "creation": "Creación",
  "invite": "Invitar",
  "close": "Cerrar",
  "delete": "Suprimir",
  "change color": "Cambiar el  color",
  "rename": "Renombrar",
  "export": "Exportar",
  "remove": "Suprimir el evento",
  "duplicate": "Duplicar el evento",
  "Place": "Lugar",
  "all day": "día entero",
  "All day": "Día entero",
  "description": "Descripción",
  "date": "fecha",
  "Day": "Día",
  "days": "días",
  "Edit": "Modificar",
  "Email": "Correo electrónico",
  "Import": "Importar",
  "Export": "Exportar",
  "show": "Mostrar",
  "hide": "Ocultar",
  "List": "Lista",
  "list": "Lista",
  "Calendar": "Agenda",
  "calendar": "Agenda",
  "Sync": "Sincronizar",
  "ie: 9:00 important meeting": "ej: 9:00 reunión importante",
  "Month": "Mes",
  "Popup": "Popup",
  "Switch to List": "Cambiar a modo Lista",
  "Switch to Calendar": "Cambiar a modo Agenda",
  "time": "tiempo",
  "Today": "Hoy",
  "today": "hoy",
  "What should I remind you ?": "¿Qué debo recordarle?",
  "select an icalendar file": "Seleccionar un archivo icalendar",
  "import your icalendar file": "importar su archivo icalendar",
  "confirm import": "confirmar la importación",
  "cancel": "anular",
  "Create": "Crear",
  "Events to import": "Eventos que se han de importar",
  "Create Event": "Crear un evento",
  "From [hours:minutes]": "De [horas:minutos]",
  "To [hours:minutes]": "A [horas:minutos]",
  "To [date]": "A [fecha]",
  "Description": "Descripción",
  "days after": "días después",
  "days later": "días después",
  "Week": "Semana",
  "Display": "Notificación",
  "DISPLAY": "Notificación",
  "EMAIL": "Correo electrónico",
  "BOTH": "Correo electrónico & notificación",
  "display previous events": "Visualizar los eventos precedentes",
  "display next events": "Visualizar los eventos siguientes",
  "are you sure": "¿Está usted seguro(a)?",
  "confirm delete calendar": "Usted está a punto de suprimir todos los eventos asociados a %{calendarName}. ¿Está seguro(a)?",
  "confirm delete selected calendars": "Usted está a punto de suprimir todas las agendas seleccionadas. ¿Está seguro(a)?",
  "advanced": "Más detalles",
  "enter email": "Escriba la dirección del correo electrónico",
  "ON": "activada",
  "OFF": "desactivada",
  "no description": "Sin descripción",
  "add calendar": "Añadir agenda",
  "new calendar": "Nueva agenda",
  "multiple actions": "Acciones múltiples",
  "recurrence": "Recurrencia",
  "recurrence rule": "Reglas de recurrencia",
  "make reccurent": "Volver recurrente",
  "repeat every": "Repetir cada",
  "no recurrence": "No se repite",
  "repeat on": "Repetir los",
  "repeat on date": "Repetir los días del mes",
  "repeat on weekday": "Repetir el día de la semana",
  "repeat until": "Repetir hasta",
  "after": "O después",
  "repeat": "Repetir",
  "forever": "Siempre",
  "occurences": "ocasiones",
  "every": "Cada",
  "minutes": "minutos",
  "minute": "minuto",
  "minute ": "minuto",
  "hours": "horas",
  "hour": "hora",
  "day": "día",
  "weeks": "semanas",
  "week": "semana",
  "months": "meses",
  "month": "mes",
  "years": "años",
  "year": "año",
  "until": "hasta",
  "for": "durante",
  "on": "el",
  "on the": "el",
  "th": "º ",
  "nd": "º ",
  "rd": "º ",
  "st": "º ",
  "last": "último",
  "and": "y",
  "times": "veces",
  "weekday": "día de la semana",
  "summary": "Título",
  "start": "Comienzo",
  "end": "Fin",
  "tags": "Etiquetas",
  "add tags": "Añadir etiquetas",
  "change": "Cambiar",
  "change to": "Cambiar a",
  "change calendar": "Cambiar de agenda",
  "save changes": "Guardar cambios",
  "save changes and invite guests": "Guardar cambios y enviar las invitaciones",
  "guests": "Invitados",
  "cancel Invitation": "Anular la invitación",
  "From": "De",
  "To": "A",
  "All day, until": "Todo el día, hasta",
  "All one day": "Todo el día",
  "Reminders before the event": "Recordatorios antes del evento",
  "reminder": "Recordatorio",
  "send mails question": "Enviar un correo electrónico de notificación a:",
  "modal send mails": "Enviar una notificación",
  "yes": "Si",
  "no": "No",
  "no summary": "El título es obligatorio",
  "start after end": "La fecha del comienzo es posterior a la fecha del final.",
  "invalid start date": "La fecha del comienzo no es válida",
  "invalid end date": "La fecha del final no es válida",
  "invalid trigg date": "La fecha no es válida",
  "invalid action": "La acción no es válida",
  "server error occured": "Ha ocurrido un error en el servidor",
  "synchronization": "Sincronización",
  "mobile sync": "Sincronización con los móviles (CalDAV)",
  "link imported events with calendar": "Ligar los eventos a importar con la siguiente agenda:",
  "import an ical file": "Para importar un archivo ICal a su agenda Cozy, comenzar por hacer clic en este botón para precargarlo:",
  "download a copy of your calendar": "Seleccionar una agenda y luego hacer clic en el botón para descargar una copia de la agenda como archivo ICal, :",
  "icalendar export": "Exportar ICalendar",
  "icalendar import": "Importar ICalendar",
  "to sync your cal with": "Para sincronizar su agenda con sus periféricos, usted debe seguir los dos siguientes pasos",
  "sync headline with data": "Para sincronizar su agenda, use la siguiente información:",
  "sync url": "URL:",
  "sync login": "Usuario:",
  "sync password": "Contraseña:",
  "sync help": "¿Esta usted perdido(a)? siga la",
  "sync help link": "guía paso a paso!",
  "install the sync module": "Instalar el módulo Sincronización desde la Apliteca Cozy",
  "connect to it and follow": "Conectarse y seguir las instrucciones relativas a CalDAV.",
  "some event fail to save": "No se ha guardado un evento (ha ocurrido un error)",
  "imported events": "Número de eventos importados",
  "import finished": "La importación ha terminado",
  "import error occured for": "Un error ha ocurrido al importar los siguientes elementos :",
  "export your calendar": "Exportar su agenda",
  "please select existing calendar": "Por favor seleccionar una agenda existente",
  "January": "enero",
  "February": "febrero",
  "March": "marzo",
  "April": "abril",
  "May": "mayo",
  "June": "junio",
  "July": "julio",
  "August": "agosto",
  "September": "septiembre",
  "October": "octubre",
  "November": "noviembre",
  "December": "diciembre",
  "Jan": "ene",
  "Feb": "feb",
  "Mar": "mar",
  "Apr": "abr",
  "Jun": "jun",
  "Jul": "jul",
  "Aug": "ago",
  "Sep": "sep",
  "Oct": "oct",
  "Nov": "nov",
  "Dec": "dic",
  "calendar exist error": "Una agenda llamada \"Nueva agenda\" ya existe.",
  "email date format": "DD/MM/AAAA [a] HH[h]mm",
  "email date format allday": "DD/MM/AAAA [todo el día]",
  "email invitation title": "Invitación a \"%{description}\"",
  "email invitation content": "Buenos días, desearía invitarlo(a) al siguiente evento:\n\n%{description} %{place}\nel %{date}\n¿Podríamos contar con su presencia?\n\nSi\n%{url}?status=ACCEPTED&key=%{key}\n\nNo\n %{url}?status=DECLINED&key=%{key}",
  "email update title": "El evento \"%{description}\" ha cambiado",
  "email update content": "Un evento en el que usted participa se ha cambiado:\n%{description} %{place}\nel %{date}\n\nSeguiré estando presente\n %{url}?status=ACCEPTED&key=%{key}\n\nNo cuenten conmigo\n %{url}?status=ACCEPTED&key=%{key}",
  "email delete title": "Este evento ha sido anulado: %{description}",
  "email delete content": "Este evento ha sido anulado:\n%{description} %{place}\nel %{date}"
};
});

;require.register("locales/fr", function(exports, require, module) {
module.exports = {
  "default calendar name": "mon agenda",
  "Add": "Ajouter",
  "event": "évènement",
  "create event": "Création d'un évènement",
  "edit event": "Modification d'un évènement",
  "edit": "Enregistrer",
  "create": "Enregistrer",
  "creation": "Création",
  "invite": "Inviter",
  "close": "Fermer",
  "change color": "Changer la couleur",
  "delete": "Supprimer",
  "rename": "Renommer",
  "export": "Exporter",
  "remove": "Supprimer l'évènement",
  "duplicate": "Dupliquer l'évènement",
  "Place": "Lieu",
  'all day': 'journée entière',
  'All day': 'Journée entière',
  "description": "Description",
  "date": "Date",
  "Day": "Jour",
  'days': 'jours',
  "Edit": "Modifier",
  "Email": "Email",
  "Import": "Importation",
  "Export": "Exportation",
  "show": "Montrer",
  "hide": "Cacher",
  "List": "Liste",
  "list": "liste",
  "Calendar": "Agenda",
  "calendar": "Agenda",
  "Sync": "Sync",
  "ie: 9:00 important meeting": "exemple : 9:00 appeler Jacques",
  "Month": "Mois",
  "Popup": "Popup",
  "Switch to List": "Basculer en mode Liste",
  "Switch to Calendar": "Basculer en mode Agenda",
  "time": "Heure",
  "Today": "Aujourd’hui",
  'today': 'aujourd’hui',
  "What should I remind you ?": "Que dois-je vous rappeler ?",
  "import your icalendar file": "Importer votre fichier iCalendar",
  "select an icalendar file": "Sélectionner un fichier iCalendar",
  "confirm import": "Confirmer l'importation",
  "cancel": "Annuler",
  "Create": "Créer",
  "Events to import": "Évènements à importer",
  "Create Event": "Créer un évènement",
  "From [hours:minutes]": "De [heure:minutes]",
  "To [hours:minutes]": "À [heure:minutes]",
  "To [date]": "À [date]",
  "Description": "Description",
  "days after": "jours plus tard",
  "days later": "jours plus tard",
  "Week": "Semaine",
  "Display": "Notification",
  "DISPLAY": "Notification",
  "EMAIL": "Email",
  "BOTH": "Email & notification",
  "display previous events": "Afficher les évènements précédents",
  "display next events": "Afficher les évènements suivants",
  "are you sure": "Êtes-vous sûr(e) ?",
  "confirm delete calendar": "Vous êtes sur le point de supprimer tous les événements associés à %{calendarName}. Êtes-vous sûr(e) ?",
  "confirm delete selected calendars": "Vous êtes sur le point de supprimer tous les agendas sélectionnés. Êtes-vous sûr(e) ?",
  "advanced": "Détails",
  "enter email": "Entrer l'adresse email",
  "ON": "activée",
  "OFF": "désactivée",
  "no description": "Sans description",
  "add calendar": "Ajouter un agenda",
  "new calendar": "Nouvel agenda",
  "multiple actions": "Actions multiples",
  "recurrence": "Récurrence",
  "recurrence rule": "Règle de récurrence",
  "make reccurent": "Rendre récurrent",
  "repeat every": "Répéter tous les",
  "no recurrence": "Pas de répétition",
  "repeat on": "Répéter les",
  "repeat on date": "Répéter les jours du mois",
  "repeat on weekday": "Répéter le jour de la semaine",
  "repeat until": "Répéter jusqu'au",
  "after": "ou après",
  "repeat": "Répétition",
  "forever": "Pour toujours",
  "occurences": "occasions",
  "every": "tous les",
  'minutes': 'minutes',
  'minute': 'minute',
  'minute ': 'minute',
  'hours': 'heures',
  'hour': 'heure',
  "days": "jours",
  "day": "jour",
  "weeks": "semaines",
  "week": "semaine",
  "months": "mois",
  "month": "mois",
  "years": "ans",
  "year": "an",
  "until": "jusqu'au",
  "for": "pour",
  "on": "le",
  "on the": "le",
  "th": "ème",
  "nd": "ème",
  "rd": "ème",
  "st": "er",
  "last": "dernier",
  "and": "et",
  "times": "fois",
  "weekday": "jours de la semaine",
  "summary": "Titre",
  "start": "Début",
  "end": "Fin",
  "tags": "Tags",
  "add tags": "Ajouter des tags",
  "change to": "Changer en",
  "change": "Modifier",
  "change calendar": "Changer l'agenda",
  "save changes": "Enregistrer",
  "save changes and invite guests": "Enregistrer et envoyer les invitations",
  "guests": "Invités",
  "cancel Invitation": "Annuler l'invitation",
  "From": "De",
  "To": "À",
  "All day, until": "Journée entière, jusqu'au",
  "All one day": "Toute la journée du",
  'Reminders before the event': 'Rappels avant l’évènement',
  "reminder": "Rappel",
  'send mails question': 'Envoyer un email de notification à :',
  'modal send mails': 'Envoyer une notification',
  'yes': 'Oui',
  'no': 'Non',
  "no summary": "Le titre est obligatoire.",
  "start after end": "La fin est après le début.",
  "invalid start date": "Le début est invalide.",
  "invalid end date": "La fin est invalide.",
  "invalid trigg date": "Le moment est invalide.",
  "invalid action": "L'action est invalide.",
  "server error occured": "Une erreur est survenue sur le serveur.",
  "synchronization": "Synchronisation",
  "mobile sync": "Synchro Mobile (CalDAV)",
  "import an ical file": "Pour importer un fichier iCal dans votre agenda, commencez par cliquer sur ce bouton pour le précharger :",
  "link imported events with calendar": "Lier les évènements à importer avec l'agenda suivant :",
  "download a copy of your calendar": "Sélectionner un agenda puis cliquer sur le bouton exporter pour télécharger une copie de l'agenda comme un fichier iCal :",
  "icalendar export": "Exporter ICalendar",
  "icalendar import": "Importer ICalendar",
  "to sync your cal with": "Pour synchroniser votre agenda avec votre mobile vous devez :",
  "sync headline with data": "Pour synchroniser votre agenda, utilisez les identifiants suivants :",
  "sync url": "URL :",
  "sync login": "Nom d'utilisateur :",
  "sync password": "Mot de passe :",
  "sync help": "Vous êtes perdu(e) ? Suivez le",
  "sync help link": "guide pas à pas !",
  "install the sync module": "Installer le module Sync depuis l'applithèque.",
  "connect to it and follow": "Vous connecter et suivre les instructions relatives à CalDAV.",
  "some event fail to save": "La sauvegarde d'un évènement a échoué.",
  "imported events": "Nombre d'évènements importés",
  "import finished": "Votre importation est terminée !",
  "import error occured for": "Une erreur est survenue pour un de ces éléments :",
  "export your calendar": "Exporter votre agenda",
  'please select existing calendar': 'Veuillez sélectionner un agenda existant.',
  "January": "Janvier",
  "February": "Février",
  "March": "Mars",
  "April": "Avril",
  "May": "Mai",
  "June": "Juin",
  "July": "Juillet",
  "August": "Août",
  "September": "Septembre",
  "October": "Octobre",
  "November": "Novembre",
  "December": "Décembre",
  'Jan': 'Jan',
  'Feb': 'Fév',
  'Mar': 'Mar',
  'Apr': 'Avr',
  'Jun': 'Jui',
  'Jul': 'Jul',
  'Aug': 'Aou',
  'Sep': 'Sep',
  'Oct': 'Oct',
  'Nov': 'Nov',
  'Dec': 'Déc',
  'calendar exist error': 'Un agenda intitulé "Nouvel agenda" existe déjà.',
  'email date format': 'DD/MM/YYYY [à] HH[h]mm',
  'email date format allday': 'DD/MM/YYYY [toute la journée]',
  'email invitation title': "Invitation à l'évènement \"%{description}\"",
  'email invitation content': "Bonjour, je souhaiterais vous inviter à l'évènement suivant :\n%{description} %{place}\nLe %{date}\nSerez-vous présent ?\n\nOui\n%{url}?status=ACCEPTED&key=%{key}\n\nNon\n%{url}?status=DECLINED&key=%{key}",
  'email update title': "L'évènement \"%{description}\" a changé",
  'email update content': "Un évènement auquel vous participez a changé :\n%{description} %{place}\nLe %{date}\n\nJe viens toujours\n%{url}?status=ACCEPTED&key=%{key}\n\nJe ne viens plus\n%{url}?status=DECLINED&key=%{key}",
  'email delete title': 'Cet évènement a été annulé : %{description}',
  'email delete content': "Cet évènement a été annulé :\n%{description} %{place}\nLe %{date}"
};
});

;require.register("models/contact", function(exports, require, module) {
var Contact,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = Contact = (function(_super) {
  __extends(Contact, _super);

  function Contact() {
    return Contact.__super__.constructor.apply(this, arguments);
  }

  Contact.prototype.urlRoot = 'contacts';

  Contact.prototype.match = function(filter) {
    return filter.test(this.get('name')) || this.get('emails').some(function(dp) {
      return filter.test(dp.get('value'));
    });
  };

  return Contact;

})(Backbone.Model);
});

;require.register("models/event", function(exports, require, module) {
var Event, ScheduleItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ScheduleItem = require('./scheduleitem');

module.exports = Event = (function(_super) {
  __extends(Event, _super);

  function Event() {
    return Event.__super__.constructor.apply(this, arguments);
  }

  Event.prototype.fcEventType = 'event';

  Event.prototype.startDateField = 'start';

  Event.prototype.endDateField = 'end';

  Event.prototype.urlRoot = 'events';

  Event.prototype.defaults = function() {
    return {
      details: '',
      description: '',
      place: '',
      tags: [t('default calendar name')]
    };
  };

  Event.prototype.getDiff = function() {
    return this.getEndDateObject().diff(this.getStartDateObject(), 'days');
  };

  Event.prototype.setStart = function(setObj) {
    var edo, sdo;
    sdo = this.getStartDateObject();
    edo = this.getEndDateObject();
    this._setDate(setObj, sdo, this.startDateField);
    if (sdo >= edo) {
      edo = sdo.clone().add(1, 'hour');
      return this.set(this.endDateField, this._formatMoment(edo));
    }
  };

  Event.prototype.setEnd = function(setObj) {
    var edo, sdo;
    sdo = this.getStartDateObject();
    edo = this.getEndDateObject();
    this._setDate(setObj, edo, this.endDateField);
    if (sdo >= edo) {
      sdo = edo.clone().add(-1, 'hour');
      return this.set(this.startDateField, this._formatMoment(sdo));
    }
  };

  Event.prototype._setDate = function(setObj, dateObj, dateField) {
    var unit, value;
    for (unit in setObj) {
      value = setObj[unit];
      dateObj.set(unit, value);
    }
    return this.set(dateField, this._formatMoment(dateObj));
  };

  Event.prototype.setDiff = function(days) {
    var edo, oldEnd, sdo;
    edo = this.getStartDateObject().startOf('day');
    edo.add(days, 'day');
    if (!this.isAllDay()) {
      oldEnd = this.getEndDateObject();
      edo.set('hour', oldEnd.hour());
      edo.set('minute', oldEnd.minute());
      sdo = this.getStartDateObject();
      if (sdo >= edo) {
        edo = sdo.clone().add(1, 'hour');
      }
    }
    return this.set(this.endDateField, this._formatMoment(edo));
  };

  Event.prototype.validate = function(attrs, options) {
    var end, errors, start;
    errors = [];
    if (attrs.description == null) {
      errors.push({
        field: 'description',
        value: "no summary"
      });
    }
    if (!attrs.start || !(start = moment(attrs.start)).isValid()) {
      errors.push({
        field: 'startdate',
        value: "invalid start date"
      });
    }
    if (!attrs.end || !(end = moment(attrs.end)).isValid()) {
      errors.push({
        field: 'enddate',
        value: "invalid end date"
      });
    }
    if (start.isAfter(end)) {
      errors.push({
        field: 'date',
        value: "start after end"
      });
    }
    if (errors.length > 0) {
      return errors;
    }
  };

  Event.prototype.getDefaultColor = function() {
    return '#008AF6';
  };

  return Event;

})(ScheduleItem);
});

;require.register("models/realevent", function(exports, require, module) {
var RealEvent,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = RealEvent = (function(_super) {
  __extends(RealEvent, _super);

  function RealEvent(options) {
    RealEvent.__super__.constructor.apply(this, arguments);
    this.event = options.event;
    this.start = options.start;
    this.end = options.start;
    this.counter = options.counter;
    if (this.event.isRecurrent()) {
      this.set('id', this.event.get('id') + this.start.toISOString());
    } else if (this.event.isMultipleDays()) {
      this.set('id', "" + (this.event.get('id')) + " " + this.start);
    } else {
      this.set('id', this.event.get('id'));
      this.start = this.event.getStartDateObject();
      this.end = this.event.getEndDateObject();
    }
  }

  RealEvent.prototype.getCalendar = function() {
    return this.event.getCalendar();
  };

  RealEvent.prototype.getColor = function() {
    return this.event.getColor();
  };

  RealEvent.prototype.getDateHash = function() {
    return this.start.format('YYYYMMDD');
  };

  RealEvent.prototype.isAllDay = function() {
    return this.event.isAllDay() || this.event.isMultipleDays();
  };

  RealEvent.prototype.getFormattedStartDate = function(format) {
    return this.start.format(format);
  };

  RealEvent.prototype.getFormattedEndDate = function(format) {
    return this.end.format(format);
  };

  return RealEvent;

})(Backbone.Model);
});

;require.register("models/scheduleitem", function(exports, require, module) {
var H, Modal, ScheduleItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Modal = require('../lib/modal');

H = require('../helpers');

module.exports = ScheduleItem = (function(_super) {
  __extends(ScheduleItem, _super);

  function ScheduleItem() {
    return ScheduleItem.__super__.constructor.apply(this, arguments);
  }

  ScheduleItem.prototype.fcEventType = 'unknown';

  ScheduleItem.prototype.startDateField = '';

  ScheduleItem.prototype.endDateField = false;

  ScheduleItem.prototype.initialize = function() {
    var defaultCalendarName, _ref;
    defaultCalendarName = t('default calendar name');
    if (!((_ref = this.get('tags')) != null ? _ref.length : void 0)) {
      this.set('tags', [defaultCalendarName]);
    }
    this.on('change:' + this.startDateField, (function(_this) {
      return function() {
        return _this.startDateChanged = true;
      };
    })(this));
    return this.on('change:attendees', (function(_this) {
      return function() {
        return _this.attendeesChanged = true;
      };
    })(this));
  };

  ScheduleItem.prototype.getCalendar = function() {
    var _ref;
    return app.tags.getByName((_ref = this.get('tags')) != null ? _ref[0] : void 0);
  };

  ScheduleItem.prototype.setCalendar = function(cal) {
    var oldTags, tags;
    oldTags = this.get('tags');
    tags = oldTags != null ? [].concat(oldTags) : [];
    tags[0] = cal;
    return this.set({
      tags: tags
    });
  };

  ScheduleItem.prototype.getDefaultColor = function() {
    return 'grey';
  };

  ScheduleItem.prototype.getColor = function() {
    var calendarObject;
    calendarObject = this.getCalendar();
    if (calendarObject) {
      return calendarObject.get('color');
    } else {
      return this.getDefaultColor();
    }
  };

  ScheduleItem.prototype.isVisible = function() {
    var _ref;
    return (_ref = this.getCalendar()) != null ? _ref.get('visible') : void 0;
  };

  ScheduleItem.prototype.isAllDay = function() {
    var _ref;
    return ((_ref = this.get(this.startDateField)) != null ? _ref.length : void 0) === 10;
  };

  ScheduleItem.prototype.isSameDay = function() {
    var endDate;
    endDate = this.isAllDay() ? this.getEndDateObject().add(-1, 'd') : this.getEndDateObject();
    return endDate.isSame(this.getStartDateObject(), 'day');
  };

  ScheduleItem.prototype.isMultipleDays = function() {
    var difference, endDate, startDate;
    startDate = this.getStartDateObject();
    endDate = this.getEndDateObject();
    difference = endDate.diff(startDate, 'days', true);
    return difference > 1;
  };

  ScheduleItem.prototype._toDateObject = function(modelDateStr) {
    if (this.isAllDay()) {
      return moment.tz(modelDateStr, 'UTC');
    }
    if (this.isRecurrent()) {
      modelDateStr = moment.tz(modelDateStr, this.get('timezone'));
    }
    return H.toTimezonedMoment(modelDateStr);
  };

  ScheduleItem.prototype.getDateObject = function() {
    return this._toDateObject(this.get(this.startDateField));
  };

  ScheduleItem.prototype.getStartDateObject = function() {
    return this.getDateObject();
  };

  ScheduleItem.prototype.getEndDateObject = function() {
    if (this.endDateField) {
      return this._toDateObject(this.get(this.endDateField));
    } else {
      return this.getDateObject().add(30, 'm');
    }
  };

  ScheduleItem.prototype._formatMoment = function(m) {
    var s;
    if (this.isAllDay()) {
      s = H.momentToDateString(m);
    } else if (this.isRecurrent()) {
      m = moment(m).tz(this.get('timezone'));
      s = H.momentToAmbiguousString(m);
    } else {
      s = m.toISOString();
    }
    return s;
  };

  ScheduleItem.prototype.addToStart = function(duration) {
    return this.set(this.startDateField, this._formatMoment(this.getStartDateObject().add(duration)));
  };

  ScheduleItem.prototype.addToEnd = function(duration) {
    return this.set(this.endDateField, this._formatMoment(this.getEndDateObject().add(duration)));
  };

  ScheduleItem.prototype.getFormattedDate = function(formatter) {
    return this.getDateObject().format(formatter);
  };

  ScheduleItem.prototype.getFormattedStartDate = function(formatter) {
    return this.getStartDateObject().format(formatter);
  };

  ScheduleItem.prototype.getFormattedEndDate = function(formatter) {
    return this.getEndDateObject().format(formatter);
  };

  ScheduleItem.prototype.getDateHash = function() {
    return this.getDateObject().format('YYYYMMDD');
  };

  ScheduleItem.prototype.getPreviousDateObject = function() {
    var previous;
    previous = this.previous(this.startDateField);
    if (previous != null) {
      return this._toDateObject(previous);
    } else {
      return false;
    }
  };

  ScheduleItem.prototype.getPreviousDateHash = function() {
    var previous;
    previous = this.getPreviousDateObject();
    if (previous != null) {
      return previous.format('YYYYMMDD');
    } else {
      return false;
    }
  };

  ScheduleItem.prototype.isRecurrent = function() {
    return this.has('rrule') && this.get('rrule') !== '';
  };

  ScheduleItem.prototype.generateRecurrentInstancesBetween = function(start, end, generator) {
    var eventTimezone, events, fces, fixDSTTroubles, jsDateBoundE, jsDateBoundS, jsDateEventS, mDateEventE, mDateEventS, options, rrule;
    events = [];
    if (!this.isRecurrent()) {
      return events;
    }
    jsDateBoundS = start.toDate();
    jsDateBoundE = end.toDate();
    if (this.isAllDay()) {
      eventTimezone = window.app.timezone;
    } else {
      eventTimezone = this.get('timezone');
    }
    mDateEventS = moment.tz(this.get(this.startDateField), eventTimezone);
    mDateEventE = moment.tz(this.get(this.endDateField), eventTimezone);
    jsDateEventS = new Date(mDateEventS.toISOString());
    options = RRule.parseString(this.get('rrule'));
    options.dtstart = jsDateEventS;
    rrule = new RRule(options);
    fixDSTTroubles = function(jsDateRecurrentS) {
      var diff, isoDate, mDateRecurrentS;
      isoDate = jsDateRecurrentS.toISOString();
      mDateRecurrentS = moment.tz(isoDate, eventTimezone);
      diff = mDateEventS.hour() - mDateRecurrentS.hour();
      if (diff === 23) {
        diff = -1;
      } else if (diff === -23) {
        diff = 1;
      }
      mDateRecurrentS.add(diff, 'hour');
      return mDateRecurrentS;
    };
    fces = rrule.between(jsDateBoundS, jsDateBoundE).map((function(_this) {
      return function(jsDateRecurrentS) {
        var fce, fixedDate, mDateRecurrentE, mDateRecurrentS;
        fixedDate = fixDSTTroubles(jsDateRecurrentS);
        mDateRecurrentS = H.toTimezonedMoment(fixedDate);
        mDateRecurrentE = mDateRecurrentS.clone().add(mDateEventE.diff(mDateEventS, 'seconds'), 'seconds');
        fce = generator(_this, mDateRecurrentS, mDateRecurrentE);
        return fce;
      };
    })(this));
    return fces;
  };

  ScheduleItem.prototype.getRecurrentFCEventBetween = function(start, end) {
    return this.generateRecurrentInstancesBetween(start, end, function(event, start, end) {
      return event._toFullCalendarEvent(start, end);
    });
  };

  ScheduleItem.prototype.isInRange = function(start, end) {
    var edo, sdo;
    sdo = this.getStartDateObject();
    edo = this.getEndDateObject();
    return (sdo.isAfter(start) && sdo.isBefore(end)) || (edo.isAfter(start) && edo.isBefore(end)) || (sdo.isBefore(start) && edo.isAfter(end));
  };

  ScheduleItem.prototype.getLastOccurenceDate = function() {
    var options;
    if (this.isRecurrent()) {
      options = RRule.parseString(this.get('rrule'));
      if (options.until != null) {
        return moment(options.until);
      } else {
        return moment().add(10, 'years');
      }
    } else {
      return this.getStartDateObject();
    }
  };

  ScheduleItem.prototype.generateMultipleDaysEvents = function() {
    var date, difference, endDate, fakeEvent, fakeEvents, i, startDate, _i;
    if (!this.isMultipleDays()) {
      return [this];
    } else {
      startDate = this.getStartDateObject();
      endDate = this.getEndDateObject();
      difference = endDate.diff(startDate, 'days');
      fakeEvents = [];
      for (i = _i = 0; _i <= difference; i = _i += 1) {
        fakeEvent = _.clone(this.attributes);
        date = moment(startDate).add(i, 'days');
        fakeEvent = {
          start: date,
          end: date,
          counter: {
            current: i + 1,
            total: difference + 1
          }
        };
        fakeEvents.push(fakeEvent);
      }
      return fakeEvents;
    }
  };

  ScheduleItem.prototype.toPunctualFullCalendarEvent = function() {
    return this._toFullCalendarEvent(this.getStartDateObject(), this.getEndDateObject());
  };

  ScheduleItem.prototype._toFullCalendarEvent = function(start, end) {
    var description, displayedTime, fcEvent;
    displayedTime = !this.isAllDay() ? start.format('H:mm[ ]') : '';
    description = this.get('description');
    description = description || t('no description');
    return fcEvent = {
      id: this.cid,
      title: "" + displayedTime + description,
      start: start,
      end: end,
      allDay: this.isAllDay(),
      startEditable: !this.isRecurrent(),
      durationEditable: true,
      diff: this.get('diff'),
      place: this.get('place'),
      timezone: this.get('timezone'),
      type: this.fcEventType,
      backgroundColor: this.getColor(),
      borderColor: this.getColor()
    };
  };

  ScheduleItem.prototype.sync = function(method, model, options) {
    return this.confirmSendEmails(method, function(sendMails) {
      options.url = "" + (model.url()) + "?sendMails=" + sendMails;
      return ScheduleItem.__super__.sync.call(this, method, model, options);
    });
  };

  ScheduleItem.prototype.confirmSendEmails = function(method, callback) {
    var attendees, content, guestsList, guestsToInform;
    if (this.get('import')) {
      return callback(false);
    }
    if ((method === 'update' || method === 'patch') && !(this.startDateChanged || this.attendeesChanged)) {
      return callback(false);
    }
    attendees = this.get('attendees') || [];
    guestsToInform = attendees.filter(function(guest) {
      var _ref;
      if (method === 'create') {
        return true;
      } else if (method === 'delete') {
        return (_ref = guest.status) === 'ACCEPTED' || _ref === 'NEEDS-ACTION';
      } else if (method === 'update' || method === 'patch') {
        return guest.status === 'INVITATION-NOT-SENT' || (guest.status === 'ACCEPTED' && this.startDateChanged);
      }
    }).map(function(guest) {
      return guest.email;
    });
    if (guestsToInform.length === 0) {
      callback(false);
    } else {
      guestsList = guestsToInform.join(', ');
      content = "" + (t('send mails question')) + " " + guestsList;
      Modal.confirm(t('modal send mails'), content, t('yes'), t('no'), callback);
    }
    this.startDateChanged = false;
    return this.attendeesChanged = false;
  };

  return ScheduleItem;

})(Backbone.Model);
});

;require.register("models/tag", function(exports, require, module) {
var Tag,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = Tag = (function(_super) {
  __extends(Tag, _super);

  function Tag() {
    return Tag.__super__.constructor.apply(this, arguments);
  }

  Tag.prototype.urlRoot = 'tags';

  Tag.prototype.defaults = {
    visible: false
  };

  Tag.prototype.toString = function() {
    return this.get('name');
  };

  return Tag;

})(Backbone.Model);
});

;require.register("router", function(exports, require, module) {
var CalendarView, DayBucketCollection, EventModal, ImportView, ListView, Router, SettingsModal, app,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

app = require('application');

ListView = require('views/list_view');

CalendarView = require('views/calendar_view');

EventModal = require('views/event_modal');

SettingsModal = require('views/settings_modal');

ImportView = require('views/import_view');

DayBucketCollection = require('collections/daybuckets');

module.exports = Router = (function(_super) {
  var getBeginningOfWeek;

  __extends(Router, _super);

  function Router() {
    this.displayView = __bind(this.displayView, this);
    this.displayCalendar = __bind(this.displayCalendar, this);
    this.backToCalendar = __bind(this.backToCalendar, this);
    return Router.__super__.constructor.apply(this, arguments);
  }

  Router.prototype.routes = {
    '': 'month',
    'month': 'month',
    'month/:year/:month': 'month',
    'week': 'week',
    'week/:year/:month/:day': 'week',
    'list': 'list',
    'event/:eventid': 'auto_event',
    'month/:year/:month/:eventid': 'month_event',
    'week/:year/:month/:day/:eventid': 'week_event',
    'list/:eventid': 'list_event',
    'calendar': 'backToCalendar',
    'settings': 'settings'
  };

  Router.prototype.initialize = function(options) {
    Router.__super__.initialize.call(this, options);
    return $(window).resize((function(_this) {
      return function() {
        if (window.app.isMobile()) {
          return _this.navigate('list', {
            trigger: true
          });
        }
      };
    })(this));
  };

  Router.prototype.navigate = function(route, options) {
    if (window.app.isMobile()) {
      return Router.__super__.navigate.call(this, 'list', options);
    } else {
      return Router.__super__.navigate.call(this, route, options);
    }
  };

  Router.prototype.month = function(year, month) {
    var hash;
    if (year != null) {
      return this.displayCalendar('month', year, month, 1);
    } else {
      hash = moment().format('[month]/YYYY/M');
      return this.navigate(hash, {
        trigger: true
      });
    }
  };

  Router.prototype.week = function(year, month, day) {
    var hash, _ref;
    if (year != null) {
      _ref = getBeginningOfWeek(year, month, day), year = _ref[0], month = _ref[1], day = _ref[2];
      return this.displayCalendar('agendaWeek', year, month, day);
    } else {
      hash = moment().format('[week]/YYYY/M/D');
      return this.navigate(hash, {
        trigger: true
      });
    }
  };

  Router.prototype.list = function() {
    this.displayView(new ListView({
      collection: new DayBucketCollection()
    }));
    app.menu.activate('calendar');
    return this.onCalendar = true;
  };

  Router.prototype.auto_event = function(id) {
    var date, model;
    model = app.events.get(id);
    if (!model) {
      alert('This event does not exists');
      this.navigate('');
    }
    date = model.getDateObject();
    return this.month_event(date.getFullYear(), date.getMonth(), id);
  };

  Router.prototype.month_event = function(year, month, id) {
    if (!(this.mainView instanceof CalendarView)) {
      this.month(year, month);
    }
    return this.event(id, "month/" + year + "/" + month);
  };

  Router.prototype.week_event = function(year, month, date, id) {
    var day, _ref;
    _ref = getBeginningOfWeek(year, month, day), year = _ref[0], month = _ref[1], day = _ref[2];
    if (!(this.mainView instanceof CalendarView)) {
      this.week(year, month, date);
    }
    return this.event(id, "week/" + year + "/" + month + "/" + date);
  };

  Router.prototype.list_event = function(id) {
    if (!(this.mainView instanceof ListView)) {
      this.list();
    }
    return this.event(id, 'list');
  };

  Router.prototype.event = function(id, backurl) {
    var model, view;
    model = app.events.get(id);
    view = new EventModal({
      model: model,
      backurl: backurl
    });
    $('body').append(view.$el);
    view.render();
    return this.onCalendar = true;
  };

  Router.prototype.backToCalendar = function() {
    return this.navigate('', true);
  };

  Router.prototype.displayCalendar = function(view, year, month, day) {
    this.lastDisplayCall = Array.apply(arguments);
    this.displayView(new CalendarView({
      year: parseInt(year),
      month: (parseInt(month) + 11) % 12,
      date: parseInt(day),
      view: view,
      model: {
        events: app.events
      }
    }));
    app.menu.activate('calendar');
    return this.onCalendar = true;
  };

  Router.prototype.displayView = function(view) {
    if (this.mainView) {
      this.mainView.remove();
    }
    this.mainView = view;
    $('.main-container').append(this.mainView.$el);
    return this.mainView.render();
  };

  getBeginningOfWeek = function(year, month, day) {
    var monday, _ref;
    _ref = [year, month, day].map(function(x) {
      return parseInt(x);
    }), year = _ref[0], month = _ref[1], day = _ref[2];
    monday = new Date(year, (month - 1) % 12, day);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    return [year, monday.getMonth() + 1, monday.getDate()];
  };

  Router.prototype.settings = function() {
    var view;
    view = new SettingsModal();
    $('body').append(view.$el);
    view.render();
    return this.onCalendar = true;
  };

  return Router;

})(Backbone.Router);
});

;require.register("views/calendar_header", function(exports, require, module) {
var BaseView, CalendarHeader,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

module.exports = CalendarHeader = (function(_super) {
  __extends(CalendarHeader, _super);

  function CalendarHeader() {
    return CalendarHeader.__super__.constructor.apply(this, arguments);
  }

  CalendarHeader.prototype.tagName = 'table';

  CalendarHeader.prototype.id = 'calendarHeader';

  CalendarHeader.prototype.className = 'fc-header';

  CalendarHeader.prototype.template = require('./templates/calendar_header');

  CalendarHeader.prototype.initialize = function(options) {
    return this.cal = options != null ? options.cal : void 0;
  };

  CalendarHeader.prototype.getViewName = function() {
    var view;
    if (this.cal == null) {
      return 'list';
    }
    view = this.cal.fullCalendar('getView');
    if (view.name === 'agendaWeek') {
      return 'week';
    }
    return 'month';
  };

  CalendarHeader.prototype.getTitle = function() {
    var res, view;
    if (!this.cal) {
      return t('List');
    }
    view = this.cal.fullCalendar('getView');
    if (view.name === 'month') {
      res = view.intervalStart.format('MMMM YYYY');
    } else {
      res = $.fullCalendar.formatRange(view.start, view.end, 'MMM D YYYY');
    }
    return res;
  };

  CalendarHeader.prototype.getDates = function() {
    var view;
    view = this.cal.fullCalendar('getView');
    return [view.start, view.end];
  };

  CalendarHeader.prototype.isToday = function() {
    var end, start, _ref, _ref1;
    _ref = this.getDates(), start = _ref[0], end = _ref[1];
    return (start < (_ref1 = moment()) && _ref1 < end);
  };

  CalendarHeader.prototype.getRenderData = function() {
    var data;
    return data = {
      title: this.getTitle(),
      todaytxt: t('today'),
      calendarMode: this.cal != null,
      active: (function(_this) {
        return function(item) {
          if (item === 'today' && _this.isToday() || item === _this.getViewName()) {
            return 'fc-state-active';
          }
        };
      })(this)
    };
  };

  CalendarHeader.prototype.events = function() {
    return {
      'click .fc-button-next': (function(_this) {
        return function() {
          return _this.trigger('next');
        };
      })(this),
      'click .fc-button-prev': (function(_this) {
        return function() {
          return _this.trigger('prev');
        };
      })(this),
      'click .fc-button-today': (function(_this) {
        return function() {
          return _this.trigger('today');
        };
      })(this),
      'click .fc-button-month': (function(_this) {
        return function() {
          return _this.trigger('month');
        };
      })(this),
      'click .fc-button-week': (function(_this) {
        return function() {
          return _this.trigger('week');
        };
      })(this),
      'click .fc-button-list': (function(_this) {
        return function() {
          return _this.trigger('list');
        };
      })(this)
    };
  };

  return CalendarHeader;

})(BaseView);
});

;require.register("views/calendar_popover_event", function(exports, require, module) {
var ComboBox, Event, EventModal, EventPopOver, PopoverView, allDayDateFieldFormat, dFormat, defDatePickerOps, defTimePickerOpts, inputDateDTPickerFormat, tFormat,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

PopoverView = require('../lib/popover_view');

EventModal = require('views/event_modal');

ComboBox = require('views/widgets/combobox');

Event = require('models/event');

tFormat = 'HH:mm';

dFormat = 'DD/MM/YYYY';

inputDateDTPickerFormat = 'dd/mm/yyyy';

allDayDateFieldFormat = 'YYYY-MM-DD';

defTimePickerOpts = {
  template: false,
  minuteStep: 5,
  showMeridian: false
};

defDatePickerOps = {
  language: window.app.locale,
  fontAwesome: true,
  autoclose: true,
  pickerPosition: 'bottom-right',
  keyboardNavigation: false,
  format: inputDateDTPickerFormat,
  minView: 2,
  viewSelect: 4
};

module.exports = EventPopOver = (function(_super) {
  __extends(EventPopOver, _super);

  function EventPopOver() {
    this.onAdvancedClicked = __bind(this.onAdvancedClicked, this);
    this.onTab = __bind(this.onTab, this);
    return EventPopOver.__super__.constructor.apply(this, arguments);
  }

  EventPopOver.prototype.titleTemplate = require('./templates/popover_title');

  EventPopOver.prototype.template = require('./templates/popover_event');

  EventPopOver.prototype.events = {
    'keyup': 'onKeyUp',
    'change select': 'onKeyUp',
    'change input': 'onKeyUp',
    'click .add': 'onAddClicked',
    'click .advanced-link': 'onAdvancedClicked',
    'click .remove': 'onRemoveClicked',
    'click .duplicate': 'onDuplicateClicked',
    'click .close': 'selfclose',
    'changeTime.timepicker .input-start': 'onSetStart',
    'changeTime.timepicker .input-end-time': 'onSetEnd',
    'changeDate .input-end-date': 'onSetEnd',
    'click .input-allday': 'toggleAllDay',
    'input .input-desc': 'onSetDesc',
    'input .input-place': 'onSetPlace',
    'keydown [data-tabindex-next]': 'onTab',
    'keydown [data-tabindex-prev]': 'onTab'
  };

  EventPopOver.prototype.initialize = function(options) {
    if (!this.model) {
      this.model = new Event({
        start: options.start.toISOString(),
        end: options.end.toISOString(),
        description: '',
        place: ''
      });
    }
    EventPopOver.__super__.initialize.call(this, options);
    this.listenTo(this.model, 'change', this.refresh);
    return this.options = options;
  };

  EventPopOver.prototype.afterRender = function() {
    var timepickerEvents;
    this.addButton = this.$('.btn.add');
    this.removeButton = this.$('.remove');
    this.spinner = this.$('.remove-spinner');
    this.duplicateButton = this.$('.duplicate');
    this.$container = this.$('.popover-content-wrapper');
    timepickerEvents = {
      'focus': function() {
        return $(this).timepicker('highlightHour');
      },
      'timepicker.next': function() {
        return $("[tabindex=" + (+$(this).attr('tabindex') + 1) + "]").focus();
      },
      'timepicker.prev': function() {
        return $("[tabindex=" + (+$(this).attr('tabindex') - 1) + "]").focus();
      }
    };
    if (this.model.isNew()) {
      this.removeButton.hide();
      this.duplicateButton.hide();
    }
    this.$('input[type="time"]').attr('type', 'text').timepicker(defTimePickerOpts).delegate(timepickerEvents);
    this.$('.input-date').datetimepicker(defDatePickerOps);
    this.$('[tabindex=1]').focus();
    this.calendar = new ComboBox({
      el: this.$('.calendarcombo'),
      small: true,
      source: app.calendars.toAutoCompleteSource()
    });
    this.model.setCalendar(this.calendar.value());
    this.calendar.on('edition-complete', (function(_this) {
      return function(value) {
        return _this.model.setCalendar(value);
      };
    })(this));
    return this.refresh();
  };

  EventPopOver.prototype.setCaptions = function() {
    return this.$('.end-date .caption').html((function(_this) {
      return function() {
        var str;
        if (_this.model.isAllDay()) {
          if (_this.model.isSameDay()) {
            str = 'All one day';
          } else {
            str = 'All day, until';
          }
        } else {
          return ',&nbsp;';
        }
        return t(str);
      };
    })(this));
  };

  EventPopOver.prototype.getTitle = function() {
    var title;
    if (this.model.isNew()) {
      title = "" + this.type + " creation";
    } else {
      title = "edit " + this.type;
    }
    return t(title);
  };

  EventPopOver.prototype.getRenderData = function() {
    var currentCalendar, data, defaultCalendar, firstCalendar, _ref, _ref1, _ref2;
    firstCalendar = (_ref = app.calendars) != null ? (_ref1 = _ref.at(0)) != null ? _ref1.get('name') : void 0 : void 0;
    defaultCalendar = t('default calendar name');
    if (this.model.isNew()) {
      currentCalendar = firstCalendar || defaultCalendar;
    } else {
      currentCalendar = ((_ref2 = this.model.get('tags')) != null ? _ref2[0] : void 0) || defaultCalendar;
    }
    return data = _.extend({}, this.model.toJSON(), {
      tFormat: tFormat,
      dFormat: dFormat,
      editionMode: !this.model.isNew(),
      advancedUrl: "" + (this.parentView.getUrlHash()) + "/" + this.model.id,
      calendar: currentCalendar,
      allDay: this.model.isAllDay(),
      sameDay: this.model.isSameDay(),
      start: this.model.getStartDateObject(),
      end: this.model.getEndDateObject().add((this.model.isAllDay() ? -1 : 0), 'd')
    });
  };

  EventPopOver.prototype.onTab = function(ev) {
    var $this, index;
    if (ev.keyCode !== 9) {
      return;
    }
    $this = $(ev.target);
    if (!ev.shiftKey && $this.is('[data-tabindex-next]')) {
      index = $this.data('tabindex-next');
    }
    if (ev.shiftKey && $this.is('[data-tabindex-prev]')) {
      index = $this.data('tabindex-prev');
    }
    if (!index) {
      return;
    }
    this.$("[tabindex=" + index + "]").focus();
    return ev.preventDefault();
  };

  EventPopOver.prototype.onSetStart = function() {
    return this.model.setStart(this.formatDateTime(this.$('.input-start').val()));
  };

  EventPopOver.prototype.onSetEnd = function() {
    this.model.setEnd(this.formatDateTime(this.$('.input-end-time').val(), this.$('.input-end-date').val()));
    this.$container.toggleClass('is-same-day', this.model.isSameDay());
    return this.setCaptions();
  };

  EventPopOver.prototype.toggleAllDay = function() {
    var end, start;
    start = this.model.getStartDateObject();
    end = this.model.getEndDateObject();
    if (this.$('.input-allday').is(':checked')) {
      this.model.set('start', start.format(allDayDateFieldFormat));
      this.model.set('end', end.add(1, 'd').format(allDayDateFieldFormat));
    } else {
      this.model.set('start', start.hour(12).toISOString());
      this.model.set('end', start.hour(13).toISOString());
    }
    this.$('.timed').attr('aria-hidden', this.model.isAllDay());
    this.$container.toggleClass('is-all-day', this.model.isAllDay());
    return this.setCaptions();
  };

  EventPopOver.prototype.onSetDesc = function(ev) {
    return this.model.set('description', ev.target.value);
  };

  EventPopOver.prototype.onSetPlace = function(ev) {
    return this.model.set('place', ev.target.value);
  };

  EventPopOver.prototype.onAdvancedClicked = function(event) {
    var modal;
    if (this.model.isNew()) {
      modal = new EventModal({
        model: this.model,
        backurl: window.location.hash
      });
      $('body').append(modal.$el);
      modal.render();
    } else {
      window.location.hash += "/" + this.model.id;
    }
    event.preventDefault();
    return this.selfclose();
  };

  EventPopOver.prototype.onKeyUp = function(event) {
    if (event.keyCode === 13 || event.which === 13) {
      this.calendar.onBlur();
      this.onSetStart();
      this.onSetEnd();
      return this.addButton.click();
    } else if (event.keyCode === 27) {
      return this.selfclose();
    } else {
      return this.addButton.removeClass('disabled');
    }
  };

  EventPopOver.prototype.formatDateTime = function(timeStr, dateStr) {
    var d, date, hour, minute, month, setObj, splitted, t, year, _ref, _ref1;
    if (timeStr == null) {
      timeStr = '';
    }
    if (dateStr == null) {
      dateStr = '';
    }
    t = timeStr.match(/([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/);
    d = splitted = dateStr.match(/([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})/);
    if (t != null ? t[0] : void 0) {
      _ref = t.slice(1, 3), hour = _ref[0], minute = _ref[1];
    }
    if (d != null ? d[0] : void 0) {
      _ref1 = d.slice(1, 4), date = _ref1[0], month = _ref1[1], year = _ref1[2];
    }
    if (date && this.model.isAllDay()) {
      date = +date + 1;
    }
    if (month) {
      month = +month - 1;
    }
    return setObj = {
      hour: hour,
      minute: minute,
      date: date,
      month: month,
      year: year
    };
  };

  EventPopOver.prototype.onRemoveClicked = function() {
    if (confirm(t('are you sure'))) {
      this.spinner.show();
      this.removeButton.hide();
      return this.model.destroy({
        wait: true,
        error: function() {
          return alert(t('server error occured'));
        },
        complete: (function(_this) {
          return function() {
            _this.spinner.hide();
            return _this.selfclose();
          };
        })(this)
      });
    }
  };

  EventPopOver.prototype.onDuplicateClicked = function() {
    var attrs, calendarEvent, key, value, _ref;
    attrs = [];
    _ref = this.model.attributes;
    for (key in _ref) {
      value = _ref[key];
      attrs[key] = value;
    }
    delete attrs.id;
    delete attrs._id;
    calendarEvent = new Event(attrs);
    this.duplicateButton.hide();
    this.spinner.show();
    return calendarEvent.save(null, {
      wait: true,
      success: (function(_this) {
        return function() {
          _this.duplicateButton.show();
          return _this.spinner.hide();
        };
      })(this),
      error: (function(_this) {
        return function() {
          _this.duplicateButton.show();
          return _this.spinner.hide();
        };
      })(this)
    });
  };

  EventPopOver.prototype.onAddClicked = function() {
    var err, errors, _i, _len, _results;
    if (this.$('.btn.add').hasClass('disabled')) {
      return;
    }
    this.addButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    this.addButton.spin('small');
    errors = this.model.validate(this.model.attributes);
    if (errors) {
      this.addButton.html(this.getButtonText());
      this.addButton.children().show();
      this.addButton.spin();
      this.$('.alert').remove();
      this.$('input').css('border-color', '');
      _results = [];
      for (_i = 0, _len = errors.length; _i < _len; _i++) {
        err = errors[_i];
        _results.push(this.handleError(err));
      }
      return _results;
    } else {
      return this.model.save({}, {
        wait: true,
        success: (function(_this) {
          return function() {
            _this.calendar.save();
            return app.events.add(_this.model);
          };
        })(this),
        error: function() {
          return alert('server error occured');
        },
        complete: (function(_this) {
          return function() {
            _this.addButton.spin(false);
            _this.addButton.html(_this.getButtonText());
            _this.addButton.children().show();
            return _this.selfclose();
          };
        })(this)
      });
    }
  };

  EventPopOver.prototype.selfclose = function() {
    if (this.model.isNew()) {
      return EventPopOver.__super__.selfclose.call(this);
    } else {
      return this.model.fetch({
        complete: EventPopOver.__super__.selfclose.apply(this, arguments)
      });
    }
  };

  EventPopOver.prototype.close = function() {
    if (this.model.isNew()) {
      return EventPopOver.__super__.close.call(this);
    } else {
      return this.model.fetch({
        complete: EventPopOver.__super__.close.apply(this, arguments)
      });
    }
  };

  EventPopOver.prototype.refresh = function() {
    var delta, end;
    delta = this.model.isAllDay() ? -1 : 0;
    end = this.model.getEndDateObject().add(delta, 'd');
    this.$('.input-start').timepicker('setTime', this.model.getStartDateObject().format(tFormat), true, true);
    this.$('.input-end-time').timepicker('setTime', end.format(tFormat), true, true);
    return this.$('.input-end-date').val(end.format(dFormat));
  };

  EventPopOver.prototype.handleError = function(error) {
    var alertMsg, guiltyFields;
    switch (error.field) {
      case 'description':
        guiltyFields = '.input-desc';
        break;
      case 'startdate':
        guiltyFields = '.input-start';
        break;
      case 'enddate':
        guiltyFields = '.input-end-time, .input-end-date';
        break;
      case 'date':
        guiltyFields = '.input-start, .input-end-time, .input-end-date';
    }
    this.$(guiltyFields).css('border-color', 'red');
    this.$(guiltyFields).focus();
    alertMsg = $('<div class="alert"></div>').text(t(error.value));
    return this.$('.popover-content').before(alertMsg);
  };

  EventPopOver.prototype.getButtonText = function() {
    if (this.model.isNew()) {
      return t('create');
    } else {
      return t('edit');
    }
  };

  return EventPopOver;

})(PopoverView);
});

;require.register("views/calendar_view", function(exports, require, module) {
var BaseView, CalendarView, Event, EventPopover, Header, app, helpers, timezones,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

app = require('application');

BaseView = require('lib/base_view');

EventPopover = require('./calendar_popover_event');

Header = require('./calendar_header');

helpers = require('helpers');

timezones = require('helpers/timezone').timezones;

Event = require('models/event');

module.exports = CalendarView = (function(_super) {
  __extends(CalendarView, _super);

  function CalendarView() {
    this.onEventClick = __bind(this.onEventClick, this);
    this.onEventResize = __bind(this.onEventResize, this);
    this.onEventDrop = __bind(this.onEventDrop, this);
    this.onSelect = __bind(this.onSelect, this);
    this.getUrlHash = __bind(this.getUrlHash, this);
    this.onChangeView = __bind(this.onChangeView, this);
    this.refreshOne = __bind(this.refreshOne, this);
    this.handleWindowResize = __bind(this.handleWindowResize, this);
    return CalendarView.__super__.constructor.apply(this, arguments);
  }

  CalendarView.prototype.id = 'view-container';

  CalendarView.prototype.template = require('./templates/calendarview');

  CalendarView.prototype.initialize = function(options) {
    this.options = options;
    this.eventCollection = this.model.events;
    this.listenTo(this.eventCollection, 'add', this.refresh);
    this.listenTo(this.eventCollection, 'reset', this.refresh);
    this.listenTo(this.eventCollection, 'remove', this.onRemove);
    this.listenTo(this.eventCollection, 'change', this.refreshOne);
    this.model = null;
    this.calendarsCollection = app.calendars;
    return this.listenTo(this.calendarsCollection, 'change', this.refresh);
  };

  CalendarView.prototype.afterRender = function() {
    var debounced, locale, source;
    locale = moment.localeData();
    this.cal = this.$('#alarms');
    this.view = this.options.view;
    this.cal.fullCalendar({
      lang: window.locale,
      header: false,
      firstDay: 1,
      height: "auto",
      defaultView: this.view,
      year: this.options.year,
      month: this.options.month,
      date: this.options.date,
      viewRender: this.onChangeView,
      monthNames: locale._months,
      monthNamesShort: locale._monthsShort,
      dayNames: locale._weekdays,
      dayNamesShort: locale._weekdaysShort,
      buttonText: {
        today: t('today'),
        month: t('month'),
        week: t('week'),
        day: t('day')
      },
      timezone: window.app.timezone,
      timeFormat: '',
      columnFormat: {
        'week': 'ddd D',
        'month': 'dddd'
      },
      axisFormat: 'H:mm',
      allDaySlot: true,
      selectable: true,
      selectHelper: false,
      unselectAuto: false,
      eventRender: this.onEventRender,
      select: this.onSelect,
      eventDragStop: this.onEventDragStop,
      eventDrop: this.onEventDrop,
      eventClick: this.onEventClick,
      eventResizeStop: this.onEventResizeStop,
      eventResize: this.onEventResize,
      handleWindowResize: false
    });
    source = this.eventCollection.getFCEventSource(this.calendarsCollection);
    this.cal.fullCalendar('addEventSource', source);
    this.calHeader = new Header({
      cal: this.cal
    });
    this.calHeader.on('next', (function(_this) {
      return function() {
        return _this.cal.fullCalendar('next');
      };
    })(this));
    this.calHeader.on('prev', (function(_this) {
      return function() {
        return _this.cal.fullCalendar('prev');
      };
    })(this));
    this.calHeader.on('today', (function(_this) {
      return function() {
        return _this.cal.fullCalendar('today');
      };
    })(this));
    this.calHeader.on('week', (function(_this) {
      return function() {
        return _this.cal.fullCalendar('changeView', 'agendaWeek');
      };
    })(this));
    this.calHeader.on('month', (function(_this) {
      return function() {
        return _this.cal.fullCalendar('changeView', 'month');
      };
    })(this));
    this.calHeader.on('list', function() {
      return app.router.navigate('list', {
        trigger: true
      });
    });
    this.$('#alarms').prepend(this.calHeader.render().$el);
    this.handleWindowResize();
    debounced = _.debounce(this.handleWindowResize, 10);
    return $(window).resize(function(ev) {
      if (ev.target === window) {
        return debounced();
      }
    });
  };

  CalendarView.prototype.remove = function() {
    var _ref;
    if ((_ref = this.popover) != null) {
      _ref.close();
    }
    return CalendarView.__super__.remove.apply(this, arguments);
  };

  CalendarView.prototype.handleWindowResize = function(initial) {
    var fcHeaderHeight, fcViewContainreHeight, targetHeight;
    if ($(window).width() > 1000) {
      targetHeight = $(window).height() - 90;
      $("#menu").height(targetHeight + 90);
    } else if ($(window).width() > 600) {
      targetHeight = $(window).height() - 100;
      $("#menu").height(targetHeight + 100);
    } else {
      targetHeight = $(window).height() - 50;
      $("#menu").height(40);
    }
    if (initial !== 'initial') {
      this.cal.fullCalendar('option', 'height', targetHeight);
    }
    fcHeaderHeight = this.$('.fc-header').height();
    fcViewContainreHeight = this.$('.fc-view-container').height();
    return this.cal.height(fcHeaderHeight + fcViewContainreHeight);
  };

  CalendarView.prototype.refresh = function(collection) {
    return this.cal.fullCalendar('refetchEvents');
  };

  CalendarView.prototype.onRemove = function(model) {
    return this.cal.fullCalendar('removeEvents', model.cid);
  };

  CalendarView.prototype.refreshOne = function(model) {
    var data, fcEvent;
    if (model.isRecurrent()) {
      return this.refresh();
    }
    if (model.isAllDay()) {
      return this.refresh();
    }
    data = model.toPunctualFullCalendarEvent();
    fcEvent = this.cal.fullCalendar('clientEvents', data.id)[0];
    if (fcEvent != null) {
      _.extend(fcEvent, data);
      return this.cal.fullCalendar('updateEvent', fcEvent);
    }
  };

  CalendarView.prototype.showPopover = function(options) {
    var _ref, _ref1;
    options.container = this.cal;
    options.parentView = this;
    if (this.popover) {
      this.popover.close();
      if ((this.popover.options != null) && ((this.popover.options.model != null) && this.popover.options.model === options.model || (((_ref = this.popover.options.start) != null ? _ref.isSame(options.start) : void 0) && ((_ref1 = this.popover.options.end) != null ? _ref1.isSame(options.end) : void 0) && this.popover.options.type === options.type))) {
        this.cal.fullCalendar('unselect');
        this.popover = null;
        return;
      }
    }
    this.popover = new EventPopover(options);
    return this.popover.render();
  };

  CalendarView.prototype.closePopover = function() {
    var _ref;
    if ((_ref = this.popover) != null) {
      _ref.close();
    }
    return this.onPopoverClose();
  };

  CalendarView.prototype.onChangeView = function(view) {
    var f, hash, _ref;
    this.closePopover();
    if ((_ref = this.calHeader) != null) {
      _ref.render();
    }
    if (this.view !== view.name) {
      this.handleWindowResize();
    }
    this.view = view.name;
    f = this.view === 'month' ? '[month]/YYYY/M' : '[week]/YYYY/M/D';
    hash = view.intervalStart.format(f);
    return app.router.navigate(hash);
  };

  CalendarView.prototype.getUrlHash = function() {
    switch (this.cal.fullCalendar('getView').name) {
      case 'month':
        return 'calendar';
      case 'agendaWeek':
        return 'calendarweek';
    }
  };

  CalendarView.prototype.onSelect = function(startDate, endDate, jsEvent, view) {
    var end, start;
    if (this.view === 'month') {
      endDate.subtract(1, 'days');
      startDate = startDate.format() + 'T10:00:00.000';
      endDate = endDate.format() + 'T11:00:00.000';
    }
    start = helpers.ambiguousToTimezoned(startDate);
    end = helpers.ambiguousToTimezoned(endDate);
    return this.showPopover({
      type: 'event',
      start: start,
      end: end,
      target: $(jsEvent.target)
    });
  };

  CalendarView.prototype.onPopoverClose = function() {
    this.cal.fullCalendar('unselect');
    return this.popover = null;
  };

  CalendarView.prototype.onEventRender = function(event, $element) {
    var $displayedElement, spinTarget, time, title, titleAndTime, _ref;
    if ((event.isSaving != null) && event.isSaving) {
      spinTarget = $element.find('.fc-event-time');
      spinTarget.addClass('spinning');
      spinTarget.html("&nbsp;");
      spinTarget.spin("tiny");
    }
    $displayedElement = $element.find('.fc-title');
    titleAndTime = $displayedElement.html();
    if (event.allDay) {
      time = '';
      title = titleAndTime;
    } else {
      _ref = titleAndTime.split(' '), time = _ref[0], title = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
      title = title.join(' ');
    }
    $element.find('.fc-time').html(time);
    $element.find('.fc-title').html(title);
    $element.attr('title', event.title);
    return $element;
  };

  CalendarView.prototype.onEventDragStop = function(event, jsEvent, ui, view) {
    return event.isSaving = true;
  };

  CalendarView.prototype.onEventDrop = function(fcEvent, delta, revertFunc, jsEvent, ui, view) {
    var evt;
    evt = this.eventCollection.get(fcEvent.id);
    evt.addToStart(delta);
    evt.addToEnd(delta);
    return evt.save({}, {
      wait: true,
      success: function() {
        return fcEvent.isSaving = false;
      },
      error: function() {
        fcEvent.isSaving = false;
        return revertFunc();
      }
    });
  };

  CalendarView.prototype.onEventResizeStop = function(fcEvent, jsEvent, ui, view) {
    return fcEvent.isSaving = true;
  };

  CalendarView.prototype.onEventResize = function(fcEvent, delta, revertFunc, jsEvent, ui, view) {
    var model;
    model = this.eventCollection.get(fcEvent.id);
    model.addToEnd(delta);
    return model.save({}, {
      wait: true,
      success: function() {
        return fcEvent.isSaving = false;
      },
      error: function() {
        fcEvent.isSaving = false;
        return revertFunc();
      }
    });
  };

  CalendarView.prototype.onEventClick = function(fcEvent, jsEvent, view) {
    var model;
    if ($(jsEvent.target).hasClass('ui-resizable-handle')) {
      return true;
    }
    model = (function() {
      if (fcEvent.type === 'event') {
        return this.eventCollection.get(fcEvent.id);
      } else {
        throw new Error('wrong typed event in fc');
      }
    }).call(this);
    return this.showPopover({
      type: model.fcEventType,
      model: model,
      target: $(jsEvent.currentTarget)
    });
  };

  return CalendarView;

})(BaseView);
});

;require.register("views/event_modal", function(exports, require, module) {
var ComboBox, Event, EventModal, H, RRuleFormView, ReminderView, TagsView, ViewCollection, app, random,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('lib/view_collection');

ReminderView = require('views/event_modal_reminder');

RRuleFormView = require('views/event_modal_rrule');

TagsView = require('views/tags');

ComboBox = require('views/widgets/combobox');

Event = require('models/event');

random = require('lib/random');

app = require('application');

H = require('helpers');

module.exports = EventModal = (function(_super) {
  __extends(EventModal, _super);

  function EventModal() {
    this.remove = __bind(this.remove, this);
    this.close = __bind(this.close, this);
    this.configureGuestTypeahead = __bind(this.configureGuestTypeahead, this);
    this.handleError = __bind(this.handleError, this);
    this.save = __bind(this.save, this);
    this.resizeDescription = __bind(this.resizeDescription, this);
    this.addReminder = __bind(this.addReminder, this);
    this.refreshGuestList = __bind(this.refreshGuestList, this);
    this.onGuestAdded = __bind(this.onGuestAdded, this);
    this.toggleAllDay = __bind(this.toggleAllDay, this);
    this.hideOnEscape = __bind(this.hideOnEscape, this);
    return EventModal.__super__.constructor.apply(this, arguments);
  }

  EventModal.prototype.template = require('./templates/event_modal');

  EventModal.prototype.id = 'event-modal';

  EventModal.prototype.className = 'modal fade';

  EventModal.prototype.attributes = {
    'data-keyboard': 'false'
  };

  EventModal.prototype.inputDateTimeFormat = 'DD/MM/YYYY H:mm';

  EventModal.prototype.inputDateTimeDTPickerFormat = 'dd/mm/yyyy hh:ii';

  EventModal.prototype.inputDateFormat = 'DD/MM/YYYY';

  EventModal.prototype.inputDateDTPickerFormat = 'dd/mm/yyyy';

  EventModal.prototype.exportDateFormat = 'YYYY-MM-DD';

  EventModal.prototype.collectionEl = '#guests-list';

  EventModal.prototype.itemview = require('./event_modal_guest');

  EventModal.prototype.initialize = function(options) {
    var guests;
    guests = this.model.get('attendees') || [];
    this.collection = new Backbone.Collection(guests);
    this.listenTo(this.collection, 'remove', this.onGuestRemoved);
    this.backurl = options.backurl;
    return EventModal.__super__.initialize.apply(this, arguments);
  };

  EventModal.prototype.events = function() {
    return {
      'click  #confirm-btn': 'save',
      'click  #cancel-btn': 'close',
      'click  .close': 'close',
      'click #addguest': (function(_this) {
        return function() {
          return _this.onGuestAdded(_this.$('#addguest-field').val());
        };
      })(this),
      'keydown #basic-description': 'resizeDescription',
      'keypress #basic-description': 'resizeDescription',
      'click .addreminder': (function(_this) {
        return function() {
          return _this.addReminder({
            action: 'DISPLAY',
            trigg: '-PT10M'
          });
        };
      })(this),
      'click #allday': 'toggleAllDay'
    };
  };

  EventModal.prototype.afterRender = function() {
    var end, _ref;
    EventModal.__super__.afterRender.apply(this, arguments);
    this.addGuestField = this.configureGuestTypeahead();
    this.startField = this.$('#basic-start').attr('type', 'text');
    this.endField = this.$('#basic-end').attr('type', 'text');
    this.startField.val(this.model.getStartDateObject().format(this.inputDateTimeFormat));
    end = this.model.getEndDateObject();
    if (this.model.isAllDay()) {
      end.add(-1, 'days');
    }
    this.endField.val(end.format(this.inputDateTimeFormat));
    this.toggleAllDay();
    this.descriptionField = this.$('#basic-description');
    this.reminders = [];
    if ((_ref = this.model.get('alarms')) != null) {
      _ref.forEach(this.addReminder);
    }
    this.rruleForm = new RRuleFormView({
      model: this.model
    });
    this.rruleForm.render();
    this.$('#rrule-container').append(this.rruleForm.$el);
    this.tags = new TagsView({
      model: this.model,
      el: this.$('#basic-tags')
    });
    this.calendar = new ComboBox({
      el: this.$('#basic-calendar'),
      source: app.calendars.toAutoCompleteSource()
    });
    this.$el.modal('show');
    $(document).on('keydown', this.hideOnEscape);
    this.$el.on('hidden', (function(_this) {
      return function() {
        $(document).off('keydown', _this.hideOnEscape);
        window.app.router.navigate(_this.backurl || '', {
          trigger: false,
          replace: true
        });
        return _this.remove();
      };
    })(this));
    return this.$('#basic-summary').focus();
  };

  EventModal.prototype.hideOnEscape = function(e) {
    if (e.which === 27 && !e.isDefaultPrevented()) {
      return this.close();
    }
  };

  EventModal.prototype.toggleAllDay = function() {
    var dtFormat, end, options, start;
    this.startField.datetimepicker('remove');
    this.endField.datetimepicker('remove');
    start = moment(this.startField.val(), this.inputDateTimeFormat);
    end = moment(this.endField.val(), this.inputDateTimeFormat);
    options = {
      language: window.app.locale,
      fontAwesome: true,
      autoclose: true,
      pickerPosition: 'bottom-right',
      keyboardNavigation: false
    };
    if (this.$('#allday').is(':checked')) {
      dtFormat = this.inputDateFormat;
      _.extend(options, {
        format: this.inputDateDTPickerFormat,
        minView: 2,
        viewSelect: 4
      });
    } else {
      dtFormat = this.inputDateTimeFormat;
      _.extend(options, {
        format: this.inputDateTimeDTPickerFormat,
        viewSelect: 4
      });
    }
    this.startField.val(start.format(dtFormat));
    this.endField.val(end.format(dtFormat));
    this.startField.datetimepicker(options);
    return this.endField.datetimepicker(options);
  };

  EventModal.prototype.onGuestAdded = function(info) {
    var email, guests, id, _ref;
    _ref = info.split(';'), email = _ref[0], id = _ref[1];
    if (!email) {
      return "";
    }
    guests = this.model.get('attendees') || [];
    if (!_.findWhere(guests, {
      email: email
    })) {
      guests = _.clone(guests);
      guests.push({
        key: random.randomString(),
        status: 'INVITATION-NOT-SENT',
        email: email,
        contactid: id || null
      });
      this.model.set('attendees', guests);
      this.refreshGuestList();
      this.$('#confirm-btn').text(t('save changes and invite guests'));
    }
    this.addGuestField.val('');
    return "";
  };

  EventModal.prototype.refreshGuestList = function() {
    return this.collection.reset(this.model.get('attendees'));
  };

  EventModal.prototype.onGuestRemoved = function(removed) {
    var attendee, attendees, index, _i, _len;
    attendees = this.model.get('attendees') || [];
    for (index = _i = 0, _len = attendees.length; _i < _len; index = ++_i) {
      attendee = attendees[index];
      if (attendee.email === removed.get('email')) {
        attendees.splice(index, 1);
        break;
      }
    }
    return this.model.set('attendees', attendees);
  };

  EventModal.prototype.addReminder = function(reminderM) {
    var reminder, _ref;
    if ((_ref = reminderM.action) === 'EMAIL' || _ref === 'DISPLAY' || _ref === 'BOTH') {
      this.$('#reminder-explanation').removeClass('hide');
      reminder = new ReminderView({
        model: reminderM
      });
      this.reminders.push(reminder);
      reminder.on('remove', (function(_this) {
        return function(removedReminder) {
          return _this.reminders.splice(_this.reminders.indexOf(removedReminder), 1);
        };
      })(this));
      reminder.render();
      return this.$('#reminder-container').append(reminder.$el);
    }
  };

  EventModal.prototype.resizeDescription = function() {
    var loc, notes, rows;
    notes = this.descriptionField.val();
    rows = loc = 0;
    while (loc = notes.indexOf("\n", loc) + 1) {
      rows++;
    }
    return this.descriptionField.prop('rows', rows + 2);
  };

  EventModal.prototype.getRenderData = function() {
    var data, day, desc, f, specialCharacters, _ref, _ref1;
    specialCharacters = /[-'`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi;
    desc = this.model.get('description').replace(specialCharacters, '');
    desc = desc.replace(/\ /g, '-');
    day = moment(this.model.get('start')).format(this.exportDateFormat);
    data = _.extend({}, this.model.toJSON(), {
      summary: this.model.get('description'),
      description: this.model.get('details'),
      allDay: this.model.isAllDay(),
      file: "" + day + "-" + desc
    });
    f = this.model.isAllDay() ? this.inputDateFormat : this.inputDateTimeFormat;
    data.start = this.model.getStartDateObject().format(f);
    data.end = this.model.getEndDateObject().format(f);
    data.calendar = ((_ref = data.tags) != null ? _ref[0] : void 0) || '';
    data.tags = ((_ref1 = data.tags) != null ? _ref1.slice(1) : void 0) || [];
    return data;
  };

  EventModal.prototype.save = function() {
    var data, dtE, dtS, error, rruleStr, validModel, validationErrors, _i, _len, _results;
    data = {
      details: this.descriptionField.val(),
      description: this.$('#basic-summary').val(),
      place: this.$('#basic-place').val(),
      tags: [this.$('#basic-calendar').val()].concat(this.tags.getTags())
    };
    data.alarms = this.reminders.map(function(v) {
      return v.getModelAttributes();
    });
    data.rrule = this.rruleForm.hasRRule() ? (rruleStr = this.rruleForm.getRRule().toString(), data.rrule = rruleStr.split(';').filter(function(s) {
      return s.indexOf('DTSTART' !== 0);
    }).join(';')) : void 0;
    if (this.$('#allday').is(':checked')) {
      dtS = moment.tz(this.startField.val(), this.inputDateFormat, window.app.timezone);
      dtE = moment.tz(this.endField.val(), this.inputDateFormat, window.app.timezone);
      dtE.add('day', 1);
      data.start = H.momentToDateString(dtS);
      data.end = H.momentToDateString(dtE);
    } else {
      dtS = moment.tz(this.startField.val(), this.inputDateTimeFormat, window.app.timezone);
      dtE = moment.tz(this.endField.val(), this.inputDateTimeFormat, window.app.timezone);
      if (this.rruleForm.hasRRule()) {
        data.timezone = window.app.timezone;
        data.start = H.momentToAmbiguousString(dtS);
        data.end = H.momentToAmbiguousString(dtE);
      } else {
        data.start = dtS.toISOString();
        data.end = dtE.toISOString();
      }
    }
    if (data.start !== this.model.get(this.model.startDateField)) {
      this.model.startDateChanged = true;
    }
    validModel = this.model.save(data, {
      success: (function(_this) {
        return function() {
          _this.calendar.save();
          app.events.add(_this.model);
          return _this.close();
        };
      })(this),
      error: (function(_this) {
        return function() {
          alert('server error');
          return _this.close();
        };
      })(this)
    });
    if (!validModel) {
      this.$('.alert').remove();
      this.$('.control-group').removeClass('error');
      validationErrors = this.model.validationError;
      if (validationErrors != null) {
        _results = [];
        for (_i = 0, _len = validationErrors.length; _i < _len; _i++) {
          error = validationErrors[_i];
          _results.push(this.handleError(error));
        }
        return _results;
      }
    }
  };

  EventModal.prototype.handleError = function(error) {
    var alertMsg, guiltyFields;
    switch (error.field) {
      case 'description':
        guiltyFields = '#basic-summary';
        break;
      case 'startdate':
        guiltyFields = '#basic-start';
        break;
      case 'enddate':
        guiltyFields = '#basic-end';
        break;
      case 'date':
        guiltyFields = '#basic-start, #basic-end';
    }
    this.$(guiltyFields).parents('.control-group').addClass('error');
    alertMsg = $('<div class="alert"></div>').text(t(error.value));
    return this.$('.modal-body').before(alertMsg);
  };

  EventModal.prototype.configureGuestTypeahead = function() {
    return this.$('#addguest-field').typeahead({
      source: app.contacts.asTypeaheadSource(),
      matcher: function(contact) {
        var old;
        old = $.fn.typeahead.Constructor.prototype.matcher;
        return old.call(this, contact.display);
      },
      sorter: function(contacts) {
        var beginswith, caseInsensitive, caseSensitive, contact, item;
        beginswith = [];
        caseSensitive = [];
        caseInsensitive = [];
        while ((contact = contacts.shift())) {
          item = contact.display;
          if (!item.toLowerCase().indexOf(this.query.toLowerCase())) {
            beginswith.push(contact);
          } else if (~item.indexOf(this.query)) {
            caseSensitive.push(contact);
          } else {
            caseInsensitive.push(contact);
          }
        }
        return beginswith.concat(caseSensitive, caseInsensitive);
      },
      highlighter: function(contact) {
        var old;
        old = $.fn.typeahead.Constructor.prototype.highlighter;
        return old.call(this, contact.display);
      },
      updater: this.onGuestAdded
    });
  };

  EventModal.prototype.close = function() {
    return this.$el.modal('hide');
  };

  EventModal.prototype.remove = function() {
    this.tags.remove();
    this.calendar.remove();
    this.startField.data('datetimepicker').remove();
    this.endField.data('datetimepicker').remove();
    return EventModal.__super__.remove.apply(this, arguments);
  };

  return EventModal;

})(ViewCollection);
});

;require.register("views/event_modal_guest", function(exports, require, module) {
var BaseView, GuestView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

module.exports = GuestView = (function(_super) {
  __extends(GuestView, _super);

  function GuestView() {
    return GuestView.__super__.constructor.apply(this, arguments);
  }

  GuestView.prototype.template = require('./templates/event_modal_guest');

  GuestView.prototype.events = {
    'click .remove-guest': 'onRemoveGuest'
  };

  GuestView.prototype.onRemoveGuest = function() {
    return this.model.collection.remove(this.model);
  };

  return GuestView;

})(BaseView);
});

;require.register("views/event_modal_reminder", function(exports, require, module) {
var BaseView, H, ReminderView, Toggle,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

Toggle = require('views/toggle');

H = require('../../helpers');

module.exports = ReminderView = (function(_super) {
  __extends(ReminderView, _super);

  function ReminderView() {
    this.getRenderData = __bind(this.getRenderData, this);
    return ReminderView.__super__.constructor.apply(this, arguments);
  }

  ReminderView.prototype.className = 'reminder';

  ReminderView.prototype.template = require('./templates/event_modal_reminder');

  ReminderView.prototype.events = function() {
    return {
      'click .removereminder': 'remove'
    };
  };

  ReminderView.prototype.afterRender = function() {
    var inputDuration, _ref, _ref1;
    this.actionMail = new Toggle({
      icon: 'envelope',
      label: 'email notification',
      value: (_ref = this.model.action) === 'EMAIL' || _ref === 'BOTH'
    });
    this.actionNotif = new Toggle({
      icon: 'exclamation',
      label: 'home notification',
      value: (_ref1 = this.model.action) === 'DISPLAY' || _ref1 === 'BOTH'
    });
    this.actionMail.on('toggle', (function(_this) {
      return function(mailIsOn) {
        if (!mailIsOn) {
          return _this.actionNotif.toggle(true);
        }
      };
    })(this));
    this.actionNotif.on('toggle', (function(_this) {
      return function(notifIsOn) {
        if (!notifIsOn) {
          return _this.actionMail.toggle(true);
        }
      };
    })(this));
    inputDuration = this.$('.triggervalue');
    inputDuration.before(this.actionMail.$el);
    return inputDuration.before(this.actionNotif.$el);
  };

  ReminderView.prototype.remove = function() {
    this.trigger('remove', this);
    return ReminderView.__super__.remove.apply(this, arguments);
  };

  ReminderView.prototype.getRenderData = function() {
    var data, unit, uv, value;
    if (!this.model.isNew) {
      uv = H.iCalDurationToUnitValue(this.model.trigg);
      unit = Object.keys(uv)[0];
      value = uv[unit];
    } else {
      unit = 'M';
      value = 10;
    }
    data = {
      isNew: this.model.isNew,
      isSelectedUnit: function(u) {
        return u === unit;
      },
      durationValue: value,
      model: this.model
    };
    return data;
  };

  ReminderView.prototype.getModelAttributes = function() {
    var action, data, uv;
    action = this.actionNotif.value && this.actionMail.value ? 'BOTH' : this.actionMail.value ? 'EMAIL' : 'DISPLAY';
    uv = {};
    uv[this.$('.triggerunit').val()] = this.$('.triggervalue').val();
    data = {
      action: action,
      trigg: H.unitValuesToiCalDuration(uv)
    };
    return data;
  };

  return ReminderView;

})(BaseView);
});

;require.register("views/event_modal_rrule", function(exports, require, module) {
var BaseView, RRuleView,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

BaseView = require('../lib/base_view');

module.exports = RRuleView = (function(_super) {
  __extends(RRuleView, _super);

  function RRuleView() {
    this.updateHelp = __bind(this.updateHelp, this);
    this.toggleCountUntil = __bind(this.toggleCountUntil, this);
    this.showRRule = __bind(this.showRRule, this);
    this.getRRule = __bind(this.getRRule, this);
    this.hasRRule = __bind(this.hasRRule, this);
    return RRuleView.__super__.constructor.apply(this, arguments);
  }

  RRuleView.prototype.template = require('./templates/event_modal_rrule');

  RRuleView.prototype.inputDateFormat = 'DD/MM/YYYY';

  RRuleView.prototype.inputDateDTPickerFormat = 'dd/mm/yyyy';

  RRuleView.prototype.events = function() {
    return {
      'click  .rrule-show': 'showRRule',
      'change #rrule': 'updateHelp',
      'changeDate #rrule-until': 'toggleCountUntil',
      'input  #rrule-until': 'toggleCountUntil',
      'change #rrule-count': 'toggleCountUntil'
    };
  };

  RRuleView.prototype.afterRender = function() {
    this.$('#rrule').hide();
    this.updateHelp();
    return this.$('#rrule-until').attr('type', 'text').datetimepicker({
      language: window.app.locale,
      fontAwesome: true,
      autoclose: true,
      format: this.inputDateDTPickerFormat,
      minView: 2,
      viewSelect: 4,
      keyboardNavigation: false,
      pickerPosition: 'top-right'
    }).on('changeDate', this.updateHelp);
  };

  RRuleView.prototype.getRenderData = function() {
    var data, options, rrule;
    data = {
      weekDays: moment.localeData()._weekdays
    };
    if (!this.model.has('rrule')) {
      return _.extend(data, {
        rrule: {
          freq: 'NOREPEAT',
          interval: 1,
          count: 4,
          until: ""
        },
        freqSelected: function(value) {
          if (value === 'NOREPEAT') {
            return 'selected';
          }
        },
        wkdaySelected: function() {
          return false;
        },
        endModeSelected: function(value) {
          if (value === 'forever') {
            return 'selected';
          }
        },
        yearModeIs: function(value) {
          if (value === 'date') {
            return "checked";
          }
        }
      });
    }
    options = RRule.fromString(this.model.get('rrule')).options;
    rrule = {
      freq: options.freq,
      interval: options.interval
    };
    if (options.until) {
      rrule.endMode = 'until';
      rrule.until = moment.tz(options.until, 'UTC').format(this.inputDateFormat);
      rrule.count = '';
    } else if (options.count) {
      rrule.endMode = 'count';
      rrule.count = options.count;
      rrule.until = '';
    } else {
      rrule.endMode = 'forever';
      rrule.count = '';
      rrule.until = '';
    }
    return _.extend(data, {
      rrule: rrule,
      freqSelected: function(value) {
        var result;
        result = value === rrule.freq;
        if (result) {
          return 'selected';
        }
      },
      wkdaySelected: function(value) {
        var result, _ref;
        result = options.byweekday && (_ref = (value + 6) % 7, __indexOf.call(options.byweekday, _ref) >= 0);
        if (result) {
          return 'checked';
        }
      },
      endModeSelected: function(value) {
        if (value === rrule.endMode) {
          return 'selected';
        }
      },
      yearModeIs: function(value) {
        var result, _ref, _ref1;
        result = (value === 'weekdate' && ((_ref = options.bynweekday) != null ? _ref.length : void 0)) || (value === 'date' && ((_ref1 = options.bymonthday) != null ? _ref1.length : void 0));
        if (result) {
          return 'checked';
        }
      }
    });
  };

  RRuleView.prototype.hasRRule = function() {
    return this.$('#rrule-freq').val() !== 'NOREPEAT';
  };

  RRuleView.prototype.getRRule = function() {
    var RRuleWdays, day, monthmode, options, rawDate, start, wk;
    start = this.model.getStartDateObject();
    RRuleWdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
    options = {
      freq: +this.$('#rrule-freq').val(),
      interval: +this.$('#rrule-interval').val()
    };
    if (options.freq === RRule.WEEKLY) {
      options.byweekday = [];
      this.$('#rrule-weekdays :checked').each(function(idx, box) {
        return options.byweekday.push(RRuleWdays[box.value]);
      });
      if (options.byweekday.length === 7) {
        delete options.byweekday;
      }
    } else if (options.freq === RRule.MONTHLY) {
      monthmode = this.$('#rrule-monthdays :radio:checked').val();
      if (monthmode === "date") {
        options.bymonthday = start.date();
      } else if (monthmode === 'weekdate') {
        day = RRuleWdays[start.day()];
        wk = Math.ceil(start.date() / 7);
        if (wk > 4) {
          wk = -1;
        }
        options.byweekday = day.nth(wk);
      }
    }
    switch (this.$('input:radio[name=endMode]:checked').val()) {
      case 'count':
        options.count = +this.$('#rrule-count').val();
        break;
      case 'until':
        rawDate = this.$('#rrule-until').val();
        options.until = moment.tz(rawDate, this.inputDateFormat, 'UTC').toDate();
    }
    return new RRule(options);
  };

  RRuleView.prototype.showRRule = function() {
    this.updateHelp();
    this.$('#rrule-action').hide();
    return this.$('#rrule-short').slideDown((function(_this) {
      return function() {
        return _this.$('#rrule').slideDown();
      };
    })(this));
  };

  RRuleView.prototype.toggleCountUntil = function(event) {
    var radio;
    radio = this.$('input:radio[name=endMode]');
    if (event.target.id === 'rrule-count') {
      this.$('#rrule-until').val('');
      radio[1].checked = true;
    } else if (event.target.id === 'rrule-until') {
      this.$('#rrule-count').val('');
      radio[2].checked = true;
    }
    return this.updateHelp();
  };

  RRuleView.prototype.updateHelp = function() {
    var freq, language, locale;
    freq = this.$('#rrule-freq').val();
    if (freq === 'NOREPEAT') {
      this.$('#rrule-action').show();
      this.$('#rrule-help').html(t('no recurrence'));
      this.$('#rrule-interval').toggle(false);
      this.$('#rrule-monthdays').toggle(false);
      this.$('#rrule-weekdays').toggle(false);
      this.$('#rrule-repeat').toggle(false);
      return;
    } else {
      freq = +freq;
    }
    this.$('#rrule-interval').toggle(true);
    this.$('#rrule-repeat').toggle(true);
    this.$('#rrule-monthdays').toggle(freq === RRule.MONTHLY);
    this.$('#rrule-weekdays').toggle(freq === RRule.WEEKLY);
    locale = moment.localeData();
    language = {
      dayNames: locale._weekdays,
      monthNames: locale._months
    };
    this.$('#rrule-help').html(this.getRRule().toText(window.t, language));
    return true;
  };

  return RRuleView;

})(BaseView);
});

;require.register("views/import_event_list", function(exports, require, module) {
var EventCollection, EventList, EventView, ViewCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('../lib/view_collection');

EventView = require('./import_event_view');

EventCollection = require('../collections/events');

module.exports = EventList = (function(_super) {
  __extends(EventList, _super);

  function EventList() {
    return EventList.__super__.constructor.apply(this, arguments);
  }

  EventList.prototype.itemview = EventView;

  EventList.prototype.collection = new EventCollection();

  return EventList;

})(ViewCollection);
});

;require.register("views/import_event_view", function(exports, require, module) {
var BaseView, EventView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

module.exports = EventView = (function(_super) {
  __extends(EventView, _super);

  function EventView() {
    return EventView.__super__.constructor.apply(this, arguments);
  }

  EventView.prototype.tagName = 'div';

  EventView.prototype.className = 'event';

  EventView.prototype.template = require('./templates/import_event');

  EventView.prototype.getRenderData = function() {
    return _.extend(this.model.toJSON(), {
      start: this.model.getFormattedStartDate('YYYY/MM/DD HH:mm'),
      end: this.model.getFormattedEndDate('YYYY/MM/DD HH:mm')
    });
  };

  return EventView;

})(BaseView);
});

;require.register("views/import_view", function(exports, require, module) {
var BaseView, ComboBox, Event, EventList, ImportView, helpers,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

ComboBox = require('views/widgets/combobox');

helpers = require('../helpers');

Event = require('../models/event');

EventList = require('./import_event_list');

module.exports = ImportView = (function(_super) {
  __extends(ImportView, _super);

  function ImportView() {
    return ImportView.__super__.constructor.apply(this, arguments);
  }

  ImportView.prototype.id = 'view-container';

  ImportView.prototype.events = {
    'change #import-file-input': 'onFileChanged',
    'click button#confirm-import-button': 'onConfirmImportClicked',
    'click button#cancel-import-button': 'onCancelImportClicked'
  };

  ImportView.prototype.template = require('./templates/import_view');

  ImportView.prototype.afterRender = function() {
    this.$(".confirmation").hide();
    this.$(".results").hide();
    this.eventList = new EventList({
      el: this.$("#import-event-list")
    });
    this.eventList.render();
    this.uploader = this.$('#import-file-input');
    this.importButton = this.$('#import-button');
    this.confirmButton = this.$('button#confirm-button');
    return setTimeout((function(_this) {
      return function() {
        return _this.calendarCombo = new ComboBox({
          el: _this.$('#import-calendar-combo'),
          small: true,
          source: app.calendars.toAutoCompleteSource()
        });
      };
    })(this), 500);
  };

  ImportView.prototype.onFileChanged = function(event) {
    var file, form;
    file = this.uploader[0].files[0];
    if (!file) {
      return;
    }
    form = new FormData();
    form.append("file", file);
    this.importButton.find('span').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    this.importButton.spin('tiny');
    this.eventList.collection.reset();
    this.$('.import-progress').html(null);
    this.$('.import-errors').html(null);
    return $.ajax({
      url: "import/ical",
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      success: (function(_this) {
        return function(result) {
          var events, vevent, _i, _len, _ref, _ref1;
          if (result != null ? (_ref = result.calendar) != null ? _ref.name : void 0 : void 0) {
            _this.calendarCombo.setValue(result.calendar.name);
          }
          if ((result != null ? result.events : void 0) != null) {
            events = [];
            _ref1 = result.events;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              vevent = _ref1[_i];
              events.push(new Event(vevent));
            }
            _this.eventList.collection.add(events);
          }
          return _this.$(".import-form").fadeOut(function() {
            _this.resetUploader();
            _this.importButton.spin();
            _this.importButton.find('span').html(t('select an icalendar file'));
            _this.$(".results").slideDown();
            return _this.$(".confirmation").fadeIn();
          });
        };
      })(this),
      error: (function(_this) {
        return function(xhr) {
          var msg;
          msg = JSON.parse(xhr.responseText).msg;
          if (msg == null) {
            msg = 'An error occured while importing your calendar.';
          }
          alert(msg);
          _this.resetUploader();
          _this.importButton.spin();
          return _this.importButton.find('span').html(t('select an icalendar file'));
        };
      })(this)
    });
  };

  ImportView.prototype.onConfirmImportClicked = function() {
    var addError, calendar, counter, events, finalizeImport, importEvent, total, updateCounter;
    calendar = this.calendarCombo.value();
    if ((calendar == null) || calendar === '') {
      calendar = t('default calendar name');
    }
    total = this.eventList.collection.length;
    counter = 0;
    $('.import-progress').html("<p>" + (t('imported events')) + ":\n    <span class=\"import-counter\">0</span>/" + total + "</p>");
    updateCounter = function() {
      counter++;
      return $('.import-counter').html(counter);
    };
    addError = function(element, templatePath) {
      if ($('.import-errors').html().length === 0) {
        $('.import-errors').html("<p>" + (t('import error occured for')) + "</p>");
      }
      return $('.import-errors').append(require(templatePath)(element.attributes));
    };
    this.confirmButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    this.confirmButton.spin('tiny');
    importEvent = function(event, callback) {
      event.set('tags', [calendar]);
      event.set('id', null);
      event.set('import', true);
      return event.save(null, {
        success: function(model) {
          app.events.add(model);
          updateCounter();
          return callback();
        },
        error: function() {
          addEventError(event, './templates/import_event');
          updateCounter();
          return callback();
        }
      });
    };
    finalizeImport = (function(_this) {
      return function(err) {
        alert(t('import finished'));
        _this.$(".confirmation").fadeOut();
        return _this.$(".results").slideUp(function() {
          _this.$(".import-form").fadeIn();
          _this.confirmButton.html(t('confirm import'));
          if ($('.import-errors').html().length === 0) {
            return app.router.navigate("calendar", true);
          }
        });
      };
    })(this);
    this.calendarCombo.save();
    events = this.eventList.collection.models;
    return async.eachSeries(events, importEvent, finalizeImport);
  };

  ImportView.prototype.onCancelImportClicked = function() {
    this.$(".confirmation").fadeOut();
    return this.$(".results").slideUp((function(_this) {
      return function() {
        return _this.$(".import-form").fadeIn();
      };
    })(this));
  };

  ImportView.prototype.resetUploader = function() {
    this.uploader.wrap('<form>').parent('form').trigger('reset');
    return this.uploader.unwrap();
  };

  return ImportView;

})(BaseView);
});

;require.register("views/list_view", function(exports, require, module) {
var Header, ListView, ViewCollection, defaultTimezone, helpers,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('../lib/view_collection');

Header = require('views/calendar_header');

helpers = require('../helpers');

defaultTimezone = 'timezone';

module.exports = ListView = (function(_super) {
  __extends(ListView, _super);

  function ListView() {
    this.checkScroll = __bind(this.checkScroll, this);
    this.keepScreenFull = __bind(this.keepScreenFull, this);
    return ListView.__super__.constructor.apply(this, arguments);
  }

  ListView.prototype.id = 'view-container';

  ListView.prototype.template = require('./templates/list_view');

  ListView.prototype.itemview = require('./list_view_bucket');

  ListView.prototype.collectionEl = '#alarm-list';

  ListView.prototype.events = {
    'click .showafter': 'loadAfter',
    'click .showbefore': 'loadBefore'
  };

  ListView.prototype.afterRender = function() {
    this.calHeader = new Header();
    this.$('#calheader').html(this.calHeader.render().$el);
    this.calHeader.on('month', function() {
      return app.router.navigate('', {
        trigger: true
      });
    });
    this.calHeader.on('week', function() {
      return app.router.navigate('week', {
        trigger: true
      });
    });
    this.$('#list-container').scroll(this.checkScroll);
    this.collection.on('reset', (function(_this) {
      return function() {
        _this.$('.showafter').show();
        _this.$('.showbefore').show();
        _this.lastAlreadyLoaded = false;
        return _this.keepScreenFull();
      };
    })(this));
    ListView.__super__.afterRender.apply(this, arguments);
    return this.keepScreenFull();
  };

  ListView.prototype.appendView = function(view) {
    var el, index, prevCid, prevView;
    index = this.collection.indexOf(view.model);
    el = view.$el;
    if (index === 0) {
      return this.$(this.collectionEl).prepend(el);
    } else {
      prevCid = this.collection.at(index - 1).cid;
      if (prevCid in this.views) {
        return this.views[prevCid].$el.after(el);
      } else {
        prevView = _.values(this.views).reduce(function(previous, current) {
          var dCurrent, dPrevious;
          dCurrent = view.model.get('date').diff(current.model.date);
          if (dCurrent < 0) {
            return previous;
          } else if (previous != null) {
            dPrevious = view.model.get('date').diff(previous.model.date);
            if (dCurrent < dPrevious) {
              return current;
            } else {
              return previous;
            }
          } else {
            return current;
          }
        });
        if (prevView != null) {
          return prevView.$el.after(el);
        } else {
          return this.$(this.collectionEl).prepend(el);
        }
      }
    }
  };

  ListView.prototype.keepScreenFull = function() {
    var list;
    list = this.$('#list-container')[0];
    if (list.scrollHeight <= this.el.clientHeight) {
      return this.loadAfter(this.keepScreenFull);
    }
  };

  ListView.prototype.checkScroll = function() {
    var list, triggerPoint;
    triggerPoint = 150;
    list = this.$('#list-container')[0];
    if (list.scrollTop + list.clientHeight + triggerPoint > list.scrollHeight) {
      return this.loadAfter(this.checkScroll);
    }
  };

  ListView.prototype.loadBefore = function(callback) {
    var button;
    if (!this.isLoading) {
      this.isLoading = true;
      button = this.$('.showbefore');
      button.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      button.spin('tiny');
      return setTimeout((function(_this) {
        return function() {
          return _this.collection.loadPreviousPage(function(noMoreEvents) {
            if (noMoreEvents) {
              button.hide();
            }
            button.html(t('display previous events'));
            button.spin('none');
            _this.isLoading = false;
            return typeof callback === "function" ? callback() : void 0;
          });
        };
      })(this), 1);
    }
  };

  ListView.prototype.loadAfter = function(callback) {
    var button;
    if (!this.isLoading && !this.lastAlreadyLoaded) {
      this.isLoading = true;
      button = this.$('.showafter');
      button.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      button.spin('tiny');
      return setTimeout((function(_this) {
        return function() {
          return _this.collection.loadNextPage(function(noMoreEvents) {
            if (noMoreEvents) {
              _this.lastAlreadyLoaded = true;
              button.hide();
            }
            button.html(t('display next events'));
            button.spin('none');
            _this.isLoading = false;
            return typeof callback === "function" ? callback() : void 0;
          }, 1);
        };
      })(this));
    }
  };

  return ListView;

})(ViewCollection);
});

;require.register("views/list_view_bucket", function(exports, require, module) {
var BucketView, PopoverEvent, ViewCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('../lib/view_collection');

PopoverEvent = require('./calendar_popover_event');

module.exports = BucketView = (function(_super) {
  __extends(BucketView, _super);

  function BucketView() {
    return BucketView.__super__.constructor.apply(this, arguments);
  }

  BucketView.prototype.tagName = 'div';

  BucketView.prototype.className = 'dayprogram';

  BucketView.prototype.template = require('./templates/list_view_bucket');

  BucketView.prototype.itemview = require('./list_view_item');

  BucketView.prototype.collectionEl = '.alarms';

  BucketView.prototype.events = {
    'click .add': 'makeNew'
  };

  BucketView.prototype.initialize = function() {
    this.collection = this.model.items;
    return BucketView.__super__.initialize.apply(this, arguments);
  };

  BucketView.prototype.getRenderData = function() {
    return {
      date: this.model.get('date').format('dddd LL')
    };
  };

  BucketView.prototype.makeNew = function() {
    return this.showPopover({
      type: 'event',
      start: this.model.get('date').clone().set({
        hour: 8,
        minute: 30
      }),
      end: this.model.get('date').clone().set({
        hour: 10,
        minute: 0
      }),
      target: this.$('.add')
    });
  };

  BucketView.prototype.showPopover = function(options) {
    options.parentView = this;
    options.container = $('body');
    if (this.popover) {
      this.popover.close();
    }
    this.popover = new PopoverEvent(options);
    return this.popover.render();
  };

  BucketView.prototype.getUrlHash = function() {
    return 'list';
  };

  BucketView.prototype.appendView = function(view) {
    var el, index, prevCid;
    index = this.collection.indexOf(view.model);
    el = view.$el;
    if (index === 0) {
      return this.$collectionEl.prepend(el);
    } else {
      prevCid = this.collection.at(index - 1).cid;
      return this.views[prevCid].$el.after(el);
    }
  };

  return BucketView;

})(ViewCollection);
});

;require.register("views/list_view_item", function(exports, require, module) {
var BaseView, Event, EventItemView, PopoverEvent,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

PopoverEvent = require('./calendar_popover_event');

Event = require('models/event');

module.exports = EventItemView = (function(_super) {
  __extends(EventItemView, _super);

  function EventItemView() {
    return EventItemView.__super__.constructor.apply(this, arguments);
  }

  EventItemView.prototype.className = 'scheduleElement';

  EventItemView.prototype.template = require('./templates/list_view_item');

  EventItemView.prototype.events = {
    'click .edit': 'editMode',
    'click .delete': 'deleteModel'
  };

  EventItemView.prototype.initialize = function() {
    return this.listenTo(this.model, 'change', this.render);
  };

  EventItemView.prototype.deleteModel = function() {
    if (!confirm(t("are you sure"))) {
      return;
    }
    this.$el.spin('tiny');
    return this.model.destroy({
      error: function() {
        alert('server error');
        return this.$el.spin();
      }
    });
  };

  EventItemView.prototype.editMode = function() {
    if (this.popover) {
      this.popover.close();
    }
    this.popover = new PopoverEvent({
      model: this.model,
      target: this.$el,
      parentView: this,
      container: $('body')
    });
    return this.popover.render();
  };

  EventItemView.prototype.getUrlHash = function() {
    return 'list';
  };

  EventItemView.prototype.getRenderData = function() {
    var data;
    data = this.model.event.toJSON();
    _.extend(data, {
      type: 'event',
      start: this.model.getFormattedStartDate('HH:mm'),
      end: this.model.getFormattedEndDate('HH:mm'),
      allDay: this.model.isAllDay(),
      color: this.model.getColor(),
      counter: this.model.counter
    });
    return data;
  };

  return EventItemView;

})(BaseView);
});

;require.register("views/menu", function(exports, require, module) {
var ComboBox, Event, MenuView, Tag, ViewCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('../lib/view_collection');

ComboBox = require('views/widgets/combobox');

Event = require('models/event');

Tag = require('models/tag');

module.exports = MenuView = (function(_super) {
  __extends(MenuView, _super);

  function MenuView() {
    return MenuView.__super__.constructor.apply(this, arguments);
  }

  MenuView.prototype.tagName = 'ul';

  MenuView.prototype.id = 'menu';

  MenuView.prototype.className = 'container nav nav-list sidenav';

  MenuView.prototype.collectionEl = '#menuitems';

  MenuView.prototype.template = require('./templates/menu');

  MenuView.prototype.itemview = require('views/menu_item');

  MenuView.prototype.events = function() {
    return {
      'click .calendars': 'toggleDropdown',
      'click .calendar-add': 'onAddCalendar',
      'click .remove-cals': 'onCalendarMultipleRemove',
      'click .export-cals': 'onCalendarMultipleExport'
    };
  };

  MenuView.prototype.afterRender = function() {
    MenuView.__super__.afterRender.apply(this, arguments);
    return this.$('.main-spinner').hide();
  };

  MenuView.prototype.onAddCalendar = function() {
    var calendar;
    this.tag = app.tags.getOrCreateByName("new calendar");
    calendar = app.calendars.find(function(tag) {
      return (tag.get('name') === t("new calendar")) && tag.get('visible');
    });
    if (calendar != null) {
      return alert(t('calendar exist error'));
    } else {
      return this.createNewCalendar();
    }
  };

  MenuView.prototype.createNewCalendar = function(callback) {
    var calendarEvent;
    this.showLoading();
    calendarEvent = new Event({
      start: moment("19010101", "YYYYMMDD"),
      end: moment("19010101", "YYYYMMDD"),
      description: '',
      place: '',
      tags: [t("new calendar")]
    });
    return calendarEvent.save(null, {
      wait: true,
      success: (function(_this) {
        return function() {
          return setTimeout(function() {
            return $('#menuitems li.tagmenuitem:last-of-type .calendar-rename').trigger("click");
          }, 100);
        };
      })(this),
      complete: (function(_this) {
        return function() {
          setTimeout(_this.hideLoading.bind(_this), 100);
          if (callback != null) {
            return setTimeout(callback, 150);
          }
        };
      })(this)
    });
  };

  MenuView.prototype.activate = function(href) {
    return this.$('.active').removeClass('active');
  };

  MenuView.prototype.toggleDropdown = function() {
    return this.$('#menuitems').toggleClass('visible');
  };

  MenuView.prototype.onCalendarMultipleRemove = function() {
    var message;
    message = t('confirm delete selected calendars');
    if (confirm(message)) {
      $('.calendar-actions:checked').each(function() {
        var calendarName, tag;
        calendarName = this.value;
        tag = app.tags.getByName(calendarName);
        return app.calendars.remove(calendarName);
      });
    }
    if ($('#menu-items .calendar-name').length < 2) {
      return $('#multiple-actions').addClass('hidden');
    }
  };

  MenuView.prototype.onCalendarMultipleExport = function() {
    var calendars;
    calendars = [];
    $('.calendar-actions:checked').each(function() {
      return calendars.push(this.value);
    });
    calendars = JSON.stringify(calendars);
    return window.location = "exportzip/" + calendars;
  };

  MenuView.prototype.showLoading = function() {
    this.$('.main-spinner').show();
    return this.$('.calendar-add').hide();
  };

  MenuView.prototype.hideLoading = function() {
    this.$('.main-spinner').hide();
    return this.$('.calendar-add').show();
  };

  return MenuView;

})(ViewCollection);
});

;require.register("views/menu_item", function(exports, require, module) {
var BaseView, MenuItemView, colorSet,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

colorSet = require('../helpers/color-set');

module.exports = MenuItemView = (function(_super) {
  __extends(MenuItemView, _super);

  function MenuItemView() {
    this.hideColorPicker = __bind(this.hideColorPicker, this);
    return MenuItemView.__super__.constructor.apply(this, arguments);
  }

  MenuItemView.prototype.tagName = 'li';

  MenuItemView.prototype.className = 'tagmenuitem';

  MenuItemView.prototype.template = require('./templates/menu_item');

  MenuItemView.prototype.events = {
    'click > span': 'toggleVisible',
    'click .calendar-remove': 'onRemoveCalendar',
    'click .calendar-rename': 'onRenameCalendar',
    'click .calendar-export': 'onExportCalendar',
    'click .calendar-actions': 'onCalendarMultipleSelect',
    'click .dropdown-toggle': 'hideColorPicker',
    'click .calendar-color': 'showColorPicker',
    'click .color': 'setColor',
    'blur input.calendar-name': 'onRenameValidation',
    'keyup input.calendar-name': 'onRenameValidation'
  };

  MenuItemView.prototype.getRenderData = function() {
    return {
      label: this.model.get('name'),
      colorSet: colorSet
    };
  };

  MenuItemView.prototype.afterRender = function() {
    this.buildBadge(this.model.get('color'));
    return this.hideLoading();
  };

  MenuItemView.prototype.toggleVisible = function() {
    if (!app.router.onCalendar) {
      app.router.navigate('calendar', true);
    }
    this.showLoading();
    return setTimeout((function(_this) {
      return function() {
        _this.model.set('visible', !_this.model.get('visible'));
        _this.hideLoading();
        return _this.render();
      };
    })(this), 1);
  };

  MenuItemView.prototype.showColorPicker = function(ev) {
    if (ev != null) {
      ev.stopPropagation();
    }
    this.$('.color-picker').show();
    return this.$('.calendar-color').parent().attr('data-picker-visible', true);
  };

  MenuItemView.prototype.hideColorPicker = function() {
    this.$('.color-picker').hide();
    return this.$('.calendar-color').parent().attr('data-picker-visible', false);
  };

  MenuItemView.prototype.setColor = function(ev) {
    var color;
    color = this.$(ev.target).css('background-color');
    this.model.set('color', color);
    this.buildBadge(color);
    this.model.save();
    this.$('.dropdown-toggle').dropdown('toggle');
    this.hideColorPicker();
    return this.$('.dropdown-toggle').on('click', this.hideColorPicker);
  };

  MenuItemView.prototype.onCalendarMultipleSelect = function() {
    var actionMenu, nbCalendars, nbCalendarsChecked, trashButton;
    actionMenu = $('#multiple-actions');
    trashButton = $('.remove-cals', actionMenu);
    nbCalendars = $('.calendar-actions').length;
    nbCalendarsChecked = $('.calendar-actions:checked').length;
    if (nbCalendarsChecked > 1) {
      actionMenu.removeClass('hidden');
    } else {
      actionMenu.addClass('hidden');
    }
    if (nbCalendarsChecked === nbCalendars) {
      return trashButton.addClass('hidden');
    } else {
      return trashButton.removeClass('hidden');
    }
  };

  MenuItemView.prototype.onRenameValidation = function(event) {
    var calendarName, input, key;
    input = $(event.target);
    calendarName = this.model.get('name');
    key = event.keyCode || event.charCode;
    if (key === 27) {
      return this.hideInput(input, calendarName);
    } else if (key === 13 || event.type === 'focusout') {
      this.showLoading();
      return app.calendars.rename(calendarName, input.val(), (function(_this) {
        return function() {
          _this.hideLoading();
          return _this.hideInput(input, calendarName);
        };
      })(this));
    } else {
      return this.buildBadge(ColorHash.getColor(input.val(), 'color'));
    }
  };

  MenuItemView.prototype.onRenameCalendar = function() {
    var calendarName, input, template;
    calendarName = this.model.get('name');
    template = "<input type=\"text\" class=\"calendar-name\" value=\"" + calendarName + "\"/>";
    input = $(template);
    this.rawTextElement = this.$('.calendar-name').detach();
    input.insertAfter(this.$('.badge'));
    this.$('.dropdown-toggle').hide();
    input.focus();
    return input[0].setSelectionRange(0, calendarName.length);
  };

  MenuItemView.prototype.onRemoveCalendar = function() {
    var calendarName, message;
    calendarName = this.model.get('name');
    message = t('confirm delete calendar', {
      calendarName: calendarName
    });
    if (confirm(message)) {
      this.showLoading();
      return app.calendars.remove(calendarName, (function(_this) {
        return function() {
          return _this.hideLoading();
        };
      })(this));
    }
  };

  MenuItemView.prototype.hideInput = function(input, calendarName) {
    input.remove();
    this.rawTextElement.insertAfter(this.$('.badge'));
    this.buildBadge(calendarName);
    return this.$('.dropdown-toggle').show();
  };

  MenuItemView.prototype.onExportCalendar = function() {
    var calendarName, encodedName;
    calendarName = this.model.get('name');
    encodedName = encodeURIComponent(calendarName);
    return window.location = "export/" + encodedName + ".ics";
  };

  MenuItemView.prototype.buildBadge = function(color) {
    var backColor, borderColor, styles, visible;
    visible = this.model.get('visible');
    backColor = visible ? color : "transparent";
    borderColor = visible ? "transparent" : color;
    styles = {
      'background-color': backColor,
      'border': "1px solid " + borderColor
    };
    return this.$('.badge').css(styles);
  };

  MenuItemView.prototype.showLoading = function() {
    return this.$('.spinner').show();
  };

  MenuItemView.prototype.hideLoading = function() {
    return this.$('.spinner').hide();
  };

  return MenuItemView;

})(BaseView);
});

;require.register("views/settings_modal", function(exports, require, module) {
var BaseView, ComboBox, ImportView, SettingsModals,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

BaseView = require('lib/base_view');

ImportView = require('./import_view');

ComboBox = require('./widgets/combobox');

module.exports = SettingsModals = (function(_super) {
  __extends(SettingsModals, _super);

  function SettingsModals() {
    return SettingsModals.__super__.constructor.apply(this, arguments);
  }

  SettingsModals.prototype.id = 'settings-modal';

  SettingsModals.prototype.className = 'modal fade';

  SettingsModals.prototype.attributes = {
    'data-keyboard': false
  };

  SettingsModals.prototype.template = require('./templates/settings_modal');

  SettingsModals.prototype.events = {
    'click a#export': 'exportCalendar',
    'click #show-password': 'showPassword',
    'click #hide-password': 'hidePassword'
  };

  SettingsModals.prototype.getRenderData = function() {
    return {
      account: this.model
    };
  };

  SettingsModals.prototype.initialize = function() {
    this.model = window.webDavAccount;
    if (this.model != null) {
      return this.model.placeholder = this.getPlaceholder(this.model.token);
    }
  };

  SettingsModals.prototype.afterRender = function() {
    this.calendar = new ComboBox({
      el: this.$('#export-calendar'),
      source: app.calendars.toAutoCompleteSource()
    });
    this.$('#importviewplaceholder').append(new ImportView().render().$el);
    this.$el.modal('show');
    $(document).on('keydown', this.hideOnEscape);
    return this.$el.on('hidden', (function(_this) {
      return function() {
        var options;
        $(document).off('keydown', _this.hideOnEscape);
        options = {
          trigger: false,
          replace: true
        };
        window.app.router.navigate('', options);
        return _this.remove();
      };
    })(this));
  };

  SettingsModals.prototype.hideOnEscape = function(e) {
    if (e.which === 27 && !e.isDefaultPrevented()) {
      return this.close();
    }
  };

  SettingsModals.prototype.close = function() {
    return this.$el.modal('close');
  };

  SettingsModals.prototype.exportCalendar = function() {
    var calendarId, encodedName;
    calendarId = this.calendar.value();
    if (__indexOf.call(app.calendars.toArray(), calendarId) >= 0) {
      encodedName = encodeURIComponent(calendarId);
      return window.location = "export/" + encodedName + ".ics";
    } else {
      return alert(t('please select existing calendar'));
    }
  };

  SettingsModals.prototype.getPlaceholder = function(password) {
    var i, placeholder, _i, _ref;
    placeholder = [];
    for (i = _i = 1, _ref = password.length; _i <= _ref; i = _i += 1) {
      placeholder.push('*');
    }
    return placeholder.join('');
  };

  SettingsModals.prototype.showPassword = function() {
    this.$('#placeholder').html(this.model.token);
    this.$('#show-password').hide();
    return this.$('#hide-password').show();
  };

  SettingsModals.prototype.hidePassword = function() {
    this.$('#placeholder').html(this.model.placeholder);
    this.$('#hide-password').hide();
    return this.$('#show-password').show();
  };

  return SettingsModals;

})(BaseView);
});

;require.register("views/tags", function(exports, require, module) {
var BaseView, TagsView,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

module.exports = TagsView = (function(_super) {
  __extends(TagsView, _super);

  function TagsView() {
    this.refresh = __bind(this.refresh, this);
    return TagsView.__super__.constructor.apply(this, arguments);
  }

  TagsView.prototype.initialize = function() {
    TagsView.__super__.initialize.apply(this, arguments);
    this.$el.hide().tagit({
      availableTags: app.tags.toArray(),
      placeholderText: t('add tags'),
      afterTagAdded: this.tagAdded
    });
    this.duringRefresh = false;
    return this;
  };

  TagsView.prototype.tagAdded = function(ev, ui) {
    return ui.tag.css('background-color', ColorHash.getColor(ui.tagLabel, 'cozy'));
  };

  TagsView.prototype.getTags = function() {
    return this.$el.tagit('assignedTags');
  };

  TagsView.prototype.refresh = function() {
    var tag, _i, _len, _ref;
    this.duringRefresh = true;
    this.$el.tagit('removeAll');
    _ref = this.model.get('tags');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tag = _ref[_i];
      this.$el.tagit('createTag', tag);
    }
    return this.duringRefresh = false;
  };

  return TagsView;

})(BaseView);
});

;require.register("views/templates/calendar_header", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),active = locals_.active,calendarMode = locals_.calendarMode,todaytxt = locals_.todaytxt,title = locals_.title;
buf.push("<div class=\"fc-header-left\"><div role=\"group\" class=\"btn-group\"><span type=\"button\"" + (jade.cls(['btn','fc-button-month',active('month')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('month')) ? "" : jade_interp)) + "</span><span type=\"button\"" + (jade.cls(['btn','fc-button-week',active('week')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('week')) ? "" : jade_interp)) + "</span><span type=\"button\"" + (jade.cls(['btn','fc-button-list',active('list')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('list')) ? "" : jade_interp)) + "</span></div>");
if ( calendarMode)
{
buf.push("<div role=\"group\" class=\"btn-group\"><span class=\"btn fc-button-prev fc-corner-left\"><i class=\"fa fa-angle-left\"></i></span><span" + (jade.cls(['btn','fc-button-today',active('today')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = todaytxt) ? "" : jade_interp)) + "</span><span class=\"btn fc-button-next fc-corner-right\"><i class=\"fa fa-angle-right\"></i></span></div>");
}
buf.push("</div><div class=\"fc-header-right\"><span class=\"fc-header-title\"><h2>" + (jade.escape(null == (jade_interp = title) ? "" : jade_interp)) + "</h2></span></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/calendarview", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div id=\"alarms\" class=\"well\"></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/event_modal", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),id = locals_.id,file = locals_.file,summary = locals_.summary,start = locals_.start,end = locals_.end,allDay = locals_.allDay,place = locals_.place,calendar = locals_.calendar,tags = locals_.tags,description = locals_.description;
buf.push("<div class=\"modal-header\"><span>" + (jade.escape(null == (jade_interp = t('edit event')) ? "" : jade_interp)) + "</span>&nbsp;");
if ( typeof id != "undefined")
{
buf.push("<a" + (jade.attr("href", "events/" + (id) + "/" + (file) + ".ics", true, false)) + "><i class=\"fa fa-download fa-1\"></i></a>");
}
buf.push("<button class=\"close\">&times;</button></div><div class=\"modal-body\"><form id=\"basic\" class=\"form-inline\"><div class=\"row-fluid\"><div class=\"control-group span12\"><label for=\"basic-summary\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('summary')) ? "" : jade_interp)) + "</label><div class=\"controls\"><input id=\"basic-summary\" type=\"text\"" + (jade.attr("value", summary, true, false)) + " class=\"span12\"/></div></div></div><div class=\"row-fluid\"><div class=\"control-group span4 date\"><label for=\"basic-start\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('start')) ? "" : jade_interp)) + "</label><br/><input id=\"basic-start\" type=\"datetime-local\"" + (jade.attr("value", start, true, false)) + " class=\"span12\"/></div><div class=\"control-group span4 date\"><label for=\"basic-end\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('end')) ? "" : jade_interp)) + "</label><br/><input id=\"basic-end\" type=\"datetime-local\"" + (jade.attr("value", end, true, false)) + " class=\"span12\"/></div><div class=\"control-group span4\"><label for=\"allday\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('All day')) ? "" : jade_interp)) + "</label><br/><input id=\"allday\" type=\"checkbox\" value=\"checked\"" + (jade.attr("checked", allDay, true, false)) + "/></div></div><div class=\"row-fluid\"><div class=\"control-group span12\"><label for=\"basic-place\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('Place')) ? "" : jade_interp)) + "</label><div class=\"controls\"><input id=\"basic-place\" type=\"text\"" + (jade.attr("value", place, true, false)) + " class=\"span12\"/></div></div></div><div class=\"row-fluid\"><div class=\"control-group span12\"><label for=\"basic-calendar\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('calendar')) ? "" : jade_interp)) + "</label><div class=\"surrounded-combobox controls\"><input id=\"basic-calendar\"" + (jade.attr("value", calendar, true, false)) + "/></div></div><div style=\"display:none;\" class=\"control-group span8\"><label for=\"basic-tags\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('tags')) ? "" : jade_interp)) + "</label><div class=\"controls\"><input id=\"basic-tags\"" + (jade.attr("value", tags.join(','), true, false)) + " class=\"span12 tagit\"/></div></div></div><div class=\"row-fluid\"><div class=\"control-group span12\"><label for=\"basic-description\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('description')) ? "" : jade_interp)) + "</label><div class=\"controls\"><textarea id=\"basic-description\" class=\"span12\">" + (jade.escape(null == (jade_interp = description) ? "" : jade_interp)) + "</textarea></div></div></div></form><div id=\"guests-block\"><h4>" + (jade.escape(null == (jade_interp = t('guests')) ? "" : jade_interp)) + "</h4><form id=\"guests\" class=\"form-inline\"><div class=\"control-group\"><div class=\"controls\"><input id=\"addguest-field\" type=\"text\"" + (jade.attr("placeholder", t('enter email'), true, false)) + "/><a id=\"addguest\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('invite')) ? "" : jade_interp)) + "</a></div></div></form><div id=\"guests-list\"></div><h4>" + (jade.escape(null == (jade_interp = t('reminder')) ? "" : jade_interp)) + "&nbsp;<a class=\"btn addreminder fa fa-plus\"></a></h4><label id=\"reminder-explanation\" class=\"control-label hide\">" + (jade.escape(null == (jade_interp = t('Reminders before the event')) ? "" : jade_interp)) + "</label><div id=\"reminder-container\"></div><h4>" + (jade.escape(null == (jade_interp = t('recurrence')) ? "" : jade_interp)) + "</h4><div id=\"rrule-container\"></div></div></div><div class=\"modal-footer\"><a id=\"cancel-btn\">" + (jade.escape(null == (jade_interp = t("cancel")) ? "" : jade_interp)) + "</a>&nbsp;<a id=\"confirm-btn\" class=\"btn\">" + (jade.escape(null == (jade_interp = t("save changes")) ? "" : jade_interp)) + "</a></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/event_modal_guest", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),model = locals_.model;
buf.push("<p>");
if ( model.status == 'ACCEPTED')
{
buf.push("<i class=\"fa fa-check-circle-o green\"></i>");
}
else if ( model.status == 'DECLINED')
{
buf.push("<i class=\"fa fa-times-circle-o red\"></i>");
}
else if ( model.status == 'NEED-ACTION')
{
buf.push("<i class=\"fa fa-exclamation-circle blue\"></i>");
}
buf.push(" " + (jade.escape((jade_interp = model.email) == null ? '' : jade_interp)) + " <a" + (jade.attr("title", "" + (t('cancel Invitation')) + "", true, false)) + " class=\"remove-guest fa fa-trash\"></a></p>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/event_modal_reminder", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),durationValue = locals_.durationValue,isSelectedUnit = locals_.isSelectedUnit;
buf.push("<form class=\"form-inline\"><div class=\"control-group\"><input type=\"number\" min=\"1\"" + (jade.attr("value", durationValue, true, false)) + " class=\"input-mini triggervalue\"/><select class=\"triggerunit\"><option value=\"M\"" + (jade.attr("selected", isSelectedUnit('M'), true, false)) + ">" + (jade.escape(null == (jade_interp = t('minute')) ? "" : jade_interp)) + "</option><option value=\"H\"" + (jade.attr("selected", isSelectedUnit('H'), true, false)) + ">" + (jade.escape(null == (jade_interp = t('hour')) ? "" : jade_interp)) + "</option><option value=\"D\"" + (jade.attr("selected", isSelectedUnit('D'), true, false)) + ">" + (jade.escape(null == (jade_interp = t('day')) ? "" : jade_interp)) + "</option><option value=\"W\"" + (jade.attr("selected", isSelectedUnit('W'), true, false)) + ">" + (jade.escape(null == (jade_interp = t('week')) ? "" : jade_interp)) + "</option></select><i" + (jade.attr("title", t('delete'), true, false)) + " class=\"removereminder fa fa-trash\"></i></div></form>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/event_modal_rrule", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),rrule = locals_.rrule,freqSelected = locals_.freqSelected,weekDays = locals_.weekDays,wkdaySelected = locals_.wkdaySelected,yearModeIs = locals_.yearModeIs,endModeSelected = locals_.endModeSelected;
buf.push("<p id=\"rrule-short\"><span id=\"rrule-help\"></span><span id=\"rrule-action\">&nbsp;-&nbsp;<a class=\"rrule-show\">" + (jade.escape(null == (jade_interp = t('Edit')) ? "" : jade_interp)) + "</a></span></p><form id=\"rrule\" class=\"form-inline\"><label for=\"rrule-interval\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('repeat every')) ? "" : jade_interp)) + "</label><div class=\"control-group\"><input id=\"rrule-interval\" type=\"number\" min=\"1\"" + (jade.attr("value", rrule.interval, true, false)) + " class=\"col-xs2 input-mini\"/><select id=\"rrule-freq\"><option value=\"NOREPEAT\"" + (jade.attr("selected", freqSelected('NOREPEAT'), true, false)) + ">" + (jade.escape(null == (jade_interp = t('no recurrence')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.DAILY, true, false)) + (jade.attr("selected", freqSelected(RRule.DAILY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('day')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.WEEKLY, true, false)) + (jade.attr("selected", freqSelected(RRule.WEEKLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('week')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.MONTHLY, true, false)) + (jade.attr("selected", freqSelected(RRule.MONTHLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('month')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.YEARLY, true, false)) + (jade.attr("selected", freqSelected(RRule.YEARLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('year')) ? "" : jade_interp)) + "</option></select></div><div id=\"rrule-weekdays\"><label class=\"control-label\">" + (jade.escape(null == (jade_interp = t('repeat on')) ? "" : jade_interp)) + "</label><div class=\"control-group\"><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[1]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"1\"" + (jade.attr("checked", wkdaySelected(1), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[2]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"2\"" + (jade.attr("checked", wkdaySelected(2), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[3]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"3\"" + (jade.attr("checked", wkdaySelected(3), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[4]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"4\"" + (jade.attr("checked", wkdaySelected(4), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[5]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"5\"" + (jade.attr("checked", wkdaySelected(5), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[6]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"6\"" + (jade.attr("checked", wkdaySelected(6), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[0]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"0\"" + (jade.attr("checked", wkdaySelected(0), true, false)) + "/></label></div></div><div id=\"rrule-monthdays\" class=\"control-group\"><div class=\"controls\"><label class=\"checkbox inline\"><input type=\"radio\"" + (jade.attr("checked", yearModeIs('date'), true, false)) + " name=\"rrule-month-option\" value=\"date\"/>" + (jade.escape(null == (jade_interp = t('repeat on date')) ? "" : jade_interp)) + "</label><label class=\"checkbox inline\"><input type=\"radio\"" + (jade.attr("checked", yearModeIs('weekdate'), true, false)) + " name=\"rrule-month-option\" value=\"weekdate\"/>" + (jade.escape(null == (jade_interp = t('repeat on weekday')) ? "" : jade_interp)) + "</label></div></div><div id=\"rrule-repeat\"><label for=\"rrule-until\">" + (jade.escape(null == (jade_interp = t('repeat')) ? "" : jade_interp)) + "</label><div class=\"control-group\"><label class=\"radio\"><input type=\"radio\" name=\"endMode\" value=\"forever\"" + (jade.attr("checked", endModeSelected('forever'), true, false)) + "/>" + (jade.escape(null == (jade_interp = t('forever')) ? "" : jade_interp)) + "</label></div><div class=\"control-group\"><label class=\"radio\"><input type=\"radio\" name=\"endMode\" value=\"count\"" + (jade.attr("checked", endModeSelected('count'), true, false)) + "/><label for=\"count\">" + (jade.escape(null == (jade_interp = t('after')) ? "" : jade_interp)) + "</label></label><input id=\"rrule-count\" type=\"number\" min=\"0\"" + (jade.attr("value", rrule.count, true, false)) + " class=\"input-mini\"/><label for=\"rrule-count\">" + (jade.escape(null == (jade_interp = t('occurences')) ? "" : jade_interp)) + "</label></div><div class=\"control-group\"><label class=\"radio\"><input type=\"radio\" name=\"endMode\" value=\"until\"" + (jade.attr("checked", endModeSelected('until'), true, false)) + "/><label for=\"until\">" + (jade.escape(null == (jade_interp = t('until')) ? "" : jade_interp)) + "</label></label><input id=\"rrule-until\" type=\"date\"" + (jade.attr("value", rrule.until, true, false)) + "/></div></div></form>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/import_event", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),start = locals_.start,end = locals_.end,description = locals_.description,place = locals_.place;
buf.push("<p>" + (jade.escape((jade_interp = start) == null ? '' : jade_interp)) + " - " + (jade.escape((jade_interp = end) == null ? '' : jade_interp)) + "\n" + (jade.escape((jade_interp = description) == null ? '' : jade_interp)) + " ");
if (place != void(0) && place != null && place.length > 0)
{
buf.push("(" + (jade.escape((jade_interp = place) == null ? '' : jade_interp)) + ")");
}
buf.push("</p>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/import_view", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div id=\"import-form\" class=\"well\"><div class=\"import-form\"><p>" + (jade.escape(null == (jade_interp = t('import an ical file')) ? "" : jade_interp)) + "</p><div id=\"import-button\" class=\"btn\"><span>" + (jade.escape(null == (jade_interp = t('select an icalendar file')) ? "" : jade_interp)) + "</span><input id=\"import-file-input\" type=\"file\"/></div></div><div class=\"confirmation\"><div class=\"import-calendar-selection mb2\"><span>" + (jade.escape(null == (jade_interp = t('link imported events with calendar')) ? "" : jade_interp)) + "</span><br/><input id=\"import-calendar-combo\" class=\"mt1\"/></div><button id=\"confirm-import-button\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('confirm import')) ? "" : jade_interp)) + "</button><button id=\"cancel-import-button\" class=\"btn\">" + (jade.escape(null == (jade_interp = t ('cancel')) ? "" : jade_interp)) + "</button></div><div class=\"import-progress mt3\"></div><div class=\"import-errors mt3\"></div><div class=\"results mt3\"><h4>" + (jade.escape(null == (jade_interp = t('Events to import')) ? "" : jade_interp)) + "</h4><div id=\"import-event-list\"></div></div></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/list_view", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div id=\"calheader\" class=\"well fc-ltr\"></div><div id=\"list-container\" class=\"well\"><a class=\"btn showbefore\">" + (jade.escape(null == (jade_interp = t('display previous events')) ? "" : jade_interp)) + "</a><div id=\"alarm-list\"></div><a class=\"btn showafter\">" + (jade.escape(null == (jade_interp = t('display next events')) ? "" : jade_interp)) + "</a></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/list_view_bucket", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),date = locals_.date;
buf.push("<h4>" + (jade.escape((jade_interp = date) == null ? '' : jade_interp)) + "</h4><div class=\"alarms\"></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/list_view_item", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),allDay = locals_.allDay,color = locals_.color,start = locals_.start,end = locals_.end,description = locals_.description,counter = locals_.counter;
if ( !allDay)
{
buf.push("<div" + (jade.attr("style", "background-color:"+color+";", true, false)) + " class=\"fc-time\">" + (jade.escape((jade_interp = start) == null ? '' : jade_interp)) + " - " + (jade.escape((jade_interp = end) == null ? '' : jade_interp)) + "</div>");
}
else
{
buf.push("<div" + (jade.attr("style", "background-color:"+color+";", true, false)) + " class=\"fc-time\">" + (jade.escape((jade_interp = t("All day")) == null ? '' : jade_interp)) + "</div>");
}
buf.push("<div class=\"fc-title\">" + (jade.escape((jade_interp = description || t("no description")) == null ? '' : jade_interp)) + "");
if(counter != void(0) && counter != null)
{
buf.push("&nbsp;(" + (jade.escape((jade_interp = counter.current) == null ? '' : jade_interp)) + " / " + (jade.escape((jade_interp = counter.total) == null ? '' : jade_interp)) + ")");
}
buf.push("</div><i class=\"delete fa fa-trash\"></i>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/menu", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<li class=\"calendars\"><div href=\"#calendar\" class=\"title\"><span class=\"fa fa-bars menu-icon\"></span><span>" + (jade.escape(null == (jade_interp = t('Calendars')) ? "" : jade_interp)) + "</span><span class=\"main-spinner\"><img src=\"img/spinner.svg\"/></span><span class=\"fa fa-plus-square-o calendar-add\"></span></div></li><ul id=\"menuitems\"></ul><a href=\"#settings\" class=\"btn btn-settings stick-bottom\"><i class=\"fa fa-cog\"></i><span>" + (jade.escape(null == (jade_interp = t('Sync Settings')) ? "" : jade_interp)) + "</span></a>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/menu_item", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),back = locals_.back,visible = locals_.visible,color = locals_.color,border = locals_.border,label = locals_.label,colorSet = locals_.colorSet;
back = visible?color:"transparent"
border = visible?color:"transparent"
buf.push("<span class=\"badge\"></span><span class=\"calendar-name\">" + (jade.escape(null == (jade_interp = label) ? "" : jade_interp)) + "</span><div class=\"dropdown\"><a id=\"dLabel\" data-toggle=\"dropdown\" class=\"dropdown-toggle\"><span class=\"caret\"></span></a><ul aria-labelledBy=\"dLabel\" class=\"dropdown-menu\"><li><a class=\"calendar-color\">" + (jade.escape(null == (jade_interp = t('change color')) ? "" : jade_interp)) + "</a><ul class=\"color-picker\">");
// iterate colorSet
;(function(){
  var $$obj = colorSet;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var color = $$obj[$index];

buf.push("<li" + (jade.attr("style", "background-color: #" + (color) + ";", true, false)) + " class=\"color\"></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var color = $$obj[$index];

buf.push("<li" + (jade.attr("style", "background-color: #" + (color) + ";", true, false)) + " class=\"color\"></li>");
    }

  }
}).call(this);

buf.push("</ul></li><li><a class=\"calendar-rename\">" + (jade.escape(null == (jade_interp = t('rename')) ? "" : jade_interp)) + "</a></li><li><a class=\"calendar-remove\">" + (jade.escape(null == (jade_interp = t('delete')) ? "" : jade_interp)) + "</a></li><li><a class=\"calendar-export\">" + (jade.escape(null == (jade_interp = t('export')) ? "" : jade_interp)) + "</a></li></ul></div><img src=\"img/spinner.svg\" class=\"spinner\"/>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/popover_event", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),popoverClassName = locals_.popoverClassName,allDay = locals_.allDay,sameDay = locals_.sameDay,start = locals_.start,tFormat = locals_.tFormat,end = locals_.end,dFormat = locals_.dFormat,advancedUrl = locals_.advancedUrl,editionMode = locals_.editionMode;
popoverClassName  = (allDay ? ' is-all-day' : '')
popoverClassName += (sameDay? ' is-same-day' : '')
buf.push("<div" + (jade.cls(['popover-content-wrapper',popoverClassName], [null,true])) + "><label" + (jade.attr("aria-hidden", "" + (allDay) + "", true, false)) + " class=\"timed\"><span class=\"caption\">" + (jade.escape(null == (jade_interp = t("From")) ? "" : jade_interp)) + "</span><input tabindex=\"4\" type=\"time\" size=\"5\"" + (jade.attr("placeholder", t("From [hours:minutes]"), true, false)) + (jade.attr("value", start.format(tFormat), true, false)) + " class=\"input-start input-time\"/></label><label class=\"aside\"><input tabindex=\"3\" type=\"checkbox\" value=\"checked\"" + (jade.attr("checked", allDay, true, false)) + " class=\"input-allday\"/><span class=\"caption\">" + (jade.escape(null == (jade_interp = t('All day')) ? "" : jade_interp)) + "</span></label><label" + (jade.attr("aria-hidden", "" + (allDay) + "", true, false)) + " class=\"timed\"><span class=\"input-end-caption caption\">" + (jade.escape(null == (jade_interp = t("To")) ? "" : jade_interp)) + "</span><input tabindex=\"5\" type=\"time\" size=\"5\"" + (jade.attr("placeholder", t("To [hours:minutes]"), true, false)) + (jade.attr("value", end.format(tFormat), true, false)) + " class=\"input-end-time input-time\"/></label><label class=\"end-date\"><span class=\"caption\">" + (jade.escape(null == (jade_interp = allDay? t(sameDay? "All one day" : "All day, until") : "-") ? "" : jade_interp)) + "&nbsp;</span><input tabindex=\"6\" type=\"text\" size=\"10\"" + (jade.attr("placeholder", t("To [date]"), true, false)) + (jade.attr("value", end.format(dFormat), true, false)) + " class=\"input-end-date input-date\"/></label></div><div class=\"popover-footer\"><a role=\"button\" tabindex=\"8\"" + (jade.attr("href", '#' + advancedUrl, true, false)) + " data-tabindex-next=\"1\" class=\"advanced-link\">" + (jade.escape(null == (jade_interp = t('advanced')) ? "" : jade_interp)) + "</a><a role=\"button\" tabindex=\"7\" class=\"btn add\">" + (jade.escape(null == (jade_interp = editionMode ? t('save changes') : t('Create')) ? "" : jade_interp)) + "</a></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/popover_title", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),calendar = locals_.calendar,description = locals_.description,place = locals_.place;
buf.push("<span class=\"calendar\"><input" + (jade.attr("value", calendar, true, false)) + " class=\"calendarcombo\"/></span><span class=\"label\"><input tabindex=\"1\" type=\"text\"" + (jade.attr("value", description, true, false)) + (jade.attr("placeholder", t("summary"), true, false)) + " data-tabindex-prev=\"8\" class=\"input-desc\"/></span><span class=\"label\"><input tabindex=\"2\" type=\"text\"" + (jade.attr("value", place, true, false)) + (jade.attr("placeholder", t("Place"), true, false)) + " class=\"input-place\"/></span><span class=\"controls\"><button" + (jade.attr("title", t('close'), true, false)) + " role=\"button\" class=\"close fa fa-close\"></button><button" + (jade.attr("title", t('delete'), true, false)) + " role=\"button\" class=\"remove fa fa-trash\"></button><img src=\"img/spinner.svg\" class=\"remove-spinner\"/><button" + (jade.attr("title", t('duplicate'), true, false)) + " role=\"button\" class=\"duplicate fa fa-copy\"></button></span>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/settings_modal", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),account = locals_.account,calendar = locals_.calendar;
buf.push("<div class=\"modal-header\"><h2>" + (jade.escape(null == (jade_interp = t('Synchronization Settings')) ? "" : jade_interp)) + "</h2></div><div class=\"helptext\"><span><i class=\"fa fa-refresh\"></i></span><h3>" + (jade.escape(null == (jade_interp = t('mobile sync')) ? "" : jade_interp)) + "</h3>");
if ( account == null)
{
buf.push("<p>" + (jade.escape(null == (jade_interp = t('to sync your cal with')) ? "" : jade_interp)) + "</p><ol><li>" + (jade.escape(null == (jade_interp = t('install the sync module')) ? "" : jade_interp)) + "</li><li>" + (jade.escape(null == (jade_interp = t('connect to it and follow')) ? "" : jade_interp)) + "</li></ol>");
}
else
{
buf.push("<p>" + (jade.escape(null == (jade_interp = t('sync headline with data')) ? "" : jade_interp)) + "</p><ul><li>" + (jade.escape((jade_interp = t('sync url')) == null ? '' : jade_interp)) + " https://" + (jade.escape((jade_interp = account.domain) == null ? '' : jade_interp)) + "/public/sync/principals/me</li><li>" + (jade.escape((jade_interp = t('sync login')) == null ? '' : jade_interp)) + " " + (jade.escape((jade_interp = account.login) == null ? '' : jade_interp)) + "</li><li>" + (jade.escape((jade_interp = t('sync password') + " ") == null ? '' : jade_interp)) + "<span id=\"placeholder\">" + (jade.escape(null == (jade_interp = account.placeholder) ? "" : jade_interp)) + "</span><button id=\"show-password\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('show')) ? "" : jade_interp)) + "</button><button id=\"hide-password\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('hide')) ? "" : jade_interp)) + "</button></li></ul>");
}
buf.push("<p>" + (jade.escape(null == (jade_interp = t('sync help') + " ") ? "" : jade_interp)) + "<a href=\"https://cozy.io/mobile/calendar.html\" target=\"_blank\">" + (jade.escape(null == (jade_interp = t('sync help link')) ? "" : jade_interp)) + "</a></p></div><div class=\"helptext\"><span><i class=\"fa fa-upload\"></i></span><h3>" + (jade.escape(null == (jade_interp = t('icalendar export')) ? "" : jade_interp)) + "</h3><p>" + (jade.escape(null == (jade_interp = t('download a copy of your calendar')) ? "" : jade_interp)) + "</p><p class=\"line\"><span class=\"surrounded-combobox\"><input id=\"export-calendar\"" + (jade.attr("value", calendar, true, false)) + "/></span><span>&nbsp;</span><a id=\"export\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('export your calendar')) ? "" : jade_interp)) + "</a></p></div><div class=\"helptext\"><span><i class=\"fa fa-download\"></i></span><h3>" + (jade.escape(null == (jade_interp = t('icalendar import')) ? "" : jade_interp)) + "</h3><div id=\"importviewplaceholder\"></div></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/toggle", function(exports, require, module) {
var BaseView, Toggle,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

module.exports = Toggle = (function(_super) {
  __extends(Toggle, _super);

  function Toggle() {
    return Toggle.__super__.constructor.apply(this, arguments);
  }

  Toggle.prototype.value = false;

  Toggle.prototype.tagName = 'span';

  Toggle.prototype.className = 'badge';

  Toggle.prototype.template = function(data) {
    return "<i class='fa fa-" + data.icon + "'></i>";
  };

  Toggle.prototype.initialize = function(options) {
    this.value = options.value;
    this.icon = options.icon;
    this.label = options.label;
    this.render();
    return this.toggle(this.value);
  };

  Toggle.prototype.getRenderData = function() {
    return {
      icon: this.icon
    };
  };

  Toggle.prototype.events = function() {
    return {
      'click': (function(_this) {
        return function() {
          return _this.toggle();
        };
      })(this)
    };
  };

  Toggle.prototype.toggle = function(value) {
    var title;
    if (value == null) {
      value = !this.value;
    }
    this.value = value;
    if (this.value) {
      this.$el.addClass('badge-info');
    } else {
      this.$el.removeClass('badge-info');
    }
    title = this.label + ' : ' + t(value ? 'ON' : 'OFF');
    this.$el.attr('title', title);
    return this.trigger('toggle', value);
  };

  return Toggle;

})(BaseView);
});

;require.register("views/widgets/combobox", function(exports, require, module) {
var BaseView, ComboBox, Tag, TagCollection,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

TagCollection = require('collections/tags');

Tag = require('models/tag');

module.exports = ComboBox = (function(_super) {
  __extends(ComboBox, _super);

  function ComboBox() {
    this.remove = __bind(this.remove, this);
    this.renderItem = __bind(this.renderItem, this);
    this.onChange = __bind(this.onChange, this);
    this.onEditionComplete = __bind(this.onEditionComplete, this);
    this.onSelect = __bind(this.onSelect, this);
    this.onBlur = __bind(this.onBlur, this);
    this.onClose = __bind(this.onClose, this);
    this.onOpen = __bind(this.onOpen, this);
    this.setValue = __bind(this.setValue, this);
    this.openMenu = __bind(this.openMenu, this);
    return ComboBox.__super__.constructor.apply(this, arguments);
  }

  ComboBox.prototype.events = {
    'keyup': 'onChange',
    'keypress': 'onChange',
    'change': 'onChange',
    'blur': 'onBlur'
  };

  ComboBox.prototype.initialize = function(options) {
    var caret, isInput, method;
    ComboBox.__super__.initialize.call(this);
    this.$el.autocomplete({
      delay: 0,
      minLength: 0,
      source: options.source,
      close: this.onClose,
      open: this.onOpen,
      select: this.onSelect
    });
    this.$el.addClass('combobox');
    this.small = options.small;
    this.autocompleteWidget = this.$el.data('ui-autocomplete');
    this.autocompleteWidget._renderItem = this.renderItem;
    isInput = this.$el[0].nodeName.toLowerCase() === 'input';
    method = this.$el[isInput ? "val" : "text"];
    this.value = (function(_this) {
      return function() {
        return method.apply(_this.$el, arguments);
      };
    })(this);
    this.on('edition-complete', this.onEditionComplete);
    if (!this.small) {
      caret = $('<a class="combobox-caret">');
      caret.append($('<span class="caret"></span>'));
      caret.click(this.openMenu);
      this.$el.after(caret);
    }
    return this.onEditionComplete(this.value());
  };

  ComboBox.prototype.openMenu = function() {
    this.menuOpen = true;
    this.$el.addClass('expanded');
    this.$el.focus().val(this.value()).autocomplete('search', '');
    return this.$el[0].setSelectionRange(0, this.value().length);
  };

  ComboBox.prototype.setValue = function(value) {
    this.$el.val(value);
    return this.onSelect();
  };

  ComboBox.prototype.save = function() {
    if (this.tag && this.tag.isNew()) {
      return this.tag.save({
        success: function() {
          return this.tags.add(this.tag);
        }
      });
    }
  };

  ComboBox.prototype.onOpen = function() {
    return this.menuOpen = true;
  };

  ComboBox.prototype.onClose = function() {
    this.menuOpen = false;
    if (!this.$el.is(':focus')) {
      return this.$el.removeClass('expanded');
    }
  };

  ComboBox.prototype.onBlur = function() {
    if (!this.menuOpen) {
      this.$el.removeClass('expanded');
    }
    return this.trigger('edition-complete', this.value());
  };

  ComboBox.prototype.onSelect = function(ev, ui) {
    var _ref;
    this.$el.blur().removeClass('expanded');
    this.onChange(ev, ui);
    return this.trigger('edition-complete', (ui != null ? (_ref = ui.item) != null ? _ref.value : void 0 : void 0) || this.value());
  };

  ComboBox.prototype.onEditionComplete = function(name) {
    this.tag = app.tags.getOrCreateByName(name);
    return this.buildBadge(this.tag.get('color'));
  };

  ComboBox.prototype.onChange = function(ev, ui) {
    var generatedColor, value, _ref;
    value = (ui != null ? (_ref = ui.item) != null ? _ref.value : void 0 : void 0) || this.value();
    generatedColor = ColorHash.getColor(value, 'cozy');
    this.buildBadge(generatedColor);
    this.trigger('change', value);
    _.debounce(this.onEditionComplete(value), 500);
    return true;
  };

  ComboBox.prototype.renderItem = function(ul, item) {
    var link;
    link = $("<a>").text(item.label).prepend(this.makeBadge(item.color));
    return ul.append($('<li>').append(link).data('ui-autocomplete-item', item));
  };

  ComboBox.prototype.buildBadge = function(color) {
    var _ref;
    if ((_ref = this.badge) != null) {
      _ref.remove();
    }
    this.badge = this.makeBadge(color);
    return this.$el.before(this.badge);
  };

  ComboBox.prototype.makeBadge = function(color) {
    var badge;
    badge = $('<span class="badge combobox-badge">').html('&nbsp;').css('backgroundColor', color).css('cursor', 'pointer').click(this.openMenu);
    if (this.small) {
      badge.attr('title', t('change calendar'));
    }
    return badge;
  };

  ComboBox.prototype.remove = function() {
    this.autocompleteWidget.destroy();
    return ComboBox.__super__.remove.apply(this, arguments);
  };

  return ComboBox;

})(BaseView);
});

;
//# sourceMappingURL=app.js.map