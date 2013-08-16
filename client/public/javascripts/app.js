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
      var AlarmCollection, EventCollection, Router, SocketListener, e, locales;
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
      Router = require('router');
      SocketListener = require('../lib/socket_listener');
      AlarmCollection = require('collections/alarms');
      EventCollection = require('collections/events');
      this.router = new Router();
      this.alarms = new AlarmCollection();
      this.events = new EventCollection();
      SocketListener.watch(this.alarms);
      SocketListener.watch(this.events);
      if (window.initalarms != null) {
        this.alarms.reset(window.initalarms);
        this.events.reset(window.initevents);
        delete window.initalarms;
        delete window.initevents;
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

    AlarmCollection.prototype.comparator = function(si1, si2) {
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

    return AlarmCollection;

  })(ScheduleItemsCollection);
  
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
  var CozyCollection, ScheduleItemsCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CozyCollection = require('../lib/cozy_collection');

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

  })(CozyCollection);
  
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

  exports.getPopoverDirection = function(isDayView, startDate, endDate, isEditMode) {
    var dayEnd, dayStart, direction, isStartEndOnSameDay, selectedHour, selectedWeekDay;
    if (isEditMode == null) {
      isEditMode = false;
    }
    dayStart = startDate.beginningOfDay();
    dayEnd = endDate != null ? endDate.beginningOfDay() : void 0;
    isStartEndOnSameDay = (endDate != null) && dayStart.is(dayEnd);
    if (!isDayView) {
      if (isEditMode && !isStartEndOnSameDay) {
        direction = 'bottom';
      } else {
        selectedWeekDay = startDate.format('{weekday}');
        if (selectedWeekDay === 'friday' || selectedWeekDay === 'saturday' || selectedWeekDay === 'sunday') {
          direction = 'left';
        } else {
          direction = 'right';
        }
      }
    } else {
      selectedHour = startDate.format('{HH}');
      if (selectedHour >= 4) {
        direction = 'top';
      } else {
        direction = 'bottom';
      }
    }
    return direction;
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
window.require.register("lib/cozy_collection", function(exports, require, module) {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = exports.CozyCollection = (function(_super) {
    __extends(CozyCollection, _super);

    function CozyCollection() {
      _ref = CozyCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CozyCollection.prototype.move = function(item, newIndex) {
      var oldIndex;
      oldIndex = this.indexOf(item);
      if (oldIndex != null) {
        this.models.splice(newIndex, 0, this.models.splice(oldIndex, 1)[0]);
        return this.trigger("move", {
          'item': item,
          'oldIndex': oldIndex,
          'newIndex': newIndex
        });
      } else {
        return false;
      }
    };

    return CozyCollection;

  })(Backbone.Collection);
  
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
window.require.register("locales/en", function(exports, require, module) {
  module.exports = {
    "Add": "Add",
    "add the alarm": "add the alarm",
    "Alarm creation": "Alarm creation",
    "Event creation": "Event creation",
    "Alarm edition": "Alarm edition",
    "Event edition": "Event edition",
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
    "What do you want to be reminded ?": "What do you want to be reminded?",
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
    "Week": "Week",
    "sunday": "sunday",
    "monday": "monday",
    "tuesday": "tuesday",
    "wednesday": "wednesday",
    "thursday": "thursday",
    "friday": "friday",
    "saturday": "saturday",
    "Sunday": "Sunday",
    "Monday": "Monday",
    "Tuesday": "Tuesday",
    "Wednesday": "Wednesday",
    "Thursday": "Thursday",
    "Friday": "Friday",
    "Saturday": "Saturday",
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
    "Jan": "Jan",
    "Feb": "Feb",
    "Mar": "Mar",
    "Apr": "Apr",
    "May": "May",
    "Jun": "Jun",
    "Jul": "Jul",
    "Aug": "Aug",
    "Sep": "Sep",
    "Oct": "Oct",
    "Nov": "Nov",
    "Dec": "Dec",
    "Sun": "Sun",
    "Mon": "Mon",
    "Tue": "Tue",
    "Wed": "Wed",
    "Thu": "Thu",
    "Fri": "Fri",
    "Sat": "Sat",
    "Alarms": "Alarms",
    "Display": "Notification",
    "DISPLAY": "Notification",
    "EMAIL": "E-mail"
  };
  
});
window.require.register("locales/fr", function(exports, require, module) {
  module.exports = {
    "Add": "Ajouter",
    "add the alarm": "Ajouter l'alarme",
    "Alarm creation": "Création d'une alarme",
    "Event creation": "Création d'un évènement",
    "Alarm edition": "Edition d'une alarme",
    "Event edition": "Edition d'un évènement",
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
    "What do you want to be reminded ?": "Que voulez-vous vous rappeler ?",
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
    "sunday": "Dimanche",
    "monday": "lundi",
    "tuesday": "mardi",
    "wednesday": "mercredi",
    "thursday": "jeudi",
    "friday": "vendredi",
    "Saturday": "samedi",
    "Sunday": "dimanche",
    "Monday": "Lundi",
    "Tuesday": "Mardi",
    "Wednesday": "Mercredi",
    "Thursday": "Jeudi",
    "Friday": "Vendredi",
    "Saturday": "Samedi",
    "Sun": "Dim",
    "Mon": "Lun",
    "Tue": "Mar",
    "Wed": "Mer",
    "Thu": "Jeu",
    "Fri": "Ven",
    "Sat": "Sam",
    "January": "Janvier",
    "February": "Février",
    "March": "Mars",
    "April": "Avril",
    "May": "Mai",
    "June": "Juin",
    "July": "Juillet",
    "August": "Aout",
    "September": "Septembre",
    "October": "Octobre",
    "November": "Novembre",
    "December": "Decembre",
    "Jan": "Jan",
    "Feb": "Fev",
    "Mar": "Mar",
    "Apr": "Avr",
    "May": "Mai",
    "Jun": "Juin",
    "Jul": "Juil",
    "Aug": "Aout",
    "Sep": "Sep",
    "Oct": "Oct",
    "Nov": "Nov",
    "Dec": "Dec",
    "Sun": "Dim",
    "Mon": "Lun",
    "Tue": "Mar",
    "Wed": "Mer",
    "Thu": "Jeu",
    "Fri": "Ven",
    "Sat": "Sam",
    "Alarms": "Alarmes",
    "Display": "Notification",
    "DISPLAY": "Notification",
    "EMAIL": "E-mail"
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
      var allowedActions, errors;
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
      allowedActions = ['DISPLAY', 'EMAIL'];
      if (allowedActions.indexOf(attrs.action) === -1) {
        errors.push({
          field: 'action',
          value: "A valid action must be set."
        });
      }
      if (!attrs.trigg || !new Date.create(attrs.trigg).isValid()) {
        errors.push({
          field: 'triggdate',
          value: "The date or time format might be invalid. " + "It must be dd/mm/yyyy and hh:mm."
        });
      }
      if (errors.length > 0) {
        return errors;
      }
    };

    return Alarm;

  })(ScheduleItem);
  
});
window.require.register("models/event", function(exports, require, module) {
  var Event, ScheduleItem, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ScheduleItem = require('./scheduleitem');

  module.exports = Event = (function(_super) {
    var validateDate;

    __extends(Event, _super);

    function Event() {
      _ref = Event.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Event.prototype.startDateField = 'start';

    Event.prototype.endDateField = 'end';

    Event.prototype.urlRoot = 'events';

    validateDate = function(attrs, options, errors) {
      var end, endDate, endHour, sendError, start, startDate, startHour;
      sendError = function() {
        console.log('pb start - end');
        return errors.push({
          field: 'date',
          value: "The start date might be inferor than end date  " + "It must be dd/mm/yyyy and hh:mm."
        });
      };
      start = new Date(attrs.start);
      end = new Date(attrs.end);
      startDate = start.format('{yy}:{MM}:{dd}').split(":");
      endDate = end.format('{yy}:{MM}:{dd}').split(":");
      startHour = start.format('{HH}:{mm}').split(":");
      endHour = end.format('{HH}:{mm}').split(":");
      if (startDate[0] === endDate[0] && startDate[1] === endDate[1] && startDate[2] === endDate[2]) {
        if (startHour[0] > endHour[0]) {
          return sendError();
        } else if (startHour[0] === endHour[0] && startHour[1] > endHour[1]) {
          return sendError();
        }
      } else {
        if (startDate[0] > endDate[0]) {
          return sendError();
        } else if (startDate[0] === endDate[0]) {
          if (startDate[1] > endDate[1]) {
            return sendError();
          } else if (startDate[1] === endDate[1] && startDate[2] > endDate[2]) {
            return sendError();
          }
        }
      }
    };

    Event.prototype.validate = function(attrs, options) {
      var errors;
      errors = [];
      if (!attrs.description) {
        errors.push({
          field: 'description',
          value: "A description must be set."
        });
      }
      if (!attrs.start || !new Date.create(attrs.start).isValid()) {
        errors.push({
          field: 'startdate',
          value: "The date or time format might be invalid. " + "It must be dd/mm/yyyy and hh:mm."
        });
      }
      if (!attrs.end || !new Date.create(attrs.end).isValid()) {
        errors.push({
          field: 'enddate',
          value: "The date or time format might be invalid. " + "It must be dd/mm/yyyy and hh:mm."
        });
      }
      validateDate(attrs, options, errors);
      if (errors.length > 0) {
        return errors;
      }
    };

    Event.prototype.getStartDateObject = function() {
      if (this.startDateObject == null) {
        this.startDateObject = new Date.create(this.get(this.startDateField));
      }
      return this.startDateObject;
    };

    Event.prototype.getFormattedStartDate = function(formatter) {
      return this.getStartDateObject().format(formatter);
    };

    Event.prototype.getEndDateObject = function() {
      if (this.endDateObject == null) {
        this.endDateObject = new Date.create(this.get(this.endDateField));
      }
      return this.endDateObject;
    };

    Event.prototype.getFormattedEndDate = function(formatter) {
      return this.getEndDateObject().format(formatter);
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
        this.dateObject = new Date.create(this.get(this.mainDateField));
      }
      return this.dateObject;
    };

    ScheduleItem.prototype.getFormattedDate = function(formatter) {
      return (new Date(this.get(this.mainDateField))).format(formatter);
    };

    ScheduleItem.prototype.getPreviousDateObject = function() {
      if (this.previous(this.mainDateField) != null) {
        return new Date.create(this.previous(this.mainDateField));
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

    return ScheduleItem;

  })(Backbone.Model);
  
});
window.require.register("router", function(exports, require, module) {
  var AlarmCollection, CalendarView, ImportView, ListView, Router, app, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  app = require('application');

  ListView = require('views/list_view');

  CalendarView = require('views/calendar_view');

  ImportView = require('views/import_view');

  AlarmCollection = require('collections/alarms');

  module.exports = Router = (function(_super) {
    __extends(Router, _super);

    function Router() {
      this.displayView = __bind(this.displayView, this);
      _ref = Router.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Router.prototype.routes = {
      '': 'calendar',
      'calendar': 'calendar',
      'alarms': 'alarmsList',
      'import': 'import'
    };

    Router.prototype.calendar = function() {
      this.displayView(CalendarView, app.alarms, app.events);
      this.handleFetch(this.mainView.model.alarm, "alarms");
      return this.handleFetch(this.mainView.model.event, "events");
    };

    Router.prototype.alarmsList = function() {
      this.displayView(ListView, app.alarms, null);
      return this.handleFetch(this.mainView.model, "alarms");
    };

    Router.prototype["import"] = function() {
      return this.displayView(ImportView, app.alarms);
    };

    Router.prototype.handleFetch = function(model, name) {
      if (!(app[name].length > 0)) {
        return model.fetch({
          success: function(collection, response, options) {
            console.log(collection);
            return console.log("Fetch: success");
          },
          error: function() {
            return console.log("Fetch: error");
          }
        });
      } else {
        return model.reset(app[name].toJSON());
      }
    };

    Router.prototype.displayView = function(classView, alarmsCollection, eventsCollection) {
      var container;
      if (this.mainView) {
        this.mainView.remove();
      }
      container = $(document.createElement('div'));
      container.prop('id', 'viewContainer');
      $('body').prepend(container);
      if (eventsCollection === null) {
        this.mainView = new classView({
          model: alarmsCollection
        });
      } else {
        this.mainView = new classView(alarmsCollection, eventsCollection);
      }
      return this.mainView.render();
    };

    return Router;

  })(Backbone.Router);
  
});
window.require.register("views/alarm_form_view", function(exports, require, module) {
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
      this.onSubmit = __bind(this.onSubmit, this);
      _ref = AlarmFormView.__super__.constructor.apply(this, arguments);
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
      'click .add-alarm': 'onSubmit'
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
      this.timeField.val(alarm.getFormattedDate('{HH}:{mm}'));
      this.timezoneField.val(alarm.get(defaultTimezone));
      this.data = alarm;
      this.editionMode = true;
      this.addAlarmButton.html('Edit the alarm');
      return this.enableSubmitButton();
    };

    AlarmFormView.prototype.resetForm = function() {
      var todayDate;
      this.data = null;
      this.editionMode = false;
      this.addAlarmButton.html('add the alarm');
      this.disableSubmitButton();
      this.descriptionField.val('');
      todayDate = new Date.create('now');
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
window.require.register("views/alarm_popover", function(exports, require, module) {
  var Alarm, AlarmPopOver, EventPopOver, PopOver, View, eventFormSmallTemplate, timezones,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PopOver = require('./popover');

  View = require('../lib/view');

  Alarm = require('../models/alarm');

  timezones = require('helpers/timezone').timezones;

  EventPopOver = require('./event_popover');

  eventFormSmallTemplate = require('./templates/event_form_small');

  module.exports = AlarmPopOver = (function(_super) {
    __extends(AlarmPopOver, _super);

    function AlarmPopOver(cal) {
      this.cal = cal;
      this.onEventButtonClicked = __bind(this.onEventButtonClicked, this);
      this.onEditClicked = __bind(this.onEditClicked, this);
      this.onButtonClicked = __bind(this.onButtonClicked, this);
      this.onRemoveClicked = __bind(this.onRemoveClicked, this);
      this.bindEditEvents = __bind(this.bindEditEvents, this);
      AlarmPopOver.__super__.constructor.call(this, this.cal);
    }

    AlarmPopOver.prototype.clean = function() {
      AlarmPopOver.__super__.clean.call(this);
      return this.action = null;
    };

    AlarmPopOver.prototype.unbindEvents = function() {
      AlarmPopOver.__super__.unbindEvents.call(this);
      this.popoverWidget.find('button.add-event').unbind('click');
      return this.popoverWidget.find('input').unbind('keyup');
    };

    AlarmPopOver.prototype.createNew = function(data) {
      this.clean();
      AlarmPopOver.__super__.createNew.call(this, data);
      this.action = data.action;
      return this.modelEvent = data.modelEvent;
    };

    AlarmPopOver.prototype.show = function(title, direction, content) {
      AlarmPopOver.__super__.show.call(this, title, direction, content);
      this.popoverWidget.find('input').focus();
      this.direction = direction;
      if (this.action === 'create') {
        return $('.remove').hide();
      } else {
        return $('.remove').show();
      }
    };

    AlarmPopOver.prototype.bindEvents = function() {
      var _this = this;
      AlarmPopOver.__super__.bindEvents.call(this);
      this.addEventButton = this.popoverWidget.find('button.add-event');
      this.addEventButton.click(function() {
        return _this.onEventButtonClicked();
      });
      this.alarmDescription = this.popoverWidget.find('input');
      this.alarmTimezone = this.popoverWidget.find('input-timezone');
      $('.popover #input-timezone').change(function() {
        return _this.addButton.removeClass('disabled');
      });
      return this.alarmDescription.keyup(function(event) {
        if (_this.alarmDescription.val() === '') {
          return _this.addButton.addClass('disabled');
        } else if (event.keyCode === 13 || event.which === 13) {
          return _this.onButtonClicked();
        } else {
          return _this.addButton.removeClass('disabled');
        }
      });
    };

    AlarmPopOver.prototype.bindEditEvents = function() {
      var _this = this;
      AlarmPopOver.__super__.bindEditEvents.call(this);
      this.alarmDescription = this.popoverWidget.find('input');
      this.alarmTimezone = this.popoverWidget.find('input-timezone');
      $('.popover #input-timezone').change(function() {
        return _this.addButton.removeClass('disabled');
      });
      return this.alarmDescription.keyup(function(event) {
        if (_this.alarmDescription.val() === '') {
          return _this.addButton.addClass('disabled');
        } else if (event.keyCode === 13 || event.which === 13) {
          return _this.onEditClicked();
        } else {
          return _this.addButton.removeClass('disabled');
        }
      });
    };

    AlarmPopOver.prototype.onRemoveClicked = function() {
      AlarmPopOver.__super__.onRemoveClicked.call(this);
      return this.clean;
    };

    AlarmPopOver.prototype.onButtonClicked = function() {
      var data, dueDate, value;
      value = this.popoverWidget.find('input').val();
      dueDate = this.formatDate(value);
      value = value.replace(/(( )?((at|à) )?[0-9]?[0-9]:[0-9]{2})/, '');
      value = value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      data = {
        description: value,
        action: 'DISPLAY',
        trigg: dueDate.format(Alarm.dateFormat)
      };
      if ($('.popover #input-timezone').val() !== "Use specific timezone") {
        data.timezone = $('.popover #input-timezone').val();
      }
      AlarmPopOver.__super__.onButtonClicked.call(this, data);
      return this.clean();
    };

    AlarmPopOver.prototype.onEditClicked = function() {
      var data,
        _this = this;
      data = {
        description: this.alarmDescription.val()
      };
      if ($('.popover #input-timezone').val() !== "Use specific timezone") {
        data.timezone = $('.popover #input-timezone').val();
      }
      return AlarmPopOver.__super__.onEditClicked.call(this, data, function(success) {
        if (success) {
          _this.event.title = data.description;
          _this.event.timezone = data.timezone;
          return _this.cal.fullCalendar('renderEvent', _this.event);
        }
      });
    };

    AlarmPopOver.prototype.onEventButtonClicked = function() {
      var eventFormTemplate;
      this.field.popover('destroy').popover();
      this.pop = new EventPopOver(this.cal);
      this.pop.createNew({
        field: this.field,
        date: this.date,
        action: 'create',
        model: this.modelEvent
      });
      eventFormTemplate = eventFormSmallTemplate({
        editionMode: false,
        defaultValueStart: '',
        defaultValueEnd: '',
        defaultValuePlace: '',
        defaultValueDesc: ''
      });
      this.pop.show(t("Event creation"), this.direction, eventFormTemplate);
      return this.pop.bindEvents(this.date);
    };

    return AlarmPopOver;

  })(PopOver);
  
});
window.require.register("views/alarm_view", function(exports, require, module) {
  var AlarmView, ScheduleElement, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ScheduleElement = require('./schedule_element');

  module.exports = AlarmView = (function(_super) {
    __extends(AlarmView, _super);

    function AlarmView() {
      _ref = AlarmView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AlarmView.prototype.render = function() {
      return AlarmView.__super__.render.call(this, {
        action: this.model.get('action'),
        time: this.model.getFormattedDate('{HH}:{mm}'),
        description: this.model.get('description'),
        timezone: this.model.get('timezone'),
        alarmID: this.model.id
      });
    };

    AlarmView.prototype.template = function() {
      return require('./templates/alarm');
    };

    return AlarmView;

  })(ScheduleElement);
  
});
window.require.register("views/alarms_list_view", function(exports, require, module) {
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
      this.listenTo(this.model, "add", this.onAdd);
      this.listenTo(this.model, "change", this.onChange);
      this.listenTo(this.model, "remove", this.onRemove);
      this.listenTo(this.model, "reset", this.onReset);
      this.views = {};
      this.dayPrograms = new Backbone.Collection;
      this.dayPrograms.comparator = function(dayProg1, dayProg2) {
        var d1, d2;
        d1 = new Date.create(dayProg1.get('date'));
        d2 = new Date.create(dayProg2.get('date'));
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
      return this.model.forEach(function(item) {
        return _this.onAdd(item, _this.model);
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
window.require.register("views/calendar_view", function(exports, require, module) {
  var Alarm, AlarmFormView, AlarmPopOver, AlarmsListView, CalendarView, Event, EventPopOver, View, formSmallTemplate, helpers, timezones, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  AlarmFormView = require('./alarm_form_view');

  AlarmPopOver = require('./alarm_popover');

  AlarmsListView = require('../views/alarms_list_view');

  EventPopOver = require('./event_popover');

  helpers = require('../helpers');

  timezones = require('helpers/timezone').timezones;

  Alarm = require('../models/alarm');

  Event = require('../models/event');

  formSmallTemplate = {};

  formSmallTemplate.alarm = require('./templates/alarm_form_small');

  formSmallTemplate.event = require('./templates/event_form_small');

  module.exports = CalendarView = (function(_super) {
    __extends(CalendarView, _super);

    function CalendarView() {
      this.onEventClick = __bind(this.onEventClick, this);
      this.onEventDrop = __bind(this.onEventDrop, this);
      this.onSelect = __bind(this.onSelect, this);
      _ref = CalendarView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CalendarView.prototype.el = '#viewContainer';

    CalendarView.prototype.initialize = function(alarm, evt) {
      this.caldata = {};
      this.model.alarm = alarm;
      this.model.event = evt;
      this.listenTo(this.model.alarm, 'add', this.onAddAlarm);
      this.listenTo(this.model.alarm, 'reset', this.onResetAlarm);
      this.listenTo(this.model.event, 'add', this.onAddEvent);
      return this.listenTo(this.model.event, 'reset', this.onResetEvent);
    };

    CalendarView.prototype.template = function() {
      return require('./templates/calendarview');
    };

    CalendarView.prototype.afterRender = function() {
      this.cal = this.$('#alarms').fullCalendar({
        header: {
          left: 'prev,next today',
          center: 'title',
          right: 'month,agendaWeek,agendaDay'
        },
        editable: true,
        firstDay: 1,
        weekMode: 'liquid',
        aspectRatio: 2.031,
        defaultView: 'month',
        columnFormat: {
          month: 'dddd',
          week: 'ddd dd/MM',
          day: 'dddd dd/MM'
        },
        timeFormat: {
          '': 'HH:mm',
          'agenda': 'HH:mm{ - HH:mm}'
        },
        axisFormat: 'HH:mm',
        buttonText: {
          today: t('Today'),
          month: t('Month'),
          week: t('Week'),
          day: t('Day')
        },
        dayNames: [t('Sunday'), t('Monday'), t('Tuesday'), t('Wednesday'), t('Thursday'), t('Friday'), t('Saturday')],
        dayNamesShort: [t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')],
        monthNames: [t('January'), t('February'), t('March'), t('April'), t('May'), t('June'), t('July'), t('August'), t('September'), t('October'), t('November'), t('December')],
        monthNamesShort: [t('Jan'), t('Feb'), t('Mar'), t('Apr'), t('May'), t('Jun'), t('Jul'), t('Aug'), t('Sep'), t('Oct'), t('Nov'), t('Dec')],
        selectable: true,
        selectHelper: false,
        unselectAuto: false,
        eventRender: this.onRender,
        viewDisplay: this.deletePopOver,
        select: this.onSelect,
        eventDragStop: this.onEventDragStop,
        eventDrop: this.onEventDrop,
        eventClick: this.onEventClick
      });
      this.popover = {};
      this.popover.alarm = new AlarmPopOver(this.cal);
      return this.popover.event = new EventPopOver(this.cal);
    };

    CalendarView.prototype.onAddAlarm = function(alarm, alarms) {
      var content, endAlarm, event, index, time;
      index = alarm.getFormattedDate("{MM}-{dd}-{yyyy}");
      time = alarm.getFormattedDate("{hh}:{mm}");
      content = "" + time + " " + (alarm.get("description"));
      endAlarm = alarm.getDateObject().clone();
      endAlarm.advance({
        minutes: 30
      });
      event = {
        id: alarm.cid,
        title: alarm.get('description'),
        timezone: alarm.get('timezone'),
        start: alarm.getFormattedDate(Date.ISO8601_DATETIME),
        end: endAlarm.format(Date.ISO8601_DATETIME),
        allDay: false,
        backgroundColor: '#5C5',
        borderColor: '#5C5',
        type: 'alarm'
      };
      return this.cal.fullCalendar('addEventSource', [event]);
    };

    CalendarView.prototype.onResetAlarm = function() {
      var _this = this;
      return this.model.alarm.forEach(function(item) {
        return _this.onAddAlarm(item, _this.model.alarm);
      });
    };

    CalendarView.prototype.onAddEvent = function(evt, events) {
      var content, endEvt, event, index, time;
      index = evt.getFormattedDate("{MM}-{dd}-{yyyy}");
      time = evt.get("start");
      content = "" + time + " " + (evt.get("description"));
      endEvt = evt.get("end");
      event = {
        id: evt.cid,
        title: evt.get('description'),
        start: evt.getFormattedStartDate(Date.ISO8601_DATETIME),
        end: evt.getFormattedEndDate(Date.ISO8601_DATETIME),
        allDay: false,
        diff: evt.get("diff"),
        place: evt.get('place'),
        backgroundColor: '#EB1',
        borderColor: '#EB1',
        type: 'event'
      };
      return this.cal.fullCalendar('addEventSource', [event]);
    };

    CalendarView.prototype.onResetEvent = function() {
      var _this = this;
      return this.model.event.forEach(function(item) {
        return _this.onAddEvent(item, _this.model.event);
      });
    };

    CalendarView.prototype.onSelect = function(startDate, endDate, allDay, jsEvent, view) {
      this.popover.alarm.clean();
      this.popover.event.clean();
      if (view.name === "month") {
        return this.handleSelectionInView(startDate, endDate, allDay, jsEvent);
      } else if (view.name === "agendaWeek") {
        return this.handleSelectionInView(startDate, endDate, allDay, jsEvent);
      } else if (view.name === "agendaDay") {
        return this.handleSelectionInView(startDate, endDate, allDay, jsEvent, true);
      }
    };

    CalendarView.prototype.onRender = function(event, element) {
      var selector, spinTarget;
      if (event.type === 'alarm') {
        selector = '.ui-resizable-handle.ui-resizable-s';
        $(element).find(selector).remove();
      }
      if (event.type === 'event') {
        selector = '.ui-resizable-handle.ui-resizable-s';
        $(element).find(selector).remove();
      }
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

    CalendarView.prototype.onEventDrop = function(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
      var alarm, data, evt, storeEvent,
        _this = this;
      storeEvent = function(model, data) {
        return model.save(data, {
          wait: true,
          success: function() {
            event.isSaving = false;
            return _this.cal.fullCalendar('renderEvent', event);
          },
          error: function() {
            event.isSaving = false;
            _this.cal.fullCalendar('renderEvent', event);
            return revertFunc();
          }
        });
      };
      if (event.type === 'alarm') {
        alarm = this.model.alarm.get(event.id);
        alarm.getDateObject().advance({
          days: dayDelta,
          minutes: minuteDelta
        });
        data = {
          trigg: alarm.getFormattedDate(Alarm.dateFormat)
        };
        return storeEvent(alarm, data);
      } else {
        evt = this.model.event.get(event.id);
        evt.getStartDateObject().advance({
          days: dayDelta,
          minutes: minuteDelta
        });
        evt.getEndDateObject().advance({
          days: dayDelta,
          minutes: minuteDelta
        });
        data = {
          start: evt.getFormattedStartDate(Event.dateFormat),
          end: evt.getFormattedEndDate(Event.dateFormat)
        };
        return storeEvent(evt, data);
      }
    };

    CalendarView.prototype.onEventClick = function(event, jsEvent, view) {
      var defaultValueEnd, diff, direction, eventStartTime, formTemplate, isDayView, target, timezone, timezoneData, _i, _len, _ref1;
      target = $(jsEvent.currentTarget);
      eventStartTime = event.start.getTime();
      isDayView = view.name === 'agendaDay';
      direction = helpers.getPopoverDirection(isDayView, event.start, event.end, true);
      if (!(this.popover[event.type].action === 'edit' && ((_ref1 = this.popover[event.type].event) != null ? _ref1.id : void 0) === event.id)) {
        this.popover.event.clean();
        this.popover.alarm.clean();
        this.popover[event.type].createNew({
          field: $(target),
          date: event.start,
          action: 'edit',
          model: this.model[event.type],
          event: event
        });
        if (event.type === 'alarm') {
          timezoneData = [];
          for (_i = 0, _len = timezones.length; _i < _len; _i++) {
            timezone = timezones[_i];
            timezoneData.push({
              value: timezone,
              text: timezone
            });
          }
          formTemplate = formSmallTemplate.alarm({
            editionMode: true,
            defaultValue: event.title,
            timezones: timezoneData,
            defaultTimezone: event.timezone
          });
          this.popover.alarm.show(t("Alarm edition"), direction, formTemplate);
        } else {
          diff = event.diff;
          defaultValueEnd = event.end.format('{HH}:{mm}') + "+" + diff;
          formTemplate = formSmallTemplate.event({
            editionMode: true,
            defaultValueStart: event.start.format('{HH}:{mm}'),
            defaultValueEnd: defaultValueEnd,
            defaultValuePlace: event.place,
            defaultValueDesc: event.title
          });
          this.popover.event.show(t("Event edition"), direction, formTemplate);
        }
        return this.popover[event.type].bindEditEvents();
      }
    };

    CalendarView.prototype.handleSelectionInView = function(startDate, endDate, allDay, jsEvent, isDayView) {
      var direction, endHour, formTemplate, startHour, target, title, type;
      target = $(jsEvent.target);
      direction = helpers.getPopoverDirection(isDayView, startDate);
      startHour = startDate.format('{HH}:{mm}').split(':');
      endHour = endDate.format('{HH}:{mm}').split(':');
      type = 'event';
      formTemplate = formSmallTemplate.event({
        editionMode: false,
        defaultValueStart: '',
        defaultValueEnd: '',
        defaultValuePlace: '',
        defaultValueDesc: ''
      });
      title = t("Event creation");
      this.popover[type].createNew({
        field: $(target),
        date: startDate,
        action: 'create',
        model: this.model[type],
        modelEvent: this.model.event
      });
      this.popover[type].show(title, direction, formTemplate);
      return this.popover[type].bindEvents(startDate);
    };

    return CalendarView;

  })(View);
  
});
window.require.register("views/dayprogram_view", function(exports, require, module) {
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
window.require.register("views/event_popover", function(exports, require, module) {
  var Event, EventPopOver, PopOver,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PopOver = require('./popover');

  Event = require('../models/event');

  module.exports = EventPopOver = (function(_super) {
    __extends(EventPopOver, _super);

    function EventPopOver(cal) {
      this.cal = cal;
      this.onEditClicked = __bind(this.onEditClicked, this);
      this.onButtonClicked = __bind(this.onButtonClicked, this);
      this.initData = __bind(this.initData, this);
      this.onRemoveClicked = __bind(this.onRemoveClicked, this);
      this.bindEditEvents = __bind(this.bindEditEvents, this);
      EventPopOver.__super__.constructor.call(this, this.cal);
    }

    EventPopOver.prototype.clean = function() {
      return EventPopOver.__super__.clean.call(this);
    };

    EventPopOver.prototype.unbindEvents = function() {
      EventPopOver.__super__.unbindEvents.call(this);
      this.popoverWidget.find('#input-start').unbind('keyup');
      this.popoverWidget.find('#input-end').unbind('keyup');
      this.popoverWidget.find('#input-place').unbind('keyup');
      return this.popoverWidget.find('#input-desc').unbind('keyup');
    };

    EventPopOver.prototype.createNew = function(data) {
      this.clean();
      return EventPopOver.__super__.createNew.call(this, data);
    };

    EventPopOver.prototype.show = function(title, direction, content) {
      EventPopOver.__super__.show.call(this, title, direction, content);
      this.popoverWidget.find('#input-start').focus();
      this.popoverWidget.find('button.add').addClass('disable');
      if (this.action === 'create') {
        return $('.remove').hide();
      } else {
        return $('.remove').show();
      }
    };

    EventPopOver.prototype.bindEvents = function() {
      EventPopOver.__super__.bindEvents.call(this);
      this.eventStart = this.popoverWidget.find('#input-start');
      this.eventEnd = this.popoverWidget.find('#input-end');
      this.eventPlace = this.popoverWidget.find('#input-place');
      this.eventDescription = this.popoverWidget.find('#input-desc');
      this.eventStart.keyup(this.keyReaction);
      this.eventEnd.keyup(this.keyReaction);
      return this.eventDescription.keyup(this.keyReaction);
    };

    EventPopOver.prototype.bindEditEvents = function() {
      EventPopOver.__super__.bindEditEvents.call(this);
      this.eventStart = this.popoverWidget.find('#input-start');
      this.eventEnd = this.popoverWidget.find('#input-end');
      this.eventPlace = this.popoverWidget.find('#input-place');
      this.eventDescription = this.popoverWidget.find('#input-desc');
      this.eventStart.keyup(this.keyReaction);
      this.eventEnd.keyup(this.keyReaction);
      return this.eventDescription.keyup(this.keyReaction);
    };

    EventPopOver.prototype.onRemoveClicked = function() {
      EventPopOver.__super__.onRemoveClicked.call(this);
      return this.clean;
    };

    EventPopOver.prototype.initData = function() {
      var data, dueEndDate, dueStartDate, newDate, specifiedDay;
      dueStartDate = this.formatDate($('.popover #input-start').val());
      specifiedDay = $('.popover #input-end').val().split('+');
      if (specifiedDay[1] != null) {
        newDate = this.date.advance({
          days: specifiedDay[1]
        });
        dueEndDate = Date.create(newDate);
      } else {
        specifiedDay[1] = 0;
        dueEndDate = Date.create(this.date);
      }
      dueEndDate = this.formatDate(specifiedDay[0]);
      data = {
        start: dueStartDate.format(Event.dateFormat),
        end: dueEndDate.format(Event.dateFormat),
        diff: parseInt(specifiedDay[1]),
        place: $('.popover #input-place').val(),
        description: $('.popover #input-desc').val()
      };
      return data;
    };

    EventPopOver.prototype.onButtonClicked = function() {
      var data;
      data = this.initData();
      EventPopOver.__super__.onButtonClicked.call(this, data);
      return this.clean();
    };

    EventPopOver.prototype.onEditClicked = function() {
      var data,
        _this = this;
      data = this.initData();
      return EventPopOver.__super__.onEditClicked.call(this, data, function(success) {
        var endDate, startDate;
        if (success) {
          _this.event.title = data.description;
          startDate = new Date(data.start);
          _this.event.start = startDate.format(Date.ISO8601_DATETIME);
          endDate = new Date(data.end);
          _this.event.end = endDate.format(Date.ISO8601_DATETIME);
          _this.event.diff = data.diff;
          _this.event.place = data.place;
          return _this.cal.fullCalendar('renderEvent', _this.event);
        }
      });
    };

    return EventPopOver;

  })(PopOver);
  
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

    AlarmList.prototype.views = {};

    AlarmList.prototype.template = function() {
      return '';
    };

    AlarmList.prototype.collection = new AlarmCollection;

    AlarmList.prototype.collectionEl = "#import-alarm-list";

    return AlarmList;

  })(ViewCollection);
  
});
window.require.register("views/import_alarm_view", function(exports, require, module) {
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

    EventList.prototype.views = {};

    EventList.prototype.template = function() {
      return '';
    };

    EventList.prototype.collection = new EventCollection;

    EventList.prototype.collectionEl = "#import-event-list";

    return EventList;

  })(ViewCollection);
  
});
window.require.register("views/import_event_view", function(exports, require, module) {
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
window.require.register("views/import_view", function(exports, require, module) {
  var Alarm, AlarmList, Event, EventList, ImportView, View, helpers, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

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

    ImportView.prototype.el = '#viewContainer';

    ImportView.prototype.events = {
      'change #import-file-input': 'onFileChanged',
      'click button#import-button': 'onImportClicked',
      'click button#confirm-import-button': 'onConfirmImportClicked',
      'click button#cancel-import-button': 'onCancelImportClicked'
    };

    ImportView.prototype.initialize = function() {};

    ImportView.prototype.template = function() {
      return require('./templates/import_view');
    };

    ImportView.prototype.afterRender = function() {
      this.$(".confirmation").hide();
      this.$(".results").hide();
      this.alarmList = new AlarmList;
      this.alarmList.render();
      this.eventList = new EventList;
      this.eventList.render();
      this.importButton = this.$('button#import-button');
      return this.confirmButton = this.$('button#confirm-button');
    };

    ImportView.prototype.onFileChanged = function(event) {
      var file;
      file = event.target.files[0];
      return this.file = file;
    };

    ImportView.prototype.onImportClicked = function() {
      var form,
        _this = this;
      form = new FormData();
      form.append("file", this.file);
      this.importButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      this.importButton.spin('tiny');
      return $.ajax({
        url: "import/ical",
        type: "POST",
        data: form,
        processData: false,
        contentType: false,
        success: function(result) {
          var alarm, event, valarm, vevent, _i, _j, _len, _len1, _ref1, _ref2;
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
            _this.importButton.spin();
            _this.importButton.html('import your calendar');
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
          _this.importButton.spin();
          return _this.importButton.html('import your calendar');
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
          return _this.confirmButton.html('confirm import');
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

    return ImportView;

  })(View);
  
});
window.require.register("views/list_view", function(exports, require, module) {
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

    ListView.prototype.el = '#viewContainer';

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
        model: this.model
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
      console.log(this.alarmFormView.timezoneField.val());
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
        alarm = this.model.create(data, {
          ignoreMySocketNotification: true,
          wait: true,
          success: function(model, response) {
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
      alarmID = $(event.target).data('alarmid');
      alarm = this.model.get(alarmID);
      return this.alarmFormView.loadAlarmData(alarm);
    };

    ListView.prototype.onRemoveAlarmClicked = function(event) {
      var alarm, alarmID;
      alarmID = $(event.target).data('alarmid');
      alarm = this.model.get(alarmID);
      return alarm.destroy({
        wait: true,
        success: function() {
          return console.log("Delete alarm: success");
        },
        error: function() {
          return console.log("Delete alarm: error");
        }
      });
    };

    return ListView;

  })(View);
  
});
window.require.register("views/popover", function(exports, require, module) {
  var PopOver, View,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  module.exports = PopOver = (function(_super) {
    __extends(PopOver, _super);

    function PopOver(cal) {
      this.cal = cal;
      this.onEditClicked = __bind(this.onEditClicked, this);
      this.onButtonClicked = __bind(this.onButtonClicked, this);
      this.onRemoveClicked = __bind(this.onRemoveClicked, this);
      this.bindEditEvents = __bind(this.bindEditEvents, this);
    }

    PopOver.prototype.clean = function() {
      var _ref, _ref1;
      if ((_ref = this.field) != null) {
        _ref.popover('destroy');
      }
      this.field = null;
      this.date = null;
      this.isExist = null;
      this.event = null;
      if (this.popoverWidget != null) {
        this.unbindEvents();
      }
      return (_ref1 = this.popoverWidget) != null ? _ref1.hide() : void 0;
    };

    PopOver.prototype.unbindEvents = function() {
      this.popoverWidget.find('button.add').unbind('click');
      return this.popoverWidget.find('button.close').unbind('click');
    };

    PopOver.prototype.createNew = function(data) {
      this.field = data.field;
      this.date = data.date;
      this.model = data.model;
      this.event = data.event;
      this.action = data.action;
      return this.isExist = true;
    };

    PopOver.prototype.show = function(title, direction, content) {
      if ($(window).width() < 600) {
        direction = 'bottom';
      }
      this.field.data('popover', null).popover({
        title: require('./templates/popover_title')({
          title: title
        }),
        html: true,
        placement: direction,
        content: content
      }).popover('show');
      return this.popoverWidget = $('.container .popover');
    };

    PopOver.prototype.bindEvents = function() {
      var _this = this;
      this.keyReaction = function(event) {
        if (_this.eventStart.val() === '' || _this.eventEnd.val() === '' || _this.eventDescription.val() === '') {
          return _this.addButton.addClass('disabled');
        } else if (event.keyCode === 13 || event.which === 13) {
          return _this.onButtonClicked();
        } else {
          return _this.addButton.removeClass('disabled');
        }
      };
      this.popoverWidget = $('.container .popover');
      this.addButton = this.popoverWidget.find('button.add');
      this.addButton.html(this.action);
      this.addButton.click(function() {
        return _this.onButtonClicked();
      });
      this.popoverWidget.find('button.close').click(function() {
        return _this.clean();
      });
      return this.addButton.addClass('disabled');
    };

    PopOver.prototype.bindEditEvents = function() {
      var _this = this;
      this.keyReaction = function(event) {
        if (_this.checkField) {
          return _this.addButton.addClass('disabled');
        } else if (event.keyCode === 13 || event.which === 13) {
          return _this.onEditClicked();
        } else {
          return _this.addButton.removeClass('disabled');
        }
      };
      this.addButton = this.popoverWidget.find('button.add');
      this.popoverWidget = $('.container .popover');
      this.closeButton = this.popoverWidget.find('button.close');
      this.removeButton = this.popoverWidget.find('.remove');
      this.removeButton.click(function() {
        return _this.onRemoveClicked();
      });
      this.addButton.html(this.action);
      this.closeButton.click(function() {
        return _this.clean();
      });
      return this.addButton.click(function() {
        return _this.onEditClicked();
      });
    };

    PopOver.prototype.onRemoveClicked = function() {
      var evt,
        _this = this;
      evt = this.model.get(this.event.id);
      this.removeButton.css('width', '42px');
      this.removeButton.spin('tiny');
      return evt.destroy({
        success: function() {
          _this.cal.fullCalendar('removeEvents', _this.event.id);
          _this.removeButton.spin();
          return _this.removeButton.css('width', '14px');
        },
        error: function() {
          this.removeButton.spin();
          return this.removeButton.css('width', '14px');
        }
      });
    };

    PopOver.prototype.formatDate = function(value) {
      var dueDate, smartDetection, specifiedTime;
      dueDate = Date.create(this.date);
      if (dueDate.format('{HH}:{mm}') === '00:00') {
        dueDate.advance({
          hours: 8
        });
      }
      smartDetection = value.match(/([0-9]?[0-9]:[0-9]{2})/);
      if ((smartDetection != null) && (smartDetection[1] != null)) {
        specifiedTime = smartDetection[1];
        specifiedTime = specifiedTime.split(/:/);
        dueDate.set({
          hours: specifiedTime[0],
          minutes: specifiedTime[1]
        });
        return dueDate;
      }
    };

    PopOver.prototype.onButtonClicked = function(data) {
      var _this = this;
      this.addButton.html('&nbsp;');
      this.addButton.spin('small');
      return this.model.create(data, {
        wait: true,
        success: function() {
          _this.addButton.spin();
          return _this.addButton.html(_this.action);
        },
        error: function() {
          _this.clean();
          _this.addButton.spin();
          return _this.addButton.html(_this.action);
        }
      });
    };

    PopOver.prototype.onEditClicked = function(data, callback) {
      var evt,
        _this = this;
      evt = this.model.get(this.event.id);
      this.cal.fullCalendar('renderEvent', this.event);
      this.addButton.html('&nbsp;');
      this.addButton.spin('small');
      return evt.save(data, {
        wait: true,
        success: function() {
          _this.addButton.spin();
          _this.addButton.html(_this.action);
          return callback(true);
        },
        error: function() {
          _this.cal.fullCalendar('renderEvent', _this.event);
          _this.addButton.spin();
          _this.addButton.html(_this.action);
          return callback(false);
        }
      });
    };

    return PopOver;

  })(View);
  
});
window.require.register("views/schedule_element", function(exports, require, module) {
  var ScheduleElement, View, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  module.exports = ScheduleElement = (function(_super) {
    __extends(ScheduleElement, _super);

    function ScheduleElement() {
      _ref = ScheduleElement.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ScheduleElement.prototype.tagName = 'div';

    ScheduleElement.prototype.className = 'scheduleElement';

    ScheduleElement.prototype.initialize = function() {
      return this.listenTo(this.model, "change", this.onChange);
    };

    ScheduleElement.prototype.onChange = function(alarm) {
      return this.render();
    };

    return ScheduleElement;

  })(View);
  
});
window.require.register("views/templates/alarm", function(exports, require, module) {
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
window.require.register("views/templates/alarm_form", function(exports, require, module) {
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

  buf.push('</select></div><button class="btn pull-right add-alarm">');
  var __val__ = t('add the alarm')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</button><div class="clearfix"></div></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/alarm_form_small", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValue) + ""), 'id':("inputDesc"), 'placeholder':(t("What do you want to be reminded ?")), "class": ('input-xlarge') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/><button class="btn pull-right add disabled">');
  if ( editionMode)
  {
  var __val__ = t('Edit')
  buf.push(escape(null == __val__ ? "" : __val__));
  }
  else
  {
  var __val__ = t('Add')
  buf.push(escape(null == __val__ ? "" : __val__));
  }
  buf.push('</button>');
  if (!( editionMode))
  {
  buf.push('<p>');
  var __val__ = t('ie: 9:00 important meeting')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</p>');
  }
  buf.push('<select id="input-timezone" class="input"><option');
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

  buf.push('</select>');
  if (!( editionMode))
  {
  buf.push('<button class="btn add-event">');
  var __val__ = t('Create Event')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</button>');
  }
  buf.push('</div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/alarm_import", function(exports, require, module) {
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
window.require.register("views/templates/calendarview", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="container"><ul id="menu"><li><a href="#alarms" class="btn"><i class="icon-bell icon-white"></i><span> ');
  var __val__ = t('Alarms')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a><a href="#calendar" class="active btn"><i class="icon-calendar icon-white"></i><span>');
  var __val__ = t('Calendar')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a><a href="export/calendar.ics" target="_blank" class="btn"><i class="icon-share icon-white"></i><span>');
  var __val__ = t('Export')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a><a id="import-menu-button" href="#import" class="btn"><i class="icon-circle-arrow-up icon-white"></i><span>');
  var __val__ = t('Import')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a></li></ul><div id="alarms" class="well"></div></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/dayprogram", function(exports, require, module) {
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
window.require.register("views/templates/event", function(exports, require, module) {
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
window.require.register("views/templates/event_form_small", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValueStart) + ""), 'id':("input-start"), 'placeholder':(t("From hours:minutes")), "class": ('input-small') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValueEnd) + ""), 'id':("input-end"), 'placeholder':(t("To hours:minutes+days")), "class": ('input-small') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/></div><div><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValuePlace) + ""), 'id':("input-place"), 'placeholder':(t("Place")), "class": ('input-small') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValueDesc) + ""), 'id':("input-desc"), 'placeholder':(t("Description")), "class": ('input') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/><button class="btn add">');
  if ( editionMode)
  {
  var __val__ = t('Edit')
  buf.push(escape(null == __val__ ? "" : __val__));
  }
  else
  {
  var __val__ = t('Create')
  buf.push(escape(null == __val__ ? "" : __val__));
  }
  buf.push('</button></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/event_import", function(exports, require, module) {
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
  buf.push('<div class="container"><ul id="menu"><li><a href="#alarms" class="btn"><i class="icon-bell icon-white"></i><span> ');
  var __val__ = t('Alarms')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a><a href="#calendar" class="btn"><i class="icon-calendar icon-white"></i><span>');
  var __val__ = t('Calendar')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a><a href="export/calendar.ics" target="_blank" class="btn"><i class="icon-share icon-white"></i><span>');
  var __val__ = t('Export')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a><a id="import-menu-button" href="#import" class="active btn"><i class="icon-circle-arrow-up icon-white"></i><span>');
  var __val__ = t('Import')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</span></a></li></ul><div id="import-form" class="well"><h3>');
  var __val__ = t('ICalendar importer')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</h3><div class="import-form"><button id="import-button" class="btn">');
  var __val__ = t('import your icalendar file')
  buf.push(escape(null == __val__ ? "" : __val__));
  buf.push('</button><input id="import-file-input" type="file"/></div><div class="confirmation"><button id="confirm-import-button" class="btn">');
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
window.require.register("views/templates/listview", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="container"><ul id="menu"><li><a href="#alarms" class="active btn"><i class="icon-bell icon-white"></i><span> ');
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
  buf.push('</span></a></li></ul><div class="addform"><div id="add-alarm" class="container"></div></div><div id="alarm-list" class="well"></div></div>');
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
