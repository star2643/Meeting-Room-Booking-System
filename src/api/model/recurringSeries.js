const db_conn = require('./conn');

module.exports = {

    // create a new recurring series
    create: async function (identifier, room_id, name, rrule, start_time, end_time, show, ext) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return null;
        }
        try {
            const sql = "INSERT INTO `RecurringSeries` (`identifier`, `room_id`, `name`, `rrule`, `start_time`, `end_time`, `show`, `ext`) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
            const result = await conn.query(sql, [identifier, room_id, name, rrule, start_time, end_time, show, ext]);
            db_conn.closeDBConnection(conn);
            return Number(result.insertId);
        }
        catch (e) {
            console.error("error creating recurring series: ", e);
            db_conn.closeDBConnection(conn);
            return null;
        }
    },

    // get recurring series by series_id
    getById: async function (series_id) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return null;
        }
        try {
            const sql = "SELECT * FROM `RecurringSeries` WHERE `series_id` = ?;";
            const result = await conn.query(sql, [series_id]);
            db_conn.closeDBConnection(conn);
            return result[0] || null;
        }
        catch (e) {
            console.error("error getting recurring series by id: ", e);
            db_conn.closeDBConnection(conn);
            return null;
        }
    },

    // get all recurring series by user identifier
    getByIdentifier: async function (identifier) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return null;
        }
        try {
            const sql = "SELECT * FROM `RecurringSeries` WHERE `identifier` = ?;";
            const result = await conn.query(sql, [identifier]);
            db_conn.closeDBConnection(conn);
            return result;
        }
        catch (e) {
            console.error("error getting recurring series by identifier: ", e);
            db_conn.closeDBConnection(conn);
            return null;
        }
    },

    // delete recurring series by series_id
    delete: async function (series_id) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        try {
            const sql = "DELETE FROM `RecurringSeries` WHERE `series_id` = ?;";
            await conn.query(sql, [series_id]);
            db_conn.closeDBConnection(conn);
            return true;
        }
        catch (e) {
            console.error("error deleting recurring series: ", e);
            db_conn.closeDBConnection(conn);
            return false;
        }
    },

    // update recurring series by series_id
    update: async function (series_id, name, rrule, start_time, end_time, show, ext) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        try {
            const sql = "UPDATE `RecurringSeries` SET `name` = ?, `rrule` = ?, `start_time` = ?, `end_time` = ?, `show` = ?, `ext` = ? WHERE `series_id` = ?;";
            await conn.query(sql, [name, rrule, start_time, end_time, show, ext, series_id]);
            db_conn.closeDBConnection(conn);
            return true;
        }
        catch (e) {
            console.error("error updating recurring series: ", e);
            db_conn.closeDBConnection(conn);
            return false;
        }
    }
};
