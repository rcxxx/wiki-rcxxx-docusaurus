---
id: robot_mahony_filter_attitude_fusion
title: Mahony Filter 互补滤波姿态解算
sidebar_label: Mahony
---

## 概述
移动机器人与无人机领域，姿态估计是一项基础的技术，其目标是确定机器人在三维空间中的朝向与姿态，通常表示为滚转角（Roll）、俯仰角（Pitch）和偏航角（Yaw）。

### IMU传感器特性
姿态估计通常依赖于惯性测量单元 (IMU)，主要包含以下两种传感器。
- **加速度计（Accelerometer）** ：重力和运动加速度。
  - *优点* ：长期来看没有累积误差，低频特性好，可以提供绝对基准（Roll 和 Pitch）。
  - *缺点* ：对高频振动和运动加速度非常敏感，短期内噪声很大。
- **陀螺仪（Gyroscope）** ：测量机体绕各轴的角速度。
  - *优点* ：动态响应快，高频特性好，短期测量非常精确，不受外界振动影响。
  - *缺点* ：存在固有的零偏（Bias），对角速度进行积分时，零偏会随时间不断累积，导致姿态计算发生 “漂移”。

### 互补滤波的核心思想
- 利用陀螺仪的积分来获取短期的高频姿态变化（快速响应）。
- 利用加速度计测量的重力方向来校正陀螺仪的低频漂移（消除累积误差）。

### Mahony 算法
Mahony 互补滤波算法是由 Robert Mahony 等人提出的一种基于特殊正交群 SO(3) 及其李代数的非线性互补滤波器。它使用四元数来表示姿态，并利用 PI（比例-积分）控制器来融合传感器数据。
- **对比 EKF（扩展卡尔曼滤波）** ：Mahony 算法计算量极小，非常适合在计算资源受限的嵌入式系统上运行，对于一般的机器人姿态估计已足够精确
- **对比 EKF（扩展卡尔曼滤波）** ：Mahony 算法参数更直观。———— Madgwick 基于梯度下降法进行优化。

## 数学基础

### 坐标系约定
要描述姿态，我们需要定义两个坐标系，并描述它们之间的旋转关系：
- **机体坐标系（Body Frame, $b$ 系）** ：固联在机器人上的坐标系。本代码中采用 **FLU（前-左-上，Forward-Left-Up）** 约定。即 X 轴指向机头前方，Y 轴指向机身左侧，Z 轴指向上方。
- **导航坐标系（Navigation Frame, $n$ 系）** ：固定在地球上的参考系。与 FLU 机体系对应的导航系通常是 **ENU（东-北-天，East-North-Up）** 。在这个约定下，重力向量方向是沿着 Z 轴负方向，但在很多飞控习惯中，为方便计算，重力向量常被表示为 $g_n = [0, 0, 1]^T$ （归一化），具体取决于代码的投影假设。

姿态估计的目的就是求出从 **导航系到机体系** （或反过来）的旋转转换关系。

### 旋转矩阵
**方向余弦矩阵（Direction Cosine Matrix, DCM）** 是一种 $3 \times 3$ 的正交矩阵 $R$ ，满足 $R^T R = I$ 且 $\det(R) = 1$ 。
它可以将一个向量从导航系 $n$ 旋转到机体系 $b$ ：
$$ v_b = R_n^b \cdot v_n $$

绕各个基本坐标轴的旋转矩阵如下（遵循右手螺旋定则）：
绕 X 轴旋转 $\phi$ (Roll)：
$$ R_x(\phi) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\phi & \sin\phi \\ 0 & -\sin\phi & \cos\phi \end{bmatrix} $$
绕 Y 轴旋转 $\theta$ (Pitch)：
$$ R_y(\theta) = \begin{bmatrix} \cos\theta & 0 & -\sin\theta \\ 0 & 1 & 0 \\ \sin\theta & 0 & \cos\theta \end{bmatrix} $$
绕 Z 轴旋转 $\psi$ (Yaw)：
$$ R_z(\psi) = \begin{bmatrix} \cos\psi & \sin\psi & 0 \\ -\sin\psi & \cos\psi & 0 \\ 0 & 0 & 1 \end{bmatrix} $$

