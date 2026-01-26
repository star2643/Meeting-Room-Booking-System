const router = require('express').Router();
const jwt = require('./../utilities/jwt.js');
const rruleUtil = require('./../utilities/rrule.js');
const RecurringSeries = require('./../model/recurringSeries.js');
const Reservation = require('./../model/reservation.js');
const Room = require('./../model/room.js');

class RecurringReservation {
    constructor() {
        this.post = this.post.bind(this);
    }

    async post(req, res) {
        try {
            const { room_id, name, start_time, end_time, rrule, show, ext } = req.body;
            const identifier = req.identifier;

            // validate required fields
            if (!room_id || !name || !start_time || !end_time || !rrule) {
                return res.json({ error: '缺少必要欄位' });
            }

            // validate rrule format
            if (!rruleUtil.validateRRule(rrule)) {
                return res.json({ error: 'RRULE 格式無效' });
            }

            // validate room exists
            const rooms = await Room.get();
            const roomExists = rooms && rooms.some(r => r.room_id === room_id);
            if (!roomExists) {
                return res.json({ error: '會議室不存在' });
            }

            // validate name length
            if (name.length > 40) {
                return res.json({ error: '會議名稱不可超過 40 個字' });
            }

            // validate time format (HH:mm)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
                return res.json({ error: '時間格式無效，請使用 HH:mm 格式' });
            }

            // validate start_time < end_time
            if (start_time >= end_time) {
                return res.json({ error: '開始時間應小於結束時間' });
            }

            // create dtstart from rrule and first occurrence date
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // expand rrule to get all occurrence dates
            const occurrenceDates = rruleUtil.expandRRule(rrule, today);

            if (occurrenceDates.length === 0) {
                return res.json({ error: '週期規則未產生任何場次' });
            }

            // prepare reservations for batch insert
            const reservations = occurrenceDates.map(date => {
                const occurrenceDate = rruleUtil.formatDate(date);
                const startDateTime = occurrenceDate + ' ' + start_time + ':00';
                const endDateTime = occurrenceDate + ' ' + end_time + ':00';

                return {
                    identifier,
                    room_id,
                    name,
                    start_time: startDateTime,
                    end_time: endDateTime,
                    show: show !== undefined ? show : true,
                    ext: ext || null,
                    series_id: null, // will be set after series creation
                    occurrence_date: occurrenceDate
                };
            });

            // check for conflicts with existing reservations
            const conflicts = await Reservation.checkBatchOverlap(room_id, reservations);
            if (conflicts.length > 0) {
                return res.json({
                    error: '與現有預約衝突',
                    conflicts: conflicts
                });
            }

            // create recurring series record
            const seriesId = await RecurringSeries.create(
                identifier,
                room_id,
                name,
                rrule,
                start_time,
                end_time,
                show !== undefined ? show : true,
                ext || null
            );

            if (!seriesId) {
                return res.json({ error: '建立週期預約規則失敗' });
            }

            // set series_id for all reservations
            reservations.forEach(r => {
                r.series_id = seriesId;
            });

            // batch insert all reservations in single transaction (NFR7)
            const insertSuccess = await Reservation.insertBatchWithSeries(reservations);

            if (!insertSuccess) {
                // rollback: delete the series record
                await RecurringSeries.delete(seriesId);
                return res.json({ error: '建立預約場次失敗' });
            }

            // success response
            res.json({
                series_id: seriesId,
                created_count: occurrenceDates.length,
                occurrences: occurrenceDates.map(d => rruleUtil.formatDate(d))
            });
        }
        catch (e) {
            console.error('error creating recurring reservation:', e);
            res.status(500).json({ error: '伺服器內部錯誤' });
        }
    }
}

const recurringReservation = new RecurringReservation();

// routes
router.post('/', jwt.verifyLogin, recurringReservation.post);

module.exports = router;
