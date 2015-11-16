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
    var CalendarsCollection, ContactCollection, EventCollection, Header, Menu, Router, SocketListener, TagCollection, e, locales, todayChecker;
    window.app = this;
    this.timezone = window.timezone;
    delete window.timezone;
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
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
};
});

;require.register("collections/calendars", function(exports, require, module) {
var CalendarCollection, SocketListener, Tag, TagCollection,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

SocketListener = require('../lib/socket_listener');

Tag = require('models/tag');

TagCollection = require('collections/tags');

module.exports = CalendarCollection = (function(superClass) {
  var stringify;

  extend(CalendarCollection, superClass);

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
    var calendar, calendarName, ref, tags;
    ref = model.get('tags'), calendarName = ref[0], tags = 2 <= ref.length ? slice.call(ref, 1) : [];
    calendar = app.tags.getOrCreateByName(calendarName);
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Contact = require('../models/contact');

module.exports = ContactCollection = (function(superClass) {
  extend(ContactCollection, superClass);

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
          hasPicture: contact.get('hasPicture'),
          display: (contact.get('name')) + " &lt;" + email.value + "&gt;",
          toString: function() {
            return email.value + ";" + contact.id;
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

RealEventCollection = require('./realevents');

RealEventGeneratorCollection = require('./realeventsgenerator');

DayBucket = DayBucket = (function(superClass) {
  extend(DayBucket, superClass);

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

module.exports = DayBucketCollection = (function(superClass) {
  extend(DayBucketCollection, superClass);

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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ScheduleItemsCollection = require('./scheduleitems');

Event = require('../models/event');

module.exports = EventCollection = (function(superClass) {
  extend(EventCollection, superClass);

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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

RealEvent = require('../models/realevent');

module.exports = RealEventCollection = (function(superClass) {
  var model;

  extend(RealEventCollection, superClass);

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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

RealEvent = require('../models/realevent');

module.exports = RealEventGeneratorCollection = (function(superClass) {
  var model;

  extend(RealEventGeneratorCollection, superClass);

  function RealEventGeneratorCollection() {
    return RealEventGeneratorCollection.__super__.constructor.apply(this, arguments);
  }

  model = RealEvent;

  RealEventGeneratorCollection.prototype.comparator = function(re1, re2) {
    var ref;
    return (ref = re1.start) != null ? ref.isBefore(re2.start) : void 0;
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
        eventsInRange.push(new RealEvent({
          event: item
        }));
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
          var options;
          options = {
            event: event,
            start: instanceStart,
            end: instanceEnd
          };
          return new RealEvent(options);
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
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = ScheduleItemsCollection = (function(superClass) {
  extend(ScheduleItemsCollection, superClass);

  function ScheduleItemsCollection() {
    this.getFCEventSource = bind(this.getFCEventSource, this);
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
          var calendar, duration, e, itemEnd, itemStart;
          itemStart = item.getStartDateObject();
          itemEnd = item.getEndDateObject();
          duration = itemEnd - itemStart;
          calendar = item.getCalendar();
          if (calendar && calendar.get('visible') === false) {
            return null;
          }
          if (item.isRecurrent()) {
            try {
              return eventsInRange = eventsInRange.concat(item.getRecurrentFCEventBetween(start, end));
            } catch (_error) {
              e = _error;
              console.error(e);
              if (item.isInRange(start, end)) {
                return eventsInRange.push(item.toPunctualFullCalendarEvent());
              }
            }
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Tag = require('../models/tag');

module.exports = TagCollection = (function(superClass) {
  extend(TagCollection, superClass);

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
    date = date[2] + "-" + date[1] + "-" + date[0];
  } else {
    date = "undefined";
  }
  if (fullDate[1].match(/[0-9]{2}:[0-9]{2}/)) {
    time = fullDate[1].split(/:/);
    time = time[0] + ":" + time[1] + ":00";
  } else {
    time = "undefined";
  }
  return date + "T" + time;
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
  return year + "-" + month + "-" + day + "T" + hours + ":" + minutes + "Z";
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
  var i, j, len, len1, ref, ref1, s, t, u;
  s = '-P';
  ref = ['W', 'D'];
  for (i = 0, len = ref.length; i < len; i++) {
    u = ref[i];
    if (u in unitsValues) {
      s += unitsValues[u] + u;
    }
  }
  t = '';
  ref1 = ['H', 'M', 'S'];
  for (j = 0, len1 = ref1.length; j < len1; j++) {
    u = ref1[j];
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

exports.getLists = function(list, length) {
  var lists;
  lists = [];
  while (list.length > 0) {
    lists.push(list.splice(0, length));
  }
  return lists;
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

window.onerror = function(msg, url, line, col, error) {
  var data, exception, xhr;
  console.error(msg, url, line, col, error, error != null ? error.stack : void 0);
  exception = (error != null ? error.toString() : void 0) || msg;
  if (exception !== window.lastError) {
    data = {
      data: {
        type: 'error',
        error: {
          msg: msg,
          name: error != null ? error.name : void 0,
          full: exception,
          stack: error != null ? error.stack : void 0
        },
        url: url,
        line: line,
        col: col,
        href: window.location.href
      }
    };
    xhr = new XMLHttpRequest();
    xhr.open('POST', 'log', true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));
    return window.lastError = exception;
  }
};

$(function() {
  var data, e, exception, xhr;
  try {
    moment.locale(window.locale);
    ColorHash.addScheme('cozy', colorSet);
    $.fn.spin = function(opts, color) {
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
    return app.initialize();
  } catch (_error) {
    e = _error;
    console.error(e, e != null ? e.stack : void 0);
    exception = e.toString();
    if (exception !== window.lastError) {
      data = {
        data: {
          type: 'error',
          error: {
            msg: e.message,
            name: e != null ? e.name : void 0,
            full: exception,
            stack: e != null ? e.stack : void 0
          },
          file: e != null ? e.fileName : void 0,
          line: e != null ? e.lineNumber : void 0,
          col: e != null ? e.columnNumber : void 0,
          href: window.location.href
        }
      };
      xhr = new XMLHttpRequest();
      xhr.open('POST', 'log', true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(data));
      return window.lastError = exception;
    }
  }
});
});

;require.register("lib/base_view", function(exports, require, module) {
var BaseView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = BaseView = (function(superClass) {
  extend(BaseView, superClass);

  function BaseView() {
    return BaseView.__super__.constructor.apply(this, arguments);
  }

  BaseView.prototype.template = function() {};

  BaseView.prototype.initialize = function() {};

  BaseView.prototype.getRenderData = function() {
    var ref;
    return {
      model: (ref = this.model) != null ? ref.toJSON() : void 0
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
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Modal = (function(superClass) {
  extend(Modal, superClass);

  function Modal() {
    this.closeOnEscape = bind(this.closeOnEscape, this);
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
    var body, close, closeMarkup, container, foot, head, noMarkup, title, yesBtn, yesMarkup;
    closeMarkup = "<button class=\"close\" type=\"button\" data-dismiss=\"modal\"\n        aria-hidden=\"true\">\n    ×\n</button>";
    close = $(closeMarkup);
    title = $('<h4 class="model-title">').text(this.title);
    head = $('<div class="modal-header">').append(close, title);
    body = $('<div class="modal-body">').append(this.renderContent());
    yesMarkup = '<button id="modal-dialog-yes" class="btn btn-cozy">';
    yesBtn = $(yesMarkup).text(this.yes);
    foot = $('<div class="modal-footer">').append(yesBtn);
    noMarkup = '<button id="modal-dialog-no" class="btn btn-link">';
    if (this.no) {
      foot.prepend($(noMarkup).text(this.no));
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

;require.register("lib/popover_screen_view", function(exports, require, module) {
var PopoverScreenView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = PopoverScreenView = (function(superClass) {
  extend(PopoverScreenView, superClass);

  PopoverScreenView.prototype.screenTitle = null;

  PopoverScreenView.prototype.templateTitle = require('views/templates/popover_screens/generic_title');

  PopoverScreenView.prototype.templateContent = function() {
    return console.log('Warning, no template has been defined for content.');
  };

  function PopoverScreenView(options) {
    PopoverScreenView.__super__.constructor.call(this, options);
    if (options.titleElement == null) {
      throw new Error('options.titleElement must be defined.');
    }
    if (options.contentElement == null) {
      throw new Error('options.contentElement must be defined.');
    }
    if (options.popover == null) {
      throw new Error('options.popover must be defined.');
    }
    this.titleElement = options.titleElement;
    this.contentElement = options.contentElement;
    this.popover = options.popover;
    this.switchToScreen = this.popover.switchToScreen.bind(this.popover);
  }

  PopoverScreenView.prototype.render = function() {
    this._renderTitle();
    this._renderContent();
    return this.afterRender();
  };

  PopoverScreenView.prototype._renderTitle = function() {
    var renderData;
    renderData = this.getRenderData();
    return this.titleElement.html(this.templateTitle(renderData));
  };

  PopoverScreenView.prototype._renderContent = function() {
    var renderData;
    renderData = this.getRenderData();
    return this.contentElement.html(this.templateContent(renderData));
  };

  PopoverScreenView.prototype.getRenderData = function() {
    return _.extend({}, this.model.toJSON(), {
      title: this.screenTitle
    });
  };

  PopoverScreenView.prototype.afterRender = function() {};

  PopoverScreenView.prototype.onLeaveScreen = function() {};

  PopoverScreenView.prototype.destroy = function() {
    this.setElement(null);
    return this.remove();
  };

  return PopoverScreenView;

})(Backbone.View);
});

;require.register("lib/popover_view", function(exports, require, module) {
var BaseView, PopoverView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('lib/base_view');

module.exports = PopoverView = (function(superClass) {
  extend(PopoverView, superClass);

  function PopoverView() {
    return PopoverView.__super__.constructor.apply(this, arguments);
  }

  PopoverView.prototype.template = require('views/templates/popover');

  PopoverView.prototype.initialize = function(options) {
    this.target = options.target;
    this.container = options.container;
    this.parentView = options.parentView;
    this.$tabCells = $('.fc-day-grid-container');
    if (this.$tabCells.length === 0) {
      this.$tabCells = $('.fc-time-grid-container');
    }
    return this;
  };

  PopoverView.prototype.selfclose = function(checkoutChanges) {
    var base;
    if (checkoutChanges == null) {
      checkoutChanges = true;
    }
    if (typeof (base = this.parentView).onPopoverClose === "function") {
      base.onPopoverClose();
    }
    return this.close(checkoutChanges);
  };

  PopoverView.prototype.close = function() {
    if (this.$popover != null) {
      this.$popover.remove();
      this.$popover = null;
    }
    this.target.data('popover', void 0);
    return this.remove();
  };

  PopoverView.prototype.getScreen = function(screenID) {
    var ref, screen;
    if (screenID == null) {
      screenID = 'default';
    }
    screen = (ref = this.screens) != null ? ref[screenID] : void 0;
    if (screen != null) {
      return screen;
    } else {
      throw new Error("Screen '" + screenID + "' is not defined.");
    }
  };

  PopoverView.prototype.switchToScreen = function(screenID) {
    var error;
    if (this.$popover == null) {
      error = 'Popover must be rendered before switching its screen.';
      throw new Error(error);
    }
    if (screenID === this.mainScreen && (this.screen != null)) {
      this.screen.onLeaveScreen();
    }
    if (this.screen != null) {
      this.screen.destroy();
    }
    return this.renderScreen(screenID);
  };

  PopoverView.prototype.renderScreen = function(screenID) {
    var ScreenBuilder;
    ScreenBuilder = this.getScreen(screenID);
    this.screen = new ScreenBuilder({
      model: this.model,
      el: this.$popover,
      titleElement: this.titleElement,
      contentElement: this.contentElement,
      popover: this
    });
    this.screen.render();
    return this.screenElement.attr('data-screen', screenID);
  };

  PopoverView.prototype.render = function() {
    var popoverWrapper;
    this.beforeRender();
    if (this.$popover == null) {
      popoverWrapper = this.template({
        title: '',
        content: ''
      });
      this.$popover = $(popoverWrapper);
      this.titleElement = this.$popover.find('.popover-title');
      this.contentElement = this.$popover.find('.popover-content');
      this.screenElement = this.$popover.find('.screen-indicator');
      this.setElement(this.$popover);
    }
    this.afterRender();
    this.renderScreen(this.mainScreen);
    this.positionPopover();
    return this;
  };

  PopoverView.prototype.positionPopover = function() {
    var bottom, containerHeight, containerOffset, containerWidth, left, oneRowHeight, popoverMargin, popoverWidth, position, targetLeftBorder, targetOffset, targetWidth, top;
    this.$popover.detach().css({
      display: 'block',
      top: 'auto',
      left: 'auto'
    });
    this.$popover.appendTo(this.container);
    popoverWidth = this.$popover.innerWidth();
    containerOffset = this.$tabCells.offset();
    containerHeight = this.$tabCells.innerHeight();
    containerWidth = this.$tabCells.innerWidth();
    targetOffset = this.target.offset();
    targetWidth = this.target.width();
    targetLeftBorder = targetOffset.left - this.container.offset().left;
    popoverMargin = 15;
    if (targetOffset.left <= (containerWidth / 2)) {
      left = targetLeftBorder + targetWidth + popoverMargin;
    } else {
      left = targetLeftBorder - popoverWidth - popoverMargin;
    }
    if (left + popoverWidth >= containerWidth) {
      left = containerWidth - 2 * (popoverWidth - popoverMargin);
    }
    if (left <= 0) {
      left = targetLeftBorder + (popoverWidth / 2) + popoverMargin;
    }
    oneRowHeight = containerHeight / 6;
    if (targetOffset.top < oneRowHeight * 1) {
      top = '5vh';
      bottom = 'auto';
    } else if (targetOffset.top < oneRowHeight * 2) {
      top = '15vh';
      bottom = 'auto';
    } else if (targetOffset.top < oneRowHeight * 3) {
      top = '35vh';
      bottom = 'auto';
    } else if (targetOffset.top < oneRowHeight * 4) {
      top = '45vh';
      bottom = 'auto';
    } else if (targetOffset.top < oneRowHeight * 5) {
      top = 'auto';
      bottom = '10vh';
    } else {
      top = 'auto';
      bottom = '0vh';
    }
    position = {
      top: top,
      bottom: bottom,
      left: left
    };
    return this.$popover.css(position);
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

;require.register("lib/request", function(exports, require, module) {
exports.request = function(type, url, data, callback) {
  var body, fired, req;
  body = data != null ? JSON.stringify(data) : null;
  fired = false;
  req = $.ajax({
    type: type,
    url: url,
    data: body,
    contentType: "application/json",
    dataType: "json",
    success: function(data) {
      fired = true;
      if (callback != null) {
        return callback(null, data);
      }
    },
    error: function(data) {
      fired = true;
      if (data != null) {
        data = JSON.parse(data.responseText);
        if ((data.msg != null) && (callback != null)) {
          return callback(new Error(data.msg, data));
        } else if ((data.error != null) && (callback != null)) {
          data.msg = data.error;
          return callback(new Error(data.msg, data));
        }
      } else if (callback != null) {
        return callback(new Error("Server error occured", data));
      }
    }
  });
  return req.always(function() {
    if (!fired) {
      return callback(new Error("Server error occured", data));
    }
  });
};

exports.get = function(url, callback) {
  return exports.request("GET", url, null, callback);
};

exports.post = function(url, data, callback) {
  return exports.request("POST", url, data, callback);
};

exports.put = function(url, data, callback) {
  return exports.request("PUT", url, data, callback);
};

exports.del = function(url, callback) {
  return exports.request("DELETE", url, null, callback);
};
});

;require.register("lib/socket_listener", function(exports, require, module) {
var SocketListener, addModel,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

addModel = (function(_this) {
  return function(model, callback) {
    return model.fetch({
      success: function(fetched) {
        var collection, i, len, ref;
        if (model.collections != null) {
          ref = model.collections;
          for (i = 0, len = ref.length; i < len; i++) {
            collection = ref[i];
            if (model instanceof collection.model) {
              collection.add(model);
            }
          }
        }
        return setTimeout(callback, 50);
      },
      error: function() {
        return setTimeout(callback, 50);
      }
    });
  };
})(this);

SocketListener = (function(superClass) {
  extend(SocketListener, superClass);

  function SocketListener() {
    return SocketListener.__super__.constructor.apply(this, arguments);
  }

  SocketListener.prototype.models = {
    'event': require('models/event')
  };

  SocketListener.prototype.events = ['event.create', 'event.update', 'event.delete'];

  SocketListener.prototype.queue = async.queue(addModel, 1);

  SocketListener.prototype.process = function(event) {
    var doctype, id, model, operation;
    doctype = event.doctype, operation = event.operation, id = event.id;
    switch (operation) {
      case 'create':
        return this.onRemoteCreate(doctype, id);
      case 'update':
        if (model = this.singlemodels.get(id)) {
          model.fetch({
            success: (function(_this) {
              return function(fetched) {
                if (fetched.changedAttributes()) {
                  return _this.onRemoteUpdate(fetched, null);
                }
              };
            })(this)
          });
        }
        return this.collections.forEach((function(_this) {
          return function(collection) {
            if (!(model = collection.get(id))) {
              return;
            }
            return model.fetch({
              success: function(fetched) {
                if (fetched.changedAttributes()) {
                  return _this.onRemoteUpdate(fetched, collection);
                }
              }
            });
          };
        })(this));
      case 'delete':
        if (model = this.singlemodels.get(id)) {
          this.onRemoteDelete(model, this.singlemodels);
        }
        return this.collections.forEach((function(_this) {
          return function(collection) {
            if (!(model = collection.get(id))) {
              return;
            }
            return _this.onRemoteDelete(model, collection);
          };
        })(this));
    }
  };

  SocketListener.prototype.onRemoteCreate = function(docType, id) {
    var model;
    if (!this.shouldFetchCreated(id)) {
      return;
    }
    model = new this.models[docType]({
      id: id
    });
    model.collections = this.collections;
    return this.queue.push(model);
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
  return (waitToChangeToday = function() {
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
  })();
};
});

;require.register("lib/view", function(exports, require, module) {
var View,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = View = (function(superClass) {
  extend(View, superClass);

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
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('lib/base_view');

module.exports = ViewCollection = (function(superClass) {
  extend(ViewCollection, superClass);

  function ViewCollection() {
    this.removeItem = bind(this.removeItem, this);
    this.addItem = bind(this.addItem, this);
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
    this.listenTo(this.collection, "sort", this.onReset);
    if (this.collectionEl == null) {
      this.collectionEl = this.el;
      return this.$collectionEl = this.$el;
    }
  };

  ViewCollection.prototype.render = function() {
    var id, ref, view;
    ref = this.views;
    for (id in ref) {
      view = ref[id];
      view.$el.detach();
    }
    return ViewCollection.__super__.render.apply(this, arguments);
  };

  ViewCollection.prototype.afterRender = function() {
    var id, ref, view;
    if (!this.$collectionEl) {
      this.$collectionEl = this.$(this.collectionEl);
    }
    ref = this.views;
    for (id in ref) {
      view = ref[id];
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
    var id, ref, view;
    ref = this.views;
    for (id in ref) {
      view = ref[id];
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
    "calendar list title": "Calendars",
    "sync settings button label": "Synchronization",
    "default calendar name": "Mein Kalender",
    "Add": "Hinzufügen",
    "event": "Ereignis",
    "create event": "Ereignis erstellen",
    "edit event": "Ereignis bearbeiten",
    "edit": "Bearbeiten",
    "save": "Speichern",
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
    "all day": "Ganztägig",
    "All day": "Ganztägig",
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
    "Calendar": "Kalender",
    "calendar": "Kalender",
    "Sync": "Sync",
    "ie: 9:00 important meeting": "z.B.: 9:00 wichtige Besprechung",
    "Month": "Monat",
    "Popup": "Popup",
    "Switch to List": "Wechseln zur Liste",
    "Switch to Calendar": "Wechseln zum Kalendar",
    "time": "Zeit",
    "Today": "Heute",
    "today": "heute",
    "What should I remind you ?": "An was soll ich Sie erinnern?",
    "select an icalendar file": "Auswählen einer ICalendar Datei",
    "import your icalendar file": "Ihre ICalendar Datei importieren",
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
    "are you sure": "Sind Sie sicher?",
    "confirm delete calendar": "Sie sind im Begriff alle Ereignisse in %{calendarName} zu löschen. Sind Sie sicher?",
    "confirm delete selected calendars": "Sie sind im Begriff alle ausgewählten Kalender zu löschen. Sind Sie sicher?",
    "advanced": "Erweitert",
    "enter email": "E-Mail anzeigen",
    "ON": "EIN",
    "OFF": "AUS",
    "no description": "Keine Beschreibung",
    "add calendar": "Kalendar hinzufügen",
    "new calendar": "Neuer Kalendar",
    "multiple actions": "mehrere  Aktionen ",
    "recurrence": "Wiederholung",
    "recurrence rule": "Wiederholungsregeln",
    "make reccurent": "Wiederholung erstellen",
    "repeat every": "Alle wiederholen",
    "no recurrence": "Keine Wiederholung",
    "repeat on": "Wiederholen",
    "repeat on date": "wiederholen an Datum",
    "repeat on weekday": "Täglich wiederholen",
    "repeat until": "Wiederholen bis",
    "after": "Nach",
    "repeat": "Wiederholen",
    "forever": "Immer",
    "occurences": "Ereignis",
    "every": "Jede/n",
    "minutes": "Minuten",
    "minute ": "Minute",
    "minute": "Minute",
    "hours": "Stunden",
    "hour": "Stunde",
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
    "screen title done button": "Done",
    "placeholder event title": "Terminbeschreibung",
    "from": "Von",
    "placeholder from date": "Von [date]",
    "placeholder from time": "Von [hours:minutes]",
    "to": "Bis",
    "placeholder to date": "Bis [date]",
    "placeholder to time": "Bis [hours:minutes]",
    "placeholder place": "Ort",
    "add guest button": "Gast hinzufügen",
    "guests list": "%{first} und %{smart_count} anderer |||| %{first} and %{smart_count} andere",
    "placeholder description": "Beschreibung",
    "no alert button": "Keine Erinnerung",
    "alert label": "%{smart_count} Erinnerung geplant |||| %{smart_count} Erinnerungen geplant",
    "alert tooltip": "Erinnerungen bearbeiten",
    "no repeat button": "Keine Wiederholung",
    "repeat tooltip": "Wiederholung bearbeiten",
    "more details button": "Mehr Optionen",
    "save button": "Speichern",
    "create button": "Erstellen",
    "duplicate event tooltip": "Termine duplizieren",
    "delete event tooltip": "Termin löschen",
    "change calendar": "Kalender wechseln",
    "screen delete title": "Termin Löschen",
    "screen delete description": "Sie sind dabei den Termin  \"%{description}\" Zu löschen. Wollen Sie das wirklich?",
    "screen delete yes button": "Ja",
    "screen delete no button": "Nein",
    "screen guest title empty": "Gast",
    "screen guest title": "%{smart_count} Gast |||| %{smart_count} Gäste",
    "screen guest input placeholder": "Email Adresse",
    "screen guest add button": "Hinzufügen",
    "screen guest remove tooltip": "Einladung abbrechen",
    "screen description title": "Beschribeung",
    "screen alert title empty": "Erinnerung",
    "screen alert title": "%{smart_count} alert |||| %{smart_count} alerts",
    "screen alert default value": "Add new alert",
    "screen alert time of event": "Time of the event",
    "screen alert minute": "%{smart_count} minute |||| %{smart_count} minutes",
    "screen alert hour": "%{smart_count} hour |||| %{smart_count} hours",
    "screen alert day": "%{smart_count} day |||| %{smart_count} days",
    "screen alert week": "%{smart_count} week |||| %{smart_count} weeks",
    "screen alert delete tooltip": "Delete alert",
    "screen alert type email": "Email",
    "screen alert type notification": "Cozy notification",
    "screen recurrence title": "Wiederholen",
    "screen recurrence no repeat": "Nicht Wiederholen",
    "screen recurrence daily": "Täglich",
    "screen recurrence weekly": "Wöchentlich",
    "screen recurrence monthly": "Monatlich",
    "screen recurrence yearly": "Jährlich",
    "screen recurrence interval label": "Interval",
    "screen recurrence interval unit 0": "year |||| years",
    "screen recurrence interval unit 1": "month |||| months",
    "screen recurrence interval unit 2": "week |||| weeks",
    "screen recurrence interval unit 3": "day |||| days",
    "screen recurrence interval unit": "days",
    "screen recurrence days list label": "On days",
    "screen recurrence repeat by label": "Repeat by",
    "screen recurrence repeat by month": "Day of the month",
    "screen recurrence repeat by week": "Day of the week",
    "screen recurrence ends label": "Ends:",
    "screen recurrence ends never label": "Nie",
    "screen recurrence ends count label": "Nach",
    "screen recurrence ends count unit": "occurrences",
    "screen recurrence ends until label": "Bis",
    "screen recurrence ends until placeholder": "Until [date]",
    "screen recurrence summary label": "Summary",
    "send mails question": "Eine Mitteilung senden an E-MAil:",
    "modal send mails": "Eine Mitteilung senden",
    "yes": "Ja",
    "no": "Nein",
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
    "import finished": "Your import is now finished. Displaying all new events take time. If you want to load them faster, refresh the whole page.",
    "import error": "A server error occured, the import failed.",
    "import error occured for": "Import error occured for following elements:",
    "export your calendar": "Exportieren Sie Ihren Kalendar",
    "please select existing calendar": "Bitte wählen Sie einen bestehenden Kalendar aus.",
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
    "Jan": "Jan",
    "Feb": "Feb",
    "Mar": "Mär",
    "Apr": "Apr",
    "Jun": "Jun",
    "Jul": "Jul",
    "Aug": "Aug",
    "Sep": "Sep",
    "Oct": "Okt",
    "Nov": "Nov",
    "Dec": "Dez",
    "calendar exist error": "Ein Kalendar mit dem Namenn \"Neuer Kalendar\" existiert bereits.",
    "email date format": "On MMMM Do YYYY, h:mm a",
    "email date format allday": "On MMMM Do YYYY, [all day long]",
    "email invitation title": "Invitation to '%{description}'",
    "email invitation content": "Hallo, ich lade Sie zu folgendem Ereignis ein:\n%{description} %{place}\nam %{date}\nBitte um Zusage/Absage?\nJa\n%{url}?status=ACCEPTED&key=%{key}\nNein\n%{url}?status=DECLINED&key=%{key}",
    "email update title": "Event \"%{description}\" has changed",
    "email update content": "Ein Ereignis zu dem Sie eingeladen wurden, hat sich geändert:\n%{description} %{place}\nam %{date}\nWeiterhin; Zusage\n%{url}?status=ACCEPTED&key=%{key}\nNein leider; Absage\n%{url}?status=DECLINED&key=%{key}",
    "email delete title": "Diese Ereignis wurde abgesagt: %{description}",
    "email delete content": "Dieses Ereignis wurde abgesagt:\n%{description} %{place}\nam %{date}",
    "invalid recurring rule": "The recurring rule is invalid"
}
;
});

require.register("locales/en", function(exports, require, module) {
module.exports = {
  "calendar list title": "Calendars",
  "sync settings button label": "Synchronization",
  "default calendar name": "my calendar",
  "Add": "Add",
  "event": "Event",
  "create event": "Event creation",
  "edit event": "Event edition",
  "edit": "Edit",
  "save": "Save",
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
  "all day": "all day",
  "All day": "All day",
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
  "today": "today",
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
  "advanced": "More options",
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
  "minutes": "minutes",
  "minute ": "minute",
  "minute": "minute",
  "hours": "hours",
  "hour": "hour",
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
  "screen title done button": "Done",
  "placeholder event title": "Event title",
  "from": "From",
  "placeholder from date": "From [date]",
  "placeholder from time": "From [hours:minutes]",
  "to": "To",
  "placeholder to date": "To [date]",
  "placeholder to time": "To [hours:minutes]",
  "all day": "All day",
  "placeholder place": "Place",
  "add guest button": "Add guest",
  "guests list": "%{first} and %{smart_count} other |||| %{first} and %{smart_count} others",
  "placeholder description": "Description",
  "no alert button": "No alert",
  "alert label": "%{smart_count} alert scheduled |||| %{smart_count} alerts scheduled",
  "alert tooltip": "Manage alerts",
  "no repeat button": "No repeat",
  "repeat tooltip": "Manage recurrence",
  "more details button": "More options",
  "save button": "Save",
  "create button": "Create",
  "duplicate event tooltip": "Duplicate event",
  "delete event tooltip": "Delete event",
  "change calendar": "Change calendar",
  "screen delete title": "Delete event",
  "screen delete description": "You are about to delete the event \"%{description}\". Are you sure?",
  "screen delete yes button": "Yes",
  "screen delete no button": "No",
  "screen guest title empty": "Guest",
  "screen guest title": "%{smart_count} guest |||| %{smart_count} guests",
  "screen guest input placeholder": "Email address",
  "screen guest add button": "Add",
  "screen guest remove tooltip": "Cancel the invitation",
  "screen description title": "Description",
  "screen alert title empty": "Alert",
  "screen alert title": "%{smart_count} alert |||| %{smart_count} alerts",
  "screen alert default value": "Add new alert",
  "screen alert time of event": "Time of the event",
  "screen alert minute": "%{smart_count} minute |||| %{smart_count} minutes",
  "screen alert hour": "%{smart_count} hour |||| %{smart_count} hours",
  "screen alert day": "%{smart_count} day |||| %{smart_count} days",
  "screen alert week": "%{smart_count} week |||| %{smart_count} weeks",
  "screen alert delete tooltip": "Delete alert",
  "screen alert type email": "Email",
  "screen alert type notification": "Cozy notification",
  "screen recurrence title": "Repeat",
  "screen recurrence no repeat": "No repeat",
  "screen recurrence daily": "Daily",
  "screen recurrence weekly": "Weekly",
  "screen recurrence monthly": "Monthly",
  "screen recurrence yearly": "Yearly",
  "screen recurrence interval label": "Interval",
  "screen recurrence interval unit 0": "year |||| years",
  "screen recurrence interval unit 1": "month |||| months",
  "screen recurrence interval unit 2": "week |||| weeks",
  "screen recurrence interval unit 3": "day |||| days",
  "screen recurrence interval unit": "days",
  "screen recurrence days list label": "On days",
  "screen recurrence repeat by label": "Repeat by",
  "screen recurrence repeat by month": "Day of the month",
  "screen recurrence repeat by week": "Day of the week",
  "screen recurrence ends label": "Ends:",
  "screen recurrence ends never label": "Never",
  "screen recurrence ends count label": "After",
  "screen recurrence ends count unit": "occurrences",
  "screen recurrence ends until label": "Until",
  "screen recurrence ends until placeholder": "Until [date]",
  "screen recurrence summary label": "Summary",
  "send mails question": "Send a notification email to:",
  "modal send mails": "Send a notification",
  "yes": "Yes",
  "no": "No",
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
  "import finished": "Your import is now finished. Displaying all new events take time. If you want to load them faster, refresh the whole page.",
  "import error": "A server error occured, the import failed.",
  "import error occured for": "Import error occured for following elements:",
  "export your calendar": "Export your calendar",
  "please select existing calendar": "Please select an existing calendar.",
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
  "Jan": "Jan",
  "Feb": "Feb",
  "Mar": "Mar",
  "Apr": "Apr",
  "Jun": "Jun",
  "Jul": "Jul",
  "Aug": "Aug",
  "Sep": "Sep",
  "Oct": "Oct",
  "Nov": "Nov",
  "Dec": "Dec",
  "calendar exist error": "A calendar named \"New Calendar\" already exists.",
  "email date format": "MMMM Do YYYY, h:mm a",
  "email date format allday": "MMMM Do YYYY, [all day long]",
  "email invitation title": "Invitation to '%{description}'",
  "email invitation content": "Hello, I would like to invite you to the following event:\n\n%{description} %{place}\non %{date}\nWould you be there?\n\nYes\n%{url}?status=ACCEPTED&key=%{key}\n\nNo\n%{url}?status=DECLINED&key=%{key}",
  "email update title": "Event \"%{description}\" has changed",
  "email update content": "An event you were invited to has changed:\n%{description} %{place}\nOn %{date}\n\nI'm still going\n%{url}?status=ACCEPTED&key=%{key}\n\nI'm not going anymore\n%{url}?status=DECLINED&key=%{key}",
  "email delete title": "This event has been canceled: %{description}",
  "email delete content": "This event has been canceled:\n%{description} %{place}\nOn %{date}",
  "invalid recurring rule": "The recurring rule is invalid"
}
;
});

require.register("locales/es", function(exports, require, module) {
module.exports = {
    "calendar list title": "Agendas",
    "sync settings button label": "Sincronización",
    "default calendar name": "mi agenda",
    "Add": "Añadir",
    "event": "Evento",
    "create event": "Creación de un evento",
    "edit event": "Modificar un evento",
    "edit": "Modificar",
    "save": "Guardar",
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
    "all day": "Todo el día",
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
    "list": "lista",
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
    "advanced": "Más opciones",
    "enter email": "Escriba su dirección de correo electrónico",
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
    "minute ": "minuto",
    "minute": "minuto",
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
    "screen title done button": "Proceder",
    "placeholder event title": "Titulo del evento",
    "from": "Desde el",
    "placeholder from date": "Desde el [date]",
    "placeholder from time": "Desde la(s) [hours:minutes]",
    "to": "Hasta el",
    "placeholder to date": "Hasta el [date]",
    "placeholder to time": "Hasta la(s)",
    "placeholder place": "Lugar",
    "add guest button": "Añadir invitado",
    "guests list": "%{first} y %{smart_count} otro |||| %{first} y %{smart_count} otros",
    "placeholder description": "Descripción",
    "no alert button": "Sin alarma",
    "alert label": "%{smart_count} alarma programada |||| %{smart_count} alarmas programadas",
    "alert tooltip": "Administrar las alarmas",
    "no repeat button": "No repetir",
    "repeat tooltip": "Administrar la recurrencia",
    "more details button": "Más opciones",
    "save button": "Guardar",
    "create button": "Crear",
    "duplicate event tooltip": "Repetir evento",
    "delete event tooltip": "Anular evento",
    "change calendar": "Cambiar de agenda",
    "screen delete title": "Anular evento",
    "screen delete description": "Está usted a punto de suprimir el evento \"%{description}\". ¿Está seguro?",
    "screen delete yes button": "Si",
    "screen delete no button": "No",
    "screen guest title empty": "Invitado",
    "screen guest title": "%{smart_count} invitado |||| %{smart_count} invitados",
    "screen guest input placeholder": "Correo electrónico",
    "screen guest add button": "Añadir",
    "screen guest remove tooltip": "Anular la invitación",
    "screen description title": "Descripción",
    "screen alert title empty": "Alarma",
    "screen alert title": "%{smart_count} alarma |||| %{smart_count} alarmas",
    "screen alert default value": "Añadir otra alarma",
    "screen alert time of event": "Al inicio del evento",
    "screen alert minute": "%{smart_count} minuto |||| %{smart_count} minutos",
    "screen alert hour": "%{smart_count} hora |||| %{smart_count} horas",
    "screen alert day": "%{smart_count} día |||| %{smart_count} días",
    "screen alert week": "%{smart_count} semana |||| %{smart_count} semanas",
    "screen alert delete tooltip": "Suprimir alarma",
    "screen alert type email": "Email",
    "screen alert type notification": "Notificación de Cozy",
    "screen recurrence title": "Repetir",
    "screen recurrence no repeat": "No repetir",
    "screen recurrence daily": "Diariamente",
    "screen recurrence weekly": "Semanalmente",
    "screen recurrence monthly": "Mensualmente",
    "screen recurrence yearly": "Anualmente",
    "screen recurrence interval label": "intervalo",
    "screen recurrence interval unit 0": "año |||| años",
    "screen recurrence interval unit 1": "mes |||| meses",
    "screen recurrence interval unit 2": "semana |||| semanas",
    "screen recurrence interval unit 3": "día |||| días",
    "screen recurrence interval unit": "días",
    "screen recurrence days list label": "Los días",
    "screen recurrence repeat by label": "Debe repetirse por",
    "screen recurrence repeat by month": "Día del mes",
    "screen recurrence repeat by week": "Día de la semana",
    "screen recurrence ends label": "Terminan:",
    "screen recurrence ends never label": "Nunca",
    "screen recurrence ends count label": "Después",
    "screen recurrence ends count unit": "veces",
    "screen recurrence ends until label": "Hasta el",
    "screen recurrence ends until placeholder": "Hasta el [date]",
    "screen recurrence summary label": "Resumen",
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
    "import finished": "La importación se ha terminado. Visualizar los nuevos eventos toma un cierto tiempo. Si quiere cargarlos más rápido, vuelva a cargar la página.",
    "import error": "Error en el servidor, la importación ha fallado.",
    "import error occured for": "Error en la importación de los siguientes elementos:",
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
    "email date format": "MMMM Do YYYY, h:mm a",
    "email date format allday": "MMMM Do YYYY, [all day long]",
    "email invitation title": "Invitación a '%{description}'",
    "email invitation content": "Buenos días, desearía invitarlo(a) al siguiente evento:\n\n%{description} %{place}\nel %{date}\n¿Podríamos contar con su presencia?\n\nSi\n%{url}?status=ACCEPTED&key=%{key}\n\nNo\n %{url}?status=DECLINED&key=%{key}",
    "email update title": "El evento \"%{description}\" ha sido modificado",
    "email update content": "Un evento en el que usted participa se ha cambiado:\n%{description} %{place}\nel %{date}\n\nSeguiré estando presente\n %{url}?status=ACCEPTED&key=%{key}\n\nNo cuenten conmigo\n %{url}?status=ACCEPTED&key=%{key}",
    "email delete title": "Este evento ha sido anulado: %{description}",
    "email delete content": "Este evento ha sido anulado:\n%{description} %{place}\nel %{date}",
    "invalid recurring rule": "La regla recurrente no es válida"
}
;
});

require.register("locales/fr", function(exports, require, module) {
module.exports = {
    "calendar list title": "Agendas",
    "sync settings button label": "Synchronisation",
    "default calendar name": "mon agenda",
    "Add": "Ajouter",
    "event": "événement",
    "create event": "Création d'un événement",
    "edit event": "Modification d'un événement",
    "edit": "Modifier",
    "save": "Sauvegarder",
    "create": "Créer",
    "creation": "Création",
    "invite": "Inviter",
    "close": "Fermer",
    "delete": "Supprimer",
    "change color": "Changer la couleur",
    "rename": "Renommer",
    "export": "Exporter",
    "remove": "Supprimer l’événement",
    "duplicate": "Dupliquer l’événement",
    "Place": "Lieu",
    "all day": "Toute la journée",
    "All day": "Journée entière",
    "description": "Description",
    "date": "Date",
    "Day": "Jour",
    "days": "jours",
    "Edit": "Modifier",
    "Email": "Email",
    "Import": "Importer",
    "Export": "Exporter",
    "show": "Afficher",
    "hide": "Masquer",
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
    "time": "fois",
    "Today": "Aujourd'hui",
    "today": "aujourd'hui",
    "What should I remind you ?": "Que dois-je vous rappeler ?",
    "select an icalendar file": "Sélectionner un fichier iCalendar",
    "import your icalendar file": "Importer votre fichier iCalendar",
    "confirm import": "Confirmer l'importation",
    "cancel": "Annuler",
    "Create": "Créer",
    "Events to import": "Événements à importer",
    "Create Event": "Créer un événement",
    "From [hours:minutes]": "De [heure:minute]",
    "To [hours:minutes]": "À [heure:minute]",
    "To [date]": "À [date]",
    "Description": "Description",
    "days after": "jours après",
    "days later": "jours plus tard",
    "Week": "Semaine",
    "Display": "Notification",
    "DISPLAY": "Notification",
    "EMAIL": "Email",
    "BOTH": "Email & notification",
    "display previous events": "Afficher les événements précédents",
    "display next events": "Afficher les événements suivants",
    "are you sure": "Êtes-vous sûr(e) ?",
    "confirm delete calendar": "Vous êtes sur le point de supprimer tous les événements associés à %{calendarName}. Êtes-vous sûr(e) ?",
    "confirm delete selected calendars": "Vous êtes sur le point de supprimer tous les agendas sélectionnés. Êtes-vous sûr(e) ?",
    "advanced": "Plus d'options",
    "enter email": "Saisir l'adresse email",
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
    "every": "tou(te)s les",
    "minutes": "minutes",
    "minute ": "minute",
    "minute": "minute",
    "hours": "heures",
    "hour": "heure",
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
    "th": "e",
    "nd": "e",
    "rd": "e",
    "st": "er",
    "last": "dernier",
    "and": "et",
    "times": "fois",
    "weekday": "jours de la semaine",
    "screen title done button": "Effectué",
    "placeholder event title": "Titre de l'évènement",
    "from": "De",
    "placeholder from date": "De [date]",
    "placeholder from time": "De [heure:minute]",
    "to": "À",
    "placeholder to date": "À [date]",
    "placeholder to time": "À [heure:minute]",
    "placeholder place": "Lieu",
    "add guest button": "Ajouter un invité",
    "guests list": "%{first} et %{smart_count} autre |||| %{first} et %{smart_count} autres",
    "placeholder description": "Description",
    "no alert button": "Pas d'alerte",
    "alert label": "%{smart_count} alerte planifiée |||| %{smart_count} alertes planifiées",
    "alert tooltip": "Gérer les alertes",
    "no repeat button": "Ne pas répéter",
    "repeat tooltip": "Gérer la récurrence",
    "more details button": "Plus d'options",
    "save button": "Sauvegarder",
    "create button": "Créer",
    "duplicate event tooltip": "Dupliquer l’événement",
    "delete event tooltip": "Supprimer l’événement",
    "change calendar": "Modifier l'agenda",
    "screen delete title": "Supprimer l’événement",
    "screen delete description": "Vous êtes sur le point de supprimer l’événement \"%{description}\". Êtes-vous sûr(e) ?",
    "screen delete yes button": "Oui",
    "screen delete no button": "Non",
    "screen guest title empty": "Invité",
    "screen guest title": "%{smart_count} invité |||| %{smart_count} invités",
    "screen guest input placeholder": "Adresse e-mail",
    "screen guest add button": "Ajouter",
    "screen guest remove tooltip": "Annuler l'invitation",
    "screen description title": "Description",
    "screen alert title empty": "Alerte",
    "screen alert title": "%{smart_count} alerte |||| %{smart_count} alertes",
    "screen alert default value": "Ajouter une nouvelle alerte",
    "screen alert time of event": "Heure de l’événement",
    "screen alert minute": "%{smart_count} minute |||| %{smart_count} minutes",
    "screen alert hour": "%{smart_count} heure |||| %{smart_count} heures",
    "screen alert day": "%{smart_count} jour |||| %{smart_count} jours",
    "screen alert week": "%{smart_count} semaine |||| %{smart_count} semaines",
    "screen alert delete tooltip": "Supprimer l'alerte",
    "screen alert type email": "Email",
    "screen alert type notification": "Notification Cozy",
    "screen recurrence title": "Répéter",
    "screen recurrence no repeat": "Ne pas répéter",
    "screen recurrence daily": "Chaque jour",
    "screen recurrence weekly": "Chaque semaine",
    "screen recurrence monthly": "Chaque mois",
    "screen recurrence yearly": "Chaque année",
    "screen recurrence interval label": "Intervalle",
    "screen recurrence interval unit 0": "annéé |||| années",
    "screen recurrence interval unit 1": "mois |||| mois",
    "screen recurrence interval unit 2": "semaine |||| semaines",
    "screen recurrence interval unit 3": "jour |||| jours",
    "screen recurrence interval unit": "jours",
    "screen recurrence days list label": "Les jours",
    "screen recurrence repeat by label": "Répéter par",
    "screen recurrence repeat by month": "Jour du mois",
    "screen recurrence repeat by week": "Jour de la semaine",
    "screen recurrence ends label": "Finit le :",
    "screen recurrence ends never label": "Jamais",
    "screen recurrence ends count label": "Après",
    "screen recurrence ends count unit": "occurrences",
    "screen recurrence ends until label": "Jusqu'à",
    "screen recurrence ends until placeholder": "Jusqu'à [date]",
    "screen recurrence summary label": "Résumé",
    "send mails question": "Envoyer un email de notification à :",
    "modal send mails": "Envoyer une notification",
    "yes": "Oui",
    "no": "Non",
    "no summary": "Le titre est obligatoire.",
    "start after end": "La fin est avant le début.",
    "invalid start date": "Le début est invalide.",
    "invalid end date": "La fin est invalide.",
    "invalid trigg date": "Le moment est invalide.",
    "invalid action": "L'action est invalide.",
    "server error occured": "Une erreur est survenue sur le serveur.",
    "synchronization": "Synchronisation",
    "mobile sync": "Synchro Mobile (CalDAV)",
    "link imported events with calendar": "Lier les événements à importer avec l'agenda suivant :",
    "import an ical file": "Pour importer un fichier iCal dans votre agenda, commencez par cliquer sur ce bouton pour le précharger :",
    "download a copy of your calendar": "Sélectionner un agenda puis cliquer sur le bouton exporter pour télécharger une copie de l'agenda comme un fichier iCal :",
    "icalendar export": "Exporter ICalendar",
    "icalendar import": "Importer ICalendar",
    "to sync your cal with": "Pour synchroniser votre agenda avec votre mobile vous devez :",
    "sync headline with data": "Pour synchroniser votre agenda, utilisez les identifiants suivants :",
    "sync url": "URL :",
    "sync login": "Nom d'utilisateur :",
    "sync password": "Mot de passe :",
    "sync help": "Vous êtes perdu(e) ? Suivez le",
    "sync help link": "guide pas à pas !",
    "install the sync module": "Installer le module Sync depuis l'applithèque.",
    "connect to it and follow": "Vous connecter et suivre les instructions relatives à CalDAV.",
    "some event fail to save": "La sauvegarde d'un événement a échoué.",
    "imported events": "Nombre d’événements importés",
    "import finished": "Votre importation est maintenant terminée. L'affichage de tous les événements prend du temps. Si vous voulez les charger plus vite, rafraîchissez la page.",
    "import error": "Une erreur serveur est survenue, l'importation a échoué.",
    "import error occured for": "Une erreur d'importation est survenue pour les éléments suivants :",
    "export your calendar": "Exporter votre agenda",
    "please select existing calendar": "Veuillez sélectionner un agenda existant.",
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
    "Jan": "Jan",
    "Feb": "Fév",
    "Mar": "Mar",
    "Apr": "Avr",
    "Jun": "Jui",
    "Jul": "Jul",
    "Aug": "Aou",
    "Sep": "Sep",
    "Oct": "Oct",
    "Nov": "Nov",
    "Dec": "Déc",
    "calendar exist error": "Un  agenda nommé \"Nouvel agenda\" existe déjà.",
    "email date format": "MMMM Do YYYY, h:mm a",
    "email date format allday": "MMMM Do YYYY, [all day long]",
    "email invitation title": "Invitation à '%{description}'",
    "email invitation content": "Bonjour, je souhaiterais vous inviter à l’événement suivant :\n%{description} %{place}\nLe %{date}\nSerez-vous présent ?\n\nOui\n%{url}?status=ACCEPTED&key=%{key}\n\nNon\n%{url}?status=DECLINED&key=%{key}",
    "email update title": "L’événement \"%{description}\" a changé",
    "email update content": "Un événement auquel vous participez a changé :\n%{description} %{place}\nLe %{date}\n\nJe viens toujours\n%{url}?status=ACCEPTED&key=%{key}\n\nJe ne viens plus\n%{url}?status=DECLINED&key=%{key}",
    "email delete title": "Cet événement a été annulé : %{description}",
    "email delete content": "Cet événement a été annulé :\n%{description} %{place}\nLe %{date}",
    "invalid recurring rule": "La règle de récursion est invalide"
}
;
});

require.register("locales/ro", function(exports, require, module) {
module.exports = {
    "calendar list title": "Calendars",
    "sync settings button label": "Synchronization",
    "default calendar name": "calendarul meu",
    "Add": "Adaug",
    "event": "Eveniment",
    "create event": "Creez eveniment",
    "edit event": "Ediție eventiment",
    "edit": "Editare",
    "save": "Save",
    "create": "Creare",
    "creation": "Creare",
    "invite": "Invitație",
    "close": "Închide",
    "delete": "Șterge",
    "change color": "Schimbă culoarea",
    "rename": "Redenumește",
    "export": "Exportă",
    "remove": "Inlătură eveniment",
    "duplicate": "Copiază eveniment",
    "Place": "Loc",
    "all day": "All day",
    "All day": "Toată ziua",
    "description": "Descriere",
    "date": "data",
    "Day": "Ziua",
    "days": "zile",
    "Edit": "Editează",
    "Email": "Email",
    "Import": "Importă",
    "Export": "Exportă",
    "show": "Arată",
    "hide": "Ascunde",
    "List": "Listă",
    "list": "listă",
    "Calendar": "Calendar",
    "calendar": "Calendar",
    "Sync": "Sincronizare",
    "ie: 9:00 important meeting": "ex: 9:00 întâlnire importantă",
    "Month": "Luna",
    "Popup": "Scoate în afară",
    "Switch to List": "Schimbă în listă",
    "Switch to Calendar": "Schimbă in Calendar",
    "time": "timp",
    "Today": "Azi",
    "today": "azi",
    "What should I remind you ?": "Ce ar trebui să-ți amintesc?",
    "select an icalendar file": "Selecteaza un fișier icalendar",
    "import your icalendar file": "importă fișierul tău icalendar",
    "confirm import": "confirmă importul",
    "cancel": "anulează",
    "Create": "Crează",
    "Events to import": "Evenimente de importat",
    "Create Event": "Creez eveniment",
    "From [hours:minutes]": "De la [hours:minutes]",
    "To [hours:minutes]": "La [hours:minutes]",
    "To [date]": "La [date]",
    "Description": "Descriere",
    "days after": "zile după",
    "days later": "zile mai târziu",
    "Week": "Săptamâna",
    "Display": "Notificare",
    "DISPLAY": "Notificare",
    "EMAIL": "E-mail",
    "BOTH": "E-mail și Notificare",
    "display previous events": "Arată evenimentele trecute",
    "display next events": "Arată evenimentele viitoare",
    "are you sure": "Ești sigur?",
    "confirm delete calendar": "Ești pe care să ștergi toate evenimentele legate de %{calendarName}. Ești sigur?",
    "confirm delete selected calendars": "Ești pe care să ștergi toate calendarele selectate. Ești sigur?",
    "advanced": "More options",
    "enter email": "Introdu email-ul",
    "ON": "pornit",
    "OFF": "oprit",
    "no description": "Fără descriere",
    "add calendar": "Adaugă calendar",
    "new calendar": "Calendar nou",
    "multiple actions": "Acțiuni multiple",
    "recurrence": "Recurență",
    "recurrence rule": "Reguli de recurență",
    "make reccurent": "Fă recurent",
    "repeat every": "Repetă la fiecare",
    "no recurrence": "Fără recurență",
    "repeat on": "Repetiție pornită",
    "repeat on date": "Repetă la datele",
    "repeat on weekday": "Repetă in zilele de lucru",
    "repeat until": "Repetă până la",
    "after": "După",
    "repeat": "Repetă",
    "forever": "Întotdeauna",
    "occurences": "repetări",
    "every": "La fiecare",
    "minutes": "minute",
    "minute ": "minut",
    "minute": "minut",
    "hours": "ore",
    "hour": "oră",
    "day": "ziua",
    "weeks": "săptămâni",
    "week": "săptămâna",
    "months": "luni",
    "month": "luna",
    "years": "ani",
    "year": "an",
    "until": "până la",
    "for": "pentru",
    "on": "la",
    "on the": "la",
    "th": "-lea",
    "nd": "-lea",
    "rd": "-lea",
    "st": "ul",
    "last": "ultimul",
    "and": "și",
    "times": "ori",
    "weekday": "zile lucrătoare",
    "screen title done button": "Done",
    "placeholder event title": "Event title",
    "from": "From",
    "placeholder from date": "From [date]",
    "placeholder from time": "From [hours:minutes]",
    "to": "To",
    "placeholder to date": "To [date]",
    "placeholder to time": "To [hours:minutes]",
    "placeholder place": "Place",
    "add guest button": "Add guest",
    "guests list": "%{first} and %{smart_count} other |||| %{first} and %{smart_count} others",
    "placeholder description": "Description",
    "no alert button": "No alert",
    "alert label": "%{smart_count} alert scheduled |||| %{smart_count} alerts scheduled",
    "alert tooltip": "Manage alerts",
    "no repeat button": "No repeat",
    "repeat tooltip": "Manage recurrence",
    "more details button": "More options",
    "save button": "Save",
    "create button": "Create",
    "duplicate event tooltip": "Duplicate event",
    "delete event tooltip": "Delete event",
    "change calendar": "Schimbă calendarul",
    "screen delete title": "Delete event",
    "screen delete description": "You are about to delete the event \"%{description}\". Are you sure?",
    "screen delete yes button": "Yes",
    "screen delete no button": "No",
    "screen guest title empty": "Guest",
    "screen guest title": "%{smart_count} guest |||| %{smart_count} guests",
    "screen guest input placeholder": "Email address",
    "screen guest add button": "Add",
    "screen guest remove tooltip": "Cancel the invitation",
    "screen description title": "Description",
    "screen alert title empty": "Alert",
    "screen alert title": "%{smart_count} alert |||| %{smart_count} alerts",
    "screen alert default value": "Add new alert",
    "screen alert time of event": "Time of the event",
    "screen alert minute": "%{smart_count} minute |||| %{smart_count} minutes",
    "screen alert hour": "%{smart_count} hour |||| %{smart_count} hours",
    "screen alert day": "%{smart_count} day |||| %{smart_count} days",
    "screen alert week": "%{smart_count} week |||| %{smart_count} weeks",
    "screen alert delete tooltip": "Delete alert",
    "screen alert type email": "Email",
    "screen alert type notification": "Cozy notification",
    "screen recurrence title": "Repeat",
    "screen recurrence no repeat": "No repeat",
    "screen recurrence daily": "Daily",
    "screen recurrence weekly": "Weekly",
    "screen recurrence monthly": "Monthly",
    "screen recurrence yearly": "Yearly",
    "screen recurrence interval label": "Interval",
    "screen recurrence interval unit 0": "year |||| years",
    "screen recurrence interval unit 1": "month |||| months",
    "screen recurrence interval unit 2": "week |||| weeks",
    "screen recurrence interval unit 3": "day |||| days",
    "screen recurrence interval unit": "days",
    "screen recurrence days list label": "On days",
    "screen recurrence repeat by label": "Repeat by",
    "screen recurrence repeat by month": "Day of the month",
    "screen recurrence repeat by week": "Day of the week",
    "screen recurrence ends label": "Ends:",
    "screen recurrence ends never label": "Never",
    "screen recurrence ends count label": "After",
    "screen recurrence ends count unit": "occurrences",
    "screen recurrence ends until label": "Until",
    "screen recurrence ends until placeholder": "Until [date]",
    "screen recurrence summary label": "Summary",
    "send mails question": "Trimite notificarea pe email către:",
    "modal send mails": "Trimite o notificare",
    "yes": "Da",
    "no": "Nu",
    "no summary": "Un sumar trebuie setat",
    "start after end": "Data de start este după cea de oprire",
    "invalid start date": "Data de start este invalidă",
    "invalid end date": "Data terminării este invalidă",
    "invalid trigg date": "Data este invalidă",
    "invalid action": "Acțiunea este invalidă",
    "server error occured": "A apărut o eroare de server",
    "synchronization": "Sincronizare",
    "mobile sync": "Sincronizare de mobil (CalDav)",
    "link imported events with calendar": "Leagă evenimentele de importat cu următorul calendar:",
    "import an ical file": "Pentru a importa un fișier ICal in calendarul Cozy, apasă intâi pe acest buton pentru a-l preîncărca",
    "download a copy of your calendar": "Selectează un calendar și apoi apasă pe butonul de export, pentru a downloada o copie a calendarului ca fișier ICal :",
    "icalendar export": "Export ICalendar",
    "icalendar import": "Import ICalendar",
    "to sync your cal with": "Pentru a-ți sincroniza calendarul cu dispozitivele, trebuie să urmezi doi pași",
    "sync headline with data": "Pentru a-ți sincroniza calendarul, folosește următoarea informație:",
    "sync url": "URL:",
    "sync login": "Utilizator:",
    "sync password": "Parolă:",
    "sync help": "Te-ai pierdut? Urmează",
    "sync help link": "ghid pas cu pas",
    "install the sync module": "Instealează modulul de sincronizare din Magazinul Cozy",
    "connect to it and follow": "Conectează-te la el și urmărește instrucțiunile legate de CalDav",
    "some event fail to save": "Un eveniment nu a fost salvat ( a apărut o eroare )",
    "imported events": "Cantitatea de evenimente importate",
    "import finished": "Your import is now finished. Displaying all new events take time. If you want to load them faster, refresh the whole page.",
    "import error": "A server error occured, the import failed.",
    "import error occured for": "Import error occured for following elements:",
    "export your calendar": "Exportă-ți calendarul",
    "please select existing calendar": "Selectează un calendar existent, te rog",
    "January": "Ianuarie",
    "February": "Februarie",
    "March": "Martie",
    "April": "Aprilie",
    "May": "Mai",
    "June": "Iunie",
    "July": "Iulie",
    "August": "August",
    "September": "Septembrie",
    "October": "Octombrie",
    "November": "Noiembrie",
    "December": "Decembrie",
    "Jan": "Ian",
    "Feb": "Feb",
    "Mar": "Mar",
    "Apr": "Apr",
    "Jun": "Iun",
    "Jul": "Iul",
    "Aug": "Aug",
    "Sep": "Sep",
    "Oct": "Oct",
    "Nov": "Noi",
    "Dec": "Dec",
    "calendar exist error": "Un calenda denumit \"Calendar Nou\" deja există",
    "email date format": "MMMM Do YYYY, h:mm a",
    "email date format allday": "MMMM Do YYYY, [all day long]",
    "email invitation title": "Invitation to '%{description}'",
    "email invitation content": "Salut, aș dori să te invit la următorul eveniment:\n\n%{description} %{place}\nîn %{date}\nVei fi acolo?\n\nDa\n%{url}?status=ACCEPTED&key=%{key}\n\nNu\n%{url}?status=DECLINED&key=%{key}",
    "email update title": "Event \"%{description}\" has changed",
    "email update content": "Un eveniment la care ai fost invitat, s-a schimbat:\n%{description} %{place}\nÎn %{date}\n\nParticip in continuare\n%{url}?status=ACCEPTED&key=%{key}\n\nNu mai particip\n%{url}?status=DECLINED&key=%{key}",
    "email delete title": "Acest eveniment a fost anulat: %{description}",
    "email delete content": "Acest eveniment a fost anulat:\n%{description} %{place}\nÎn %{date}",
    "invalid recurring rule": "The recurring rule is invalid"
}
;
});

require.register("models/contact", function(exports, require, module) {
var Contact,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = Contact = (function(superClass) {
  extend(Contact, superClass);

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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ScheduleItem = require('./scheduleitem');

module.exports = Event = (function(superClass) {
  extend(Event, superClass);

  function Event() {
    return Event.__super__.constructor.apply(this, arguments);
  }

  Event.prototype.fcEventType = 'event';

  Event.prototype.startDateField = 'start';

  Event.prototype.endDateField = 'end';

  Event.prototype.urlRoot = 'events';

  Event.prototype.defaults = function() {
    var defaultCalendar, ref, ref1;
    defaultCalendar = ((ref = window.app.calendars) != null ? (ref1 = ref.at(0)) != null ? ref1.get('name') : void 0 : void 0) || t('default calendar name');
    return {
      details: '',
      description: '',
      place: '',
      tags: [defaultCalendar]
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = RealEvent = (function(superClass) {
  extend(RealEvent, superClass);

  function RealEvent(options) {
    RealEvent.__super__.constructor.apply(this, arguments);
    this.event = options.event;
    this.start = options.start;
    this.end = options.start;
    this.counter = options.counter;
    if (this.event.isRecurrent()) {
      this.set('id', this.event.get('id') + this.start.toISOString());
    } else if (this.event.isMultipleDays()) {
      this.set('id', (this.event.get('id')) + " " + this.start);
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
    var ref;
    return (ref = this.start) != null ? ref.format('YYYYMMDD') : void 0;
  };

  RealEvent.prototype.isAllDay = function() {
    return this.event.isAllDay() || this.event.isMultipleDays();
  };

  RealEvent.prototype.getFormattedStartDate = function(format) {
    var ref;
    return (ref = this.start) != null ? ref.format(format) : void 0;
  };

  RealEvent.prototype.getFormattedEndDate = function(format) {
    var ref;
    return (ref = this.end) != null ? ref.format(format) : void 0;
  };

  return RealEvent;

})(Backbone.Model);
});

;require.register("models/scheduleitem", function(exports, require, module) {
var H, Helpers, Modal, ScheduleItem,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Modal = require('../lib/modal');

H = Helpers = require('../helpers');

module.exports = ScheduleItem = (function(superClass) {
  extend(ScheduleItem, superClass);

  function ScheduleItem() {
    return ScheduleItem.__super__.constructor.apply(this, arguments);
  }

  ScheduleItem.prototype.fcEventType = 'unknown';

  ScheduleItem.prototype.startDateField = '';

  ScheduleItem.prototype.endDateField = false;

  ScheduleItem.prototype.initialize = function() {
    var defaultCalendarName, ref;
    defaultCalendarName = t('default calendar name');
    if (!((ref = this.get('tags')) != null ? ref.length : void 0)) {
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
    var ref;
    return app.tags.getByName((ref = this.get('tags')) != null ? ref[0] : void 0);
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
    var ref;
    return (ref = this.getCalendar()) != null ? ref.get('visible') : void 0;
  };

  ScheduleItem.prototype.isAllDay = function() {
    var ref;
    return ((ref = this.get(this.startDateField)) != null ? ref.length : void 0) === 10;
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

  ScheduleItem.prototype._formatMoment = function(momentDate) {
    var formattedDate;
    if (this.isAllDay()) {
      formattedDate = Helpers.momentToDateString(momentDate);
    } else if (this.isRecurrent()) {
      formattedDate = Helpers.momentToAmbiguousString(momentDate);
    } else {
      formattedDate = momentDate.toISOString();
    }
    return formattedDate;
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
    var date, difference, endDate, fakeEvent, fakeEvents, i, j, ref, startDate;
    if (!this.isMultipleDays()) {
      return [this];
    } else {
      startDate = this.getStartDateObject();
      endDate = this.getEndDateObject();
      difference = endDate.diff(startDate, 'days');
      if (this.isAllDay()) {
        difference--;
      }
      fakeEvents = [];
      for (i = j = 0, ref = difference; j <= ref; i = j += 1) {
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
    if (this.isAllDay()) {
      displayedTime = "";
    } else if (this.isRecurrent()) {
      displayedTime = moment(start).utc().format('H:mm');
    } else {
      displayedTime = start.format('H:mm');
    }
    description = this.get('description');
    description = description || t('no description');
    return fcEvent = {
      id: this.cid,
      title: displayedTime + " " + description,
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
      options.url = (model.url()) + "?sendMails=" + sendMails;
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
      var ref;
      if (method === 'create') {
        return true;
      } else if (method === 'delete') {
        return (ref = guest.status) === 'ACCEPTED' || ref === 'NEEDS-ACTION';
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
      content = (t('send mails question')) + " " + guestsList;
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = Tag = (function(superClass) {
  extend(Tag, superClass);

  function Tag() {
    return Tag.__super__.constructor.apply(this, arguments);
  }

  Tag.prototype.urlRoot = 'tags';

  Tag.prototype.defaults = {
    visible: true
  };

  Tag.prototype.toString = function() {
    return this.get('name');
  };

  return Tag;

})(Backbone.Model);
});

;require.register("router", function(exports, require, module) {
var CalendarView, DayBucketCollection, ImportView, ListView, Router, SettingsModal, app,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

app = require('application');

ListView = require('views/list_view');

CalendarView = require('views/calendar_view');

SettingsModal = require('views/settings_modal');

ImportView = require('views/import_view');

DayBucketCollection = require('collections/daybuckets');

module.exports = Router = (function(superClass) {
  var getBeginningOfWeek;

  extend(Router, superClass);

  function Router() {
    this.displayView = bind(this.displayView, this);
    this.displayCalendar = bind(this.displayCalendar, this);
    this.backToCalendar = bind(this.backToCalendar, this);
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
    var hash, ref;
    if (year != null) {
      ref = getBeginningOfWeek(year, month, day), year = ref[0], month = ref[1], day = ref[2];
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
    var day, ref;
    ref = getBeginningOfWeek(year, month, day), year = ref[0], month = ref[1], day = ref[2];
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
    return console.log('This feature has been temporarily disabled. Let us ' + 'know if you miss it!');
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
    var monday, ref;
    ref = [year, month, day].map(function(x) {
      return parseInt(x);
    }), year = ref[0], month = ref[1], day = ref[2];
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('../lib/base_view');

module.exports = CalendarHeader = (function(superClass) {
  extend(CalendarHeader, superClass);

  function CalendarHeader() {
    return CalendarHeader.__super__.constructor.apply(this, arguments);
  }

  CalendarHeader.prototype.tagName = 'div';

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
    var from, range, res, to, view;
    if (!this.cal) {
      return t('List');
    }
    view = this.cal.fullCalendar('getView');
    if (view.name === 'month') {
      res = view.intervalStart.format('MMMM YYYY');
    } else {
      from = view.start;
      to = view.end.subtract(1, 'days');
      range = $.fullCalendar.formatRange(from, to, 'MMM D YYYY');
      res = range;
    }
    return res;
  };

  CalendarHeader.prototype.getDates = function() {
    var view;
    view = this.cal.fullCalendar('getView');
    return [view.start, view.end];
  };

  CalendarHeader.prototype.isToday = function() {
    var end, ref, ref1, start;
    ref = this.getDates(), start = ref[0], end = ref[1];
    return (start < (ref1 = moment()) && ref1 < end);
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
var Event, EventPopOver, PopoverView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PopoverView = require('lib/popover_view');

Event = require('models/event');

module.exports = EventPopOver = (function(superClass) {
  extend(EventPopOver, superClass);

  function EventPopOver() {
    return EventPopOver.__super__.constructor.apply(this, arguments);
  }

  EventPopOver.prototype.screens = {
    main: require('views/popover_screens/main'),
    guests: require('views/popover_screens/guests'),
    details: require('views/popover_screens/details'),
    alert: require('views/popover_screens/alert'),
    repeat: require('views/popover_screens/repeat'),
    "delete": require('views/popover_screens/delete')
  };

  EventPopOver.prototype.mainScreen = 'main';

  EventPopOver.prototype.events = {
    'keyup': 'onKeyUp',
    'click .close': 'selfclose',
    'click div.popover-back': function() {
      return this.switchToScreen(this.mainScreen);
    }
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
    return EventPopOver.__super__.initialize.call(this, options);
  };

  EventPopOver.prototype.onKeyUp = function(event) {
    if (event.keyCode === 27) {
      return this.selfclose();
    }
  };

  EventPopOver.prototype.selfclose = function(checkoutChanges) {
    if (checkoutChanges == null) {
      checkoutChanges = true;
    }
    if (this.model.isNew()) {
      EventPopOver.__super__.selfclose.call(this);
    } else {
      if (checkoutChanges) {
        this.model.fetch({
          complete: (function(_this) {
            return function() {
              return EventPopOver.__super__.selfclose.call(_this, checkoutChanges);
            };
          })(this)
        });
      } else {
        EventPopOver.__super__.selfclose.call(this, checkoutChanges);
      }
    }
    return window.popoverExtended = false;
  };

  EventPopOver.prototype.close = function(checkoutChanges) {
    if (checkoutChanges == null) {
      checkoutChanges = true;
    }
    if (this.model.isNew()) {
      EventPopOver.__super__.close.call(this);
    } else {
      if (checkoutChanges) {
        this.model.fetch({
          complete: EventPopOver.__super__.close.apply(this, arguments)
        });
      } else {
        EventPopOver.__super__.close.call(this);
      }
    }
    return window.popoverExtended = false;
  };

  return EventPopOver;

})(PopoverView);
});

;require.register("views/calendar_view", function(exports, require, module) {
var BaseView, CalendarView, Event, EventPopover, Header, app, helpers, timezones,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

app = require('application');

BaseView = require('lib/base_view');

EventPopover = require('./calendar_popover_event');

Header = require('./calendar_header');

helpers = require('helpers');

timezones = require('helpers/timezone').timezones;

Event = require('models/event');

module.exports = CalendarView = (function(superClass) {
  extend(CalendarView, superClass);

  function CalendarView() {
    this.onEventClick = bind(this.onEventClick, this);
    this.onEventResize = bind(this.onEventResize, this);
    this.onEventDrop = bind(this.onEventDrop, this);
    this.onSelect = bind(this.onSelect, this);
    this.getUrlHash = bind(this.getUrlHash, this);
    this.onChangeView = bind(this.onChangeView, this);
    this.refreshOne = bind(this.refreshOne, this);
    this.handleWindowResize = bind(this.handleWindowResize, this);
    return CalendarView.__super__.constructor.apply(this, arguments);
  }

  CalendarView.prototype.id = 'view-container';

  CalendarView.prototype.template = require('./templates/calendarview');

  CalendarView.prototype.initialize = function(options1) {
    this.options = options1;
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
    var currDate, debounced, locale, source;
    locale = moment.localeData();
    this.cal = this.$('#alarms');
    this.view = this.options.view;
    currDate = moment();
    if (this.options.year != null) {
      currDate.year(this.options.year);
    }
    if (this.options.month != null) {
      currDate.month(this.options.month);
    }
    if ((this.options.date != null) && this.view !== 'month') {
      currDate.date(this.options.date);
    }
    this.cal.fullCalendar({
      lang: window.locale,
      header: false,
      firstDay: 1,
      height: "auto",
      defaultView: this.view,
      defaultDate: currDate,
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
      handleWindowResize: false,
      weekNumbers: true
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
    var ref;
    if ((ref = this.popover) != null) {
      ref.close();
    }
    return CalendarView.__super__.remove.apply(this, arguments);
  };

  CalendarView.prototype.handleWindowResize = function(initial) {
    var targetHeight;
    if ($(window).width() > 1000) {
      targetHeight = $(window).height() - 85;
    } else if ($(window).width() > 600) {
      targetHeight = $(window).height() - 100;
    } else {
      targetHeight = $(window).height() - 50;
    }
    return this.cal.fullCalendar('option', 'height', targetHeight);
  };

  CalendarView.prototype.refresh = function(collection) {
    return this.cal.fullCalendar('refetchEvents');
  };

  CalendarView.prototype.onRemove = function(model) {
    return this.cal.fullCalendar('removeEvents', model.cid);
  };

  CalendarView.prototype.refreshOne = function(model) {
    var data, fcEvent, modelWasRecurrent, previousRRule;
    previousRRule = model.previous('rrule');
    modelWasRecurrent = (previousRRule != null) && previousRRule !== '';
    if (model.isRecurrent() || modelWasRecurrent) {
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
    var ref, ref1;
    options.container = this.cal;
    options.parentView = this;
    if (this.popover) {
      this.popover.close();
      if ((this.popover.options != null) && ((this.popover.options.model != null) && this.popover.options.model === options.model || (((ref = this.popover.options.start) != null ? ref.isSame(options.start) : void 0) && ((ref1 = this.popover.options.end) != null ? ref1.isSame(options.end) : void 0) && this.popover.options.type === options.type))) {
        this.cal.fullCalendar('unselect');
        this.popover = null;
        return;
      }
    }
    this.popover = new EventPopover(options);
    return this.popover.render();
  };

  CalendarView.prototype.closePopover = function() {
    var ref;
    if ((ref = this.popover) != null) {
      ref.close();
    }
    return this.onPopoverClose();
  };

  CalendarView.prototype.onChangeView = function(view) {
    var f, hash, ref;
    this.closePopover();
    if ((ref = this.calHeader) != null) {
      ref.render();
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
    } else if (this.view === 'agendaWeek') {
      endDate = startDate.clone().add(1, 'hour');
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
    var $displayedElement, ref, spinTarget, time, title, titleAndTime;
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
      ref = titleAndTime.split(' '), time = ref[0], title = 2 <= ref.length ? slice.call(ref, 1) : [];
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

;require.register("views/import_event_list", function(exports, require, module) {
var EventCollection, EventList, EventView, ViewCollection,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ViewCollection = require('../lib/view_collection');

EventView = require('./import_event_view');

EventCollection = require('../collections/events');

module.exports = EventList = (function(superClass) {
  extend(EventList, superClass);

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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('../lib/base_view');

module.exports = EventView = (function(superClass) {
  extend(EventView, superClass);

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
var BaseView, ComboBox, Event, EventList, ImportView, helpers, request,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('../lib/base_view');

ComboBox = require('views/widgets/combobox');

helpers = require('../helpers');

request = require('../lib/request');

Event = require('../models/event');

EventList = require('./import_event_list');

module.exports = ImportView = (function(superClass) {
  extend(ImportView, superClass);

  function ImportView() {
    this.importEvents = bind(this.importEvents, this);
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
          var ref;
          if (result != null ? (ref = result.calendar) != null ? ref.name : void 0 : void 0) {
            _this.calendarCombo.setValue(result.calendar.name);
          }
          if ((result != null ? result.events : void 0) != null) {
            return _this.showEventsPreview(result.events);
          }
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

  ImportView.prototype.showEventsPreview = function(events) {
    this.eventLists = helpers.getLists(events, 100);
    return async.eachSeries(this.eventLists, (function(_this) {
      return function(eventList, done) {
        _this.eventList.collection.add(eventList, {
          sort: false
        });
        return setTimeout(done, 500);
      };
    })(this), (function(_this) {
      return function() {
        _this.eventList.collection.sort();
        _this.$(".import-form").fadeOut(function() {
          var buttonText;
          _this.resetUploader();
          _this.importButton.spin();
          buttonText = t('select an icalendar file');
          _this.importButton.find('span').html(buttonText);
          return _this.$(".confirmation").fadeIn();
        });
        return _this.$(".results").slideDown();
      };
    })(this));
  };

  ImportView.prototype.onConfirmImportClicked = function() {
    this.targetCalendar = this.calendarCombo.value();
    if ((this.targetCalendar == null) || this.targetCalendar === '') {
      this.targetCalendar = t('default calendar name');
    }
    this.calendarCombo.save();
    this.initCounter();
    this.confirmButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    this.confirmButton.spin('tiny');
    return async.eachSeries(this.eventLists, this.importEvents, (function(_this) {
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
    })(this));
  };

  ImportView.prototype.importEvents = function(events, callback) {
    var event, i, len;
    for (i = 0, len = events.length; i < len; i++) {
      event = events[i];
      event.tags = [this.targetCalendar];
      event.id = null;
      event["import"] = true;
    }
    return request.post("events/bulk", events, (function(_this) {
      return function(err, result) {
        var j, len1, msg, ref;
        if (err) {
          if (result != null) {
            msg = result.msg;
          }
          if (msg == null) {
            msg = t('import error');
          }
          alert(msg);
        } else {
          ref = result.errors;
          for (j = 0, len1 = ref.length; j < len1; j++) {
            event = ref[j];
            _this.addImportError(event, './templates/import_event');
          }
        }
        _this.updateCounter(events.length);
        return setTimeout(callback, 200);
      };
    })(this));
  };

  ImportView.prototype.addImportError = function(event, templatePath) {
    if ($('.import-errors').html().length === 0) {
      $('.import-errors').html("<p>" + (t('import error occured for')) + "</p>");
    }
    return $('.import-errors').append(require(templatePath)(event));
  };

  ImportView.prototype.initCounter = function() {
    var total;
    total = this.eventList.collection.length;
    this.counter = 0;
    return $('.import-progress').html("<p>" + (t('imported events')) + ":\n    <span class=\"import-counter\">0</span>/" + total + "</p>");
  };

  ImportView.prototype.updateCounter = function(increment) {
    this.counter += increment;
    return $('.import-counter').html(this.counter);
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
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ViewCollection = require('../lib/view_collection');

Header = require('views/calendar_header');

helpers = require('../helpers');

defaultTimezone = 'timezone';

module.exports = ListView = (function(superClass) {
  extend(ListView, superClass);

  function ListView() {
    this.checkScroll = bind(this.checkScroll, this);
    this.keepScreenFull = bind(this.keepScreenFull, this);
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
          var dCurrent, dPrev;
          dCurrent = view.model.get('date').diff(current.model.date);
          if (dCurrent < 0) {
            return previous;
          } else if (previous != null) {
            dPrev = view.model.get('date').diff(previous.model.date);
            if (dCurrent < dPrev) {
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ViewCollection = require('../lib/view_collection');

PopoverEvent = require('./calendar_popover_event');

module.exports = BucketView = (function(superClass) {
  extend(BucketView, superClass);

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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('lib/base_view');

PopoverEvent = require('./calendar_popover_event');

Event = require('models/event');

module.exports = EventItemView = (function(superClass) {
  extend(EventItemView, superClass);

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
    return this.model.event.destroy({
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ViewCollection = require('../lib/view_collection');

ComboBox = require('views/widgets/combobox');

Event = require('models/event');

Tag = require('models/tag');

module.exports = MenuView = (function(superClass) {
  extend(MenuView, superClass);

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
    var checkCalendar, exists, localName, n, name;
    n = 0;
    name = "new calendar";
    checkCalendar = function() {
      var calendar;
      this.tag = app.tags.getOrCreateByName(name);
      console.log(this.tag);
      calendar = app.calendars.find(function(tag) {
        var localName;
        localName = t(name);
        if (n > 0) {
          localName = localName + " " + n;
        }
        return (tag.get('name') === localName) && tag.get('visible');
      });
      return calendar != null;
    };
    exists = checkCalendar();
    while (exists) {
      n++;
      exists = checkCalendar();
    }
    localName = t(name);
    if (n > 0) {
      localName = localName + " " + n;
    }
    return this.createNewCalendar(localName);
  };

  MenuView.prototype.createNewCalendar = function(name) {
    var calendarEvent;
    this.showLoading();
    calendarEvent = new Event({
      start: moment("19010101", "YYYYMMDD"),
      end: moment("19010101", "YYYYMMDD"),
      description: '',
      place: '',
      tags: [name]
    });
    return calendarEvent.save(null, {
      wait: true,
      success: function() {
        var wait;
        return wait = setInterval(function() {
          var newCalSel, rename;
          newCalSel = "#menuitems li.tagmenuitem[data-name='" + name + "']";
          rename = $(newCalSel + " .calendar-rename");
          if (rename.length > 0) {
            clearInterval(wait);
            return rename.trigger("click");
          }
        }, 100);
      },
      complete: (function(_this) {
        return function() {
          return setTimeout(_this.hideLoading.bind(_this), 100);
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
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('../lib/base_view');

colorSet = require('../helpers/color-set');

module.exports = MenuItemView = (function(superClass) {
  extend(MenuItemView, superClass);

  function MenuItemView() {
    this.hideColorPicker = bind(this.hideColorPicker, this);
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
    this.el.dataset.name = this.model.get('name');
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

  MenuItemView.prototype.showColorPicker = function(event) {
    if (event != null) {
      event.stopPropagation();
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
    color = this.rgbToHex(color);
    this.model.set('color', color);
    this.buildBadge(color);
    this.model.save();
    this.$('.dropdown-toggle').dropdown('toggle');
    this.hideColorPicker();
    return this.$('.dropdown-toggle').on('click', this.hideColorPicker);
  };

  MenuItemView.prototype.rgbToHex = function(color) {
    var bg, hex;
    bg = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    hex = function(x) {
      return ("0" + (parseInt(x).toString(16))).slice(-2);
    };
    return "#" + (hex(bg[1])) + (hex(bg[2])) + (hex(bg[3]));
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
    this.$('.spinner').show();
    return this.$('.caret').addClass('hidden');
  };

  MenuItemView.prototype.hideLoading = function() {
    this.$('.spinner').hide();
    return this.$('.caret').removeClass('hidden');
  };

  return MenuItemView;

})(BaseView);
});

;require.register("views/popover_screens/alert", function(exports, require, module) {
var AlertPopoverScreen, PopoverScreenView, helpers,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PopoverScreenView = require('lib/popover_screen_view');

helpers = require('helpers');

module.exports = AlertPopoverScreen = (function(superClass) {
  extend(AlertPopoverScreen, superClass);

  function AlertPopoverScreen() {
    return AlertPopoverScreen.__super__.constructor.apply(this, arguments);
  }

  AlertPopoverScreen.ALERT_OPTIONS = [
    {
      M: 0
    }, {
      M: 15
    }, {
      M: 30
    }, {
      H: 1
    }, {
      H: 2
    }, {
      H: 6
    }, {
      H: 12
    }, {
      D: 1
    }, {
      D: 2
    }, {
      D: 3
    }, {
      D: 5
    }, {
      W: 1
    }
  ];

  AlertPopoverScreen.prototype.screenTitle = t('screen alert title empty');

  AlertPopoverScreen.prototype.templateContent = require('views/templates/popover_screens/alert');

  AlertPopoverScreen.prototype.templateAlertRow = require('views/templates/popover_screens/alert_row');

  AlertPopoverScreen.prototype.events = {
    'change .new-alert': 'onNewAlert',
    'click .alerts li .alert-delete': 'onRemoveAlert',
    'click input[type="checkbox"]': 'onChangeActionAlert'
  };

  AlertPopoverScreen.prototype.getRenderData = function() {
    var alertOptions, alerts, formattedAlertOptions, numAlerts;
    alerts = this.model.get('alarms') || [];
    numAlerts = alerts.length;
    if (numAlerts > 0) {
      this.screenTitle = t('screen alert title', {
        smart_count: numAlerts
      });
    } else {
      this.screenTitle = t('screen alert title empty');
    }
    alertOptions = AlertPopoverScreen.ALERT_OPTIONS;
    formattedAlertOptions = alertOptions.map((function(_this) {
      return function(alert, index) {
        var translationInfo;
        translationInfo = _this.getAlertTranslationInfo(alert);
        return _.extend({}, translationInfo, {
          index: index
        });
      };
    })(this));
    return _.extend(AlertPopoverScreen.__super__.getRenderData.call(this), {
      alertOptions: formattedAlertOptions,
      alerts: this.model.get('alarms')
    });
  };

  AlertPopoverScreen.prototype.afterRender = function() {
    var $alerts, alarm, alarms, i, index, len, options, ref, ref1, ref2, results, row, translationKey, trigger, value;
    $alerts = this.$('.alerts');
    $alerts.empty();
    alarms = this.model.get('alarms') || [];
    results = [];
    for (index = i = 0, len = alarms.length; i < len; index = ++i) {
      alarm = alarms[index];
      trigger = helpers.iCalDurationToUnitValue(alarm.trigg);
      ref = this.getAlertTranslationInfo(trigger), translationKey = ref.translationKey, value = ref.value;
      options = {
        index: index,
        label: t(translationKey, {
          smart_count: value
        }),
        action: alarm.action,
        isEmailChecked: (ref1 = alarm.action) === 'EMAIL' || ref1 === 'BOTH',
        isNotifChecked: (ref2 = alarm.action) === 'DISPLAY' || ref2 === 'BOTH'
      };
      row = this.templateAlertRow(options);
      results.push($alerts.append(row));
    }
    return results;
  };

  AlertPopoverScreen.prototype.onRemoveAlert = function(event) {
    var alerts, index;
    index = this.$(event.target).parents('li').attr('data-index');
    alerts = this.model.get('alarms') || [];
    alerts.splice(index, 1);
    this.model.set('alarms', alerts);
    return this.render();
  };

  AlertPopoverScreen.prototype.onChangeActionAlert = function(event) {
    var action, alerts, checkbox, currentAction, index, isEmailAction, newAction, otherAction;
    checkbox = this.$(event.target);
    isEmailAction = checkbox.hasClass('action-email');
    action = isEmailAction ? 'EMAIL' : 'DISPLAY';
    otherAction = action === 'EMAIL' ? 'DISPLAY' : 'EMAIL';
    index = checkbox.parents('li').attr('data-index');
    alerts = this.model.get('alarms');
    currentAction = alerts[index].action;
    if (currentAction === 'BOTH') {
      newAction = otherAction;
    } else if (currentAction === otherAction) {
      newAction = 'BOTH';
    } else {
      event.preventDefault();
    }
    if (newAction != null) {
      alerts[index].action = newAction;
      return this.model.set('alarms', alerts);
    }
  };

  AlertPopoverScreen.prototype.onNewAlert = function() {
    var alarms, alertOption, index, triggerValue;
    index = parseInt(this.$('select.new-alert').val());
    if (index !== -1) {
      alertOption = AlertPopoverScreen.ALERT_OPTIONS[index];
      triggerValue = helpers.unitValuesToiCalDuration(alertOption);
      alarms = this.model.get('alarms') || [];
      alarms.push({
        action: 'DISPLAY',
        trigg: triggerValue
      });
      this.model.set('alarms', alarms);
      this.$('select.new-alert').val(-1);
      return this.render();
    }
  };

  AlertPopoverScreen.prototype.getAlertTranslationInfo = function(alert) {
    var translationKey, unit, value;
    unit = Object.keys(alert)[0];
    translationKey = (function() {
      switch (unit) {
        case 'M':
          return 'screen alert minute';
        case 'H':
          return 'screen alert hour';
        case 'D':
          return 'screen alert day';
        case 'W':
          return 'screen alert week';
      }
    })();
    value = parseInt(alert[unit]);
    if (unit === 'M' && value === 0) {
      translationKey = 'screen alert time of event';
    }
    return {
      translationKey: translationKey,
      value: value
    };
  };

  return AlertPopoverScreen;

})(PopoverScreenView);
});

;require.register("views/popover_screens/delete", function(exports, require, module) {
var DeletePopoverScreen, PopoverScreenView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PopoverScreenView = require('lib/popover_screen_view');

module.exports = DeletePopoverScreen = (function(superClass) {
  extend(DeletePopoverScreen, superClass);

  function DeletePopoverScreen() {
    return DeletePopoverScreen.__super__.constructor.apply(this, arguments);
  }

  DeletePopoverScreen.prototype.screenTitle = t('screen delete title');

  DeletePopoverScreen.prototype.templateTitle = require('views/templates/popover_screens/delete_title');

  DeletePopoverScreen.prototype.templateContent = require('views/templates/popover_screens/delete');

  DeletePopoverScreen.prototype.events = {
    'click .answer-yes': 'onDelete',
    'click .answer-no': function() {
      return this.switchToScreen('main');
    }
  };

  DeletePopoverScreen.prototype.afterRender = function() {
    this.$spinner = this.$('.remove-spinner');
    this.$removeChoices = this.$('.remove-choices');
    this.$errors = this.$('.errors');
    this.$spinner.hide();
    return this.$errors.hide();
  };

  DeletePopoverScreen.prototype.onDelete = function() {
    this.$errors.hide();
    this.$spinner.show();
    this.$removeChoices.hide();
    return this.model.destroy({
      wait: true,
      error: (function(_this) {
        return function() {
          _this.$removeChoices.show();
          _this.$errors.html(t('server error occured'));
          return _this.$errors.show();
        };
      })(this),
      success: (function(_this) {
        return function() {
          _this.$spinner.hide();
          return _this.popover.selfclose(false);
        };
      })(this)
    });
  };

  return DeletePopoverScreen;

})(PopoverScreenView);
});

;require.register("views/popover_screens/details", function(exports, require, module) {
var DetailsPopoverScreen, PopoverScreenView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PopoverScreenView = require('lib/popover_screen_view');

module.exports = DetailsPopoverScreen = (function(superClass) {
  extend(DetailsPopoverScreen, superClass);

  function DetailsPopoverScreen() {
    return DetailsPopoverScreen.__super__.constructor.apply(this, arguments);
  }

  DetailsPopoverScreen.prototype.screenTitle = t('screen description title');

  DetailsPopoverScreen.prototype.templateContent = require('views/templates/popover_screens/details');

  DetailsPopoverScreen.prototype.afterRender = function() {
    return this.$('.input-details').focus();
  };

  DetailsPopoverScreen.prototype.onLeaveScreen = function() {
    var value;
    value = this.$('.input-details').val();
    return this.model.set('details', value);
  };

  return DetailsPopoverScreen;

})(PopoverScreenView);
});

;require.register("views/popover_screens/guests", function(exports, require, module) {
var GuestPopoverScreen, PopoverScreenView, random,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PopoverScreenView = require('lib/popover_screen_view');

random = require('lib/random');

module.exports = GuestPopoverScreen = (function(superClass) {
  extend(GuestPopoverScreen, superClass);

  function GuestPopoverScreen() {
    return GuestPopoverScreen.__super__.constructor.apply(this, arguments);
  }

  GuestPopoverScreen.prototype.screenTitle = '';

  GuestPopoverScreen.prototype.templateContent = require('views/templates/popover_screens/guests');

  GuestPopoverScreen.prototype.templateGuestRow = require('views/templates/popover_screens/guest_row');

  GuestPopoverScreen.prototype.events = {
    "click .add-new-guest": "onNewGuest",
    "click .guest-delete": "onRemoveGuest",
    'keyup input[name="guest-name"]': "onKeyup"
  };

  GuestPopoverScreen.prototype.getRenderData = function() {
    var guests, numGuests;
    guests = this.model.get('attendees') || [];
    numGuests = guests.length;
    if (numGuests > 0) {
      this.screenTitle = t('screen guest title', {
        smart_count: numGuests
      });
    } else {
      this.screenTitle = t('screen guest title empty');
    }
    return _.extend(GuestPopoverScreen.__super__.getRenderData.call(this), {
      guests: this.model.get('attendes') || []
    });
  };

  GuestPopoverScreen.prototype.afterRender = function() {
    var $guests, guest, guests, i, index, len, options, row;
    $guests = this.$('.guests');
    $guests.empty();
    guests = this.model.get('attendees') || [];
    for (index = i = 0, len = guests.length; i < len; index = ++i) {
      guest = guests[index];
      options = _.extend(guest, {
        index: index
      });
      row = this.templateGuestRow(guest);
      $guests.append(row);
    }
    this.configureGuestTypeahead();
    return this.$('input[name="guest-name"]').focus();
  };

  GuestPopoverScreen.prototype.configureGuestTypeahead = function() {
    return this.$('input[name="guest-name"]').typeahead({
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
        var img, imgPath, old;
        old = $.fn.typeahead.Constructor.prototype.highlighter;
        imgPath = contact.hasPicture ? "contacts/" + contact.id + ".jpg" : "img/defaultpicture.png";
        img = '<img width="40px" src="' + imgPath + '" />&nbsp;';
        return img + old.call(this, contact.display);
      },
      updater: this.onNewGuest.bind(this)
    });
  };

  GuestPopoverScreen.prototype.onRemoveGuest = function(event) {
    var guests, index;
    index = this.$(event.target).parents('li').attr('data-index');
    guests = this.model.get('attendees') || [];
    guests.splice(index, 1);
    this.model.set('attendees', guests);
    return this.render();
  };

  GuestPopoverScreen.prototype.onNewGuest = function(userInfo) {
    var contactID, email, guests, ref;
    if (userInfo == null) {
      userInfo = null;
    }
    if ((userInfo != null) && typeof userInfo === "string") {
      ref = userInfo.split(';'), email = ref[0], contactID = ref[1];
    } else {
      email = this.$('input[name="guest-name"]').val();
      contactID = null;
    }
    email = email.trim();
    if (email.length > 0) {
      guests = this.model.get('attendees') || [];
      if (!_.findWhere(guests, {
        email: email
      })) {
        guests = _.clone(guests);
        guests.push({
          key: random.randomString(),
          status: 'INVITATION-NOT-SENT',
          email: email,
          contactid: contactID
        });
        this.model.set('attendees', guests);
        this.render();
      }
    }
    this.$('input[name="guest-name"]').val('');
    return this.$('input[name="guest-name"]').focus();
  };

  GuestPopoverScreen.prototype.onKeyup = function(event) {
    var key;
    key = event.keyCode;
    if (key === 13) {
      return this.onNewGuest();
    }
  };

  return GuestPopoverScreen;

})(PopoverScreenView);
});

;require.register("views/popover_screens/main", function(exports, require, module) {
var ComboBox, Event, MainPopoverScreen, PopoverScreenView, allDayDateFieldFormat, dFormat, defDatePickerOps, defTimePickerOpts, inputDateDTPickerFormat, tFormat,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PopoverScreenView = require('lib/popover_screen_view');

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

module.exports = MainPopoverScreen = (function(superClass) {
  extend(MainPopoverScreen, superClass);

  function MainPopoverScreen() {
    this.onTab = bind(this.onTab, this);
    return MainPopoverScreen.__super__.constructor.apply(this, arguments);
  }

  MainPopoverScreen.prototype.templateTitle = require('views/templates/popover_screens/main_title');

  MainPopoverScreen.prototype.templateContent = require('views/templates/popover_screens/main');

  MainPopoverScreen.prototype.attributes = {
    tabindex: "0"
  };

  MainPopoverScreen.prototype.events = {
    'keyup': 'onKeyUp',
    'change select': 'onKeyUp',
    'change input': 'onKeyUp',
    'click .cancel': 'onCancelClicked',
    'click .add': 'onAddClicked',
    'click .advanced-link': 'onAdvancedClicked',
    'click .remove': function() {
      return this.switchToScreen('delete');
    },
    'click .duplicate': 'onDuplicateClicked',
    'changeTime.timepicker .input-start': 'onSetStart',
    'changeTime.timepicker .input-end-time': 'onSetEnd',
    'changeDate .input-start-date': 'onSetStart',
    'changeDate .input-end-date': 'onSetEnd',
    'click .input-allday': 'toggleAllDay',
    'input .input-desc': 'onSetDesc',
    'input .input-place': 'onSetPlace',
    'keydown [data-tabindex-next]': 'onTab',
    'keydown [data-tabindex-prev]': 'onTab',
    'click .input-people': function() {
      return this.switchToScreen('guests');
    },
    'click .input-details-trigger': function() {
      return this.switchToScreen('details');
    },
    'click .input-alert': function() {
      return this.switchToScreen('alert');
    },
    'click .input-repeat': function() {
      return this.switchToScreen('repeat');
    }
  };

  MainPopoverScreen.prototype.initialize = function() {
    this.listenTo(this.model, "change:start", this.onStartChange);
    return this.listenTo(this.model, "change:end", this.onEndChange);
  };

  MainPopoverScreen.prototype.onLeaveScreen = function() {
    return this.stopListening(this.model);
  };

  MainPopoverScreen.prototype.getRenderData = function() {
    var currentCalendar, data, defaultCalendar, endOffset, firstCalendar, ref, ref1, ref2;
    firstCalendar = (ref = app.calendars) != null ? (ref1 = ref.at(0)) != null ? ref1.get('name') : void 0 : void 0;
    defaultCalendar = t('default calendar name');
    if (this.model.isNew()) {
      currentCalendar = firstCalendar || defaultCalendar;
    } else {
      currentCalendar = ((ref2 = this.model.get('tags')) != null ? ref2[0] : void 0) || defaultCalendar;
    }
    endOffset = this.model.isAllDay() ? -1 : 0;
    return data = _.extend(MainPopoverScreen.__super__.getRenderData.call(this), {
      tFormat: tFormat,
      dFormat: dFormat,
      calendar: currentCalendar,
      allDay: this.model.isAllDay(),
      sameDay: this.model.isSameDay(),
      start: this.model.getStartDateObject(),
      end: this.model.getEndDateObject().add(endOffset, 'd'),
      alerts: this.model.get('alarms'),
      guestsButtonText: this.getGuestsButtonText(),
      buttonText: this.getButtonText(),
      recurrenceButtonText: this.getRecurrenceButtonText()
    });
  };

  MainPopoverScreen.prototype.afterRender = function() {
    var ref, timepickerEvents;
    this.$el.attr('tabindex', 0);
    this.$container = this.$('.popover-content-wrapper');
    this.$addButton = this.$('.btn.add');
    this.removeButton = this.$('.remove');
    this.spinner = this.$('.remove-spinner');
    this.duplicateButton = this.$('.duplicate');
    this.$optionalFields = this.$('[data-optional="true"]');
    this.$moreDetailsButton = this.$('.advanced-link');
    if (this.model.isNew()) {
      this.removeButton.hide();
      this.duplicateButton.hide();
    }
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
    this.$('input[type="time"]').attr('type', 'text').timepicker(defTimePickerOpts).delegate(timepickerEvents);
    this.$('.input-date').datetimepicker(defDatePickerOps);
    this.calendar = new ComboBox({
      el: this.$('.calendarcombo'),
      small: true,
      source: app.calendars.toAutoCompleteSource(),
      current: (ref = this.model.getCalendar()) != null ? ref.get('name') : void 0
    });
    this.calendar.on('edition-complete', (function(_this) {
      return function(value) {
        return _this.model.setCalendar(value);
      };
    })(this));
    if (window.popoverExtended) {
      this.expandPopover();
    }
    if (this.$("[aria-hidden=true]").length === 0) {
      this.$moreDetailsButton.hide();
    }
    return setTimeout((function(_this) {
      return function() {
        return _this.$('[tabindex="1"]').focus();
      };
    })(this), 1);
  };

  MainPopoverScreen.prototype.onKeyUp = function(event) {
    if (event.keyCode === 13 || event.which === 13) {
      this.calendar.onBlur();
      this.onSetStart();
      this.onSetEnd();
      return this.$addButton.click();
    } else if (event.keyCode === 27 || event.which === 27) {
      return this.popover.selfclose(false);
    } else {
      return this.$addButton.removeClass('disabled');
    }
  };

  MainPopoverScreen.prototype.toggleAllDay = function() {
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
    this.$('.input-time').attr('aria-hidden', this.model.isAllDay());
    return this.$container.toggleClass('is-all-day', this.model.isAllDay());
  };

  MainPopoverScreen.prototype.onSetDesc = function(ev) {
    return this.model.set('description', ev.target.value);
  };

  MainPopoverScreen.prototype.onSetPlace = function(ev) {
    return this.model.set('place', ev.target.value);
  };

  MainPopoverScreen.prototype.onSetStart = function() {
    return this.model.setStart(this.formatDateTime(this.$('.input-start').val(), this.$('.input-start-date').val(), false));
  };

  MainPopoverScreen.prototype.onSetEnd = function() {
    this.model.setEnd(this.formatDateTime(this.$('.input-end-time').val(), this.$('.input-end-date').val()));
    return this.$container.toggleClass('is-same-day', this.model.isSameDay());
  };

  MainPopoverScreen.prototype.formatDateTime = function(timeStr, dateStr, end) {
    var d, date, hour, minute, month, ref, ref1, setObj, splitted, t, year;
    if (timeStr == null) {
      timeStr = '';
    }
    if (dateStr == null) {
      dateStr = '';
    }
    if (end == null) {
      end = true;
    }
    t = timeStr.match(/([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/);
    d = splitted = dateStr.match(/([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})/);
    if (t != null ? t[0] : void 0) {
      ref = t.slice(1, 3), hour = ref[0], minute = ref[1];
    }
    if (d != null ? d[0] : void 0) {
      ref1 = d.slice(1, 4), date = ref1[0], month = ref1[1], year = ref1[2];
    }
    if (end) {
      if (date && this.model.isAllDay()) {
        date = +date + 1;
      }
    }
    if (month) {
      month = +month - 1;
    }
    return setObj = {
      year: year,
      month: month,
      date: date,
      hour: hour,
      minute: minute
    };
  };

  MainPopoverScreen.prototype.onTab = function(ev) {
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

  MainPopoverScreen.prototype.onDuplicateClicked = function() {
    var attrs, calendarEvent, key, ref, value;
    attrs = [];
    ref = this.model.attributes;
    for (key in ref) {
      value = ref[key];
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

  MainPopoverScreen.prototype.onCancelClicked = function() {
    return this.popover.selfclose(false);
  };

  MainPopoverScreen.prototype.onAddClicked = function() {
    var err, errors, i, len, results, spinner;
    if (this.$('.btn.add').hasClass('disabled')) {
      return;
    }
    spinner = '<img src="img/spinner-white.svg" alt="spinner" />';
    this.$addButton.empty();
    this.$addButton.append(spinner);
    errors = this.model.validate(this.model.attributes);
    if (errors) {
      this.$addButton.html(this.getButtonText());
      this.$('.alert').remove();
      this.$('input').css('border-color', '');
      results = [];
      for (i = 0, len = errors.length; i < len; i++) {
        err = errors[i];
        results.push(this.handleError(err));
      }
      return results;
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
            _this.$addButton.html(_this.getButtonText());
            return _this.popover.selfclose(false);
          };
        })(this)
      });
    }
  };

  MainPopoverScreen.prototype.handleError = function(error) {
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

  MainPopoverScreen.prototype.getButtonText = function() {
    if (this.model.isNew()) {
      return t('create button');
    } else {
      return t('save button');
    }
  };

  MainPopoverScreen.prototype.getGuestsButtonText = function() {
    var guests, numOthers, options;
    guests = this.model.get('attendees') || [];
    if (guests.length === 0) {
      return t("add guest button");
    } else if (guests.length === 1) {
      return guests[0].email;
    } else {
      numOthers = guests.length - 1;
      options = {
        first: guests[0].email,
        smart_count: numOthers
      };
      return t("guests list", options);
    }
  };

  MainPopoverScreen.prototype.getRecurrenceButtonText = function() {
    var e, language, locale, rrule;
    rrule = this.model.get('rrule');
    if ((rrule != null ? rrule.length : void 0) > 0) {
      try {
        rrule = RRule.fromString(this.model.get('rrule'));
      } catch (_error) {
        e = _error;
        console.error(e);
        return t('invalid recurring rule');
      }
      locale = moment.localeData();
      language = {
        dayNames: locale._weekdays,
        monthNames: locale._months
      };
      return rrule.toText(window.t, language);
    } else {
      return t('no repeat button');
    }
  };

  MainPopoverScreen.prototype.onAdvancedClicked = function(event) {
    event.preventDefault();
    this.expandPopover();
    return window.popoverExtended = !window.popoverExtended;
  };

  MainPopoverScreen.prototype.expandPopover = function() {
    this.$optionalFields.attr('aria-hidden', false);
    this.$moreDetailsButton.hide();
    return setTimeout((function(_this) {
      return function() {
        return _this.$('.input-details-trigger').focus();
      };
    })(this), 100);
  };

  MainPopoverScreen.prototype.onStartChange = function() {
    var newValue;
    newValue = this.model.getStartDateObject().format(tFormat);
    return this.$('.input-start').timepicker('setTime', newValue);
  };

  MainPopoverScreen.prototype.onEndChange = function() {
    var endOffset, newValue;
    endOffset = this.model.isAllDay() ? -1 : 0;
    newValue = this.model.getEndDateObject().add(endOffset, 'd').format(tFormat);
    return this.$('.input-end-time').timepicker('setTime', newValue);
  };

  return MainPopoverScreen;

})(PopoverScreenView);
});

;require.register("views/popover_screens/repeat", function(exports, require, module) {
var NO_REPEAT, PopoverScreenView, RepeatPopoverScreen, allDayDateFieldFormat, dFormat, inputDateDTPickerFormat, tFormat,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

PopoverScreenView = require('lib/popover_screen_view');

tFormat = 'HH:mm';

dFormat = 'DD/MM/YYYY';

inputDateDTPickerFormat = 'dd/mm/yyyy';

allDayDateFieldFormat = 'YYYY-MM-DD';

NO_REPEAT = -1;

module.exports = RepeatPopoverScreen = (function(superClass) {
  extend(RepeatPopoverScreen, superClass);

  function RepeatPopoverScreen() {
    this.buildRRuleFromDOM = bind(this.buildRRuleFromDOM, this);
    return RepeatPopoverScreen.__super__.constructor.apply(this, arguments);
  }

  RepeatPopoverScreen.prototype.inputDateFormat = 'DD/MM/YYYY';

  RepeatPopoverScreen.prototype.inputDateDTPickerFormat = 'dd/mm/yyyy';

  RepeatPopoverScreen.prototype.screenTitle = t('screen recurrence title');

  RepeatPopoverScreen.prototype.templateContent = require('views/templates/popover_screens/repeat');

  RepeatPopoverScreen.prototype.events = {
    'change select[name="frequency"]': 'onSelectRepeat',
    'keyup select[name="frequency"]': 'onSelectRepeat',
    'input input[name="interval"]': "renderSummary",
    'change input[name="weekly-repeat-type"]': "renderSummary",
    'change input[name="monthly-repeat-type"]': "renderSummary",
    'change input[name="endMode"]': "renderSummary",
    'input input[name="count"]': "renderSummary",
    'changeDate input[name="until-date"]': "renderSummary"
  };

  RepeatPopoverScreen.prototype.getRenderData = function() {
    var data, e, endMode, functions, monthlyRepeatBy, ref, ref1, rrule, rruleOptions;
    data = _.extend(RepeatPopoverScreen.__super__.getRenderData.call(this), {
      NO_REPEAT: NO_REPEAT,
      weekDays: moment.localeData()._weekdays,
      rrule: {
        freq: NO_REPEAT,
        interval: 1,
        endMode: 'never',
        count: 4,
        until: moment().format(this.inputDateFormat),
        weekdays: [],
        monthlyRepeatBy: 'repeat-day'
      }
    });
    if (this.model.has('rrule') && this.model.get('rrule').length > 0) {
      try {
        rruleOptions = RRule.fromString(this.model.get('rrule')).options;
      } catch (_error) {
        e = _error;
        console.error(e);
      }
    }
    if (rruleOptions != null) {
      rrule = _.extend(data.rrule, {
        freq: rruleOptions.freq,
        interval: rruleOptions.interval,
        weekdays: rruleOptions.byweekday
      });
      if (rruleOptions.freq === RRule.MONTHLY) {
        if (((ref = rruleOptions.bymonthday) != null ? ref.length : void 0) > 0) {
          monthlyRepeatBy = 'repeat-day';
        } else if (((ref1 = rruleOptions.bynweekday) != null ? ref1.length : void 0) > 0) {
          monthlyRepeatBy = 'repeat-weekday';
        } else {
          monthlyRepeatBy = 'repeat-day';
        }
        rrule.monthlyRepeatBy = monthlyRepeatBy;
      }
      if (rruleOptions.until) {
        endMode = {
          endMode: 'until',
          until: moment.tz(rruleOptions.until, 'UTC').format(this.inputDateFormat)
        };
      } else if (rruleOptions.count) {
        endMode = {
          endMode: 'count',
          count: rruleOptions.count
        };
      } else {
        endMode = {
          endMode: 'never'
        };
      }
      rrule = _.extend(rrule, endMode);
      data.rrule = rrule;
    }
    functions = {
      limitedVisibility: function(freq) {
        if (data.rrule.freq !== freq) {
          return "true";
        } else {
          return "false";
        }
      },
      genericLimitedVisibility: function() {
        if (data.rrule.freq === NO_REPEAT) {
          return "true";
        } else {
          return "false";
        }
      },
      isFreqSelected: function(value) {
        if (value === data.rrule.freq) {
          return 'selected';
        }
      },
      isWeekdaySelected: function(value) {
        var isSelected, ref2;
        isSelected = data.rrule.byweekday && (ref2 = (value + 6) % 7, indexOf.call(data.rrule.byweekday, ref2) >= 0);
        if (isSelected) {
          return 'checked';
        }
      },
      monthlyRepeatBy: function(value) {
        if (value === data.rrule.monthlyRepeatBy) {
          return 'checked';
        }
      },
      isEndModeSelected: function(value) {
        if (value === data.rrule.endMode) {
          return 'checked';
        }
      }
    };
    return _.extend(data, functions);
  };

  RepeatPopoverScreen.prototype.afterRender = function() {
    this.$('[name="until-date"]').attr('type', 'text').datetimepicker({
      language: window.app.locale,
      fontAwesome: true,
      autoclose: true,
      format: this.inputDateDTPickerFormat,
      minView: 2,
      viewSelect: 4,
      keyboardNavigation: false,
      pickerPosition: 'top-right'
    }).on('changeDate', this.renderSummary.bind(this));
    return this.renderSummary();
  };

  RepeatPopoverScreen.prototype.renderSummary = function() {
    var language, locale, rrule, summary;
    rrule = this.buildRRuleFromDOM();
    try {
      rrule.toString();
      locale = moment.localeData();
      language = {
        dayNames: locale._weekdays,
        monthNames: locale._months
      };
      summary = rrule.toText(window.t, language);
      return this.$('#summary').html(summary);
    } catch (_error) {}
  };

  RepeatPopoverScreen.prototype.onLeaveScreen = function() {
    var rrule, rruleString;
    rrule = this.buildRRuleFromDOM();
    if (rrule.options.freq !== NO_REPEAT) {
      rruleString = rrule.toString();
      rruleString = rruleString.split(';').filter(function(s) {
        return s.indexOf('DTSTART' !== 0);
      }).join(';');
    } else {
      rruleString = null;
    }
    return this.model.set('rrule', rruleString);
  };

  RepeatPopoverScreen.prototype.buildRRuleFromDOM = function() {
    var RRuleWdays, day, monthmode, options, rawDate, start, wk;
    start = this.model.getStartDateObject();
    RRuleWdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
    options = {
      freq: +this.$('select[name="frequency"]').val(),
      interval: +this.$('input[name="interval"]').val()
    };
    this.updateIntervalUnit(options.freq, options.interval);
    if (options.freq === RRule.WEEKLY) {
      options.byweekday = [];
      this.$('[name="weekly-repeat-type"]:checked').each(function(idx, box) {
        return options.byweekday.push(RRuleWdays[box.value]);
      });
      if (options.byweekday.length === 7) {
        delete options.byweekday;
      }
    } else if (options.freq === RRule.MONTHLY) {
      monthmode = this.$('[name="monthly-repeat-type"]:checked').val();
      if (monthmode === "repeat-day") {
        options.bymonthday = start.date();
      } else if (monthmode === 'repeat-weekday') {
        day = RRuleWdays[start.day()];
        wk = Math.ceil(start.date() / 7);
        if (wk > 4) {
          wk = -1;
        }
        options.byweekday = day.nth(wk);
      }
    }
    switch (this.$('[name="endMode"]:checked').val()) {
      case 'count':
        options.count = +this.$('[name="count"]').val();
        break;
      case 'until':
        rawDate = this.$('[name="until-date"]').val();
        options.until = moment.tz(rawDate, this.inputDateFormat, 'UTC').toDate();
    }
    return new RRule(options);
  };

  RepeatPopoverScreen.prototype.onSelectRepeat = function() {
    var repeatTypeSelector, value;
    value = parseInt(this.$('select.input-repeat').val());
    if (value !== NO_REPEAT) {
      this.$('[aria-hidden="false"]:not(.generic)').attr('aria-hidden', true);
      repeatTypeSelector = (function() {
        switch (value) {
          case RRule.WEEKLY:
            return '.weekly-only';
          case RRule.MONTHLY:
            return '.monthly-only';
        }
      })();
      this.$('[aria-hidden="true"].generic').attr('aria-hidden', false);
      this.$(repeatTypeSelector).attr('aria-hidden', false);
      this.renderSummary();
      return this.updateIntervalUnit(value);
    } else {
      return this.$('[aria-hidden="false"]').attr('aria-hidden', true);
    }
  };

  RepeatPopoverScreen.prototype.updateIntervalUnit = function(unit, numberOfUnits) {
    var localizationKey, unitString;
    if (unit == null) {
      unit = null;
    }
    if (numberOfUnits == null) {
      numberOfUnits = null;
    }
    if (unit == null) {
      unit = parseInt(this.$('select.input-repeat').val());
    }
    if (numberOfUnits == null) {
      numberOfUnits = parseInt(this.$('input[name="interval"]').val());
    }
    if (unit !== NO_REPEAT) {
      localizationKey = "screen recurrence interval unit " + unit;
      unitString = t(localizationKey, {
        smart_count: numberOfUnits
      });
      return this.$('#intervalUnit').html(unitString);
    }
  };

  return RepeatPopoverScreen;

})(PopoverScreenView);
});

;require.register("views/settings_modal", function(exports, require, module) {
var BaseView, ComboBox, ImportView, SettingsModals,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

BaseView = require('lib/base_view');

ImportView = require('./import_view');

ComboBox = require('./widgets/combobox');

module.exports = SettingsModals = (function(superClass) {
  extend(SettingsModals, superClass);

  function SettingsModals() {
    this.hideOnEscape = bind(this.hideOnEscape, this);
    return SettingsModals.__super__.constructor.apply(this, arguments);
  }

  SettingsModals.prototype.id = 'settings-modal';

  SettingsModals.prototype.className = 'modal fade';

  SettingsModals.prototype.attributes = {
    'data-keyboard': false
  };

  SettingsModals.prototype.template = require('./templates/settings_modal');

  SettingsModals.prototype.events = {
    'keyup': 'hideOnEscape',
    'click a#export': 'exportCalendar',
    'click #show-password': 'showPassword',
    'click #hide-password': 'hidePassword',
    'click .close-settings': 'close'
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
    this.$el.attr('tabindex', '0');
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

  SettingsModals.prototype.hideOnEscape = function(event) {
    if (27 === event.which || 27 === event.keyCode) {
      return this.close();
    }
  };

  SettingsModals.prototype.close = function() {
    return this.$el.modal('hide');
  };

  SettingsModals.prototype.exportCalendar = function() {
    var calendarId, encodedName;
    calendarId = this.calendar.value();
    if (indexOf.call(app.calendars.toArray(), calendarId) >= 0) {
      encodedName = encodeURIComponent(calendarId);
      return window.location = "export/" + encodedName + ".ics";
    } else {
      return alert(t('please select existing calendar'));
    }
  };

  SettingsModals.prototype.getPlaceholder = function(password) {
    var i, j, placeholder, ref;
    placeholder = [];
    for (i = j = 1, ref = password.length; j <= ref; i = j += 1) {
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
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('lib/base_view');

module.exports = TagsView = (function(superClass) {
  extend(TagsView, superClass);

  function TagsView() {
    this.refresh = bind(this.refresh, this);
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
    var i, len, ref, tag;
    this.duringRefresh = true;
    this.$el.tagit('removeAll');
    ref = this.model.get('tags');
    for (i = 0, len = ref.length; i < len; i++) {
      tag = ref[i];
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
var locals_ = (locals || {}),calendarMode = locals_.calendarMode,title = locals_.title,active = locals_.active,todaytxt = locals_.todaytxt;
buf.push("<div class=\"fc-header-left\">");
if ( calendarMode)
{
buf.push("<div role=\"group\" class=\"btn-group\"><span class=\"btn fc-button-prev fc-corner-left\"><i class=\"fa fa-angle-left\"></i></span><span class=\"btn title\">" + (jade.escape(null == (jade_interp = title) ? "" : jade_interp)) + "</span><span class=\"btn fc-button-next fc-corner-right\"><i class=\"fa fa-angle-right\"></i></span></div><div" + (jade.cls(['btn','fc-button-today',active('today')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = todaytxt) ? "" : jade_interp)) + "</div>");
}
buf.push("<span class=\"fc-header-title\"></span></div><!-- just preload the image for fast display when used--><img src=\"img/spinner-white.svg\" class=\"hidden\"/><div class=\"fc-header-right\"><div role=\"group\" class=\"btn-group\"><span type=\"button\"" + (jade.cls(['btn','fc-button-month',active('month')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('month')) ? "" : jade_interp)) + "</span><span type=\"button\"" + (jade.cls(['btn','fc-button-week',active('week')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('week')) ? "" : jade_interp)) + "</span><span type=\"button\"" + (jade.cls(['btn','fc-button-list',active('list')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('list')) ? "" : jade_interp)) + "</span></div><div role=\"group\" class=\"btn-group\"><a href=\"#settings\" class=\"btn btn-settings\"><i class=\"fa fa-cog\"></i><span>" + (jade.escape(null == (jade_interp = t('sync settings button label')) ? "" : jade_interp)) + "</span></a></div></div>");;return buf.join("");
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

buf.push("<li class=\"calendars\"><div href=\"#calendar\" class=\"title\"><span class=\"fa fa-bars menu-icon\"></span><span>" + (jade.escape(null == (jade_interp = t('calendar list title')) ? "" : jade_interp)) + "</span><span class=\"main-spinner\"><img src=\"img/spinner.svg\"/></span><span" + (jade.attr("title", t("add calendar"), true, false)) + " class=\"fa fa-plus-square-o calendar-add\"></span></div></li><ul id=\"menuitems\"></ul>");;return buf.join("");
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

;require.register("views/templates/popover", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),title = locals_.title,content = locals_.content;
buf.push("<div class=\"popover\"><div class=\"screen-indicator\"><div class=\"arrow\"></div><h3 class=\"popover-title\">" + (null == (jade_interp = title) ? "" : jade_interp) + "</h3><div class=\"popover-content\">" + (null == (jade_interp = content) ? "" : jade_interp) + "</div></div></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/alert", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),alertOptions = locals_.alertOptions;
buf.push("<div class=\"fixed-height\"><select class=\"new-alert select-big with-margin\"><option value=\"-1\" selected=\"true\">" + (jade.escape(null == (jade_interp = t('screen alert default value')) ? "" : jade_interp)) + "</option>");
// iterate alertOptions
;(function(){
  var $$obj = alertOptions;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var alertOption = $$obj[$index];

buf.push("<option" + (jade.attr("value", alertOption.index, true, false)) + ">" + (jade.escape(null == (jade_interp = t(alertOption.translationKey, {smart_count: alertOption.value})) ? "" : jade_interp)) + "</option>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var alertOption = $$obj[$index];

buf.push("<option" + (jade.attr("value", alertOption.index, true, false)) + ">" + (jade.escape(null == (jade_interp = t(alertOption.translationKey, {smart_count: alertOption.value})) ? "" : jade_interp)) + "</option>");
    }

  }
}).call(this);

buf.push("</select><ul class=\"alerts\"></ul></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/alert_row", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),index = locals_.index,label = locals_.label,isEmailChecked = locals_.isEmailChecked,isNotifChecked = locals_.isNotifChecked;
buf.push("<li" + (jade.attr("data-index", index, true, false)) + "><div class=\"alert-top\"><div class=\"alert-timer\">" + (jade.escape(null == (jade_interp = label) ? "" : jade_interp)) + "</div><button" + (jade.attr("title", t('screen alert delete tooltip'), true, false)) + " role=\"button\" class=\"alert-delete fa fa-trash-o\"></button></div><div class=\"type\"><div class=\"notification-mode\"><input" + (jade.attr("id", "email-" + (index) + "", true, false)) + " type=\"checkbox\"" + (jade.attr("checked", isEmailChecked, true, false)) + " class=\"action-email\"/><label" + (jade.attr("for", "email-" + (index) + "", true, false)) + ">" + (jade.escape(null == (jade_interp = t('screen alert type email')) ? "" : jade_interp)) + "</label></div><div class=\"notification-mode\"><input" + (jade.attr("id", "display-" + (index) + "", true, false)) + " type=\"checkbox\"" + (jade.attr("checked", isNotifChecked, true, false)) + " class=\"action-display\"/><label" + (jade.attr("for", "display-" + (index) + "", true, false)) + ">" + (jade.escape(null == (jade_interp = t('screen alert type notification')) ? "" : jade_interp)) + "</label></div></div></li>");;return buf.join("");
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

;require.register("views/templates/popover_screens/delete", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),description = locals_.description;
buf.push("<div class=\"fixed-height delete-screen\"><p>" + (jade.escape(null == (jade_interp = t('screen delete description', {description: description})) ? "" : jade_interp)) + "</p><img src=\"img/spinner.svg\" class=\"remove-spinner\"/><p class=\"errors\"></p><div class=\"remove-choices\"><button class=\"btn answer-yes\">" + (jade.escape(null == (jade_interp = t('screen delete yes button')) ? "" : jade_interp)) + "</button><button class=\"btn answer-no\">" + (jade.escape(null == (jade_interp = t('screen delete no button')) ? "" : jade_interp)) + "</button></div></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/delete_title", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),title = locals_.title;
buf.push("<div class=\"popover-back\"><i class=\"fa fa-angle-left\"></i><h4>" + (jade.escape(null == (jade_interp = title) ? "" : jade_interp)) + "</h4><div class=\"empty\"></div></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/details", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),details = locals_.details;
buf.push("<div class=\"fixed-height\"><textarea class=\"input-details\">" + (jade.escape(null == (jade_interp = details) ? "" : jade_interp)) + "</textarea></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/generic_title", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),title = locals_.title;
buf.push("<div class=\"popover-back\"><a tabindex=\"0\"><button class=\"btn btn-back\"><i class=\"fa fa-angle-left\"></i></button></a><h4>" + (jade.escape(null == (jade_interp = title) ? "" : jade_interp)) + "</h4><a tabindex=\"0\"><button class=\"btn btn-done\">" + (jade.escape(null == (jade_interp = t('screen title done button')) ? "" : jade_interp)) + "</button></a></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/guest_row", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),index = locals_.index,status = locals_.status,email = locals_.email;
buf.push("<li" + (jade.attr("data-index", index, true, false)) + "><div class=\"guest-top\">");
if ( status == 'ACCEPTED')
{
buf.push("<i class=\"fa fa-check-circle-o green\"></i>");
}
else if ( status == 'DECLINED')
{
buf.push("<i class=\"fa fa-times-circle-o red\"></i>");
}
else if ( status == 'NEED-ACTION')
{
buf.push("<i class=\"fa fa-exclamation-circle blue\"></i>");
}
buf.push("<div class=\"guest-label\">" + (jade.escape(null == (jade_interp = email) ? "" : jade_interp)) + "</div><button" + (jade.attr("title", t('screen guest remove tooltip'), true, false)) + " role=\"button\" class=\"guest-delete fa fa-trash-o\"></button></div></li>");;return buf.join("");
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

;require.register("views/templates/popover_screens/guests", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"fixed-height\"><div class=\"guests-action\"><input type=\"text\" name=\"guest-name\"" + (jade.attr("placeholder", t('screen guest input placeholder'), true, false)) + "/><button class=\"btn add-new-guest\">" + (jade.escape(null == (jade_interp = t('screen guest add button')) ? "" : jade_interp)) + "</button></div><ul class=\"guests\"></ul></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/main", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),popoverClassName = locals_.popoverClassName,allDay = locals_.allDay,sameDay = locals_.sameDay,details = locals_.details,alerts = locals_.alerts,rrule = locals_.rrule,start = locals_.start,dFormat = locals_.dFormat,tFormat = locals_.tFormat,end = locals_.end,place = locals_.place,guestsButtonText = locals_.guestsButtonText,recurrenceButtonText = locals_.recurrenceButtonText,advancedUrl = locals_.advancedUrl,buttonText = locals_.buttonText;
popoverClassName  = (allDay ? ' is-all-day' : '')
popoverClassName += (sameDay? ' is-same-day' : '')
var showDetailsByDefault = details && details.length > 0
var showAlertsByDefault = alerts && alerts.length > 0
var showRepeatByDefault = rrule != null && rrule != void(0) && rrule.length > 0
buf.push("<div" + (jade.cls(['popover-content-wrapper','label-row',popoverClassName], [null,null,true])) + "><div class=\"item-row\"><label class=\"timed time-row\"><div class=\"icon\"><span class=\"fa fa-arrow-right\"></span></div><span class=\"caption\">" + (jade.escape(null == (jade_interp = t("from")) ? "" : jade_interp)) + "</span><input tabindex=\"2\" type=\"text\" size=\"10\"" + (jade.attr("placeholder", t("placeholder from date"), true, false)) + (jade.attr("value", start.format(dFormat), true, false)) + " class=\"input-start-date input-date\"/><input tabindex=\"3\" type=\"time\" size=\"5\"" + (jade.attr("placeholder", t("placeholder from time"), true, false)) + (jade.attr("value", start.format(tFormat), true, false)) + (jade.attr("aria-hidden", "" + (allDay) + "", true, false)) + " class=\"input-start input-time\"/></label><label class=\"timed time-row\"><div class=\"icon\"><span class=\"fa fa-arrow-left\"></span></div><span class=\"input-end-caption caption\">" + (jade.escape(null == (jade_interp = t("to")) ? "" : jade_interp)) + "</span><input tabindex=\"4\" type=\"text\" size=\"10\"" + (jade.attr("placeholder", t("placeholder to date"), true, false)) + (jade.attr("value", end.format(dFormat), true, false)) + " class=\"input-end-date input-date\"/><input tabindex=\"5\" type=\"time\" size=\"5\"" + (jade.attr("placeholder", t("placeholder to time"), true, false)) + (jade.attr("value", end.format(tFormat), true, false)) + (jade.attr("aria-hidden", "" + (allDay) + "", true, false)) + " class=\"input-end-time input-time\"/></label></div><div class=\"item-row\"><label class=\"all-day\"><input tabindex=\"6\" type=\"checkbox\" value=\"checked\"" + (jade.attr("checked", allDay, true, false)) + " class=\"input-allday\"/><span>" + (jade.escape(null == (jade_interp = t('all day')) ? "" : jade_interp)) + "</span></label></div></div><div class=\"label label-row\"><div" + (jade.attr("title", t("placeholder place"), true, false)) + " class=\"icon\"><span class=\"fa fa-map-marker\"></span></div><input tabindex=\"7\" type=\"text\"" + (jade.attr("value", place, true, false)) + (jade.attr("placeholder", t("placeholder place"), true, false)) + " class=\"input-place input-full-block\"/></div><div class=\"label label-row input-people\"><div" + (jade.attr("title", t("add guest button"), true, false)) + " class=\"icon\"><span class=\"fa fa-users\"></span></div><div class=\"icon right\"><span class=\"fa fa-angle-right\"></span></div><button tabindex=\"8\" class=\"button-full-block\">" + (jade.escape(null == (jade_interp = guestsButtonText) ? "" : jade_interp)) + "</button></div><div data-optional=\"true\"" + (jade.attr("aria-hidden", "" + (!showDetailsByDefault) + "", true, false)) + " class=\"label label-row\"><div" + (jade.attr("title", t("placeholder description"), true, false)) + " class=\"icon\"><span class=\"fa fa-align-left\"></span></div><div class=\"icon right\"><span class=\"fa fa-angle-right\"></span></div><input tabindex=\"9\" type=\"text\"" + (jade.attr("value", details, true, false)) + (jade.attr("placeholder", t("placeholder description"), true, false)) + " class=\"input-details-trigger input-full-block\"/></div><div data-optional=\"true\"" + (jade.attr("aria-hidden", "" + (!showAlertsByDefault) + "", true, false)) + " class=\"label label-row input-alert\"><div" + (jade.attr("title", t("alert tooltip"), true, false)) + " class=\"icon\"><span class=\"fa fa-bell\"></span></div><div class=\"icon right\"><span class=\"fa fa-angle-right\"></span></div>");
if ( !alerts || alerts.length === 0)
{
buf.push("<button tabindex=\"10\" class=\"button-full-block\">" + (jade.escape(null == (jade_interp = t('no alert button')) ? "" : jade_interp)) + "</button>");
}
else
{
buf.push("<button tabindex=\"10\" class=\"button-full-block\">" + (jade.escape(null == (jade_interp = t('alert label', {smart_count: alerts.length})) ? "" : jade_interp)) + "</button>");
}
buf.push("</div><div data-optional=\"true\"" + (jade.attr("aria-hidden", "" + (!showRepeatByDefault) + "", true, false)) + " class=\"label label-row input-repeat\"><div" + (jade.attr("title", t("repeat tooltip"), true, false)) + " class=\"icon\"><span class=\"fa fa-repeat\"></span></div><div class=\"icon right\"><span class=\"fa fa-angle-right\"></span></div><button tabindex=\"11\" class=\"button-full-block\">" + (jade.escape(null == (jade_interp = recurrenceButtonText) ? "" : jade_interp)) + "</button></div><div class=\"popover-footer\"><a role=\"button\" tabindex=\"11\"" + (jade.attr("href", '#' + advancedUrl, true, false)) + " data-tabindex-next=\"13\" class=\"advanced-link\"><div class=\"icon\"><span class=\"fa fa-caret-down\"></span></div>" + (jade.escape(null == (jade_interp = t('more details button')) ? "" : jade_interp)) + "</a><div class=\"buttons\"><a role=\"button\" tabindex=\"13\" class=\"btn btn-link cancel\">" + (jade.escape(null == (jade_interp = t('cancel')) ? "" : jade_interp)) + "</a><a role=\"button\" tabindex=\"14\" class=\"btn add\">" + (jade.escape(null == (jade_interp = buttonText) ? "" : jade_interp)) + "</a></div></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/main_title", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),calendar = locals_.calendar,description = locals_.description;
buf.push("<div class=\"calendar\"><input" + (jade.attr("value", calendar, true, false)) + " class=\"calendarcombo\"/></div><div class=\"label\"><input tabindex=\"1\" type=\"text\"" + (jade.attr("value", description, true, false)) + (jade.attr("placeholder", t("placeholder event title"), true, false)) + " data-tabindex-prev=\"8\" class=\"input-desc\"/></div><div class=\"controls\"><button" + (jade.attr("title", t('delete'), true, false)) + " role=\"button\" class=\"remove fa fa-trash\"></button><img src=\"img/spinner.svg\" class=\"remove-spinner\"/><button" + (jade.attr("title", t('duplicate'), true, false)) + " role=\"button\" class=\"duplicate fa fa-copy\"></button></div>");;return buf.join("");
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

;require.register("views/templates/popover_screens/repeat", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),NO_REPEAT = locals_.NO_REPEAT,isFreqSelected = locals_.isFreqSelected,genericLimitedVisibility = locals_.genericLimitedVisibility,rrule = locals_.rrule,limitedVisibility = locals_.limitedVisibility,weekDays = locals_.weekDays,isWeekdaySelected = locals_.isWeekdaySelected,monthlyRepeatBy = locals_.monthlyRepeatBy,isEndModeSelected = locals_.isEndModeSelected;
buf.push("<div class=\"fixed-height repeat-screen\"><label><select name=\"frequency\" class=\"input-repeat select-big\"><option" + (jade.attr("value", NO_REPEAT, true, false)) + (jade.attr("selected", isFreqSelected(NO_REPEAT), true, false)) + ">" + (jade.escape(null == (jade_interp = t('screen recurrence no repeat')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.DAILY, true, false)) + (jade.attr("selected", isFreqSelected(RRule.DAILY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('screen recurrence daily')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.WEEKLY, true, false)) + (jade.attr("selected", isFreqSelected(RRule.WEEKLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('screen recurrence weekly')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.MONTHLY, true, false)) + (jade.attr("selected", isFreqSelected(RRule.MONTHLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('screen recurrence monthly')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.YEARLY, true, false)) + (jade.attr("selected", isFreqSelected(RRule.YEARLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('screen recurrence yearly')) ? "" : jade_interp)) + "</option></select></label><label" + (jade.attr("aria-hidden", genericLimitedVisibility(), true, false)) + " class=\"inline-input generic\"><span class=\"first-input\">" + (jade.escape(null == (jade_interp = t('screen recurrence interval label')) ? "" : jade_interp)) + "</span><input type=\"number\" min=\"1\"" + (jade.attr("value", rrule.interval, true, false)) + " name=\"interval\" class=\"special\"/><!-- By default the value is -1 and triggers a polyglot warning, so it's left empty.-->");
if (rrule.freq >= 0)
{
var localizationKey = "screen recurrence interval unit " + rrule.freq
buf.push("<span id=\"intervalUnit\">" + (jade.escape(null == (jade_interp = t(localizationKey, {smart_count: rrule.interval})) ? "" : jade_interp)) + "</span>");
}
else
{
buf.push("<span id=\"intervalUnit\"></span>");
}
buf.push("</label><label" + (jade.attr("aria-hidden", limitedVisibility(RRule.WEEKLY), true, false)) + " class=\"inline-input weekly-only\"><span class=\"first-input\">" + (jade.escape(null == (jade_interp = t('screen recurrence days list label')) ? "" : jade_interp)) + "</span><div class=\"space-between\">");
// iterate weekDays
;(function(){
  var $$obj = weekDays;
  if ('number' == typeof $$obj.length) {

    for (var index = 0, $$l = $$obj.length; index < $$l; index++) {
      var weekday = $$obj[index];

buf.push("<label><input type=\"checkbox\" name=\"weekly-repeat-type\"" + (jade.attr("value", "" + (index) + "", true, false)) + (jade.attr("checked", isWeekdaySelected(weekday), true, false)) + "/><span>" + (jade.escape(null == (jade_interp = weekday[0]) ? "" : jade_interp)) + "</span></label>");
    }

  } else {
    var $$l = 0;
    for (var index in $$obj) {
      $$l++;      var weekday = $$obj[index];

buf.push("<label><input type=\"checkbox\" name=\"weekly-repeat-type\"" + (jade.attr("value", "" + (index) + "", true, false)) + (jade.attr("checked", isWeekdaySelected(weekday), true, false)) + "/><span>" + (jade.escape(null == (jade_interp = weekday[0]) ? "" : jade_interp)) + "</span></label>");
    }

  }
}).call(this);

buf.push("</div></label><label" + (jade.attr("aria-hidden", limitedVisibility(RRule.MONTHLY), true, false)) + " class=\"inline-input monthly-only\"><span class=\"first-input align-top\">" + (jade.escape(null == (jade_interp = t('screen recurrence repeat by label')) ? "" : jade_interp)) + "</span><div><label><input type=\"radio\" name=\"monthly-repeat-type\" value=\"repeat-day\"" + (jade.attr("checked", monthlyRepeatBy('repeat-day'), true, false)) + "/>" + (jade.escape((jade_interp = t('screen recurrence repeat by month')) == null ? '' : jade_interp)) + "</label><label><input type=\"radio\" name=\"monthly-repeat-type\" value=\"repeat-weekday\"" + (jade.attr("checked", monthlyRepeatBy('repeat-weekday'), true, false)) + "/>" + (jade.escape((jade_interp = t('screen recurrence repeat by week')) == null ? '' : jade_interp)) + "</label></div></label><label" + (jade.attr("aria-hidden", genericLimitedVisibility(), true, false)) + " class=\"inline-input generic\"><span class=\"first-input align-top\">" + (jade.escape(null == (jade_interp = t('screen recurrence ends label')) ? "" : jade_interp)) + "</span><div><label for=\"never-end\" class=\"inline-input\"><input id=\"never-end\" type=\"radio\" name=\"endMode\" value=\"never\"" + (jade.attr("checked", isEndModeSelected('never'), true, false)) + "/>" + (jade.escape(null == (jade_interp = t('screen recurrence ends never label')) ? "" : jade_interp)) + "</label><label class=\"inline-input\"><input id=\"end-after-num\" type=\"radio\" name=\"endMode\" value=\"count\"" + (jade.attr("checked", isEndModeSelected('count'), true, false)) + "/><label for=\"end-after-num\">" + (jade.escape(null == (jade_interp = t('screen recurrence ends count label')) ? "" : jade_interp)) + "</label><input id=\"rrule-count\" name=\"count\" type=\"number\" min=\"0\"" + (jade.attr("value", rrule.count, true, false)) + " class=\"special input-mini\"/><label for=\"rrule-count\">" + (jade.escape(null == (jade_interp = t('screen recurrence ends count unit')) ? "" : jade_interp)) + "</label></label><label class=\"inline-input\"><input id=\"end-until-date\" type=\"radio\" name=\"endMode\" value=\"until\"" + (jade.attr("checked", isEndModeSelected('until'), true, false)) + "/><label for=\"end-until-date\">" + (jade.escape(null == (jade_interp = t('screen recurrence ends until label')) ? "" : jade_interp)) + "</label><input tabindex=\"3\" type=\"text\" size=\"10\" name=\"until-date\"" + (jade.attr("placeholder", t("screen recurrence ends until placeholder"), true, false)) + (jade.attr("value", rrule.until, true, false)) + " class=\"special input-until-date input-date\"/></label></div></label><div" + (jade.attr("aria-hidden", genericLimitedVisibility(), true, false)) + " class=\"inline-input summary generic\"><span class=\"first-input align-top\">" + (jade.escape(null == (jade_interp = t("screen recurrence summary label")) ? "" : jade_interp)) + "</span><span id=\"summary\"></span></div></div>");;return buf.join("");
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
buf.push("<div class=\"modal-header\"><h2>" + (jade.escape(null == (jade_interp = t('sync settings button label')) ? "" : jade_interp)) + "</h2></div><div class=\"helptext\"><span><i class=\"fa fa-refresh\"></i></span><h3>" + (jade.escape(null == (jade_interp = t('mobile sync')) ? "" : jade_interp)) + "</h3>");
if ( account == null)
{
buf.push("<p>" + (jade.escape(null == (jade_interp = t('to sync your cal with')) ? "" : jade_interp)) + "</p><ol><li>" + (jade.escape(null == (jade_interp = t('install the sync module')) ? "" : jade_interp)) + "</li><li>" + (jade.escape(null == (jade_interp = t('connect to it and follow')) ? "" : jade_interp)) + "</li></ol>");
}
else
{
buf.push("<p>" + (jade.escape(null == (jade_interp = t('sync headline with data')) ? "" : jade_interp)) + "</p><ul><li>" + (jade.escape((jade_interp = t('sync url')) == null ? '' : jade_interp)) + " https://" + (jade.escape((jade_interp = account.domain) == null ? '' : jade_interp)) + "/public/sync/principals/me</li><li>" + (jade.escape((jade_interp = t('sync login')) == null ? '' : jade_interp)) + " " + (jade.escape((jade_interp = account.login) == null ? '' : jade_interp)) + "</li><li>" + (jade.escape((jade_interp = t('sync password') + " ") == null ? '' : jade_interp)) + "<span id=\"placeholder\">" + (jade.escape(null == (jade_interp = account.placeholder) ? "" : jade_interp)) + "</span><button id=\"show-password\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('show')) ? "" : jade_interp)) + "</button><button id=\"hide-password\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('hide')) ? "" : jade_interp)) + "</button></li></ul>");
}
buf.push("<p>" + (jade.escape(null == (jade_interp = t('sync help') + " ") ? "" : jade_interp)) + "<a href=\"https://cozy.io/mobile/calendar.html\" target=\"_blank\">" + (jade.escape(null == (jade_interp = t('sync help link')) ? "" : jade_interp)) + "</a></p></div><div class=\"helptext\"><span><i class=\"fa fa-upload\"></i></span><h3>" + (jade.escape(null == (jade_interp = t('icalendar export')) ? "" : jade_interp)) + "</h3><p>" + (jade.escape(null == (jade_interp = t('download a copy of your calendar')) ? "" : jade_interp)) + "</p><p class=\"line\"><span class=\"surrounded-combobox\"><input id=\"export-calendar\"" + (jade.attr("value", calendar, true, false)) + "/></span><span>&nbsp;</span><a id=\"export\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('export your calendar')) ? "" : jade_interp)) + "</a></p></div><div class=\"helptext\"><span><i class=\"fa fa-download\"></i></span><h3>" + (jade.escape(null == (jade_interp = t('icalendar import')) ? "" : jade_interp)) + "</h3><div id=\"importviewplaceholder\"></div></div><div class=\"modal-footer\"><button class=\"btn btn-link close-settings\">" + (jade.escape(null == (jade_interp = t('close')) ? "" : jade_interp)) + "</button></div>");;return buf.join("");
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
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('../lib/base_view');

module.exports = Toggle = (function(superClass) {
  extend(Toggle, superClass);

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
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseView = require('lib/base_view');

TagCollection = require('collections/tags');

Tag = require('models/tag');

module.exports = ComboBox = (function(superClass) {
  extend(ComboBox, superClass);

  function ComboBox() {
    this.remove = bind(this.remove, this);
    this.renderItem = bind(this.renderItem, this);
    this.onChange = bind(this.onChange, this);
    this.onEditionComplete = bind(this.onEditionComplete, this);
    this.onSelect = bind(this.onSelect, this);
    this.onBlur = bind(this.onBlur, this);
    this.onClose = bind(this.onClose, this);
    this.onOpen = bind(this.onOpen, this);
    this.setValue = bind(this.setValue, this);
    this.value = bind(this.value, this);
    this.openMenu = bind(this.openMenu, this);
    return ComboBox.__super__.constructor.apply(this, arguments);
  }

  ComboBox.prototype.events = {
    'keyup': 'onChange',
    'keypress': 'onChange',
    'change': 'onChange',
    'blur': 'onBlur'
  };

  ComboBox.prototype.initialize = function(options) {
    var caret, isInput, method, value;
    ComboBox.__super__.initialize.call(this);
    this.source = options.source;
    this.$el.autocomplete({
      delay: 0,
      minLength: 0,
      source: this.source,
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
    this.on('edition-complete', this.onEditionComplete);
    if (!this.small) {
      caret = $('<a class="combobox-caret">');
      caret.append($('<span class="caret"></span>'));
      caret.click(this.openMenu);
      this.$el.after(caret);
    }
    value = options.current || this.getDefaultValue();
    return this.onEditionComplete(value);
  };

  ComboBox.prototype.openMenu = function() {
    this.menuOpen = true;
    this.$el.addClass('expanded');
    this.$el.focus().val(this.value()).autocomplete('search', '');
    return this.$el[0].setSelectionRange(0, this.value().length);
  };

  ComboBox.prototype.getDefaultValue = function() {
    return this.source[0].label;
  };

  ComboBox.prototype.value = function() {
    return this.$el.val();
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
    var ref;
    this.$el.blur().removeClass('expanded');
    this.onChange(ev, ui);
    return this.trigger('edition-complete', (ui != null ? (ref = ui.item) != null ? ref.value : void 0 : void 0) || this.value());
  };

  ComboBox.prototype.onEditionComplete = function(name) {
    this.tag = app.tags.getOrCreateByName(name);
    return this.buildBadge(this.tag.get('color'));
  };

  ComboBox.prototype.onChange = function(ev, ui) {
    var generatedColor, ref, value;
    value = (ui != null ? (ref = ui.item) != null ? ref.value : void 0 : void 0) || this.value();
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
    var ref;
    if ((ref = this.badge) != null) {
      ref.remove();
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