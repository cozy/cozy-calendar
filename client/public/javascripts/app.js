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

window.require.register("application", function(exports, require, module) {
  module.exports = {
    initialize: function() {
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
      Date.setLocale(this.locale);
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
window.require.register("collections/alarms", function(exports, require, module) {
  var Alarm, AlarmCollection, ScheduleItemsCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ScheduleItemsCollection = require('./scheduleitems');

  Alarm = require('../models/alarm');

  module.exports = AlarmCollection = (function(_super) {
    __extends(AlarmCollection, _super);

    function AlarmCollection() {
      _ref = AlarmCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AlarmCollection.prototype.model = Alarm;

    AlarmCollection.prototype.url = 'alarms';

    return AlarmCollection;

  })(ScheduleItemsCollection);
  
});
window.require.register("collections/contacts", function(exports, require, module) {
  var Contact, ContactCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Contact = require('../models/contact');

  module.exports = ContactCollection = (function(_super) {
    __extends(ContactCollection, _super);

    function ContactCollection() {
      _ref = ContactCollection.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("collections/daybuckets", function(exports, require, module) {
  var DayBucket, DayBucketCollection, ScheduleItemsCollection, _ref,
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
      _ref = DayBucketCollection.__super__.constructor.apply(this, arguments);
      return _ref;
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
      var _this = this;
      this.reset([]);
      this.alarmCollection.each(function(model) {
        return _this.onBaseCollectionAdd(model);
      });
      return this.eventCollection.each(function(model) {
        return _this.onBaseCollectionAdd(model);
      });
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
window.require.register("collections/events", function(exports, require, module) {
  var Event, EventCollection, ScheduleItemsCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ScheduleItemsCollection = require('./scheduleitems');

  Event = require('../models/event');

  module.exports = EventCollection = (function(_super) {
    __extends(EventCollection, _super);

    function EventCollection() {
      _ref = EventCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    EventCollection.prototype.model = Event;

    EventCollection.prototype.url = 'events';

    return EventCollection;

  })(ScheduleItemsCollection);
  
});
window.require.register("collections/scheduleitems", function(exports, require, module) {
  var ScheduleItemsCollection, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = ScheduleItemsCollection = (function(_super) {
    __extends(ScheduleItemsCollection, _super);

    function ScheduleItemsCollection() {
      this.getFCEventSource = __bind(this.getFCEventSource, this);
      _ref = ScheduleItemsCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ScheduleItemsCollection.prototype.model = require('../models/scheduleitem');

    ScheduleItemsCollection.prototype.comparator = function(si1, si2) {
      var t1, t2;
      t1 = si1.getDateObject().getTime();
      t2 = si2.getDateObject().getTime();
      if (t1 < t2) {
        return -1;
      } else if (t1 === t2) {
        return 0;
      } else {
        return 1;
      }
    };

    ScheduleItemsCollection.prototype.getFCEventSource = function(tags) {
      var _this = this;
      return function(start, end, callback) {
        var eventsInRange;
        eventsInRange = [];
        _this.each(function(item) {
          var duration, itemEnd, itemStart, rdate, rrule, tag, _i, _len, _ref1, _results;
          itemStart = item.getStartDateObject();
          itemEnd = item.getEndDateObject();
          duration = itemEnd - itemStart;
          tag = tags.findWhere({
            label: item.getCalendar()
          });
          if (tag && tag.get('visible') === false) {
            return null;
          }
          if (rrule = item.getRRuleObject()) {
            _ref1 = rrule.between(Date.create(start - duration), end);
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              rdate = _ref1[_i];
              _results.push(eventsInRange.push(item.toFullCalendarEvent(rdate)));
            }
            return _results;
          } else if (item.isInRange(start, end)) {
            return eventsInRange.push(item.toFullCalendarEvent());
          }
        });
        return callback(eventsInRange);
      };
    };

    return ScheduleItemsCollection;

  })(Backbone.Collection);
  
});
window.require.register("collections/tags", function(exports, require, module) {
  var Tags, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  module.exports = Tags = (function(_super) {
    var Tag, stringify, _ref1;

    __extends(Tags, _super);

    function Tags() {
      _ref = Tags.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Tags.prototype.url = 'tags';

    Tags.prototype.model = Tag = (function(_super1) {
      __extends(Tag, _super1);

      function Tag() {
        _ref1 = Tag.__super__.constructor.apply(this, arguments);
        return _ref1;
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
      var _this = this;
      this.reset([]);
      this.alarmCollection.each(function(model) {
        return _this.onBaseCollectionAdd(model);
      });
      return this.eventCollection.each(function(model) {
        return _this.onBaseCollectionAdd(model);
      });
    };

    Tags.prototype.onBaseCollectionChange = function(model) {
      return this.resetFromBase();
    };

    Tags.prototype.onBaseCollectionAdd = function(model) {
      var calendar, tag, tags, _i, _len, _ref2, _results;
      _ref2 = model.get('tags'), calendar = _ref2[0], tags = 2 <= _ref2.length ? __slice.call(_ref2, 1) : [];
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
      var out, tag, _i, _j, _len, _len1, _ref2, _ref3;
      out = [];
      _ref2 = raw.calendars;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        tag = _ref2[_i];
        out.push({
          type: 'calendar',
          label: tag
        });
      }
      _ref3 = raw.tags;
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        tag = _ref3[_j];
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
window.require.register("helpers", function(exports, require, module) {
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
window.require.register("helpers/timezone", function(exports, require, module) {
  exports.timezones = ["Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmara", "Africa/Bamako", "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre", "Africa/Brazzaville", "Africa/Bujumbura", "Africa/Cairo", "Africa/Casablanca", "Africa/Ceuta", "Africa/Conakry", "Africa/Dakar", "Africa/Dar_es_Salaam", "Africa/Djibouti", "Africa/Douala", "Africa/El_Aaiun", "Africa/Freetown", "Africa/Gaborone", "Africa/Harare", "Africa/Johannesburg", "Africa/Kampala", "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos", "Africa/Libreville", "Africa/Lome", "Africa/Luanda", "Africa/Lubumbashi", "Africa/Lusaka", "Africa/Malabo", "Africa/Maputo", "Africa/Maseru", "Africa/Mbabane", "Africa/Mogadishu", "Africa/Monrovia", "Africa/Nairobi", "Africa/Ndjamena", "Africa/Niamey", "Africa/Nouakchott", "Africa/Ouagadougou", "Africa/Porto-Novo", "Africa/Sao_Tome", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek", "America/Adak", "America/Anchorage", "America/Anguilla", "America/Antigua", "America/Araguaina", "America/Argentina/Buenos_Aires", "America/Argentina/Catamarca", "America/Argentina/Cordoba", "America/Argentina/Jujuy", "America/Argentina/La_Rioja", "America/Argentina/Mendoza", "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan", "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia", "America/Aruba", "America/Asuncion", "America/Atikokan", "America/Bahia", "America/Barbados", "America/Belem", "America/Belize", "America/Blanc-Sablon", "America/Boa_Vista", "America/Bogota", "America/Boise", "America/Cambridge_Bay", "America/Campo_Grande", "America/Cancun", "America/Caracas", "America/Cayenne", "America/Cayman", "America/Chicago", "America/Chihuahua", "America/Costa_Rica", "America/Cuiaba", "America/Curacao", "America/Danmarkshavn", "America/Dawson", "America/Dawson_Creek", "America/Denver", "America/Detroit", "America/Dominica", "America/Edmonton", "America/Eirunepe", "America/El_Salvador", "America/Fortaleza", "America/Glace_Bay", "America/Godthab", "America/Goose_Bay", "America/Grand_Turk", "America/Grenada", "America/Guadeloupe", "America/Guatemala", "America/Guayaquil", "America/Guyana", "America/Halifax", "America/Havana", "America/Hermosillo", "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Indiana/Marengo", "America/Indiana/Petersburg", "America/Indiana/Tell_City", "America/Indiana/Vevay", "America/Indiana/Vincennes", "America/Indiana/Winamac", "America/Inuvik", "America/Iqaluit", "America/Jamaica", "America/Juneau", "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/La_Paz", "America/Lima", "America/Los_Angeles", "America/Maceio", "America/Managua", "America/Manaus", "America/Martinique", "America/Matamoros", "America/Mazatlan", "America/Menominee", "America/Merida", "America/Mexico_City", "America/Miquelon", "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Montreal", "America/Montserrat", "America/Nassau", "America/New_York", "America/Nipigon", "America/Nome", "America/Noronha", "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/Ojinaga", "America/Panama", "America/Pangnirtung", "America/Paramaribo", "America/Phoenix", "America/Port-au-Prince", "America/Port_of_Spain", "America/Porto_Velho", "America/Puerto_Rico", "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina", "America/Resolute", "America/Rio_Branco", "America/Santa_Isabel", "America/Santarem", "America/Santiago", "America/Santo_Domingo", "America/Sao_Paulo", "America/Scoresbysund", "America/St_Johns", "America/St_Kitts", "America/St_Lucia", "America/St_Thomas", "America/St_Vincent", "America/Swift_Current", "America/Tegucigalpa", "America/Thule", "America/Thunder_Bay", "America/Tijuana", "America/Toronto", "America/Tortola", "America/Vancouver", "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife", "Antarctica/Casey", "Antarctica/Davis", "Antarctica/DumontDUrville", "Antarctica/Mawson", "Antarctica/McMurdo", "Antarctica/Palmer", "Antarctica/Rothera", "Antarctica/Syowa", "Antarctica/Vostok", "Asia/Aden", "Asia/Almaty", "Asia/Amman", "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Baghdad", "Asia/Bahrain", "Asia/Baku", "Asia/Bangkok", "Asia/Beirut", "Asia/Bishkek", "Asia/Brunei", "Asia/Choibalsan", "Asia/Chongqing", "Asia/Colombo", "Asia/Damascus", "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe", "Asia/Gaza", "Asia/Harbin", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk", "Asia/Jakarta", "Asia/Jayapura", "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka", "Asia/Karachi", "Asia/Kashgar", "Asia/Kathmandu", "Asia/Kolkata", "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Kuwait", "Asia/Macau", "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Muscat", "Asia/Nicosia", "Asia/Novokuznetsk", "Asia/Novosibirsk", "Asia/Omsk", "Asia/Oral", "Asia/Phnom_Penh", "Asia/Pontianak", "Asia/Pyongyang", "Asia/Qatar", "Asia/Qyzylorda", "Asia/Rangoon", "Asia/Riyadh", "Asia/Sakhalin", "Asia/Samarkand", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tashkent", "Asia/Tbilisi", "Asia/Tehran", "Asia/Thimphu", "Asia/Tokyo", "Asia/Ulaanbaatar", "Asia/Urumqi", "Asia/Vientiane", "Asia/Vladivostok", "Asia/Yakutsk", "Asia/Yekaterinburg", "Asia/Yerevan", "Atlantic/Azores", "Atlantic/Bermuda", "Atlantic/Canary", "Atlantic/Cape_Verde", "Atlantic/Faroe", "Atlantic/Madeira", "Atlantic/Reykjavik", "Atlantic/South_Georgia", "Atlantic/St_Helena", "Atlantic/Stanley", "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill", "Australia/Currie", "Australia/Darwin", "Australia/Eucla", "Australia/Hobart", "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney", "Canada/Atlantic", "Canada/Central", "Canada/Eastern", "Canada/Mountain", "Canada/Newfoundland", "Canada/Pacific", "Europe/Amsterdam", "Europe/Andorra", "Europe/Athens", "Europe/Belgrade", "Europe/Berlin", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest", "Europe/Chisinau", "Europe/Copenhagen", "Europe/Dublin", "Europe/Gibraltar", "Europe/Helsinki", "Europe/Istanbul", "Europe/Kaliningrad", "Europe/Kiev", "Europe/Lisbon", "Europe/London", "Europe/Luxembourg", "Europe/Madrid", "Europe/Malta", "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara", "Europe/Simferopol", "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Tirane", "Europe/Uzhgorod", "Europe/Vaduz", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd", "Europe/Warsaw", "Europe/Zaporozhye", "Europe/Zurich", "GMT", "Indian/Antananarivo", "Indian/Chagos", "Indian/Christmas", "Indian/Cocos", "Indian/Comoro", "Indian/Kerguelen", "Indian/Mahe", "Indian/Maldives", "Indian/Mauritius", "Indian/Mayotte", "Indian/Reunion", "Pacific/Apia", "Pacific/Auckland", "Pacific/Chatham", "Pacific/Easter", "Pacific/Efate", "Pacific/Enderbury", "Pacific/Fakaofo", "Pacific/Fiji", "Pacific/Funafuti", "Pacific/Galapagos", "Pacific/Gambier", "Pacific/Guadalcanal", "Pacific/Guam", "Pacific/Honolulu", "Pacific/Johnston", "Pacific/Kiritimati", "Pacific/Kosrae", "Pacific/Kwajalein", "Pacific/Majuro", "Pacific/Marquesas", "Pacific/Midway", "Pacific/Nauru", "Pacific/Niue", "Pacific/Norfolk", "Pacific/Noumea", "Pacific/Pago_Pago", "Pacific/Palau", "Pacific/Pitcairn", "Pacific/Ponape", "Pacific/Port_Moresby", "Pacific/Rarotonga", "Pacific/Saipan", "Pacific/Tahiti", "Pacific/Tarawa", "Pacific/Tongatapu", "Pacific/Truk", "Pacific/Wake", "Pacific/Wallis", "US/Alaska", "US/Arizona", "US/Central", "US/Eastern", "US/Hawaii", "US/Mountain", "US/Pacific", "UTC"];
  
});
window.require.register("initialize", function(exports, require, module) {
  var app;

  app = require('application');

  $(function() {
    var locale;
    require('lib/app_helpers');
    locale = Date.getLocale(window.locale);
    $.fn.datetimepicker.dates['en'] = {
      days: locale.weekdays.slice(0, 7),
      daysShort: locale.weekdays.slice(7, 15),
      daysMin: locale.weekdays.slice(7, 15),
      months: locale.full_month.split('|').slice(1, 13),
      monthsShort: locale.full_month.split('|').slice(13, 26),
      today: locale.day.split('|')[1],
      suffix: [],
      meridiem: locale.ampm,
      weekStart: 1,
      format: "dd/mm/yyyy"
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
window.require.register("lib/app_helpers", function(exports, require, module) {
  (function() {
    return (function() {
      var console, dummy, method, methods, _results;
      console = window.console = window.console || {};
      method = void 0;
      dummy = function() {};
      methods = 'assert,count,debug,dir,dirxml,error,exception,\
                   group,groupCollapsed,groupEnd,info,log,markTimeline,\
                   profile,profileEnd,time,timeEnd,trace,warn'.split(',');
      _results = [];
      while (method = methods.pop()) {
        _results.push(console[method] = console[method] || dummy);
      }
      return _results;
    })();
  })();
  
});
window.require.register("lib/base_view", function(exports, require, module) {
  var BaseView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = BaseView = (function(_super) {
    __extends(BaseView, _super);

    function BaseView() {
      _ref = BaseView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BaseView.prototype.template = function() {};

    BaseView.prototype.initialize = function() {};

    BaseView.prototype.getRenderData = function() {
      var _ref1;
      return {
        model: (_ref1 = this.model) != null ? _ref1.toJSON() : void 0
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
window.require.register("lib/colorhash", function(exports, require, module) {
  var hslToRgb, hue2rgb,
    _this = this;

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

  hslToRgb = function(h, s, l) {
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
window.require.register("lib/random", function(exports, require, module) {
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
window.require.register("lib/socket_listener", function(exports, require, module) {
  var SocketListener, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SocketListener = (function(_super) {
    __extends(SocketListener, _super);

    function SocketListener() {
      _ref = SocketListener.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SocketListener.prototype.models = {
      'alarm': require('models/alarm'),
      'event': require('models/event')
    };

    SocketListener.prototype.events = ['alarm.create', 'alarm.update', 'alarm.delete', 'event.create', 'event.update', 'event.delete'];

    SocketListener.prototype.onRemoteCreate = function(model) {
      var collection, _i, _len, _ref1, _results;
      _ref1 = this.collections;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        collection = _ref1[_i];
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
window.require.register("lib/view", function(exports, require, module) {
  var View, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = View = (function(_super) {
    __extends(View, _super);

    function View() {
      _ref = View.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("lib/view_collection", function(exports, require, module) {
  var BaseView, ViewCollection, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('lib/base_view');

  module.exports = ViewCollection = (function(_super) {
    __extends(ViewCollection, _super);

    function ViewCollection() {
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      _ref = ViewCollection.__super__.constructor.apply(this, arguments);
      return _ref;
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
      var id, view, _ref1;
      _ref1 = this.views;
      for (id in _ref1) {
        view = _ref1[id];
        view.$el.detach();
      }
      return ViewCollection.__super__.render.apply(this, arguments);
    };

    ViewCollection.prototype.afterRender = function() {
      var id, view, _ref1;
      if (!this.$collectionEl) {
        this.$collectionEl = this.$(this.collectionEl);
      }
      _ref1 = this.views;
      for (id in _ref1) {
        view = _ref1[id];
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
      var id, view, _ref1;
      _ref1 = this.views;
      for (id in _ref1) {
        view = _ref1[id];
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
window.require.register("locales/en", function(exports, require, module) {
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
    "to": "&nbsp;to",
    "no description": "A title must be set.",
    "no summary": "A summary must be set.",
    "start after end": "The start date is after the end date.",
    "invalid start date": "The start date is invalid.",
    "invalid end date": "The end date is invalid.",
    "invalid trigg date": "The date is invalid.",
    "invalid action": "The action is invalid.",
    "synchronization": "Synchronization",
    "mobile sync": "Mobile Sync (CalDAV)",
    "import an ical file": "To import an ICal file into your cozy calendar, click on this button:",
    "download a copy of your calendar": "To download a copy of your calendar on your computer as an ICal file, click on this button:",
    "icalendar export": "ICalendar Export",
    "icalendar import": "ICalendar Import",
    "to sync your cal with": "To synchronize your calendar with your devices, you must follow two steps",
    "install the webdav module": "Install the webdav module from the Cozy App Store",
    "connect to it and follow": "Connect to it and follow the instructions related to CalDAV."
  };
  
});
window.require.register("locales/fr", function(exports, require, module) {
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
    "display previous events": "Montrer les évènements précédent",
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
    "to": "&nbsp;à",
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
    "download a copy of your calendar": "Pour télécharger une copie de votre calendrier sur votre ordinateur comme un fichier iCal, cliquez sur ce bouton :",
    "icalendar export": "Export ICalendar",
    "icalendar import": "Import ICalendar",
    "to sync your cal with": "Pour synchronisez votre calendrier avec votre mobile vous devez :",
    "install the webdav module": "Installer le module WebDAV depuis l'applithèque.",
    "connect to it and follow": "Vous connectez et suivre les instructions relatives à CalDAV."
  };
  
});
window.require.register("models/alarm", function(exports, require, module) {
  var Alarm, ScheduleItem, helpers, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  helpers = require('../helpers');

  ScheduleItem = require('./scheduleitem');

  module.exports = Alarm = (function(_super) {
    __extends(Alarm, _super);

    function Alarm() {
      _ref = Alarm.__super__.constructor.apply(this, arguments);
      return _ref;
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
      var errors, _ref1;
      errors = [];
      if (!attrs.description || attrs.description === "") {
        errors.push({
          field: 'description',
          value: "no summary"
        });
      }
      if ((_ref1 = !attrs.action) === 'DISPLAY' || _ref1 === 'EMAIL' || _ref1 === 'BOTH') {
        errors.push({
          field: 'action',
          value: "invalid action"
        });
      }
      if (!attrs.trigg || !Date.create(attrs.trigg).isValid()) {
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
window.require.register("models/contact", function(exports, require, module) {
  var Contact, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = Contact = (function(_super) {
    __extends(Contact, _super);

    function Contact() {
      _ref = Contact.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("models/event", function(exports, require, module) {
  var Event, ScheduleItem, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ScheduleItem = require('./scheduleitem');

  module.exports = Event = (function(_super) {
    __extends(Event, _super);

    function Event() {
      _ref = Event.__super__.constructor.apply(this, arguments);
      return _ref;
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

    Event.prototype.validate = function(attrs, options) {
      var end, errors, start;
      errors = [];
      if (!attrs.description) {
        errors.push({
          field: 'description',
          value: "no summary"
        });
      }
      if (!attrs.start || !(start = Date.create(attrs.start)).isValid()) {
        errors.push({
          field: 'startdate',
          value: "invalid start date"
        });
      }
      if (!attrs.end || !(end = Date.create(attrs.end)).isValid()) {
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
window.require.register("models/scheduleitem", function(exports, require, module) {
  var ScheduleItem, colorHash, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  colorHash = require('lib/colorhash');

  module.exports = ScheduleItem = (function(_super) {
    __extends(ScheduleItem, _super);

    function ScheduleItem() {
      _ref = ScheduleItem.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ScheduleItem.prototype.fcEventType = 'unknown';

    ScheduleItem.prototype.startDateField = '';

    ScheduleItem.prototype.endDateField = false;

    ScheduleItem.dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00";

    ScheduleItem.prototype.initialize = function() {
      var _ref1,
        _this = this;
      if (!((_ref1 = this.get('tags')) != null ? _ref1.length : void 0)) {
        this.set('tags', ['my calendar']);
      }
      this.startDateObject = Date.create(this.get(this.startDateField));
      this.on('change:' + this.startDateField, function() {
        _this.previousDateObject = _this.startDateObject;
        _this.startDateObject = Date.create(_this.get(_this.startDateField));
        if (!_this.endDateField) {
          _this.endDateObject = _this.startDateObject.clone();
          return _this.endDateObject.advance({
            minutes: 30
          });
        }
      });
      if (this.endDateField) {
        this.endDateObject = Date.create(this.get(this.endDateField));
        return this.on('change:' + this.endDateField, function() {
          _this.endDateObject = _this.endDateObject;
          return _this.endDateObject = Date.create(_this.get(_this.endDateField));
        });
      } else {
        this.endDateObject = this.startDateObject.clone();
        return this.endDateObject.advance({
          minutes: 30
        });
      }
    };

    ScheduleItem.prototype.getCalendar = function() {
      var _ref1;
      return (_ref1 = this.get('tags')) != null ? _ref1[0] : void 0;
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

    ScheduleItem.prototype.getDateObject = function() {
      return this.startDateObject;
    };

    ScheduleItem.prototype.getStartDateObject = function() {
      return this.getDateObject();
    };

    ScheduleItem.prototype.getEndDateObject = function() {
      return this.endDateObject;
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

    ScheduleItem.prototype.isOneDay = function() {
      return this.startDateObject.short() === this.endDateObject.short();
    };

    ScheduleItem.prototype.isInRange = function(start, end) {
      return this.startDateObject.isBetween(start, end) || this.endDateObject.isBetween(start, end) || (this.startDateObject.isBefore(start) && this.endDateObject.isAfter(end));
    };

    ScheduleItem.prototype.toFullCalendarEvent = function(rstart) {
      var duration, end, fcEvent, start;
      start = this.getStartDateObject();
      end = this.getEndDateObject();
      if (rstart) {
        duration = end - start;
        end = Date.create(rstart).clone().advance(duration);
        start = rstart;
      }
      return fcEvent = {
        id: this.cid,
        title: "" + (start.format("{HH}:{mm}")) + " " + (this.get("description")),
        start: start.format(Date.ISO8601_DATETIME),
        end: end.format(Date.ISO8601_DATETIME),
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

    return ScheduleItem;

  })(Backbone.Model);
  
});
window.require.register("router", function(exports, require, module) {
  var CalendarView, DayBucketCollection, EventModal, ImportView, ListView, Router, SyncView, app, _ref,
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
    var getBeginningOfWeek,
      _this = this;

    __extends(Router, _super);

    function Router() {
      this.displayView = __bind(this.displayView, this);
      this.displayCalendar = __bind(this.displayCalendar, this);
      this.backToCalendar = __bind(this.backToCalendar, this);
      _ref = Router.__super__.constructor.apply(this, arguments);
      return _ref;
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
        hash = new Date().format('month/{yyyy}/{M}');
        return this.navigate(hash, {
          trigger: true
        });
      }
    };

    Router.prototype.week = function(year, month, day) {
      var hash, _ref1;
      if (year != null) {
        _ref1 = getBeginningOfWeek(year, month, day), year = _ref1[0], month = _ref1[1], day = _ref1[2];
        return this.displayCalendar('agendaWeek', year, month, day);
      } else {
        hash = new Date().format('week/{yyyy}/{M}/{d}');
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
      var day, _ref1;
      _ref1 = getBeginningOfWeek(year, month, day), year = _ref1[0], month = _ref1[1], day = _ref1[2];
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
      var monday, _ref1;
      _ref1 = [year, month, day].map(function(x) {
        return parseInt(x);
      }), year = _ref1[0], month = _ref1[1], day = _ref1[2];
      monday = new Date(year, (month - 1) % 12, day);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      return [year, monday.getMonth() + 1, monday.getDate()];
    };

    return Router;

  }).call(this, Backbone.Router);
  
});
window.require.register("views/calendar_header", function(exports, require, module) {
  var BaseView, CalendarHeader, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  module.exports = CalendarHeader = (function(_super) {
    __extends(CalendarHeader, _super);

    function CalendarHeader() {
      _ref = CalendarHeader.__super__.constructor.apply(this, arguments);
      return _ref;
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
      var format, view;
      if (!this.cal) {
        return t('List');
      }
      view = this.cal.fullCalendar('getView');
      format = view.name === 'month' ? 'MMMM yyyy' : "MMM d[ yyyy]{ '&#8212;'[ MMM] d yyyy}";
      return $.fullCalendar.formatDates(view.start, view.end, format);
    };

    CalendarHeader.prototype.getDates = function() {
      var view;
      view = this.cal.fullCalendar('getView');
      return [view.start, view.end];
    };

    CalendarHeader.prototype.isToday = function() {
      var end, start, _ref1;
      _ref1 = this.getDates(), start = _ref1[0], end = _ref1[1];
      return (new Date()).isBetween(start, end);
    };

    CalendarHeader.prototype.getRenderData = function() {
      var data, locale,
        _this = this;
      locale = Date.getLocale();
      return data = {
        title: this.getTitle(),
        todaytxt: locale.day.split('|')[1],
        calendarMode: this.cal != null,
        active: function(item) {
          if (item === 'today' && _this.isToday() || item === _this.getViewName()) {
            return 'fc-state-active';
          }
        }
      };
    };

    CalendarHeader.prototype.events = function() {
      var _this = this;
      return {
        'click .fc-button-next': function() {
          return _this.trigger('next');
        },
        'click .fc-button-prev': function() {
          return _this.trigger('prev');
        },
        'click .fc-button-today': function() {
          return _this.trigger('today');
        },
        'click .fc-button-month': function() {
          return _this.trigger('month');
        },
        'click .fc-button-week': function() {
          return _this.trigger('week');
        },
        'click .fc-button-list': function() {
          return _this.trigger('list');
        }
      };
    };

    return CalendarHeader;

  })(BaseView);
  
});
window.require.register("views/calendar_popover", function(exports, require, module) {
  var Alarm, BaseView, ComboBox, Event, EventModal, PopOver, RRuleFormView, Toggle, _ref,
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
      _ref = PopOver.__super__.constructor.apply(this, arguments);
      return _ref;
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
      var inputDiff, inputEnd, inputStart, tzInput, _ref1, _ref2,
        _this = this;
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
      inputStart.on('timepicker.next', function() {
        return inputEnd.focus();
      });
      inputEnd.on('timepicker.next', function() {
        return inputDiff.focus();
      });
      inputEnd.on('timepicker.prev', function() {
        return inputStart.focus().timepicker('highlightMinute');
      });
      inputDiff.on('keydown', function(ev) {
        if (ev.keyCode === 37) {
          inputEnd.focus().timepicker('highlightMinute');
        }
        if (ev.keyCode === 39) {
          return _this.$('#input-desc').focus();
        }
      });
      inputStart.on('changeTime.timepicker', function(ev) {
        return _this.adjustTimePickers('start', ev.time.value);
      });
      inputEnd.on('changeTime.timepicker', function(ev) {
        return _this.adjustTimePickers('end', ev.time.value);
      });
      if (this.type === 'alarm') {
        tzInput = this.$('#input-timezone');
        this.actionMail = new Toggle({
          icon: 'envelope',
          label: 'email notification',
          value: (_ref1 = this.model.get('action')) === 'EMAIL' || _ref1 === 'BOTH'
        });
        this.actionNotif = new Toggle({
          icon: 'exclamation-sign',
          label: 'home notification',
          value: (_ref2 = this.model.get('action')) === 'DISPLAY' || _ref2 === 'BOTH'
        });
        this.actionMail.on('toggle', function(mailIsOn) {
          if (!mailIsOn) {
            return _this.actionNotif.toggle(true);
          }
        });
        this.actionNotif.on('toggle', function(notifIsOn) {
          if (!notifIsOn) {
            return _this.actionMail.toggle(true);
          }
        });
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
      var data, diff, endDate, startDate, _ref1;
      data = _.extend({
        type: this.type
      }, this.model.attributes, {
        title: this.getTitle(),
        editionMode: !this.model.isNew(),
        advancedUrl: this.parentView.getUrlHash() + '/' + this.model.id
      });
      data.calendar = ((_ref1 = data.tags) != null ? _ref1[0] : void 0) || '';
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
      var action, data, date, end, endDate, startDate, _ref1;
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
        if ((_ref1 = this.rruleForm) != null ? _ref1.hasRRule() : void 0) {
          data.rrule = this.rruleForm.getRRule().toString();
        } else {
          data.rrule = "";
        }
      }
      data.tags = [this.calendar.value()];
      return data;
    };

    PopOver.prototype.onRemoveClicked = function() {
      var _this = this;
      this.removeButton.css('width', '42px');
      this.removeButton.spin('tiny');
      if (confirm('Are you sure ?')) {
        return this.model.destroy({
          wait: true,
          error: function() {
            return alert('server error occured');
          },
          complete: function() {
            _this.removeButton.spin();
            _this.removeButton.css('width', '14px');
            return _this.selfclose();
          }
        });
      } else {
        return this.removeButton.spin();
      }
    };

    PopOver.prototype.onAddClicked = function() {
      var err, validModel, _i, _len, _ref1, _results,
        _this = this;
      if (this.$('.btn.add').hasClass('disabled')) {
        return;
      }
      this.addButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      this.addButton.spin('small');
      validModel = this.model.save(this.getModelAttributes(), {
        wait: true,
        success: function() {
          var collection;
          collection = app[_this.type + 's'];
          return collection.add(_this.model);
        },
        error: function() {
          return alert('server error occured');
        },
        complete: function() {
          _this.addButton.spin(false);
          _this.addButton.html(_this.getButtonText());
          return _this.selfclose();
        }
      });
      if (!validModel) {
        this.addButton.html(this.getButtonText());
        this.addButton.spin();
        this.$('.alert').remove();
        this.$('input').css('border-color', '');
        _ref1 = this.model.validationError;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          err = _ref1[_i];
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
window.require.register("views/calendar_view", function(exports, require, module) {
  var Alarm, BaseView, CalendarView, Event, Header, Popover, app, helpers, timezones, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  app = require('application');

  BaseView = require('../lib/base_view');

  Popover = require('./calendar_popover');

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
      _ref = CalendarView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CalendarView.prototype.id = 'view-container';

    CalendarView.prototype.template = require('./templates/calendarview');

    CalendarView.prototype.initialize = function(options) {
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
      var debounced, locale, source,
        _this = this;
      locale = Date.getLocale(app.locale);
      this.cal = this.$('#alarms');
      this.view = this.options.view;
      this.cal.fullCalendar({
        header: false,
        editable: true,
        firstDay: 1,
        weekMode: 'liquid',
        height: this.handleWindowResize('initial'),
        defaultView: this.view,
        year: this.options.year,
        month: this.options.month,
        date: this.options.date,
        viewDisplay: this.onChangeView,
        monthNames: locale.full_month.split('|').slice(1, 13),
        monthNamesShort: locale.full_month.split('|').slice(13, 26),
        dayNames: locale.weekdays.slice(0, 7),
        dayNamesShort: locale.weekdays.slice(0, 7),
        buttonText: {
          today: locale.day.split('|')[1],
          month: locale.units[6],
          week: locale.units[5],
          day: locale.units[4]
        },
        ignoreTimezone: true,
        timeFormat: {
          '': '',
          'agendaWeek': ''
        },
        columnFormat: {
          'week': 'ddd d'
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
      this.calHeader.on('next', function() {
        return _this.cal.fullCalendar('next');
      });
      this.calHeader.on('prev', function() {
        return _this.cal.fullCalendar('prev');
      });
      this.calHeader.on('today', function() {
        return _this.cal.fullCalendar('today');
      });
      this.calHeader.on('week', function() {
        return _this.cal.fullCalendar('changeView', 'agendaWeek');
      });
      this.calHeader.on('month', function() {
        return _this.cal.fullCalendar('changeView', 'month');
      });
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
      var _ref1;
      if ((_ref1 = this.popover) != null) {
        _ref1.close();
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
      return this.cal.height(this.$('.fc-header').height() + this.$('.fc-content').height());
    };

    CalendarView.prototype.refresh = function(collection) {
      return this.cal.fullCalendar('refetchEvents');
    };

    CalendarView.prototype.onRemove = function(model) {
      return this.cal.fullCalendar('removeEvents', model.cid);
    };

    CalendarView.prototype.refreshOne = function(model) {
      var data, fcEvent;
      if (model.getRRuleObject()) {
        return this.refresh();
      }
      data = model.toFullCalendarEvent();
      fcEvent = this.cal.fullCalendar('clientEvents', data.id)[0];
      _.extend(fcEvent, data);
      return this.cal.fullCalendar('updateEvent', fcEvent);
    };

    CalendarView.prototype.showPopover = function(options) {
      var _ref1, _ref2;
      options.container = this.cal;
      options.parentView = this;
      if (this.popover) {
        this.popover.close();
        if ((this.popover.options.model != null) && this.popover.options.model === options.model || (((_ref1 = this.popover.options.start) != null ? _ref1.is(options.start) : void 0) && ((_ref2 = this.popover.options.end) != null ? _ref2.is(options.end) : void 0) && this.popover.options.type === options.type)) {
          this.cal.fullCalendar('unselect');
          this.popover = null;
          return;
        }
      }
      this.popover = new Popover(options);
      return this.popover.render();
    };

    CalendarView.prototype.onChangeView = function(view) {
      var date, hash, month, start, year, _ref1;
      if ((_ref1 = this.calHeader) != null) {
        _ref1.render();
      }
      if (this.view !== view.name) {
        this.handleWindowResize();
      }
      this.view = view.name;
      start = view.start;
      hash = this.view === 'month' ? "month/" + (start.getFullYear()) + "/" + (start.getMonth() + 1) : (year = start.getFullYear(), month = start.getMonth() + 1, date = start.getDate(), "week/" + year + "/" + month + "/" + date);
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

    CalendarView.prototype.onSelect = function(startDate, endDate, allDay, jsEvent, view) {
      return this.showPopover({
        type: 'event',
        start: startDate,
        end: endDate,
        target: $(jsEvent.target)
      });
    };

    CalendarView.prototype.onPopoverClose = function() {
      this.cal.fullCalendar('unselect');
      return this.popover = null;
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
        element.find('.fc-event-title').prepend(icon);
      }
      return element;
    };

    CalendarView.prototype.onEventDragStop = function(event, jsEvent, ui, view) {
      return event.isSaving = true;
    };

    CalendarView.prototype.onEventDrop = function(fcEvent, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
      var alarm, end, evt, start, trigg,
        _this = this;
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
          success: function() {
            fcEvent.isSaving = false;
            return _this.cal.fullCalendar('renderEvent', fcEvent);
          },
          error: function() {
            fcEvent.isSaving = false;
            return revertFunc();
          }
        });
      } else {
        evt = this.eventCollection.get(fcEvent.id);
        start = evt.getStartDateObject().clone().advance({
          days: dayDelta,
          minutes: minuteDelta
        });
        end = evt.getEndDateObject().clone().advance({
          days: dayDelta,
          minutes: minuteDelta
        });
        return evt.save({
          start: start.format(Event.dateFormat, 'en-en'),
          end: end.format(Event.dateFormat, 'en-en')
        }, {
          wait: true,
          success: function() {
            fcEvent.isSaving = false;
            return _this.cal.fullCalendar('renderEvent', fcEvent);
          },
          error: function() {
            fcEvent.isSaving = false;
            return revertFunc();
          }
        });
      }
    };

    CalendarView.prototype.onEventResizeStop = function(fcEvent, jsEvent, ui, view) {
      return fcEvent.isSaving = true;
    };

    CalendarView.prototype.onEventResize = function(fcEvent, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view) {
      var data, end, model,
        _this = this;
      if (fcEvent.type === "alarm") {
        fcEvent.isSaving = false;
        this.cal.fullCalendar('renderEvent', fcEvent);
        revertFunc();
        return;
      }
      model = this.eventCollection.get(fcEvent.id);
      end = model.getEndDateObject().clone();
      end.advance({
        days: dayDelta,
        minutes: minuteDelta
      });
      data = {
        end: end.format(Event.dateFormat, 'en-en')
      };
      return model.save(data, {
        wait: true,
        success: function() {
          fcEvent.isSaving = false;
          return _this.cal.fullCalendar('renderEvent', fcEvent);
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
        if (fcEvent.type === 'alarm') {
          return this.alarmCollection.get(fcEvent.id);
        } else if (fcEvent.type === 'event') {
          return this.eventCollection.get(fcEvent.id);
        } else {
          throw new Error('wrong typed event in fc');
        }
      }).call(this);
      return this.showPopover({
        model: model,
        target: $(jsEvent.currentTarget)
      });
    };

    return CalendarView;

  })(BaseView);
  
});
window.require.register("views/event_modal", function(exports, require, module) {
  var ComboBox, Event, EventModal, RRuleFormView, TagsView, ViewCollection, app, random, _ref,
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
      _ref = EventModal.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    EventModal.prototype.template = require('./templates/event_modal');

    EventModal.prototype.id = 'event-modal';

    EventModal.prototype.className = 'modal fade';

    EventModal.prototype.attributes = {
      'data-keyboard': 'false'
    };

    EventModal.prototype.inputDateTimeFormat = '{dd}/{MM}/{year} {HH}:{mm}';

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
      var _this = this;
      return {
        'click  #confirm-btn': 'save',
        'click  #cancel-btn': 'close',
        'click  .close': 'close',
        'click #addguest': function() {
          return _this.onGuestAdded(_this.$('#addguest-field').val());
        },
        'keydown #basic-description': 'resizeDescription',
        'keypress #basic-description': 'resizeDescription'
      };
    };

    EventModal.prototype.afterRender = function() {
      var _this = this;
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
      this.$el.on('hidden', function() {
        $(document).off('keydown', _this.hideOnEscape);
        window.app.router.navigate(_this.backurl || '', {
          trigger: false,
          replace: true
        });
        return _this.remove();
      });
      return this.$('#basic-summary').focus();
    };

    EventModal.prototype.hideOnEscape = function(e) {
      if (e.which === 27 && !e.isDefaultPrevented()) {
        return this.close();
      }
    };

    EventModal.prototype.onGuestAdded = function(info) {
      var email, guests, id, _ref1;
      _ref1 = info.split(';'), email = _ref1[0], id = _ref1[1];
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
      var data, _ref1, _ref2;
      data = _.extend({}, this.model.toJSON(), {
        summary: this.model.get('description'),
        description: this.model.get('details'),
        start: this.model.getStartDateObject().format(this.inputDateTimeFormat),
        end: this.model.getEndDateObject().format(this.inputDateTimeFormat),
        exportdate: this.model.getStartDateObject().format(this.exportDateFormat)
      });
      data.calendar = ((_ref1 = data.tags) != null ? _ref1[0] : void 0) || '';
      data.tags = ((_ref2 = data.tags) != null ? _ref2.slice(1) : void 0) || [];
      return data;
    };

    EventModal.prototype.save = function() {
      var data, error, validModel, _i, _len, _ref1, _results,
        _this = this;
      data = {
        details: this.descriptionField.val(),
        description: this.$('#basic-summary').val(),
        place: this.$('#basic-place').val(),
        tags: [this.$('#basic-calendar').val()].concat(this.tags.getTags()),
        start: Date.create(this.startField.val(), 'fr').format(Event.dateFormat, 'en'),
        end: Date.create(this.endField.val(), 'fr').format(Event.dateFormat, 'en')
      };
      if (this.rruleForm.hasRRule()) {
        data.rrule = this.rruleForm.getRRule().toString();
      } else {
        data.rrule = '';
      }
      validModel = this.model.save(data, {
        wait: true,
        success: function() {
          return _this.close();
        },
        error: function() {
          alert('server error');
          return _this.close();
        }
      });
      if (!validModel) {
        this.$('.alert').remove();
        this.$('.control-group').removeClass('error');
        _ref1 = this.model.validationError;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          error = _ref1[_i];
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
window.require.register("views/event_modal_guest", function(exports, require, module) {
  var BaseView, GuestView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  module.exports = GuestView = (function(_super) {
    __extends(GuestView, _super);

    function GuestView() {
      _ref = GuestView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GuestView.prototype.template = require('./templates/event_modal_guest');

    return GuestView;

  })(BaseView);
  
});
window.require.register("views/event_modal_rrule", function(exports, require, module) {
  var BaseView, RRuleView, _ref,
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
      _ref = RRuleView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RRuleView.prototype.template = require('./templates/event_modal_rrule');

    RRuleView.prototype.inputDateFormat = '{year}-{MM}-{dd}';

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
        weekDays: Date.getLocale().weekdays.slice(0, 7),
        units: Date.getLocale().units
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
        rrule.until = Date.create(options.until).format(this.inputDateFormat);
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
          var result, _ref1;
          result = options.byweekday && (_ref1 = (value + 6) % 7, __indexOf.call(options.byweekday, _ref1) >= 0);
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
          var result, _ref1, _ref2;
          result = (value === 'weekdate' && ((_ref1 = options.bynweekday) != null ? _ref1.length : void 0)) || (value === 'date' && ((_ref2 = options.bymonthday) != null ? _ref2.length : void 0));
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
      var RRuleWdays, day, endOfMonth, monthmode, options, start, wk;
      start = this.model.getStartDateObject();
      RRuleWdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
      options = {
        dtstart: start,
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
          options.bymonthday = start.getDate();
        } else if (monthmode === 'weekdate') {
          day = RRuleWdays[start.getDay()];
          endOfMonth = start.clone().endOfMonth();
          if (start.getDate() > endOfMonth.getDate() - 7) {
            wk = -1;
          } else {
            wk = Math.ceil(start.getDate() / 7);
          }
          options.byweekday = day.nth(wk);
        }
      }
      switch (this.$('input:radio[name=endMode]:checked').val()) {
        case 'count':
          options.count = +this.$('#rrule-count').val();
          break;
        case 'until':
          options.until = Date.create(this.$('#rrule-until').val(), 'fr');
      }
      return new RRule(options);
    };

    RRuleView.prototype.showRRule = function() {
      var _this = this;
      this.updateHelp();
      this.$('#rrule-action').hide();
      return this.$('#rrule-short').slideDown(function() {
        return _this.$('#rrule').slideDown();
      });
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
      locale = Date.getLocale();
      language = {
        dayNames: locale.weekdays.slice(0, 7),
        monthNames: locale.full_month.split('|').slice(1, 13)
      };
      this.$('#rrule-help').html(this.getRRule().toText(window.t, language));
      return true;
    };

    return RRuleView;

  })(BaseView);
  
});
window.require.register("views/import_alarm_list", function(exports, require, module) {
  var AlarmCollection, AlarmList, AlarmView, ViewCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ViewCollection = require('../lib/view_collection');

  AlarmView = require('./import_alarm_view');

  AlarmCollection = require('../collections/alarms');

  module.exports = AlarmList = (function(_super) {
    __extends(AlarmList, _super);

    function AlarmList() {
      _ref = AlarmList.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AlarmList.prototype.itemview = AlarmView;

    AlarmList.prototype.collection = new AlarmCollection();

    return AlarmList;

  })(ViewCollection);
  
});
window.require.register("views/import_alarm_view", function(exports, require, module) {
  var AlarmView, BaseView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  module.exports = AlarmView = (function(_super) {
    __extends(AlarmView, _super);

    function AlarmView() {
      _ref = AlarmView.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("views/import_event_list", function(exports, require, module) {
  var EventCollection, EventList, EventView, ViewCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ViewCollection = require('../lib/view_collection');

  EventView = require('./import_event_view');

  EventCollection = require('../collections/events');

  module.exports = EventList = (function(_super) {
    __extends(EventList, _super);

    function EventList() {
      _ref = EventList.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    EventList.prototype.itemview = EventView;

    EventList.prototype.collection = new EventCollection();

    return EventList;

  })(ViewCollection);
  
});
window.require.register("views/import_event_view", function(exports, require, module) {
  var BaseView, EventView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  module.exports = EventView = (function(_super) {
    __extends(EventView, _super);

    function EventView() {
      _ref = EventView.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("views/import_view", function(exports, require, module) {
  var Alarm, AlarmList, BaseView, Event, EventList, ImportView, helpers, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  helpers = require('../helpers');

  Alarm = require('../models/alarm');

  AlarmList = require('./import_alarm_list');

  Event = require('../models/event');

  EventList = require('./import_event_list');

  module.exports = ImportView = (function(_super) {
    __extends(ImportView, _super);

    function ImportView() {
      _ref = ImportView.__super__.constructor.apply(this, arguments);
      return _ref;
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
      return this.confirmButton = this.$('button#confirm-button');
    };

    ImportView.prototype.onFileChanged = function(event) {
      var file, form,
        _this = this;
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
        success: function(result) {
          var alarm, valarm, vevent, _i, _j, _len, _len1, _ref1, _ref2;
          if ((result != null ? result.alarms : void 0) != null) {
            _ref1 = result.alarms;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              valarm = _ref1[_i];
              alarm = new Alarm(valarm, {
                parse: true
              });
              _this.alarmList.collection.add(alarm);
            }
          }
          if ((result != null ? result.events : void 0) != null) {
            _ref2 = result.events;
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
              vevent = _ref2[_j];
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
        },
        error: function(xhr) {
          var msg;
          msg = JSON.parse(xhr.responseText).msg;
          if (msg == null) {
            msg = 'An error occured while importing your calendar.';
          }
          alert(msg);
          _this.resetUploader();
          _this.importButton.spin();
          return _this.importButton.find('span').html(t('select an icalendar file'));
        }
      });
    };

    ImportView.prototype.onConfirmImportClicked = function() {
      var counter, finish, onFaillure, onSuccess,
        _this = this;
      counter = this.alarmList.collection.length + this.eventList.collection.length;
      console.log(counter, this.alarmList.length, this.eventList.length);
      onFaillure = function(model) {
        console.log("faillure", model.cid, counter);
        counter = counter - 1;
        alert('some event fail to save');
        if (counter === 0) {
          return finish();
        }
      };
      onSuccess = function(model) {
        console.log("success", model.cid, counter);
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
      finish = function() {
        _this.$(".confirmation").fadeOut();
        _this.$(".results").slideUp(function() {
          _this.$(".import-form").fadeIn();
          return _this.confirmButton.html(t('confirm import'));
        });
        _this.alarmList.collection.reset();
        _this.eventList.collection.reset();
        return app.router.navigate("calendar", true);
      };
      this.confirmButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      this.confirmButton.spin('tiny');
      this.alarmList.collection.each(function(alarm) {
        return alarm.save(null, {
          success: onSuccess,
          error: onFaillure
        });
      });
      return this.eventList.collection.each(function(event) {
        return event.save(null, {
          success: onSuccess,
          error: onFaillure
        });
      });
    };

    ImportView.prototype.onCancelImportClicked = function() {
      var _this = this;
      this.$(".confirmation").fadeOut();
      return this.$(".results").slideUp(function() {
        return _this.$(".import-form").fadeIn();
      });
    };

    ImportView.prototype.resetUploader = function() {
      this.uploader.wrap('<form>').parent('form').trigger('reset');
      return this.uploader.unwrap();
    };

    return ImportView;

  })(BaseView);
  
});
window.require.register("views/list_view", function(exports, require, module) {
  var Header, ListView, ViewCollection, defaultTimezone, helpers, _ref,
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
      _ref = ListView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ListView.prototype.id = 'view-container';

    ListView.prototype.template = require('./templates/list_view');

    ListView.prototype.itemview = require('./list_view_bucket');

    ListView.prototype.collectionEl = '#alarm-list';

    ListView.prototype.events = {
      'click .showbefore': 'showbefore'
    };

    ListView.prototype.afterRender = function() {
      var _this = this;
      this.calHeader = new Header();
      this.$('#alarm-list').prepend(this.calHeader.render().$el);
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
window.require.register("views/list_view_bucket", function(exports, require, module) {
  var BucketView, Popover, ViewCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ViewCollection = require('../lib/view_collection');

  Popover = require('./calendar_popover');

  module.exports = BucketView = (function(_super) {
    __extends(BucketView, _super);

    function BucketView() {
      _ref = BucketView.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("views/list_view_item", function(exports, require, module) {
  var AlarmView, BaseView, Event, Popover, colorHash, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  Popover = require('./calendar_popover');

  Event = require('../models/event');

  colorHash = require('lib/colorhash');

  module.exports = AlarmView = (function(_super) {
    __extends(AlarmView, _super);

    function AlarmView() {
      _ref = AlarmView.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("views/menu", function(exports, require, module) {
  var MenuView, ViewCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ViewCollection = require('../lib/view_collection');

  module.exports = MenuView = (function(_super) {
    __extends(MenuView, _super);

    function MenuView() {
      _ref = MenuView.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("views/menu_item", function(exports, require, module) {
  var BaseView, Event, MenuItemView, Popover, colorhash, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  Popover = require('./calendar_popover');

  Event = require('../models/event');

  colorhash = require('lib/colorhash');

  module.exports = MenuItemView = (function(_super) {
    __extends(MenuItemView, _super);

    function MenuItemView() {
      _ref = MenuItemView.__super__.constructor.apply(this, arguments);
      return _ref;
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
window.require.register("views/sync_view", function(exports, require, module) {
  var BaseView, ImportView, SyncView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  ImportView = require('./import_view');

  module.exports = SyncView = (function(_super) {
    __extends(SyncView, _super);

    function SyncView() {
      _ref = SyncView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SyncView.prototype.id = 'view-container';

    SyncView.prototype.template = require('./templates/sync_view');

    SyncView.prototype.afterRender = function() {
      return this.$('#importviewplaceholder').append(new ImportView().render().$el);
    };

    return SyncView;

  })(BaseView);
  
});
window.require.register("views/tags", function(exports, require, module) {
  var BaseView, TagsView, colorHash, _ref,
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
      _ref = TagsView.__super__.constructor.apply(this, arguments);
      return _ref;
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
      var tag, _i, _len, _ref1;
      this.duringRefresh = true;
      this.$el.tagit('removeAll');
      _ref1 = this.model.get('tags');
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        tag = _ref1[_i];
        this.$el.tagit('createTag', tag);
      }
      return this.duringRefresh = false;
    };

    return TagsView;

  })(BaseView);
  
});
window.require.register("views/templates/calendar_header", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<tbody><tr><td class="fc-header-left">');
  if ( calendarMode)
  {
  buf.push('<span class="fc-button fc-button-prev fc-corner-left"><span class="fc-text-arrow">‹</span></span><span class="fc-button fc-button-next fc-corner-right"><span class="fc-text-arrow">›</span></span><span class="fc-header-space"></span><span');
  buf.push(attrs({ "class": ('fc-button') + ' ' + ('fc-button-today') + ' ' + (active('today')) }, {"class":true}));
  buf.push('>');
  var __val__ = todaytxt
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span>');
  }
  buf.push('</td><td class="fc-header-center"><span class="fc-header-title"><h2>');
  var __val__ = title
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h2></span></td><td class="fc-header-right"><span');
  buf.push(attrs({ "class": ('fc-button') + ' ' + ('fc-button-month') + ' ' + (active('month')) }, {"class":true}));
  buf.push('>');
  var __val__ = t('month')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span><span');
  buf.push(attrs({ "class": ('fc-button') + ' ' + ('fc-button-week') + ' ' + (active('week')) }, {"class":true}));
  buf.push('>');
  var __val__ = t('week')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span><span');
  buf.push(attrs({ "class": ('fc-button') + ' ' + ('fc-button-list') + ' ' + (active('list')) }, {"class":true}));
  buf.push('>');
  var __val__ = t('list')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></td></tr></tbody>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/calendarview", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div id="alarms" class="well"></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/event_modal", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="modal-header"><span>');
  var __val__ = t('edit event')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span>&nbsp;');
  if ( typeof id != "undefined")
  {
  buf.push('<a');
  buf.push(attrs({ 'href':("events/" + (id) + "/" + (exportdate) + ".ics") }, {"href":true}));
  buf.push('><i class="fa fa-download fa-1"></i></a>');
  }
  buf.push('<button class="close">&times;</button></div><div class="modal-body"><form id="basic" class="form-inline"><div class="row-fluid"><div class="control-group span12"><label for="basic-summary" class="control-label">');
  var __val__ = t('summary')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><input');
  buf.push(attrs({ 'id':('basic-summary'), 'type':("text"), 'value':(summary), "class": ('span12') }, {"type":true,"value":true}));
  buf.push('/></div></div></div><div class="row-fluid"><div class="control-group span6 date"><label for="basic-start" class="control-label">');
  var __val__ = t('start')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><br/><input');
  buf.push(attrs({ 'id':('basic-start'), 'type':("datetime-local"), 'value':(start), "class": ('span12') }, {"type":true,"value":true}));
  buf.push('/></div><div class="control-group span6 date"><label for="basic-end" class="control-label">');
  var __val__ = t('end')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><br/><input');
  buf.push(attrs({ 'id':('basic-end'), 'type':("datetime-local"), 'value':(end), "class": ('span12') }, {"type":true,"value":true}));
  buf.push('/></div></div><div class="row-fluid"><div class="control-group span12"><label for="basic-place" class="control-label">');
  var __val__ = t('place')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><input');
  buf.push(attrs({ 'id':('basic-place'), 'type':("text"), 'value':(place), "class": ('span12') }, {"type":true,"value":true}));
  buf.push('/></div></div></div><div class="row-fluid"><div class="control-group span12"><label for="basic-calendar" class="control-label">');
  var __val__ = t('calendar')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><input');
  buf.push(attrs({ 'id':('basic-calendar'), 'value':(calendar) }, {"value":true}));
  buf.push('/></div></div><div style="display:none;" class="control-group span8"><label for="basic-tags" class="control-label">');
  var __val__ = t('tags')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><input');
  buf.push(attrs({ 'id':('basic-tags'), 'value':(tags.join(',')), "class": ('span12') + ' ' + ('tagit') }, {"value":true}));
  buf.push('/></div></div></div><div class="row-fluid"><div class="control-group span12"><label for="basic-description" class="control-label">');
  var __val__ = t('description')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><textarea id="basic-description" class="span12">');
  var __val__ = description
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</textarea></div></div></div></form><div id="guests-block"><h4>');
  var __val__ = t('guests')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h4><form id="guests" class="form-inline"><div class="control-group"><div class="controls"><input');
  buf.push(attrs({ 'id':('addguest-field'), 'type':("text"), 'placeholder':(t('enter email')) }, {"type":true,"placeholder":true}));
  buf.push('/><a id="addguest" class="btn">');
  var __val__ = t('invite')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></div></div></form><div id="guests-list"></div><h4>');
  var __val__ = t('recurrence')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h4><div id="rrule-container"></div></div></div><div class="modal-footer"><a id="cancel-btn">');
  var __val__ = t("cancel")
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a>&nbsp;<a id="confirm-btn" class="btn">');
  var __val__ = t("save changes")
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/event_modal_guest", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<p>');
  if ( model.status == 'ACCEPTED')
  {
  buf.push('<i class="icon-ok-circle green"></i>');
  }
  else if ( model.status == 'DECLINED')
  {
  buf.push('<i class="icon-ban-circle red"></i>');
  }
  else if ( model.status == 'NEED-ACTION')
  {
  buf.push('<i class="icon-time blue"></i>');
  }
  buf.push('&nbsp;' + escape((interp = model.email) == null ? '' : interp) + '</p>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/event_modal_rrule", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<p id="rrule-short"><i class="icon-arrow-right"></i><span id="rrule-help"></span><span id="rrule-action">&nbsp;-&nbsp;<a class="rrule-show">');
  var __val__ = t('Edit')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></span></p><form id="rrule" class="form-inline"><label for="rrule-interval" class="control-label">');
  var __val__ = t('repeat every')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="control-group"><input');
  buf.push(attrs({ 'id':('rrule-interval'), 'type':("number"), 'min':(1), 'value':(rrule.interval), "class": ('col-xs2') + ' ' + ('input-mini') }, {"type":true,"min":true,"value":true}));
  buf.push('/><select id="rrule-freq"><option');
  buf.push(attrs({ 'value':("NOREPEAT"), 'selected':(freqSelected('NOREPEAT')) }, {"value":true,"selected":true}));
  buf.push('>');
  var __val__ = t('no recurrence')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</option><option');
  buf.push(attrs({ 'value':(RRule.DAILY), 'selected':(freqSelected(RRule.DAILY)) }, {"value":true,"selected":true}));
  buf.push('>');
  var __val__ = units[4]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</option><option');
  buf.push(attrs({ 'value':(RRule.WEEKLY), 'selected':(freqSelected(RRule.WEEKLY)) }, {"value":true,"selected":true}));
  buf.push('>');
  var __val__ = units[5]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</option><option');
  buf.push(attrs({ 'value':(RRule.MONTHLY), 'selected':(freqSelected(RRule.MONTHLY)) }, {"value":true,"selected":true}));
  buf.push('>');
  var __val__ = units[6]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</option><option');
  buf.push(attrs({ 'value':(RRule.YEARLY), 'selected':(freqSelected(RRule.YEARLY)) }, {"value":true,"selected":true}));
  buf.push('>');
  var __val__ = units[7]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</option></select></div><div id="rrule-weekdays"><label class="control-label">');
  var __val__ = t('repeat on')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="control-group"><label class="checkbox inline">');
  var __val__ = weekDays[1]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('<input');
  buf.push(attrs({ 'type':("checkbox"), 'value':(1), 'checked':(wkdaySelected(1)) }, {"type":true,"value":true,"checked":true}));
  buf.push('/></label><label class="checkbox inline">');
  var __val__ = weekDays[2]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('<input');
  buf.push(attrs({ 'type':("checkbox"), 'value':(2), 'checked':(wkdaySelected(2)) }, {"type":true,"value":true,"checked":true}));
  buf.push('/></label><label class="checkbox inline">');
  var __val__ = weekDays[3]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('<input');
  buf.push(attrs({ 'type':("checkbox"), 'value':(3), 'checked':(wkdaySelected(3)) }, {"type":true,"value":true,"checked":true}));
  buf.push('/></label><label class="checkbox inline">');
  var __val__ = weekDays[4]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('<input');
  buf.push(attrs({ 'type':("checkbox"), 'value':(4), 'checked':(wkdaySelected(4)) }, {"type":true,"value":true,"checked":true}));
  buf.push('/></label><label class="checkbox inline">');
  var __val__ = weekDays[5]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('<input');
  buf.push(attrs({ 'type':("checkbox"), 'value':(5), 'checked':(wkdaySelected(5)) }, {"type":true,"value":true,"checked":true}));
  buf.push('/></label><label class="checkbox inline">');
  var __val__ = weekDays[6]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('<input');
  buf.push(attrs({ 'type':("checkbox"), 'value':(6), 'checked':(wkdaySelected(6)) }, {"type":true,"value":true,"checked":true}));
  buf.push('/></label><label class="checkbox inline">');
  var __val__ = weekDays[0]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('<input');
  buf.push(attrs({ 'type':("checkbox"), 'value':(0), 'checked':(wkdaySelected(0)) }, {"type":true,"value":true,"checked":true}));
  buf.push('/></label></div></div><div id="rrule-monthdays" class="control-group"><div class="controls"><label class="checkbox inline"><input');
  buf.push(attrs({ 'type':("radio"), 'checked':(yearModeIs('date')), 'name':("rrule-month-option"), 'value':("date") }, {"type":true,"checked":true,"name":true,"value":true}));
  buf.push('/>');
  var __val__ = t('repeat on date')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><label class="checkbox inline"><input');
  buf.push(attrs({ 'type':("radio"), 'checked':(yearModeIs('weekdate')), 'name':("rrule-month-option"), 'value':("weekdate") }, {"type":true,"checked":true,"name":true,"value":true}));
  buf.push('/>');
  var __val__ = t('repeat on weekday')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label></div></div><label for="rrule-until">');
  var __val__ = t('repeat')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="control-group"><label class="radio"><input');
  buf.push(attrs({ 'type':("radio"), 'name':("endMode"), 'value':('forever'), 'checked':(endModeSelected('forever')) }, {"type":true,"name":true,"value":true,"checked":true}));
  buf.push('/>');
  var __val__ = t('forever')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label></div><div class="control-group"><label class="radio"><input');
  buf.push(attrs({ 'type':("radio"), 'name':("endMode"), 'value':('count'), 'checked':(endModeSelected('count')) }, {"type":true,"name":true,"value":true,"checked":true}));
  buf.push('/><label for="rrule-count">');
  var __val__ = t('after')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><input');
  buf.push(attrs({ 'id':('rrule-count'), 'type':("number"), 'min':(0), 'value':(rrule.count), "class": ('input-mini') }, {"type":true,"min":true,"value":true}));
  buf.push('/><label for="rrule-count">');
  var __val__ = t('occurences')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label></label></div><div class="control-group"><label class="radio"><input');
  buf.push(attrs({ 'type':("radio"), 'name':("endMode"), 'value':('until'), 'checked':(endModeSelected('until')) }, {"type":true,"name":true,"value":true,"checked":true}));
  buf.push('/><label for="rrule-count">');
  var __val__ = t('until')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><input');
  buf.push(attrs({ 'id':('rrule-until'), 'type':("date"), 'value':(rrule.until) }, {"type":true,"value":true}));
  buf.push('/></label></div></form>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/import_alarm", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<p>' + escape((interp = time) == null ? '' : interp) + '\n' + escape((interp = description) == null ? '' : interp) + ' (' + escape((interp = action) == null ? '' : interp) + ')</p>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/import_event", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<p>' + escape((interp = start) == null ? '' : interp) + ' - ' + escape((interp = end) == null ? '' : interp) + '\n' + escape((interp = description) == null ? '' : interp) + ' (' + escape((interp = place) == null ? '' : interp) + ')</p>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/import_view", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div id="import-form" class="well"><div class="import-form"><div id="import-button" class="btn"><span>');
  var __val__ = t('select an icalendar file')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span><input id="import-file-input" type="file"/></div></div><div class="confirmation"><button id="confirm-import-button" class="btn">');
  var __val__ = t('confirm import')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</button><button id="cancel-import-button" class="btn">');
  var __val__ = t ('cancel')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</button></div><div class="results"><h4>');
  var __val__ = t('Alarms to import')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h4><div id="import-alarm-list"></div><h4>');
  var __val__ = t('Events to import')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h4><div id="import-event-list"></div></div></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/list_view", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div id="alarm-list" class="well"></div><a class="btn showbefore">');
  var __val__ = t('display previous events')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/list_view_bucket", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<h2>' + escape((interp = date) == null ? '' : interp) + '</h2><div class="alarms"></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/list_view_item", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  if ( type == 'alarm')
  {
  buf.push('<p><span');
  buf.push(attrs({ 'style':("background-color:"+color+";"), "class": ('badge') }, {"style":true}));
  buf.push('>&nbsp;</span>');
  if ( typeof timezoneHour != 'undefined')
  {
  buf.push('<span');
  buf.push(attrs({ 'title':("" + (timezoneHour) + " - " + (timezone) + "") }, {"title":true}));
  buf.push('>' + escape((interp = time) == null ? '' : interp) + '</span>');
  }
  else
  {
  buf.push('<span>' + escape((interp = time) == null ? '' : interp) + '</span>');
  }
  buf.push(' ' + escape((interp = description) == null ? '' : interp) + ' (' + escape((interp = t(action)) == null ? '' : interp) + ')<i class="icon-trash"></i></p>');
  }
  else if ( type == 'event')
  {
  buf.push('<p><span');
  buf.push(attrs({ 'style':("background-color:"+color+";"), "class": ('badge') }, {"style":true}));
  buf.push('>&nbsp;</span>' + escape((interp = start) == null ? '' : interp) + ' - ' + escape((interp = end) == null ? '' : interp) + '\n' + escape((interp = description) == null ? '' : interp) + '<i class="icon-trash"></i></p>');
  }
  }
  return buf.join("");
  };
});
window.require.register("views/templates/menu", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<li><a href="#sync"><i class="fa-refresh"></i><span>');
  var __val__ = t('Sync')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a></li><li class="calendars"><a href="#calendar"><i class="fa-calendar"></i><span>');
  var __val__ = t('Calendar')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a></li><ul id="menuitems"></ul>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/menu_item", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
   back = visible?color:"transparent"
   border = visible?"transparent":color
  buf.push('<span');
  buf.push(attrs({ 'style':("background-color:" + back + "; border: 1px solid "+border+";"), "class": ('badge') + ' ' + (true) }, {"class":true,"style":true}));
  buf.push('>&nbsp;</span><span>');
  var __val__ = label
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/popover_content", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  if ( type == 'alarm')
  {
  buf.push('<div class="line"><input');
  buf.push(attrs({ 'id':('input-time'), 'type':("time"), 'value':(time), "class": ('focused') + ' ' + ('input-mini') }, {"type":true,"value":true}));
  buf.push('/><select id="input-timezone" class="input">');
  // iterate timezones
  ;(function(){
    if ('number' == typeof timezones.length) {

      for (var $index = 0, $$l = timezones.length; $index < $$l; $index++) {
        var tz = timezones[$index];

  buf.push('<option');
  buf.push(attrs({ 'value':(tz), 'selected':((timezone == tz)) }, {"value":true,"selected":true}));
  buf.push('>');
  var __val__ = tz
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</option>');
      }

    } else {
      var $$l = 0;
      for (var $index in timezones) {
        $$l++;      var tz = timezones[$index];

  buf.push('<option');
  buf.push(attrs({ 'value':(tz), 'selected':((timezone == tz)) }, {"value":true,"selected":true}));
  buf.push('>');
  var __val__ = tz
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</option>');
      }

    }
  }).call(this);

  buf.push('</select></div><div class="line"><input');
  buf.push(attrs({ 'id':('input-desc'), 'type':("text"), 'value':(description), 'placeholder':(t("alarm description placeholder")), "class": ('input-xlarge') + ' ' + ('w100') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/></div><div class="line"><div id="rrule-container"></div></div><div class="popover-footer"><a class="btn add">');
  var __val__ = t('Edit')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></div>');
  }
  else if ( type = 'event')
  {
  buf.push('<div class="line"><span class="timeseparator">');
  var __val__ = t("from")
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span><input');
  buf.push(attrs({ 'id':('input-start'), 'type':("time"), 'value':(start), 'placeholder':(t("From hours:minutes")), "class": ('focused') + ' ' + ('input-mini') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/><span class="timeseparator">');
  var __val__ = t("to")
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span><input');
  buf.push(attrs({ 'id':('input-end'), 'type':("time"), 'value':(end), 'placeholder':(t("To hours:minutes+days")), "class": ('input-mini') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/><span class="timeseparator">&nbsp;,</span><input');
  buf.push(attrs({ 'id':('input-diff'), 'type':("number"), 'value':(diff), 'placeholder':(0), 'min':(0), "class": ('col-xs2') + ' ' + ('input-mini') }, {"type":true,"value":true,"placeholder":true,"min":true}));
  buf.push('/><span class="timeseparator">');
  var __val__ = '&nbsp;' + t('days later')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></div><div class="line"><input');
  buf.push(attrs({ 'id':('input-desc'), 'type':("text"), 'value':(description), 'placeholder':(t("Summary")), "class": ('input') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/><input');
  buf.push(attrs({ 'id':('input-place'), 'type':("text"), 'value':(place), 'placeholder':(t("Place")), "class": ('input-small') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/><a id="showmap" target="_blank" class="btn"><i class="icon-white icon-map-marker"></i></a></div><div class="popover-footer line"><a');
  buf.push(attrs({ 'href':('#'+advancedUrl), "class": ('advanced-link') }, {"href":true}));
  buf.push('>');
  var __val__ = t('advanced')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a><span>&nbsp;</span><a class="btn add">');
  var __val__ = editionMode ? t('Edit') : t('Create')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></div>');
  }
  }
  return buf.join("");
  };
});
window.require.register("views/templates/popover_title", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<input');
  buf.push(attrs({ 'id':('calendarcombo'), 'value':(calendar) }, {"value":true}));
  buf.push('/>');
  if ( !editionMode)
  {
  buf.push('<a id="toggle-type">');
  var __val__ = t('change to') + " " + t(type=='event'?'alarm':'event')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a>');
  }
  buf.push('<button');
  buf.push(attrs({ 'title':(t('close')), "class": ('close') }, {"title":true}));
  buf.push('>&times;</button><i');
  buf.push(attrs({ 'title':(t('delete')), "class": ('remove') + ' ' + ('icon-trash') }, {"title":true}));
  buf.push('></i>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/sync_view", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="helptext"><h2>');
  var __val__ = t('synchronization')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h2></div><div class="helptext"><h3>');
  var __val__ = t('mobile sync')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h3><p>');
  var __val__ = t('to sync your cal with') 
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</p><ol><li>');
  var __val__ = t('install the webdav module') 
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</li><li> ');
  var __val__ = t('connect to it and follow') 
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</li></ol></div><div class="helptext"><h3>');
  var __val__ = t('icalendar import')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h3><p>');
  var __val__ = t('download a copy of your calendar') 
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</p><p><a href="export/calendar.ics" class="btn">Export your calendar</a></p></div><div class="helptext"><h3>');
  var __val__ = t('icalendar import')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h3><p>');
  var __val__ = t('import an ical file') 
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</p><div id="importviewplaceholder"></div></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/toggle", function(exports, require, module) {
  var BaseView, Toggle, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  module.exports = Toggle = (function(_super) {
    __extends(Toggle, _super);

    function Toggle() {
      _ref = Toggle.__super__.constructor.apply(this, arguments);
      return _ref;
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
      var _this = this;
      return {
        'click': function() {
          return _this.toggle();
        }
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
window.require.register("views/widgets/combobox", function(exports, require, module) {
  var BaseView, ComboBox, colorhash, _ref,
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
      _ref = ComboBox.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ComboBox.prototype.events = {
      'keyup': 'updateBadge',
      'keypress': 'updateBadge',
      'change': 'updateBadge',
      'blur': 'onBlur'
    };

    ComboBox.prototype.initialize = function(options) {
      var caret, isInput, method,
        _this = this;
      ComboBox.__super__.initialize.apply(this, arguments);
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
      this.value = function() {
        return method.apply(_this.$el, arguments);
      };
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
      var value, _ref1, _ref2;
      if ((_ref1 = this.badge) != null) {
        _ref1.remove();
      }
      value = (ui != null ? (_ref2 = ui.item) != null ? _ref2.value : void 0 : void 0) || this.value();
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
