---
id: path_planning_grid_map
title: 二维栅格地图
sidebar_label: Grid Map
---

### 真实世界的坐标转换到栅格地图中的坐标

假设 $(x, y)$ 是真实世界中的坐标，$s$ 为栅格地图每一格表示的长度，分辨率则为 $\frac{1}{s}$，坐标转换的关系则为
$$
(x_i, y_i) = (floor(\frac{x}{s})~,~ floor(\frac{y}{s}))
$$
- $floor(n)$ 为向下取整，这表示栅格地图是存在一定的精度损失的

假设使用矩阵来表示栅格地图，左上角为 $(0,0)$，无法表示负值，可以对地图坐标转换做一下处理

假设地图的宽度(列数)为 $cols$，高度(行数)为 $rows$，转换关系则可以表示为
$$
(x_i, y_i) = (floor(\frac{x}{s})+\frac{cols}{2}~,~floor(\frac{y}{s})+\frac{rows}{2})
$$

此时矩阵的中心对应真实坐标系的 $(0,0)$ 点

假设机器人的状态表示为 $(x,y,\theta)$，需要转换前方距离为 $d$ 的点
$$
x_{d_i} = x_i + d\cdot \sin(\theta)\\
y_{d_i} = y_i + d\cdot \cos(\theta)
$$

假设真实的世界坐标系选择使用右手系，则 x 轴与地图的 x 轴相反，转换的计算则为
$$
\begin{align*}
x_{d_i}&=x_i + d\cdot \sin(-\theta)\\
&=x_i - d\cdot \sin(\theta)\\
y_{d_i}&= y_i + d\cdot \cos(-\theta)\\
&= y_i + d\cdot \cos(\theta)
\end{align*}
$$

### 栅格地图的表示
通常使用矩阵的形式来存储栅格地图，常见的存储方式有

**二维数组**
``` cpp
std::vector<std::vector<uint8_t>> map(rows, std::vector<uint8_t>(cols));
// 访问
uint8_t pixel = map[row][col];
```

**一维数组**
``` cpp
uint8_t* map  = new uint8_t[rows * cols];
// 访问
uint8_t pixel = map[row * cols + col];
```

- 具体数据类型根据需求而定

#### 栅格地图内存优化
假设平台内存优先，且地图不需要存储灰度信息，只需要是否空闲的信息，可以通过 `0|1` 来表示，即用一个字节 `bit` 来存储，一个 `uint8_t` 即可存储 `0b0000'0000` 八个数据，然后通过位运算，来实现像素的访问与更新，牺牲访问速度来换取内存空间

- 访问与更新数据
``` cpp
void set_Val(int x, int y, uchar val) {
    int bit_col     = x / 8;       // 计算该像素位于哪一列
    uchar& byte     = bit_map_.at(y, bit_col);
    int bit_pose    = 7 - (x % 8);   // 计算该像素值在该列的哪一位
    if (val == 0) {
        byte &= ~(1 << bit_pose);   // 将该位设置为 0
    } else {
        byte |=  (1 << bit_pose);   // 将该位设置为 1
    }
}
```

``` cpp
uchar get_Val(int x, int y) const {
    int bit_col     = x / 8;       // 计算该像素位于哪一列
    uchar byte      = bit_map_.at(y, bit_col);
    int bit_pose    = 7 - (x % 8);   // 计算该像素值在该列的哪一位
    uchar bit_val   = byte >> bit_pose & 1;
    return (bit_val ? 255 : 0);
}
```