**复合旋转** 通常按照特定的顺序进行，如 **ZYX 顺序** ，则总的旋转矩阵为：
$$ R = R_x(\phi) R_y(\theta) R_z(\psi) $$

### 欧拉角
欧拉角是最直观的姿态表示方法，由三次绕不同轴的旋转角度组成：
- **Roll ($\phi$)** ：翻滚角，绕 X 轴的旋转。
- **Pitch ($\theta$)** ：俯仰角，绕 Y 轴的旋转。
- **Yaw ($\psi$)** ：偏航角，绕 Z 轴的旋转。

**万向锁问题（Gimbal Lock）** ：
当 $\theta = \pm 90^\circ$ 时（即机头垂直朝上或朝下），第一次绕 Z 轴的旋转和第三次绕 X 轴的旋转实际上是在同一个物理平面上进行的。此时系统丢失了一个自由度，无法区分 Roll 和 Yaw，导致数学上的奇点。我们需要引入四元数来进行姿态解算，避免在极端姿态下算法崩溃。

### 四元数

#### 定义
四元数（Quaternion）是复数的扩展，形式为：
$$ q = q_0 + q_1 i + q_2 j + q_3 k $$
其中 $q_0$ 是标量部分， $(q_1, q_2, q_3)$ 是向量部分。
满足基本虚数单位规则： $i^2 = j^2 = k^2 = ijk = -1$ 。
四元数也可以写成向量形式： $q = [q_0, q_1, q_2, q_3]^T$ 。

#### 基本运算
- **加法** ：按分量相加。
- **乘法（Hamilton积）** ：设 $p = [p_0, \mathbf{p}], q = [q_0, \mathbf{q}]$ ，则
  $$ p \otimes q = [p_0 q_0 - \mathbf{p} \cdot \mathbf{q}, \quad p_0 \mathbf{q} + q_0 \mathbf{p} + \mathbf{p} \times \mathbf{q}] $$
  展开后是一个复杂的矩阵乘积过程。注意四元数乘法 **不满足交换律** 。
- **共轭（Conjugate）** ： $q^* = q_0 - q_1 i - q_2 j - q_3 k$
- **模（Norm）** ： $|q| = \sqrt{q_0^2 + q_1^2 + q_2^2 + q_3^2}$
- **逆（Inverse）** ： $q^{-1} = \frac{q^*}{|q|^2}$
- **单位四元数约束** ：表示旋转的四元数必须满足 $|q| = 1$ 。此时 $q^{-1} = q^*$ 。

#### 四元数表示旋转
任何一个绕单位轴 $\mathbf{u} = [u_x, u_y, u_z]$ 旋转角度 $\theta$ 的操作，可以用一个单位四元数表示：
$$ q = \cos(\frac{\theta}{2}) + \sin(\frac{\theta}{2}) (u_x i + u_y j + u_z k) $$
将一个纯向量 $\mathbf{v} = [0, v_x, v_y, v_z]$ 进行旋转，操作为：
$$ \mathbf{v}' = q \otimes \mathbf{v} \otimes q^* $$

#### 四元数 $\rightarrow$ DCM 转换
通过上述旋转公式，可以推导出四元数对应的 $3 \times 3$ 旋转矩阵（从导航系到机体系）：
$$ R(q) = \begin{bmatrix}
q_0^2+q_1^2-q_2^2-q_3^2 & 2(q_1q_2 + q_0q_3) & 2(q_1q_3 - q_0q_2) \\
2(q_1q_2 - q_0q_3) & q_0^2-q_1^2+q_2^2-q_3^2 & 2(q_2q_3 + q_0q_1) \\
2(q_1q_3 + q_0q_2) & 2(q_2q_3 - q_0q_1) & q_0^2-q_1^2-q_2^2+q_3^2
\end{bmatrix} $$
注意，由于 $|q| = 1$ ，对角线元素可以化简。特别是矩阵的 **第三列** ：
$$ R_{col3} = \begin{bmatrix} 2(q_1q_3 - q_0q_2) \\ 2(q_2q_3 + q_0q_1) \\ q_0^2-q_1^2-q_2^2+q_3^2 \end{bmatrix} $$
这正是导航系中的重力向量 $g_n = [0, 0, 1]^T$ 旋转到机体系后的投影！这点在后面的重力估计中极其重要。

