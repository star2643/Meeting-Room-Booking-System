import { test, describe, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import RecurringForm from '@/components/recurringForm.vue';

describe('RecurringForm component tests', () => {

    test('Component renders correctly with default props', () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: ''
            }
        });
        expect(wrapper.find('.recurring-form').exists()).toBe(true);
        expect(wrapper.find('#recurring-checkbox').exists()).toBe(true);
    });

    test('Recurring settings hidden when checkbox unchecked', () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: ''
            }
        });
        expect(wrapper.find('.recurring-settings').exists()).toBe(false);
    });

    test('Recurring settings visible when checkbox checked', async () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: ''
            }
        });
        await wrapper.find('#recurring-checkbox').setValue(true);
        expect(wrapper.find('.recurring-settings').exists()).toBe(true);
    });

    test('Emits recurring-change event when checkbox toggled', async () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: ''
            }
        });
        await wrapper.find('#recurring-checkbox').setValue(true);
        expect(wrapper.emitted('recurring-change')).toBeTruthy();
        expect(wrapper.emitted('recurring-change')[0]).toEqual([true]);
    });

    test('Emits rrule-generated event when settings change', async () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: '2026-01-26'
            }
        });
        await wrapper.find('#recurring-checkbox').setValue(true);
        expect(wrapper.emitted('rrule-generated')).toBeTruthy();
    });

    test('generateRRule returns correct format for UNTIL', async () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: '2026-01-26'
            }
        });
        await wrapper.setData({
            isRecurring: true,
            frequency: 'WEEKLY',
            weekday: 'WE',
            endCondition: 'until',
            untilDate: '2026-06-30'
        });
        const rrule = wrapper.vm.generateRRule();
        expect(rrule).toBe('FREQ=WEEKLY;BYDAY=WE;UNTIL=20260630');
    });

    test('generateRRule returns correct format for COUNT', async () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: '2026-01-26'
            }
        });
        await wrapper.setData({
            isRecurring: true,
            frequency: 'WEEKLY',
            weekday: 'MO',
            endCondition: 'count',
            count: 10
        });
        const rrule = wrapper.vm.generateRRule();
        expect(rrule).toBe('FREQ=WEEKLY;BYDAY=MO;COUNT=10');
    });

    test('generateRRule returns null when not recurring', () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: ''
            }
        });
        const rrule = wrapper.vm.generateRRule();
        expect(rrule).toBeNull();
    });

    test('Preview dates are calculated correctly for COUNT', async () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: '2026-01-26'
            }
        });
        await wrapper.setData({
            isRecurring: true,
            weekday: 'WE',
            endCondition: 'count',
            count: 3
        });
        await wrapper.vm.updatePreview();
        expect(wrapper.vm.previewDates.length).toBe(3);
    });

    test('reset method clears all data', async () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: '2026-01-26'
            }
        });
        await wrapper.setData({
            isRecurring: true,
            weekday: 'MO',
            count: 5
        });
        wrapper.vm.reset();
        expect(wrapper.vm.isRecurring).toBe(false);
        expect(wrapper.vm.weekday).toBe('WE');
        expect(wrapper.vm.count).toBe(10);
        expect(wrapper.vm.previewDates.length).toBe(0);
    });

    test('getData returns correct structure', async () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: '2026-01-26'
            }
        });
        await wrapper.setData({
            isRecurring: true,
            weekday: 'WE',
            endCondition: 'count',
            count: 5
        });
        const data = wrapper.vm.getData();
        expect(data).toHaveProperty('isRecurring', true);
        expect(data).toHaveProperty('rrule');
        expect(data).toHaveProperty('previewDates');
    });

    test('formatDisplayDate returns correct format', () => {
        const wrapper = mount(RecurringForm, {
            props: {
                show: true,
                startDate: ''
            }
        });
        const formatted = wrapper.vm.formatDisplayDate('2026-01-28');
        expect(formatted).toContain('1/28');
        expect(formatted).toContain('三');
    });

});

