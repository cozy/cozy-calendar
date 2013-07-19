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
      var AlarmCollection, EventCollection, Router, SocketListener;

      Router = require('router');
      SocketListener = require('../lib/socket_listener');
      AlarmCollection = require('collections/alarms');
      EventCollection = require('collections/events');
      this.router = new Router();
      this.alarms = new AlarmCollection();
      this.events = new EventCollection();
      SocketListener.watch(this.alarms);
      SocketListener.watch(this.events);
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

  exports.getPopoverDirection = function(isDayView, startDate) {
    var direction, selectedHour, selectedWeekDay;

    if (!isDayView) {
      selectedWeekDay = startDate.format('{weekday}');
      if (selectedWeekDay === 'friday' || selectedWeekDay === 'saturday' || selectedWeekDay === 'sunday') {
        direction = 'left';
      } else {
        direction = 'right';
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
      return Date.create(this.get(this.mainDateField)).format(formatter);
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
      this.displayView = __bind(this.displayView, this);    _ref = Router.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Router.prototype.routes = {
      '': 'calendar',
      'calendar': 'calendar',
      'list': 'alarmsList',
      'import': 'import'
    };

    Router.prototype.calendar = function() {
      this.displayView(CalendarView, app.alarms, app.events);
      this.handleFetch(this.mainView.model['alarm'], "alarms");
      return this.handleFetch(this.mainView.model['event'], "events");
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
window.require.register("views/alarm_popover", function(exports, require, module) {
  var Alarm, AlarmPopOver, EventPopOver, View, eventFormSmallTemplate,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  Alarm = require('../models/alarm');

  EventPopOver = require('./event_popover');

  eventFormSmallTemplate = require('./templates/event_form_small');

  module.exports = AlarmPopOver = (function(_super) {
    __extends(AlarmPopOver, _super);

    function AlarmPopOver(cal) {
      this.cal = cal;
      this.onEditAlarmClicked = __bind(this.onEditAlarmClicked, this);
      this.onEventButtonClicked = __bind(this.onEventButtonClicked, this);
      this.onAlarmButtonClicked = __bind(this.onAlarmButtonClicked, this);
      this.onRemoveAlarmClicked = __bind(this.onRemoveAlarmClicked, this);
      this.bindEditEvents = __bind(this.bindEditEvents, this);
      this.bindEvents = __bind(this.bindEvents, this);
    }

    AlarmPopOver.prototype.clean = function() {
      var _ref, _ref1;

      if ((_ref = this.field) != null) {
        _ref.popover('destroy');
      }
      this.field = null;
      this.date = null;
      this.action = null;
      if (this.popoverWidget != null) {
        this.popoverWidget.find('button.close').unbind('click');
        this.popoverWidget.find('button.add-alarm').unbind('click');
        this.popoverWidget.find('button.add-event').unbind('click');
        this.popoverWidget.find('input').unbind('keyup');
        return (_ref1 = this.popoverWidget) != null ? _ref1.hide() : void 0;
      }
    };

    AlarmPopOver.prototype.createNew = function(data) {
      this.clean();
      this.field = data.field;
      this.date = data.date;
      this.action = data.action;
      this.model = data.model;
      this.modelEvent = data.modelEvent;
      return this.event = data.event;
    };

    AlarmPopOver.prototype.show = function(title, direction, content) {
      this.field.popover({
        title: '<span>' + title + '&nbsp;<i class="alarm-remove ' + 'icon-trash" /></span> <button type="button" class="close">' + '&times;</button>',
        html: true,
        placement: direction,
        content: content
      }).popover('show');
      this.popoverWidget = $('.container .popover');
      this.popoverWidget.find('input').focus();
      this.direction = direction;
      if (this.action === 'create') {
        return $('.alarm-remove').hide();
      } else {
        return $('.alarm-remove').show();
      }
    };

    AlarmPopOver.prototype.bindEvents = function() {
      var _this = this;

      this.popoverWidget = $('.container .popover');
      this.addAlarmButton = this.popoverWidget.find('button.add-alarm');
      this.addAlarmButton.html(this.action);
      this.addEventButton = this.popoverWidget.find('button.add-event');
      this.popoverWidget.find('button.close').click(function() {
        return _this.clean();
      });
      this.addAlarmButton.click(function() {
        return _this.onAlarmButtonClicked();
      });
      this.addEventButton.click(function() {
        return _this.onEventButtonClicked();
      });
      this.alarmDescription = this.popoverWidget.find('input');
      return this.alarmDescription.keyup(function(event) {
        if (_this.alarmDescription.val() === '') {
          return _this.addAlarmButton.addClass('disabled');
        } else if (event.keyCode === 13 || event.which === 13) {
          return _this.onAlarmButtonClicked();
        } else {
          return _this.addAlarmButton.removeClass('disabled');
        }
      });
    };

    AlarmPopOver.prototype.bindEditEvents = function() {
      var _this = this;

      this.popoverWidget = $('.container .popover');
      this.addAlarmButton = this.popoverWidget.find('button.add-alarm');
      this.addEventButton = this.popoverWidget.find('button.add-event');
      this.closeButton = this.popoverWidget.find('button.close');
      this.removeButton = this.popoverWidget.find('.alarm-remove');
      this.alarmDescription = this.popoverWidget.find('input');
      this.addAlarmButton.html(this.action);
      this.closeButton.click(function() {
        return _this.clean();
      });
      this.addAlarmButton.click(function() {
        return _this.onEditAlarmClicked();
      });
      this.removeButton.click(function() {
        return _this.onRemoveAlarmClicked();
      });
      return this.alarmDescription.keyup(function(event) {
        if (_this.alarmDescription.val() === '') {
          return _this.addAlarmButton.addClass('disabled');
        } else if (event.keyCode === 13 || event.which === 13) {
          return _this.onEditAlarmClicked();
        } else {
          return _this.addAlarmButton.removeClass('disabled');
        }
      });
    };

    AlarmPopOver.prototype.onRemoveAlarmClicked = function() {
      var alarm,
        _this = this;

      alarm = this.model.get(this.event.id);
      this.removeButton.css('width', '42px');
      this.removeButton.spin('tiny');
      return alarm.destroy({
        success: function() {
          _this.cal.fullCalendar('removeEvents', _this.event.id);
          _this.removeButton.spin();
          _this.removeButton.css('width', '14px');
          return _this.clean();
        },
        error: function() {
          this.removeButton.spin();
          this.removeButton.css('width', '14px');
          return this.clean();
        }
      });
    };

    AlarmPopOver.prototype.onAlarmButtonClicked = function() {
      var data, dueDate, smartDetection, specifiedTime, value,
        _this = this;

      dueDate = Date.create(this.date);
      if (dueDate.format('{HH}:{mm}') === '00:00') {
        dueDate.advance({
          hours: 8
        });
      }
      value = this.popoverWidget.find('input').val();
      smartDetection = value.match(/([0-9]?[0-9]:[0-9]{2})/);
      if ((smartDetection != null) && (smartDetection[1] != null)) {
        specifiedTime = smartDetection[1];
        specifiedTime = specifiedTime.split(/:/);
        dueDate.set({
          hours: specifiedTime[0],
          minutes: specifiedTime[1]
        });
        value = value.replace(/(( )?((at|à) )?[0-9]?[0-9]:[0-9]{2})/, '');
        value = value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      }
      data = {
        description: value,
        action: 'DISPLAY',
        trigg: dueDate.format(Alarm.dateFormat)
      };
      this.addAlarmButton.html('&nbsp;');
      this.addAlarmButton.spin('small');
      return this.model.create(data, {
        wait: true,
        success: function() {
          _this.clean();
          _this.addAlarmButton.spin();
          return _this.addAlarmButton.html(_this.action);
        },
        error: function() {
          _this.clean();
          _this.addAlarmButton.spin();
          return _this.addAlarmButton.html(_this.action);
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
      this.pop.show("Event creation", this.direction, eventFormTemplate);
      return this.pop.bindEvents(this.date);
    };

    AlarmPopOver.prototype.onEditAlarmClicked = function() {
      var alarm, data,
        _this = this;

      alarm = this.model.get(this.event.id);
      data = {
        description: this.alarmDescription.val()
      };
      this.cal.fullCalendar('renderEvent', this.event);
      this.addAlarmButton.html('&nbsp;');
      this.addAlarmButton.spin('small');
      return alarm.save(data, {
        wait: true,
        success: function() {
          _this.event.title = data.description;
          _this.cal.fullCalendar('renderEvent', _this.event);
          _this.addAlarmButton.spin();
          return _this.addAlarmButton.html(_this.action);
        },
        error: function() {
          this.cal.fullCalendar('renderEvent', this.event);
          this.addAlarmButton.spin();
          return this.addAlarmButton.html(this.action);
        }
      });
    };

    return AlarmPopOver;

  })(View);
  
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
        alarmID: this.model.id
      });
    };

    AlarmView.prototype.template = function() {
      return require('./templates/alarm');
    };

    return AlarmView;

  })(ScheduleElement);
  
});
window.require.register("views/alarmform_view", function(exports, require, module) {
  var AlarmFormView, View, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  module.exports = AlarmFormView = (function(_super) {
    __extends(AlarmFormView, _super);

    function AlarmFormView() {
      this.onSubmit = __bind(this.onSubmit, this);    _ref = AlarmFormView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AlarmFormView.prototype.el = '#add-alarm';

    AlarmFormView.prototype.events = {
      'focus #inputDesc': 'onFocus',
      'blur #alarm-description-input': 'onBlur',
      'keyup #alarm-description-input': 'onKeydown',
      'click .add-alarm': 'onSubmit'
    };

    AlarmFormView.prototype.initialize = function() {
      this.actions = {
        'DISPLAY': 'Popup',
        'EMAIL': 'Email'
      };
      this.data = null;
      return this.editionMode = false;
    };

    AlarmFormView.prototype.render = function() {
      var content, todayDate;

      todayDate = Date.create('now');
      content = AlarmFormView.__super__.render.call(this, {
        actions: this.actions,
        defaultAction: this.getDefaultAction('DISPLAY'),
        defaultDate: todayDate.format('{dd}/{MM}/{yyyy}'),
        defaultTime: todayDate.format('{HH}:{mm}')
      });
      this.$el.append(content);
      this.$el.parent().css('min-height', this.$el.height() + 40);
      return this.$el.affix({
        offset: {
          top: this.$el.offset().top - 10
        }
      });
    };

    AlarmFormView.prototype.afterRender = function() {
      var datePicker;

      this.descriptionField = this.$('#alarm-description-input');
      this.actionField = this.$('#action');
      this.dateField = this.$('#inputDate input');
      this.timeField = this.$('#inputTime');
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

    AlarmFormView.prototype.template = function() {
      return require('./templates/alarm_form');
    };

    AlarmFormView.prototype.getDefaultAction = function(defaultAction) {
      var action, actionsAlreadySelected, selectedOptions;

      if (typeof defaultDefaultAction === "undefined" || defaultDefaultAction === null) {
        defaultAction = 'DISPLAY';
      }
      selectedOptions = this.$('.controls.form-inline option').filter(':selected');
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

    AlarmFormView.prototype.onKeydown = function(event) {
      console.log(event.keyCode);
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

    AlarmsListView.prototype.el = '#alarms';

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

      console.log('remove alarm now');
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
      var model;

      model = new Backbone.Model({
        date: date,
        dateHash: dateHash,
        alarms: new AlarmCollection()
      });
      this.dayPrograms.add(model);
      return this.views[dateHash] = new DayProgramView({
        id: dateHash,
        model: model
      });
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
  var Alarm, AlarmFormView, AlarmPopOver, AlarmsListView, CalendarView, Event, EventPopOver, View, formSmallTemplate, helpers, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  AlarmFormView = require('./alarmform_view');

  AlarmPopOver = require('./alarm_popover');

  AlarmsListView = require('../views/alarms_list_view');

  EventPopOver = require('./event_popover');

  helpers = require('../helpers');

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
      this.onSelect = __bind(this.onSelect, this);    _ref = CalendarView.__super__.constructor.apply(this, arguments);
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
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day'
        },
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
      var defaultValueEnd, diff, direction, eventStartTime, formTemplate, isDayView, target, _ref1;

      target = $(jsEvent.currentTarget);
      eventStartTime = event.start.getTime();
      isDayView = view.name === 'agendaDay';
      direction = helpers.getPopoverDirection(isDayView, event.start);
      this.popover.event.clean();
      this.popover.alarm.clean();
      if (!((this.popover[event.type].isExist != null) && this.popover[event.type].action === 'edit' && ((_ref1 = this.popover[event.type].date) != null ? _ref1.getTime() : void 0) === eventStartTime)) {
        this.popover[event.type].createNew({
          field: $(target),
          date: event.start,
          action: 'edit',
          model: this.model[event.type],
          event: event
        });
        if (event.type === 'alarm') {
          formTemplate = formSmallTemplate.alarm({
            editionMode: true,
            defaultValue: event.title
          });
          this.popover.alarm.show("Alarm edition", direction, formTemplate);
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
          this.popover.event.show("Event edition", direction, formTemplate);
        }
      }
      return this.popover[event.type].bindEditEvents();
    };

    CalendarView.prototype.handleSelectionInView = function(startDate, endDate, allDay, jsEvent, isDayView) {
      var direction, endHour, formTemplate, startHour, target, title, type;

      target = $(jsEvent.target);
      direction = helpers.getPopoverDirection(isDayView, startDate);
      startHour = startDate.format('{HH}:{mm}').split(':');
      endHour = endDate.format('{HH}:{mm}').split(':');
      if (helpers.isEvent(startHour, endHour)) {
        type = 'event';
        formTemplate = formSmallTemplate.event({
          editionMode: false,
          defaultValueStart: startDate.format('{HH}:{mm}'),
          defaultValueEnd: endDate.format('{HH}:{mm}'),
          defaultValuePlace: '',
          defaultValueDesc: ''
        });
        title = "Event creation";
      } else {
        type = 'alarm';
        formTemplate = formSmallTemplate.alarm({
          editionMode: false,
          defaultValue: ''
        });
        title = "Alarm creation";
      }
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
  var Event, EventPopOver, View,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  Event = require('../models/event');

  module.exports = EventPopOver = (function(_super) {
    __extends(EventPopOver, _super);

    function EventPopOver(cal) {
      this.cal = cal;
      this.onEditEventClicked = __bind(this.onEditEventClicked, this);
      this.onEventButtonClicked = __bind(this.onEventButtonClicked, this);
      this.onRemoveEventClicked = __bind(this.onRemoveEventClicked, this);
      this.bindEditEvents = __bind(this.bindEditEvents, this);
      this.bindEvents = __bind(this.bindEvents, this);
    }

    EventPopOver.prototype.clean = function() {
      var _ref, _ref1;

      if ((_ref = this.field) != null) {
        _ref.popover('destroy');
      }
      this.field = null;
      this.date = null;
      if (this.popoverWidget != null) {
        this.popoverWidget.find('button.close').unbind('click');
        this.popoverWidget.find('button.add-event').unbind('click');
        this.popoverWidget.find('#inputStart').unbind('keyup');
        this.popoverWidget.find('#inputEnd').unbind('keyup');
        this.popoverWidget.find('#inputPlace').unbind('keyup');
        this.popoverWidget.find('#inputDesc').unbind('keyup');
        return (_ref1 = this.popoverWidget) != null ? _ref1.hide() : void 0;
      }
    };

    EventPopOver.prototype.createNew = function(data) {
      this.clean();
      this.field = data.field;
      this.date = data.date;
      this.model = data.model;
      this.event = data.event;
      return this.action = data.action;
    };

    EventPopOver.prototype.show = function(title, direction, content) {
      this.field.data('popover', null).popover({
        title: '<span>' + title + '&nbsp;<i class="event-remove ' + 'icon-trash" /></span> <button type="button" class="close">' + '&times;</button>',
        html: true,
        placement: direction,
        content: content
      }).popover('show');
      this.popoverWidget = $('.container .popover');
      this.popoverWidget.find('#inputStart').focus();
      this.popoverWidget.find('button.add-event').addClass('disable');
      if (this.action === 'create') {
        return $('.event-remove').hide();
      } else {
        return $('.event-remove').show();
      }
    };

    EventPopOver.prototype.bindEvents = function() {
      var keyReaction,
        _this = this;

      this.popoverWidget = $('.container .popover');
      this.addEventButton = this.popoverWidget.find('button.add-event');
      this.popoverWidget.find('button.close').click(function() {
        return _this.clean();
      });
      this.addEventButton.click(function() {
        return _this.onEventButtonClicked();
      });
      this.eventStart = this.popoverWidget.find('#inputStart');
      this.eventEnd = this.popoverWidget.find('#inputEnd');
      this.eventPlace = this.popoverWidget.find('#inputPlace');
      this.eventDescription = this.popoverWidget.find('#inputDesc');
      this.addEventButton.addClass('disabled');
      keyReaction = function(event) {
        if (_this.eventStart.val() === '' || _this.eventEnd.val() === '' || _this.eventDescription.val() === '') {
          return _this.addEventButton.addClass('disabled');
        } else if (event.keyCode === 13 || event.which === 13) {
          return _this.onEventButtonClicked();
        } else {
          return _this.addEventButton.removeClass('disabled');
        }
      };
      this.eventStart.keyup(keyReaction);
      this.eventEnd.keyup(keyReaction);
      return this.eventDescription.keyup(keyReaction);
    };

    EventPopOver.prototype.bindEditEvents = function() {
      var keyReaction,
        _this = this;

      this.popoverWidget = $('.container .popover');
      this.addEventButton = this.popoverWidget.find('button.add-event');
      this.closeButton = this.popoverWidget.find('button.close');
      this.removeButton = this.popoverWidget.find('.event-remove');
      this.eventStart = this.popoverWidget.find('#inputStart');
      this.eventEnd = this.popoverWidget.find('#inputEnd');
      this.eventPlace = this.popoverWidget.find('#inputPlace');
      this.eventDescription = this.popoverWidget.find('#inputDesc');
      this.addEventButton.html(this.action);
      this.closeButton.click(function() {
        return _this.clean();
      });
      this.addEventButton.click(function() {
        return _this.onEditEventClicked();
      });
      this.removeButton.click(function() {
        return _this.onRemoveEventClicked();
      });
      keyReaction = function(event) {
        if (_this.eventStart.val() === '' || _this.eventEnd.val() === '' || _this.eventDescription.val() === '') {
          return _this.addEventButton.addClass('disabled');
        } else if (event.keyCode === 13 || event.which === 13) {
          return _this.onEventButtonClicked();
        } else {
          return _this.addEventButton.removeClass('disabled');
        }
      };
      this.eventStart.keyup(keyReaction);
      this.eventEnd.keyup(keyReaction);
      return this.eventDescription.keyup(keyReaction);
    };

    EventPopOver.prototype.onRemoveEventClicked = function() {
      var evt,
        _this = this;

      evt = this.model.get(this.event.id);
      this.removeButton.css('width', '42px');
      this.removeButton.spin('tiny');
      return evt.destroy({
        success: function() {
          _this.cal.fullCalendar('removeEvents', _this.event.id);
          _this.removeButton.spin();
          _this.removeButton.css('width', '14px');
          return _this.clean();
        },
        error: function() {
          this.removeButton.spin();
          this.removeButton.css('width', '14px');
          this.clean();
          return this.clean();
        }
      });
    };

    EventPopOver.prototype.onEventButtonClicked = function() {
      var data, description, dueEndDate, dueStartDate, end, newDate, place, specifiedDay, specifiedTime, start,
        _this = this;

      if (this.addEventButton.hasClass('disabled')) {
        return;
      }
      start = $('.popover #inputStart').val();
      end = $('.popover #inputEnd').val();
      place = $('.popover #inputPlace').val();
      description = $('.popover #inputDesc').val();
      specifiedTime = start.split(':');
      dueStartDate = Date.create(this.date);
      dueStartDate.set({
        hours: specifiedTime[0],
        minutes: specifiedTime[1]
      });
      specifiedDay = end.split('+');
      specifiedTime = specifiedDay[0].split(':');
      if (specifiedDay[1] != null) {
        newDate = this.date.advance({
          days: specifiedDay[1]
        });
        dueEndDate = Date.create(newDate);
      } else {
        specifiedDay[1] = 0;
        dueEndDate = Date.create(this.date);
      }
      dueEndDate.set({
        hours: specifiedTime[0],
        minutes: specifiedTime[1]
      });
      data = {
        start: dueStartDate.format(Event.dateFormat),
        end: dueEndDate.format(Event.dateFormat),
        diff: parseInt(specifiedDay[1]),
        place: place,
        description: description
      };
      this.addEventButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      this.addEventButton.spin('tiny');
      return this.model.create(data, {
        wait: true,
        success: function() {
          _this.clean();
          _this.addEventButton.spin();
          return _this.addEventButton.html(_this.action);
        },
        error: function() {
          _this.clean();
          _this.addEventButton.spin();
          return _this.addEventButton.html(_this.action);
        }
      });
    };

    EventPopOver.prototype.onEditEventClicked = function() {
      var data, description, dueEndDate, dueStartDate, end, evt, newDate, place, specifiedDay, specifiedTime, start,
        _this = this;

      evt = this.model.get(this.event.id);
      start = $('.popover #inputStart').val();
      end = $('.popover #inputEnd').val();
      place = $('.popover #inputPlace').val();
      description = $('.popover #inputDesc').val();
      specifiedTime = start.split(':');
      dueStartDate = Date.create(this.date);
      dueStartDate.set({
        hours: specifiedTime[0],
        minutes: specifiedTime[1]
      });
      specifiedDay = end.split('+');
      specifiedTime = specifiedDay[0].split(':');
      if (specifiedDay[1] != null) {
        newDate = this.date.advance({
          days: specifiedDay[1]
        });
        dueEndDate = Date.create(newDate);
      } else {
        specifiedDay[1] = 0;
        dueEndDate = Date.create(this.date);
      }
      dueEndDate.set({
        hours: specifiedTime[0],
        minutes: specifiedTime[1]
      });
      data = {
        start: dueStartDate.format(Event.dateFormat),
        end: dueEndDate.format(Event.dateFormat),
        place: place,
        diff: parseInt(specifiedDay[1]),
        description: description
      };
      this.cal.fullCalendar('renderEvent', this.event);
      this.addEventButton.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      this.addEventButton.spin('tiny');
      return evt.save(data, {
        wait: true,
        success: function() {
          var endDate, startDate;

          _this.event.title = data.description;
          startDate = new Date(data.start);
          _this.event.start = startDate.format(Date.ISO8601_DATETIME);
          endDate = new Date(data.end);
          _this.event.end = endDate.format(Date.ISO8601_DATETIME);
          _this.event.diff = data.diff;
          _this.event.place = data.place;
          _this.cal.fullCalendar('renderEvent', _this.event);
          return _this.addEventButton.spin();
        },
        error: function() {
          this.cal.fullCalendar('renderEvent', this.event);
          return this.addEventButton.spin();
        }
      });
    };

    return EventPopOver;

  })(View);
  
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
        time: this.model.getFormattedDate('{MM}/{dd}/{yyyy} {HH}:{mm}'),
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
        start: this.model.getFormattedStartDate('{MM}/{dd}/{yyyy} {HH}:{mm}'),
        end: this.model.getFormattedEndDate('{MM}/{dd}/{yyyy} {HH}:{mm}'),
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
      'click button': 'onImportClicked'
    };

    ImportView.prototype.initialize = function() {};

    ImportView.prototype.template = function() {
      return require('./templates/import_view');
    };

    ImportView.prototype.afterRender = function() {
      this.alarmList = new AlarmList;
      this.alarmList.render();
      this.eventList = new EventList;
      return this.eventList.render();
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
      return $.ajax({
        url: "import/ical",
        type: "POST",
        data: form,
        processData: false,
        contentType: false,
        success: function(result) {
          var alarm, event, valarm, vevent, _i, _j, _len, _len1, _ref1, _ref2, _results;

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
            _results = [];
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
              vevent = _ref2[_j];
              event = new Event(vevent);
              _results.push(_this.eventList.collection.add(event));
            }
            return _results;
          }
        },
        error: function() {
          return alert('error');
        }
      });
    };

    return ImportView;

  })(View);
  
});
window.require.register("views/list_view", function(exports, require, module) {
  var Alarm, AlarmCollection, AlarmFormView, AlarmsListView, ListView, View, helpers, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  AlarmFormView = require('./alarmform_view');

  AlarmsListView = require('../views/alarms_list_view');

  AlarmCollection = require('../collections/alarms');

  Alarm = require('../models/alarm');

  helpers = require('../helpers');

  module.exports = ListView = (function(_super) {
    __extends(ListView, _super);

    function ListView() {
      _ref = ListView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ListView.prototype.el = '#viewContainer';

    ListView.prototype.events = {
      "click #add-alarm button.add-alarm": "onAddAlarmClicked",
      "click #alarms .alarms p .icon-pencil": "onEditAlarmClicked",
      "click #alarms .alarms p .icon-trash": "onRemoveAlarmClicked"
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
  buf.push('<p>' + escape((interp = time) == null ? '' : interp) + '\n' + escape((interp = description) == null ? '' : interp) + ' (' + escape((interp = action) == null ? '' : interp) + ')<i');
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
  buf.push('<div class="form-horizontal well"><div class="control-group"><input id="alarm-description-input" type="text" placeholder="What should I remind you ?" class="input-block-level"/></div><div class="form-inline"><select id="action" class="input-small">');
  // iterate actions
  ;(function(){
    if ('number' == typeof actions.length) {

      for (var action = 0, $$l = actions.length; action < $$l; action++) {
        var displayAction = actions[action];

  if ( action == defaultAction)
  {
  buf.push('<option');
  buf.push(attrs({ 'value':("" + (action) + ""), 'selected':(true) }, {"value":true,"selected":true}));
  buf.push('>' + escape((interp = displayAction) == null ? '' : interp) + '</option>');
  }
  else
  {
  buf.push('<option');
  buf.push(attrs({ 'value':("" + (action) + "") }, {"value":true}));
  buf.push('>' + escape((interp = displayAction) == null ? '' : interp) + '</option>');
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
  buf.push('>' + escape((interp = displayAction) == null ? '' : interp) + '</option>');
  }
  else
  {
  buf.push('<option');
  buf.push(attrs({ 'value':("" + (action) + "") }, {"value":true}));
  buf.push('>' + escape((interp = displayAction) == null ? '' : interp) + '</option>');
  }
      }

    }
  }).call(this);

  buf.push('</select><div id="date-control"><label for="inputDate">&nbsp;date:&nbsp;</label><div id="inputDate" class="input-append date"><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultDate) + ""), "class": ('span2') }, {"type":true,"value":true}));
  buf.push('/><span class="add-on"><i class="icon-th"></i></span></div><label for="inputTime">&nbsp;&nbsp;time:&nbsp;</label><div class="input-append bootstrap-timepicker"><input');
  buf.push(attrs({ 'id':("inputTime"), 'type':("text"), 'value':("" + (defaultTime) + ""), "class": ('input-small') }, {"id":true,"type":true,"value":true}));
  buf.push('/><span class="add-on"><i class="icon-time"></i></span></div></div></div><button class="btn pull-right add-alarm">add the alarm</button><div class="clearfix"></div></div>');
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
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValue) + ""), 'id':("inputDesc"), 'placeholder':("What do you want to be reminded ?"), "class": ('input-xlarge') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/><button class="btn pull-right add-alarm disabled">');
  if ( editionMode)
  {
  buf.push('Edit');
  }
  else
  {
  buf.push('Add');
  }
  buf.push('</button>');
  if (!( editionMode))
  {
  buf.push('<p>ie: 9:00 important meeting</p><button class="btn add-event">Create Event</button>');
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
  buf.push('<div class="container"><ul id="menu"><li><a href="#list" class="btn">Switch to List</a><a href="export/calendar.ics" target="_blank" class="btn"> <i class="icon-arrow-down icon-white"></i></a></li></ul><div id="alarms" class="well"></div></div>');
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
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValueStart) + ""), 'id':("inputStart"), 'placeholder':("From hours:minutes"), "class": ('input-small') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValueEnd) + ""), 'id':("inputEnd"), 'placeholder':("To hours:minutes+days"), "class": ('input-small') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/></div><div><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValuePlace) + ""), 'id':("inputPlace"), 'placeholder':("Place"), "class": ('input-small') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/><input');
  buf.push(attrs({ 'type':("text"), 'value':("" + (defaultValueDesc) + ""), 'id':("inputDesc"), 'placeholder':("Description"), "class": ('input') }, {"type":true,"value":true,"id":true,"placeholder":true}));
  buf.push('/><button class="btn add-event">');
  if ( editionMode)
  {
  buf.push('Edit');
  }
  else
  {
  buf.push('Create');
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
  buf.push('<div class="container"><ul id="menu"><li><a href="#list" class="btn">Switch to List</a><a href="#calendar" class="btn">Switch to Calendar</a><a href="export/calendar.ics" target="_blank" class="btn"> <i class="icon-arrow-down icon-white"></i></a></li></ul><div id="import-form" class="well"><h3>Icalendar importer</h3><div><button class="btn">import your icalendar file</button><input id="import-file-input" type="file"/></div><div></div><h4>Alarms to import</h4><div id="import-alarm-list"></div><h4>Events to import</h4><div id="import-event-list"></div></div></div>');
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
  buf.push('<div class="container"><ul id="menu"><li><a href="#calendar" class="btn">Switch to calendar</a><a href="export/calendar.ics" target="_blank" class="btn"> <i class="icon-arrow-down icon-white"></i></a></li></ul><div class="addform"><div id="add-alarm" class="container"></div></div><div id="alarms" class="well"></div></div>');
  }
  return buf.join("");
  };
});
