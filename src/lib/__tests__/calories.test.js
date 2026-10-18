import {
  ageFromBirthDate,
  applyAgeRule,
  applySafetyFloor,
  baseline,
  bmr,
  calorieTarget,
  dailyTarget,
  stepCalories,
} from '../calories';

describe('ageFromBirthDate', () => {
  it('counts whole years, the day before and on the birthday', () => {
    expect(ageFromBirthDate('2000-06-15', '2026-06-14')).toBe(25);
    expect(ageFromBirthDate('2000-06-15', '2026-06-15')).toBe(26);
  });
  it('accepts Date objects', () => {
    expect(ageFromBirthDate('2010-01-01', new Date(2026, 0, 1))).toBe(16);
  });
  it('rejects bad dates and future birth dates', () => {
    expect(() => ageFromBirthDate('15/06/2000', '2026-01-01')).toThrow();
    expect(() => ageFromBirthDate('2030-01-01', '2026-01-01')).toThrow('future');
  });
});

describe('bmr (Mifflin-St Jeor)', () => {
  it('male: 10w + 6.25h - 5a + 5', () => {
    expect(bmr({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 })).toBe(1780);
  });
  it('female: 10w + 6.25h - 5a - 161', () => {
    expect(bmr({ sex: 'female', weightKg: 60, heightCm: 165, age: 25 })).toBeCloseTo(1345.25);
  });
  it('rejects invalid input', () => {
    expect(() => bmr({ sex: 'other', weightKg: 60, heightCm: 165, age: 25 })).toThrow('sex');
    expect(() => bmr({ sex: 'male', weightKg: -1, heightCm: 165, age: 25 })).toThrow('weightKg');
    expect(() => bmr({ sex: 'male', weightKg: 60, heightCm: 0, age: 25 })).toThrow('heightCm');
    expect(() => bmr({ sex: 'male', weightKg: 60, heightCm: 165, age: NaN })).toThrow('age');
  });
});

describe('baseline', () => {
  it('is BMR x 1.2', () => {
    expect(baseline(1780)).toBeCloseTo(2136);
  });
  it('rejects non-positive BMR', () => {
    expect(() => baseline(0)).toThrow();
  });
});

describe('stepCalories', () => {
  it('is 0.04 kcal per step at 70 kg', () => {
    expect(stepCalories(10000, 70)).toBeCloseTo(400);
  });
  it('scales with body weight', () => {
    expect(stepCalories(10000, 35)).toBeCloseTo(200);
    expect(stepCalories(10000, 80)).toBeCloseTo(457.14, 1);
  });
  it('is zero with no steps and rejects negative steps', () => {
    expect(stepCalories(0, 70)).toBe(0);
    expect(() => stepCalories(-5, 70)).toThrow('steps');
  });
});

describe('dailyTarget', () => {
  it('adjusts maintenance by goal', () => {
    expect(dailyTarget({ maintenance: 2000, goal: 'lose' })).toBe(1500);
    expect(dailyTarget({ maintenance: 2000, goal: 'maintain' })).toBe(2000);
    expect(dailyTarget({ maintenance: 2000, goal: 'gain' })).toBe(2300);
  });
  it('rejects unknown goals', () => {
    expect(() => dailyTarget({ maintenance: 2000, goal: 'bulk' })).toThrow('goal');
  });
});

describe('applySafetyFloor', () => {
  it('lifts targets below 1500 (male) and 1200 (female)', () => {
    expect(applySafetyFloor(1400, 'male')).toBe(1500);
    expect(applySafetyFloor(1100, 'female')).toBe(1200);
  });
  it('leaves targets above the floor alone', () => {
    expect(applySafetyFloor(1800, 'male')).toBe(1800);
    expect(applySafetyFloor(1200, 'female')).toBe(1200);
  });
});

describe('applyAgeRule', () => {
  it('under 18 gets maintenance whatever the goal', () => {
    expect(applyAgeRule(1500, 16, 2000)).toBe(2000);
    expect(applyAgeRule(2300, 17, 2000)).toBe(2000);
  });
  it('18 and over keeps the goal target', () => {
    expect(applyAgeRule(1500, 18, 2000)).toBe(1500);
  });
});

describe('calorieTarget', () => {
  it('adds steps to the baseline for maintenance', () => {
    const r = calorieTarget({ sex: 'male', weightKg: 80, heightCm: 180, age: 30, goal: 'maintain', steps: 10000 });
    expect(r).toEqual({
      bmr: 1780, baseline: 2136, activity: 457, maintenance: 2593, target: 2593,
      minorRuleApplied: false, floorApplied: false,
    });
  });
  it('applies the safety floor after the goal', () => {
    const r = calorieTarget({ sex: 'female', weightKg: 60, heightCm: 165, age: 25, goal: 'lose' });
    expect(r.maintenance).toBe(1614);
    expect(r.target).toBe(1200);
    expect(r.floorApplied).toBe(true);
  });
  it('under 18 never gets a deficit', () => {
    const r = calorieTarget({ sex: 'male', weightKg: 60, heightCm: 170, age: 16, goal: 'lose', steps: 5000 });
    expect(r.target).toBe(r.maintenance);
    expect(r.target).toBe(2076);
    expect(r.minorRuleApplied).toBe(true);
    expect(r.floorApplied).toBe(false);
  });
});
