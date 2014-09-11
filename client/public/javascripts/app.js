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

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
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

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
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
    var AlarmCollection, ContactCollection, EventCollection, Header, Menu, Router, SocketListener, TagsCollection, e, locales;
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
    AlarmCollection = require('collections/alarms');
    EventCollection = require('collections/events');
    ContactCollection = require('collections/contacts');
    TagsCollection = require('collections/tags');
    this.alarms = new AlarmCollection();
    this.events = new EventCollection();
    this.contacts = new ContactCollection();
    this.tags = new TagsCollection();
    this.router = new Router();
    this.menu = new Menu({
      collection: this.tags
    });
    this.menu.render().$el.prependTo('body');
    SocketListener.watch(this.alarms);
    SocketListener.watch(this.events);
    if (window.initalarms != null) {
      this.alarms.reset(window.initalarms);
      delete window.initalarms;
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
    if (typeof Object.freeze === 'function') {
      return Object.freeze(this);
    }
  }
};
});

;require.register("collections/alarms", function(exports, require, module) {
var Alarm, AlarmCollection, ScheduleItemsCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ScheduleItemsCollection = require('./scheduleitems');

Alarm = require('../models/alarm');

module.exports = AlarmCollection = (function(_super) {
  __extends(AlarmCollection, _super);

  function AlarmCollection() {
    return AlarmCollection.__super__.constructor.apply(this, arguments);
  }

  AlarmCollection.prototype.model = Alarm;

  AlarmCollection.prototype.url = 'alarms';

  return AlarmCollection;

})(ScheduleItemsCollection);
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
var DayBucket, DayBucketCollection, ScheduleItemsCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ScheduleItemsCollection = require('./scheduleitems');

DayBucket = DayBucket = (function(_super) {
  __extends(DayBucket, _super);

  function DayBucket(model) {
    DayBucket.__super__.constructor.call(this, {
      id: model.getDateHash(),
      date: model.getDateObject().clone().beginningOfDay()
    });
  }

  DayBucket.prototype.initialize = function() {
    return this.items = new ScheduleItemsCollection();
  };

  return DayBucket;

})(Backbone.Model);

module.exports = DayBucketCollection = (function(_super) {
  __extends(DayBucketCollection, _super);

  function DayBucketCollection() {
    return DayBucketCollection.__super__.constructor.apply(this, arguments);
  }

  DayBucketCollection.prototype.model = DayBucket;

  DayBucketCollection.prototype.comparator = function(db1, db2) {
    var d1, d2;
    d1 = Date.create(db1.get('date'));
    d2 = Date.create(db2.get('date'));
    if (d1 < d2) {
      return -1;
    } else if (d1 > d2) {
      return 1;
    } else {
      return 0;
    }
  };

  DayBucketCollection.prototype.initialize = function() {
    this.alarmCollection = app.alarms;
    this.eventCollection = app.events;
    this.tagsCollection = app.tags;
    this.listenTo(this.alarmCollection, 'add', this.onBaseCollectionAdd);
    this.listenTo(this.alarmCollection, 'change:trigg', this.onBaseCollectionChange);
    this.listenTo(this.alarmCollection, 'remove', this.onBaseCollectionRemove);
    this.listenTo(this.alarmCollection, 'reset', this.resetFromBase);
    this.listenTo(this.eventCollection, 'add', this.onBaseCollectionAdd);
    this.listenTo(this.eventCollection, 'change:start', this.onBaseCollectionChange);
    this.listenTo(this.eventCollection, 'remove', this.onBaseCollectionRemove);
    this.listenTo(this.eventCollection, 'reset', this.resetFromBase);
    this.listenTo(this.tagsCollection, 'change', this.resetFromBase);
    return this.resetFromBase();
  };

  DayBucketCollection.prototype.resetFromBase = function() {
    this.reset([]);
    this.alarmCollection.each((function(_this) {
      return function(model) {
        return _this.onBaseCollectionAdd(model);
      };
    })(this));
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
    var bucket, tag;
    bucket = this.get(model.getDateHash());
    tag = this.tagsCollection.findWhere({
      label: model.getCalendar()
    });
    if (tag && tag.get('visible') === false) {
      return null;
    }
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

  ScheduleItemsCollection.prototype.getFCEventSource = function(tags) {
    return (function(_this) {
      return function(start, end, timezone, callback) {
        var eventsInRange;
        eventsInRange = [];
        _this.each(function(item) {
          var duration, itemEnd, itemStart, tag;
          itemStart = item.getStartDateObject();
          itemEnd = item.getEndDateObject();
          duration = itemEnd - itemStart;
          tag = tags.findWhere({
            label: item.getCalendar()
          });
          if (tag && tag.get('visible') === false) {
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

  return ScheduleItemsCollection;

})(Backbone.Collection);
});

;require.register("collections/tags", function(exports, require, module) {
var Tags,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

module.exports = Tags = (function(_super) {
  var Tag, stringify;

  __extends(Tags, _super);

  function Tags() {
    return Tags.__super__.constructor.apply(this, arguments);
  }

  Tags.prototype.url = 'tags';

  Tags.prototype.model = Tag = (function(_super1) {
    __extends(Tag, _super1);

    function Tag() {
      return Tag.__super__.constructor.apply(this, arguments);
    }

    Tag.prototype.idAttribute = 'label';

    Tag.prototype.defaults = {
      visible: true
    };

    Tag.prototype.toString = function() {
      return this.get('label');
    };

    return Tag;

  })(Backbone.Model);

  Tags.prototype.initialize = function() {
    this.alarmCollection = app.alarms;
    this.eventCollection = app.events;
    this.listenTo(this.alarmCollection, 'add', this.onBaseCollectionAdd);
    this.listenTo(this.alarmCollection, 'change:tags', this.onBaseCollectionChange);
    this.listenTo(this.alarmCollection, 'remove', this.onBaseCollectionRemove);
    this.listenTo(this.alarmCollection, 'reset', this.resetFromBase);
    this.listenTo(this.eventCollection, 'add', this.onBaseCollectionAdd);
    this.listenTo(this.eventCollection, 'change:tags', this.onBaseCollectionChange);
    this.listenTo(this.eventCollection, 'remove', this.onBaseCollectionRemove);
    this.listenTo(this.eventCollection, 'reset', this.resetFromBase);
    return this.resetFromBase();
  };

  Tags.prototype.resetFromBase = function() {
    this.reset([]);
    this.alarmCollection.each((function(_this) {
      return function(model) {
        return _this.onBaseCollectionAdd(model);
      };
    })(this));
    return this.eventCollection.each((function(_this) {
      return function(model) {
        return _this.onBaseCollectionAdd(model);
      };
    })(this));
  };

  Tags.prototype.onBaseCollectionChange = function(model) {
    return this.resetFromBase();
  };

  Tags.prototype.onBaseCollectionAdd = function(model) {
    var calendar, tag, tags, _i, _len, _ref, _results;
    _ref = model.get('tags'), calendar = _ref[0], tags = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
    this.add({
      type: 'calendar',
      label: calendar
    });
    _results = [];
    for (_i = 0, _len = tags.length; _i < _len; _i++) {
      tag = tags[_i];
      _results.push(this.add({
        type: 'tag',
        label: tag
      }));
    }
    return _results;
  };

  Tags.prototype.onBaseCollectionRemove = function(model) {
    return this.resetFromBase();
  };

  Tags.prototype.parse = function(raw) {
    var out, tag, _i, _j, _len, _len1, _ref, _ref1;
    out = [];
    _ref = raw.calendars;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tag = _ref[_i];
      out.push({
        type: 'calendar',
        label: tag
      });
    }
    _ref1 = raw.tags;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      tag = _ref1[_j];
      out.push({
        type: 'tag',
        label: tag
      });
    }
    return out;
  };

  stringify = function(tag) {
    return tag.toString();
  };

  Tags.prototype.toArray = function() {
    return this.map(stringify);
  };

  Tags.prototype.calendars = function() {
    return this.where({
      type: 'calendar'
    }).map(function(tag) {
      return tag.attributes;
    });
  };

  return Tags;

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
});

;require.register("helpers/timezone", function(exports, require, module) {
exports.timezones = ["Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmara", "Africa/Bamako", "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre", "Africa/Brazzaville", "Africa/Bujumbura", "Africa/Cairo", "Africa/Casablanca", "Africa/Ceuta", "Africa/Conakry", "Africa/Dakar", "Africa/Dar_es_Salaam", "Africa/Djibouti", "Africa/Douala", "Africa/El_Aaiun", "Africa/Freetown", "Africa/Gaborone", "Africa/Harare", "Africa/Johannesburg", "Africa/Kampala", "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos", "Africa/Libreville", "Africa/Lome", "Africa/Luanda", "Africa/Lubumbashi", "Africa/Lusaka", "Africa/Malabo", "Africa/Maputo", "Africa/Maseru", "Africa/Mbabane", "Africa/Mogadishu", "Africa/Monrovia", "Africa/Nairobi", "Africa/Ndjamena", "Africa/Niamey", "Africa/Nouakchott", "Africa/Ouagadougou", "Africa/Porto-Novo", "Africa/Sao_Tome", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek", "America/Adak", "America/Anchorage", "America/Anguilla", "America/Antigua", "America/Araguaina", "America/Argentina/Buenos_Aires", "America/Argentina/Catamarca", "America/Argentina/Cordoba", "America/Argentina/Jujuy", "America/Argentina/La_Rioja", "America/Argentina/Mendoza", "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan", "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia", "America/Aruba", "America/Asuncion", "America/Atikokan", "America/Bahia", "America/Barbados", "America/Belem", "America/Belize", "America/Blanc-Sablon", "America/Boa_Vista", "America/Bogota", "America/Boise", "America/Cambridge_Bay", "America/Campo_Grande", "America/Cancun", "America/Caracas", "America/Cayenne", "America/Cayman", "America/Chicago", "America/Chihuahua", "America/Costa_Rica", "America/Cuiaba", "America/Curacao", "America/Danmarkshavn", "America/Dawson", "America/Dawson_Creek", "America/Denver", "America/Detroit", "America/Dominica", "America/Edmonton", "America/Eirunepe", "America/El_Salvador", "America/Fortaleza", "America/Glace_Bay", "America/Godthab", "America/Goose_Bay", "America/Grand_Turk", "America/Grenada", "America/Guadeloupe", "America/Guatemala", "America/Guayaquil", "America/Guyana", "America/Halifax", "America/Havana", "America/Hermosillo", "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Indiana/Marengo", "America/Indiana/Petersburg", "America/Indiana/Tell_City", "America/Indiana/Vevay", "America/Indiana/Vincennes", "America/Indiana/Winamac", "America/Inuvik", "America/Iqaluit", "America/Jamaica", "America/Juneau", "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/La_Paz", "America/Lima", "America/Los_Angeles", "America/Maceio", "America/Managua", "America/Manaus", "America/Martinique", "America/Matamoros", "America/Mazatlan", "America/Menominee", "America/Merida", "America/Mexico_City", "America/Miquelon", "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Montreal", "America/Montserrat", "America/Nassau", "America/New_York", "America/Nipigon", "America/Nome", "America/Noronha", "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/Ojinaga", "America/Panama", "America/Pangnirtung", "America/Paramaribo", "America/Phoenix", "America/Port-au-Prince", "America/Port_of_Spain", "America/Porto_Velho", "America/Puerto_Rico", "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina", "America/Resolute", "America/Rio_Branco", "America/Santa_Isabel", "America/Santarem", "America/Santiago", "America/Santo_Domingo", "America/Sao_Paulo", "America/Scoresbysund", "America/St_Johns", "America/St_Kitts", "America/St_Lucia", "America/St_Thomas", "America/St_Vincent", "America/Swift_Current", "America/Tegucigalpa", "America/Thule", "America/Thunder_Bay", "America/Tijuana", "America/Toronto", "America/Tortola", "America/Vancouver", "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife", "Antarctica/Casey", "Antarctica/Davis", "Antarctica/DumontDUrville", "Antarctica/Mawson", "Antarctica/McMurdo", "Antarctica/Palmer", "Antarctica/Rothera", "Antarctica/Syowa", "Antarctica/Vostok", "Asia/Aden", "Asia/Almaty", "Asia/Amman", "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Baghdad", "Asia/Bahrain", "Asia/Baku", "Asia/Bangkok", "Asia/Beirut", "Asia/Bishkek", "Asia/Brunei", "Asia/Choibalsan", "Asia/Chongqing", "Asia/Colombo", "Asia/Damascus", "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe", "Asia/Gaza", "Asia/Harbin", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk", "Asia/Jakarta", "Asia/Jayapura", "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka", "Asia/Karachi", "Asia/Kashgar", "Asia/Kathmandu", "Asia/Kolkata", "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Kuwait", "Asia/Macau", "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Muscat", "Asia/Nicosia", "Asia/Novokuznetsk", "Asia/Novosibirsk", "Asia/Omsk", "Asia/Oral", "Asia/Phnom_Penh", "Asia/Pontianak", "Asia/Pyongyang", "Asia/Qatar", "Asia/Qyzylorda", "Asia/Rangoon", "Asia/Riyadh", "Asia/Sakhalin", "Asia/Samarkand", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tashkent", "Asia/Tbilisi", "Asia/Tehran", "Asia/Thimphu", "Asia/Tokyo", "Asia/Ulaanbaatar", "Asia/Urumqi", "Asia/Vientiane", "Asia/Vladivostok", "Asia/Yakutsk", "Asia/Yekaterinburg", "Asia/Yerevan", "Atlantic/Azores", "Atlantic/Bermuda", "Atlantic/Canary", "Atlantic/Cape_Verde", "Atlantic/Faroe", "Atlantic/Madeira", "Atlantic/Reykjavik", "Atlantic/South_Georgia", "Atlantic/St_Helena", "Atlantic/Stanley", "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill", "Australia/Currie", "Australia/Darwin", "Australia/Eucla", "Australia/Hobart", "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney", "Canada/Atlantic", "Canada/Central", "Canada/Eastern", "Canada/Mountain", "Canada/Newfoundland", "Canada/Pacific", "Europe/Amsterdam", "Europe/Andorra", "Europe/Athens", "Europe/Belgrade", "Europe/Berlin", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest", "Europe/Chisinau", "Europe/Copenhagen", "Europe/Dublin", "Europe/Gibraltar", "Europe/Helsinki", "Europe/Istanbul", "Europe/Kaliningrad", "Europe/Kiev", "Europe/Lisbon", "Europe/London", "Europe/Luxembourg", "Europe/Madrid", "Europe/Malta", "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara", "Europe/Simferopol", "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Tirane", "Europe/Uzhgorod", "Europe/Vaduz", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd", "Europe/Warsaw", "Europe/Zaporozhye", "Europe/Zurich", "GMT", "Indian/Antananarivo", "Indian/Chagos", "Indian/Christmas", "Indian/Cocos", "Indian/Comoro", "Indian/Kerguelen", "Indian/Mahe", "Indian/Maldives", "Indian/Mauritius", "Indian/Mayotte", "Indian/Reunion", "Pacific/Apia", "Pacific/Auckland", "Pacific/Chatham", "Pacific/Easter", "Pacific/Efate", "Pacific/Enderbury", "Pacific/Fakaofo", "Pacific/Fiji", "Pacific/Funafuti", "Pacific/Galapagos", "Pacific/Gambier", "Pacific/Guadalcanal", "Pacific/Guam", "Pacific/Honolulu", "Pacific/Johnston", "Pacific/Kiritimati", "Pacific/Kosrae", "Pacific/Kwajalein", "Pacific/Majuro", "Pacific/Marquesas", "Pacific/Midway", "Pacific/Nauru", "Pacific/Niue", "Pacific/Norfolk", "Pacific/Noumea", "Pacific/Pago_Pago", "Pacific/Palau", "Pacific/Pitcairn", "Pacific/Ponape", "Pacific/Port_Moresby", "Pacific/Rarotonga", "Pacific/Saipan", "Pacific/Tahiti", "Pacific/Tarawa", "Pacific/Tongatapu", "Pacific/Truk", "Pacific/Wake", "Pacific/Wallis", "US/Alaska", "US/Arizona", "US/Central", "US/Eastern", "US/Hawaii", "US/Mountain", "US/Pacific", "UTC"];
});

;require.register("initialize", function(exports, require, module) {
var app;

app = require('application');

$(function() {
  var locale;
  require('lib/app_helpers');
  moment.locale(window.locale);
  locale = moment.localeData();
  $.fn.datetimepicker.dates['en'] = {
    days: locale._weekdays,
    daysShort: locale._weekdaysShort,
    daysMin: locale._weekdaysMin,
    months: locale._months,
    monthsShort: locale._monthsShort,
    today: locale.calendar["sameDay"],
    suffix: [],
    meridiem: locale.meridiem(),
    weekStart: locale._week["dow"],
    format: locale._longDateFormat.L.replace(/D/g, 'd').replace(/M/g, 'm').replace(/Y/g, 'y').replace(/H/g, 'h').replace(/h/g, 'H').replace(/m/g, 'i')
  };
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
        spinner = $this.data("spinner");
        if (spinner != null) {
          spinner.stop();
          return $this.data("spinner", null);
        } else if (opts !== false) {
          if (typeof opts === "string") {
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

;require.register("lib/app_helpers", function(exports, require, module) {
(function() {
  return (function() {
    var console, dummy, method, methods, _results;
    console = window.console = window.console || {};
    method = void 0;
    dummy = function() {};
    methods = 'assert,count,debug,dir,dirxml,error,exception, group,groupCollapsed,groupEnd,info,log,markTimeline, profile,profileEnd,time,timeEnd,trace,warn'.split(',');
    _results = [];
    while (method = methods.pop()) {
      _results.push(console[method] = console[method] || dummy);
    }
    return _results;
  })();
})();
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

;require.register("lib/colorhash", function(exports, require, module) {
var hslToRgb, hue2rgb;

hue2rgb = function(p, q, t) {
  if (t < 0) {
    t += 1;
  }
  if (t > 1) {
    t -= 1;
  }
  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }
  if (t < 1 / 2) {
    return q;
  }
  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }
  return p;
};

hslToRgb = (function(_this) {
  return function(h, s, l) {
    var b, g, p, q, r;
    if (s === 0) {
      r = g = b = l;
    } else {
      q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return "#" + ((1 << 24) + (r * 255 << 16) + (g * 255 << 8) + parseInt(b * 255)).toString(16).slice(1);
  };
})(this);

module.exports = function(tag) {
  var colour, h, hash, i, l, s, _i, _ref;
  if (tag !== "my calendar") {
    hash = 0;
    for (i = _i = 0, _ref = tag.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      hash = tag.charCodeAt(i) + (hash << 5) - hash;
    }
    h = (hash % 100) / 100;
    s = (hash % 1000) / 1000;
    l = 0.5 + 0.2 * (hash % 2) / 2;
    colour = hslToRgb(h, s, l);
    return colour;
  } else {
    return '#008AF6';
  }
};
});

;require.register("lib/popover_view", function(exports, require, module) {
var BaseView, PopoverView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('./base_view');

module.exports = PopoverView = (function(_super) {
  __extends(PopoverView, _super);

  function PopoverView() {
    return PopoverView.__super__.constructor.apply(this, arguments);
  }

  PopoverView.prototype.titleTemplate = function() {};

  PopoverView.prototype.initialize = function(options) {
    this.target = options.target;
    this.container = options.container;
    return this.parentView = options.parentView;
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
      placement: this.getDirection(),
      content: this.template(this.getRenderData()),
      container: this.container
    }).popover('show');
    this.setElement($('#' + this.parentView.id + ' .popover'));
    this.afterRender();
    return this;
  };

  PopoverView.getDirection = function() {};

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
    'alarm': require('models/alarm'),
    'event': require('models/event')
  };

  SocketListener.prototype.events = ['alarm.create', 'alarm.update', 'alarm.delete', 'event.create', 'event.update', 'event.delete'];

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

;require.register("locales/en", function(exports, require, module) {
module.exports = {
  "Add": "Add",
  "alarm": "Alarm",
  "event": "Event",
  "add the alarm": "add the alarm",
  "create alarm": "Alarm creation",
  "create event": "Event creation",
  "edit alarm": "Alarm edition",
  "edit event": "Event edition",
  "edit": "Edit",
  "create": "Create",
  "creation": "Creation",
  "invite": "Invite",
  "close": "Close",
  "delete": "Delete",
  "Place": "Place",
  "description": "Description",
  "date": "date",
  "Day": "Day",
  "Edit": "Edit",
  "Email": "Email",
  "Import": "Import",
  "Export": "Export",
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
  "What should I remind you ?": "What should I remind you?",
  "alarm description placeholder": "What do you want to be reminded?",
  "ICalendar import": "ICalendar import",
  "select an icalendar file": "Select an icalendar file",
  "import your icalendar file": "import your icalendar file",
  "confirm import": "confirm import",
  "cancel": "cancel",
  "Create": "Create",
  "Alarms to import": "Alarms to import",
  "Events to import": "Events to import",
  "Create Event": "Create Event",
  "From hours:minutes": "From hours:minutes",
  "To hours:minutes+days": "To hours:minutes+days",
  "Description": "Description",
  "days after": "days after",
  "days later": "days later",
  "Week": "Semaine",
  "Alarms": "Alarms",
  "Display": "Notification",
  "DISPLAY": "Notification",
  "EMAIL": "E-mail",
  "BOTH": "E-mail & Notification",
  "display previous events": "Display previous events",
  "event": "Event",
  "alarm": "Alarm",
  "are you sure": "Are you sure ?",
  "advanced": "More details",
  "enter email": "Enter email",
  "ON": "on",
  "OFF": "off",
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
  "place": "Place",
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
  "from": "From",
  "to": "to",
  "no description": "A title must be set.",
  "no summary": "A summary must be set.",
  "start after end": "The start date is after the end date.",
  "invalid start date": "The start date is invalid.",
  "invalid end date": "The end date is invalid.",
  "invalid trigg date": "The date is invalid.",
  "invalid action": "The action is invalid.",
  "synchronization": "Synchronization",
  "mobile sync": "Mobile Sync (CalDAV)",
  "link imported events with calendar": "Link events to import with following calendar:",
  "import an ical file": "To import an ICal file into your cozy calendar, click on this button:",
  "download a copy of your calendar": "To download a copy of your calendar on your computer as an ICal file, click on this button:",
  "icalendar export": "ICalendar Export",
  "icalendar import": "ICalendar Import",
  "to sync your cal with": "To synchronize your calendar with your devices, you must follow two steps",
  "install the webdav module": "Install the webdav module from the Cozy App Store",
  "connect to it and follow": "Connect to it and follow the instructions related to CalDAV.",
  "some event fail to save": "An event was not saved (an error occured).",
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
  'Dec': 'Dec'
};
});

;require.register("locales/fr", function(exports, require, module) {
module.exports = {
  "Add": "Ajouter",
  "alarm": "alarme",
  "event": "événement",
  "add the alarm": "Ajouter l'alarme",
  "create alarm": "Création d'une alarme",
  "create event": "Création d'un évènement",
  "edit alarm": "Modification d'une alarme",
  "edit event": "Modification d'un évènement",
  "edit": "Enregistrer",
  "create": "Enregistrer",
  "creation": "Creation",
  "invite": "Inviter",
  "close": "Fermer",
  "delete": "Supprimer",
  "Place": "Lieu",
  "description": "Description",
  "date": "Date",
  "Day": "Jour",
  "Edit": "Modifier",
  "Email": "Email",
  "Import": "Import",
  "Export": "Export",
  "List": "Liste",
  "list": "liste",
  "Calendar": "Calendrier",
  "calendar": "Calendrier",
  "Sync": "Sync",
  "ie: 9:00 important meeting": "exemple: 9:00 appeler Jacque",
  "Month": "Mois",
  "Popup": "Popup",
  "Switch to List": "Basculer en mode List",
  "Switch to Calendar": "Basculer en mode Calendrier",
  "time": "Heure",
  "Today": "Aujourd'hui",
  "What should I remind you ?": "Que dois-je vous rappeler ?",
  "alarm description placeholder": "Que voulez-vous vous rappeler ?",
  "ICalendar importer": "Importateur ICalendar",
  "import your icalendar file": "Importer votre fichier icalendar",
  "confirm import": "Confirmer l'import",
  "cancel": "Annuler",
  "Create": "Créer",
  "Alarms to import": "Alarmes à importer",
  "Events to import": "Evenements à importer",
  "Create Event": "Créer un évènement",
  "From hours:minutes": "De heures:minutes",
  "To hours:minutes+days": "A heures:minutes+jours",
  "Description": "Description",
  "days after": "jours plus tard",
  "days later": "jours plus tard",
  "Week": "Semaine",
  "Alarms": "Alarmes",
  "Display": "Notification",
  "DISPLAY": "Notification",
  "EMAIL": "E-mail",
  "BOTH": "E-mail & Notification",
  "display previous events": "Montrer les évènements précédents",
  "are you sure": "Etes-vous sur ?",
  "advanced": "Détails",
  "enter email": "Entrer l'addresse email",
  "ON": "activée",
  "OFF": "désactivée",
  "recurrence": "Recurrence",
  "recurrence rule": "Règle de recurrence",
  "make reccurent": "Rendre réccurent",
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
  "days": "jours",
  "day": "jour",
  "weeks": "semaines",
  "week": "semaines",
  "months": "mois",
  "month": "mois",
  "years": "ans",
  "year": "ans",
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
  "Summary": "Titre",
  "place": "Endroit",
  "start": "Début",
  "end": "Fin",
  "tags": "Tags",
  "add tags": "Ajouter des tags",
  "change to": "Changer en",
  "change": "Modifier",
  "change calendar": "Changer le calendrier",
  "save changes": "Enregistrer",
  "save changes and invite guests": "Enregistrer et envoyer les invitations",
  "guests": "Invités",
  "from": "De",
  "to": "à",
  "no description": "Le titre est obligatoire",
  "no summary": "Le titre est obligatoire",
  "start after end": "La fin est après le début.",
  "invalid start date": "Le début est invalide.",
  "invalid end date": "La fin est invalide.",
  "invalid trigg date": "Le moment est invalide.",
  "invalid action": "L'action est invalide.",
  "synchronization": "Synchronisation",
  "mobile sync": "Synchro Mobile (CalDAV)",
  "import an ical file": "Pour importer un fichier iCal dans votre agenda, cliquez sur ce bouton :",
  "link imported events with calendar": "Lier les événements à importer avec le calendrier suivant:",
  "download a copy of your calendar": "Pour télécharger une copie de votre calendrier sur votre ordinateur comme un fichier iCal, cliquez sur ce bouton :",
  "icalendar export": "Export ICalendar",
  "icalendar import": "Import ICalendar",
  "to sync your cal with": "Pour synchronisez votre calendrier avec votre mobile vous devez :",
  "install the webdav module": "Installer le module WebDAV depuis l'applithèque.",
  "connect to it and follow": "Vous connectez et suivre les instructions relatives à CalDAV.",
  "some event fail to save": "La sauvegarde d'un événement a échouée.",
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
  'Dec': 'Déc'
};
});

;require.register("models/alarm", function(exports, require, module) {
var Alarm, ScheduleItem, helpers,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

helpers = require('../helpers');

ScheduleItem = require('./scheduleitem');

module.exports = Alarm = (function(_super) {
  __extends(Alarm, _super);

  function Alarm() {
    return Alarm.__super__.constructor.apply(this, arguments);
  }

  Alarm.prototype.fcEventType = 'alarm';

  Alarm.prototype.startDateField = 'trigg';

  Alarm.prototype.urlRoot = 'alarms';

  Alarm.prototype.defaults = function() {
    return {
      description: '',
      title: '',
      place: '',
      tags: ['my calendar']
    };
  };

  Alarm.prototype.parse = function(attrs) {
    if (attrs.id === "undefined") {
      delete attrs.id;
    }
    return attrs;
  };

  Alarm.prototype.validate = function(attrs, options) {
    var errors, _ref;
    errors = [];
    if (!attrs.description || attrs.description === "") {
      errors.push({
        field: 'description',
        value: "no summary"
      });
    }
    if ((_ref = !attrs.action) === 'DISPLAY' || _ref === 'EMAIL' || _ref === 'BOTH') {
      errors.push({
        field: 'action',
        value: "invalid action"
      });
    }
    if (!attrs.trigg || !moment(attrs.start).isValid()) {
      errors.push({
        field: 'triggdate',
        value: "invalid trigg date"
      });
    }
    if (errors.length > 0) {
      return errors;
    }
  };

  Alarm.prototype.getDefaultColor = function() {
    return '#00C67A';
  };

  return Alarm;

})(ScheduleItem);
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
      description: '',
      title: '',
      place: '',
      tags: ['my calendar']
    };
  };

  Event.prototype.setStart = function(setObj) {
    var edo, sdo;
    sdo = this.getStartDateObject();
    edo = this.getEndDateObject();
    this._setDate(setObj, sdo, this.startDateField);
    if (sdo >= edo) {
      edo = sdo.clone().add('hour', 1);
      return this.set(this.endDateField, edo.toISOString());
    }
  };

  Event.prototype.setEnd = function(setObj) {
    var edo, sdo;
    sdo = this.getStartDateObject();
    edo = this.getEndDateObject();
    this._setDate(setObj, edo, this.endDateField);
    if (sdo >= edo) {
      sdo = edo.clone().add('hour', -1);
      return this.set(this.startDateField, sdo.toISOString());
    }
  };

  Event.prototype._setDate = function(setObj, dateObj, dateField) {
    var unit, value;
    for (unit in setObj) {
      value = setObj[unit];
      dateObj.set(unit, value);
    }
    return this.set(dateField, dateObj.toISOString());
  };

  Event.prototype.addToStart = function(duration) {
    return this.set(this.startDateField, this.getStartDateObject().add(duration).toISOString());
  };

  Event.prototype.addToEnd = function(duration) {
    return this.set(this.endDateField, this.getEndDateObject().add(duration).toISOString());
  };

  Event.prototype.validate = function(attrs, options) {
    var end, errors, start;
    errors = [];
    if (!attrs.description) {
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

;require.register("models/scheduleitem", function(exports, require, module) {
var ScheduleItem, colorHash,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

colorHash = require('lib/colorhash');

module.exports = ScheduleItem = (function(_super) {
  __extends(ScheduleItem, _super);

  function ScheduleItem() {
    return ScheduleItem.__super__.constructor.apply(this, arguments);
  }

  ScheduleItem.prototype.fcEventType = 'unknown';

  ScheduleItem.prototype.startDateField = '';

  ScheduleItem.prototype.endDateField = false;

  ScheduleItem.dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00";

  ScheduleItem.prototype.initialize = function() {
    var _ref;
    if (!((_ref = this.get('tags')) != null ? _ref.length : void 0)) {
      return this.set('tags', ['my calendar']);
    }
  };

  ScheduleItem.prototype.getCalendar = function() {
    var _ref;
    return (_ref = this.get('tags')) != null ? _ref[0] : void 0;
  };

  ScheduleItem.prototype.getDefaultColor = function() {
    return 'grey';
  };

  ScheduleItem.prototype.getColor = function() {
    var tag;
    tag = this.getCalendar();
    if (!tag) {
      return this.getDefaultColor();
    }
    return colorHash(tag);
  };

  ScheduleItem.prototype._toTimezonedMoment = function(utcDateStr) {
    return moment.tz(utcDateStr, window.app.timezone);
  };

  ScheduleItem.prototype.getDateObject = function() {
    return this._toTimezonedMoment(this.get(this.startDateField));
  };

  ScheduleItem.prototype.getStartDateObject = function() {
    return this.getDateObject();
  };

  ScheduleItem.prototype.getEndDateObject = function() {
    if (this.endDateField) {
      return this._toTimezonedMoment(this.get(this.endDateField));
    } else {
      return this.getDateObject().add('m', 30);
    }
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
    return this.getDateObject().format('{yyyy}{MM}{dd}');
  };

  ScheduleItem.prototype.getPreviousDateObject = function() {
    var previous;
    previous = this.previous(this.startDateField) != null;
    if (previous) {
      return Date.create(previous);
    } else {
      return false;
    }
  };

  ScheduleItem.prototype.getPreviousDateHash = function() {
    var previous;
    previous = this.getPreviousDateObject();
    if (previous) {
      return previous.format('{yyyy}{MM}{dd}');
    } else {
      return false;
    }
  };

  ScheduleItem.prototype.getRRuleObject = function() {
    var e, options;
    try {
      options = RRule.parseString(this.get('rrule'));
      options.dtstart = this.getStartDateObject();
      return new RRule(options);
    } catch (_error) {
      e = _error;
      return false;
    }
  };

  ScheduleItem.prototype.isRecurrent = function() {
    return this.has('rrule') && this.get('rrule') !== '';
  };

  ScheduleItem.prototype.getRecurrentFCEventBetween = function(start, end) {
    var eventTimezone, events, fces, fixDSTTroubles, jsDateBoundE, jsDateBoundS, jsDateEventS, mDateEventE, mDateEventS, options, rrule;
    events = [];
    if (!this.isRecurrent()) {
      return events;
    }
    jsDateBoundS = start.toDate();
    jsDateBoundE = end.toDate();
    eventTimezone = this.get('timezone');
    mDateEventS = moment.tz(this.get(this.startDateField), eventTimezone);
    mDateEventE = moment.tz(this.get(this.endDateField), eventTimezone);
    jsDateEventS = new Date(mDateEventS.toISOString());
    options = RRule.parseString(this.get('rrule'));
    options.dtstart = jsDateEventS;
    rrule = new RRule(options);
    fixDSTTroubles = function(jsDateRecurrentS) {
      var diff, mDateRecurrentS;
      mDateRecurrentS = moment.tz(jsDateRecurrentS.toISOString(), eventTimezone);
      diff = mDateEventS.hour() - mDateRecurrentS.hour();
      if (diff === 23) {
        diff = -1;
      } else if (diff === -23) {
        diff = 1;
      }
      mDateRecurrentS.add('hour', diff);
      return mDateRecurrentS;
    };
    fces = rrule.between(jsDateBoundS, jsDateBoundE).map((function(_this) {
      return function(jsDateRecurrentS) {
        var fce, mDateRecurrentE, mDateRecurrentS;
        mDateRecurrentS = fixDSTTroubles(jsDateRecurrentS);
        mDateRecurrentE = mDateRecurrentS.clone().add('seconds', mDateEventE.diff(mDateEventS, 'seconds'));
        fce = _this._toFullCalendarEvent(mDateRecurrentS, mDateRecurrentE);
        return fce;
      };
    })(this));
    return fces;
  };

  ScheduleItem.prototype.isOneDay = function() {
    return false;
  };

  ScheduleItem.prototype.isInRange = function(start, end) {
    var edo, sdo;
    sdo = this.getStartDateObject();
    edo = this.getEndDateObject();
    return (sdo.isAfter(start) && sdo.isBefore(end)) || (edo.isAfter(start) && edo.isBefore(end)) || (sdo.isBefore(start) && edo.isAfter(end));
  };

  ScheduleItem.prototype.toPunctualFullCalendarEvent = function() {
    return this._toFullCalendarEvent(this.getStartDateObject(), this.getEndDateObject());
  };

  ScheduleItem.prototype._toFullCalendarEvent = function(start, end) {
    var fcEvent;
    return fcEvent = {
      id: this.cid,
      title: "" + (start.format("HH:mm")) + " " + (this.get("description")),
      start: start,
      end: end,
      allDay: false,
      diff: this.get("diff"),
      place: this.get('place'),
      timezone: this.get('timezone'),
      timezoneHour: this.get('timezoneHour'),
      type: this.fcEventType,
      backgroundColor: this.getColor(),
      borderColor: this.getColor()
    };
  };

  ScheduleItem.ambiguousToTimezoned = function(ambigM) {
    return moment.tz(ambigM, window.app.timezone);
  };

  return ScheduleItem;

})(Backbone.Model);
});

;require.register("router", function(exports, require, module) {
var CalendarView, DayBucketCollection, EventModal, ImportView, ListView, Router, SyncView, app,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

app = require('application');

ListView = require('views/list_view');

CalendarView = require('views/calendar_view');

EventModal = require('views/event_modal');

ImportView = require('views/import_view');

SyncView = require('views/sync_view');

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
    'sync': 'sync',
    'calendar': 'backToCalendar'
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

  Router.prototype.sync = function() {
    this.displayView(new SyncView);
    app.menu.activate('sync');
    return this.onCalendar = false;
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
        alarms: app.alarms,
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
      res = view.start.format('MMMM YYYY');
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

;require.register("views/calendar_popover", function(exports, require, module) {
var Alarm, BaseView, ComboBox, Event, EventModal, PopOver, RRuleFormView, Toggle,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

RRuleFormView = require('views/event_modal_rrule');

EventModal = require('views/event_modal');

ComboBox = require('views/widgets/combobox');

Toggle = require('views/toggle');

Alarm = require('models/alarm');

Event = require('models/event');

module.exports = PopOver = (function(_super) {
  __extends(PopOver, _super);

  function PopOver() {
    this.handleError = __bind(this.handleError, this);
    this.adjustTimePickers = __bind(this.adjustTimePickers, this);
    this.updateMapLink = __bind(this.updateMapLink, this);
    this.onAddClicked = __bind(this.onAddClicked, this);
    this.onRemoveClicked = __bind(this.onRemoveClicked, this);
    this.getModelAttributes = __bind(this.getModelAttributes, this);
    this.onAdvancedClicked = __bind(this.onAdvancedClicked, this);
    return PopOver.__super__.constructor.apply(this, arguments);
  }

  PopOver.prototype.template = require('./templates/popover_content');

  PopOver.prototype.events = {
    'keyup input': 'onKeyUp',
    'change select': 'onKeyUp',
    'change input': 'onKeyUp',
    'change #input-place': 'updateMapLink',
    'click .add': 'onAddClicked',
    'click .advanced-link': 'onAdvancedClicked',
    'click .remove': 'onRemoveClicked',
    'click #toggle-type': 'onTabClicked',
    'click .close': 'selfclose'
  };

  PopOver.prototype.initialize = function(options) {
    if (options.type) {
      this.type = options.type;
      this.model = this.makeNewModel(options);
    } else if (this.model) {
      this.type = this.model instanceof Event ? 'event' : 'alarm';
    }
    this.target = options.target;
    this.container = options.container;
    return this.parentView = options.parentView;
  };

  PopOver.prototype.selfclose = function() {
    var _base;
    if (typeof (_base = this.parentView).onPopoverClose === "function") {
      _base.onPopoverClose();
    }
    return this.close();
  };

  PopOver.prototype.close = function() {
    this.target.popover('destroy');
    this.target.data('popover', void 0);
    return this.remove();
  };

  PopOver.prototype.render = function() {
    this.target.popover({
      selector: true,
      trigger: 'manual',
      title: require('./templates/popover_title')(this.getRenderData()),
      html: true,
      placement: this.getDirection(),
      content: this.template(this.getRenderData())
    }).popover('show');
    this.setElement($('#view-container .popover'));
    return this.afterRender();
  };

  PopOver.prototype.afterRender = function() {
    var inputDiff, inputEnd, inputStart, tzInput, _ref, _ref1;
    this.addButton = this.$('.btn.add').text(this.getButtonText());
    this.removeButton = this.$('.remove');
    if (this.model.isNew()) {
      this.removeButton.hide();
    }
    this.$('input[type="time"]').attr('type', 'text').timepicker({
      template: false,
      minuteStep: 5,
      showMeridian: false
    });
    this.$('.focused').focus();
    inputEnd = this.$('#input-end');
    inputStart = this.$('#input-start');
    inputDiff = this.$('#input-diff');
    inputStart.on('timepicker.next', (function(_this) {
      return function() {
        return inputEnd.focus();
      };
    })(this));
    inputEnd.on('timepicker.next', (function(_this) {
      return function() {
        return inputDiff.focus();
      };
    })(this));
    inputEnd.on('timepicker.prev', (function(_this) {
      return function() {
        return inputStart.focus().timepicker('highlightMinute');
      };
    })(this));
    inputDiff.on('keydown', (function(_this) {
      return function(ev) {
        if (ev.keyCode === 37) {
          inputEnd.focus().timepicker('highlightMinute');
        }
        if (ev.keyCode === 39) {
          return _this.$('#input-desc').focus();
        }
      };
    })(this));
    inputStart.on('changeTime.timepicker', (function(_this) {
      return function(ev) {
        return _this.adjustTimePickers('start', ev.time.value);
      };
    })(this));
    inputEnd.on('changeTime.timepicker', (function(_this) {
      return function(ev) {
        return _this.adjustTimePickers('end', ev.time.value);
      };
    })(this));
    if (this.type === 'alarm') {
      tzInput = this.$('#input-timezone');
      this.actionMail = new Toggle({
        icon: 'envelope',
        label: 'email notification',
        value: (_ref = this.model.get('action')) === 'EMAIL' || _ref === 'BOTH'
      });
      this.actionNotif = new Toggle({
        icon: 'exclamation-sign',
        label: 'home notification',
        value: (_ref1 = this.model.get('action')) === 'DISPLAY' || _ref1 === 'BOTH'
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
      tzInput.after(this.actionMail.$el);
      tzInput.after(this.actionNotif.$el);
    }
    if (this.model.get('rrule')) {
      this.rruleForm = new RRuleFormView({
        model: this.model
      });
      this.rruleForm.render();
      this.$('#rrule-container').append(this.rruleForm.$el);
      this.$('#rrule-action').hide();
      this.$('#rrule-short i.icon-arrow-right').hide();
    }
    this.calendar = new ComboBox({
      el: this.$('#calendarcombo'),
      small: true,
      source: app.tags.calendars()
    });
    return this.updateMapLink();
  };

  PopOver.prototype.getTitle = function() {
    var title;
    title = this.model.isNew() ? this.type + ' creation' : 'edit ' + this.type;
    return t(title);
  };

  PopOver.prototype.getDirection = function() {
    var fitBottom, fitLeft, fitRight, pos;
    pos = this.target.position();
    fitRight = pos.left + this.target.width() + 411 < this.container.width();
    fitLeft = pos.left - 411 > 0;
    fitBottom = pos.top + this.target.height() + 200 < this.container.height();
    if (!fitLeft && !fitRight) {
      if (fitBottom) {
        return 'bottom';
      } else {
        return 'top';
      }
    } else if (fitRight) {
      return 'right';
    } else {
      return 'left';
    }
  };

  PopOver.prototype.getButtonText = function() {
    if (this.model.isNew()) {
      return t('create');
    } else {
      return t('edit');
    }
  };

  PopOver.prototype.getRenderData = function() {
    var data, diff, endDate, startDate, _ref;
    data = _.extend({
      type: this.type
    }, this.model.attributes, {
      title: this.getTitle(),
      editionMode: !this.model.isNew(),
      advancedUrl: this.parentView.getUrlHash() + '/' + this.model.id
    });
    data.calendar = ((_ref = data.tags) != null ? _ref[0] : void 0) || '';
    if (this.model instanceof Event) {
      endDate = this.model.getEndDateObject();
      startDate = this.model.getStartDateObject();
      if (!this.model.isOneDay()) {
        diff = endDate - startDate;
        diff = Math.round(diff / 1000 / 3600 / 24);
      }
      data.start = startDate.format('{HH}:{mm}');
      data.end = endDate.format('{HH}:{mm}');
      if (data.start === '00:00') {
        data.start = '10:00';
      }
      if (data.end === '00:00') {
        data.end = '18:00';
      }
      data.diff = diff || 0;
    } else {
      data.time = this.model.get('timezoneHour');
      data.timezones = require('helpers/timezone').timezones;
    }
    return data;
  };

  PopOver.prototype.makeNewModel = function(options) {
    switch (this.type) {
      case 'event':
        return new Event({
          start: options.start.format(Event.dateFormat, 'en-en'),
          end: options.end.format(Event.dateFormat, 'en-en'),
          description: '',
          place: ''
        });
      case 'alarm':
        return new Alarm({
          trigg: options.start.format(Alarm.dateFormat, 'en-en'),
          timezone: 'Europe/Paris',
          description: '',
          action: 'DISPLAY'
        });
      default:
        throw new Error('wrong type');
    }
  };

  PopOver.prototype.onTabClicked = function(event) {
    return this.parentView.showPopover({
      type: this.type === 'event' ? 'alarm' : 'event',
      target: this.options.target,
      start: this.options.start,
      end: this.options.end
    });
  };

  PopOver.prototype.onAdvancedClicked = function(event) {
    var modal;
    if (this.model.isNew()) {
      this.model.set(this.getModelAttributes());
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

  PopOver.prototype.onKeyUp = function(event) {
    if (event.keyCode === 13 || event.which === 13) {
      return this.addButton.click();
    } else if (event.keyCode === 27) {
      return this.selfclose();
    } else {
      return this.addButton.removeClass('disabled');
    }
  };

  PopOver.prototype.formatDate = function(relativeTo, value) {
    var all, date, diff, hours, minutes, splitted;
    date = Date.create(relativeTo);
    splitted = value.match(/([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/);
    if (splitted && splitted[0]) {
      all = splitted[0], hours = splitted[1], minutes = splitted[2], diff = splitted[3];
      date.set({
        hours: +hours,
        minutes: +minutes
      });
      if (diff) {
        date.advance({
          days: +diff
        });
      }
    }
    return date;
  };

  PopOver.prototype.getModelAttributes = function() {
    var action, data, date, end, endDate, startDate, _ref;
    if (this.model instanceof Event) {
      date = this.model.getStartDateObject();
      startDate = this.formatDate(date, this.$('#input-start').val());
      end = this.$('#input-end').val() + '+' + this.$('#input-diff').val();
      endDate = this.formatDate(date, end);
      data = {
        start: startDate.format(Event.dateFormat, 'en-en'),
        end: endDate.format(Event.dateFormat, 'en-en'),
        place: this.$('#input-place').val(),
        description: this.$('#input-desc').val()
      };
    } else {
      action = this.actionNotif.value && this.actionMail.value ? 'BOTH' : this.actionMail.value ? 'EMAIL' : 'DISPLAY';
      data = {
        timezone: this.$('#input-timezone').val(),
        timezoneHour: this.$('#input-time').val(),
        description: this.$('#input-desc').val(),
        action: action
      };
      if ((_ref = this.rruleForm) != null ? _ref.hasRRule() : void 0) {
        data.rrule = this.rruleForm.getRRule().toString();
      } else {
        data.rrule = "";
      }
    }
    data.tags = [this.calendar.value()];
    return data;
  };

  PopOver.prototype.onRemoveClicked = function() {
    this.removeButton.css('width', '42px');
    this.removeButton.spin('tiny');
    if (confirm('Are you sure ?')) {
      return this.model.destroy({
        wait: true,
        error: function() {
          return alert('server error occured');
        },
        complete: (function(_this) {
          return function() {
            _this.removeButton.spin();
            _this.removeButton.css('width', '14px');
            return _this.selfclose();
          };
        })(this)
      });
    } else {
      return this.removeButton.spin();
    }
  };

  PopOver.prototype.onAddClicked = function() {
    var err, validModel, _i, _len, _ref, _results;
    if (this.$('.btn.add').hasClass('disabled')) {
      return;
    }
    this.addButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    this.addButton.spin('small');
    validModel = this.model.save(this.getModelAttributes(), {
      wait: true,
      success: (function(_this) {
        return function() {
          var collection;
          collection = app[_this.type + 's'];
          return collection.add(_this.model);
        };
      })(this),
      error: (function(_this) {
        return function() {
          return alert('server error occured');
        };
      })(this),
      complete: (function(_this) {
        return function() {
          _this.addButton.spin(false);
          _this.addButton.html(_this.getButtonText());
          return _this.selfclose();
        };
      })(this)
    });
    if (!validModel) {
      this.addButton.html(this.getButtonText());
      this.addButton.spin();
      this.$('.alert').remove();
      this.$('input').css('border-color', '');
      _ref = this.model.validationError;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        err = _ref[_i];
        _results.push(this.handleError(err));
      }
      return _results;
    }
  };

  PopOver.prototype.updateMapLink = function() {
    var btn, url, value;
    value = encodeURIComponent(this.$('#input-place').val());
    btn = this.$('#showmap');
    if (value) {
      url = "http://www.openstreetmap.org/search?query=" + value;
      return btn.show().attr('href', url);
    } else {
      return btn.hide();
    }
  };

  PopOver.prototype.adjustTimePickers = function(changed, newvalue) {
    var bde, bds, date, diff, end, endDate, newEnd, newStart, oneday, start, startDate;
    date = this.model.getStartDateObject();
    start = this.$('#input-start').val();
    end = this.$('#input-end').val();
    diff = parseInt(this.$('#input-diff').val());
    startDate = this.formatDate(date, start);
    endDate = this.formatDate(date, end + '+' + diff);
    if (changed === 'start') {
      newStart = this.formatDate(date, newvalue);
      newEnd = endDate.clone();
      if (newStart.is(newEnd) || newStart.isAfter(newEnd)) {
        newEnd = newStart.clone().addHours(1);
      }
    } else if (changed === 'end') {
      newStart = startDate.clone();
      newEnd = this.formatDate(date, newvalue + '+' + diff);
      if (endDate.getHours() === 23 && newEnd.getHours() === 0) {
        newEnd.addDays(1);
      } else if (endDate.getHours() === 0 && newEnd.getHours() === 23) {
        newEnd.addDays(-1);
      }
      if (newStart.is(newEnd) || newStart.isAfter(newEnd)) {
        newStart = newEnd.clone().addHours(-1);
        if (newStart.getHours() === 0) {
          newStart.beginningOfDay();
        }
      }
    } else if (changed === 'diff') {
      if (newStart.is(newEnd) || newStart.isAfter(newEnd)) {
        newEnd = newStart.clone().addHours(1);
      }
    }
    if (newEnd.short() === newStart.short()) {
      diff = 0;
    } else {
      oneday = 1000 * 3600 * 24;
      bde = newEnd.clone().beginningOfDay();
      bds = newStart.clone().beginningOfDay();
      console.log("HERE", diff, (bde - bds) / oneday);
      diff = Math.round((bde - bds) / oneday);
    }
    this.$('#input-start').val(newStart.format('{HH}:{mm}'));
    this.$('#input-end').val(newEnd.format('{HH}:{mm}'));
    this.$('#input-diff').val(diff);
    return true;
  };

  PopOver.prototype.handleError = function(error) {
    var alertMsg, guiltyFields;
    switch (error.field) {
      case 'description':
        guiltyFields = '#input-desc';
        break;
      case 'startdate':
        guiltyFields = '#input-start';
        break;
      case 'enddate':
        guiltyFields = '#input-end';
        break;
      case 'triggdate':
        guiltyFields = '#input-time';
        break;
      case 'date':
        guiltyFields = '#input-start, #input-end';
    }
    this.$(guiltyFields).css('border-color', 'red');
    this.$(guiltyFields).focus();
    alertMsg = $('<div class="alert"></div>').text(t(error.value));
    return this.$('.popover-content').before(alertMsg);
  };

  return PopOver;

})(BaseView);
});

;require.register("views/calendar_popover_alarm", function(exports, require, module) {
var Alarm, AlarmPopOver, ComboBox, PopoverView, RRuleFormView, Toggle,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

PopoverView = require('../lib/popover_view');

RRuleFormView = require('views/event_modal_rrule');

ComboBox = require('views/widgets/combobox');

Toggle = require('views/toggle');

Alarm = require('models/alarm');

module.exports = AlarmPopOver = (function(_super) {
  __extends(AlarmPopOver, _super);

  function AlarmPopOver() {
    this.handleError = __bind(this.handleError, this);
    this.onAddClicked = __bind(this.onAddClicked, this);
    this.onRemoveClicked = __bind(this.onRemoveClicked, this);
    this.getModelAttributes = __bind(this.getModelAttributes, this);
    return AlarmPopOver.__super__.constructor.apply(this, arguments);
  }

  AlarmPopOver.prototype.titleTemplate = require('./templates/popover_title');

  AlarmPopOver.prototype.template = require('./templates/popover_alarm');

  AlarmPopOver.prototype.dtFormat = "HH:mm";

  AlarmPopOver.prototype.events = {
    'keyup input': 'onKeyUp',
    'change select': 'onKeyUp',
    'change input': 'onKeyUp',
    'click .add': 'onAddClicked',
    'click .remove': 'onRemoveClicked',
    'click #toggle-type': 'onTabClicked',
    'click .close': 'selfclose'
  };

  AlarmPopOver.prototype.initialize = function(options) {
    if (!this.model) {
      this.model = new Alarm({
        trigg: options.start.toISOString(),
        timezone: 'Europe/Paris',
        description: '',
        action: 'DISPLAY'
      });
    }
    AlarmPopOver.__super__.initialize.call(this, options);
    return this.options = options;
  };

  AlarmPopOver.prototype.afterRender = function() {
    var inputTime, _ref, _ref1;
    this.addButton = this.$('.btn.add').text(this.getButtonText());
    this.removeButton = this.$('.remove');
    if (this.model.isNew()) {
      this.removeButton.hide();
    }
    this.$('input[type="time"]').attr('type', 'text').timepicker({
      template: false,
      minuteStep: 5,
      showMeridian: false
    });
    this.$('.focused').focus();
    this.actionMail = new Toggle({
      icon: 'envelope',
      label: 'email notification',
      value: (_ref = this.model.get('action')) === 'EMAIL' || _ref === 'BOTH'
    });
    this.actionNotif = new Toggle({
      icon: 'exclamation-sign',
      label: 'home notification',
      value: (_ref1 = this.model.get('action')) === 'DISPLAY' || _ref1 === 'BOTH'
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
    inputTime = this.$('#input-time');
    inputTime.after(this.actionMail.$el);
    inputTime.after(this.actionNotif.$el);
    return this.calendar = new ComboBox({
      el: this.$('#calendarcombo'),
      small: true,
      source: app.tags.calendars()
    });
  };

  AlarmPopOver.prototype.getTitle = function() {
    var title;
    title = this.model.isNew() ? this.type + ' creation' : 'edit ' + this.type;
    return t(title);
  };

  AlarmPopOver.prototype.getDirection = function() {
    var fitBottom, fitLeft, fitRight, pos;
    pos = this.target.position();
    fitRight = pos.left + this.target.width() + 411 < this.container.width();
    fitLeft = pos.left - 411 > 0;
    fitBottom = pos.top + this.target.height() + 200 < this.container.height();
    if (!fitLeft && !fitRight) {
      if (fitBottom) {
        return 'bottom';
      } else {
        return 'top';
      }
    } else if (fitRight) {
      return 'right';
    } else {
      return 'left';
    }
  };

  AlarmPopOver.prototype.getButtonText = function() {
    if (this.model.isNew()) {
      return t('create');
    } else {
      return t('edit');
    }
  };

  AlarmPopOver.prototype.getRenderData = function() {
    var data, _ref;
    data = {
      model: this.model,
      dtFormat: this.dtFormat,
      editionMode: !this.model.isNew(),
      calendar: ((_ref = this.model.attributes.tags) != null ? _ref[0] : void 0) || ''
    };
    return data;
    return data;
  };

  AlarmPopOver.prototype.onTabClicked = function(event) {
    return this.parentView.showPopover({
      type: 'event',
      target: this.options.target,
      start: this.options.start,
      end: this.options.end
    });
  };

  AlarmPopOver.prototype.onKeyUp = function(event) {
    if (event.keyCode === 13 || event.which === 13) {
      return this.addButton.click();
    } else if (event.keyCode === 27) {
      return this.selfclose();
    } else {
      return this.addButton.removeClass('disabled');
    }
  };

  AlarmPopOver.prototype.formatDateTime = function(dtStr) {
    var setObj, splitted;
    splitted = dtStr.match(/([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/);
    if (splitted && splitted[0]) {
      setObj = {
        hour: splitted[1],
        minute: splitted[2]
      };
      return setObj;
    }
  };

  AlarmPopOver.prototype.getModelAttributes = function() {
    var action, data, trigg, unit, value, _ref;
    action = this.actionNotif.value && this.actionMail.value ? 'BOTH' : this.actionMail.value ? 'EMAIL' : 'DISPLAY';
    trigg = this.model.getStartDateObject();
    console.log(trigg);
    _ref = this.formatDateTime($('#input-time').val());
    for (unit in _ref) {
      value = _ref[unit];
      trigg.set(unit, value);
    }
    console.log(trigg);
    data = {
      timezone: window.app.timezone,
      trigg: trigg,
      description: this.$('#input-desc').val(),
      action: action
    };
    data.tags = [this.calendar.value()];
    return data;
  };

  AlarmPopOver.prototype.onRemoveClicked = function() {
    this.removeButton.css('width', '42px');
    this.removeButton.spin('tiny');
    if (confirm('Are you sure ?')) {
      return this.model.destroy({
        wait: true,
        error: function() {
          return alert('server error occured');
        },
        complete: (function(_this) {
          return function() {
            _this.removeButton.spin();
            _this.removeButton.css('width', '14px');
            return _this.selfclose();
          };
        })(this)
      });
    } else {
      return this.removeButton.spin();
    }
  };

  AlarmPopOver.prototype.onAddClicked = function() {
    var err, validModel, _i, _len, _ref, _results;
    if (this.$('.btn.add').hasClass('disabled')) {
      return;
    }
    this.addButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    this.addButton.spin('small');
    validModel = this.model.save(this.getModelAttributes(), {
      wait: true,
      success: (function(_this) {
        return function() {
          var collection;
          collection = app.alarms;
          return collection.add(_this.model);
        };
      })(this),
      error: (function(_this) {
        return function() {
          return alert('server error occured');
        };
      })(this),
      complete: (function(_this) {
        return function() {
          _this.addButton.spin(false);
          _this.addButton.html(_this.getButtonText());
          return _this.selfclose();
        };
      })(this)
    });
    if (!validModel) {
      this.addButton.html(this.getButtonText());
      this.addButton.spin();
      this.$('.alert').remove();
      this.$('input').css('border-color', '');
      _ref = this.model.validationError;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        err = _ref[_i];
        _results.push(this.handleError(err));
      }
      return _results;
    }
  };

  AlarmPopOver.prototype.handleError = function(error) {
    var alertMsg, guiltyFields;
    switch (error.field) {
      case 'description':
        guiltyFields = '#input-desc';
        break;
      case 'startdate':
        guiltyFields = '#input-start';
        break;
      case 'enddate':
        guiltyFields = '#input-end';
        break;
      case 'triggdate':
        guiltyFields = '#input-time';
        break;
      case 'date':
        guiltyFields = '#input-start, #input-end';
    }
    this.$(guiltyFields).css('border-color', 'red');
    this.$(guiltyFields).focus();
    alertMsg = $('<div class="alert"></div>').text(t(error.value));
    return this.$('.popover-content').before(alertMsg);
  };

  return AlarmPopOver;

})(PopoverView);
});

;require.register("views/calendar_popover_event", function(exports, require, module) {
var Alarm, ComboBox, Event, EventModal, EventPopOver, PopoverView, RRuleFormView, Toggle,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

PopoverView = require('../lib/popover_view');

RRuleFormView = require('views/event_modal_rrule');

EventModal = require('views/event_modal');

ComboBox = require('views/widgets/combobox');

Toggle = require('views/toggle');

Alarm = require('models/alarm');

Event = require('models/event');

module.exports = EventPopOver = (function(_super) {
  __extends(EventPopOver, _super);

  function EventPopOver() {
    this.handleError = __bind(this.handleError, this);
    this.refresh = __bind(this.refresh, this);
    this.updateMapLink = __bind(this.updateMapLink, this);
    this.selfclose = __bind(this.selfclose, this);
    this.onAddClicked = __bind(this.onAddClicked, this);
    this.onRemoveClicked = __bind(this.onRemoveClicked, this);
    this.onAdvancedClicked = __bind(this.onAdvancedClicked, this);
    return EventPopOver.__super__.constructor.apply(this, arguments);
  }

  EventPopOver.prototype.titleTemplate = require('./templates/popover_title');

  EventPopOver.prototype.template = require('./templates/popover_event');

  EventPopOver.prototype.dtFormat = "HH:mm";

  EventPopOver.prototype.events = {
    'keyup input': 'onKeyUp',
    'change select': 'onKeyUp',
    'change input': 'onKeyUp',
    'change #input-place': 'updateMapLink',
    'click .add': 'onAddClicked',
    'click .advanced-link': 'onAdvancedClicked',
    'click .remove': 'onRemoveClicked',
    'click #toggle-type': 'onTabClicked',
    'click .close': 'selfclose',
    'changeTime.timepicker #input-start': 'onSetStart',
    'changeTime.timepicker #input-end': 'onSetEnd',
    'input #input-desc': 'onSetDesc'
  };

  EventPopOver.prototype.initialize = function(options) {
    if (!this.model) {
      this.model = this.makeNewModel(options);
    }
    EventPopOver.__super__.initialize.call(this, options);
    this.listenTo(this.model, 'change', this.refresh);
    return this.options = options;
  };

  EventPopOver.prototype.afterRender = function() {
    var inputDiff, inputEnd, inputStart;
    this.addButton = this.$('.btn.add');
    this.removeButton = this.$('.remove');
    if (this.model.isNew()) {
      this.removeButton.hide();
    }
    this.$('input[type="time"]').attr('type', 'text').timepicker({
      template: false,
      minuteStep: 5,
      showMeridian: false
    });
    this.$('.focused').focus();
    inputEnd = this.$('#input-end');
    inputStart = this.$('#input-start');
    inputDiff = this.$('#input-diff');
    inputStart.on('timepicker.next', (function(_this) {
      return function() {
        return inputEnd.focus();
      };
    })(this));
    inputEnd.on('timepicker.next', (function(_this) {
      return function() {
        return inputDiff.focus();
      };
    })(this));
    inputEnd.on('timepicker.prev', (function(_this) {
      return function() {
        return inputStart.focus().timepicker('highlightMinute');
      };
    })(this));
    inputDiff.on('keydown', (function(_this) {
      return function(ev) {
        if (ev.keyCode === 37) {
          inputEnd.focus().timepicker('highlightMinute');
        }
        if (ev.keyCode === 39) {
          return _this.$('#input-desc').focus();
        }
      };
    })(this));
    if (this.model.get('rrule')) {
      this.rruleForm = new RRuleFormView({
        model: this.model
      });
      this.rruleForm.render();
      this.$('#rrule-container').append(this.rruleForm.$el);
      this.$('#rrule-action').hide();
      this.$('#rrule-short i.icon-arrow-right').hide();
    }
    this.calendar = new ComboBox({
      el: this.$('#calendarcombo'),
      small: true,
      source: app.tags.calendars()
    });
    this.updateMapLink();
    return this.refresh();
  };

  EventPopOver.prototype.getTitle = function() {
    var title;
    title = this.model.isNew() ? this.type + ' creation' : 'edit ' + this.type;
    return t(title);
  };

  EventPopOver.prototype.getDirection = function() {
    var fitBottom, fitLeft, fitRight, pos;
    pos = this.target.position();
    fitRight = pos.left + this.target.width() + 411 < this.container.width();
    fitLeft = pos.left - 411 > 0;
    fitBottom = pos.top + this.target.height() + 200 < this.container.height();
    if (!fitLeft && !fitRight) {
      if (fitBottom) {
        return 'bottom';
      } else {
        return 'top';
      }
    } else if (fitRight) {
      return 'right';
    } else {
      return 'left';
    }
  };

  EventPopOver.prototype.getRenderData = function() {
    var data, _ref;
    data = {
      model: this.model,
      dtFormat: this.dtFormat,
      editionMode: !this.model.isNew(),
      advancedUrl: this.parentView.getUrlHash() + '/' + this.model.id,
      calendar: ((_ref = this.model.attributes.tags) != null ? _ref[0] : void 0) || ''
    };
    return data;
  };

  EventPopOver.prototype.onSetStart = function(ev) {
    return this.model.setStart(this.formatDateTime(ev.time.value));
  };

  EventPopOver.prototype.onSetEnd = function(ev) {
    return this.model.setEnd(this.formatDateTime(ev.time.value));
  };

  EventPopOver.prototype.onSetDesc = function(ev) {
    return this.model.set('description', ev.target.value);
  };

  EventPopOver.prototype.makeNewModel = function(options) {
    return new Event({
      start: options.start.toISOString(),
      end: options.end.toISOString(),
      description: '',
      place: ''
    });
  };

  EventPopOver.prototype.onTabClicked = function(event) {
    return this.parentView.showPopover({
      type: 'alarm',
      target: this.options.target,
      start: this.options.start,
      end: this.options.end
    });
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
      return this.addButton.click();
    } else if (event.keyCode === 27) {
      return this.selfclose();
    } else {
      return this.addButton.removeClass('disabled');
    }
  };

  EventPopOver.prototype.formatDateTime = function(dtStr) {
    var setObj, splitted;
    splitted = dtStr.match(/([0-9]{1,2}):([0-9]{2})\+?([0-9]*)/);
    if (splitted && splitted[0]) {
      setObj = {
        hour: splitted[1],
        minute: splitted[2]
      };
      return setObj;
    }
  };

  EventPopOver.prototype.onRemoveClicked = function() {
    this.removeButton.css('width', '42px');
    this.removeButton.spin('tiny');
    if (confirm('Are you sure ?')) {
      return this.model.destroy({
        wait: true,
        error: function() {
          return alert('server error occured');
        },
        complete: (function(_this) {
          return function() {
            _this.removeButton.spin();
            _this.removeButton.css('width', '14px');
            return _this.selfclose();
          };
        })(this)
      });
    } else {
      return this.removeButton.spin();
    }
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
            var collection;
            collection = app['events'];
            return collection.add(_this.model);
          };
        })(this),
        error: (function(_this) {
          return function() {
            return alert('server error occured');
          };
        })(this),
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
    return this.model.fetch({
      complete: EventPopOver.__super__.selfclose.apply(this, arguments)
    });
  };

  EventPopOver.prototype.updateMapLink = function() {
    var btn, url, value;
    value = encodeURIComponent(this.$('#input-place').val());
    btn = this.$('#showmap');
    if (value) {
      url = "http://www.openstreetmap.org/search?query=" + value;
      return btn.show().attr('href', url);
    } else {
      return btn.hide();
    }
  };

  EventPopOver.prototype.refresh = function() {
    console.log("fraicheur de vivre");
    this.$('#input-start').val(this.model.getStartDateObject().format(this.dtFormat));
    return this.$('#input-end').val(this.model.getEndDateObject().format(this.dtFormat));
  };

  EventPopOver.prototype.handleError = function(error) {
    var alertMsg, guiltyFields;
    switch (error.field) {
      case 'description':
        guiltyFields = '#input-desc';
        break;
      case 'startdate':
        guiltyFields = '#input-start';
        break;
      case 'enddate':
        guiltyFields = '#input-end';
        break;
      case 'triggdate':
        guiltyFields = '#input-time';
        break;
      case 'date':
        guiltyFields = '#input-start, #input-end';
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
var Alarm, AlarmPopover, BaseView, CalendarView, Event, EventPopover, Header, Popover, app, helpers, timezones,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

app = require('application');

BaseView = require('../lib/base_view');

Popover = require('./calendar_popover');

EventPopover = require('./calendar_popover_event');

AlarmPopover = require('./calendar_popover_alarm');

Header = require('./calendar_header');

helpers = require('helpers');

timezones = require('helpers/timezone').timezones;

Alarm = require('models/alarm');

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
    this.alarmCollection = this.model.alarms;
    this.listenTo(this.alarmCollection, 'add', this.refresh);
    this.listenTo(this.alarmCollection, 'reset', this.refresh);
    this.listenTo(this.alarmCollection, 'remove', this.onRemove);
    this.listenTo(this.alarmCollection, 'change', this.refreshOne);
    this.eventCollection = this.model.events;
    this.listenTo(this.eventCollection, 'add', this.refresh);
    this.listenTo(this.eventCollection, 'reset', this.refresh);
    this.listenTo(this.eventCollection, 'remove', this.onRemove);
    this.listenTo(this.eventCollection, 'change', this.refreshOne);
    this.model = null;
    this.tagsCollection = app.tags;
    return this.listenTo(this.tagsCollection, 'change', this.refresh);
  };

  CalendarView.prototype.afterRender = function() {
    var debounced, locale, source;
    locale = moment.localeData();
    this.cal = this.$('#alarms');
    this.view = this.options.view;
    this.cal.fullCalendar({
      lang: window.locale,
      header: false,
      editable: true,
      firstDay: 1,
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
      axisFormat: "H:mm",
      allDaySlot: false,
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
    source = this.eventCollection.getFCEventSource(this.tagsCollection);
    this.cal.fullCalendar('addEventSource', source);
    source = this.alarmCollection.getFCEventSource(this.tagsCollection);
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
    this.calHeader.on('list', (function(_this) {
      return function() {
        return app.router.navigate('list', {
          trigger: true
        });
      };
    })(this));
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
    var targetHeight;
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
    return this.cal.height(this.$('.fc-header').height() + this.$('.fc-view-container').height());
  };

  CalendarView.prototype.refresh = function(collection) {
    console.log("refresh");
    return this.cal.fullCalendar('refetchEvents');
  };

  CalendarView.prototype.onRemove = function(model) {
    return this.cal.fullCalendar('removeEvents', model.cid);
  };

  CalendarView.prototype.refreshOne = function(model) {
    var data, fcEvent;
    console.log("refreshOne");
    if (this.popover) {
      return;
    }
    if (model.isRecurrent()) {
      return this.refresh();
    }
    data = model.toPunctualFullCalendarEvent();
    fcEvent = this.cal.fullCalendar('clientEvents', data.id)[0];
    _.extend(fcEvent, data);
    return this.cal.fullCalendar('updateEvent', fcEvent);
  };

  CalendarView.prototype.showPopover = function(options) {
    console.log("show popover");
    options.container = this.cal;
    options.parentView = this;
    console.log(options);
    if (this.popover) {
      this.popover.close();
    }
    this.popover = options.type === 'event' ? new EventPopover(options) : new AlarmPopover(options);
    return this.popover.render();
  };

  CalendarView.prototype.onChangeView = function(view) {
    var hash, start, _ref;
    if ((_ref = this.calHeader) != null) {
      _ref.render();
    }
    if (this.view !== view.name) {
      this.handleWindowResize();
    }
    this.view = view.name;
    start = view.start;
    hash = this.view === 'month' ? start.format('[month]/YYYY/M') : start.format('[week]/YYYY/M/D');
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
    console.log(jsEvent);
    console.log(view);
    return this.showPopover({
      type: 'alarm',
      start: Event.ambiguousToTimezoned(startDate),
      end: Event.ambiguousToTimezoned(endDate),
      target: $(jsEvent.target)
    });
  };

  CalendarView.prototype.onPopoverClose = function() {
    this.cal.fullCalendar('unselect');
    this.popover = null;
    return this.refresh();
  };

  CalendarView.prototype.onEventRender = function(event, element) {
    var icon, spinTarget;
    if ((event.isSaving != null) && event.isSaving) {
      spinTarget = $(element).find('.fc-event-time');
      spinTarget.addClass('spinning');
      spinTarget.html("&nbsp;");
      spinTarget.spin("tiny");
    }
    $(element).attr('title', event.title);
    if (event.type === 'alarm') {
      icon = '<i class="icon-bell icon-white"></i>';
      element.find('.fc-title').prepend(icon);
    }
    return element;
  };

  CalendarView.prototype.onEventDragStop = function(event, jsEvent, ui, view) {
    return event.isSaving = true;
  };

  CalendarView.prototype.onEventDrop = function(fcEvent, delta, revertFunc, jsEvent, ui, view) {
    var alarm, evt, trigg;
    if (fcEvent.type === 'alarm') {
      alarm = this.alarmCollection.get(fcEvent.id);
      trigg = alarm.getDateObject().clone().advance({
        days: dayDelta,
        minutes: minuteDelta
      });
      return alarm.save({
        trigg: trigg.format(Alarm.dateFormat, 'en-en'),
        timezoneHour: false
      }, {
        wait: true,
        success: (function(_this) {
          return function() {
            fcEvent.isSaving = false;
            return _this.cal.fullCalendar('renderEvent', fcEvent);
          };
        })(this),
        error: (function(_this) {
          return function() {
            fcEvent.isSaving = false;
            return revertFunc();
          };
        })(this)
      });
    } else {
      evt = this.eventCollection.get(fcEvent.id);
      evt.addToStart(delta);
      evt.addToEnd(delta);
      return evt.save({}, {
        wait: true,
        success: (function(_this) {
          return function() {
            return fcEvent.isSaving = false;
          };
        })(this),
        error: (function(_this) {
          return function() {
            fcEvent.isSaving = false;
            return revertFunc();
          };
        })(this)
      });
    }
  };

  CalendarView.prototype.onEventResizeStop = function(fcEvent, jsEvent, ui, view) {
    return fcEvent.isSaving = true;
  };

  CalendarView.prototype.onEventResize = function(fcEvent, delta, revertFunc, jsEvent, ui, view) {
    var model;
    if (fcEvent.type === "alarm") {
      fcEvent.isSaving = false;
      this.cal.fullCalendar('renderEvent', fcEvent);
      revertFunc();
      return;
    }
    model = this.eventCollection.get(fcEvent.id);
    model.addToEnd(delta);
    return model.save({}, {
      wait: true,
      success: (function(_this) {
        return function() {
          return fcEvent.isSaving = false;
        };
      })(this),
      error: (function(_this) {
        return function() {
          fcEvent.isSaving = false;
          return revertFunc();
        };
      })(this)
    });
  };

  CalendarView.prototype.onEventClick = function(fcEvent, jsEvent, view) {
    var model;
    if ($(jsEvent.target).hasClass('ui-resizable-handle')) {
      return true;
    }
    model = (function() {
      if (fcEvent.type === 'alarm') {
        return this.alarmCollection.get(fcEvent.id);
      } else if (fcEvent.type === 'event') {
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
var ComboBox, Event, EventModal, RRuleFormView, TagsView, ViewCollection, app, random,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('lib/view_collection');

RRuleFormView = require('views/event_modal_rrule');

TagsView = require('views/tags');

ComboBox = require('views/widgets/combobox');

Event = require('models/event');

random = require('lib/random');

app = require('application');

module.exports = EventModal = (function(_super) {
  __extends(EventModal, _super);

  function EventModal() {
    this.remove = __bind(this.remove, this);
    this.close = __bind(this.close, this);
    this.configureGuestTypeahead = __bind(this.configureGuestTypeahead, this);
    this.handleError = __bind(this.handleError, this);
    this.save = __bind(this.save, this);
    this.resizeDescription = __bind(this.resizeDescription, this);
    this.refreshGuestList = __bind(this.refreshGuestList, this);
    this.onGuestAdded = __bind(this.onGuestAdded, this);
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

  EventModal.prototype.inputDateFormat = '{year}-{MM}-{dd}';

  EventModal.prototype.exportDateFormat = '{year}-{MM}-{dd}-{HH}-{mm}';

  EventModal.prototype.collectionEl = '#guests-list';

  EventModal.prototype.itemview = require('./event_modal_guest');

  EventModal.prototype.initialize = function(options) {
    var guests;
    guests = this.model.get('attendees') || [];
    this.collection = new Backbone.Collection(guests);
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
      'keypress #basic-description': 'resizeDescription'
    };
  };

  EventModal.prototype.afterRender = function() {
    EventModal.__super__.afterRender.apply(this, arguments);
    this.addGuestField = this.configureGuestTypeahead();
    this.startField = this.$('#basic-start').attr('type', 'text');
    this.startField.datetimepicker({
      autoclose: true,
      format: 'dd/mm/yyyy hh:ii',
      pickerPosition: 'bottom-left',
      viewSelect: 4
    });
    this.endField = this.$('#basic-end').attr('type', 'text');
    this.endField.datetimepicker({
      autoclose: true,
      format: 'dd/mm/yyyy hh:ii',
      pickerPosition: 'bottom-left',
      viewSelect: 4
    });
    this.descriptionField = this.$('#basic-description');
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
      source: app.tags.calendars()
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
    var data, _ref, _ref1;
    data = _.extend({}, this.model.toJSON(), {
      summary: this.model.get('description'),
      description: this.model.get('details'),
      start: this.model.getStartDateObject().format(this.inputDateTimeFormat),
      end: this.model.getEndDateObject().format(this.inputDateTimeFormat),
      exportdate: this.model.getStartDateObject().format(this.exportDateFormat)
    });
    data.calendar = ((_ref = data.tags) != null ? _ref[0] : void 0) || '';
    data.tags = ((_ref1 = data.tags) != null ? _ref1.slice(1) : void 0) || [];
    return data;
  };

  EventModal.prototype.save = function() {
    var data, error, validModel, _i, _len, _ref, _results;
    data = {
      details: this.descriptionField.val(),
      description: this.$('#basic-summary').val(),
      place: this.$('#basic-place').val(),
      tags: [this.$('#basic-calendar').val()].concat(this.tags.getTags())
    };
    if (this.rruleForm.hasRRule()) {
      data.rrule = this.rruleForm.getRRule().toString();
      data.timezone = window.app.timezone;
      data.start = moment.tz(this.startField.val(), this.inputDateTimeFormat, window.app.timezone).format("YYYY-MM-DD[T]HH:mm:ss");
      data.end = moment.tz(this.endField.val(), this.inputDateTimeFormat, window.app.timezone).format("YYYY-MM-DD[T]HH:mm:ss");
    } else {
      data.rrule = '';
      data.start = moment.tz(this.startField.val(), this.inputDateTimeFormat, window.app.timezone).toISOString();
      data.end = moment.tz(this.endField.val(), this.inputDateTimeFormat, window.app.timezone).toISOString();
    }
    validModel = this.model.save(data, {
      wait: true,
      success: (function(_this) {
        return function() {
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
      _ref = this.model.validationError;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        error = _ref[_i];
        _results.push(this.handleError(error));
      }
      return _results;
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

  return GuestView;

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

  RRuleView.prototype.inputDateFormat = moment.localeData()._longDateFormat.L;

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
      format: 'dd/mm/yyyy',
      minView: 2
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
      console.log("options.until");
      console.log(options.until);
      rrule.endMode = 'until';
      rrule.until = moment(options.until).format(this.inputDateFormat);
      rrule.count = "";
    } else if (options.count) {
      rrule.endMode = 'count';
      rrule.count = options.count;
      rrule.until = "";
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
    var RRuleWdays, day, monthmode, options, start, wk;
    start = this.model.getStartDateObject();
    RRuleWdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
    options = {
      dtstart: start.toDate(),
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
        console.log(this.$('#rrule-until').val());
        options.until = moment(this.$('#rrule-until').val(), this.inputDateFormat).toDate();
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
    if (event.target.id === "rrule-count") {
      this.$('#rrule-until').val('');
      radio[1].checked = true;
    } else if (event.target.id === "rrule-until") {
      this.$('#rrule-count').val('');
      radio[2].checked = true;
    }
    return this.updateHelp();
  };

  RRuleView.prototype.updateHelp = function() {
    var freq, language, locale;
    freq = this.$('#rrule-freq').val();
    if (freq === 'NOREPEAT') {
      this.$('#rrule').hide();
      this.$('#rrule-action').show();
      this.$('#rrule-help').html(t('no recurrence'));
      return;
    } else {
      freq = +freq;
    }
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

;require.register("views/import_alarm_list", function(exports, require, module) {
var AlarmCollection, AlarmList, AlarmView, ViewCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('../lib/view_collection');

AlarmView = require('./import_alarm_view');

AlarmCollection = require('../collections/alarms');

module.exports = AlarmList = (function(_super) {
  __extends(AlarmList, _super);

  function AlarmList() {
    return AlarmList.__super__.constructor.apply(this, arguments);
  }

  AlarmList.prototype.itemview = AlarmView;

  AlarmList.prototype.collection = new AlarmCollection();

  return AlarmList;

})(ViewCollection);
});

;require.register("views/import_alarm_view", function(exports, require, module) {
var AlarmView, BaseView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

module.exports = AlarmView = (function(_super) {
  __extends(AlarmView, _super);

  function AlarmView() {
    return AlarmView.__super__.constructor.apply(this, arguments);
  }

  AlarmView.prototype.tagName = 'div';

  AlarmView.prototype.className = 'alarm';

  AlarmView.prototype.template = require('./templates/import_alarm');

  AlarmView.prototype.getRenderData = function() {
    return _.extend(this.model.toJSON(), {
      time: this.model.getFormattedDate('{yyyy}/{MM}/{dd} {HH}:{mm}'),
      description: this.model.get('description')
    });
  };

  return AlarmView;

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
      start: this.model.getFormattedStartDate('{yyyy}/{MM}/{dd} {HH}:{mm}'),
      end: this.model.getFormattedEndDate('{yyyy}/{MM}/{dd} {HH}:{mm}')
    });
  };

  return EventView;

})(BaseView);
});

;require.register("views/import_view", function(exports, require, module) {
var Alarm, AlarmList, BaseView, ComboBox, Event, EventList, ImportView, helpers,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

ComboBox = require('views/widgets/combobox');

helpers = require('../helpers');

Alarm = require('../models/alarm');

AlarmList = require('./import_alarm_list');

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
    this.alarmList = new AlarmList({
      el: this.$("#import-alarm-list")
    });
    this.alarmList.render();
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
          source: app.tags.calendars()
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
    this.importButton.find('span').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    this.importButton.spin('tiny');
    return $.ajax({
      url: "import/ical",
      type: "POST",
      data: form,
      processData: false,
      contentType: false,
      success: (function(_this) {
        return function(result) {
          var alarm, valarm, vevent, _i, _j, _len, _len1, _ref, _ref1;
          if ((result != null ? result.alarms : void 0) != null) {
            _ref = result.alarms;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              valarm = _ref[_i];
              alarm = new Alarm(valarm, {
                parse: true
              });
              _this.alarmList.collection.add(alarm);
            }
          }
          if ((result != null ? result.events : void 0) != null) {
            _ref1 = result.events;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              vevent = _ref1[_j];
              event = new Event(vevent);
              _this.eventList.collection.add(event);
            }
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
    var calendar, counter, finish, onFaillure, onSuccess;
    calendar = this.calendarCombo.value();
    if ((calendar == null) || calendar === '') {
      calendar = 'my calendar';
    }
    counter = this.alarmList.collection.length + this.eventList.collection.length;
    onFaillure = (function(_this) {
      return function(model) {
        counter = counter - 1;
        alert(t('some event fail to save'));
        if (counter === 0) {
          return finish();
        }
      };
    })(this);
    onSuccess = (function(_this) {
      return function(model) {
        switch (model.constructor) {
          case Event:
            app.events.add(model);
            break;
          case Alarm:
            app.alarms.add(model);
        }
        counter = counter - 1;
        if (counter === 0) {
          return finish();
        }
      };
    })(this);
    finish = (function(_this) {
      return function() {
        _this.$(".confirmation").fadeOut();
        _this.$(".results").slideUp(function() {
          _this.$(".import-form").fadeIn();
          return _this.confirmButton.html(t('confirm import'));
        });
        _this.alarmList.collection.reset();
        _this.eventList.collection.reset();
        return app.router.navigate("calendar", true);
      };
    })(this);
    this.confirmButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    this.confirmButton.spin('tiny');
    this.alarmList.collection.each(function(alarm) {
      alarm.set('tags', [calendar]);
      return alarm.save(null, {
        success: onSuccess,
        error: onFaillure
      });
    });
    return this.eventList.collection.each(function(event) {
      event.set('tags', [calendar]);
      return event.save(null, {
        success: onSuccess,
        error: onFaillure
      });
    });
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
    this.showbefore = __bind(this.showbefore, this);
    return ListView.__super__.constructor.apply(this, arguments);
  }

  ListView.prototype.id = 'view-container';

  ListView.prototype.template = require('./templates/list_view');

  ListView.prototype.itemview = require('./list_view_bucket');

  ListView.prototype.collectionEl = '#alarm-list';

  ListView.prototype.events = {
    'click .showbefore': 'showbefore'
  };

  ListView.prototype.afterRender = function() {
    this.calHeader = new Header();
    this.$('#alarm-list').prepend(this.calHeader.render().$el);
    this.calHeader.on('month', (function(_this) {
      return function() {
        return app.router.navigate('', {
          trigger: true
        });
      };
    })(this));
    this.calHeader.on('week', (function(_this) {
      return function() {
        return app.router.navigate('week', {
          trigger: true
        });
      };
    })(this));
    return ListView.__super__.afterRender.apply(this, arguments);
  };

  ListView.prototype.appendView = function(view) {
    var el, index, prevCid, today;
    index = this.collection.indexOf(view.model);
    el = view.$el;
    today = (new Date()).beginningOfDay();
    if (view.model.get('date').isBefore(today)) {
      el.addClass('before').hide();
    } else {
      el.addClass('after');
    }
    if (index === 0) {
      return this.calHeader.$el.after(el);
    } else {
      prevCid = this.collection.at(index - 1).cid;
      return this.views[prevCid].$el.after(el);
    }
  };

  ListView.prototype.showbefore = function() {
    var body, first;
    first = this.$('.after').first();
    body = $('html, body');
    this.$('.before').slideDown({
      progress: function() {
        return body.scrollTop(first.offset().top);
      }
    });
    return this.$('.showbefore').fadeOut();
  };

  return ListView;

})(ViewCollection);
});

;require.register("views/list_view_bucket", function(exports, require, module) {
var BucketView, Popover, ViewCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('../lib/view_collection');

Popover = require('./calendar_popover');

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
      date: this.model.get('date').format('short')
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
    this.popover = new Popover(options);
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
var AlarmView, BaseView, Event, Popover, colorHash,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

Popover = require('./calendar_popover');

Event = require('../models/event');

colorHash = require('lib/colorhash');

module.exports = AlarmView = (function(_super) {
  __extends(AlarmView, _super);

  function AlarmView() {
    return AlarmView.__super__.constructor.apply(this, arguments);
  }

  AlarmView.prototype.className = 'scheduleElement';

  AlarmView.prototype.template = require('./templates/list_view_item');

  AlarmView.prototype.events = {
    'click .icon-pencil': 'editMode',
    'click .icon-trash': 'deleteModel'
  };

  AlarmView.prototype.initialize = function() {
    this.listenTo(this.model, "change", this.render);
    return this.listenTo(app.tags, 'change:visible', this.render);
  };

  AlarmView.prototype.deleteModel = function() {
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

  AlarmView.prototype.editMode = function() {
    if (this.popover) {
      this.popover.close();
    }
    this.popover = new Popover({
      model: this.model,
      target: this.$el,
      parentView: this,
      container: $('body')
    });
    return this.popover.render();
  };

  AlarmView.prototype.getUrlHash = function() {
    return 'list';
  };

  AlarmView.prototype.getRenderData = function() {
    var data, tag;
    data = this.model.toJSON();
    tag = this.model.getCalendar();
    data.color = tag ? colorHash(tag) : '';
    if (this.model instanceof Event) {
      _.extend(data, {
        type: 'event',
        start: this.model.getFormattedStartDate('{HH}:{mm}'),
        end: this.model.getFormattedEndDate('{HH}:{mm}')
      });
    } else {
      _.extend(data, {
        type: 'alarm',
        time: this.model.getFormattedDate('{HH}:{mm}')
      });
    }
    return data;
  };

  return AlarmView;

})(BaseView);
});

;require.register("views/menu", function(exports, require, module) {
var MenuView, ViewCollection,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ViewCollection = require('../lib/view_collection');

module.exports = MenuView = (function(_super) {
  __extends(MenuView, _super);

  function MenuView() {
    return MenuView.__super__.constructor.apply(this, arguments);
  }

  MenuView.prototype.tagName = 'ul';

  MenuView.prototype.id = 'menu';

  MenuView.prototype.className = 'container nav nav-list';

  MenuView.prototype.collectionEl = '#menuitems';

  MenuView.prototype.template = require('./templates/menu');

  MenuView.prototype.itemview = require('views/menu_item');

  MenuView.prototype.events = function() {
    return {
      'click .calendars': 'toggleDropdown'
    };
  };

  MenuView.prototype.activate = function(href) {
    this.$('.active').removeClass('active');
    return this.$('a[href="#' + href + '"]').parent().addClass('active');
  };

  MenuView.prototype.toggleDropdown = function() {
    return this.$('#menuitems').toggleClass('visible');
  };

  MenuView.prototype.addItem = function(model) {
    if (model.get('type') !== 'calendar') {
      return;
    }
    return MenuView.__super__.addItem.apply(this, arguments);
  };

  return MenuView;

})(ViewCollection);
});

;require.register("views/menu_item", function(exports, require, module) {
var BaseView, Event, MenuItemView, Popover, colorhash,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

Popover = require('./calendar_popover');

Event = require('../models/event');

colorhash = require('lib/colorhash');

module.exports = MenuItemView = (function(_super) {
  __extends(MenuItemView, _super);

  function MenuItemView() {
    return MenuItemView.__super__.constructor.apply(this, arguments);
  }

  MenuItemView.prototype.tagName = 'li';

  MenuItemView.prototype.className = 'tagmenuitem';

  MenuItemView.prototype.template = require('./templates/menu_item');

  MenuItemView.prototype.events = {
    'click': 'toggleVisible'
  };

  MenuItemView.prototype.toggleVisible = function() {
    if (!app.router.onCalendar) {
      app.router.navigate('calendar', true);
    }
    this.model.set('visible', !this.model.get('visible'));
    return this.render();
  };

  MenuItemView.prototype.getRenderData = function() {
    return {
      label: this.model.get('label'),
      color: colorhash(this.model.get('label')),
      visible: this.model.get('visible')
    };
  };

  return MenuItemView;

})(BaseView);
});

;require.register("views/sync_view", function(exports, require, module) {
var BaseView, ImportView, SyncView,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('../lib/base_view');

ImportView = require('./import_view');

module.exports = SyncView = (function(_super) {
  __extends(SyncView, _super);

  function SyncView() {
    return SyncView.__super__.constructor.apply(this, arguments);
  }

  SyncView.prototype.id = 'view-container';

  SyncView.prototype.template = require('./templates/sync_view');

  SyncView.prototype.afterRender = function() {
    return this.$('#importviewplaceholder').append(new ImportView().render().$el);
  };

  return SyncView;

})(BaseView);
});

;require.register("views/tags", function(exports, require, module) {
var BaseView, TagsView, colorHash,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

colorHash = require('lib/colorhash');

module.exports = TagsView = (function(_super) {
  __extends(TagsView, _super);

  function TagsView() {
    this.refresh = __bind(this.refresh, this);
    this.tagAdded = __bind(this.tagAdded, this);
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
    return ui.tag.css('background-color', colorHash(ui.tagLabel));
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
var locals_ = (locals || {}),calendarMode = locals_.calendarMode,active = locals_.active,todaytxt = locals_.todaytxt,title = locals_.title;
buf.push("<tbody><tr><td class=\"fc-header-left\">");
if ( calendarMode)
{
buf.push("<span class=\"fc-button fc-button-prev fc-corner-left\"><span class=\"fc-text-arrow\">‹</span></span><span class=\"fc-button fc-button-next fc-corner-right\"><span class=\"fc-text-arrow\">›</span></span><span class=\"fc-header-space\"></span><span" + (jade.cls(['fc-button','fc-button-today',active('today')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = todaytxt) ? "" : jade_interp)) + "</span>");
}
buf.push("</td><td class=\"fc-header-center\"><span class=\"fc-header-title\"><h2>" + (jade.escape(null == (jade_interp = title) ? "" : jade_interp)) + "</h2></span></td><td class=\"fc-header-right\"><span" + (jade.cls(['fc-button','fc-button-month',active('month')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('month')) ? "" : jade_interp)) + "</span><span" + (jade.cls(['fc-button','fc-button-week',active('week')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('week')) ? "" : jade_interp)) + "</span><span" + (jade.cls(['fc-button','fc-button-list',active('list')], [null,null,true])) + ">" + (jade.escape(null == (jade_interp = t('list')) ? "" : jade_interp)) + "</span></td></tr></tbody>");;return buf.join("");
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
var locals_ = (locals || {}),id = locals_.id,exportdate = locals_.exportdate,summary = locals_.summary,start = locals_.start,end = locals_.end,place = locals_.place,calendar = locals_.calendar,tags = locals_.tags,description = locals_.description;
buf.push("<div class=\"modal-header\"><span>" + (jade.escape(null == (jade_interp = t('edit event')) ? "" : jade_interp)) + "</span>&nbsp;");
if ( typeof id != "undefined")
{
buf.push("<a" + (jade.attr("href", "events/" + (id) + "/" + (exportdate) + ".ics", true, false)) + "><i class=\"fa fa-download fa-1\"></i></a>");
}
buf.push("<button class=\"close\">&times;</button></div><div class=\"modal-body\"><form id=\"basic\" class=\"form-inline\"><div class=\"row-fluid\"><div class=\"control-group span12\"><label for=\"basic-summary\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('summary')) ? "" : jade_interp)) + "</label><div class=\"controls\"><input id=\"basic-summary\" type=\"text\"" + (jade.attr("value", summary, true, false)) + " class=\"span12\"/></div></div></div><div class=\"row-fluid\"><div class=\"control-group span6 date\"><label for=\"basic-start\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('start')) ? "" : jade_interp)) + "</label><br/><input id=\"basic-start\" type=\"datetime-local\"" + (jade.attr("value", start, true, false)) + " class=\"span12\"/></div><div class=\"control-group span6 date\"><label for=\"basic-end\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('end')) ? "" : jade_interp)) + "</label><br/><input id=\"basic-end\" type=\"datetime-local\"" + (jade.attr("value", end, true, false)) + " class=\"span12\"/></div></div><div class=\"row-fluid\"><div class=\"control-group span12\"><label for=\"basic-place\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('place')) ? "" : jade_interp)) + "</label><div class=\"controls\"><input id=\"basic-place\" type=\"text\"" + (jade.attr("value", place, true, false)) + " class=\"span12\"/></div></div></div><div class=\"row-fluid\"><div class=\"control-group span12\"><label for=\"basic-calendar\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('calendar')) ? "" : jade_interp)) + "</label><div class=\"controls\"><input id=\"basic-calendar\"" + (jade.attr("value", calendar, true, false)) + "/></div></div><div style=\"display:none;\" class=\"control-group span8\"><label for=\"basic-tags\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('tags')) ? "" : jade_interp)) + "</label><div class=\"controls\"><input id=\"basic-tags\"" + (jade.attr("value", tags.join(','), true, false)) + " class=\"span12 tagit\"/></div></div></div><div class=\"row-fluid\"><div class=\"control-group span12\"><label for=\"basic-description\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('description')) ? "" : jade_interp)) + "</label><div class=\"controls\"><textarea id=\"basic-description\" class=\"span12\">" + (jade.escape(null == (jade_interp = description) ? "" : jade_interp)) + "</textarea></div></div></div></form><div id=\"guests-block\"><h4>" + (jade.escape(null == (jade_interp = t('guests')) ? "" : jade_interp)) + "</h4><form id=\"guests\" class=\"form-inline\"><div class=\"control-group\"><div class=\"controls\"><input id=\"addguest-field\" type=\"text\"" + (jade.attr("placeholder", t('enter email'), true, false)) + "/><a id=\"addguest\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('invite')) ? "" : jade_interp)) + "</a></div></div></form><div id=\"guests-list\"></div><h4>" + (jade.escape(null == (jade_interp = t('recurrence')) ? "" : jade_interp)) + "</h4><div id=\"rrule-container\"></div></div></div><div class=\"modal-footer\"><a id=\"cancel-btn\">" + (jade.escape(null == (jade_interp = t("cancel")) ? "" : jade_interp)) + "</a>&nbsp;<a id=\"confirm-btn\" class=\"btn\">" + (jade.escape(null == (jade_interp = t("save changes")) ? "" : jade_interp)) + "</a></div>");;return buf.join("");
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
buf.push("<i class=\"icon-ok-circle green\"></i>");
}
else if ( model.status == 'DECLINED')
{
buf.push("<i class=\"icon-ban-circle red\"></i>");
}
else if ( model.status == 'NEED-ACTION')
{
buf.push("<i class=\"icon-time blue\"></i>");
}
buf.push("&nbsp;" + (jade.escape((jade_interp = model.email) == null ? '' : jade_interp)) + "</p>");;return buf.join("");
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
buf.push("<p id=\"rrule-short\"><i class=\"icon-arrow-right\"></i><span id=\"rrule-help\"></span><span id=\"rrule-action\">&nbsp;-&nbsp;<a class=\"rrule-show\">" + (jade.escape(null == (jade_interp = t('Edit')) ? "" : jade_interp)) + "</a></span></p><form id=\"rrule\" class=\"form-inline\"><label for=\"rrule-interval\" class=\"control-label\">" + (jade.escape(null == (jade_interp = t('repeat every')) ? "" : jade_interp)) + "</label><div class=\"control-group\"><input id=\"rrule-interval\" type=\"number\" min=\"1\"" + (jade.attr("value", rrule.interval, true, false)) + " class=\"col-xs2 input-mini\"/><select id=\"rrule-freq\"><option value=\"NOREPEAT\"" + (jade.attr("selected", freqSelected('NOREPEAT'), true, false)) + ">" + (jade.escape(null == (jade_interp = t('no recurrence')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.DAILY, true, false)) + (jade.attr("selected", freqSelected(RRule.DAILY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('day')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.WEEKLY, true, false)) + (jade.attr("selected", freqSelected(RRule.WEEKLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('week')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.MONTHLY, true, false)) + (jade.attr("selected", freqSelected(RRule.MONTHLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('month')) ? "" : jade_interp)) + "</option><option" + (jade.attr("value", RRule.YEARLY, true, false)) + (jade.attr("selected", freqSelected(RRule.YEARLY), true, false)) + ">" + (jade.escape(null == (jade_interp = t('year')) ? "" : jade_interp)) + "</option></select></div><div id=\"rrule-weekdays\"><label class=\"control-label\">" + (jade.escape(null == (jade_interp = t('repeat on')) ? "" : jade_interp)) + "</label><div class=\"control-group\"><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[1]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"1\"" + (jade.attr("checked", wkdaySelected(1), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[2]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"2\"" + (jade.attr("checked", wkdaySelected(2), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[3]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"3\"" + (jade.attr("checked", wkdaySelected(3), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[4]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"4\"" + (jade.attr("checked", wkdaySelected(4), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[5]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"5\"" + (jade.attr("checked", wkdaySelected(5), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[6]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"6\"" + (jade.attr("checked", wkdaySelected(6), true, false)) + "/></label><label class=\"checkbox inline\">" + (jade.escape(null == (jade_interp = weekDays[0]) ? "" : jade_interp)) + "<input type=\"checkbox\" value=\"0\"" + (jade.attr("checked", wkdaySelected(0), true, false)) + "/></label></div></div><div id=\"rrule-monthdays\" class=\"control-group\"><div class=\"controls\"><label class=\"checkbox inline\"><input type=\"radio\"" + (jade.attr("checked", yearModeIs('date'), true, false)) + " name=\"rrule-month-option\" value=\"date\"/>" + (jade.escape(null == (jade_interp = t('repeat on date')) ? "" : jade_interp)) + "</label><label class=\"checkbox inline\"><input type=\"radio\"" + (jade.attr("checked", yearModeIs('weekdate'), true, false)) + " name=\"rrule-month-option\" value=\"weekdate\"/>" + (jade.escape(null == (jade_interp = t('repeat on weekday')) ? "" : jade_interp)) + "</label></div></div><label for=\"rrule-until\">" + (jade.escape(null == (jade_interp = t('repeat')) ? "" : jade_interp)) + "</label><div class=\"control-group\"><label class=\"radio\"><input type=\"radio\" name=\"endMode\" value=\"forever\"" + (jade.attr("checked", endModeSelected('forever'), true, false)) + "/>" + (jade.escape(null == (jade_interp = t('forever')) ? "" : jade_interp)) + "</label></div><div class=\"control-group\"><label class=\"radio\"><input type=\"radio\" name=\"endMode\" value=\"count\"" + (jade.attr("checked", endModeSelected('count'), true, false)) + "/><label for=\"rrule-count\">" + (jade.escape(null == (jade_interp = t('after')) ? "" : jade_interp)) + "</label><input id=\"rrule-count\" type=\"number\" min=\"0\"" + (jade.attr("value", rrule.count, true, false)) + " class=\"input-mini\"/><label for=\"rrule-count\">" + (jade.escape(null == (jade_interp = t('occurences')) ? "" : jade_interp)) + "</label></label></div><div class=\"control-group\"><label class=\"radio\"><input type=\"radio\" name=\"endMode\" value=\"until\"" + (jade.attr("checked", endModeSelected('until'), true, false)) + "/><label for=\"rrule-count\">" + (jade.escape(null == (jade_interp = t('until')) ? "" : jade_interp)) + "</label><input id=\"rrule-until\" type=\"date\"" + (jade.attr("value", rrule.until, true, false)) + "/></label></div></form>");;return buf.join("");
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

;require.register("views/templates/import_alarm", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),time = locals_.time,description = locals_.description,action = locals_.action;
buf.push("<p>" + (jade.escape((jade_interp = time) == null ? '' : jade_interp)) + "\n" + (jade.escape((jade_interp = description) == null ? '' : jade_interp)) + " (" + (jade.escape((jade_interp = action) == null ? '' : jade_interp)) + ")</p>");;return buf.join("");
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
buf.push("<p>" + (jade.escape((jade_interp = start) == null ? '' : jade_interp)) + " - " + (jade.escape((jade_interp = end) == null ? '' : jade_interp)) + "\n" + (jade.escape((jade_interp = description) == null ? '' : jade_interp)) + " (" + (jade.escape((jade_interp = place) == null ? '' : jade_interp)) + ")</p>");;return buf.join("");
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

buf.push("<div id=\"import-form\" class=\"well\"><div class=\"import-calendar-selection mb2\"><span>" + (jade.escape(null == (jade_interp = t('link imported events with calendar')) ? "" : jade_interp)) + "</span><br/><input id=\"import-calendar-combo\" class=\"mt1\"/></div><p>" + (jade.escape(null == (jade_interp = t('import an ical file') ) ? "" : jade_interp)) + "</p><div class=\"import-form\"><div id=\"import-button\" class=\"btn\"><span>" + (jade.escape(null == (jade_interp = t('select an icalendar file')) ? "" : jade_interp)) + "</span><input id=\"import-file-input\" type=\"file\"/></div></div><div class=\"confirmation\"><button id=\"confirm-import-button\" class=\"btn\">" + (jade.escape(null == (jade_interp = t('confirm import')) ? "" : jade_interp)) + "</button><button id=\"cancel-import-button\" class=\"btn\">" + (jade.escape(null == (jade_interp = t ('cancel')) ? "" : jade_interp)) + "</button></div><div class=\"results mt3\"><h4>" + (jade.escape(null == (jade_interp = t('Alarms to import')) ? "" : jade_interp)) + "</h4><div id=\"import-alarm-list\"></div><h4>" + (jade.escape(null == (jade_interp = t('Events to import')) ? "" : jade_interp)) + "</h4><div id=\"import-event-list\"></div></div></div>");;return buf.join("");
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

buf.push("<div id=\"alarm-list\" class=\"well\"></div><a class=\"btn showbefore\">" + (jade.escape(null == (jade_interp = t('display previous events')) ? "" : jade_interp)) + "</a>");;return buf.join("");
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
buf.push("<h2>" + (jade.escape((jade_interp = date) == null ? '' : jade_interp)) + "</h2><div class=\"alarms\"></div>");;return buf.join("");
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
var locals_ = (locals || {}),type = locals_.type,color = locals_.color,timezoneHour = locals_.timezoneHour,timezone = locals_.timezone,time = locals_.time,description = locals_.description,action = locals_.action,start = locals_.start,end = locals_.end;
if ( type == 'alarm')
{
buf.push("<p><span" + (jade.attr("style", "background-color:"+color+";", true, false)) + " class=\"badge\">&nbsp;</span>");
if ( typeof timezoneHour != 'undefined')
{
buf.push("<span" + (jade.attr("title", "" + (timezoneHour) + " - " + (timezone) + "", true, false)) + ">" + (jade.escape((jade_interp = time) == null ? '' : jade_interp)) + "</span>");
}
else
{
buf.push("<span>" + (jade.escape((jade_interp = time) == null ? '' : jade_interp)) + "</span>");
}
buf.push(" " + (jade.escape((jade_interp = description) == null ? '' : jade_interp)) + " (" + (jade.escape((jade_interp = t(action)) == null ? '' : jade_interp)) + ")<i class=\"icon-trash\"></i></p>");
}
else if ( type == 'event')
{
buf.push("<p><span" + (jade.attr("style", "background-color:"+color+";", true, false)) + " class=\"badge\">&nbsp;</span>" + (jade.escape((jade_interp = start) == null ? '' : jade_interp)) + " - " + (jade.escape((jade_interp = end) == null ? '' : jade_interp)) + "\n" + (jade.escape((jade_interp = description) == null ? '' : jade_interp)) + "<i class=\"icon-trash\"></i></p>");
};return buf.join("");
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

buf.push("<li><a href=\"#sync\"><i class=\"fa-refresh\"></i><span>" + (jade.escape(null == (jade_interp = t('Sync')) ? "" : jade_interp)) + "</span></a></li><li class=\"calendars\"><a href=\"#calendar\"><i class=\"fa-calendar\"></i><span>" + (jade.escape(null == (jade_interp = t('Calendar')) ? "" : jade_interp)) + "</span></a></li><ul id=\"menuitems\"></ul>");;return buf.join("");
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
var locals_ = (locals || {}),back = locals_.back,visible = locals_.visible,color = locals_.color,border = locals_.border,label = locals_.label;
back = visible?color:"transparent"
border = visible?"transparent":color
buf.push("<span" + (jade.attr("style", "background-color:" + back + "; border: 1px solid "+border+";", true, false)) + " class=\"badge true\">&nbsp;</span><span>" + (jade.escape(null == (jade_interp = label) ? "" : jade_interp)) + "</span>");;return buf.join("");
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

;require.register("views/templates/popover_alarm", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),model = locals_.model,dtFormat = locals_.dtFormat;
buf.push("<div class=\"line\"><input id=\"input-time\" type=\"time\"" + (jade.attr("value", model.getStartDateObject().format(dtFormat), true, false)) + " class=\"focused input-mini\"/></div><div class=\"line\"><input id=\"input-desc\" type=\"text\"" + (jade.attr("value", model.get('description'), true, false)) + (jade.attr("placeholder", t("alarm description placeholder"), true, false)) + " class=\"input-xlarge w100\"/></div><div class=\"line\"><div id=\"rrule-container\"></div></div><div class=\"popover-footer\"><a class=\"btn add\">" + (jade.escape(null == (jade_interp = t('Edit')) ? "" : jade_interp)) + "</a></div>");;return buf.join("");
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

;require.register("views/templates/popover_content", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
var locals_ = (locals || {}),type = locals_.type,time = locals_.time,timezones = locals_.timezones,timezone = locals_.timezone,description = locals_.description,start = locals_.start,end = locals_.end,diff = locals_.diff,place = locals_.place,advancedUrl = locals_.advancedUrl,editionMode = locals_.editionMode;
if ( type == 'alarm')
{
buf.push("<div class=\"line\"><input id=\"input-time\" type=\"time\"" + (jade.attr("value", time, true, false)) + " class=\"focused input-mini\"/><select id=\"input-timezone\" class=\"input\">");
// iterate timezones
;(function(){
  var $$obj = timezones;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var tz = $$obj[$index];

buf.push("<option" + (jade.attr("value", tz, true, false)) + (jade.attr("selected", (timezone == tz), true, false)) + ">" + (jade.escape(null == (jade_interp = tz) ? "" : jade_interp)) + "</option>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var tz = $$obj[$index];

buf.push("<option" + (jade.attr("value", tz, true, false)) + (jade.attr("selected", (timezone == tz), true, false)) + ">" + (jade.escape(null == (jade_interp = tz) ? "" : jade_interp)) + "</option>");
    }

  }
}).call(this);

buf.push("</select></div><div class=\"line\"><input id=\"input-desc\" type=\"text\"" + (jade.attr("value", description, true, false)) + (jade.attr("placeholder", t("alarm description placeholder"), true, false)) + " class=\"input-xlarge w100\"/></div><div class=\"line\"><div id=\"rrule-container\"></div></div><div class=\"popover-footer\"><a class=\"btn add\">" + (jade.escape(null == (jade_interp = t('Edit')) ? "" : jade_interp)) + "</a></div>");
}
else if ( type = 'event')
{
buf.push("<div class=\"line\"><span class=\"timeseparator\">" + (jade.escape(null == (jade_interp = t("from")) ? "" : jade_interp)) + "</span><input id=\"input-start\" type=\"time\"" + (jade.attr("value", start, true, false)) + (jade.attr("placeholder", t("From hours:minutes"), true, false)) + " class=\"focused input-mini\"/><span>&nbsp;</span><span class=\"timeseparator\">" + (jade.escape(null == (jade_interp = t("to")) ? "" : jade_interp)) + "</span><input id=\"input-end\" type=\"time\"" + (jade.attr("value", end, true, false)) + (jade.attr("placeholder", t("To hours:minutes+days"), true, false)) + " class=\"input-mini\"/><span>&nbsp;</span><input id=\"input-diff\" type=\"number\"" + (jade.attr("value", diff, true, false)) + " placeholder=\"0\" min=\"0\" class=\"col-xs2 input-mini\"/><span>&nbsp;</span><span class=\"timeseparator\">" + (jade.escape(null == (jade_interp = ' ' + t('days later')) ? "" : jade_interp)) + "</span></div><div class=\"line\"><input id=\"input-desc\" type=\"text\"" + (jade.attr("value", description, true, false)) + (jade.attr("placeholder", t("Summary"), true, false)) + " class=\"input\"/><input id=\"input-place\" type=\"text\"" + (jade.attr("value", place, true, false)) + (jade.attr("placeholder", t("Place"), true, false)) + " class=\"input-small\"/><a id=\"showmap\" target=\"_blank\" class=\"btn\"><i class=\"icon-white icon-map-marker\"></i></a></div><div class=\"popover-footer line\"><a" + (jade.attr("href", '#'+advancedUrl, true, false)) + " class=\"advanced-link\">" + (jade.escape(null == (jade_interp = t('advanced')) ? "" : jade_interp)) + "</a><span>&nbsp;</span><a class=\"btn add\">" + (jade.escape(null == (jade_interp = editionMode ? t('Edit') : t('Create')) ? "" : jade_interp)) + "</a></div>");
};return buf.join("");
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
var locals_ = (locals || {}),model = locals_.model,dtFormat = locals_.dtFormat,advancedUrl = locals_.advancedUrl;
buf.push("<div class=\"line\"><span class=\"timeseparator\">" + (jade.escape(null == (jade_interp = t("from")) ? "" : jade_interp)) + "</span><input id=\"input-start\" type=\"time\"" + (jade.attr("placeholder", t("From hours:minutes"), true, false)) + (jade.attr("value", model.getStartDateObject().format(dtFormat), true, false)) + " class=\"focused input-mini\"/><span>&nbsp;</span><span class=\"timeseparator\">" + (jade.escape(null == (jade_interp = t("to")) ? "" : jade_interp)) + "</span><input id=\"input-end\" type=\"time\"" + (jade.attr("placeholder", t("To hours:minutes+days"), true, false)) + (jade.attr("value", model.getEndDateObject().format(dtFormat), true, false)) + " class=\"input-mini\"/><span>&nbsp;</span></div><div class=\"line\"><input id=\"input-desc\" type=\"text\"" + (jade.attr("value", model.get("description"), true, false)) + (jade.attr("placeholder", t("Summary"), true, false)) + " class=\"input\"/><input id=\"input-place\" type=\"text\"" + (jade.attr("value", model.get("place"), true, false)) + (jade.attr("placeholder", t("Place"), true, false)) + " class=\"input-small\"/><a id=\"showmap\" target=\"_blank\" class=\"btn\"><i class=\"icon-white icon-map-marker\"></i></a></div><div class=\"popover-footer line\"><a" + (jade.attr("href", '#'+advancedUrl, true, false)) + " class=\"advanced-link\">" + (jade.escape(null == (jade_interp = t('advanced')) ? "" : jade_interp)) + "</a><span>&nbsp;</span><a class=\"btn add\">" + (jade.escape(null == (jade_interp = model.isNew() ? t('Create') : t('Edit')) ? "" : jade_interp)) + "</a></div>");;return buf.join("");
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
var locals_ = (locals || {}),calendar = locals_.calendar,editionMode = locals_.editionMode,model = locals_.model;
buf.push("<input id=\"calendarcombo\"" + (jade.attr("value", calendar, true, false)) + "/>");
if ( !editionMode)
{
buf.push("<a id=\"toggle-type\">" + (jade.escape(null == (jade_interp = t('change to') + " " + t(model.fcEventType=='event'?'alarm':'event')) ? "" : jade_interp)) + "</a>");
}
buf.push("<button" + (jade.attr("title", t('close'), true, false)) + " class=\"close\">&times;</button><i" + (jade.attr("title", t('delete'), true, false)) + " class=\"remove icon-trash\"></i>");;return buf.join("");
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

;require.register("views/templates/sync_view", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"helptext\"><h2>" + (jade.escape(null == (jade_interp = t('synchronization')) ? "" : jade_interp)) + "</h2></div><div class=\"helptext\"><h3>" + (jade.escape(null == (jade_interp = t('mobile sync')) ? "" : jade_interp)) + "</h3><p>" + (jade.escape(null == (jade_interp = t('to sync your cal with') ) ? "" : jade_interp)) + "</p><ol><li>" + (jade.escape(null == (jade_interp = t('install the webdav module') ) ? "" : jade_interp)) + "</li><li>" + (jade.escape(null == (jade_interp = t('connect to it and follow') ) ? "" : jade_interp)) + "</li></ol></div><div class=\"helptext\"><h3>" + (jade.escape(null == (jade_interp = t('icalendar export')) ? "" : jade_interp)) + "</h3><p>" + (jade.escape(null == (jade_interp = t('download a copy of your calendar') ) ? "" : jade_interp)) + "</p><p><a href=\"export/calendar.ics\" class=\"btn\">Export your calendar</a></p></div><div class=\"helptext\"><h3>" + (jade.escape(null == (jade_interp = t('icalendar import')) ? "" : jade_interp)) + "</h3><div id=\"importviewplaceholder\"></div></div>");;return buf.join("");
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
    return "<i class='icon-" + data.icon + "'></i>";
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
      this.$('i').addClass('icon-white');
    } else {
      this.$el.removeClass('badge-info');
      this.$('i').removeClass('icon-white');
    }
    title = this.label + ' : ' + t(value ? 'ON' : 'OFF');
    this.$el.attr('title', title);
    return this.trigger('toggle', value);
  };

  return Toggle;

})(BaseView);
});

;require.register("views/widgets/combobox", function(exports, require, module) {
var BaseView, ComboBox, colorhash,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

colorhash = require('lib/colorhash');

BaseView = require('lib/base_view');

module.exports = ComboBox = (function(_super) {
  __extends(ComboBox, _super);

  function ComboBox() {
    this.remove = __bind(this.remove, this);
    this.renderItem = __bind(this.renderItem, this);
    this.updateBadge = __bind(this.updateBadge, this);
    this.onSelect = __bind(this.onSelect, this);
    this.onBlur = __bind(this.onBlur, this);
    this.onClose = __bind(this.onClose, this);
    this.onOpen = __bind(this.onOpen, this);
    this.openMenu = __bind(this.openMenu, this);
    return ComboBox.__super__.constructor.apply(this, arguments);
  }

  ComboBox.prototype.events = {
    'keyup': 'updateBadge',
    'keypress': 'updateBadge',
    'change': 'updateBadge',
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
    if (!this.small) {
      caret = $('<a class="combobox-caret">');
      caret.append($('<span class="caret"></span>'));
      caret.click(this.openMenu);
      this.$el.after(caret);
    }
    return this.updateBadge();
  };

  ComboBox.prototype.openMenu = function() {
    this.menuOpen = true;
    this.$el.addClass('expanded');
    return this.$el.focus().val(this.value()).autocomplete('search', '');
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
      return this.$el.removeClass('expanded');
    }
  };

  ComboBox.prototype.onSelect = function(ev, ui) {
    this.$el.blur().removeClass('expanded');
    return this.updateBadge(ev, ui);
  };

  ComboBox.prototype.updateBadge = function(ev, ui) {
    var value, _ref, _ref1;
    if ((_ref = this.badge) != null) {
      _ref.remove();
    }
    value = (ui != null ? (_ref1 = ui.item) != null ? _ref1.value : void 0 : void 0) || this.value();
    this.badge = this.makeBadge(colorhash(value));
    this.$el.before(this.badge);
    return true;
  };

  ComboBox.prototype.renderItem = function(ul, item) {
    var color, link;
    color = colorhash(item.label);
    link = $("<a>").text(item.label).prepend(this.makeBadge(color));
    return ul.append($('<li>').append(link).data('ui-autocomplete-item', item));
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