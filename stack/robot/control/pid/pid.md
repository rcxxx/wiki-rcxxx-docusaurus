---
id: classic-pid
title: 经典 PID 控制算法 && C++ 实现
sidebar_label: PID
---

## 算法公式

$$
u(t) = K_p \cdot e(t) + K_i \cdot \int_{0}^{t}e(t)dt + K_d \cdot \frac{\Delta e(t)}{dt}
$$

$K_p$、$K_i$、$K_d$ 三个参数分别对应比例、积分、微分三个环节，实际使用中将 t 离散为一个个的点来处理，误差 e 表示 `t` 时刻目标值与测量值的差至

### 比例（Proportional）
比例环节将 `t` 时刻的误差乘以系数 $K_p$，作为比例环节的输出，系数越大，调整越快，也会使系统出现震荡

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/pid/kp.png)

### 积分（Integral）
积分环节将 `0 ~ t` 时刻所有差值的累计值乘以系数 $K_i$，作为积分环节的输出值，随着时间的增加，积分项会增大，控制器的输出也会增大，使稳态误差减小，直至为零，系数越大，达到稳态的过渡时间也越短，也会带来更大的超调

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/pid/ki.png)


### 微分（Derivative）
微分环节 $\Delta e(t)/dt$ 表示 `t` 时刻的误差与上一时刻 `t-1` 的误差的差值除以时间 dt，再乘以系数 $K_d$，作为微分环节的输出，反映了误差的变化率，误差随时间变化时，微分环节可以反映下一时刻误差的变化，从而减小控制器的输出，抑制超调

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/pid/kd.png)

## C++ 代码实现
``` cpp
class PID_Controller
{
private:
    float Kp_           = 0.f;
    float Ki_           = 0.f;
    float Kd_           = 0.f;
    float integral_     = 0.f;
    float last_error_   = 0.f;
    float output_       = 0.f;

public:
    PID_Controller() = default;

    void init(float kp, float ki, float kd) {
        Kp_         = kp;
        Ki_         = ki;
        Kd_         = kd;
        integral_   = 0.f;
        last_error_ = 0.f;
        output_     = 0.f;
    }

    void reset()
    {
        integral_   = 0.f;
        last_error_ = 0.f;
        prev_error_ = 0.f;
        output_     = 0.f;
    }
    
    void update(float target, float measurement, float dt){
        float error = target - measurement;
        integral_ += error * dt;
        output_ = (Kp_ * error) + \
                  (Ki_ * integral_) + \
                  (Kd_ * (error - last_error_) / dt);

        last_error_ = error;
    }

    float get_Output() { return output_; }
};
```

**实际使用中的 PID 还需要根据实际情况进行优化，例如输出限幅，积分限幅等等**
- [`PID 控制算法优化`](../pid/pid-optimization.md)

## 参考
- **[简易PID算法的快速扫盲（超详细+过程推导+C语言程序）](https://zhuanlan.zhihu.com/p/168751613)**
- **[动画展示PID参数作用——在MATLAB中用代码动态分析](https://zhuanlan.zhihu.com/p/187353410)**