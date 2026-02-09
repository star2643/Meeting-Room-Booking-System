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
        // 2026-01-26 is Monday (use UTC to avoid timezone issues)
        const date = new Date(Date.UTC(2026, 0, 26));
        const weekday = rruleUtil.getWeekdayFromDate(date);
        expect(weekday).to.equal("MO");
    });

    it("formatDate should return YYYY-MM-DD format", () => {
        const date = new Date(Date.UTC(2026, 5, 30));
        const formatted = rruleUtil.formatDate(date);
        expect(formatted).to.equal("2026-06-30");
    });

    it("formatDateForRRule should return YYYYMMDD format", () => {
        const date = new Date(Date.UTC(2026, 5, 30));
        const formatted = rruleUtil.formatDateForRRule(date);
        expect(formatted).to.equal("20260630");
    });

    it("expandRRule should return array of dates", () => {
        const dtstart = new Date(Date.UTC(2026, 0, 7)); // Wednesday, Jan 7, 2026
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

// test new recurring patterns (Story 1.2)
describe('test rrule bi-weekly pattern (隔週模式)', () => {

    it("createRecurringRule should generate bi-weekly RRULE with INTERVAL=2", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'bi-weekly',
            dtstart: new Date(Date.UTC(2026, 1, 5)),
            count: 5,
            byweekday: ['WE']
        });
        expect(result.rruleString).to.include('INTERVAL=2');
        expect(result.rruleString).to.include('FREQ=WEEKLY');
        expect(result.rruleString).to.include('BYDAY=WE');
    });

    it("createRecurringRule should expand bi-weekly occurrences correctly", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'bi-weekly',
            dtstart: new Date(Date.UTC(2026, 1, 11)),  // Feb 11, 2026 (Wednesday)
            count: 5,
            byweekday: ['WE']
        });
        expect(result.dates).to.have.lengthOf(5);
        expect(result.dates[0]).to.equal('2026-02-11'); // First Wednesday
        expect(result.dates[1]).to.equal('2026-02-25'); // Two weeks later
        expect(result.dates[2]).to.equal('2026-03-11'); // Two weeks later
    });

    it("createRecurringRule should support multiple weekdays for bi-weekly", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'bi-weekly',
            dtstart: new Date(Date.UTC(2026, 1, 2)),
            count: 6,
            byweekday: ['MO', 'FR']
        });
        expect(result.dates).to.have.lengthOf(6);
    });

});

describe('test rrule monthly by date pattern (每月固定日期)', () => {

    it("createRecurringRule should generate monthly RRULE with BYMONTHDAY", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'monthly-date',
            dtstart: new Date(Date.UTC(2026, 1, 15)),
            count: 12,
            bymonthday: 15
        });
        expect(result.rruleString).to.include('FREQ=MONTHLY');
        expect(result.rruleString).to.include('BYMONTHDAY=15');
    });

    it("createRecurringRule should expand monthly dates correctly", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'monthly-date',
            dtstart: new Date(Date.UTC(2026, 1, 15)),
            count: 12,
            bymonthday: 15
        });
        expect(result.dates).to.have.lengthOf(12);
        expect(result.dates[0]).to.equal('2026-02-15');
        expect(result.dates[1]).to.equal('2026-03-15');
        expect(result.dates[2]).to.equal('2026-04-15');
    });

    it("createRecurringRule should skip invalid dates like Feb 30", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'monthly-date',
            dtstart: new Date(Date.UTC(2026, 0, 30)),
            until: new Date(Date.UTC(2027, 0, 30)),  // Span over a year to include Feb
            bymonthday: 30
        });
        // February doesn't have 30 days, so should be skipped per RFC 5545
        // Check that Feb is not in the results
        const hasFeb = result.dates.some(date => date.startsWith('2026-02'));
        expect(hasFeb).to.equal(false);
        // Should have occurrences for Jan, Mar, May, Jul, Aug, Oct, Dec (30-day and 31-day months)
        // That's 11 months in total (Feb and Apr 31st don't exist, but Apr has 30 days)
        expect(result.dates.length).to.be.greaterThan(9);  // At least 10 months
    });

    it("createRecurringRule should handle last day of month (BYMONTHDAY=-1)", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'monthly-date',
            dtstart: new Date(Date.UTC(2026, 0, 31)),
            count: 6,
            bymonthday: -1
        });
        expect(result.rruleString).to.include('BYMONTHDAY=-1');
        expect(result.dates).to.have.lengthOf(6);
        // Jan 31, Feb 28, Mar 31, Apr 30, May 31, Jun 30
        expect(result.dates[0]).to.equal('2026-01-31');
        expect(result.dates[1]).to.equal('2026-02-28'); // Feb last day
    });

});

describe('test rrule monthly by week position pattern (每月固定週次)', () => {

    it("createRecurringRule should generate monthly RRULE with BYDAY position", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'monthly-week',
            dtstart: new Date(Date.UTC(2026, 1, 6)),
            count: 12,
            bysetpos: { position: 1, weekday: 'FR' }
        });
        expect(result.rruleString).to.include('FREQ=MONTHLY');
        // Accept both 'BYDAY=1FR' and 'BYDAY=+1FR' (RRule adds + for positive numbers)
        expect(result.rruleString).to.match(/BYDAY=\+?1FR/);
    });

    it("createRecurringRule should expand first Friday of each month correctly", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'monthly-week',
            dtstart: new Date(Date.UTC(2026, 1, 6)),  // Feb 6, 2026 is first Friday
            count: 12,
            bysetpos: { position: 1, weekday: 'FR' }
        });
        expect(result.dates).to.have.lengthOf(12);
        expect(result.dates[0]).to.equal('2026-02-06');
        expect(result.dates[1]).to.equal('2026-03-06');
    });

    it("createRecurringRule should handle last Monday of each month", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'monthly-week',
            dtstart: new Date(Date.UTC(2026, 0, 26)),  // Jan 26, 2026 is last Monday
            count: 6,
            bysetpos: { position: -1, weekday: 'MO' }
        });
        expect(result.rruleString).to.include('BYDAY=-1MO');
        expect(result.dates).to.have.lengthOf(6);
        expect(result.dates[0]).to.equal('2026-01-26');
    });

    it("createRecurringRule should handle second Wednesday of each month", () => {
        const result = rruleUtil.createRecurringRule({
            freq: 'monthly-week',
            dtstart: new Date(Date.UTC(2026, 0, 14)),
            count: 6,
            bysetpos: { position: 2, weekday: 'WE' }
        });
        // Accept both 'BYDAY=2WE' and 'BYDAY=+2WE' (RRule adds + for positive numbers)
        expect(result.rruleString).to.match(/BYDAY=\+?2WE/);
        expect(result.dates).to.have.lengthOf(6);
    });

});

describe('test rrule helper functions', () => {

    it("convertWeekdays should convert string array to RRule weekday constants", () => {
        const weekdays = rruleUtil.convertWeekdays(['MO', 'WE', 'FR']);
        expect(weekdays).to.be.an('array');
        expect(weekdays).to.have.lengthOf(3);
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
