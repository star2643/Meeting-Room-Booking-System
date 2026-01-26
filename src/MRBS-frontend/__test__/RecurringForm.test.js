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
