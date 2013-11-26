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
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
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
    this.menu.$el.appendTo('body');
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

;require.register("collections/alarms", function(exports, require, module) {
var Alarm, AlarmCollection, ScheduleItemsCollection, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ScheduleItemsCollection = require('./scheduleitems');

Alarm = require('../models/alarm');

module.exports = AlarmCollection = (function(_super) {
  __extends(AlarmCollection, _super);

  function AlarmCollection() {
    this.asFCEventSource = __bind(this.asFCEventSource, this);    _ref = AlarmCollection.__super__.constructor.apply(this, arguments);
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

;require.register("collections/contacts", function(exports, require, module) {
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

;require.register("collections/events", function(exports, require, module) {
var Event, EventCollection, ScheduleItemsCollection, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ScheduleItemsCollection = require('./scheduleitems');

Event = require('../models/event');

module.exports = EventCollection = (function(_super) {
  __extends(EventCollection, _super);

  function EventCollection() {
    this.asFCEventSource = __bind(this.asFCEventSource, this);    _ref = EventCollection.__super__.constructor.apply(this, arguments);
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

;require.register("collections/scheduleitems", function(exports, require, module) {
var ScheduleItemsCollection, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = ScheduleItemsCollection = (function(_super) {
  __extends(ScheduleItemsCollection, _super);

  function ScheduleItemsCollection() {
    _ref = ScheduleItemsCollection.__super__.constructor.apply(this, arguments);
    return _ref;
  }

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

;require.register("lib/app_helpers", function(exports, require, module) {
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

;require.register("lib/base_view", function(exports, require, module) {
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

;require.register("lib/view", function(exports, require, module) {
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

;require.register("lib/view_collection", function(exports, require, module) {
var BaseView, ViewCollection, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseView = require('lib/base_view');

module.exports = ViewCollection = (function(_super) {
  __extends(ViewCollection, _super);

  function ViewCollection() {
    this.removeItem = __bind(this.removeItem, this);
    this.addItem = __bind(this.addItem, this);    _ref = ViewCollection.__super__.constructor.apply(this, arguments);
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
    var collectionEl;

    ViewCollection.__super__.initialize.apply(this, arguments);
    this.views = {};
    this.listenTo(this.collection, "reset", this.onReset);
    this.listenTo(this.collection, "add", this.addItem);
    this.listenTo(this.collection, "remove", this.removeItem);
    if (this.collectionEl == null) {
      return collectionEl = el;
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

    this.$collectionEl = $(this.collectionEl);
    _ref1 = this.views;
    for (id in _ref1) {
      view = _ref1[id];
      this.appendView(view.$el);
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

;require.register("locales/en", function(exports, require, module) {
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

;require.register("locales/fr", function(exports, require, module) {
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
  "Week": "Semaine",
  "Alarms": "Alarmes",
  "Display": "Notification",
  "DISPLAY": "Notification",
  "EMAIL": "E-mail",
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

;require.register("models/alarm", function(exports, require, module) {
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

;require.register("models/contact", function(exports, require, module) {
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

;require.register("models/event", function(exports, require, module) {
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

;require.register("models/scheduleitem", function(exports, require, module) {
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

  ScheduleItem.prototype.getDate = function(formatter) {
    return Date.create(this.get(this.mainDateField)).format(formatter);
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

;require.register("router", function(exports, require, module) {
var AlarmCollection, CalendarView, EventModal, ImportView, ListView, Router, app, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

app = require('application');

ListView = require('views/list_view');

CalendarView = require('views/calendar_view');

EventModal = require('views/event_modal');

ImportView = require('views/import_view');

AlarmCollection = require('collections/alarms');

module.exports = Router = (function(_super) {
  __extends(Router, _super);

  function Router() {
    this.displayView = __bind(this.displayView, this);    _ref = Router.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Router.prototype.routes = {
    '': function() {
      return this.navigate('calendar', true);
    },
    'calendar': 'calendar',
    'calendarweek': 'calendarweek',
    'calendar/:eventid': 'calendar_event',
    'calendarweek/:eventid': 'calendarweek_event',
    'alarms': 'alarmsList',
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

  Router.prototype.alarmsList = function() {
    this.displayView(new ListView({
      collection: app.alarms
    }));
    app.menu.activate('alarms');
    return this.handleFetch(this.mainView.collection, "alarms");
  };

  Router.prototype.calendar_event = function(id) {
    if (!(this.mainView instanceof CalendarView)) {
      this.calendar();
    }
    return this.event(id);
  };

  Router.prototype.calendarweek_event = function(id) {
    if (!(this.mainView instanceof CalendarView)) {
      this.calendarweek();
    }
    return this.event(id);
  };

  Router.prototype.event = function(id) {
    var model, view;

    model = app.events.get(id) || new Event({
      id: id
    }).fetch();
    view = new EventModal({
      model: model
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
        success: function(collection, response, options) {
          console.log(collection);
          return console.log("Fetch: success");
        },
        error: function() {
          return console.log("Fetch: error");
        }
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
    $('body').append(this.mainView.$el);
    return this.mainView.render();
  };

  return Router;

})(Backbone.Router);

});

;require.register("views/alarm_form_view", function(exports, require, module) {
var AlarmFormView, View, defaultTimezone, timezones, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('../lib/view');

timezones = require('helpers/timezone').timezones;

defaultTimezone = 'timezone';

module.exports = AlarmFormView = (function(_super) {
  __extends(AlarmFormView, _super);

  function AlarmFormView() {
    this.onSubmit = __bind(this.onSubmit, this);    _ref = AlarmFormView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  AlarmFormView.prototype.el = '#add-alarm';

  AlarmFormView.prototype.template = function() {
    return require('./templates/alarm_form');
  };

  AlarmFormView.prototype.events = {
    'focus #input-desc': 'onFocus',
    'blur #input-desc': 'onBlur',
    'keyup #input-desc': 'onKeyUp',
    'click .add-alarm': 'onSubmit',
    'click .cancel': 'resetForm'
  };

  AlarmFormView.prototype.initialize = function() {
    var timezone, timezoneData, _i, _len;

    this.actions = {
      'DISPLAY': 'Display',
      'EMAIL': 'Email'
    };
    this.data = null;
    this.editionMode = false;
    timezoneData = [];
    for (_i = 0, _len = timezones.length; _i < _len; _i++) {
      timezone = timezones[_i];
      timezoneData.push({
        value: timezone
      });
    }
    return this.timezones = timezoneData;
  };

  AlarmFormView.prototype.render = function() {
    var content, todayDate;

    todayDate = Date.create('now');
    content = AlarmFormView.__super__.render.call(this, {
      actions: this.actions,
      defaultAction: this.getDefaultAction('DISPLAY'),
      defaultTimezone: defaultTimezone,
      timezones: this.timezones,
      defaultDate: todayDate.format('{dd}/{MM}/{yyyy}'),
      defaultTime: todayDate.format('{HH}:{mm}')
    });
    return this.$el.append(content);
  };

  AlarmFormView.prototype.afterRender = function() {
    var datePicker;

    this.descriptionField = this.$('#input-desc');
    this.actionField = this.$('#action');
    this.dateField = this.$('#input-date');
    this.timeField = this.$('#input-time');
    this.timezoneField = this.$('#input-timezone');
    this.addAlarmButton = this.$('button.add-alarm');
    this.cancelButton = this.$('button.cancel');
    this.cancelButton.hide();
    this.disableSubmitButton();
    this.validationMapper = {
      action: {
        field: this.actionField,
        placement: 'left'
      },
      description: {
        field: this.descriptionField,
        placement: 'top'
      },
      triggdate: {
        field: this.$('#date-control'),
        placement: 'bottom'
      }
    };
    datePicker = this.dateField.datepicker({
      weekStart: 1,
      format: 'dd/mm/yyyy'
    });
    datePicker.on('changeDate', function() {
      return $(this).datepicker('hide');
    });
    this.timeField.timepicker({
      minuteStep: 1,
      showMeridian: false
    });
    return this.descriptionField.focus();
  };

  AlarmFormView.prototype.getDefaultAction = function(defaultAction) {
    var action, actionsAlreadySelected, selectedOptions;

    if (typeof defaultDefaultAction === "undefined" || defaultDefaultAction === null) {
      defaultAction = 'DISPLAY';
    }
    selectedOptions = this.$('#action').filter(':selected');
    actionsAlreadySelected = [];
    selectedOptions.each(function(index, item) {
      var itemValue;

      itemValue = $(item).val();
      if (actionsAlreadySelected.indexOf(itemValue) === -1) {
        return actionsAlreadySelected.push(itemValue);
      }
    });
    for (action in this.actions) {
      if (actionsAlreadySelected.indexOf(action) === -1) {
        return action;
      }
    }
    return defaultAction;
  };

  AlarmFormView.prototype.onKeyUp = function(event) {
    if (this.descriptionField.val() === '') {
      return this.disableSubmitButton();
    } else if (event.keyCode === 13 || event.which === 13) {
      return this.onSubmit();
    } else {
      return this.enableSubmitButton();
    }
  };

  AlarmFormView.prototype.enableSubmitButton = function() {
    return this.addAlarmButton.removeClass('disabled');
  };

  AlarmFormView.prototype.disableSubmitButton = function() {
    return this.addAlarmButton.addClass('disabled');
  };

  AlarmFormView.prototype.loadAlarmData = function(alarm) {
    this.resetForm();
    this.descriptionField.val(alarm.get('description'));
    this.dateField.val(alarm.getFormattedDate('{dd}/{MM}/{yyyy}'));
    this.timezoneField.val(alarm.get(defaultTimezone));
    if (alarm.get('timezoneHour') != null) {
      this.timeField.val(alarm.get('timezoneHour'));
    } else {
      this.timeField.val(alarm.getFormattedDate('{HH}:{mm}'));
    }
    this.data = alarm;
    this.editionMode = true;
    this.addAlarmButton.html('Edit the alarm');
    this.cancelButton.show();
    return this.enableSubmitButton();
  };

  AlarmFormView.prototype.resetForm = function() {
    var todayDate;

    this.cancelButton.hide();
    this.data = null;
    this.editionMode = false;
    this.addAlarmButton.html('add the alarm');
    this.disableSubmitButton();
    this.descriptionField.val('');
    todayDate = Date.create('now');
    this.dateField.val(todayDate.format('{dd}/{MM}/{yyyy}'));
    this.timeField.val(todayDate.format('{HH}:{mm}'));
    this.timezoneField.val(defaultTimezone);
    return this.resetErrors();
  };

  AlarmFormView.prototype.displayErrors = function(validationErrors) {
    var _this = this;

    return validationErrors.forEach(function(err) {
      var data;

      data = _this.validationMapper[err.field];
      return data.field.tooltip({
        title: err.value,
        placement: data.placement,
        container: _this.$el,
        trigger: 'manual'
      }).tooltip('show');
    });
  };

  AlarmFormView.prototype.resetErrors = function() {
    var index, mappedElement, _ref1, _results;

    _ref1 = this.validationMapper;
    _results = [];
    for (index in _ref1) {
      mappedElement = _ref1[index];
      _results.push(mappedElement.field.tooltip('destroy'));
    }
    return _results;
  };

  AlarmFormView.prototype.onSubmit = function() {
    return this.resetErrors();
  };

  return AlarmFormView;

})(View);

});

;require.register("views/alarm_view", function(exports, require, module) {
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

  AlarmView.prototype.className = 'scheduleElement';

  AlarmView.prototype.template = require('./templates/alarm');

  AlarmView.prototype.initialize = function() {
    return this.listenTo(this.model, "change", this.render);
  };

  AlarmView.prototype.getRenderData = function() {
    return {
      action: this.model.get('action'),
      time: this.model.getDate('{HH}:{mm}'),
      description: this.model.get('description'),
      timezone: this.model.get('timezone'),
      alarmID: this.model.id
    };
  };

  return AlarmView;

})(BaseView);

});

;require.register("views/alarms_list_view", function(exports, require, module) {
var Alarm, AlarmCollection, AlarmsListView, DayProgramView, View, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('../lib/view');

DayProgramView = require('./dayprogram_view');

AlarmCollection = require('../collections/alarms');

Alarm = require('../models/alarm');

module.exports = AlarmsListView = (function(_super) {
  __extends(AlarmsListView, _super);

  function AlarmsListView() {
    _ref = AlarmsListView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  AlarmsListView.prototype.el = '#alarm-list';

  AlarmsListView.prototype.initialize = function() {
    this.listenTo(this.collection, "add", this.onAdd);
    this.listenTo(this.collection, "change", this.onChange);
    this.listenTo(this.collection, "remove", this.onRemove);
    this.listenTo(this.collection, "reset", this.onReset);
    this.views = {};
    this.dayPrograms = new Backbone.Collection;
    this.dayPrograms.comparator = function(dayProg1, dayProg2) {
      var d1, d2;

      d1 = Date.create(dayProg1.get('date'));
      d2 = Date.create(dayProg2.get('date'));
      if (d1.getTime() < d2.getTime()) {
        return 1;
      } else if (d1.getTime() === d2.getTime()) {
        return 0;
      } else {
        return -1;
      }
    };
    return this.listenTo(this.dayPrograms, "remove", this.onRemoveDayProgram);
  };

  AlarmsListView.prototype.onReset = function() {
    var _this = this;

    return this.collection.forEach(function(item) {
      return _this.onAdd(item, _this.collection);
    });
  };

  AlarmsListView.prototype.onAdd = function(alarm, alarms) {
    var dateHash, view,
      _this = this;

    dateHash = alarm.getDateHash();
    view = this.getSubView(dateHash, function() {
      return _this._getNewSubView(dateHash, alarm);
    });
    return view.model.get('alarms').add(alarm);
  };

  AlarmsListView.prototype.onChange = function(alarm) {
    var dateHash, prevDateHash, prevView, view,
      _this = this;

    dateHash = alarm.getDateHash();
    view = this.getSubView(dateHash, function() {
      _this.onAdd(alarm);
      return false;
    });
    prevDateHash = alarm.getPreviousDateHash();
    if ((alarm.changedAttributes().trigg != null) && prevDateHash !== dateHash) {
      prevView = this.views[prevDateHash];
      return prevView.model.get('alarms').remove(alarm);
    }
  };

  AlarmsListView.prototype.onRemoveDayProgram = function(dayProgram) {
    var dateHash;

    dateHash = dayProgram.get('dateHash');
    this.views[dateHash].destroy();
    return delete this.views[dateHash];
  };

  AlarmsListView.prototype.onRemove = function(alarm) {
    var dateHash, view,
      _this = this;

    dateHash = alarm.getDateHash();
    view = this.getSubView(dateHash, function() {
      return null;
    });
    if (view != null) {
      return view.model.get('alarms').remove(alarm);
    }
  };

  AlarmsListView.prototype.getSubView = function(dateHash, callbackIfNotExist) {
    var tmp;

    if (this.views[dateHash] != null) {
      return this.views[dateHash];
    } else {
      tmp = callbackIfNotExist();
      if (tmp instanceof DayProgramView) {
        return this.views[dateHash] = tmp;
      } else {
        return false;
      }
    }
  };

  AlarmsListView.prototype._getNewSubView = function(dateHash, alarm) {
    var date;

    date = alarm.getDateObject().beginningOfDay();
    this._buildSubView(dateHash, date);
    return this._renderSubView(dateHash);
  };

  AlarmsListView.prototype._buildSubView = function(dateHash, date) {
    var dayProgram, model;

    model = new Backbone.Model({
      date: date,
      dateHash: dateHash,
      alarms: new AlarmCollection()
    });
    this.dayPrograms.add(model);
    dayProgram = new DayProgramView({
      id: dateHash,
      model: model
    });
    this.views[dateHash] = dayProgram;
    return dayProgram;
  };

  AlarmsListView.prototype._renderSubView = function(dateHash) {
    var index, render, selector, view;

    view = this.views[dateHash];
    index = index = this.dayPrograms.indexOf(view.model);
    render = view.render().$el;
    if (index === 0) {
      this.$el.prepend(render);
    } else if (index === this.dayPrograms.length - 1) {
      this.$el.append(render);
    } else {
      selector = "." + view.className + ":nth-of-type(" + (index + 1) + ")";
      this.$el.find(selector).before(render);
    }
    return view;
  };

  return AlarmsListView;

})(View);

});

;require.register("views/calendar_popover", function(exports, require, module) {
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
    this.getModelAttributes = __bind(this.getModelAttributes, this);    _ref = PopOver.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  PopOver.prototype.template = require('./templates/popover_content');

  PopOver.prototype.events = {
    'keyup input': 'onKeyUp',
    'click button.add': 'onAddClicked',
    'click .remove': 'onRemoveClicked',
    'click .close': 'close',
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
    window.test = this;
    this.target = options.target;
    this.container = options.container;
    return this.parentView = options.parentView;
  };

  PopOver.prototype.close = function() {
    this.target.popover('destroy');
    this.target.data('popover', null);
    return this.remove();
  };

  PopOver.prototype.render = function() {
    this.target.data('popover', null);
    this.target.popover({
      title: require('./templates/popover_title')({
        title: this.getTitle()
      }),
      html: true,
      placement: this.getDirection(),
      content: this.template(this.getRenderData())
    }).popover('show');
    this.setElement($('.container .popover'));
    this.addButton = this.$('button.add').text(this.getButtonText());
    this.addButton.toggleClass('disabled', this.validForm());
    this.removeButton = this.$('.remove');
    if (this.model.isNew()) {
      this.removeButton.hide();
    }
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
    var data;

    data = _.extend({
      type: this.type
    }, this.model.attributes, {
      editionMode: !this.model.isNew(),
      advancedUrl: this.parentView.getUrlHash() + '/' + this.model.id
    });
    if (this.model instanceof Event) {
      data.start = this.model.getFormattedStartDate('{HH}:{mm}');
      data.end = this.getEndDateWithDiff();
    } else {
      data.time = this.model.getDateObject().format('{HH}:{mm}');
    }
    return data;
  };

  PopOver.prototype.getEndDateWithDiff = function() {
    var diff, endDate, startDate, time;

    if (!(this.model instanceof Event)) {
      return null;
    }
    endDate = this.model.getEndDateObject();
    startDate = this.model.getStartDateObject();
    if (!this.model.isOneDay()) {
      diff = endDate - this.model.getStartDateObject();
      diff = Math.round(diff / 1000 / 3600 / 24);
    }
    time = this.model.getFormattedEndDate('{HH}:{mm}');
    if (diff) {
      return "" + time + "+" + diff;
    } else {
      return time;
    }
  };

  PopOver.prototype.makeNewModel = function(options) {
    switch (this.type) {
      case 'event':
        return new Event({
          start: options.start,
          end: options.end,
          description: '',
          place: ''
        });
      case 'alarm':
        return new Alarm({
          trigg: options.start,
          timezone: '',
          description: '',
          action: 'DISPLAY',
          place: ''
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
    var data, date, endDate, startDate, time;

    if (this.model instanceof Event) {
      date = this.model.getStartDateObject();
      startDate = this.formatDate(date, $('.popover #input-start').val());
      endDate = this.formatDate(date, $('.popover #input-end').val());
      data = {
        start: startDate.format(Event.dateFormat, 'en-en'),
        end: endDate.format(Event.dateFormat, 'en-en'),
        place: $('.popover #input-place').val(),
        description: $('.popover #input-desc').val()
      };
    } else {
      console.log("HERE");
      date = this.model.getDateObject();
      time = this.formatDate(date, $('.popover #input-time').val());
      data = {
        trigg: time.format(Alarm.dateFormat),
        description: $('.popover #input-desc').val()
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
          return _this.close();
        }
      });
    }
  };

  PopOver.prototype.onAddClicked = function() {
    var noError,
      _this = this;

    this.addButton.html('&nbsp;');
    this.addButton.spin('small');
    console.log("there");
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
        return _this.close();
      }
    });
    if (!noError) {
      return console.log(this.model.validationError);
    }
  };

  return PopOver;

})(BaseView);

});

;require.register("views/calendar_view", function(exports, require, module) {
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
    this.handleWindowResize = __bind(this.handleWindowResize, this);    _ref = CalendarView.__super__.constructor.apply(this, arguments);
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
      timeFormat: {
        '': '',
        'agendaWeek': ''
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
    var targetHeight, width;

    targetHeight = $(window).height() - 2 * $('#menu').outerHeight(true) - 60;
    width = this.cal.width() + 40;
    this.cal.height(targetHeight + 20);
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
    options.container = this.cal;
    options.parentView = this;
    if (this.popover) {
      this.popover.close();
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

  CalendarView.prototype.onEventRender = function(event, element) {
    var spinTarget;

    if ((event.isSaving != null) && event.isSaving) {
      spinTarget = $(element).find('.fc-event-time');
      spinTarget.addClass('spinning');
      spinTarget.html("&nbsp;");
      spinTarget.spin("tiny");
    }
    return element;
  };

  CalendarView.prototype.onEventDragStop = function(event, jsEvent, ui, view) {
    return event.isSaving = true;
  };

  CalendarView.prototype.onEventDrop = function(fcEvent, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
    var alarm, end, evt, start,
      _this = this;

    if (fcEvent.type === 'alarm') {
      alarm = this.alarmCollection.get(fcEvent.id);
      alarm.getDateObject().advance({
        days: dayDelta,
        minutes: minuteDelta
      });
      return alarm.save({
        trigg: alarm.getFormattedDate(Alarm.dateFormat)
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
        start: start.format(Event.dateFormat),
        end: end.format(Event.dateFormat)
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

;require.register("views/dayprogram_view", function(exports, require, module) {
var AlarmCollection, AlarmView, DayProgramView, View, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('../lib/view');

AlarmView = require('./alarm_view');

AlarmCollection = require('../collections/alarms');

module.exports = DayProgramView = (function(_super) {
  __extends(DayProgramView, _super);

  function DayProgramView() {
    _ref = DayProgramView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  DayProgramView.prototype.tagName = 'div';

  DayProgramView.prototype.className = 'dayprogram';

  DayProgramView.prototype.initialize = function() {
    this.listenTo(this.model.get('alarms'), "add", this.onAdd);
    this.listenTo(this.model.get('alarms'), "change", this.onChange);
    this.listenTo(this.model.get('alarms'), "remove", this.onRemove);
    return this.views = {};
  };

  DayProgramView.prototype.onAdd = function(alarm, alarms) {
    var index, rView, render, selector;

    index = alarms.indexOf(alarm);
    rView = new AlarmView({
      id: alarm.cid,
      model: alarm
    });
    render = rView.render().$el;
    if (index === 0) {
      this.$el.find('.alarms').prepend(render);
    } else if (index === this.model.get('alarms').length - 1) {
      this.$el.find('.alarms').append(render);
    } else {
      selector = ".alarms ." + rView.className + ":nth-of-type(" + (index + 1) + ")";
      this.$el.find(selector).before(render);
    }
    return this.views[alarm.cid] = rView;
  };

  DayProgramView.prototype.onChange = function(alarm, options) {
    var newIndex, oldIndex, selector, view;

    this.views[alarm.cid].model.set(alarm.toJSON());
    if (alarm.changedAttributes().trigg != null) {
      view = this.views[alarm.cid];
      oldIndex = this.model.get('alarms').indexOf(alarm);
      this.model.get('alarms').sort();
      newIndex = this.model.get('alarms').indexOf(alarm);
      if (newIndex !== oldIndex) {
        if (newIndex === 0) {
          return this.$el.find('.alarms').prepend(view.$el);
        } else if (newIndex === this.model.get('alarms').length - 1) {
          return this.$el.find('.alarms').append(view.$el);
        } else {
          if (newIndex > oldIndex) {
            newIndex++;
          }
          selector = ".alarms ." + view.className + ":nth-of-type(" + (newIndex + 1) + ")";
          return this.$el.find(selector).before(view.$el);
        }
      }
    }
  };

  DayProgramView.prototype.onRemove = function(alarm, collection, options) {
    this.views[alarm.cid].destroy();
    if (this.model.get('alarms').length === 0) {
      return this.model.collection.remove(this.model);
    }
  };

  DayProgramView.prototype.render = function() {
    return DayProgramView.__super__.render.call(this, {
      date: this.model.get('date').format("{dd}/{MM}/{yyyy}")
    });
  };

  DayProgramView.prototype.template = function() {
    return require('./templates/dayprogram');
  };

  return DayProgramView;

})(View);

});

;require.register("views/event_modal", function(exports, require, module) {
var EventModal, ViewCollection, app, random, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

ViewCollection = require('lib/view_collection');

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
    this.onGuestAdded = __bind(this.onGuestAdded, this);    _ref = EventModal.__super__.constructor.apply(this, arguments);
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
    var _this = this;

    if (this.$('confirm-btn').hasClass('disabled')) {
      return;
    }
    this.model.set({
      description: this.$('#basic-summary').val(),
      place: this.$('#basic-place').val(),
      start: Date.create(this.$('#basic-start').val()).format(Event.dateFormat),
      end: Date.create(this.$('#basic-end').val()).format(Event.dateFormat)
    });
    if (this.$('#rrule-help').is(':visible')) {
      this.model.set({
        rrule: this.getRRule().toString()
      });
    } else {
      this.model.set('rrule', '');
    }
    return this.model.save({}, {
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
    this.$('#rrule').show();
    this.$('#rrule-short').show();
    this.$('#rrule-short #rrule-action').hide();
    this.$('#rrule-toggle').hide();
    return this.updateHelp();
  };

  EventModal.prototype.getRRule = function() {
    var RRuleWdays, day, endOfMonth, monthmode, options, start, wk;

    start = this.model.getStartDateObject();
    console.log(start);
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
      return app.router.navigate('');
    });
  };

  return EventModal;

})(ViewCollection);

});

;require.register("views/event_modal_guest", function(exports, require, module) {
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

;require.register("views/import_alarm_list", function(exports, require, module) {
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

  AlarmList.prototype.views = {};

  AlarmList.prototype.template = function() {
    return '';
  };

  AlarmList.prototype.collection = new AlarmCollection;

  AlarmList.prototype.collectionEl = "#import-alarm-list";

  return AlarmList;

})(ViewCollection);

});

;require.register("views/import_alarm_view", function(exports, require, module) {
var AlarmView, View, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('../lib/view');

module.exports = AlarmView = (function(_super) {
  __extends(AlarmView, _super);

  function AlarmView() {
    _ref = AlarmView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  AlarmView.prototype.tagName = 'div';

  AlarmView.prototype.className = 'alarm';

  AlarmView.prototype.render = function() {
    return AlarmView.__super__.render.call(this, {
      action: this.model.get('action'),
      time: this.model.getFormattedDate('{yyyy}/{MM}/{dd} {HH}:{mm}'),
      description: this.model.get('description')
    });
  };

  AlarmView.prototype.template = function() {
    return require('./templates/alarm_import');
  };

  return AlarmView;

})(View);

});

;require.register("views/import_event_list", function(exports, require, module) {
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

  EventList.prototype.views = {};

  EventList.prototype.template = function() {
    return '';
  };

  EventList.prototype.collection = new EventCollection;

  EventList.prototype.collectionEl = "#import-event-list";

  return EventList;

})(ViewCollection);

});

;require.register("views/import_event_view", function(exports, require, module) {
var EventView, View, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('../lib/view');

module.exports = EventView = (function(_super) {
  __extends(EventView, _super);

  function EventView() {
    _ref = EventView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EventView.prototype.tagName = 'div';

  EventView.prototype.className = 'event';

  EventView.prototype.render = function() {
    return EventView.__super__.render.call(this, {
      start: this.model.getFormattedStartDate('{yyyy}/{MM}/{dd} {HH}:{mm}'),
      end: this.model.getFormattedEndDate('{yyyy}/{MM}/{dd} {HH}:{mm}'),
      description: this.model.get('description'),
      place: this.model.get('place')
    });
  };

  EventView.prototype.template = function() {
    return require('./templates/event_import');
  };

  return EventView;

})(View);

});

;require.register("views/import_view", function(exports, require, module) {
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
    this.alarmList = new AlarmList();
    this.alarmList.render();
    this.eventList = new EventList();
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

;require.register("views/list_view", function(exports, require, module) {
var Alarm, AlarmCollection, AlarmFormView, AlarmsListView, ListView, View, defaultTimezone, helpers, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('../lib/view');

AlarmFormView = require('./alarm_form_view');

AlarmsListView = require('../views/alarms_list_view');

AlarmCollection = require('../collections/alarms');

Alarm = require('../models/alarm');

helpers = require('../helpers');

defaultTimezone = 'timezone';

module.exports = ListView = (function(_super) {
  __extends(ListView, _super);

  function ListView() {
    _ref = ListView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ListView.prototype.id = 'viewContainer';

  ListView.prototype.events = {
    "click #add-alarm button.add-alarm": "onAddAlarmClicked",
    "click #alarm-list .icon-pencil": "onEditAlarmClicked",
    "click #alarm-list .icon-trash": "onRemoveAlarmClicked"
  };

  ListView.prototype.template = function() {
    return require('./templates/listview');
  };

  ListView.prototype.afterRender = function() {
    (this.alarmFormView = new AlarmFormView()).render();
    return this.alarmsListView = new AlarmsListView({
      collection: this.collection
    });
  };

  ListView.prototype.onAddAlarmClicked = function(event, callback) {
    var alarm, data, date, dueDate, time, _ref1,
      _this = this;

    date = this.alarmFormView.dateField.val();
    time = this.alarmFormView.timeField.val();
    dueDate = helpers.formatDateISO8601("" + date + "#" + time);
    dueDate = Date.create(dueDate);
    if (dueDate.isValid()) {
      dueDate = dueDate.format(Alarm.dateFormat);
    } else {
      dueDate = 'undefined';
    }
    data = {
      description: this.alarmFormView.descriptionField.val(),
      action: this.alarmFormView.actionField.val(),
      trigg: dueDate
    };
    if (this.alarmFormView.timezoneField.val() !== defaultTimezone) {
      data.timezone = this.alarmFormView.timezoneField.val();
    }
    if (this.alarmFormView.editionMode) {
      alarm = this.alarmFormView.data;
      alarm.save(data, {
        wait: true,
        ignoreMySocketNotification: true,
        success: function() {
          _this.alarmFormView.resetForm();
          return console.log("Save: success (attributes updated)");
        },
        error: function() {
          return console.log("Error during alarm save.");
        }
      });
    } else {
      alarm = this.collection.create(data, {
        ignoreMySocketNotification: true,
        wait: true,
        success: function() {
          _this.alarmFormView.resetForm();
          return console.log('Create alarm: success');
        },
        error: function(error, xhr, options) {
          error = JSON.parse(xhr.responseText);
          return console.log("Create alarm: error: " + (error != null ? error.msg : void 0));
        }
      });
    }
    if (((_ref1 = alarm.validationError) != null ? _ref1.length : void 0) > 0) {
      return this.alarmFormView.displayErrors(alarm.validationError);
    }
  };

  ListView.prototype.onEditAlarmClicked = function(event) {
    var alarm, alarmID;

    window.top.window.scrollTo(0, 0);
    alarmID = $(event.target).data('alarmid');
    alarm = this.collection.get(alarmID);
    return this.alarmFormView.loadAlarmData(alarm);
  };

  ListView.prototype.onRemoveAlarmClicked = function(event) {
    var alarm, alarmID;

    if (confirm('Are you sure ?')) {
      alarmID = $(event.target).data('alarmid');
      alarm = this.collection.get(alarmID);
      return alarm.destroy({
        wait: true,
        success: function() {
          return console.log("Delete alarm: success");
        },
        error: function() {
          return console.log("Delete alarm: error");
        }
      });
    }
  };

  return ListView;

})(View);

});

;require.register("views/menu", function(exports, require, module) {
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

;require.register("views/templates/alarm", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<p>' + escape((interp = time) == null ? '' : interp) + ' (' + escape((interp = timezone) == null ? '' : interp) + ')\n' + escape((interp = description) == null ? '' : interp) + ' (' + escape((interp = t(action)) == null ? '' : interp) + ')<i');
buf.push(attrs({ 'data-alarmid':("" + (alarmID) + ""), "class": ('icon-pencil') }, {"data-alarmid":true}));
buf.push('></i><i');
buf.push(attrs({ 'data-alarmid':("" + (alarmID) + ""), "class": ('icon-trash') }, {"data-alarmid":true}));
buf.push('></i></p>');
}
return buf.join("");
};
});

;require.register("views/templates/alarm_form", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="form-horizontal well"><div class="control-group"><input');
buf.push(attrs({ 'id':('input-desc'), 'type':("text"), 'placeholder':(t("What should I remind you ?")), "class": ('input-block-level') }, {"type":true,"placeholder":true}));
buf.push('/></div><div class="form-inline"><div id="date-control"><div class="input-append date"><input');
buf.push(attrs({ 'id':('input-date'), 'type':("text"), 'value':(defaultDate), "class": ('span2') }, {"type":true,"value":true}));
buf.push('/></div><div class="input-append bootstrap-timepicker"><input');
buf.push(attrs({ 'id':('input-time'), 'type':("text"), 'value':(defaultTime), "class": ('input-small') }, {"type":true,"value":true}));
buf.push('/></div></div><select id="input-timezone" class="input"><option');
buf.push(attrs({ 'value':("" + (defaultTimezone) + ""), 'selected':(true) }, {"value":true,"selected":true}));
buf.push('>' + escape((interp = defaultTimezone) == null ? '' : interp) + '</option>');
// iterate timezones
;(function(){
  if ('number' == typeof timezones.length) {

    for (var $index = 0, $$l = timezones.length; $index < $$l; $index++) {
      var timezone = timezones[$index];

buf.push('<option');
buf.push(attrs({ 'value':("" + (timezone.value) + "") }, {"value":true}));
buf.push('>' + escape((interp = timezone.value) == null ? '' : interp) + '</option>');
    }

  } else {
    var $$l = 0;
    for (var $index in timezones) {
      $$l++;      var timezone = timezones[$index];

buf.push('<option');
buf.push(attrs({ 'value':("" + (timezone.value) + "") }, {"value":true}));
buf.push('>' + escape((interp = timezone.value) == null ? '' : interp) + '</option>');
    }

  }
}).call(this);

buf.push('</select><select id="action" class="input-small">');
// iterate actions
;(function(){
  if ('number' == typeof actions.length) {

    for (var action = 0, $$l = actions.length; action < $$l; action++) {
      var displayAction = actions[action];

if ( action == defaultAction)
{
buf.push('<option');
buf.push(attrs({ 'value':("" + (action) + ""), 'selected':(true) }, {"value":true,"selected":true}));
buf.push('>');
var __val__ = t(displayAction)
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</option>');
}
else
{
buf.push('<option');
buf.push(attrs({ 'value':("" + (action) + "") }, {"value":true}));
buf.push('>');
var __val__ = t(displayAction)
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</option>');
}
    }

  } else {
    var $$l = 0;
    for (var action in actions) {
      $$l++;      var displayAction = actions[action];

if ( action == defaultAction)
{
buf.push('<option');
buf.push(attrs({ 'value':("" + (action) + ""), 'selected':(true) }, {"value":true,"selected":true}));
buf.push('>');
var __val__ = t(displayAction)
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</option>');
}
else
{
buf.push('<option');
buf.push(attrs({ 'value':("" + (action) + "") }, {"value":true}));
buf.push('>');
var __val__ = t(displayAction)
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</option>');
}
    }

  }
}).call(this);

buf.push('</select></div><button class="btn add-alarm">');
var __val__ = t('add the alarm')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</button><button class="btn cancel">');
var __val__ = t('cancel')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</button><div class="clearfix"></div></div>');
}
return buf.join("");
};
});

;require.register("views/templates/alarm_import", function(exports, require, module) {
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

;require.register("views/templates/calendarview", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="container"><div id="alarms" class="well"></div></div>');
}
return buf.join("");
};
});

;require.register("views/templates/dayprogram", function(exports, require, module) {
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

;require.register("views/templates/event", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<p>' + escape((interp = time) == null ? '' : interp) + '\n' + escape((interp = description) == null ? '' : interp) + '<i data-eventid="" class="icon-pencil"></i><i data-eventid="" class="icon-trash"></i></p>');
}
return buf.join("");
};
});

;require.register("views/templates/event_import", function(exports, require, module) {
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

;require.register("views/templates/event_modal", function(exports, require, module) {
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
buf.push('</h4><p id="rrule-toggle"><a class="rrule-show">');
var __val__ = t('make reccurent')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a></p><p id="rrule-short"><i class="icon-arrow-right"></i><span id="rrule-help"></span><span id="rrule-action">&nbsp;-&nbsp;<a class="rrule-show">');
var __val__ = t('Edit')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a></span></p><form id="rrule" class="form-inline"><div class="control-group"><label for="rrule-interval" class="control-label">');
var __val__ = t('repeat every')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</label><input');
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
buf.push('</option></select></div><div id="rrule-weekdays" class="control-group"><label class="control-label">');
var __val__ = t('repeat on')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</label><label class="checkbox inline">');
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
buf.push('/></label></div><div id="rrule-monthdays" class="control-group"><label>');
var __val__ = t('repeat on')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</label><div class="controls"><label class="checkbox inline"><input');
buf.push(attrs({ 'type':("radio"), 'checked':(yearModeIs('date')), 'name':("rrule-month-option"), 'value':("date") }, {"type":true,"checked":true,"name":true,"value":true}));
buf.push('/>');
var __val__ = t('repeat on date')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</label><label class="checkbox inline"><input');
buf.push(attrs({ 'type':("radio"), 'checked':(yearModeIs('weekdate')), 'name':("rrule-month-option"), 'value':("weekdate") }, {"type":true,"checked":true,"name":true,"value":true}));
buf.push('/>');
var __val__ = t('repeat on weekday')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</label></div></div><div class="control-group"><label for="rrule-until">');
var __val__ = t('repeat until')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</label><input');
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
buf.push('</a><div id="guest-info"><i class="icon-question-sign"></i><span>The invitations will be sent after you click "Save Changes"</span></div></div></div></form><div id="guests-list"></div></div><div class="modal-footer"><a id="cancel-btn">');
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

;require.register("views/templates/event_modal_guest", function(exports, require, module) {
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

;require.register("views/templates/import_view", function(exports, require, module) {
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

;require.register("views/templates/listview", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="container"><div class="addform"><div id="add-alarm" class="container"></div></div><div id="alarm-list" class="well"></div></div>');
}
return buf.join("");
};
});

;require.register("views/templates/menu", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<li><a href="#alarms" class="btn"><i class="icon-bell icon-white"></i><span>');
var __val__ = t('Alarms')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></a><a href="#calendar" class="btn"><i class="icon-calendar icon-white"></i><span>');
var __val__ = t('Calendar')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></a><a href="export/calendar.ics" target="_blank" class="btn"><i class="icon-share icon-white"></i><span>');
var __val__ = t('Export')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></a><a id="import-menu-button" href="#import" class="btn"><i class="icon-circle-arrow-up icon-white"></i><span>');
var __val__ = t('Import')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></a></li>');
}
return buf.join("");
};
});

;require.register("views/templates/popover_content", function(exports, require, module) {
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
buf.push(attrs({ 'type':("text"), 'id':("input-time"), 'value':(time), "class": ('focused') + ' ' + ('input-small') }, {"type":true,"id":true,"value":true}));
buf.push('/><input');
buf.push(attrs({ 'type':("text"), 'id':("input-desc"), 'value':(description), 'placeholder':(t("alarm description placeholder")), "class": ('input') }, {"type":true,"id":true,"value":true,"placeholder":true}));
buf.push('/><p>' + escape((interp = timezone) == null ? '' : interp) + '</p></div><div><button class="btn add">');
var __val__ = t('Edit')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</button></div>');
}
else if ( type = 'event')
{
buf.push('<div><input');
buf.push(attrs({ 'id':('input-start'), 'type':("text"), 'value':(start), 'placeholder':(t("From hours:minutes")), "class": ('focused') + ' ' + ('input-small') }, {"type":true,"value":true,"placeholder":true}));
buf.push('/><input');
buf.push(attrs({ 'id':('input-end'), 'type':("text"), 'value':(end), 'placeholder':(t("To hours:minutes+days")), "class": ('input-small') }, {"type":true,"value":true,"placeholder":true}));
buf.push('/></div><div><input');
buf.push(attrs({ 'id':('input-place'), 'type':("text"), 'value':(place), 'placeholder':(t("Place")), "class": ('input-small') }, {"type":true,"value":true,"placeholder":true}));
buf.push('/><input');
buf.push(attrs({ 'id':('input-desc'), 'type':("text"), 'value':(description), 'placeholder':(t("Description")), "class": ('input') }, {"type":true,"value":true,"placeholder":true}));
buf.push('/></div><div><button class="btn add">');
var __val__ = editionMode ? t('Edit') : t('Create')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</button>');
if ( editionMode)
{
buf.push('<a');
buf.push(attrs({ 'href':('#'+advancedUrl), "class": ('advanced-link') }, {"href":true}));
buf.push('>');
var __val__ = t('advanced')
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a>');
}
buf.push('</div>');
}
}
return buf.join("");
};
});

;require.register("views/templates/popover_title", function(exports, require, module) {
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

;
//@ sourceMappingURL=app.js.map