---
id: classic-pid-optimization
title: PID 算法优化 && 增量式 PID
sidebar_label: PID 优化
---

## PID 算法
有关 PID 的介绍可以看这里
- [经典 PID 控制算法 && C++ 实现](../pid/pid.md)

## PID 优化
### 输出限幅
- 将控制器的输出限制在一定范围内，防止控制器过大的输出
$$
u_{sat}(t) = min(u_{max}, max(u_{min}, u(t)))
$$

<details>
<summary> Code</summary>

``` cpp
if (output_ < output_min_) {
    output_ = output_min_;
}
if (output_ > output_max_) {
    output_= output_max_;
}
```

</details>

---

### 抗积分饱和
**积分饱和** 是指 PID 控制器中的一种现象，当误差较大时，积分器将有很大的累计量，随着时间增加容易引起过冲，当误差方向相反时，仍然会维持一段时间才能恢复正常，影响控制系统的性能

**解决方法**
#### 条件积分
- **积分项只在输出未饱和，且误差方向与控制方向一致时才累计**

<details>
<summary> Code</summary>

``` cpp
void update(float target, float measurement, float dt){
    float error = target - measurement;
    float new_integral = integral_ + error * dt;
    output_ = (Kp_ * error) + \
                (Ki_ * new_integral) + \
                (Kd_ * (error - last_error_) / dt);

    if (output_ < output_min_) {
        output_ = output_min_;
        if (error > 0) {
            integral_ = new_integral
        }
    }
    else if (output_ > output_max_) {
        output_= output_max_;
        if (error < 0) {
            integral_ = new_integral
        }
    } else {
        integral_ = new_integral
    }

    last_error_ = error;
}
```

</details>

#### 积分分离

积分项优化为

$$
\lambda\cdot K_i\cdot\int_{0}^{t}e(t)dt
$$

$$
\lambda = \begin{cases}
0 & e(t) > \text{threshold} \\
1 & e(t) \leqslant \text{threshold}
\end{cases}
$$

当误差值小于一定范围时，才进行积分项的累计

<details>
<summary> Code</summary>

``` cpp
void update(float target, float measurement, float dt){
    float error = target - measurement;
    // 积分分离
    if (fabs(error) <= integral_separation_threshold) {
        integral_ += error * dt;
    }
    output_ = (Kp_ * error) + \
                (Ki_ * integral_) + \
                (Kd_ * (error - last_error_) / dt);
    
    if (output_ < output_min_) {
        output_ = output_min_;
    }
    if (output_ > output_max_) {
        output_= output_max_;
    }

    last_error_ = error;
}
```

</details>



#### 反计算抗饱和

引入反饱和误差 `Anti-windup error`
$$
e_{aw}​(t)=u_{sat}(t)−u(t)
$$
积分项更新为
$$
\frac{dI(t)}{dt}=K_i\cdot e(t)+K_c\cdot e_{aw}​(t)
$$
实际的输出为输出限幅后的 $u_{sat}(t)$

PID 完整公式可以更新为
$$
u(t)=K_p\cdot e(t)+\int_{0}^{t}[K_i\cdot e(t)+K_c\cdot (u_{sat}(t)−u(t))]dt+K_d\cdot\frac{\Delta e(t)}{dt}
$$

<details>
<summary> Code</summary>

``` cpp
void update(float target, float measurement, float dt){
    float error = target - measurement;
    float p_term = Kp_ * error;
    float d_term = Kd_ * (error - last_error_) / dt;
    float output_unsat = p_term + integral_ + d_term;

    output_ = std::clamp(output_unsat, output_min, output_max);

    // 反计算积分
    float aw_error = output - output_unsat;
    integral_ += (Ki_ * error + Kc_ * aw_error) * dt

    last_error_ = error;
}
```

</details>

此方法引入了一个新的参数反计算增益 $K_c$ 

推荐取值范围为
$$
K_c\approx K_i\times\alpha\,\alpha\in[0.1,~1.0]
$$
例如 $K_c=K_i\times 0.3$

---

### 微分项优化
- 添加低通滤波，减少测量噪声对微分项的干扰

$$
D_{lp}(t)=\alpha\cdot D(t)+(1-\alpha)\cdot D(t-1),~\alpha\in[0.0,~1.0]
$$

<details>
<summary> Code</summary>

``` cpp
float d_term = Kd_ * (error - last_error_) / dt;
d_term = (alpha * last_d_term) + ((1- alpha) * d_term);
...
last_d_term = d_term；
```

</details>

## 增量式 PID
$$
u(t)=K_p\cdot e(t)+K_i\cdot\int_{0}^{t}e(t)dt+K_d\cdot\frac{\Delta e(t)}{dt}
$$
将经典的位置式PID公式离散化后
$$
u[k]=K_pe[k]+K_i\sum_{i=0}^{k}e[i]\cdot\Delta t+K_d\frac{e[k]-e[k-1]}{\Delta t}
$$
增量式PID的目标是计算 $\Delta u[k]=u[k]-u[k-1]$

带入位置式 PID 的离散公式

$$
\Delta u[k]=K_p(e[k]-e[k-1])+K_ie[k]\cdot\Delta t+K_d\frac{e[k]-2e[k-1]+e[k-2]}{\Delta t}
$$
微分项加入低通滤波
$$
d_{lp}[k]=\alpha\cdot d_{lp}[k-1]+(1-\alpha)\cdot d[k]
$$

积分分离，误差绝对值大于某个阈值时才引入积分项
$$
I[k]=\lambda\cdot K_ie[k]\cdot\Delta t
$$
$$
\lambda=\begin{cases}
0 & e(t)>\text{threshold} \\
1 & e(t)\leqslant\text{threshold}
\end{cases}
$$

<details>
<summary> Code</summary>

``` cpp
void update_Inc(float target, float measurement, float dt) {
    float error = target - measurement;
    float delta_u = Kp_ * (error - prev_error1_);
    // 积分分离
    bool integral_separation = fabs(error) > integral_separation_th_;
    if (integral_separation) {
        delta_u += Ki_ * error * dt_;
    }
    // 微分低通
    float d_raw = error - 2 * last_error_ + prev_error_;
    float d_low_pass = d_lp_alpha * last_d_raw + (1 - d_lp_alpha) * d_raw;
    delta_u += Kd_ * d_low_pass / dt_;
    
    output_ += delta_u;

    // 输出限幅
    if (output_ < output_min_) { output_= output_min_;}
    if (output_ > output_max_) { output_= output_max_;}

    last_d_raw  = d_low_pass;
    prev_error_ = last_error_;
    last_error_ = error;
}
```

</details>
