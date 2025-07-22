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

**Bit_Map 类**

``` cpp title="bit_map.h"
#ifndef BIT_MAP_H
#define BIT_MAP_H

#include <algorithm>
#include <cmath>
#include "sp_datastructs.hpp"

class BitMap {
public:
    BitMap() = default;
    explicit BitMap(int rows, int cols);

    BitMap& operator=(const BitMap& other) {
        bit_map_    = other.bit_map_;
        cols        = other.cols;
        rows        = other.rows;
        return *this;
    }

    void update(const cv::Mat& src);

    void release();

    void setZeros();

    void setOnes();

    void set_Pixel_Val(int x, int y, uchar val);

    uchar get_Pixel_Val(int x, int y) const;

    void line(cv::Point2i pt1, cv::Point2i pt2, uchar color, int thickness = 1);

    void circle(const cv::Point2i& center, int radius, uchar color);

    bool checkBounds(int row, int col) const {
        return row >= 0 && row < rows && col >= 0 && col < cols;
    }
    bool checkBounds(const cv::Point2i& p) const {
        checkBounds(p.y, p.x);
    }

    int cols = 0, rows = 0;
    cv::Mat bit_map_;
};

void convert_Mat_To_BitMap(const cv::Mat& src, BitMap& bit_map);

void convert_BitMap_To_Mat(const BitMap& bit_map, cv::Mat& dst);

#endif //BIT_MAP_H
```

``` cpp title="bit_map.cpp"
#include "traj_bit_map.h"

BitMap::BitMap(int _rows, int _cols) {
    rows = _rows;
    cols = _cols;
    bit_map_ = cv::Mat::zeros(rows, cols / 8);
}

void BitMap::update(const cv::Mat& src) {
    convert_Mat_To_BitMap(src, *this);
}

void BitMap::setZeros() {
    bit_map_.setTo(0);
}

void BitMap::setOnes() {
    bit_map_.setTo(255);
}

void BitMap::release() {
    bit_map_.release();
}

void BitMap::set_Pixel_Val(int x, int y, uchar val) {
    int bit_col     = x / 8;       // 计算该像素位于哪一列
    uchar* byte     = &bit_map_.at<uchar>(y, bit_col);
    int bit_pose    = 7 - (x % 8);   // 计算该像素值在该列的哪一位
    if (val == 0) {
        byte &= ~(1 << bit_pose);   // 将该位设置为 0
    } else {
        byte |=  (1 << bit_pose);   // 将该位设置为 1
    }
}

uchar BitMap::get_Pixel_Val(int x, int y) const {
    int bit_col     = x / 8;       // 计算该像素位于哪一列
    uchar byte      = bit_map_.at<uchar>(y, bit_col);
    int bit_pose    = 7 - (x % 8);   // 计算该像素值在该列的哪一位
    uchar bit_val   = byte >> bit_pose & 1;
    return (bit_val ? 255 : 0);
}

void BitMap::line(cv::Point2i pt1, cv::Point2i pt2, uchar color, int thickness) {
    int max_dis = std::max(std::abs(pt2.x - pt1.x), std::abs(pt2.y - pt1.y));
    auto dx = (float)(pt2.x - pt1.x) / (float)max_dis;
    auto dy = (float)(pt2.y - pt1.y) / (float)max_dis;
    cv::Point2i prev_p = pt1;
    for (int n = 1; n < max_dis; ++n) {
        cv::Point2i p_n = pt1 + cv::Point2i((int)std::round((float)n * dx), (int)std::round((float)n * dy));
        if (std::hypot(prev_p.x - p_n.x, prev_p.y - p_n.y) >= 1) {
            circle(p_n, thickness / 2, color);
            prev_p = p_n;
        }
    }
}

void BitMap::circle(const cv::Point2i& center, int radius, uchar color) {
    int x = 0;
    int y = radius;
    int d = 1 - radius;

    auto draw_Horizontal_Line_On_BitMap = ([&](int y, int start_x, int end_x, uchar color) {
        for (int x = start_x; x <= end_x; ++x) {
            if (!checkBounds(y, x)) {
                continue;
            }
            set_Pixel_Val(x, y, color);
        }
    });

    auto fillCirclePoints = ([&](int xc, int yc, int x, int y) {
        // 填充水平线
        draw_Horizontal_Line_On_BitMap(yc + y, xc - x, xc + x, color);
        draw_Horizontal_Line_On_BitMap(yc - y, xc - x, xc + x, color);
        draw_Horizontal_Line_On_BitMap(yc + x, xc - y, xc + y, color);
        draw_Horizontal_Line_On_BitMap(yc - x, xc - y, xc + y, color);
    });

    // 绘制和填充圆周的点
    while (x <= y) {
        fillCirclePoints(center.x, center.y, x, y);
        x++;
        if (d < 0) {
            d += 2 * x + 1;
        } else {
            y--;
            d += 2 * (x - y) + 1;
        }
    }
}

void convert_Mat_To_BitMap(const cv::Mat &src, BitMap &bit_map) {
    if (src.cols % 8 != 0) {
        return;
    }
    bit_map.rows = src.rows;
    bit_map.cols = src.cols;
    bit_map.bit_map_ = cv::Mat::zeros(src.rows, src.cols / 8);
    for (int j = 0; j < src.rows; ++j) {
        for (int i = 0; i < src.cols / 8; ++i) {
            uchar byte = 0;
            for (int k = 0; k < 8; ++k) {
                byte |= (src.at(j, i * 8 + k) > 0 ? 1 : 0)  << (7 - k);
            }
            bit_map.bit_map_.at<uchar>(j, i) = byte;
        }
    }
}

void convert_BitMap_To_Mat(const BitMap &bit_map, cv::Mat &dst) {
    dst = cv::Mat::zeros(bit_map.rows, bit_map.cols);
    for (int j = 0; j < bit_map.rows; ++j) {
        for (int i = 0; i < bit_map.cols / 8; ++i) {
            uchar byte = bit_map.bit_map_.at<uchar>(j, i);
            // 解码每个字节，将其还原为 8 个像素
            for (int k = 0; k < 8; ++k) {
                // 提取当前字节中的第 k 位，左移 k 位，结果为 0 或 1
                dst.at(j, i * 8 + k) = (byte & (1 << (7 - k))) ? 255 : 0;
            }
        }
    }
}
```