#### 四元数 $\rightarrow$ 欧拉角转换
将上述 $R(q)$ 与由 ZYX 欧拉角构造的 DCM 相对应，可求解出欧拉角：
- $\phi = \text{atan2}(2(q_0q_1 + q_2q_3), 1 - 2(q_1^2 + q_2^2))$
- $\theta = \arcsin(2(q_0q_2 - q_3q_1))$
- $\psi = \text{atan2}(2(q_0q_3 + q_1q_2), 1 - 2(q_2^2 + q_3^2))$

### 四元数微分方程
我们要利用陀螺仪测量的角速度 $\boldsymbol{\omega} = [\omega_x, \omega_y, \omega_z]$ 来更新姿态。
构造纯四元数 $\omega_q = 0 + \omega_x i + \omega_y j + \omega_z k$ 。
根据刚体运动学，单位四元数对时间的导数为：
$$ \dot{q} = \frac{1}{2} q \otimes \omega_q $$
展开 Hamilton 积，得到微分方程的矩阵形式：
$$ \begin{bmatrix} \dot{q_0} \\ \dot{q_1} \\ \dot{q_2} \\ \dot{q_3} \end{bmatrix} = \frac{1}{2} \begin{bmatrix} 0 & -\omega_x & -\omega_y & -\omega_z \\ \omega_x & 0 & \omega_z & -\omega_y \\ \omega_y & -\omega_z & 0 & \omega_x \\ \omega_z & \omega_y & -\omega_x & 0 \end{bmatrix} \begin{bmatrix} q_0 \\ q_1 \\ q_2 \\ q_3 \end{bmatrix} $$
分量形式即为代码中使用的更新公式的基础：
- $\dot{q_0} = \frac{1}{2}(-q_1\omega_x - q_2\omega_y - q_3\omega_z)$
- $\dot{q_1} = \frac{1}{2}( q_0\omega_x + q_2\omega_z - q_3\omega_y)$
- $\dot{q_2} = \frac{1}{2}( q_0\omega_y - q_1\omega_z + q_3\omega_x)$
- $\dot{q_3} = \frac{1}{2}( q_0\omega_z + q_1\omega_y - q_2\omega_x)$

---

## Mahony 互补滤波原理
**问题建模**

- **目标** ：从 IMU 的加速度和角速度数据，估计当前的单位四元数 $q$ 。
- **测量数据** ：
  - 加速度计： $\mathbf{a}_{meas} = [a_x, a_y, a_z]$ （归一化后）。它近似代表了机体系下的“反重力”方向。
  - 陀螺仪： $\boldsymbol{\omega}_{gyro} = [\omega_x, \omega_y, \omega_z]$ 。

### 重力方向估计
我们利用 **上一时刻的姿态估计值 $q$** ，将导航系下的重力向量 $g_n = [0, 0, 1]^T$ 旋转到当前的机体系下，得到估计的重力向量 $\mathbf{v}_{hat}$ 。
根据 2.4.4 节中的矩阵推导， $\mathbf{v}_{hat}$ 等于 DCM 的第三列：
$$ \mathbf{v}_{hat} = \begin{bmatrix} 2(q_1q_3 - q_0q_2) \\ 2(q_2q_3 + q_0q_1) \\ q_0^2-q_1^2-q_2^2+q_3^2 \end{bmatrix} $$

为了节省乘法运算，Mahony 将上式整体提取了因子 2，方便与设定的增益 towKp，towKi 合并吸收