// Story 1.2: 新增模式測試
describe('RecurringForm - New Pattern Tests (Story 1.2)', () => {

    describe('Bi-weekly pattern (隔週模式)', () => {
        test('Frequency dropdown shows bi-weekly option', async () => {
            const wrapper = mount(RecurringForm, {
                props: { show: true, startDate: '2026-02-11' }
            });
            await wrapper.find('#recurring-checkbox').setValue(true);
            const options = wrapper.find('.recurring-select').findAll('option');
            const biWeeklyOption = options.find(o => o.element.value === 'BI-WEEKLY');
            expect(biWeeklyOption).toBeDefined();
            expect(biWeeklyOption.text()).toBe('隔週');
        });

        test('generateRRule returns correct format for bi-weekly', async () => {
            const wrapper = mount(RecurringForm);
            await wrapper.setData({
                isRecurring: true,
                frequency: 'BI-WEEKLY',
                weekday: 'WE',
                endCondition: 'count',
                count: 5
            });
            const rrule = wrapper.vm.generateRRule();
            expect(rrule).toContain('FREQ=WEEKLY');
            expect(rrule).toContain('INTERVAL=2');
            expect(rrule).toContain('BYDAY=WE');
            expect(rrule).toContain('COUNT=5');
        });

        test('Preview calculates bi-weekly dates correctly', async () => {
            const wrapper = mount(RecurringForm, {
                props: { show: true, startDate: '2026-02-11' }  // Wednesday
            });
            await wrapper.setData({
                isRecurring: true,
                frequency: 'BI-WEEKLY',
                weekday: 'WE',
                endCondition: 'count',
                count: 3
            });
            await wrapper.vm.updatePreview();
            expect(wrapper.vm.previewDates.length).toBe(3);
            expect(wrapper.vm.previewDates[0]).toBe('2026-02-11');
            expect(wrapper.vm.previewDates[1]).toBe('2026-02-25');  // 2 weeks later
        });
    });

    describe('Monthly by date pattern (每月固定日期)', () => {
        test('Shows monthly date selector when monthly-date frequency selected', async () => {
            const wrapper = mount(RecurringForm, {
                props: { show: true, startDate: '2026-02-15' }
            });
            await wrapper.find('#recurring-checkbox').setValue(true);
            await wrapper.setData({ frequency: 'MONTHLY-DATE' });
            await wrapper.vm.$nextTick();

            const selects = wrapper.findAll('.recurring-select');
            const monthlyDateSelect = selects.find(s => {
                const options = s.findAll('option');
                return options.some(o => o.text().includes('日'));
            });
            expect(monthlyDateSelect).toBeDefined();
        });

        test('generateRRule returns correct format for monthly date', async () => {
            const wrapper = mount(RecurringForm);
            await wrapper.setData({
                isRecurring: true,
                frequency: 'MONTHLY-DATE',
                monthlyDate: 15,
                endCondition: 'count',
                count: 12
            });
            const rrule = wrapper.vm.generateRRule();
            expect(rrule).toContain('FREQ=MONTHLY');
            expect(rrule).toContain('BYMONTHDAY=15');
            expect(rrule).toContain('COUNT=12');
        });

        test('generateRRule handles last day of month (BYMONTHDAY=-1)', async () => {
            const wrapper = mount(RecurringForm);
            await wrapper.setData({
                isRecurring: true,
                frequency: 'MONTHLY-DATE',
                monthlyDate: -1,
                endCondition: 'count',
                count: 6
            });
            const rrule = wrapper.vm.generateRRule();
            expect(rrule).toContain('BYMONTHDAY=-1');
        });

        test('Shows warning for invalid dates (29-31)', async () => {
            const wrapper = mount(RecurringForm, {
                props: { show: true, startDate: '2026-01-30' }
            });
            await wrapper.find('#recurring-checkbox').setValue(true);
            await wrapper.setData({
                frequency: 'MONTHLY-DATE',
                monthlyDate: 30
            });
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.showInvalidDateWarning).toBe(true);
            expect(wrapper.find('.warning-message').exists()).toBe(true);
        });

        test('Does not show warning for valid dates (1-28)', async () => {
            const wrapper = mount(RecurringForm);
            await wrapper.setData({
                frequency: 'MONTHLY-DATE',
                monthlyDate: 15
            });
            expect(wrapper.vm.showInvalidDateWarning).toBe(false);
        });

        test('Preview calculates monthly dates correctly', async () => {
            const wrapper = mount(RecurringForm, {
                props: { show: true, startDate: '2026-02-15' }
            });
            await wrapper.setData({
                isRecurring: true,
                frequency: 'MONTHLY-DATE',
                monthlyDate: 15,
                endCondition: 'count',
                count: 3
            });
            await wrapper.vm.updatePreview();
            expect(wrapper.vm.previewDates.length).toBe(3);
            expect(wrapper.vm.previewDates[0]).toBe('2026-02-15');
            expect(wrapper.vm.previewDates[1]).toBe('2026-03-15');
            expect(wrapper.vm.previewDates[2]).toBe('2026-04-15');
        });
    });

    describe('Monthly by week position pattern (每月固定週次)', () => {
        test('Shows position and weekday selectors when monthly-week selected', async () => {
            const wrapper = mount(RecurringForm, {
                props: { show: true, startDate: '2026-02-06' }
            });
            await wrapper.find('#recurring-checkbox').setValue(true);
            await wrapper.setData({ frequency: 'MONTHLY-WEEK' });
            await wrapper.vm.$nextTick();

            const selects = wrapper.findAll('.recurring-select');
            // Should have frequency, position, and weekday selects
            expect(selects.length).toBeGreaterThanOrEqual(2);
        });

        test('generateRRule returns correct format for monthly week position', async () => {
            const wrapper = mount(RecurringForm);
            await wrapper.setData({
                isRecurring: true,
                frequency: 'MONTHLY-WEEK',
                monthlyPosition: 1,
                monthlyWeekday: 'FR',
                endCondition: 'count',
                count: 12
            });
            const rrule = wrapper.vm.generateRRule();
            expect(rrule).toContain('FREQ=MONTHLY');
            expect(rrule).toContain('BYDAY=1FR');
            expect(rrule).toContain('COUNT=12');
        });

        test('generateRRule handles last weekday of month', async () => {
            const wrapper = mount(RecurringForm);
            await wrapper.setData({
                isRecurring: true,
                frequency: 'MONTHLY-WEEK',
                monthlyPosition: -1,
                monthlyWeekday: 'MO',
                endCondition: 'count',
                count: 6
            });
            const rrule = wrapper.vm.generateRRule();
            expect(rrule).toContain('BYDAY=-1MO');
        });

        test('Preview calculates monthly week positions correctly', async () => {
            const wrapper = mount(RecurringForm, {
                props: { show: true, startDate: '2026-02-06' }  // First Friday
            });
            await wrapper.setData({
                isRecurring: true,
                frequency: 'MONTHLY-WEEK',
                monthlyPosition: 1,
                monthlyWeekday: 'FR',
                endCondition: 'count',
                count: 3
            });
            await wrapper.vm.updatePreview();
            expect(wrapper.vm.previewDates.length).toBe(3);
            expect(wrapper.vm.previewDates[0]).toBe('2026-02-06');  // First Friday of Feb
            expect(wrapper.vm.previewDates[1]).toBe('2026-03-06');  // First Friday of Mar
        });

        test('getNthWeekdayOfMonth calculates first Friday correctly', () => {
            const wrapper = mount(RecurringForm);
            const date = new Date(2026, 1, 1);  // Feb 1, 2026
            const result = wrapper.vm.getNthWeekdayOfMonth(date, 1, 5);  // First Friday (5 = Friday)
            expect(result.getDate()).toBe(6);  // Feb 6, 2026
        });

        test('getNthWeekdayOfMonth calculates last Monday correctly', () => {
            const wrapper = mount(RecurringForm);
            const date = new Date(2026, 0, 1);  // Jan 1, 2026
            const result = wrapper.vm.getNthWeekdayOfMonth(date, -1, 1);  // Last Monday
            expect(result.getDate()).toBe(26);  // Jan 26, 2026
        });
    });

    describe('Data reset with new fields', () => {
        test('reset method clears all new fields', async () => {
            const wrapper = mount(RecurringForm, {
                props: { show: true, startDate: '2026-01-26' }
            });
            await wrapper.setData({
                isRecurring: true,
                frequency: 'MONTHLY-DATE',
                monthlyDate: 30,
                monthlyPosition: 3,
                monthlyWeekday: 'TH',
                count: 20
            });
            wrapper.vm.reset();
            expect(wrapper.vm.frequency).toBe('WEEKLY');
            expect(wrapper.vm.monthlyDate).toBe(1);
            expect(wrapper.vm.monthlyPosition).toBe(1);
            expect(wrapper.vm.monthlyWeekday).toBe('MO');
            expect(wrapper.vm.count).toBe(10);
        });
    });

});
