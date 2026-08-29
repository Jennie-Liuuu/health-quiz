import { describe, it, expect } from 'vitest';
import { calculateHealthMetrics } from './algorithm';

describe('健康评估算法单元测试', () => {
  // ===== 正常场景 =====
  it('应该正确计算 BMI、每日摄入量和目标日期（女性减重）', () => {
    const result = calculateHealthMetrics({
      age: 28,
      height: 165,
      weight: 65,
      targetWeight: 55,
      gender: 'female',
    });

    expect(result.bmi).toBeCloseTo(23.9, 1);
    expect(result.dailyCalories).toBeCloseTo(1380, 0);
    expect(result.targetDate).toBeInstanceOf(Date);
  });

  it('应该正确计算（男性增肌）', () => {
    const result = calculateHealthMetrics({
      age: 30,
      height: 180,
      weight: 70,
      targetWeight: 80,
      gender: 'male',
    });

    expect(result.bmi).toBeCloseTo(21.6, 1);
    expect(result.dailyCalories).toBeCloseTo(1680, 0);
  });

  // ===== 边界场景 =====
  it('应该处理身高正好 50cm 的边界值', () => {
    const result = calculateHealthMetrics({
      age: 20,
      height: 50,
      weight: 20,
      targetWeight: 18,
      gender: 'female',
    });
    expect(result.bmi).toBeDefined();
  });

  it('应该处理身高正好 300cm 的边界值', () => {
    const result = calculateHealthMetrics({
      age: 20,
      height: 300,
      weight: 100,
      targetWeight: 90,
      gender: 'male',
    });
    expect(result.bmi).toBeDefined();
  });

  it('应该处理年龄正好 10 岁的边界值', () => {
    const result = calculateHealthMetrics({
      age: 10,
      height: 140,
      weight: 35,
      targetWeight: 30,
      gender: 'female',
    });
    expect(result.bmi).toBeDefined();
  });

  it('应该处理年龄正好 120 岁的边界值', () => {
    const result = calculateHealthMetrics({
      age: 120,
      height: 160,
      weight: 50,
      targetWeight: 48,
      gender: 'male',
    });
    expect(result.bmi).toBeDefined();
  });

  // ===== 非法输入 =====
  it('应该拒绝身高为 0', () => {
    expect(() =>
      calculateHealthMetrics({
        age: 20,
        height: 0,
        weight: 60,
        targetWeight: 55,
        gender: 'female',
      })
    ).toThrow('身高、体重、目标体重必须大于0');
  });

  it('应该拒绝身高为负数', () => {
    expect(() =>
      calculateHealthMetrics({
        age: 20,
        height: -165,
        weight: 60,
        targetWeight: 55,
        gender: 'female',
      })
    ).toThrow('身高、体重、目标体重必须大于0');
  });

  it('应该拒绝体重为 0', () => {
    expect(() =>
      calculateHealthMetrics({
        age: 20,
        height: 165,
        weight: 0,
        targetWeight: 55,
        gender: 'female',
      })
    ).toThrow('身高、体重、目标体重必须大于0');
  });

  it('应该拒绝目标体重为负数', () => {
    expect(() =>
      calculateHealthMetrics({
        age: 20,
        height: 165,
        weight: 60,
        targetWeight: -55,
        gender: 'female',
      })
    ).toThrow('身高、体重、目标体重必须大于0');
  });

  it('应该拒绝年龄小于 10 岁', () => {
    expect(() =>
      calculateHealthMetrics({
        age: 5,
        height: 165,
        weight: 60,
        targetWeight: 55,
        gender: 'female',
      })
    ).toThrow('年龄必须在10-120之间');
  });

  it('应该拒绝年龄大于 120 岁', () => {
    expect(() =>
      calculateHealthMetrics({
        age: 150,
        height: 165,
        weight: 60,
        targetWeight: 55,
        gender: 'female',
      })
    ).toThrow('年龄必须在10-120之间');
  });

  // ===== 极端但合理 =====
  it('应该处理极度偏瘦（BMI < 15）', () => {
    const result = calculateHealthMetrics({
      age: 25,
      height: 170,
      weight: 40,
      targetWeight: 45,
      gender: 'female',
    });
    expect(result.bmi).toBeLessThan(15);
  });

  it('应该处理极度超重（BMI > 35）', () => {
    const result = calculateHealthMetrics({
      age: 25,
      height: 170,
      weight: 120,
      targetWeight: 100,
      gender: 'male',
    });
    expect(result.bmi).toBeGreaterThan(35);
  });

  it('应该处理目标体重远低于当前体重（减重大目标）', () => {
    const result = calculateHealthMetrics({
      age: 30,
      height: 165,
      weight: 80,
      targetWeight: 50,
      gender: 'female',
    });
    expect(result.targetDate).toBeInstanceOf(Date);
    const weeks = (80 - 50) / 0.5;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + weeks * 7);
    expect(result.targetDate.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
  });
});