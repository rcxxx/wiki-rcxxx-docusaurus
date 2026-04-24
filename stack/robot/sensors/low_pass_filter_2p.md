---
id: robot-sensors-butter-worth-filter
title: 二阶巴特沃斯滤波器
sidebar_label: IIR LPF
---

## 概述
二阶低通滤波器（Low Pass Filter 2-Pole, LPF2P）是一种常用的数字信号处理工具，主要用于平滑信号，滤除高频噪声。在机器人领域，IMU 的加速度计和陀螺仪等传感器原始数据往往包含由电机振动或环境影响引起的高频抖动，使用低通滤波器可以提取出信号的主要趋势，为后续的姿态解算和控制算法提供更稳定的数据源

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/sensors/lpf.png)

## 原理

该滤波器的实现是基于其差分方程。一个二阶 IIR（无限脉冲响应）数字滤波器的通用差分方程为：
$$ y[n] = b_0x[n] + b_1x[n-1] + b_2x[n-2] - a_1y[n-1] - a_2y[n-2] $$
其中：
- $x[n]$ 是当前时刻的输入信号。
- $y[n]$ 是当前时刻的输出（滤波后）信号。
- $x[n-k]$ 和 $y[n-k]$ 分别是过去第 $k$ 个时刻的输入和输出。
- $a_k$ 和 $b_k$ 是滤波器的系数，它们的值由滤波器的类型（如 Butterworth）、截止频率和采样频率共同决定。

## 代码实现

<details>
<summary> low_pass_filter_2p.h</summary>

``` cpp
#ifndef LOW_PASS_FILTER_2P_H
#define LOW_PASS_FILTER_2P_H

#include <cmath>

namespace algorithm {

/**
 * @brief 二阶 Butter-worth 低通滤波器
 */
class Low_Pass_Filter2p {
public:
    Low_Pass_Filter2p() = default;

    Low_Pass_Filter2p(float sample_freq, float cutoff_freq);

    /**
     * @brief 设置滤波器参数
     * @param sample_freq 采样频率 (Hz)
     * @param cutoff_freq 截止频率 (Hz)
     */
    void set_cutoff_freq(float sample_freq, float cutoff_freq);

    /**
     * @brief 对输入样本进行滤波
     * @param sample 输入值
     * @return 滤波后的输出
     */
    float apply_filter(float sample);

    /**
     * @brief 重置滤波器状态
     * @param value 初始值（通常为当前输入值）
     */
    void reset(float sample);

private:
    float cutoff_freq_  = 0.0f;
    float sample_freq_  = 0.0f;
    float b0_           = 1.0f;
    float b1_           = 0.0f;
    float b2_           = 0.0f;
    float a1_           = 0.0f;
    float a2_           = 0.0f;
    float delay_1_      = 0.0f;
    float delay_2_      = 0.0f;
};

}   // namespace algorithm

#endif  // LOW_PASS_FILTER_2P_H
```

</details>

<details>
<summary> low_pass_filter_2p.cpp</summary>

``` cpp
#include "low_pass_filter_2p.h"

namespace algorithm {

Low_Pass_Filter2p::Low_Pass_Filter2p(float sample_freq, float cutoff_freq) {
    set_cutoff_freq(sample_freq, cutoff_freq);
    delay_1_ = delay_2_ = 0.0f;
}

void Low_Pass_Filter2p::set_cutoff_freq(float sample_freq, float cutoff_freq) {
    sample_freq_ = sample_freq;
    cutoff_freq_ = cutoff_freq;

    if (cutoff_freq_ <= 0.0f) {
        // 不进行滤波
        b0_ = 1.0f;
        b1_ = b2_ = a1_ = a2_ = 0.0f;
        return;
    }

    float fr        = sample_freq / cutoff_freq;
    float ohm       = tanf(M_PI / fr);
    float c         = 1.0f + 2.0f * cosf(M_PI_4) * ohm + ohm * ohm;
    
    b0_ = ohm * ohm / c;
    b1_ = 2.0f * b0_;
    b2_ = b0_;
    a1_ = 2.0f * (ohm * ohm - 1.0f) / c;
    a2_ = (1.0f - 2.0f * cosf(M_PI_4) * ohm + ohm * ohm) / c;
}

float Low_Pass_Filter2p::apply_filter(float sample) {
    if (cutoff_freq_ <= 0.0f) {
        return sample;
    }

    float delay_0   = sample - a1_ * delay_1_ - a2_ * delay_2_;
    float output    = b0_ * delay_0 + b1_ * delay_1_ + b2_ * delay_2_;

    delay_2_ = delay_1_;
    delay_1_ = delay_0;

    return output;
}

void Low_Pass_Filter2p::reset(float sample) {
    delay_1_ = delay_2_ = sample;
    apply_filter(sample);
}

}   // namespace algorithm
```

