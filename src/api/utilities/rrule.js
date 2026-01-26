const { RRule } = require('rrule');

module.exports = {

    // parse RRULE string and expand to dates
    // returns array of Date objects
    expandRRule: function (rruleString, dtstart) {
        try {
            // parse the RRULE string with dtstart
            const rruleOptions = RRule.parseString(rruleString);
            rruleOptions.dtstart = dtstart;
            const rule = new RRule(rruleOptions);
            return rule.all();
        }
        catch (e) {
            console.error("error expanding rrule: ", e);
            return [];
        }
    },

    // validate RRULE string format
    // returns true if valid, false otherwise
    validateRRule: function (rruleString) {
        try {
            RRule.parseString(rruleString);
            return true;
        }
        catch (e) {
            return false;
        }
    },

    // create RRULE string for weekly pattern
    // byday: weekday abbreviation (MO, TU, WE, TH, FR, SA, SU)
    // until: end date (Date object or YYYYMMDD string)
    // count: number of occurrences (optional, mutually exclusive with until)
    createWeeklyRRule: function (byday, until, count) {
        let rrule = 'FREQ=WEEKLY;BYDAY=' + byday;

        if (until) {
            // convert Date object to YYYYMMDD string if needed
            if (until instanceof Date) {
                const year = until.getFullYear();
                const month = String(until.getMonth() + 1).padStart(2, '0');
                const day = String(until.getDate()).padStart(2, '0');
                until = year + month + day;
            }
            rrule += ';UNTIL=' + until;
        } else if (count) {
            rrule += ';COUNT=' + count;
        }

        return rrule;
    },

    // get weekday abbreviation from Date object
    // returns: MO, TU, WE, TH, FR, SA, SU
    getWeekdayFromDate: function (date) {
        const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        return weekdays[date.getDay()];
    },

    // format date to YYYY-MM-DD string
    formatDate: function (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    },

    // format date to YYYYMMDD string (for RRULE UNTIL)
    formatDateForRRule: function (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return year + month + day;
    }
};
