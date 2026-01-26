const db_conn = require('./conn');

module.exports = {

    // get all reservations
    get : async function (start_time, end_time) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return null;
        }
        else {
            try {
                sql = "SELECT `Reservation`.reserve_id ,`Reservation`.identifier, `Room`.room_name, `Reservation`.name, `Reservation`.start_time, `Reservation`.end_time, `Reservation`.show, `Reservation`.ext, `User`.chinesename, `User`.`unit` FROM `Reservation`,`Room`, `User` WHERE `Reservation`.room_id = `Room`.room_id AND `Reservation`.identifier = `User`.identifier AND `Reservation`.start_time >= ? AND `Reservation`.end_time <= ? AND `Reservation`.status = 0;";
                const result = await conn.query(sql, [start_time, end_time]);
                db_conn.closeDBConnection(conn);
                return result;
            }
            catch(e) {
                console.error("error getting reservation : ", e);
                db_conn.closeDBConnection(conn);
                return null;
            }
        }
    },

    getInRange : async function (date) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return null;
        }
        else {
            try {
                sql = "SELECT `Reservation`.reserve_id ,`Reservation`.identifier, `Room`.room_name, `Reservation`.name, `Reservation`.start_time, `Reservation`.end_time, `Reservation`.show, `Reservation`.ext, `User`.chinesename, `User`.`unit` FROM `Reservation`,`Room`, `User` WHERE `Reservation`.room_id = `Room`.room_id AND `Reservation`.identifier = `User`.identifier AND `Reservation`.start_time <= ? AND `Reservation`.end_time >= ? AND `Reservation`.status = 0;";
                const result = await conn.query(sql, [`${date} 23:59:59`, `${date} 00:00:00`]);
                console.log('result', result);
                db_conn.closeDBConnection(conn);
                return result;
            }
            catch(e) {
                console.error("error getting reservation : ", e);
                db_conn.closeDBConnection(conn);
                return null;
            }
        }
    },
    
    // insert reservation into db by identifier, room_id, name, start_time, end_time, show, ext
    insert : async function (identifier, room_id, name, start_time, end_time, show, ext) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        else {
            try {
                const sql = "insert into `Reservation` (`identifier`, `room_id`, `name`, `start_time`, `end_time`, `show`, `ext`) values (?, ?, ?, ?, ?, ?, ?);";
                await conn.query(sql, [identifier, room_id, name, start_time, end_time, show, ext]);
                db_conn.closeDBConnection(conn);
                return true;
            }
            catch(e) {
                console.error("error inserting reservation : ", e);
                db_conn.closeDBConnection(conn);
                return false;
            }
        }
    },

    // get reservations which `show` is true and between the start_time and end_time
    getShow : async function () {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return null;
        }
        else {
            try {
                sql = "SELECT * FROM `Reservation` WHERE `status` = 0;";
                const result = await conn.query(sql);
                db_conn.closeDBConnection(conn);
                return result[0];
            }
            catch(e) {
                console.error("error getting reservations which show are true : ", e);
                db_conn.closeDBConnection(conn);
                return null;
            }
        }
    },

    // update all columns except identifer in reservation by reserve_id and identifier
    updateSelfs : async function (identifer, reserve_id, room_id, name, start_time, end_time, show, ext, status) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        else {
            try {
                const sql = "UPDATE `Reservation` SET `room_id` = ?, `name` = ?, `start_time` = ?, `end_time` = ?, `show` = ?, `ext` = ?, `status` = ? WHERE `reserve_id` = ? and `identifier` = ?;";
                await conn.query(sql, [room_id, name, start_time, end_time, show, ext, status, reserve_id, identifer]);
                db_conn.closeDBConnection(conn);
                return true;
            }
            catch(e) {
                console.error("error updating reservation : ", e);
                db_conn.closeDBConnection(conn);
                return false;
            }
        }
    },

    // update all columns except identifer in reservation by reserve_id, for admin
    update : async function (reserve_id, room_id, name, start_time, end_time, show, ext, status) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        else {
            try {
                const sql = "UPDATE `Reservation` SET `room_id` = ?, `name` = ?, `start_time` = ?, `end_time` = ?, `show` = ?, `ext` = ?, `status` = ? WHERE `reserve_id` = ?;";
                await conn.query(sql, [room_id, name, start_time, end_time, show, ext, status, reserve_id]);
                db_conn.closeDBConnection(conn);
                return true;
            }
            catch(e) {
                console.error("error updating reservation : ", e);
                db_conn.closeDBConnection(conn);
                return false;
            }
        }
    },

    // delete reservation by reserve_id
    delete : async function (reserve_id) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        else {
            try {
                const sql = "UPDATE `Reservation` SET `status` = 1 WHERE `reserve_id` = ?";
                await conn.query(sql, [reserve_id]);
                db_conn.closeDBConnection(conn);
                return true;
            }
            catch(e) {
                console.error("error deleting reservation : ", e);
                db_conn.closeDBConnection(conn);
                return false;
            }
        }
    },

    // delete user own reservation
    deleteSelf : async function (reserve_id, identifier) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        else {
            try {
                const sql = "UPDATE `Reservation` SET `status` = 1 WHERE `reserve_id` = ? AND `identifier` = ?";
                await conn.query(sql, [reserve_id, identifier]);
                db_conn.closeDBConnection(conn);
                return true;
            }
            catch(e) {
                console.error("error deleting reservation : ", e);
                db_conn.closeDBConnection(conn);
                return false;
            }
        }
    },

    // set reservation status to available by reserve_id
    setAvailable : async function (reserve_id) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        else {
            try {
                const sql = "UPDATE `Reservation` SET `status` = 0 WHERE `reserve_id` = ?";
                await conn.query(sql, [reserve_id]);
                db_conn.closeDBConnection(conn);
                return true;
            }
            catch(e) {
                console.error("error setting reservation to available : ", e);
                db_conn.closeDBConnection(conn);
                return false;
            }
        }
    },

    // check if the reservation is overlapped with the existing reservations
    checkOverlap : async function (start_time, end_time) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        else {
            try {
                // based on three conditions, check if the reservation is overlapped with the existing reservations
                const sql = "SELECT COUNT(reserve_id) FROM `Reservation` WHERE ? > `start_time` AND ? < `end_time` AND `status` = 0";
                const sql1 = "SELECT COUNT(reserve_id) FROM `Reservation` WHERE ? > `start_time` AND ? < `end_time` AND `status` = 0";
                const sql2 = "SELECT COUNT(reserve_id) FROM `Reservation` WHERE ? <= `start_time` AND ? >= `end_time` AND `status` = 0";
                const result = await conn.query(sql, [start_time, start_time]);
                const result1 = await conn.query(sql1, [end_time, end_time]);
                const result2 = await conn.query(sql2, [start_time, end_time]);
                db_conn.closeDBConnection(conn);
                return result[0]['COUNT(reserve_id)'] > 0 || result1[0]['COUNT(reserve_id)'] > 0 || result2[0]['COUNT(reserve_id)'] > 0;
            }
            catch(e) {
                console.error("error checking overlap : ", e);
                db_conn.closeDBConnection(conn);
                return false;
            }
        }
    },

    checkRules : function(start_time, end_time) {
        // check if start_time is less than end_time
        if (start_time >= end_time) {
            return "開始時間應小於結束時間，請再次確認";
        }
        return "";
    },

    // get reservation by reserve_id
    getById : async function (reserve_id) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return null;
        }
        else {
            try {
                const sql = "SELECT * FROM `Reservation` WHERE `reserve_id` = ?;";
                const result = await conn.query(sql, [reserve_id]);
                db_conn.closeDBConnection(conn);
                return result[0];
            }
            catch(e) {
                console.error("error getting reservation by reserve_id : ", e);
                db_conn.closeDBConnection(conn);
                return null;
            }
        }
    },

    // insert reservation with series_id and occurrence_date
    insertWithSeries : async function (identifier, room_id, name, start_time, end_time, show, ext, series_id, occurrence_date) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        try {
            const sql = "INSERT INTO `Reservation` (`identifier`, `room_id`, `name`, `start_time`, `end_time`, `show`, `ext`, `series_id`, `occurrence_date`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
            await conn.query(sql, [identifier, room_id, name, start_time, end_time, show, ext, series_id, occurrence_date]);
            db_conn.closeDBConnection(conn);
            return true;
        }
        catch (e) {
            console.error("error inserting reservation with series: ", e);
            db_conn.closeDBConnection(conn);
            return false;
        }
    },

    // batch insert reservations with series_id using transaction (NFR7)
    insertBatchWithSeries : async function (reservations) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        try {
            await conn.beginTransaction();
            const sql = "INSERT INTO `Reservation` (`identifier`, `room_id`, `name`, `start_time`, `end_time`, `show`, `ext`, `series_id`, `occurrence_date`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
            for (const r of reservations) {
                await conn.query(sql, [r.identifier, r.room_id, r.name, r.start_time, r.end_time, r.show, r.ext, r.series_id, r.occurrence_date]);
            }
            await conn.commit();
            db_conn.closeDBConnection(conn);
            return true;
        }
        catch (e) {
            console.error("error batch inserting reservations: ", e);
            await conn.rollback();
            db_conn.closeDBConnection(conn);
            return false;
        }
    },

    // get all reservations by series_id
    getBySeriesId : async function (series_id) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return null;
        }
        try {
            const sql = "SELECT * FROM `Reservation` WHERE `series_id` = ? AND `status` = 0 ORDER BY `occurrence_date`;";
            const result = await conn.query(sql, [series_id]);
            db_conn.closeDBConnection(conn);
            return result;
        }
        catch (e) {
            console.error("error getting reservations by series_id: ", e);
            db_conn.closeDBConnection(conn);
            return null;
        }
    },

    // delete all reservations by series_id (soft delete)
    deleteBySeriesId : async function (series_id) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return false;
        }
        try {
            const sql = "UPDATE `Reservation` SET `status` = 1 WHERE `series_id` = ?;";
            await conn.query(sql, [series_id]);
            db_conn.closeDBConnection(conn);
            return true;
        }
        catch (e) {
            console.error("error deleting reservations by series_id: ", e);
            db_conn.closeDBConnection(conn);
            return false;
        }
    },

    // check overlap for batch reservations (single query for performance)
    checkBatchOverlap : async function (room_id, reservations) {
        const conn = await db_conn.getDBConnection();
        if (conn == null) {
            return [];
        }
        try {
            const conflicts = [];
            for (const r of reservations) {
                const sql = "SELECT COUNT(reserve_id) as cnt FROM `Reservation` WHERE `room_id` = ? AND `status` = 0 AND ((? > `start_time` AND ? < `end_time`) OR (? > `start_time` AND ? < `end_time`) OR (? <= `start_time` AND ? >= `end_time`));";
                const result = await conn.query(sql, [room_id, r.start_time, r.start_time, r.end_time, r.end_time, r.start_time, r.end_time]);
                if (result[0].cnt > 0) {
                    conflicts.push(r.occurrence_date);
                }
            }
            db_conn.closeDBConnection(conn);
            return conflicts;
        }
        catch (e) {
            console.error("error checking batch overlap: ", e);
            db_conn.closeDBConnection(conn);
            return [];
        }
    }
}