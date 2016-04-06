async = require 'async'
moment = require 'moment'
should = require 'should'

Event = require '../server/models/event'
helpers = require './helpers'


describe "Events model", ->

    describe "load", ->

        before helpers.cleanDb
        before (done) ->
            events = [
                description: "Title 1"
                start: "2013-04-15T15:30:00.000Z"
                end: "2013-04-15T16:30:00.000Z"
                place: "place"
            ,
                description: "Title 2"
                start: "2012-07-15T15:30:00.000Z"
                end: "2011-04-15T16:30:00.000Z"
                place: "place"
            ,
                description: "Title 3"
                start: "2013-04-16T15:30:00.000Z"
                end: "2013-05-15T16:30:00.000Z"
                place: "place"
            ,
                description: "Title 4"
                start: "2015-05-15T15:30:00.000Z"
                end: "2015-05-15T16:30:00.000Z"
                place: "place"
            ]

            async.eachSeries events, (event, next) ->
                Event.create event, next
            , done

        it "returns events for dates: 21030401 - 20130501", (done) ->
            start = moment('201304', 'YYYYMM')
            end = start.clone().add 'months', 1
            Event.load start, end, (err, events) =>
                events.length.should.equal 2
                events[0].description.should.equal 'Title 1'
                events[1].description.should.equal 'Title 3'
                done()

        it "returns events for dates: 21030401 - 20160401", (done) ->
            start = moment('201304', 'YYYYMM')
            end = start.clone().add 'years', 3
            Event.load start, end, (err, events) =>
                events.length.should.equal 3
                events[0].description.should.equal 'Title 1'
                events[1].description.should.equal 'Title 3'
                events[2].description.should.equal 'Title 4'
                done()

        it "returns no events for dates: 21010401 - 20120401", (done) ->
            start = moment('201304', 'YYYYMM').subtract 'years', 2
            end = start.clone().add 'years', 1
            Event.load start, end, (err, events) =>
                events.length.should.equal 0
                done()

