describe 'validation', ->

    Event = require 'models/event'
    Alarm = require 'models/Alarm'

    validEventFixture =
        description: 'Something'
        start: '20141007T1000Z'
        end: '20141007T1100Z'

    describe "When a valid event is validated", ->

        before ->
            event = new Event()
            @errors = event.validate validEventFixture

        it "shouldn't return any error", ->
            expect(errors).to.be.null

    describe 'When an event with empty description is validated', ->

        before ->
            validEventFixture.description = ''
            event = new Event()
            @errors = event.validate validEventFixture

        it "shouldn't return any error (non regression #121)", ->
            expect(errors).to.be.null

    describe "When an event with invalid start date is validated", ->
        it "should return an error"

    describe "When an event with invalid end date is validated", ->
        it "should return an error"

    describe "When an event with an end date anterior to start date is validated", ->
        it "should return an error"