</details>

<details>
<summary> example.cpp</summary>

``` cpp
#include "low_pass_filter_2p.h"

int main() {
    // ...
    algorithm::Low_Pass_Filter2p lpf_4_accl[3];
    for (int i = 0; i < 3; ++i) {
        lpf_4_accl[i].set_cutoff_freq(250.f, 10.0f);  // sample_freq: 250Hz cutoff_freq: 9hz
    }
    // get curr_accl
    for (int i = 0; i < 3; ++i) {
        accl_lpf[i]   = lpf_4_accl[i].apply_filter(curr_accl[i]);
    }
    // ...
    
    return 0;
}
```

</details>

## 参数设置

### 采样频率 (`sample_freq`)
- **原则**: 采样频率必须 **等于** 你调用 `apply_filter()` 函数的频率，也就是你处理传感器数据的频率。
- **示例**:
  - 如果你在一个 `100Hz` 的 `while` 循环中读取传感器并调用滤波器，那么 `sample_freq` 就应该是 `100.0f`。
  - 如果你使用操作系统任务，设定其运行周期为 `2ms`，那么采样频率就是 `1.0 / 0.002 = 500Hz`。
- **重要性**: 这个参数的准确性至关重要。如果设置错误，滤波器的实际截止频率将会发生偏移，导致滤波效果不符合预期。根据奈奎斯特采样定理，采样频率必须至少是你想保留的信号最高频率的两倍。

### 截止频率 (`cutoff_freq`)

截止频率的选择是一个在 **信号平滑度** 和 **信号延迟** 之间的权衡。

- **高截止频率 (例如 30Hz, 45Hz)**
  - **效果**: 滤波器作用较弱，能滤除非常高频的噪声（如电流声、尖锐的机械振动），但会保留大部分信号的动态特性。
  - **优点**: 信号的 **响应快，延迟低**。适用于需要快速响应的控制系统，如无人机的姿态环。
  - **缺点**: 信号平滑效果一般，可能仍有部分抖动。

- **低截止频率 (例如 5Hz, 10Hz)**
  - **效果**: 滤波器作用很强，能得到非常平滑的信号曲线，几乎所有的高频抖动都会被滤除。
  - **优点**: 信号 **非常平滑、稳定**。适用于那些对信号稳定性要求高，而对实时性要求不那么极致的场景，例如机器人导航中的定位数据、速度估计等。
  - **缺点**: 会引入明显的 **信号延迟（相位滞后）**。如果将一个延迟过大的信号用于快速闭环控制，可能会导致系统振荡甚至失稳。

### 调参步骤与建议

1.  **确定 `sample_freq`**: 首先根据你的代码运行逻辑，确定调用滤波器的固定频率。
2.  **分析信号与噪声**: 使用调试工具（如串口打印、示波器、日志分析）观察原始信号的波形。
    - 估算你 **真正关心的信号** 的最高频率是多少？例如，对于一个移动机器人，其运动姿态的改变通常在 `10Hz` 以下。
    - 噪声主要集中在哪个频段？通常电机带来的振动在几十到上百赫兹。
3.  **设定初始 `cutoff_freq`**: 一个常用的初始值可以设定在你关心的信号最高频率的 **2~4倍** 左右。例如，如果你的机器人主要运动频率在 10Hz 以下，可以从 `20Hz` 或 `30Hz` 开始尝试。
4.  **迭代与观察**:
    - **如果输出信号仍然噪声很大**: 逐渐 **降低** `cutoff_freq` (例如从 30Hz -> 20Hz -> 15Hz)。
    - **如果输出信号响应太慢** (感觉“跟不上”实际变化): 逐渐 **提高** `cutoff_freq` (例如从 15Hz -> 20Hz -> 25Hz)。
5.  **找到平衡点**: 持续调整，直到找到一个既能有效抑制噪声，又不会引入不可接受的延迟的最佳点。


## 参考
- **[飞控中的IIR二阶滤波器](https://zhuanlan.zhihu.com/p/357619650)**
- **[低通滤波器的c++实现](https://blog.csdn.net/lovewubo/article/details/38487765)**
- **[滤波器设计之路（The road to filter-design）](https://github.com/TcheL/Road2Filter)**