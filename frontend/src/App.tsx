import { useState, useEffect } from 'react';
import { apiClient } from './api/client';
import './index.css';

// 安全存储工具
const safeStorage = {
  getItem: (key: string) => {
    try {
      return sessionStorage.getItem(key) || '';
    } catch {
      return '';
    }
  },
  setItem: (key: string, value: string) => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // 忽略
    }
  },
};

function App() {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState(safeStorage.getItem('sessionId'));
  
  // Step 1
  const [gender, setGender] = useState('');
  const [goal, setGoal] = useState('');
  
  // Step 2
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  
  // Step 3
  const [frequency, setFrequency] = useState('');
  
  // Result
  const [result, setResult] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // 加载进度
  useEffect(() => {
    const loadProgress = async () => {
      if (!sessionId) return;
      
      try {
        const res = await apiClient.get('/api/progress');
        const data = res.data;
        
        if (data.exists) {
          if (data.step1_completed) {
            setGender(data.data.gender || '');
            setGoal(data.data.goal || '');
          }
          if (data.step2_completed) {
            setAge(data.data.age?.toString() || '');
            setHeight(data.data.height?.toString() || '');
            setWeight(data.data.weight?.toString() || '');
            setTargetWeight(data.data.targetWeight?.toString() || '');
          }
          if (data.step3_completed) {
            setFrequency(data.data.frequency || '');
          }
          
          if (data.step3_completed) setStep(4);
          else if (data.step2_completed) setStep(3);
          else if (data.step1_completed) setStep(2);
        }
      } catch (error) {
        console.error('加载进度失败:', error);
      }
    };
    
    loadProgress();
  }, [sessionId]);

  // Step 1: 保存性别和目标
  const saveStep1 = async () => {
    try {
      const res = await apiClient.post('/api/step/gender', {
        gender,
        goal,
        sessionId: sessionId || undefined,
      });
      
      const newSessionId = res.data.sessionId;
      setSessionId(newSessionId);
      safeStorage.setItem('sessionId', newSessionId);
      setStep(2);
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  // Step 2: 保存身体数据
  const saveStep2 = async () => {
    if (!sessionId) {
      alert('请先完成第一步');
      return;
    }
    
    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const targetNum = parseFloat(targetWeight);
    
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      alert('请输入有效年龄（10-120）');
      return;
    }
    if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
      alert('请输入有效身高（50-300cm）');
      return;
    }
    if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
      alert('请输入有效体重（20-500kg）');
      return;
    }
    if (isNaN(targetNum) || targetNum < 20 || targetNum > 500) {
      alert('请输入有效目标体重（20-500kg）');
      return;
    }
    
    try {
      await apiClient.post('/api/step/body', {
        sessionId,
        age: ageNum,
        height: heightNum,
        weight: weightNum,
        targetWeight: targetNum,
      });
      setStep(3);
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  // Step 3: 保存运动频率并计算结果
  const saveStep3AndCalculate = async () => {
    if (!sessionId) {
      alert('请先完成前面的步骤');
      return;
    }
    
    try {
      await apiClient.post('/api/step/frequency', {
        sessionId,
        frequency,
      });
      
      const res = await apiClient.get('/api/result');
      setResult(res.data);
      setIsSubscribed(res.data.isSubscribed);
      setStep(4);
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  // 模拟支付
  const handlePay = async () => {
    if (!sessionId) {
      alert('请先完成测评');
      return;
    }
    
    try {
      const res = await apiClient.post('/api/pay', { sessionId });
      if (res.data.success) {
        setIsSubscribed(true);
        const resultRes = await apiClient.get('/api/result');
        setResult(resultRes.data);
        alert('支付成功！已解锁完整数据');
      }
    } catch (error) {
      alert('支付失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-6">开始你的健康测评</h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">性别</label>
                <div className="flex gap-4">
                  <button
                    className={`px-4 py-2 rounded ${gender === 'female' ? 'bg-pink-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setGender('female')}
                  >
                    女性
                  </button>
                  <button
                    className={`px-4 py-2 rounded ${gender === 'male' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setGender('male')}
                  >
                    男性
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">目标</label>
                <select
                  className="w-full p-2 border rounded"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="">请选择</option>
                  <option value="lose_weight">减重</option>
                  <option value="build_muscle">增肌</option>
                  <option value="keep_fit">保持健康</option>
                </select>
              </div>
              <button
                className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 disabled:bg-gray-300"
                disabled={!gender || !goal}
                onClick={saveStep1}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-6">输入身体数据</h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">年龄</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  placeholder="10-120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">身高 (cm)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  placeholder="50-300"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">体重 (kg)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  placeholder="20-500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">目标体重 (kg)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  placeholder="20-500"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600"
                onClick={saveStep2}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-6">运动频率</h1>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                {['1-2', '3-4', '5+'].map((freq) => (
                  <button
                    key={freq}
                    className={`p-3 rounded border ${frequency === freq ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => setFrequency(freq)}
                  >
                    每周 {freq} 次
                  </button>
                ))}
              </div>
              <button
                className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 disabled:bg-gray-300"
                disabled={!frequency}
                onClick={saveStep3AndCalculate}
              >
                查看结果
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div>
            <h1 className="text-2xl font-bold mb-6">测评结果</h1>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>BMI:</strong> {result.data.bmi}</p>
                {isSubscribed ? (
                  <>
                    <p><strong>每日建议摄入量:</strong> {result.data.dailyCalories} kcal</p>
                    <p><strong>目标达成日期:</strong> {new Date(result.data.targetDate).toLocaleDateString()}</p>
                    <p><strong>个性化计划:</strong> {result.data.weeklyPlan}</p>
                    <div className="mt-4 p-3 bg-green-100 rounded text-green-800">
                      ✅ 您是会员，已解锁全部数据
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-yellow-100 rounded text-yellow-800">
                      🔒 {result.data.message}
                    </div>
                    <button
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded hover:opacity-90"
                      onClick={handlePay}
                    >
                      升级会员 ¥99/月
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;