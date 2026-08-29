export interface HealthInput {
    age: number;
    height: number;
    weight: number;
    targetWeight: number;
    gender: string;
  }
  
  export interface HealthResult {
    bmi: number;
    dailyCalories: number;
    targetDate: Date;
  }
  
  export function calculateHealthMetrics(input: HealthInput): HealthResult {
    // 边界验证
    if (input.height <= 0 || input.weight <= 0 || input.targetWeight <= 0) {
      throw new Error('身高、体重、目标体重必须大于0');
    }
    if (input.age < 10 || input.age > 120) {
      throw new Error('年龄必须在10-120之间');
    }
  
    const heightInMeters = input.height / 100;
    const bmi = input.weight / (heightInMeters * heightInMeters);
  
    let dailyCalories: number;
    if (input.gender === 'male') {
      dailyCalories = 10 * input.weight + 6.25 * input.height - 5 * input.age + 5;
    } else {
      dailyCalories = 10 * input.weight + 6.25 * input.height - 5 * input.age - 161;
    }
  
    const weightDiff = input.weight - input.targetWeight;
    const weeks = Math.abs(weightDiff) / 0.5;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeks * 7);
  
    return {
      bmi: Math.round(bmi * 10) / 10,
      dailyCalories: Math.round(dailyCalories),
      targetDate,
    };
  }