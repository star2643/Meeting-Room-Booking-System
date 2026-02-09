<template>
    <div class="recurring-form" v-show="show">
        <div class="recurring-toggle">
            <input type="checkbox" id="recurring-checkbox" v-model="isRecurring" @change="onRecurringChange" />
            <label for="recurring-checkbox">週期預約</label>
        </div>

        <div v-if="isRecurring" class="recurring-settings">
            <div class="input-group">
                <label class="recurring-label">重複模式：</label>
                <select v-model="frequency" class="recurring-select">
                    <option value="WEEKLY">每週</option>
                    <option value="BI-WEEKLY">隔週</option>
                    <option value="MONTHLY-DATE">每月固定日期</option>
                    <option value="MONTHLY-WEEK">每月固定週次</option>
                </select>
            </div>

            <!-- 每週 / 隔週模式 -->
            <div class="input-group" v-if="frequency === 'WEEKLY' || frequency === 'BI-WEEKLY'">
                <label class="recurring-label">重複星期：</label>
                <select v-model="weekday" class="recurring-select">
                    <option value="MO">星期一</option>
                    <option value="TU">星期二</option>
                    <option value="WE">星期三</option>
                    <option value="TH">星期四</option>
                    <option value="FR">星期五</option>
                    <option value="SA">星期六</option>
                    <option value="SU">星期日</option>
                </select>
            </div>

            <!-- 每月固定日期模式 -->
            <div class="input-group" v-if="frequency === 'MONTHLY-DATE'">
                <label class="recurring-label">每月日期：</label>
                <select v-model.number="monthlyDate" class="recurring-select">
                    <option v-for="day in 31" :key="day" :value="day">{{ day }} 日</option>
                    <option :value="-1">最後一天</option>
                </select>
            </div>
            <div class="warning-message" v-if="frequency === 'MONTHLY-DATE' && showInvalidDateWarning">
                ⚠️ 注意：部分月份可能沒有此日期（如 2 月 30 日），這些月份將被跳過
            </div>

            <!-- 每月固定週次模式 -->
            <div class="input-group" v-if="frequency === 'MONTHLY-WEEK'">
                <label class="recurring-label">每月第幾個：</label>
                <select v-model.number="monthlyPosition" class="recurring-select">
                    <option :value="1">第一個</option>
                    <option :value="2">第二個</option>
                    <option :value="3">第三個</option>
                    <option :value="4">第四個</option>
                    <option :value="-1">最後一個</option>
                </select>
                <select v-model="monthlyWeekday" class="recurring-select" style="margin-left: 5px;">
                    <option value="MO">星期一</option>
                    <option value="TU">星期二</option>
                    <option value="WE">星期三</option>
                    <option value="TH">星期四</option>
                    <option value="FR">星期五</option>
                    <option value="SA">星期六</option>
                    <option value="SU">星期日</option>
                </select>
            </div>

            <div class="input-group">
                <label class="recurring-label">結束條件：</label>
                <select v-model="endCondition" class="recurring-select">
                    <option value="until">指定日期</option>
                    <option value="count">重複次數</option>
                </select>
            </div>

            <div class="input-group" v-if="endCondition === 'until'">
                <label class="recurring-label">結束日期：</label>
                <input type="date" v-model="untilDate" class="recurring-input" />
            </div>

            <div class="input-group" v-if="endCondition === 'count'">
                <label class="recurring-label">重複次數：</label>
                <input type="number" v-model.number="count" min="1" max="52" class="recurring-input" />
            </div>

            <div class="preview-section" v-if="previewDates.length > 0">
                <label class="recurring-label">場次預覽（共 {{ previewDates.length }} 場）：</label>
                <div class="preview-list">
                    <span v-for="(date, index) in previewDates" :key="index" class="preview-date">
                        {{ formatDisplayDate(date) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'recurringForm',
    props: {
        show: {
            type: Boolean,
            default: true
        },
        startDate: {
            type: String,
            default: ''
        }
    },
    emits: ['recurring-change', 'rrule-generated'],
    data() {
        return {
            isRecurring: false,
            frequency: 'WEEKLY',
            weekday: 'WE',
            monthlyDate: 1,
            monthlyPosition: 1,
            monthlyWeekday: 'MO',
            endCondition: 'until',
            untilDate: '',
            count: 10,
            previewDates: []
        };
    },
    computed: {
        showInvalidDateWarning() {
            return this.monthlyDate > 28 && this.monthlyDate !== -1;
        }
    },
    watch: {
        isRecurring() {
            this.updatePreview();
            this.emitRRule();
        },
        frequency() {
            this.updatePreview();
            this.emitRRule();
        },
        weekday() {
            this.updatePreview();
            this.emitRRule();
        },
        monthlyDate() {
            this.updatePreview();
            this.emitRRule();
        },
        monthlyPosition() {
            this.updatePreview();
            this.emitRRule();
        },
        monthlyWeekday() {
            this.updatePreview();
            this.emitRRule();
        },
        endCondition() {
            this.updatePreview();
            this.emitRRule();
        },
        untilDate() {
            this.updatePreview();
            this.emitRRule();
        },
        count() {
            this.updatePreview();
            this.emitRRule();
        },
        startDate(newVal) {
            if (newVal) {
                this.setDefaultWeekday(newVal);
                this.setDefaultUntilDate(newVal);
            }
        }
    },
    mounted() {
        if (this.startDate) {
            this.setDefaultWeekday(this.startDate);
            this.setDefaultUntilDate(this.startDate);
        }
    },
    methods: {
        onRecurringChange() {
            this.$emit('recurring-change', this.isRecurring);
        },
        setDefaultWeekday(dateStr) {
            // 使用本地時區解析避免時區問題
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            this.weekday = weekdays[date.getDay()];
        },
        setDefaultUntilDate(dateStr) {
            // 使用本地時區解析避免時區問題
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            date.setMonth(date.getMonth() + 3);
            this.untilDate = this.formatDate(date);
        },
        formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        formatDateForRRule(dateStr) {
            return dateStr.replace(/-/g, '');
        },
        formatDisplayDate(dateStr) {
            // 使用本地時區解析避免時區問題
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            const weekday = weekdays[date.getDay()];
            return `${month}/${day}(${weekday})`;
        },
        generateRRule() {
            if (!this.isRecurring) {
                return null;
            }

            let rrule = '';

            // 根據模式設定 RRULE
            switch (this.frequency) {
                case 'WEEKLY':
                    rrule = `FREQ=WEEKLY;BYDAY=${this.weekday}`;
                    break;
                case 'BI-WEEKLY':
                    rrule = `FREQ=WEEKLY;INTERVAL=2;BYDAY=${this.weekday}`;
                    break;
                case 'MONTHLY-DATE':
                    rrule = `FREQ=MONTHLY;BYMONTHDAY=${this.monthlyDate}`;
                    break;
                case 'MONTHLY-WEEK':
                    rrule = `FREQ=MONTHLY;BYDAY=${this.monthlyPosition}${this.monthlyWeekday}`;
                    break;
                default:
                    rrule = `FREQ=WEEKLY;BYDAY=${this.weekday}`;
            }

            // 加入結束條件
            if (this.endCondition === 'until' && this.untilDate) {
                rrule += `;UNTIL=${this.formatDateForRRule(this.untilDate)}`;
            } else if (this.endCondition === 'count' && this.count > 0) {
                rrule += `;COUNT=${this.count}`;
            }

            return rrule;
        },
        emitRRule() {
            const rrule = this.generateRRule();
            this.$emit('rrule-generated', rrule);
        },
        updatePreview() {
            if (!this.isRecurring) {
                this.previewDates = [];
                return;
            }

            // 使用 startDate（用戶選擇的開始日期）或今天
            let startDateObj;
            if (this.startDate) {
                // 使用本地時區解析，前端預覽在本地時區計算
                const [year, month, day] = this.startDate.split('-').map(Number);
                startDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
            } else {
                startDateObj = new Date();
                startDateObj.setHours(0, 0, 0, 0);
            }

            const dates = [];

            if (this.frequency === 'WEEKLY' || this.frequency === 'BI-WEEKLY') {
                // 每週或隔週模式
                const weekdayIndex = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(this.weekday);
                let current = new Date(startDateObj);
                const interval = this.frequency === 'BI-WEEKLY' ? 14 : 7;

                // 找到第一個匹配的星期
                while (current.getDay() !== weekdayIndex) {
                    current.setDate(current.getDate() + 1);
                }

                this.addDatesWithEndCondition(dates, current, interval, 'days');

            } else if (this.frequency === 'MONTHLY-DATE') {
                // 每月固定日期模式
                let current = new Date(startDateObj);
                current.setDate(1); // 設定為當月1號，然後設定為目標日期

                // 設定為目標日期
                if (this.monthlyDate === -1) {
                    // 最後一天：移到下個月，再回退一天
                    current.setMonth(current.getMonth() + 1);
                    current.setDate(0);
                } else {
                    current.setDate(this.monthlyDate);
                }

                // 如果設定的日期早於開始日期，則移到下個月
                if (current < startDateObj) {
                    current.setMonth(current.getMonth() + 1);
                    current.setDate(1);
                    if (this.monthlyDate === -1) {
                        current.setMonth(current.getMonth() + 1);
                        current.setDate(0);
                    } else {
                        current.setDate(this.monthlyDate);
                    }
                }

                this.addDatesWithEndCondition(dates, current, 1, 'months');

            } else if (this.frequency === 'MONTHLY-WEEK') {
                // 每月固定週次模式
                const weekdayIndex = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(this.monthlyWeekday);
                let current = new Date(startDateObj);
                current.setDate(1); // 從當月1號開始

                current = this.getNthWeekdayOfMonth(current, this.monthlyPosition, weekdayIndex);

                // 如果計算的日期早於開始日期，則移到下個月
                if (current < startDateObj) {
                    current.setMonth(current.getMonth() + 1);
                    current.setDate(1);
                    current = this.getNthWeekdayOfMonth(current, this.monthlyPosition, weekdayIndex);
                }

                this.addDatesWithEndCondition(dates, current, 1, 'months', true);
            }

            this.previewDates = dates;
        },
        addDatesWithEndCondition(dates, startDate, interval, unit, isMonthlyWeek = false) {
            let current = new Date(startDate);

            if (this.endCondition === 'until' && this.untilDate) {
                const [y, m, d] = this.untilDate.split('-').map(Number);
                const until = new Date(y, m - 1, d, 23, 59, 59, 999);

                while (current <= until && dates.length < 365) { // 最多365個避免無限迴圈
                    // 檢查日期是否有效（避免如2月30日等無效日期）
                    const isValid = this.isValidDate(current);
                    if (isValid) {
                        dates.push(this.formatDate(current));
                    }

                    // 移到下一個日期
                    if (unit === 'days') {
                        current.setDate(current.getDate() + interval);
                    } else if (unit === 'months') {
                        if (isMonthlyWeek) {
                            const weekdayIndex = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(this.monthlyWeekday);
                            current.setMonth(current.getMonth() + 1);
                            current.setDate(1);
                            current = this.getNthWeekdayOfMonth(current, this.monthlyPosition, weekdayIndex);
                        } else {
                            // 每月固定日期
                            current.setMonth(current.getMonth() + 1);
                            if (this.monthlyDate === -1) {
                                current.setDate(1);
                                current.setMonth(current.getMonth() + 1);
                                current.setDate(0);
                            }
                        }
                    }
                }

            } else if (this.endCondition === 'count' && this.count > 0) {
                let validCount = 0;
                let iterations = 0;

                while (validCount < this.count && iterations < 365) { // 最多365次迭代避免無限迴圈
                    iterations++;

                    // 檢查日期是否有效
                    const isValid = this.isValidDate(current);
                    if (isValid) {
                        dates.push(this.formatDate(current));
                        validCount++;
                    }

                    // 移到下一個日期
                    if (unit === 'days') {
                        current.setDate(current.getDate() + interval);
                    } else if (unit === 'months') {
                        if (isMonthlyWeek) {
                            const weekdayIndex = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(this.monthlyWeekday);
                            current.setMonth(current.getMonth() + 1);
                            current.setDate(1);
                            current = this.getNthWeekdayOfMonth(current, this.monthlyPosition, weekdayIndex);
                        } else {
                            // 每月固定日期
                            const targetDate = this.monthlyDate;
                            current.setMonth(current.getMonth() + 1);
                            if (targetDate === -1) {
                                current.setDate(1);
                                current.setMonth(current.getMonth() + 1);
                                current.setDate(0);
                            }
                        }
                    }
                }
            }
        },
        getNthWeekdayOfMonth(date, position, weekdayIndex) {
            const year = date.getFullYear();
            const month = date.getMonth();

            if (position === -1) {
                // 最後一個：從月末往回找
                const lastDay = new Date(year, month + 1, 0);
                let current = new Date(lastDay);
                while (current.getDay() !== weekdayIndex) {
                    current.setDate(current.getDate() - 1);
                }
                return current;
            } else {
                // 第 n 個：從月初往前找
                const firstDay = new Date(year, month, 1);
                let current = new Date(firstDay);
                // 找到第一個匹配的星期
                while (current.getDay() !== weekdayIndex) {
                    current.setDate(current.getDate() + 1);
                }
                // 往後加 (position - 1) 週
                current.setDate(current.getDate() + (position - 1) * 7);
                return current;
            }
        },
        isValidDate(date) {
            // 檢查是否為有效日期（例如避免2月30日）
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();

            if (this.frequency === 'MONTHLY-DATE' && this.monthlyDate > 0) {
                // 檢查該月份是否有這個日期
                const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                if (this.monthlyDate > lastDayOfMonth) {
                    return false; // 無效日期（如2月30日）
                }
            }

            return true;
        },
        reset() {
            this.isRecurring = false;
            this.frequency = 'WEEKLY';
            this.weekday = 'WE';
            this.monthlyDate = 1;
            this.monthlyPosition = 1;
            this.monthlyWeekday = 'MO';
            this.endCondition = 'until';
            this.untilDate = '';
            this.count = 10;
            this.previewDates = [];
        },
        getData() {
            return {
                isRecurring: this.isRecurring,
                rrule: this.generateRRule(),
                previewDates: this.previewDates
            };
        }
    }
};
</script>

<style scoped>
.recurring-form {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #f9f9f9;
}

.recurring-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.recurring-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.recurring-toggle label {
    font-weight: bold;
    cursor: pointer;
}

.recurring-settings {
    margin-top: 10px;
}

.input-group {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.recurring-label {
    min-width: 100px;
    font-size: 14px;
}

.recurring-select,
.recurring-input {
    flex: 1;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 3px;
    font-size: 14px;
}

.preview-section {
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px dashed #ccc;
}

.preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
    max-height: 120px;
    overflow-y: auto;
}

.preview-date {
    background-color: #e3f2fd;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 12px;
    color: #1976d2;
}

.warning-message {
    color: #ff6b6b;
    font-size: 12px;
    margin-top: -5px;
    margin-bottom: 8px;
    margin-left: 100px;
}
</style>
