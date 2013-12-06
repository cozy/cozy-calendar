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
      var AlarmCollection, ContactCollection, EventCollection, Menu, Router, SocketListener, e, locales;
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
      SocketListener = require('../lib/socket_listener');
      AlarmCollection = require('collections/alarms');
      EventCollection = require('collections/events');
      ContactCollection = require('collections/contacts');
      this.router = new Router();
      this.menu = new Menu().render();
      $("body").append('<div class="main-container"></div>');
      this.menu.$el.appendTo('.main-container');
      this.alarms = new AlarmCollection();
      this.events = new EventCollection();
      this.contacts = new ContactCollection();
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
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ScheduleItemsCollection = require('./scheduleitems');

  Alarm = require('../models/alarm');

  module.exports = AlarmCollection = (function(_super) {
    __extends(AlarmCollection, _super);

    function AlarmCollection() {
      this.asFCEventSource = __bind(this.asFCEventSource, this);
      _ref = AlarmCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AlarmCollection.prototype.model = Alarm;

    AlarmCollection.prototype.url = 'alarms';

    AlarmCollection.prototype.asFCEventSource = function(start, end, callback) {
      var eventsInRange;
      eventsInRange = [];
      this.each(function(alarm) {
        var alarmTime, date, dates, rrule, _i, _len, _results;
        alarmTime = alarm.getDateObject();
        if (rrule = alarm.getRRuleObject()) {
          dates = rrule.between(start, end);
          _results = [];
          for (_i = 0, _len = dates.length; _i < _len; _i++) {
            date = dates[_i];
            _results.push(eventsInRange.push(alarm.toFullCalendarEvent(date)));
          }
          return _results;
        } else if (alarmTime.isBetween(start, end)) {
          return eventsInRange.push(alarm.toFullCalendarEvent());
        }
      });
      return callback(eventsInRange);
    };

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
      if (!model.getDateHash) {
        console.log(model, new Error().stack);
      }
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
      this.listenTo(this.alarmCollection, 'add', this.onBaseCollectionAdd);
      this.listenTo(this.alarmCollection, 'change:trigg', this.onBaseCollectionChange);
      this.listenTo(this.alarmCollection, 'remove', this.onBaseCollectionRemove);
      this.listenTo(this.alarmCollection, 'reset', this.resetFromBase);
      this.listenTo(this.eventCollection, 'add', this.onBaseCollectionAdd);
      this.listenTo(this.eventCollection, 'change:start', this.onBaseCollectionChange);
      this.listenTo(this.eventCollection, 'remove', this.onBaseCollectionRemove);
      this.listenTo(this.eventCollection, 'reset', this.resetFromBase);
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
      var bucket, old;
      old = this.get(model.getPreviousDateHash());
      bucket = this.get(model.getDateHash());
      if (old === bucket) {
        return;
      }
      old.items.remove(model);
      if (old.items.length === 0) {
        this.remove(old);
      }
      if (!bucket) {
        this.add(bucket = new DayBucket(model));
      }
      return bucket.items.add(model);
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

    return DayBucketCollection;

  })(Backbone.Collection);
  
});
window.require.register("collections/events", function(exports, require, module) {
  var Event, EventCollection, ScheduleItemsCollection, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ScheduleItemsCollection = require('./scheduleitems');

  Event = require('../models/event');

  module.exports = EventCollection = (function(_super) {
    __extends(EventCollection, _super);

    function EventCollection() {
      this.asFCEventSource = __bind(this.asFCEventSource, this);
      _ref = EventCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    EventCollection.prototype.model = Event;

    EventCollection.prototype.url = 'events';

    EventCollection.prototype.asFCEventSource = function(start, end, callback) {
      var eventsInRange;
      eventsInRange = [];
      this.each(function(event) {
        var date, dates, duration, eventEnd, eventStart, inRange, rrule, _i, _len, _results;
        eventStart = event.getStartDateObject();
        eventEnd = event.getEndDateObject();
        duration = eventEnd - eventStart;
        if (rrule = event.getRRuleObject()) {
          dates = rrule.between(Date.create(start - duration), end);
          _results = [];
          for (_i = 0, _len = dates.length; _i < _len; _i++) {
            date = dates[_i];
            _results.push(eventsInRange.push(event.toFullCalendarEvent(date)));
          }
          return _results;
        } else {
          inRange = eventStart.isBetween(start, end) || eventEnd.isBetween(start, end) || (eventStart.isBefore(start) && eventEnd.isAfter(end));
          if (inRange) {
            return eventsInRange.push(event.toFullCalendarEvent());
          }
        }
      });
      return callback(eventsInRange);
    };

    return EventCollection;

  })(ScheduleItemsCollection);
  
});
window.require.register("collections/scheduleitems", function(exports, require, module) {
  var ScheduleItemsCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = ScheduleItemsCollection = (function(_super) {
    __extends(ScheduleItemsCollection, _super);

    function ScheduleItemsCollection() {
      _ref = ScheduleItemsCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ScheduleItemsCollection.prototype.model = require('../models/scheduleitem');

    ScheduleItemsCollection.prototype.comparator = function(si1, si2) {
      var d1, d2;
      d1 = si1.getDateObject();
      d2 = si2.getDateObject();
      if (d1.getTime() < d2.getTime()) {
        return -1;
      } else if (d1.getTime() === d2.getTime()) {
        return 0;
      } else {
        return 1;
      }
    };

    return ScheduleItemsCollection;

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
    require('lib/app_helpers');
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
      'alarm': require('models/alarm')
    };

    SocketListener.prototype.events = ['alarm.create', 'alarm.update', 'alarm.delete'];

    SocketListener.prototype.onRemoteCreate = function(alarm) {
      return this.collection.add(alarm);
    };

    SocketListener.prototype.onRemoteDelete = function(alarm) {
      return this.collection.remove(alarm);
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
    "add the alarm": "add the alarm",
    "create alarm": "Alarm creation",
    "create event": "Event creation",
    "edit alarm": "Alarm edition",
    "edit event": "Event edition",
    "edit": "Edit",
    "create": "Create",
    "creation": "Creation",
    "invite": "Invite",
    "Place": "Place",
    "date": "date",
    "Day": "Day",
    "Edit": "Edit",
    "Email": "Email",
    "Import": "Import",
    "Export": "Export",
    "List": "List",
    "Calendar": "Calendar",
    "ie: 9:00 important meeting": "ie: 9:00 important meeting",
    "Month": "Month",
    "Popup": "Popup",
    "Switch to List": "Switch to List",
    "Switch to Calendar": "Switch to Calendar",
    "time": "time",
    "Today": "Today",
    "What should I remind you ?": "What should I remind you?",
    "alarm description placeholder": "What do you want to be reminded?",
    "ICalendar importer": "ICalendar importer",
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
    "Alarms": "Alarms",
    "Display": "Notification",
    "DISPLAY": "Notification",
    "EMAIL": "E-mail",
    "recurrence rule": "Recurrence rules",
    "make reccurent": "Make recurrent",
    "repeat every": "Repeat every",
    "no recurrence": "No recurrence",
    "repeat on": "Repeat on",
    "repeat on date": "Repeat on dates",
    "repeat on weekday": "Repeat on weekday",
    "repeat until": "Repeat until",
    "or after": "or after",
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
    "st": "st",
    "last": "last",
    "and": "and",
    "times": "times",
    "weekday": "weekday",
    "summary": "Summary",
    "place": "Place",
    "start": "Start",
    "end": "End",
    "change": "Change",
    "save changes": "Save changes",
    "guests": "Guests"
  };
  
});
window.require.register("locales/fr", function(exports, require, module) {
  module.exports = {
    "Add": "Ajouter",
    "add the alarm": "Ajouter l'alarme",
    "create alarm": "Création d'une alarme",
    "create event": "Création d'un évènement",
    "edit alarm": "Modification d'une alarme",
    "edit event": "Modification d'un évènement",
    "edit": "Enregistrer",
    "create": "Enregistrer",
    "creation": "Creation",
    "invite": "Inviter",
    "Place": "Lieu",
    "date": "Date",
    "Day": "Jour",
    "Edit": "Modifier",
    "Email": "Email",
    "Import": "Import",
    "Export": "Export",
    "List": "Liste",
    "Calendar": "Calendrier",
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
    "Week": "Semaine",
    "Alarms": "Alarmes",
    "Display": "Notification",
    "DISPLAY": "Notification",
    "EMAIL": "E-mail",
    "display previous events": "Montrer les évènements précédent",
    "event": "Evenement",
    "alarm": "Alarme",
    "are you sure": "Are you sure",
    "recurrence rule": "Règle de recurrence",
    "make reccurent": "Rendre réccurent",
    "repeat every": "Répéter tous les",
    "no recurrence": "Pas de répétition",
    "repeat on": "Répéter les",
    "repeat on date": "Répéter les jours du mois",
    "repeat on weekday": "Répéter le jour de la semaine",
    "repeat until": "Répéter jusqu'au",
    "or after": "ou après",
    "occurences": "occasions",
    "every": "tous les",
    "days": "jours",
    "days": "jours",
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
    "st": "er",
    "last": "dernier",
    "and": "et",
    "times": "fois",
    "weekday": "jours de la semaine",
    "summary": "Titre",
    "place": "Endroit",
    "start": "Début",
    "end": "Fin",
    "change": "Modifier",
    "save changes": "Enregistrer",
    "guests": "Invités",
    "enter email": "Entrer l'addresse email"
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

    Alarm.prototype.mainDateField = 'trigg';

    Alarm.prototype.urlRoot = 'alarms';

    Alarm.dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00";

    Alarm.prototype.validate = function(attrs, options) {
      var errors, _ref1;
      errors = [];
      if (!attrs.description || attrs.description === "") {
        errors.push({
          field: 'description',
          value: "A description must be set."
        });
      }
      if (!attrs.action || attrs.action === "") {
        errors.push({
          field: 'action',
          value: "An action must be set."
        });
      }
      if ((_ref1 = !attrs.action) === 'DISPLAY' || _ref1 === 'EMAIL') {
        errors.push({
          field: 'action',
          value: "A valid action must be set."
        });
      }
      if (!attrs.trigg || !Date.create(attrs.trigg).isValid()) {
        errors.push({
          field: 'triggdate',
          value: "The date or time format might be invalid. " + "It must be dd/mm/yyyy and hh:mm."
        });
      }
      if (errors.length > 0) {
        return errors;
      }
    };

    Alarm.prototype.getColor = function() {
      return '#5C5';
    };

    Alarm.prototype.initialize = function() {
      var _this = this;
      this.dateObject = Date.create(this.get(this.mainDateField));
      return this.on('change:' + this.mainDateField, function() {
        return _this.dateObject = Date.create(_this.get(_this.mainDateField));
      });
    };

    Alarm.prototype.getDateObject = function() {
      return this.dateObject;
    };

    Alarm.prototype.getRRuleObject = function() {
      return false;
    };

    Alarm.prototype.toFullCalendarEvent = function() {
      var end, event, time;
      time = this.getDateObject();
      end = time.clone().advance({
        minutes: 30
      });
      return event = {
        id: this.cid,
        title: "" + (time.format("{HH}:{mm}")) + " " + (this.get("description")),
        timezone: this.get('timezone'),
        allDay: false,
        start: time.format(Date.ISO8601_DATETIME),
        end: end.format(Date.ISO8601_DATETIME),
        type: 'alarm',
        timezoneHour: this.get('timezoneHour'),
        backgroundColor: this.getColor(),
        borderColor: this.getColor()
      };
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

    Event.prototype.mainDateField = 'start';

    Event.prototype.startDateField = 'start';

    Event.prototype.endDateField = 'end';

    Event.prototype.urlRoot = 'events';

    Event.prototype.validate = function(attrs, options) {
      var end, errors, start;
      errors = [];
      if (!attrs.description) {
        errors.push({
          field: 'description',
          value: "A description must be set."
        });
      }
      if (!attrs.start || !(start = Date.create(attrs.start)).isValid()) {
        errors.push({
          field: 'startdate',
          value: "The date or time format might be invalid. " + "It must be dd/mm/yyyy and hh:mm."
        });
      }
      if (!attrs.end || !(end = Date.create(attrs.end)).isValid()) {
        errors.push({
          field: 'enddate',
          value: "The date or time format might be invalid. " + "It must be dd/mm/yyyy and hh:mm."
        });
      }
      if (start.isAfter(end)) {
        errors.push({
          field: 'date',
          value: "The start date might be inferor than end date  " + "It must be dd/mm/yyyy and hh:mm."
        });
      }
      if (errors.length > 0) {
        return errors;
      }
    };

    Event.prototype.getColor = function() {
      return '#EB1';
    };

    Event.prototype.initialize = function() {
      var _this = this;
      this.startDateObject = Date.create(this.get(this.startDateField));
      this.endDateObject = Date.create(this.get(this.endDateField));
      this.on('change:start', function() {
        return _this.startDateObject = Date.create(_this.get(_this.startDateField));
      });
      return this.on('change:end', function() {
        return _this.endDateObject = Date.create(_this.get(_this.endDateField));
      });
    };

    Event.prototype.getStartDateObject = function() {
      return this.startDateObject;
    };

    Event.prototype.getDateObject = function() {
      return this.startDateObject;
    };

    Event.prototype.getFormattedStartDate = function(formatter) {
      return this.getStartDateObject().format(formatter);
    };

    Event.prototype.getEndDateObject = function() {
      return this.endDateObject;
    };

    Event.prototype.getFormattedEndDate = function(formatter) {
      return this.getEndDateObject().format(formatter);
    };

    Event.prototype.isOneDay = function() {
      return this.startDateObject.short() === this.endDateObject.short();
    };

    Event.prototype.toFullCalendarEvent = function(trueStart) {
      var color, end, fcEvent, start;
      start = this.getStartDateObject();
      end = this.getEndDateObject();
      color = this.getColor();
      if (trueStart) {
        end = end.clone().advance(trueStart - start);
        start = trueStart;
      }
      return fcEvent = {
        id: this.cid,
        title: "" + (start.format("{HH}:{mm}")) + " " + (this.get("description")),
        start: start.format(Date.ISO8601_DATETIME),
        end: end.format(Date.ISO8601_DATETIME),
        allDay: false,
        diff: this.get("diff"),
        place: this.get('place'),
        type: 'event',
        backgroundColor: color,
        borderColor: color
      };
    };

    return Event;

  })(ScheduleItem);
  
});
window.require.register("models/scheduleitem", function(exports, require, module) {
  var ScheduleItem, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = ScheduleItem = (function(_super) {
    __extends(ScheduleItem, _super);

    function ScheduleItem() {
      _ref = ScheduleItem.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ScheduleItem.prototype.mainDateField = '';

    ScheduleItem.dateFormat = "{Dow} {Mon} {dd} {yyyy} {HH}:{mm}:00";

    ScheduleItem.prototype.getDateObject = function() {
      if (this.dateObject == null) {
        this.dateObject = Date.create(this.get(this.mainDateField));
      }
      return this.dateObject;
    };

    ScheduleItem.prototype.getFormattedDate = function(formatter) {
      return this.getDateObject().format(formatter);
    };

    ScheduleItem.prototype.getPreviousDateObject = function() {
      if (this.previous(this.mainDateField) != null) {
        return Date.create(this.previous(this.mainDateField));
      } else {
        return false;
      }
    };

    ScheduleItem.prototype.getDateHash = function(date) {
      if (date == null) {
        date = this.getDateObject();
      }
      return date.format('{yyyy}{MM}{dd}');
    };

    ScheduleItem.prototype.getPreviousDateHash = function() {
      var previousDateObject;
      previousDateObject = this.getPreviousDateObject();
      if (previousDateObject) {
        return this.getDateHash(previousDateObject);
      } else {
        return false;
      }
    };

    ScheduleItem.prototype.getTimeHash = function(date) {
      if (date == null) {
        date = this.getDateObject();
      }
      return date.format('{yyyy}{MM}{dd}{HH}{mm}');
    };

    ScheduleItem.prototype.getPreviousTimeHash = function() {
      var previousDateObject;
      previousDateObject = this.getPreviousDateObject();
      if (previousDateObject) {
        return this.getTimeHash(previousDateObject);
      } else {
        return false;
      }
    };

    ScheduleItem.prototype.getRRuleObject = function() {
      var e, options;
      try {
        options = RRule.parseString(this.get('rrule'));
        options.dtstart = this.getStartDateObject();
      } catch (_error) {
        e = _error;
        return false;
      }
      return new RRule(options);
    };

    return ScheduleItem;

  })(Backbone.Model);
  
});
window.require.register("router", function(exports, require, module) {
  var CalendarView, DayBucketCollection, EventModal, ImportView, ListView, Router, app, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  app = require('application');

  ListView = require('views/list_view');

  CalendarView = require('views/calendar_view');

  EventModal = require('views/event_modal');

  ImportView = require('views/import_view');

  DayBucketCollection = require('collections/daybuckets');

  module.exports = Router = (function(_super) {
    __extends(Router, _super);

    function Router() {
      this.displayView = __bind(this.displayView, this);
      _ref = Router.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Router.prototype.routes = {
      '': function() {
        return this.navigate('calendar', true);
      },
      'calendar': 'calendar',
      'calendarweek': 'calendarweek',
      'list': 'list',
      'calendar/:eventid': 'calendar_event',
      'calendarweek/:eventid': 'calendarweek_event',
      'list/:eventid': 'list_event',
      'import': 'import'
    };

    Router.prototype.calendar = function(fcView) {
      if (fcView == null) {
        fcView = 'month';
      }
      this.displayView(new CalendarView({
        view: fcView,
        model: {
          alarms: app.alarms,
          events: app.events
        }
      }));
      app.menu.activate('calendar');
      this.handleFetch(app.alarms, "alarms");
      return this.handleFetch(app.events, "events");
    };

    Router.prototype.calendarweek = function() {
      return this.calendar('agendaWeek');
    };

    Router.prototype.list = function() {
      this.displayView(new ListView({
        collection: new DayBucketCollection()
      }));
      return app.menu.activate('list');
    };

    Router.prototype.calendar_event = function(id) {
      if (!(this.mainView instanceof CalendarView)) {
        this.calendar();
      }
      return this.event(id, 'calendar');
    };

    Router.prototype.calendarweek_event = function(id) {
      if (!(this.mainView instanceof CalendarView)) {
        this.calendarweek();
      }
      return this.event(id, 'calendarweek');
    };

    Router.prototype.list_event = function(id) {
      if (!(this.mainView instanceof ListView)) {
        this.list();
      }
      return this.event(id, 'list');
    };

    Router.prototype.event = function(id, backurl) {
      var model, view;
      model = app.events.get(id) || new Event({
        id: id
      }).fetch();
      view = new EventModal({
        model: model,
        backurl: backurl
      });
      $('body').append(view.$el);
      return view.render();
    };

    Router.prototype["import"] = function() {
      this.displayView(new ImportView());
      return app.menu.activate('import');
    };

    Router.prototype.handleFetch = function(collection, name) {
      if (!(app[name].length > 0)) {
        return collection.fetch({
          success: function(collection, response, options) {},
          error: function() {}
        });
      } else {
        return collection.reset(app[name].toJSON());
      }
    };

    Router.prototype.displayView = function(view) {
      if (this.mainView) {
        this.mainView.remove();
      }
      this.mainView = view;
      $('.main-container').append(this.mainView.$el);
      return this.mainView.render();
    };

    return Router;

  })(Backbone.Router);
  
});
window.require.register("views/calendar_popover", function(exports, require, module) {
  var Alarm, BaseView, Event, PopOver, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  Alarm = require('models/alarm');

  Event = require('models/event');

  module.exports = PopOver = (function(_super) {
    __extends(PopOver, _super);

    function PopOver() {
      this.onAddClicked = __bind(this.onAddClicked, this);
      this.onRemoveClicked = __bind(this.onRemoveClicked, this);
      this.getModelAttributes = __bind(this.getModelAttributes, this);
      _ref = PopOver.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PopOver.prototype.template = require('./templates/popover_content');

    PopOver.prototype.events = {
      'keyup input': 'onKeyUp',
      'change select': 'onKeyUp',
      'change input': 'onKeyUp',
      'click button.add': 'onAddClicked',
      'click .remove': 'onRemoveClicked',
      'click .close': 'selfclose',
      'click .event': 'onTabClicked',
      'click .alarm': 'onTabClicked'
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
        title: require('./templates/popover_title')({
          title: this.getTitle()
        }),
        html: true,
        placement: this.getDirection(),
        content: this.template(this.getRenderData())
      }).popover('show');
      this.setElement($('#viewContainer .popover'));
      this.addButton = this.$('button.add').text(this.getButtonText());
      this.addButton.toggleClass('disabled', this.validForm());
      this.removeButton = this.$('.remove');
      if (this.model.isNew()) {
        this.removeButton.hide();
      }
      this.$('input[type="time"]').attr('type', 'text').timepicker({
        template: false,
        minuteStep: 5,
        showMeridian: false
      });
      return this.$('.focused').focus();
    };

    PopOver.prototype.validForm = function() {
      if (this.model instanceof Event) {
        return this.$('#input-start').val() !== '' && this.$('#input-end').val() !== '' && this.$('#input-desc').val() !== '';
      } else {
        return this.$('#input-desc').val() !== '' && this.$('#input-time').val() !== '';
      }
    };

    PopOver.prototype.getTitle = function() {
      var title;
      title = this.model.isNew() ? 'creation' : 'edit ' + this.type;
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
      var data, diff, endDate, startDate;
      data = _.extend({
        type: this.type
      }, this.model.attributes, {
        editionMode: !this.model.isNew(),
        advancedUrl: this.parentView.getUrlHash() + '/' + this.model.id
      });
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
      var type;
      type = event.target.className;
      if (type === this.type) {
        return false;
      }
      return this.parentView.showPopover({
        type: type,
        target: this.options.target,
        start: this.options.start,
        end: this.options.end
      });
    };

    PopOver.prototype.onKeyUp = function(event) {
      if (!this.validForm()) {
        return this.addButton.addClass('disabled');
      } else if (event.keyCode === 13 || event.which === 13) {
        return this.addButton.click();
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
      var data, date, end, endDate, startDate;
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
        data = {
          timezone: this.$('#input-timezone').val(),
          timezoneHour: this.$('#input-time').val(),
          description: this.$('#input-desc').val()
        };
      }
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
      }
    };

    PopOver.prototype.onAddClicked = function() {
      var noError,
        _this = this;
      this.addButton.html('&nbsp;');
      this.addButton.spin('small');
      noError = this.model.save(this.getModelAttributes(), {
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
          _this.addButton.spin();
          _this.addButton.html(_this.getButtonText());
          return _this.selfclose();
        }
      });
      if (!noError) {
        return console.log(this.model.validationError);
      }
    };

    return PopOver;

  })(BaseView);
  
});
window.require.register("views/calendar_view", function(exports, require, module) {
  var Alarm, BaseView, CalendarView, Event, Popover, app, helpers, timezones, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  app = require('application');

  BaseView = require('../lib/base_view');

  Popover = require('./calendar_popover');

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

    CalendarView.prototype.id = 'viewContainer';

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
      return this.model = null;
    };

    CalendarView.prototype.afterRender = function() {
      var locale;
      locale = Date.getLocale(app.locale);
      this.cal = this.$('#alarms');
      this.cal.fullCalendar({
        header: {
          left: 'prev,next today',
          center: 'title',
          right: 'month,agendaWeek'
        },
        editable: true,
        firstDay: 1,
        weekMode: 'liquid',
        height: this.handleWindowResize('initial'),
        defaultView: this.options.view,
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
      this.cal.fullCalendar('addEventSource', this.eventCollection.asFCEventSource);
      this.cal.fullCalendar('addEventSource', this.alarmCollection.asFCEventSource);
      this.handleWindowResize();
      return $(window).resize(_.debounce(this.handleWindowResize, 10));
    };

    CalendarView.prototype.handleWindowResize = function(initial) {
      var diff, targetHeight;
      diff = 2 * parseInt(this.cal.css('padding-top'));
      targetHeight = $(window).height() - $('#menu').outerHeight(true) - diff;
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
      switch (view.name) {
        case 'month':
          app.router.navigate('calendar');
          break;
        case 'agendaWeek':
          app.router.navigate('calendarweek');
      }
      return this.handleWindowResize();
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
      var spinTarget;
      if ((event.isSaving != null) && event.isSaving) {
        spinTarget = $(element).find('.fc-event-time');
        spinTarget.addClass('spinning');
        spinTarget.html("&nbsp;");
        spinTarget.spin("tiny");
      }
      $(element).attr('title', event.title);
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
  var Event, EventModal, ViewCollection, app, random, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ViewCollection = require('lib/view_collection');

  Event = require('models/event');

  random = require('lib/random');

  app = require('application');

  module.exports = EventModal = (function(_super) {
    __extends(EventModal, _super);

    function EventModal() {
      this.close = __bind(this.close, this);
      this.configureGuestTypeahead = __bind(this.configureGuestTypeahead, this);
      this.updateHelp = __bind(this.updateHelp, this);
      this.toggleCountUntil = __bind(this.toggleCountUntil, this);
      this.getRRule = __bind(this.getRRule, this);
      this.showRRule = __bind(this.showRRule, this);
      this.save = __bind(this.save, this);
      this.refreshGuestList = __bind(this.refreshGuestList, this);
      this.onGuestAdded = __bind(this.onGuestAdded, this);
      _ref = EventModal.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    EventModal.prototype.template = require('./templates/event_modal');

    EventModal.prototype.id = 'event-modal';

    EventModal.prototype.className = 'modal fade';

    EventModal.prototype.inputDateTimeFormat = '{year}-{MM}-{dd}T{hh}:{mm}:{ss}';

    EventModal.prototype.inputDateFormat = '{year}-{MM}-{dd}';

    EventModal.prototype.collectionEl = '#guests-list';

    EventModal.prototype.itemview = require('./event_modal_guest');

    EventModal.prototype.initialize = function() {
      var guests;
      guests = this.model.get('attendees') || [];
      this.collection = new Backbone.Collection(guests);
      return EventModal.__super__.initialize.apply(this, arguments);
    };

    EventModal.prototype.events = function() {
      var _this = this;
      return {
        'click  #confirm-btn': 'save',
        'click  #cancel-btn': 'close',
        'click  .close': 'close',
        'click  .rrule-show': 'showRRule',
        'change #rrule': 'updateHelp',
        'input  #rrule-until': 'toggleCountUntil',
        'change #rrule-count': 'toggleCountUntil',
        'click #addguest': function() {
          return _this.onGuestAdded(_this.$('#addguest-field').val());
        }
      };
    };

    EventModal.prototype.afterRender = function() {
      EventModal.__super__.afterRender.apply(this, arguments);
      this.$('#rrule').hide();
      if (this.model.get('rrule')) {
        this.updateHelp();
        this.$('#rrule-toggle').hide();
      } else {
        this.$('#rrule').hide();
        this.$('#rrule-short').hide();
      }
      this.addGuestField = this.configureGuestTypeahead();
      return this.$el.modal('show');
    };

    EventModal.prototype.onGuestAdded = function(info) {
      var email, guests, id, _ref1;
      _ref1 = info.split(';'), email = _ref1[0], id = _ref1[1];
      if (!email) {
        return "";
      }
      guests = this.model.get('attendees') || [];
      guests.push({
        key: random.randomString(),
        status: 'INVITATION-NOT-SENT',
        email: email,
        contactid: id || null
      });
      this.model.set('attendees', guests);
      this.addGuestField.val('');
      this.refreshGuestList();
      return "";
    };

    EventModal.prototype.refreshGuestList = function() {
      return this.collection.reset(this.model.get('attendees'));
    };

    EventModal.prototype.getRenderData = function() {
      var data;
      data = _.extend({}, this.model.toJSON(), {
        weekDays: Date.getLocale().weekdays.slice(0, 7),
        units: Date.getLocale().units,
        start: this.model.getStartDateObject().format(this.inputDateTimeFormat),
        end: this.model.getEndDateObject().format(this.inputDateTimeFormat)
      });
      if (this.model.get('rrule')) {
        _.extend(data, this.getRRuleRenderData());
      } else {
        _.extend(data, {
          rrule: {
            freq: RRule.WEEKLY,
            interval: 1,
            count: 4,
            until: ""
          },
          freqSelected: function(value) {
            if (value === RRule.WEEKLY) {
              return 'selected';
            }
          },
          wkdaySelected: function() {
            return false;
          },
          yearModeIs: function(value) {
            if (value === 'date') {
              return "checked";
            }
          }
        });
      }
      return data;
    };

    EventModal.prototype.getRRuleRenderData = function() {
      var data, options, rrule;
      options = RRule.fromString(this.model.get('rrule')).options;
      rrule = {
        freq: options.freq,
        interval: options.interval
      };
      if (options.until) {
        rrule.until = Date.create(options.until).format(this.inputDateFormat);
        rrule.count = "";
      } else if (options.count) {
        rrule.count = options.count;
        rrule.until = "";
      }
      return data = {
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
        yearModeIs: function(value) {
          var result, _ref1, _ref2;
          result = (value === 'weekdate' && ((_ref1 = options.bynweekday) != null ? _ref1.length : void 0)) || (value === 'date' && ((_ref2 = options.bymonthday) != null ? _ref2.length : void 0));
          if (result) {
            return 'checked';
          }
        }
      };
    };

    EventModal.prototype.save = function() {
      var data,
        _this = this;
      if (this.$('confirm-btn').hasClass('disabled')) {
        return;
      }
      data = {
        description: this.$('#basic-summary').val(),
        place: this.$('#basic-place').val(),
        start: Date.create(this.$('#basic-start').val()).format(Event.dateFormat, 'en'),
        end: Date.create(this.$('#basic-end').val()).format(Event.dateFormat, 'en')
      };
      if (this.$('#rrule-help').is(':visible')) {
        data.rrule = this.getRRule().toString();
      } else {
        data.rrule = '';
      }
      return this.model.save(data, {
        wait: true,
        success: function() {
          return _this.close();
        },
        error: function() {
          alert('server error');
          return _this.close();
        }
      });
    };

    EventModal.prototype.showRRule = function() {
      var _this = this;
      this.updateHelp();
      this.$('#rrule-short #rrule-action').hide();
      return this.$('#rrule-toggle').fadeOut(function() {
        return _this.$('#rrule-short').slideDown(function() {
          return _this.$('#rrule').slideDown();
        });
      });
    };

    EventModal.prototype.getRRule = function() {
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
      if (this.$('#rrule-count').val() !== '') {
        options.count = +this.$('#rrule-count').val();
      } else {
        options.until = Date.create(this.$('#rrule-until').val());
      }
      return new RRule(options);
    };

    EventModal.prototype.toggleCountUntil = function(event) {
      if (event.target.id === "rrule-count") {
        return this.$('#rrule-until').val('');
      } else if (event.target.id === "rrule-until") {
        return this.$('#rrule-count').val('');
      }
    };

    EventModal.prototype.updateHelp = function() {
      var freq, language, locale;
      freq = this.$('#rrule-freq').val();
      if (freq === 'NOREPEAT') {
        this.$('#rrule-toggle').show();
        this.$('#rrule-short').hide();
        this.$('#rrule').hide();
        this.$('#rrule-freq').val('WEEKLY');
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
      return this.$('#rrule-help').html(this.getRRule().toText(window.t, language));
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
      var _this = this;
      this.$el.modal('hide');
      return this.$el.on('hidden', function() {
        _this.remove();
        return app.router.navigate(_this.options.backurl || '', true);
      });
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

    ImportView.prototype.id = 'viewContainer';

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
              alarm = new Alarm(valarm);
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
      var alarms, events, finish, saveAlarms, saveEvents,
        _this = this;
      alarms = this.alarmList.collection.toArray();
      events = this.eventList.collection.toArray();
      finish = function() {
        _this.$(".confirmation").fadeOut();
        _this.$(".results").slideUp(function() {
          _this.$(".import-form").fadeIn();
          return _this.confirmButton.html(t('confirm import'));
        });
        _this.alarmList.collection.reset();
        return _this.eventList.collection.reset();
      };
      saveAlarms = function(alarms) {
        if (alarms.length > 0) {
          alarms.pop().save();
          return saveAlarms(alarms);
        } else {
          return finish();
        }
      };
      saveEvents = function(events) {
        if (events.length > 0) {
          events.pop().save();
          return saveEvents(events);
        } else {
          return saveAlarms(alarms);
        }
      };
      this.confirmButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      this.confirmButton.spin('tiny');
      return saveEvents(events);
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
  var ListView, ViewCollection, defaultTimezone, helpers, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ViewCollection = require('../lib/view_collection');

  helpers = require('../helpers');

  defaultTimezone = 'timezone';

  module.exports = ListView = (function(_super) {
    __extends(ListView, _super);

    function ListView() {
      this.showbefore = __bind(this.showbefore, this);
      _ref = ListView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ListView.prototype.id = 'viewContainer';

    ListView.prototype.template = require('./templates/list_view');

    ListView.prototype.itemview = require('./list_view_bucket');

    ListView.prototype.collectionEl = '#alarm-list';

    ListView.prototype.events = {
      'click .showbefore': 'showbefore'
    };

    ListView.prototype.appendView = function(view) {
      var el, index, prevCid;
      index = this.collection.indexOf(view.model);
      el = view.$el;
      if (view.model.get('date').isBefore(Date.now())) {
        el.addClass('before').hide();
      } else {
        el.addClass('after');
      }
      if (index === 0) {
        return this.$collectionEl.prepend(el);
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
  var AlarmView, BaseView, Event, Popover, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseView = require('../lib/base_view');

  Popover = require('./calendar_popover');

  Event = require('../models/event');

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
      return this.listenTo(this.model, "change", this.render);
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
      var data;
      data = this.model.toJSON();
      if (this.model instanceof Event) {
        window.test = this.model;
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

    AlarmView.prototype.tagName = 'ul';

    AlarmView.prototype.id = 'menu';

    AlarmView.prototype.className = 'container';

    AlarmView.prototype.template = require('./templates/menu');

    AlarmView.prototype.activate = function(href) {
      this.$('.active').removeClass('active');
      return this.$('a[href="#' + href + '"]').addClass('active');
    };

    return AlarmView;

  })(BaseView);
  
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
  buf.push('</span><button class="close">&times;</button></div><div class="modal-body"><form id="basic" class="form-inline"><div class="row-fluid"><div class="control-group span12"><label for="basic-summary" class="control-label">');
  var __val__ = t('summary')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><input');
  buf.push(attrs({ 'id':('basic-summary'), 'type':("text"), 'value':(description), "class": ('span12') }, {"type":true,"value":true}));
  buf.push('/></div></div></div><div class="row-fluid"><div class="control-group span12"><label for="basic-place" class="control-label">');
  var __val__ = t('place')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><input');
  buf.push(attrs({ 'id':('basic-place'), 'type':("text"), 'value':(place), "class": ('span12') }, {"type":true,"value":true}));
  buf.push('/></div></div></div><div class="row-fluid"><div class="control-group span6"><label for="basic-start" class="control-label">');
  var __val__ = t('start')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><input');
  buf.push(attrs({ 'id':('basic-start'), 'type':("datetime-local"), 'value':(start) }, {"type":true,"value":true}));
  buf.push('/></div></div><div class="control-group span6"><label for="basic-end" class="control-label">');
  var __val__ = t('end')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="controls"><input');
  buf.push(attrs({ 'id':('basic-end'), 'type':("datetime-local"), 'value':(end) }, {"type":true,"value":true}));
  buf.push('/></div></div></div></form><h4>');
  var __val__ = t('recurrence rule')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h4><p id="rrule-toggle"><a class="btn rrule-show">');
  var __val__ = t('make reccurent')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></p><p id="rrule-short"><i class="icon-arrow-right"></i><span id="rrule-help"></span><span id="rrule-action">&nbsp;-&nbsp;<a class="rrule-show">');
  var __val__ = t('Edit')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></span></p><form id="rrule" class="form-inline"><label for="rrule-interval" class="control-label">');
  var __val__ = t('repeat every')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="control-group"><input');
  buf.push(attrs({ 'id':('rrule-interval'), 'type':("number"), 'value':(rrule.interval), "class": ('col-xs2') + ' ' + ('input-mini') }, {"type":true,"value":true}));
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
  buf.push('</option></select></div><label class="control-label">');
  var __val__ = t('repeat on')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div id="rrule-weekdays" class="control-group"><label class="checkbox inline">');
  var __val__ = weekDays[0]
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('<input');
  buf.push(attrs({ 'type':("checkbox"), 'value':(0), 'checked':(wkdaySelected(0)) }, {"type":true,"value":true,"checked":true}));
  buf.push('/></label><label class="checkbox inline">');
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
  buf.push('/></label></div><div id="rrule-monthdays" class="control-group"><div class="controls"><label class="checkbox inline"><input');
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
  var __val__ = t('repeat until')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><div class="control-group"><input');
  buf.push(attrs({ 'id':('rrule-until'), 'type':("date"), 'value':(rrule.until) }, {"type":true,"value":true}));
  buf.push('/><label for="rrule-count">');
  var __val__ = t('or after')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label><input');
  buf.push(attrs({ 'id':('rrule-count'), 'type':("number"), 'value':(rrule.count), "class": ('input-mini') }, {"type":true,"value":true}));
  buf.push('/><label for="rrule-count">');
  var __val__ = t('occurences')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</label></div></form><h4>');
  var __val__ = t('guests')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h4><form id="guests" class="form-inline"><div class="control-group"><div class="controls"><input');
  buf.push(attrs({ 'id':('addguest-field'), 'type':("text"), 'placeholder':(t('enter email')) }, {"type":true,"placeholder":true}));
  buf.push('/><a id="addguest" class="btn">');
  var __val__ = t('invite')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></div></div><p class="info">The invitations will be sent after you click "Save Changes"</p></form><div id="guests-list"></div></div><div class="modal-footer"><a id="cancel-btn">');
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
  buf.push('<div class="container"><div id="import-form" class="well"><h3>');
  var __val__ = t('ICalendar importer')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h3><div class="import-form"><div id="import-button" class="btn"><span>');
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
  buf.push('</h4><div id="import-event-list"></div></div></div></div>');
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
  buf.push('<div class="container"><div id="alarm-list" class="well"></div><a class="btn showbefore">');
  var __val__ = t('display previous events')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></div>');
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
  buf.push(attrs({ 'title':("" + (timezoneHour) + " - " + (timezone) + "") }, {"title":true}));
  buf.push('>' + escape((interp = time) == null ? '' : interp) + '</span> ' + escape((interp = description) == null ? '' : interp) + ' (' + escape((interp = t(action)) == null ? '' : interp) + ')<i class="icon-trash"></i></p>');
  }
  else if ( type == 'event')
  {
  buf.push('<p>' + escape((interp = start) == null ? '' : interp) + ' - ' + escape((interp = end) == null ? '' : interp) + '\n' + escape((interp = description) == null ? '' : interp) + '<i class="icon-trash"></i></p>');
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
  buf.push('<li><a href="#calendar" class="btn"><i class="icon-calendar icon-white"></i><span>');
  var __val__ = t('Calendar')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a></li><li><a href="#list" class="btn"><i class="icon-list icon-white"></i><span>');
  var __val__ = t('List')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a></li><li><a id="import-menu-button" href="#import" class="btn"><i class="icon-circle-arrow-up icon-white"></i><span>');
  var __val__ = t('Import')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a></li><li><a href="export/calendar.ics" target="_blank" class="btn"><i class="icon-share icon-white"></i><span>');
  var __val__ = t('Export')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a></li>');
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
  if ( !editionMode)
  {
  buf.push('<ul class="nav nav-tabs"><li');
  buf.push(attrs({ "class": (type=='event'?'active':'') }, {"class":true}));
  buf.push('><a class="event">');
  var __val__ = t('event')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></li><li');
  buf.push(attrs({ "class": (type=='alarm'?'active':'') }, {"class":true}));
  buf.push('><a class="alarm">');
  var __val__ = t('alarm')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a></li></ul>');
  }
  if ( type == 'alarm')
  {
  buf.push('<div><input');
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

  buf.push('</select><input');
  buf.push(attrs({ 'id':('input-desc'), 'type':("text"), 'value':(description), 'placeholder':(t("alarm description placeholder")), "class": ('input-xlarge') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/></div><div class="popover-footer"><button class="btn add">');
  var __val__ = t('Edit')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</button></div>');
  }
  else if ( type = 'event')
  {
  buf.push('<div><span class="timeseparator">&nbsp;From</span><input');
  buf.push(attrs({ 'id':('input-start'), 'type':("time"), 'value':(start), 'placeholder':(t("From hours:minutes")), "class": ('focused') + ' ' + ('input-mini') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/><span class="timeseparator">&nbsp;to</span><input');
  buf.push(attrs({ 'id':('input-end'), 'type':("time"), 'value':(end), 'placeholder':(t("To hours:minutes+days")), "class": ('input-mini') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/><span class="timeseparator">&nbsp;+</span><input');
  buf.push(attrs({ 'id':('input-diff'), 'type':("number"), 'value':(diff), 'placeholder':(0), "class": ('col-xs2') + ' ' + ('input-mini') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/><span class="timeseparator">');
  var __val__ = t('&nbsp;days')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></div><div><input');
  buf.push(attrs({ 'id':('input-place'), 'type':("text"), 'value':(place), 'placeholder':(t("Place")), "class": ('input-small') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/><input');
  buf.push(attrs({ 'id':('input-desc'), 'type':("text"), 'value':(description), 'placeholder':(t("Description")), "class": ('input') }, {"type":true,"value":true,"placeholder":true}));
  buf.push('/></div><div class="popover-footer">');
  if ( editionMode)
  {
  buf.push('<a');
  buf.push(attrs({ 'href':('#'+advancedUrl), "class": ('advanced-link') }, {"href":true}));
  buf.push('>');
  var __val__ = t('advanced')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</a>');
  }
  buf.push('<span>&nbsp;</span><button class="btn add">');
  var __val__ = editionMode ? t('Edit') : t('Create')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</button></div>');
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
  buf.push('<span>' + escape((interp = title) == null ? '' : interp) + '&nbsp;<i class="remove icon-trash"> </i></span><button class="close">&times;</button>');
  }
  return buf.join("");
  };
});
