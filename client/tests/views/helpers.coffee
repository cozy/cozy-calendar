describe 'helpers', ->

    helpers = require 'helpers'

    fixtures =
        invalidDates: [
            '15/04/20#09:40',
            '15/2013#09:40',
            'azdza#09:40',
            '#09:40',
            '1//#09:40'
        ]
        invalidTimes: [
            '15/04/2013#'
            '15/04/2013#3:1',
            '15/04/2013#3:13',
            '15/04/2013#31:',
            '15/04/2013#:'
        ]
        invalidICal: [
            '20130415094000Z',
            '20130415T094000',
            '20130415094000'
        ]
        invalidICalDates: [
            'undefinedT094000Z',
            '201415T094000Z'
        ]
        invalidICalTimes: [
            '20130415T0940Z',
            '20130415TundefinedZ',
            '20130415TZ'
        ]

    describe '.formatDateICal', ->

        it 'should return a valid ical full date if the input is correct', ->
            given = '15/04/2013#09:40'
            expected = '20130415T094000Z'
            expect(helpers.formatDateICal given).to.equal expected

        it 'should return an undefined date part if the date is incorrect', ->
            expected = 'undefinedT094000Z'
            fixtures.invalidDates.forEach (item) ->
                expect(helpers.formatDateICal item).to.equal(expected)

        it 'should return an undefined time part if the time is incorrect', ->
            expected = '20130415TundefinedZ'
            fixtures.invalidTimes.forEach (item) ->
                expect(helpers.formatDateICal item).to.equal(expected)

    describe '.isICalDateValid', ->

        it 'should be true if the input is valid', ->
            given = '20130415T094000Z'
            expect(helpers.isICalDateValid given).to.equal true

        it 'should be false if the input is invalid', ->
            fxtr = fixtures.invalidICal
                    .concat(fixtures.invalidICalDates
                    .concat (fixtures.invalidICalTimes))
            fxtr.forEach (item) ->
                expect(helpers.isICalDateValid item).to.equal(false)

    describe '.isDatePartValid', ->

        it 'should be true if the date part is valid', ->
            fixtures.invalidICalTimes.forEach (item) ->
                expect(helpers.isDatePartValid item).to.equal(true)

        it 'should be false if the date part is not valid', ->

            fixtures.invalidICalDates.forEach (item) ->
                expect(helpers.isDatePartValid item).to.equal(false)

    describe '.isTimePartvalid', ->

        it 'should be true if the time part is valid', ->
            fixtures.invalidICalDates.forEach (item) ->
                expect(helpers.isTimePartValid item).to.equal(true)

        it 'should be false if the time part is not valid', ->
            fixtures.invalidICalTimes.forEach (item) ->
                expect(helpers.isTimePartValid item).to.equal(false)

    describe '.icalToISO8601', ->

        it 'should return a valid full date', ->
            given = '20130415T094000Z'
            expected = '2013-04-15T09:40'
            expect(helpers.icalToISO8601 given).to.equal expected