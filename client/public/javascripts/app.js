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

window.require.register("collections/alarms", function(exports, require, module) {
  var Alarm, CozyCollection, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CozyCollection = require('../lib/cozy_collection').CozyCollection;

  Alarm = require('../models/alarm').Alarm;

  exports.AlarmCollection = (function(_super) {
    __extends(AlarmCollection, _super);

    function AlarmCollection() {
      _ref = AlarmCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AlarmCollection.prototype.model = Alarm;

    AlarmCollection.prototype.comparator = function(alarm1, alarm2) {
      var d1, d2;

      d1 = alarm1.getStandardDate();
      d2 = alarm2.getStandardDate();
      if (d1.getTime() < d2.getTime()) {
        return -1;
      } else if (d1.getTime() === d2.getTime()) {
        return 0;
      } else {
        return 1;
      }
    };

    return AlarmCollection;

  })(CozyCollection);
  
});
window.require.register("collections/dayprograms", function(exports, require, module) {
  var CozyCollection, DayProgram, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CozyCollection = require('../lib/cozy_collection').CozyCollection;

  DayProgram = require('../models/dayprogram').DayProgram;

  exports.DayProgramCollection = (function(_super) {
    __extends(DayProgramCollection, _super);

    function DayProgramCollection() {
      _ref = DayProgramCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    DayProgramCollection.prototype.model = DayProgram;

    DayProgramCollection.prototype.comparator = function(dp1, dp2) {
      var d1, d2;

      d1 = dp1.getStandardDate();
      d2 = dp2.getStandardDate();
      if (d1.getTime() < d2.getTime()) {
        return -1;
      } else if (d1.getTime() === d2.getTime()) {
        return 0;
      } else {
        return 1;
      }
    };

    return DayProgramCollection;

  })(CozyCollection);
  
});
window.require.register("collections/reminders", function(exports, require, module) {
  var CozyCollection, Reminder, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CozyCollection = require('../lib/cozy_collection').CozyCollection;

  Reminder = require('../models/reminder').Reminder;

  exports.ReminderCollection = (function(_super) {
    __extends(ReminderCollection, _super);

    function ReminderCollection() {
      _ref = ReminderCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ReminderCollection.prototype.model = Reminder;

    ReminderCollection.prototype.url = 'reminders';

    return ReminderCollection;

  })(CozyCollection);
  
});
window.require.register("helpers", function(exports, require, module) {
  exports.formatDateICal = function(date) {
    var dueDate;

    date = date.split(/[-:]/);
    dueDate = ("" + date[0] + date[1] + date[2] + "T") + ("" + date[3] + date[4] + "00Z");
    return dueDate;
  };

  exports.icalDateToObject = function(date) {
    var formattedDate;

    date = date.split('T');
    formattedDate = {
      year: date[0].slice(0, 4),
      month: date[0].slice(4, 6),
      day: date[0].slice(6, 8),
      hour: date[1].slice(0, 2),
      minute: date[1].slice(2, 4)
    };
    return formattedDate;
  };

  exports.jsDateToDateObject = function(date) {
    var formattedDate;

    formattedDate = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes()
    };
    return formattedDate;
  };

  exports.buildStandardDate = function(dateObject) {
    if (!dateObject.hour) {
      dateObject.hour = "00";
    }
    if (!dateObject.minute) {
      dateObject.minute = "00";
    }
    return ("" + dateObject.year + "/" + dateObject.month + "/" + dateObject.day + " ") + ("" + dateObject.hour + ":" + dateObject.minute + ":00");
  };
  
});
window.require.register("initialize", function(exports, require, module) {
  var _ref, _ref1, _ref2, _ref3, _ref4;

  if ((_ref = this.CozyApp) == null) {
    this.CozyApp = {};
  }

  if ((_ref1 = CozyApp.Routers) == null) {
    CozyApp.Routers = {};
  }

  if ((_ref2 = CozyApp.Views) == null) {
    CozyApp.Views = {};
  }

  if ((_ref3 = CozyApp.Models) == null) {
    CozyApp.Models = {};
  }

  if ((_ref4 = CozyApp.Collections) == null) {
    CozyApp.Collections = {};
  }

  $(function() {
    var AppView;

    require('../lib/app_helpers');
    CozyApp.Views.appView = new (AppView = require('views/app_view'));
    CozyApp.Views.appView.render();
    return Backbone.history.start({
      pushState: true
    });
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
window.require.register("lib/cozy_collection", function(exports, require, module) {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  exports.CozyCollection = (function(_super) {
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
window.require.register("models/alarm", function(exports, require, module) {
  var helpers,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  helpers = require('../helpers');

  exports.Alarm = (function(_super) {
    __extends(Alarm, _super);

    function Alarm(attributes, options) {
      if ((attributes.reminderID != null) && (attributes.index != null)) {
        attributes.id = "" + attributes.reminderID + "#" + attributes.index;
      }
      Alarm.__super__.constructor.call(this, attributes, options);
    }

    Alarm.prototype.getDateObject = function() {
      return helpers.icalDateToObject(this.get('trigger'));
    };

    Alarm.prototype.getPreviousDateObject = function() {
      if (this.previous('trigger') != null) {
        return helpers.icalDateToObject(this.previous('trigger'));
      } else {
        return false;
      }
    };

    Alarm.prototype.getStandardDate = function() {
      return new Date(helpers.buildStandardDate(this.getDateObject()));
    };

    Alarm.prototype.getDateHash = function(date) {
      if (date == null) {
        date = this.getDateObject();
      }
      return "" + date.year + date.month + date.day;
    };

    Alarm.prototype.getPreviousDateHash = function() {
      var previousDateObject;

      previousDateObject = this.getPreviousDateObject();
      if (previousDateObject) {
        return this.getDateHash(previousDateObject);
      } else {
        return false;
      }
    };

    Alarm.prototype.getTimeHash = function(date) {
      if (date == null) {
        date = this.getDateObject();
      }
      return "" + date.year + date.month + date.day + date.hour + date.minute;
    };

    Alarm.prototype.getPreviousTimeHash = function() {
      var previousDateObject;

      previousDateObject = this.getPreviousDateObject();
      if (previousDateObject) {
        return this.getTimeHash(previousDateObject);
      } else {
        return false;
      }
    };

    return Alarm;

  })(Backbone.Model);
  
});
window.require.register("models/dayprogram", function(exports, require, module) {
  var helpers,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  helpers = require('../helpers');

  exports.DayProgram = (function(_super) {
    __extends(DayProgram, _super);

    function DayProgram(attributes, options) {
      this.alarms = attributes.alarms;
      delete attributes.alarms;
      DayProgram.__super__.constructor.call(this, attributes, options);
    }

    DayProgram.prototype.getStandardDate = function() {
      return new Date(helpers.buildStandardDate(this.get('date')));
    };

    return DayProgram;

  })(Backbone.Model);
  
});
window.require.register("models/reminder", function(exports, require, module) {
  var Alarm, AlarmCollection,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  AlarmCollection = require('../collections/alarms').AlarmCollection;

  Alarm = require('./alarm').Alarm;

  exports.Reminder = (function(_super) {
    __extends(Reminder, _super);

    function Reminder(attributes, options) {
      this.alarms = new AlarmCollection();
      Reminder.__super__.constructor.call(this, attributes, options);
    }

    Reminder.prototype.set = function(key, val, options) {
      var alarm, alarmList, index, reminderID, _i, _len;

      if (key === 'alarms' || ((key != null) && (key.alarms != null))) {
        if (key === 'alarms') {
          alarmList = val;
        } else {
          alarmList = key.alarms;
        }
        for (index = _i = 0, _len = alarmList.length; _i < _len; index = ++_i) {
          alarm = alarmList[index];
          reminderID = this.get('id');
          alarm.index = index;
          if (reminderID != null) {
            alarm.reminderID = reminderID;
          }
        }
        this.alarms.reset(alarmList);
      }
      return Reminder.__super__.set.call(this, key, val, options);
    };

    Reminder.prototype.parse = function(response, options) {
      var alarm, index, _i, _len, _ref;

      if (response.alarms != null) {
        _ref = response.alarms;
        for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
          alarm = _ref[index];
          alarm.reminderID = response.id;
          alarm.index = index;
        }
        this.alarms.reset(response.alarms);
      }
      return Reminder.__super__.parse.call(this, response, options);
    };

    return Reminder;

  })(Backbone.Model);
  
});
window.require.register("routers/app_router", function(exports, require, module) {
  var AppRouter, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = AppRouter = (function(_super) {
    __extends(AppRouter, _super);

    function AppRouter() {
      _ref = AppRouter.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AppRouter.prototype.routes = {
      '': function() {}
    };

    return AppRouter;

  })(Backbone.Router);
  
});
window.require.register("views/addalarmform_view", function(exports, require, module) {
  var AddAlarmFormView, View, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  module.exports = AddAlarmFormView = (function(_super) {
    __extends(AddAlarmFormView, _super);

    function AddAlarmFormView() {
      _ref = AddAlarmFormView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AddAlarmFormView.prototype.tagName = 'div';

    AddAlarmFormView.prototype.className = 'control-group';

    AddAlarmFormView.prototype.render = function(options) {
      var formattedDateObject;

      formattedDateObject = this.getFormattedDateObject(options.defaultDateObject);
      return AddAlarmFormView.__super__.render.call(this, {
        id: this.getIndex(),
        actions: options.actions,
        defaultAction: options.defaultAction,
        defaultDate: formattedDateObject.date,
        defaultTime: formattedDateObject.time
      });
    };

    AddAlarmFormView.prototype.template = function() {
      return require('./templates/addreminder_alarm_form');
    };

    AddAlarmFormView.prototype.getIndex = function() {
      return this.id.replace('alarm-', '');
    };

    AddAlarmFormView.prototype.getFormattedDateObject = function(dateObject) {
      var formattedDateObject;

      if (dateObject.month <= 9 && ("" + dateObject.month).length === 1) {
        dateObject.month = "0" + dateObject.month;
      }
      if (dateObject.day <= 9 && ("" + dateObject.day).length === 1) {
        dateObject.day = "0" + dateObject.day;
      }
      if (dateObject.hour <= 9 && ("" + dateObject.hour).length === 1) {
        dateObject.hour = "0" + dateObject.hour;
      }
      if (dateObject.minute <= 9 && ("" + dateObject.minute).length === 1) {
        dateObject.minute = "0" + dateObject.minute;
      }
      return formattedDateObject = {
        date: "" + dateObject.year + "-" + dateObject.month + "-" + dateObject.day,
        time: "" + dateObject.hour + ":" + dateObject.minute
      };
    };

    return AddAlarmFormView;

  })(View);
  
});
window.require.register("views/addreminderform_view", function(exports, require, module) {
  var AddAlarmFormView, AddReminderFormView, View, helpers,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  AddAlarmFormView = require('./addalarmform_view');

  helpers = require('../helpers');

  module.exports = AddReminderFormView = (function(_super) {
    __extends(AddReminderFormView, _super);

    AddReminderFormView.prototype.el = '#add-reminder';

    AddReminderFormView.prototype.events = {
      'focus #inputDesc': 'onFocus',
      'blur #inputDesc': 'onBlur',
      'keyup #inputDesc': 'onKeydown',
      'click .add-alarm': 'onAddAlarm',
      'click .remove-alarm': 'onRemoveAlarm'
    };

    function AddReminderFormView(options) {
      AddReminderFormView.__super__.constructor.call(this, options);
      this.alarmViews = new Array();
    }

    AddReminderFormView.prototype.initialize = function() {
      this.actions = {
        'DISPLAY': 'Popup',
        'EMAIL': 'Email'
      };
      this.data = null;
      return this.editionMode = false;
    };

    AddReminderFormView.prototype.render = function() {
      var content;

      content = AddReminderFormView.__super__.render.call(this);
      this.$el.append(content);
      this.defaultMinHeight = this.$el.height();
      this.$el.affix({
        offset: {
          top: this.$el.offset().top - 10
        }
      });
      this.alarmListView = this.$('#add-alarms');
      this.renderAlarm(this.getDefaultAction());
      return this.collapse();
    };

    AddReminderFormView.prototype.template = function() {
      return require('./templates/addreminder_form');
    };

    AddReminderFormView.prototype.collapse = function() {
      var _this = this;

      if (!this.$el.hasClass('affix')) {
        this.$el.parent().css('min-height', this.defaultMinHeight);
      }
      return this.alarmListView.hide('slow', function() {
        if (_this.$el.hasClass('affix')) {
          return _this.$el.parent().css('min-height', _this.defaultMinHeight);
        }
      });
    };

    AddReminderFormView.prototype.expand = function() {
      var _this = this;

      return this.alarmListView.show('slow', function() {
        return _this.$el.parent().css('min-height', _this.$el.height());
      });
    };

    AddReminderFormView.prototype.onAddAlarm = function(event) {
      return this.renderAlarm(this.getDefaultAction());
    };

    AddReminderFormView.prototype.getDefaultAction = function(defaultAction) {
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

    AddReminderFormView.prototype.onRemoveAlarm = function(event) {
      var alarm, i, index, item, oldID, _ref, _results;

      alarm = $(event.currentTarget).parent().parent();
      index = alarm.prop('id').replace('alarm-', '');
      this.alarmViews.splice(index, 1);
      alarm.remove();
      _ref = this.alarmViews;
      _results = [];
      for (i in _ref) {
        item = _ref[i];
        oldID = item.getIndex();
        item.id = "alarm-" + i;
        item.$el.prop('id', item.id);
        item.$('select').prop('id', "action" + i);
        item.$("label[for='inputDate" + oldID + "']").prop('for', "inputDate" + i);
        item.$("#inputDate" + oldID).prop('id', "inputDate" + i);
        item.$("label[for=\"inputTime" + oldID + "\"]").prop('for', "inputTime" + i);
        _results.push(item.$("#inputTime" + oldID).prop('id', "inputTime" + i));
      }
      return _results;
    };

    AddReminderFormView.prototype.onFocus = function() {
      return this.expand();
    };

    AddReminderFormView.prototype.onBlur = function() {
      if (this.$('#inputDesc').val() === '') {
        return this.collapse();
      }
    };

    AddReminderFormView.prototype.onKeydown = function(event) {
      if ($(event.target).val() === '') {
        return this.disableSubmitButton();
      } else {
        return this.enableSubmitButton();
      }
    };

    AddReminderFormView.prototype.enableSubmitButton = function() {
      return $('.add-reminder').removeClass('disabled');
    };

    AddReminderFormView.prototype.disableSubmitButton = function() {
      return $('.add-reminder').addClass('disabled');
    };

    AddReminderFormView.prototype.loadReminderData = function(reminder) {
      var _this = this;

      this.resetForm(false);
      this.$('#inputDesc').val(reminder.get('description'));
      this.data = reminder;
      this.editionMode = true;
      this.$('button.add-reminder').html('Edit the reminder');
      reminder.alarms.forEach(function(item) {
        return _this.renderAlarm(item.get('action'), item.getDateObject());
      });
      this.enableSubmitButton();
      return this.expand();
    };

    AddReminderFormView.prototype.resetForm = function(setNewAlarm) {
      if (setNewAlarm == null) {
        setNewAlarm = true;
      }
      this.data = null;
      this.editionMode = false;
      this.$('button.add-reminder').html('Add the reminder');
      this.disableSubmitButton();
      this.$('input').val('');
      this.alarmListView.empty();
      this.alarmViews = new Array();
      if (setNewAlarm) {
        return this.renderAlarm(this.getDefaultAction());
      }
    };

    AddReminderFormView.prototype.renderAlarm = function(defaultAction, dateObject) {
      var alarmView, button, newIndex, options, render;

      button = this.$('.add-alarm');
      button.removeClass('add-alarm').addClass('remove-alarm');
      button.find('i').removeClass('icon-plus').addClass('icon-minus');
      newIndex = this.alarmViews.length;
      alarmView = new AddAlarmFormView({
        id: "alarm-" + newIndex
      });
      this.alarmViews.push(alarmView);
      if (dateObject == null) {
        dateObject = helpers.jsDateToDateObject(new Date());
      }
      options = {
        defaultAction: defaultAction,
        defaultDateObject: dateObject,
        actions: this.actions
      };
      render = alarmView.render(options).$el;
      return this.alarmListView.append(render);
    };

    return AddReminderFormView;

  })(View);
  
});
window.require.register("views/app_view", function(exports, require, module) {
  var AddReminderFormView, Alarm, AlarmCollection, AppRouter, AppView, Reminder, ReminderCollection, RemindersView, View, helpers, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  AppRouter = require('../routers/app_router');

  RemindersView = require('./reminders_view');

  AddReminderFormView = require('./addreminderform_view');

  ReminderCollection = require('../collections/reminders').ReminderCollection;

  Reminder = require('../models/reminder').Reminder;

  AlarmCollection = require('../collections/alarms').AlarmCollection;

  Alarm = require('../models/alarm').Alarm;

  helpers = require('../helpers');

  module.exports = AppView = (function(_super) {
    __extends(AppView, _super);

    function AppView() {
      _ref = AppView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AppView.prototype.el = 'body.application';

    AppView.prototype.events = {
      "click #add-reminder button.add-reminder": "onAddReminderClicked",
      "click #reminders .alarms p .icon-pencil": "onEditReminderClicked"
    };

    AppView.prototype.template = function() {
      return require('./templates/home');
    };

    AppView.prototype.initialize = function() {
      this.router = CozyApp.Routers.AppRouter = new AppRouter();
      return this.reminders = new ReminderCollection();
    };

    AppView.prototype.afterRender = function() {
      this.addReminderFormView = new AddReminderFormView();
      this.addReminderFormView.render();
      this.remindersView = new RemindersView({
        appModel: this.reminders
      });
      return this.reminders.fetch({
        success: function(collection, response, options) {
          return console.log("Fetch: success");
        },
        error: function() {
          return console.log("Fetch: error");
        }
      });
    };

    AppView.prototype.onAddReminderClicked = function(event, callback) {
      var alarm, alarmCollection, alarmView, date, description, dueDate, id, reminder, time, _i, _len, _ref1,
        _this = this;

      description = this.$('#inputDesc').val();
      if ((description == null) || description === '') {
        return;
      }
      alarmCollection = new AlarmCollection();
      _ref1 = this.addReminderFormView.alarmViews;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        alarmView = _ref1[_i];
        id = alarmView.getIndex();
        date = alarmView.$("#inputDate" + id).val();
        time = alarmView.$("#inputTime" + id).val();
        dueDate = helpers.formatDateICal("" + date + ":" + time);
        alarm = new Alarm({
          action: alarmView.$("#action" + id).val(),
          trigger: dueDate,
          description: "Please, remind: " + description
        });
        alarmCollection.add(alarm);
      }
      if (this.addReminderFormView.editionMode) {
        reminder = this.addReminderFormView.data;
        return reminder.save({
          description: description,
          alarms: alarmCollection.toJSON()
        }, {
          wait: true,
          success: function() {
            _this.addReminderFormView.resetForm();
            _this.addReminderFormView.collapse();
            return console.log("Save: success (attributes updated)");
          },
          error: function() {
            return console.log("Error during reminder save.");
          }
        });
      } else {
        return this.reminders.create({
          description: description,
          alarms: alarmCollection.toJSON()
        }, {
          wait: true,
          success: function(model, response) {
            _this.addReminderFormView.resetForm();
            _this.addRemidnerFormView.collapse();
            return console.log('Create reminder: success');
          },
          error: function(error, xhr, options) {
            error = JSON.parse(xhr.responseText);
            return console.log("Create reminder: error: " + (error != null ? error.msg : void 0));
          }
        });
      }
    };

    AppView.prototype.onEditReminderClicked = function(event) {
      var reminder, reminderID;

      reminderID = $(event.target).data('reminderid');
      reminder = this.reminders.get(reminderID);
      return this.addReminderFormView.loadReminderData(reminder);
    };

    return AppView;

  })(View);
  
});
window.require.register("views/dayprogram_view", function(exports, require, module) {
  var AlarmCollection, DayProgramView, ReminderView, View, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  ReminderView = require('./reminder_view');

  AlarmCollection = require('../collections/alarms').AlarmCollection;

  module.exports = DayProgramView = (function(_super) {
    __extends(DayProgramView, _super);

    function DayProgramView() {
      _ref = DayProgramView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    DayProgramView.prototype.tagName = 'div';

    DayProgramView.prototype.className = 'dayprogram';

    DayProgramView.prototype.initialize = function() {
      this.listenTo(this.model.alarms, "add", this.onAdd);
      this.listenTo(this.model.alarms, "change", this.onChange);
      this.listenTo(this.model.alarms, "remove", this.onRemove);
      return this.views = {};
    };

    DayProgramView.prototype.onAdd = function(alarm, alarms) {
      var id, index;

      index = alarms.indexOf(alarm);
      id = alarm.get('reminderID') + alarm.getTimeHash();
      return this.getReminderView(id, index).model.add(alarm);
    };

    DayProgramView.prototype.getReminderView = function(id, index) {
      var alarmsOnSameObject, rView, render, selector;

      if (index == null) {
        index = 0;
      }
      if (this.views[id] == null) {
        alarmsOnSameObject = new AlarmCollection();
        rView = new ReminderView({
          id: id,
          model: alarmsOnSameObject
        });
        this.views[id] = rView;
        render = rView.render().$el;
        if (index === 0) {
          this.$el.find('.alarms').prepend(render);
        } else if (index === this.model.alarms.length - 1) {
          this.$el.find('.alarms').append(render);
        } else {
          selector = ".alarms ." + rView.className + ":nth-of-type(" + index + ")";
          this.$el.find(selector).before(render);
        }
      } else {
        rView = this.views[id];
      }
      return rView;
    };

    DayProgramView.prototype.onChange = function(alarm, options) {
      var alarmToUpdate, id, index, oldID;

      if (alarm.previous('trigger') === alarm.get('trigger')) {
        id = alarm.get('reminderID') + alarm.getTimeHash();
        alarmToUpdate = this.views[id].model.get(alarm.get('id'));
        return alarmToUpdate.set(alarm.toJSON());
      } else {
        id = alarm.get('reminderID') + alarm.getTimeHash();
        index = this.model.alarms.indexOf(alarm);
        this.getReminderView(id, index).model.add(alarm);
        oldID = alarm.get('reminderID') + alarm.getTimeHash(alarm.getPreviousDateObject());
        return this.getReminderView(oldID).remove(alarm);
      }
    };

    DayProgramView.prototype.onRemove = function(alarm, collection, options) {
      var id, rView;

      if (this.model.alarms.length === 0) {
        return this.destroy();
      } else {
        id = alarm.get('reminderID') + alarm.getTimeHash();
        rView = this.getReminderView(id);
        rView.model.remove(alarm);
        if (rView.model.length === 0) {
          return delete this.views[id];
        }
      }
    };

    DayProgramView.prototype.render = function() {
      return DayProgramView.__super__.render.call(this, {
        date: this.model.get('date')
      });
    };

    DayProgramView.prototype.template = function() {
      return require('./templates/dayprogram');
    };

    return DayProgramView;

  })(View);
  
});
window.require.register("views/reminder_view", function(exports, require, module) {
  var ReminderView, View, helpers, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  helpers = require('../helpers');

  /*
  A reminder can hold mulitple alarm objects. It happens when there is
  mulitple alarms at the same day for the same object.
  Basically only the "action" would chance (mail, popup, ...) so we want
  to display the information in a single block.
  */


  module.exports = ReminderView = (function(_super) {
    __extends(ReminderView, _super);

    function ReminderView() {
      _ref = ReminderView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ReminderView.prototype.tagName = 'div';

    ReminderView.prototype.className = 'reminder';

    ReminderView.prototype.events = {
      'hover': 'onMouseOver'
    };

    ReminderView.prototype.initialize = function() {
      this.listenTo(this.model, 'add', this.render);
      this.listenTo(this.model, 'change', this.render);
      return this.listenTo(this.model, 'remove', this.onRemove);
    };

    ReminderView.prototype.onRemove = function() {
      if (this.model.length === 0) {
        return this.destroy();
      } else {
        return this.render();
      }
    };

    ReminderView.prototype.render = function() {
      if (this.model.length === 0) {
        return this;
      } else {
        return ReminderView.__super__.render.call(this, {
          actions: this.model.pluck('action'),
          date: this.getDataModel().getDateObject(),
          description: this.getDataModel().get('description'),
          reminderID: this.getDataModel().get('reminderID'),
          dateHash: this.getDataModel().getDateHash(),
          alarmIDs: this.model.pluck('index')
        });
      }
    };

    ReminderView.prototype.template = function() {
      return require('./templates/reminder');
    };

    ReminderView.prototype.getDataModel = function() {
      return this.model.at(0);
    };

    ReminderView.prototype.onMouseOver = function(event) {
      if (event.type === 'mouseenter') {
        return this.$('i').css('display', 'inline-block');
      } else {
        return this.$('i').hide();
      }
    };

    return ReminderView;

  })(View);
  
});
window.require.register("views/reminders_view", function(exports, require, module) {
  var Alarm, AlarmCollection, DayProgram, DayProgramCollection, DayProgramView, RemindersView, View,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('../lib/view');

  DayProgramView = require('./dayprogram_view');

  AlarmCollection = require('../collections/alarms').AlarmCollection;

  Alarm = require('../models/alarm').Alarm;

  DayProgramCollection = require('../collections/dayprograms').DayProgramCollection;

  DayProgram = require('../models/dayprogram').DayProgram;

  module.exports = RemindersView = (function(_super) {
    __extends(RemindersView, _super);

    RemindersView.prototype.el = '#reminders';

    RemindersView.prototype.events = {
      "click .alarms p .icon-trash": "onTrashReminderClicked"
    };

    function RemindersView(options) {
      this.onReset = __bind(this.onReset, this);    this.appModel = options.appModel;
      options.model = new DayProgramCollection();
      this.alarmsToDelete = {};
      RemindersView.__super__.constructor.call(this, options);
    }

    RemindersView.prototype.initialize = function() {
      this.listenTo(this.appModel, "add", this.onAdd);
      this.listenTo(this.appModel, "change", this.onChange);
      this.listenTo(this.appModel, "reset", this.onReset);
      this.listenTo(this.model, 'add', this.onAddDayProgram);
      this.listenTo(this.model, 'remove', this.onRemoveDayProgram);
      return this.views = {};
    };

    /*
     We map the model persisted in the database to a custom model
     in the application in order to:
       * persist in the iCal format
       * have a proper architecture in the app without being constraint by the
         standard format
    */


    RemindersView.prototype.onAdd = function(reminder) {
      var _this = this;

      return reminder.alarms.forEach(function(alarm) {
        var dateHash, dayProgram, dayProgramAlarms;

        dateHash = alarm.getDateHash();
        dayProgram = _this.model.findWhere({
          dateHash: dateHash
        });
        if (dayProgram == null) {
          dayProgramAlarms = new AlarmCollection();
          _this.model.add(new DayProgram({
            date: alarm.getDateObject(),
            dateHash: dateHash,
            alarms: dayProgramAlarms
          }));
        } else {
          dayProgramAlarms = dayProgram.alarms;
        }
        return dayProgramAlarms.add(alarm);
      });
    };

    RemindersView.prototype.onAddDayProgram = function(dayProgram, programs) {
      var dpView, index, render, selector;

      index = programs.indexOf(dayProgram);
      dpView = new DayProgramView({
        id: dayProgram.get('dateHash'),
        model: dayProgram
      });
      this.views[dpView.id] = dpView;
      render = dpView.render().$el;
      if (index === 0) {
        return this.$el.prepend(render);
      } else if (index === programs.length - 1) {
        return this.$el.append(render);
      } else {
        selector = "." + dpView.className + ":nth-of-type(" + index + ")";
        return this.$el.find(selector).before(render);
      }
    };

    RemindersView.prototype.onRemoveDayProgram = function(dayProgram, collection, options) {
      if (collection.length === 0) {
        return delete this.views[dayProgram.get('dateHash')];
      }
    };

    RemindersView.prototype.onChange = function(reminder) {
      var oldAlarmCollection,
        _this = this;

      oldAlarmCollection = new AlarmCollection();
      oldAlarmCollection.reset(reminder.previous('alarms'));
      oldAlarmCollection.forEach(function(item) {
        var dayProgramModel;

        dayProgramModel = _this.views[item.getDateHash()].model;
        dayProgramModel.alarms.remove(item);
        if (dayProgramModel.alarms.length === 0) {
          return _this.model.remove(dayProgramModel);
        }
      });
      return reminder.alarms.forEach(function(alarm, index) {
        var alarmToUpdate, dateHash, dayProgram, dayProgramAlarms;

        dateHash = alarm.getDateHash();
        dayProgram = _this.model.findWhere({
          dateHash: dateHash
        });
        if (dayProgram == null) {
          dayProgramAlarms = new AlarmCollection();
          _this.model.add(new DayProgram({
            date: alarm.getDateObject(),
            dateHash: dateHash,
            alarms: dayProgramAlarms
          }));
        } else {
          dayProgramAlarms = dayProgram.alarms;
        }
        alarmToUpdate = dayProgramAlarms.findWhere({
          id: alarm.get('id')
        });
        if (alarmToUpdate != null) {
          return alarmToUpdate.set(alarm.toJSON());
        } else {
          return dayProgramAlarms.add(alarm);
        }
      });
    };

    RemindersView.prototype.reRender = function() {
      var _this = this;

      this.$el.empty();
      this.views = {};
      this.model.reset();
      return this.appModel.forEach(function(reminder) {
        return _this.onAdd(reminder);
      });
    };

    RemindersView.prototype.onTrashReminderClicked = function(event) {
      var alarmIDs, reminder, reminderID,
        _this = this;

      reminderID = $(event.target).data('reminderid');
      alarmIDs = ($(event.target).data('alarmids') + "").split(',');
      reminder = this.appModel.get(reminderID);
      alarmIDs.forEach(function(item) {
        var alarmID;

        alarmID = "" + reminderID + "#" + item;
        return reminder.alarms.remove(alarmID);
      });
      return reminder.save({
        alarms: reminder.alarms.toJSON()
      }, {
        wait: true,
        success: function(model, response) {
          return console.log('Save: success (alarm removed)');
        }
      });
    };

    RemindersView.prototype.onReset = function(event) {
      return console.log("collection reset");
    };

    return RemindersView;

  })(View);
  
});
window.require.register("views/templates/addreminder_alarm_form", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="controls form-inline"><select');
  buf.push(attrs({ 'id':("action" + (id) + ""), "class": ('input-small') }, {"id":true}));
  buf.push('>');
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

  buf.push('</select><label');
  buf.push(attrs({ 'for':("inputDate" + (id) + "") }, {"for":true}));
  buf.push('>&nbsp;Date&nbsp;</label><input');
  buf.push(attrs({ 'type':("date"), 'id':("inputDate" + (id) + ""), 'value':("" + (defaultDate) + "") }, {"type":true,"id":true,"value":true}));
  buf.push('/><label');
  buf.push(attrs({ 'for':("inputTime" + (id) + "") }, {"for":true}));
  buf.push('>&nbsp;&nbsp;Time&nbsp;</label><input');
  buf.push(attrs({ 'type':("time"), 'id':("inputTime" + (id) + ""), 'value':("" + (defaultTime) + "") }, {"type":true,"id":true,"value":true}));
  buf.push('/><button class="btn add-alarm"><i class="icon-plus"></i></button></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/addreminder_form", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="form-horizontal well"><div class="control-group"><label for="inputDesc" class="control-label">Description</label><div class="controls"><input type="text" id="inputDesc" placeholder="What should I remind you ?" class="input-block-level"/></div></div><div id="add-alarms"></div><button class="btn pull-right disabled add-reminder">Add the reminder</button><div class="clearfix"></div></div>');
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
  buf.push('<h2>' + escape((interp = date.day) == null ? '' : interp) + '/' + escape((interp = date.month) == null ? '' : interp) + '/' + escape((interp = date.year) == null ? '' : interp) + '</h2><div class="alarms"></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/home", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<div class="container"><h1>My Reminders</h1><div class="addform"><div id="add-reminder"></div></div><div id="reminders" class="well"></div></div>');
  }
  return buf.join("");
  };
});
window.require.register("views/templates/reminder", function(exports, require, module) {
  module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
  attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
  var buf = [];
  with (locals || {}) {
  var interp;
  buf.push('<p>' + escape((interp = date.hour) == null ? '' : interp) + ':' + escape((interp = date.minute) == null ? '' : interp) + '\n' + escape((interp = description) == null ? '' : interp) + ' (' + escape((interp = actions) == null ? '' : interp) + ')<i');
  buf.push(attrs({ 'data-reminderid':("" + (reminderID) + ""), "class": ('icon-pencil') }, {"data-reminderid":true}));
  buf.push('></i><i');
  buf.push(attrs({ 'data-reminderid':("" + (reminderID) + ""), 'data-alarmids':("" + (alarmIDs) + ""), 'data-datehash':("" + (dateHash) + ""), "class": ('icon-trash') }, {"data-reminderid":true,"data-alarmids":true,"data-datehash":true}));
  buf.push('></i></p>');
  }
  return buf.join("");
  };
});
