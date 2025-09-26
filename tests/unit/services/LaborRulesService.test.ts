/**
 * Unit tests for LaborRulesService - California Labor Rules
 */
import { LaborRulesService } from '@/services/LaborRulesService';

describe('LaborRulesService', () => {
  describe('calculateOvertimeMinutes', () => {
    it('should calculate no overtime for 8 hours or less', () => {
      const result = LaborRulesService.calculateOvertimeMinutes(480, 'CA'); // 8 hours
      expect(result).toBe(0);

      const result2 = LaborRulesService.calculateOvertimeMinutes(420, 'CA'); // 7 hours
      expect(result2).toBe(0);
    });

    it('should calculate overtime for more than 8 hours in CA', () => {
      const result = LaborRulesService.calculateOvertimeMinutes(540, 'CA'); // 9 hours
      expect(result).toBe(60); // 1 hour overtime

      const result2 = LaborRulesService.calculateOvertimeMinutes(600, 'CA'); // 10 hours
      expect(result2).toBe(120); // 2 hours overtime
    });

    it('should calculate double overtime for more than 12 hours in CA', () => {
      const result = LaborRulesService.calculateOvertimeMinutes(780, 'CA'); // 13 hours
      expect(result).toBe(300); // 4 hours regular overtime + 1 hour double time = 5 hours total

      const result2 = LaborRulesService.calculateOvertimeMinutes(840, 'CA'); // 14 hours
      expect(result2).toBe(360); // 4 hours regular overtime + 2 hours double time = 6 hours total
    });

    it('should not calculate overtime for non-CA states', () => {
      const result = LaborRulesService.calculateOvertimeMinutes(540, 'NY'); // 9 hours
      expect(result).toBe(0);

      const result2 = LaborRulesService.calculateOvertimeMinutes(600, 'TX'); // 10 hours
      expect(result2).toBe(0);
    });

    it('should handle edge cases', () => {
      const result = LaborRulesService.calculateOvertimeMinutes(0, 'CA');
      expect(result).toBe(0);

      const result2 = LaborRulesService.calculateOvertimeMinutes(-60, 'CA');
      expect(result2).toBe(0);
    });

    it('should calculate weekly overtime for CA (over 40 hours)', () => {
      const weeklyMinutes = 2700; // 45 hours
      const result = LaborRulesService.calculateWeeklyOvertimeMinutes(weeklyMinutes, 'CA');
      expect(result).toBe(300); // 5 hours overtime
    });

    it('should not calculate weekly overtime for under 40 hours', () => {
      const weeklyMinutes = 2280; // 38 hours
      const result = LaborRulesService.calculateWeeklyOvertimeMinutes(weeklyMinutes, 'CA');
      expect(result).toBe(0);
    });
  });

  describe('validateMealPeriodCompliance', () => {
    it('should require meal period for shifts over 5 hours in CA', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T15:00:00.000Z', // 6 hours
        duration_minutes: 360,
        break_minutes: 0,
        meal_periods: []
      };

      const result = LaborRulesService.validateMealPeriodCompliance(timeEntry as any, 'CA');

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('First meal period required for shifts over 5 hours');
    });

    it('should be compliant when meal period is taken for 6-hour shift', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T15:00:00.000Z', // 6 hours
        duration_minutes: 360,
        break_minutes: 30,
        meal_periods: [
          { start: '2024-01-01T12:00:00.000Z', end: '2024-01-01T12:30:00.000Z', duration_minutes: 30 }
        ]
      };

      const result = LaborRulesService.validateMealPeriodCompliance(timeEntry as any, 'CA');

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should require second meal period for shifts over 10 hours in CA', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T08:00:00.000Z',
        clock_out: '2024-01-01T19:00:00.000Z', // 11 hours
        duration_minutes: 660,
        break_minutes: 30,
        meal_periods: [
          { start: '2024-01-01T12:00:00.000Z', end: '2024-01-01T12:30:00.000Z', duration_minutes: 30 }
        ]
      };

      const result = LaborRulesService.validateMealPeriodCompliance(timeEntry as any, 'CA');

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('Second meal period required for shifts over 10 hours');
    });

    it('should be compliant with two meal periods for 11-hour shift', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T08:00:00.000Z',
        clock_out: '2024-01-01T19:00:00.000Z', // 11 hours
        duration_minutes: 660,
        break_minutes: 60,
        meal_periods: [
          { start: '2024-01-01T12:00:00.000Z', end: '2024-01-01T12:30:00.000Z', duration_minutes: 30 },
          { start: '2024-01-01T16:00:00.000Z', end: '2024-01-01T16:30:00.000Z', duration_minutes: 30 }
        ]
      };

      const result = LaborRulesService.validateMealPeriodCompliance(timeEntry as any, 'CA');

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should not enforce meal periods for non-CA states', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T19:00:00.000Z', // 10 hours
        duration_minutes: 600,
        break_minutes: 0,
        meal_periods: []
      };

      const result = LaborRulesService.validateMealPeriodCompliance(timeEntry as any, 'NY');

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should validate meal period timing (within first 5 hours)', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T18:00:00.000Z', // 9 hours
        duration_minutes: 540,
        break_minutes: 30,
        meal_periods: [
          { start: '2024-01-01T15:30:00.000Z', end: '2024-01-01T16:00:00.000Z', duration_minutes: 30 } // Too late
        ]
      };

      const result = LaborRulesService.validateMealPeriodCompliance(timeEntry as any, 'CA');

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('First meal period must be taken within first 5 hours of shift');
    });
  });

  describe('validateRestPeriodCompliance', () => {
    it('should require rest periods for CA employees', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T17:00:00.000Z', // 8 hours
        duration_minutes: 480,
        break_minutes: 0,
        rest_periods: []
      };

      const result = LaborRulesService.validateRestPeriodCompliance(timeEntry as any, 'CA');

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should be compliant with appropriate rest periods', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T17:00:00.000Z', // 8 hours
        duration_minutes: 480,
        break_minutes: 20,
        rest_periods: [
          { start: '2024-01-01T11:00:00.000Z', end: '2024-01-01T11:10:00.000Z', duration_minutes: 10 },
          { start: '2024-01-01T15:00:00.000Z', end: '2024-01-01T15:10:00.000Z', duration_minutes: 10 }
        ]
      };

      const result = LaborRulesService.validateRestPeriodCompliance(timeEntry as any, 'CA');

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should not enforce rest periods for non-CA states', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T17:00:00.000Z', // 8 hours
        duration_minutes: 480,
        break_minutes: 0,
        rest_periods: []
      };

      const result = LaborRulesService.validateRestPeriodCompliance(timeEntry as any, 'NY');

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('calculateMealPenaltyHours', () => {
    it('should calculate penalty hours for missed meal periods', () => {
      const violations = ['First meal period required for shifts over 5 hours'];
      const result = LaborRulesService.calculateMealPenaltyHours(violations);

      expect(result).toBe(1); // 1 hour penalty for each missed meal period
    });

    it('should calculate penalty hours for multiple violations', () => {
      const violations = [
        'First meal period required for shifts over 5 hours',
        'Second meal period required for shifts over 10 hours'
      ];
      const result = LaborRulesService.calculateMealPenaltyHours(violations);

      expect(result).toBe(2); // 1 hour penalty for each violation
    });

    it('should return 0 for no violations', () => {
      const violations: string[] = [];
      const result = LaborRulesService.calculateMealPenaltyHours(violations);

      expect(result).toBe(0);
    });
  });

  describe('processTimeEntryForLaborRules', () => {
    it('should process CA time entry and apply all rules', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T08:00:00.000Z',
        clock_out: '2024-01-01T19:00:00.000Z', // 11 hours
        duration_minutes: 660,
        break_minutes: 60,
        overtime_minutes: 0,
        meal_periods: [
          { start: '2024-01-01T12:00:00.000Z', end: '2024-01-01T12:30:00.000Z', duration_minutes: 30 },
          { start: '2024-01-01T16:00:00.000Z', end: '2024-01-01T16:30:00.000Z', duration_minutes: 30 }
        ],
        rest_periods: [
          { start: '2024-01-01T10:00:00.000Z', end: '2024-01-01T10:10:00.000Z', duration_minutes: 10 },
          { start: '2024-01-01T14:00:00.000Z', end: '2024-01-01T14:10:00.000Z', duration_minutes: 10 }
        ]
      };

      const result = LaborRulesService.processTimeEntryForLaborRules(timeEntry as any, 'CA');

      expect(result.overtime_minutes).toBe(180); // 3 hours overtime (11 - 8 = 3)
      expect(result.meal_period_compliant).toBe(true);
      expect(result.rest_period_compliant).toBe(true);
      expect(result.penalty_hours).toBe(0);
    });

    it('should process non-CA time entry without labor rules', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T08:00:00.000Z',
        clock_out: '2024-01-01T19:00:00.000Z', // 11 hours
        duration_minutes: 660,
        break_minutes: 0,
        overtime_minutes: 0,
        meal_periods: [],
        rest_periods: []
      };

      const result = LaborRulesService.processTimeEntryForLaborRules(timeEntry as any, 'NY');

      expect(result.overtime_minutes).toBe(0); // No overtime rules for NY
      expect(result.meal_period_compliant).toBe(true);
      expect(result.rest_period_compliant).toBe(true);
      expect(result.penalty_hours).toBe(0);
    });

    it('should calculate penalties for non-compliant CA time entry', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T08:00:00.000Z',
        clock_out: '2024-01-01T19:00:00.000Z', // 11 hours
        duration_minutes: 660,
        break_minutes: 0,
        overtime_minutes: 0,
        meal_periods: [], // Missing required meal periods
        rest_periods: [] // Missing required rest periods
      };

      const result = LaborRulesService.processTimeEntryForLaborRules(timeEntry as any, 'CA');

      expect(result.overtime_minutes).toBe(180); // 3 hours overtime
      expect(result.meal_period_compliant).toBe(false);
      expect(result.rest_period_compliant).toBe(false);
      expect(result.penalty_hours).toBeGreaterThan(0); // Penalties applied
    });
  });

  describe('getLaborRulesSummary', () => {
    it('should generate summary for CA user', () => {
      const summary = LaborRulesService.getLaborRulesSummary('CA');

      expect(summary.state).toBe('CA');
      expect(summary.daily_overtime_threshold).toBe(8);
      expect(summary.weekly_overtime_threshold).toBe(40);
      expect(summary.requires_meal_periods).toBe(true);
      expect(summary.requires_rest_periods).toBe(true);
      expect(summary.double_time_threshold).toBe(12);
    });

    it('should generate summary for non-CA user', () => {
      const summary = LaborRulesService.getLaborRulesSummary('NY');

      expect(summary.state).toBe('NY');
      expect(summary.daily_overtime_threshold).toBeNull();
      expect(summary.weekly_overtime_threshold).toBeNull();
      expect(summary.requires_meal_periods).toBe(false);
      expect(summary.requires_rest_periods).toBe(false);
      expect(summary.double_time_threshold).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle invalid duration gracefully', () => {
      const result = LaborRulesService.calculateOvertimeMinutes(-100, 'CA');
      expect(result).toBe(0);
    });

    it('should handle null meal periods', () => {
      const timeEntry = {
        id: 'test-entry',
        user_id: 'test-user',
        clock_in: '2024-01-01T09:00:00.000Z',
        clock_out: '2024-01-01T15:00:00.000Z',
        duration_minutes: 360,
        break_minutes: 0,
        meal_periods: null
      };

      const result = LaborRulesService.validateMealPeriodCompliance(timeEntry as any, 'CA');
      expect(result.compliant).toBe(false);
    });

    it('should handle undefined state gracefully', () => {
      const result = LaborRulesService.calculateOvertimeMinutes(540, undefined as any);
      expect(result).toBe(0);
    });

    it('should handle empty string state', () => {
      const result = LaborRulesService.calculateOvertimeMinutes(540, '');
      expect(result).toBe(0);
    });
  });
});