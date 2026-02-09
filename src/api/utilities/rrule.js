const { RRule } = require('rrule');

/**
 * Convert weekday string array to RRule weekday constants
 * @param {string[]} weekdays - ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
 * @returns {Array} [RRule.MO, RRule.TU, ...]
 */
function convertWeekdays(weekdays) {
    const mapping = {
        MO: RRule.MO,
        TU: RRule.TU,
        WE: RRule.WE,
        TH: RRule.TH,
        FR: RRule.FR,
        SA: RRule.SA,
        SU: RRule.SU
    };
    return weekdays.map(day => mapping[day]);
}

/**
 * Create recurring rule and expand occurrences
 * @param {Object} params - Recurring parameters
 * @param {string} params.freq - Frequency: weekly, bi-weekly, monthly-date, monthly-week
 * @param {Date} params.dtstart - Start date (UTC)
 * @param {Date} [params.until] - End date (mutually exclusive with count)
 * @param {number} [params.count] - Repeat count (mutually exclusive with until)
 * @param {string[]} [params.byweekday] - Weekdays (MO, TU, WE, TH, FR, SA, SU)
 * @param {number|number[]} [params.bymonthday] - Monthly date (1-31 or -1)
 * @param {Object} [params.bysetpos] - Monthly position {position: 1-4|-1, weekday: 'MO'}
 * @returns {Object} { rruleString, dates }
 */
function createRecurringRule(params) {
    let ruleConfig = {
        dtstart: params.dtstart
    };

    // Set end condition
    if (params.until) {
        ruleConfig.until = params.until;
    } else if (params.count) {
        ruleConfig.count = params.count;
    }

    // Configure based on pattern
    switch (params.freq) {
        case 'weekly':
            ruleConfig.freq = RRule.WEEKLY;
            ruleConfig.byweekday = convertWeekdays(params.byweekday);
            break;

        case 'bi-weekly':
            ruleConfig.freq = RRule.WEEKLY;
            ruleConfig.interval = 2;  // Key: bi-weekly
            ruleConfig.byweekday = convertWeekdays(params.byweekday);
            break;

        case 'monthly-date':
            ruleConfig.freq = RRule.MONTHLY;
            ruleConfig.bymonthday = params.bymonthday;  // Fixed date
            break;

        case 'monthly-week':
            ruleConfig.freq = RRule.MONTHLY;
            const { position, weekday } = params.bysetpos;
            ruleConfig.byweekday = [RRule[weekday].nth(position)];  // Fixed week position
            break;

        default:
            throw new Error(`Unsupported frequency: ${params.freq}`);
    }

    // Create RRule object
    const rule = new RRule(ruleConfig);

    // Expand all occurrences
    const dates = rule.all();

    // Return RRULE string and date array
    return {
        rruleString: rule.toString().split('\n')[1], // Remove DTSTART prefix line
        dates: dates.map(d => {
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })
    };
}

module.exports = {

    // Export new functions
    createRecurringRule: createRecurringRule,
    convertWeekdays: convertWeekdays,

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
    // 使用 UTC 方法確保跨時區一致性
    getWeekdayFromDate: function (date) {
        const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        return weekdays[date.getUTCDay()];
    },

    // format date to YYYY-MM-DD string
    // 使用 UTC 方法確保跨時區一致性
    formatDate: function (date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    },

    // format date to YYYYMMDD string (for RRULE UNTIL)
    // 使用 UTC 方法確保跨時區一致性
    formatDateForRRule: function (date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return year + month + day;
    }
};
