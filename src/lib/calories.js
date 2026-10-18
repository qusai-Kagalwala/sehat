/**
 * Calorie maths. Pure functions only: no React, no database, no Date.now().
 * Everything the UI shows about calories must come from here.
 */

export const ACTIVITY_FACTOR = 1.2; // sedentary baseline on top of BMR
export const KCAL_PER_STEP_AT_70KG = 0.04;
export const REFERENCE_WEIGHT_KG = 70;
export const GOAL_ADJUSTMENT = { lose: -500, maintain: 0, gain: 300 };
export const SAFETY_FLOOR = { male: 1500, female: 1200 };
export const ADULT_AGE = 18;

const SEXES = ['male', 'female'];

function assertSex(sex) {
  if (!SEXES.includes(sex)) throw new Error(`sex must be "male" or "female", got ${sex}`);
}

function assertPositive(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number, got ${value}`);
  }
}

function assertNonNegative(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be zero or more, got ${value}`);
  }
}

function parseDate(value) {
  if (value instanceof Date) return { y: value.getFullYear(), m: value.getMonth() + 1, d: value.getDate() };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) throw new Error(`date must be YYYY-MM-DD, got ${value}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** Whole years between a birth date and today (both 'YYYY-MM-DD' or Date). */
export function ageFromBirthDate(birthDate, today) {
  const b = parseDate(birthDate);
  const t = parseDate(today);
  let age = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.d < b.d)) age -= 1;
  if (age < 0) throw new Error('birth date is in the future');
  return age;
}

/** Basal metabolic rate, Mifflin-St Jeor (kcal/day). */
export function bmr({ sex, weightKg, heightCm, age }) {
  assertSex(sex);
  assertPositive('weightKg', weightKg);
  assertPositive('heightCm', heightCm);
  assertPositive('age', age);
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/** Calories burned on a sedentary day: BMR x 1.2. */
export function baseline(bmrKcal) {
  assertPositive('bmr', bmrKcal);
  return bmrKcal * ACTIVITY_FACTOR;
}

/** Rough calories burned by walking: 0.04 kcal per step at 70 kg, scaled by body weight. */
export function stepCalories(steps, weightKg) {
  assertNonNegative('steps', steps);
  assertPositive('weightKg', weightKg);
  return steps * KCAL_PER_STEP_AT_70KG * (weightKg / REFERENCE_WEIGHT_KG);
}

/** Maintenance adjusted for the goal: lose -500, maintain 0, gain +300. */
export function dailyTarget({ maintenance, goal }) {
  assertPositive('maintenance', maintenance);
  if (!(goal in GOAL_ADJUSTMENT)) throw new Error(`goal must be lose, maintain or gain, got ${goal}`);
  return maintenance + GOAL_ADJUSTMENT[goal];
}

/** Never go below 1500 kcal (male) or 1200 kcal (female). */
export function applySafetyFloor(target, sex) {
  assertSex(sex);
  assertPositive('target', target);
  return Math.max(target, SAFETY_FLOOR[sex]);
}

/** Under 18: no deficit or surplus, the target is maintenance. */
export function applyAgeRule(target, age, maintenance) {
  assertPositive('target', target);
  assertPositive('age', age);
  assertPositive('maintenance', maintenance);
  return age < ADULT_AGE ? maintenance : target;
}

/**
 * The full daily picture, rounded to whole kcal for display.
 * Order: BMR → baseline → + steps = maintenance → goal → under-18 rule → safety floor.
 */
export function calorieTarget({ sex, weightKg, heightCm, age, goal, steps = 0 }) {
  const bmrKcal = bmr({ sex, weightKg, heightCm, age });
  const baselineKcal = baseline(bmrKcal);
  const activityKcal = stepCalories(steps, weightKg);
  const maintenance = baselineKcal + activityKcal;
  const goalTarget = dailyTarget({ maintenance, goal });
  const ageTarget = applyAgeRule(goalTarget, age, maintenance);
  const target = applySafetyFloor(ageTarget, sex);
  return {
    bmr: Math.round(bmrKcal),
    baseline: Math.round(baselineKcal),
    activity: Math.round(activityKcal),
    maintenance: Math.round(maintenance),
    target: Math.round(target),
    minorRuleApplied: ageTarget !== goalTarget,
    floorApplied: target !== ageTarget,
  };
}
