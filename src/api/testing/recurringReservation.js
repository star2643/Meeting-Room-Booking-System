// required module
const { expect } = require("chai");

// test the rrule utility
const rruleUtil = require("./../utilities/rrule.js");

describe('test rrule utility functions', () => {

    it("validateRRule should return true for valid RRULE", () => {
        const valid = rruleUtil.validateRRule("FREQ=WEEKLY;BYDAY=WE;UNTIL=20260630");
        expect(valid).to.equal(true);
    });

    it("validateRRule should return false for invalid RRULE", () => {
        const invalid = rruleUtil.validateRRule("INVALID_RRULE");
        expect(invalid).to.equal(false);
    });

    it("createWeeklyRRule should generate correct RRULE with UNTIL", () => {
        const rrule = rruleUtil.createWeeklyRRule("WE", "20260630", null);
        expect(rrule).to.equal("FREQ=WEEKLY;BYDAY=WE;UNTIL=20260630");
    });

    it("createWeeklyRRule should generate correct RRULE with COUNT", () => {
        const rrule = rruleUtil.createWeeklyRRule("MO", null, 10);
        expect(rrule).to.equal("FREQ=WEEKLY;BYDAY=MO;COUNT=10");
    });

    it("getWeekdayFromDate should return correct weekday abbreviation", () => {
        // 2026-01-26 is Monday
        const date = new Date(2026, 0, 26);
        const weekday = rruleUtil.getWeekdayFromDate(date);
        expect(weekday).to.equal("MO");
    });

    it("formatDate should return YYYY-MM-DD format", () => {
        const date = new Date(2026, 5, 30);
        const formatted = rruleUtil.formatDate(date);
        expect(formatted).to.equal("2026-06-30");
    });

    it("formatDateForRRule should return YYYYMMDD format", () => {
        const date = new Date(2026, 5, 30);
        const formatted = rruleUtil.formatDateForRRule(date);
        expect(formatted).to.equal("20260630");
    });

    it("expandRRule should return array of dates", () => {
        const dtstart = new Date(2026, 0, 7); // Wednesday, Jan 7, 2026
        const dates = rruleUtil.expandRRule("FREQ=WEEKLY;BYDAY=WE;COUNT=3", dtstart);
        expect(dates).to.be.an("array");
        expect(dates.length).to.equal(3);
    });

    it("expandRRule should return empty array for invalid RRULE", () => {
        const dtstart = new Date();
        const dates = rruleUtil.expandRRule("INVALID", dtstart);
        expect(dates).to.be.an("array");
        expect(dates.length).to.equal(0);
    });

});

// test the recurringSeries model
const RecurringSeries = require("./../model/recurringSeries.js");

describe('test recurringSeries model CRUD operations', () => {
    let testSeriesId = null;

    it("create should return series_id for valid data", async () => {
        const seriesId = await RecurringSeries.create(
            "admin",
            1,
            "Test Recurring Meeting",
            "FREQ=WEEKLY;BYDAY=WE;COUNT=5",
            "14:00",
            "16:00",
            true,
            "1234"
        );
        expect(seriesId).to.be.a("number");
        expect(seriesId).to.be.greaterThan(0);
        testSeriesId = seriesId;
    });

    it("getById should return the created series", async () => {
        if (!testSeriesId) {
            this.skip();
        }
        const series = await RecurringSeries.getById(testSeriesId);
        expect(series).to.not.be.null;
        expect(series.name).to.equal("Test Recurring Meeting");
        expect(series.rrule).to.equal("FREQ=WEEKLY;BYDAY=WE;COUNT=5");
    });

    it("getByIdentifier should return array of series", async () => {
        const seriesList = await RecurringSeries.getByIdentifier("admin");
        expect(seriesList).to.be.an("array");
        expect(seriesList.length).to.be.greaterThan(0);
    });

    it("update should return true for valid update", async () => {
        if (!testSeriesId) {
            this.skip();
        }
        const result = await RecurringSeries.update(
            testSeriesId,
            "Updated Meeting Name",
            "FREQ=WEEKLY;BYDAY=TH;COUNT=5",
            "15:00",
            "17:00",
            true,
            "5678"
        );
        expect(result).to.equal(true);
    });

    it("delete should return true for valid series_id", async () => {
        if (!testSeriesId) {
            this.skip();
        }
        const result = await RecurringSeries.delete(testSeriesId);
        expect(result).to.equal(true);
    });

    it("getById should return null for deleted series", async () => {
        if (!testSeriesId) {
            this.skip();
        }
        const series = await RecurringSeries.getById(testSeriesId);
        expect(series).to.be.null;
    });

});
