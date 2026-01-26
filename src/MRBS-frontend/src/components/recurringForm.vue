<template>
    <div class="recurring-form" v-show="show">
        <div class="recurring-toggle">
            <input type="checkbox" id="recurring-checkbox" v-model="isRecurring" @change="onRecurringChange" />
            <label for="recurring-checkbox">週期預約</label>
        </div>

        <div v-if="isRecurring" class="recurring-settings">
            <div class="input-group">
                <label class="recurring-label">重複模式：</label>
                <select v-model="frequency" class="recurring-select" disabled>
                    <option value="WEEKLY">每週</option>
                </select>
            </div>

            <div class="input-group">
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
            endCondition: 'until',
            untilDate: '',
            count: 10,
            previewDates: []
        };
    },
    watch: {
        isRecurring() {
            this.updatePreview();
            this.emitRRule();
        },
        weekday() {
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
            const date = new Date(dateStr);
            const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            this.weekday = weekdays[date.getDay()];
        },
        setDefaultUntilDate(dateStr) {
            const date = new Date(dateStr);
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
            const date = new Date(dateStr);
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekday = weekdays[date.getDay()];
            return `${month}/${day}(${weekday})`;
        },
        generateRRule() {
            if (!this.isRecurring) {
                return null;
            }
            let rrule = `FREQ=${this.frequency};BYDAY=${this.weekday}`;
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

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const weekdayIndex = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(this.weekday);
            const dates = [];
            let current = new Date(today);

            // find next occurrence of the weekday
            while (current.getDay() !== weekdayIndex) {
                current.setDate(current.getDate() + 1);
            }

            if (this.endCondition === 'until' && this.untilDate) {
                const until = new Date(this.untilDate);
                until.setHours(23, 59, 59, 999);
                while (current <= until) {
                    dates.push(this.formatDate(current));
                    current.setDate(current.getDate() + 7);
                }
            } else if (this.endCondition === 'count' && this.count > 0) {
                for (let i = 0; i < this.count; i++) {
                    dates.push(this.formatDate(current));
                    current.setDate(current.getDate() + 7);
                }
            }

            this.previewDates = dates;
        },
        reset() {
            this.isRecurring = false;
            this.frequency = 'WEEKLY';
            this.weekday = 'WE';
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
</style>