```cpp
halfvx = q1_ * q3_ - q0_ * q2_;
halfvy = q0_ * q1_ + q2_ * q3_;
halfvz = q0_ * q0_ - 0.5f + q3_ * q3_;
```
这里 halfvz 是这么推导的
$$ \frac{1}{2}\bigl(q_0^2+q_3^2 - (q_1^2+q_2^2)\bigr)
= (q_0^2+q_3^2) - \frac{1}{2}\bigl(q_0^2+q_1^2+q_2^2+q_3^2\bigr) \\
= q_0^2+q_3^2-0.5 $$

### 误差度量：叉积
现在我们在机体系下有了两个方向向量：
- **测量重力** ：归一化后的 $\mathbf{a}_{meas} = [a_x, a_y, a_z]$
- **估计重力** ：刚才算出的 $\mathbf{v}_{hat}$ （在代码中是其一半 `halfv` ）

如何度量两者的误差？Mahony 算法巧妙地使用了 **向量叉积** ：
$$ \mathbf{e} = \mathbf{a}_{meas} \times \mathbf{v}_{hat} $$
**几何意义** ：
- 叉积的大小 $|\mathbf{e}| = |\mathbf{a}| \cdot |\mathbf{v}| \cdot \sin(\theta_{err})$ 。在误差角度 $\theta_{err}$ 较小时， $\sin(\theta_{err}) \approx \theta_{err}$ ，因此叉积的大小近似成正比于角度误差。
- 叉积的方向垂直于 $\mathbf{a}$ 和 $\mathbf{v}$ 构成的平面，这正是一个 **旋转轴** ，指示了应该绕哪个轴去旋转 $\mathbf{v}_{hat}$ 才能使它与 $\mathbf{a}_{meas}$ 对齐！
- 旋转轴与角速度同属于 SO(3) 空间的李代数，物理量纲匹配，可以直接用于修正角速度。

代码中计算的是叉积的一半：
```cpp
halfex = (ay * halfvz - az * halfvy);
halfey = (az * halfvx - ax * halfvz);
halfez = (ax * halfvy - ay * halfvx);
```

### PI 控制器
我们利用计算出的误差向量 $\mathbf{e}$ 来修正陀螺仪的角速度，采用经典的 PI（比例-积分）控制：
- **比例项（P）** ： $\boldsymbol{\omega}_{corr\_P} = K_p \cdot \mathbf{e}$ 。立即响应当前误差。
- **积分项（I）** ： $\boldsymbol{\omega}_{corr\_I} = \int (K_i \cdot \mathbf{e}) dt$ 。累积历史误差，用于消除陀螺仪固有的常值零偏（Bias）。代码中引入了积分限幅 `clamp3` 防止积分饱和（Windup）。

最终修正后的角速度为：
$$ \boldsymbol{\omega} = \boldsymbol{\omega}_{gyro} + K_p \mathbf{e} + K_i \int \mathbf{e} dt $$

**关于参数 `twoKp` 和 `twoKi`** ：
因为我们在前面计算重力和误差时，省略了系数 2（使用了 `halfv` 和 `halfe` ），真实的误差向量其实是代码中 `halfe` 的 2 倍。
因此修正公式变为：
$$ \boldsymbol{\omega}_{corr} = K_p \cdot (2 \cdot \mathbf{e}_{half}) + K_i \int (2 \cdot \mathbf{e}_{half}) dt $$
为了代码计算效率，直接定义参数 `twoKp` $= 2K_p$ ， `twoKi` $= 2K_i$ 。

