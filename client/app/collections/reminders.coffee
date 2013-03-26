{CozyCollection} = require '../lib/cozy_collection'
{Reminder} = require '../models/reminder'

class exports.ReminderCollection extends CozyCollection

    model: Reminder
    url: '/reminders'