### 四元数更新（一阶欧拉积分）
有了修正后的角速度 $\boldsymbol{\omega} = [g_x, g_y, g_z]$ ，我们利用 2.5 节的微分方程进行数值积分更新姿态。
采用简单高效的一阶欧拉积分：
$$ q_{k+1} = q_k + \dot{q} \cdot \Delta t = q_k + (\frac{1}{2} q_k \otimes \boldsymbol{\omega}_q) \Delta t $$
代码实现中的优化：由于都有 $\frac{1}{2} \Delta t$ ，可以先将其乘到角速度上：
```cpp
const float half_dt = 0.5f * dt;
gx *= half_dt; gy *= half_dt; gz *= half_dt;
```
然后再代入微分方程的分量形式：
```cpp
qa = q0_; qb = q1_; qc = q2_;
q0_ += (-qb * gx - qc * gy - q3_ * gz);
q1_ += ( qa * gx + qc * gz - q3_ * gy);
// ...
```
积分后，由于数值误差，四元数的模长会偏离 1，因此必须进行 **重新归一化** （除以自身的模长）。

### 增益与时间常数的关系
参考 *[Mahony航姿算法的参数调节方法](https://zhuanlan.zhihu.com/p/582694093)* 一文，
在 `cal_Mahony_Gains` 函数中，算法提供了一种基于时间常数 $\tau$ 来设定 $K_p, K_i$ 的方法。
将互补滤波器看作一个典型的二阶线性系统，其特征方程为 $s^2 + K_p s + K_i = 0$ 。
为了让系统没有震荡且响应最快，通常配置为 **临界阻尼** ，此时极点在负实轴重合，设为 $-\beta$ 。
特征方程变为 $(s+\beta)^2 = s^2 + 2\beta s + \beta^2 = 0$ 。
由此得出：
$$ K_p = 2\beta, \quad K_i = \beta^2 $$
而 $\beta$ 与系统响应时间常数 $\tau$ 之间存在经验对应关系： $\beta \approx \frac{2.146}{\tau}$ 。
因此，给定所需的滤波时间常数（即系统信任陀螺仪积分的持续时间段），就可以自动推算出相应的 PI 增益。代码中的 `kp_scale` 和 `ki_scale` 是为了提供额外的微调能力。

#### 调参经验
- **确定 $\tau$ (时间常数)**
  - 机体震动大，增大 $\tau$ 更信任 gyro ，抗震动效果更好。
  - 漂移很快，减小 $\tau$ 更信任 accl ，更依赖加速度计修正。

- **微调 `kp_scale` 和 `ki_scale`**
  - 如果姿态收敛太慢，可以适当增大 `kp_scale`。
  - 如果静止时姿态存在常态误差无法归零，适当增大 `ki_scale`。

- **调整窗口**
  - 对速度不快的机器人，可以限制窄一点，对噪声更敏感。


## 工程实现，代码参考
- `Config` 类，滤波器参数配置辅助类
- `Filter` 类，滤波器核心实现
- `cal_Mahony_Gains()` 增益辅助计算函数

<details>
<summary> mahony.h</summary>

``` cpp
#ifndef MAHONY_H
#define MAHONY_H

#include <cmath>

namespace algorithm {

namespace mahony {

class Config {
public:
    float twoKp = 5.0f;
    float twoKi = 0.03f;

    // 积分限幅 —— 抗饱和
    float i_limit = 0.5f;

    // 传感器模长有效窗口（鲁棒性）
    float acc_min   = 0.6f;      // g≈1，窗口可按场景微调
    float acc_max   = 1.4f;
    float acc_norm  = 9.81f;

    Config() = default;
    Config( float twoKp, float twoKi, 
            float i_limit, 
            float acc_min, float acc_max, 
            float acc_norm
    )   : twoKp(twoKp), twoKi(twoKi)
        , i_limit(i_limit)
        , acc_min(acc_min), acc_max(acc_max)
        , acc_norm(acc_norm) { }
};

class Filter {
public:
    Filter() = default;
    Filter(const Config &cfg) : cfg_(cfg) {}

    void update_Config(const Config &cfg);

    void update_Config_Accl_Norm(float total_accl_bias);

    Config get_Config() const { return cfg_; }

    void init();
    void deinit();
       
    void update_IMU(float ax, float ay, float az, \
                    float gx, float gy, float gz, \
                    float dt);

    void compute_Angles();

    float get_Roll();
    float get_Pitch();
    float get_Yaw();

    float get_Roll_Rad();
    float get_Pitch_Rad();
    float get_Yaw_Rad();

    void get_Quaternion(float &q0, float &q1, float &q2, float &q3) const {
        q0 = q0_; q1 = q1_; q2 = q2_; q3 = q3_;
    }

private:
    Config cfg_;              // 配置
    float q0_, q1_, q2_, q3_;   // 四元数
    float integral_FB_x_;
    float integral_FB_y_;
    float integral_FB_z_;       // 积分项

    bool b_filter_init_ = false;
    bool angle_comptued_ = false;

    float roll_, pitch_, yaw_;  // 欧拉角

    static inline float inv_Sqrt(float x);

    static inline void clamp3(float &x, float &y, float &z, float lim);

};

struct Mahony_Gains {
    float twoKp = 0.0f;
    float twoKi = 0.0f;
};

inline Mahony_Gains cal_Mahony_Gains(float tau, float kp_scale, float ki_scale) {
    if (tau <= 0.f) return {};
    const float beta = 2.146f / tau;
    const float Kp   = 2.0f * beta;
    const float Ki   = beta * beta;

    Mahony_Gains gains;
    gains.twoKp = 2 * Kp * kp_scale;
    gains.twoKi = 2 * Ki * ki_scale;
    return gains;
}

} // namespace mahony

} // namespace algorithm


#endif // MAHONY_H

```
</details>

<details>
<summary> mahony.cpp</summary>

``` cpp

#include "mahony.h"

#include <algorithm>
#include <cfloat>
#include <cmath>

namespace algorithm {

namespace mahony {

    /**
     * @brief Normalize an angle in radians to the range [-M_PI, M_PI).
     */
    static float angle_Normalize(float angle) {
        while (angle >  M_PI) { angle -= 2.0f * M_PI; }
        while (angle < -M_PI) { angle += 2.0f * M_PI; }
        return angle;
    }

    void Filter::update_Config(const Config &cfg) {
        cfg_ = cfg;
    }

    void Filter::update_Config_Accl_Norm(float accl_norm) {
        cfg_.acc_norm = accl_norm;
    }

    void Filter::init() {
        q0_ = 1.0f; q1_ = 0.0f; q2_ = 0.0f; q3_ = 0.0f;
        integral_FB_x_  = integral_FB_y_ = integral_FB_z_ = 0.f;
        b_filter_init_  = false;
        angle_comptued_ = false;
    }

    void Filter::deinit() {
        b_filter_init_ = false;
    }

    void Filter::update_IMU(float ax, float ay, float az, float gx, float gy, float gz, float dt) {
        if (dt <= 0.f) {
            return;
        }
        
        if (!b_filter_init_) {
            init();
            b_filter_init_ = true;
        }

        float recip_norm;
        float halfvx, halfvy, halfvz;
        float halfex, halfey, halfez; 
        float qa, qb, qc;

        // normalize accelerometer
        bool acc_stable = false;    // 加速度计是否稳定
        float n_2 = ax * ax + ay * ay + az * az;
        if (n_2 > FLT_EPSILON) {
            recip_norm = inv_Sqrt(n_2);
            float n = (1.0f / recip_norm) /cfg_.acc_norm;
            acc_stable = (n > cfg_.acc_min) && (n < cfg_.acc_max);
            ax *= recip_norm; ay *= recip_norm; az *= recip_norm;
        }

        // 估计重力方向
        halfvx = q1_ * q3_ - q0_ * q2_;
        halfvy = q0_ * q1_ + q2_ * q3_;
        halfvz = q0_ * q0_ - 0.5f + q3_ * q3_;

        // 叉乘误差
        halfex  = halfey  = halfez  = 0.f;
        if (acc_stable) {
            halfex += (ay * halfvz - az * halfvy);
            halfey += (az * halfvx - ax * halfvz);
            halfez += (ax * halfvy - ay * halfvx);
        }

        // 积分反馈
        if (cfg_.twoKi > 0.f && acc_stable) {
            integral_FB_x_ += cfg_.twoKi * halfex * dt;
            integral_FB_y_ += cfg_.twoKi * halfey * dt;
            integral_FB_z_ += cfg_.twoKi * halfez * dt;
            clamp3(integral_FB_x_, integral_FB_y_, integral_FB_z_, cfg_.i_limit);
            gx += integral_FB_x_; gy += integral_FB_y_; gz += integral_FB_z_;
        } else {
            integral_FB_x_ = integral_FB_y_ = integral_FB_z_ = 0.f;
        }
        
        if (!(dt > 0.f && dt < 0.2f)) {
            integral_FB_x_ = integral_FB_y_ = integral_FB_z_ = 0.f;
            return;
        }

        // 比例反馈
        gx += cfg_.twoKp * halfex;
        gy += cfg_.twoKp * halfey;
        gz += cfg_.twoKp * halfez;

        // 四元数积分
        const float half_dt = 0.5f * dt;
        gx *= half_dt; gy *= half_dt; gz *= half_dt;

        qa = q0_; qb = q1_; qc = q2_;
        q0_ += (-qb * gx - qc * gy - q3_ * gz);
        q1_ += ( qa * gx + qc * gz - q3_ * gy);
        q2_ += ( qa * gy - qb * gz + q3_ * gx);
        q3_ += ( qa * gz + qb * gy - qc  * gx);

        // 归一化
        float q_n_2 = q0_ * q0_ + q1_ * q1_ + q2_ * q2_ + q3_ * q3_;
        if (!(q_n_2 > 0.f && std::isfinite(q_n_2))) {
            q0_ = q1_ = q2_ = q3_ = 0.f;
            return;
        }
        recip_norm = inv_Sqrt(q_n_2);
        q0_ *= recip_norm; q1_ *= recip_norm; q2_ *= recip_norm; q3_ *= recip_norm;

        angle_comptued_ = false;
    }

    /**
     * @brief quaternion ro euler besed: ZYX_FLU
     */
    void Filter::compute_Angles() { 
        // ZYX 欧拉角
        // roll_  = std::atan2(q0_ * q1_ + q2_ * q3_, 0.5f - q1_ * q1_ - q2_ * q2_);
        // pitch_ =      asinf(-2.0f * (q1_ * q3_ - q0_ * q2_));
        // yaw_   = std::atan2(q1_ * q2_ + q0_ * q3_, 0.5f - q2_ * q2_ - q3_ * q3_);

        const float w = q0_, x = q1_, y = q2_, z = q3_;

        // const float siny_crop = 2.0f * (w*z + x*y);
        // const float cosy_crop = 1.0f - 2.0f * (y*y + z*z);
        // float yaw = std::atan2(siny_crop, cosy_crop);

        // float sinp = 2.0f * (x * z - w * y);
        // sinp = std::max(-1.0f, std::min(1.0f, sinp));
        // float pitch = std::asin(sinp);

        // const float sinr_crop = 2.0f * (w*x + y*z);
        // const float cosr_crop = 1.0f - 2.0f * (x*x + y*y);
        // float roll = std::atan2(sinr_crop, cosr_crop);

        double sinp = 2.0 * (w * y - z * x);
        float roll, pitch, yaw = 0.0f;
        if (fabs(sinp) >= 1.0) {
            // 在万向锁位置 (pitch = ±90°)
            pitch = (sinp > 0) ? M_PI / 2 : -M_PI / 2;
            
            // 万向锁时，只能确定 roll ± yaw 的和/差
            // 通常设 yaw 为 0，roll 为 atan2
            roll = atan2(2.0 * (x * y + w * z), 
                        w * w + x * x - y * y - z * z);
            yaw = 0.0;
        } else {
            // 正常情况
            pitch = asin(sinp);
            
            // 计算偏航角 (yaw, Z轴旋转)
            yaw = atan2(2.0 * (w * z + x * y),
                        1.0 - 2.0 * (y * y + z * z));
            
            // 计算翻滚角 (roll, X轴旋转)
            roll = atan2(2.0 * (w * x + y * z),
                        1.0 - 2.0 * (x * x + y * y));
        }

        roll_   = angle_Normalize(roll);
        pitch_  = angle_Normalize(pitch);
        yaw_    = angle_Normalize(yaw);

        angle_comptued_ = true;
    }

    float Filter::get_Roll() { 
        if (!angle_comptued_) {
            compute_Angles();
        }
        return roll_ * 180.0f / M_PI;  
    }
    float Filter::get_Pitch() { 
        if (!angle_comptued_) {
            compute_Angles();
        }
        return pitch_ * 180.0f / M_PI; 
    }
    float Filter::get_Yaw() {
        if (!angle_comptued_) {
            compute_Angles();
        }
        return yaw_ * 180.0f / M_PI;
    }

    float Filter::get_Roll_Rad() {
        if (!angle_comptued_) {
            compute_Angles();
        }
        return roll_;
    }

    float Filter::get_Pitch_Rad() {
        if (!angle_comptued_) {
            compute_Angles();
        }
        return pitch_;
    }

    float Filter::get_Yaw_Rad() {
        if (!angle_comptued_) {
            compute_Angles();
        }
        return yaw_;
    }

    float Filter::inv_Sqrt(float x) {
        float halfx = 0.5f * x;
        float y = x;
        long i = *(long*)&y;
        i = 0x5f3759df - (i >> 1);               // what the fuck? 
        y = *(float*)&i;
        y = y * (1.5f - (halfx * y * y));
        y = y * (1.5f - (halfx * y * y));
        return y;
        // 现代 CPU 编译器在 `-ffast-math` 下已能把 `1.0f / sqrtf(x)` 变成硬件 rsqrt + 迭代
        // 可根据目标设备的硬件支持情况选择
        // if (x <= 0.f) return 0.f;
        // float y = 1.0f / std::sqrt(x);
        // return y; 
    }

    void Filter::clamp3(float &x, float &y, float &z, float lim) {
        const float L = std::fabs(lim);
        if (x >  L) x =  L; 
        if (x < -L) x = -L;
        if (y >  L) y =  L; 
        if (y < -L) y = -L;
        if (z >  L) z =  L; 
        if (z < -L) z = -L;
    }
    
}   // namespace mahony

} // namespace algorithm

```
</details>

<details>
<summary> example.cpp</summary>

``` cpp
#include "mahony.h"

int main() {
    // ...
    algorithm::mahony::Filter mahony_4_imu;
    algorithm::mahony::Mahony_Gains mahony_gains;
    mahony_gains = algorithm::mahony::cal_Mahony_Gains(0.25f, 1.0f, 0.0055f);
        mahony_4_imu.update_Config({
        mahony_gains.twoKp,
        mahony_gains.twoKi,
        0.4f,   // i_limit
        0.6f,   // acc_min
        1.4f,   // acc_max
        9.81f,  // acc_norm
    });
    mahony_4_imu.init();
    // ...
    
    return 0;
}
```

</details>

## 优化方向
- 引入磁力计 mag，拓展至九轴 mahony


## 参考
- **[Nonlinear complementary filters on the special orthogonal group](https://researchportalplus.anu.edu.au/en/publications/nonlinear-complementary-filters-on-the-special-orthogonal-group)**
- **[Attitude Representations > Quaternion](https://ahrs.readthedocs.io/en/latest/quaternion/quaternion.html)**
- **[Mahony Orientation Filter](https://ahrs.readthedocs.io/en/latest/filters/mahony.html)**
- **[Quaternions](https://faculty.sites.iastate.edu/jia/files/inline-files/quaternion.pdf)**
- **[陀螺仪姿态解算+mahony滤波算法（公式推导及其代码）](https://zhuanlan.zhihu.com/p/654496867)**
- **[Mahony姿态解算算法笔记（一）](https://zhuanlan.zhihu.com/p/342703388)**
- **[Mahony航姿算法的参数调节方法](https://zhuanlan.zhihu.com/p/582694093)**