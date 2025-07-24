---
id: path_planning_astar_optimize
title: A* 算法优化
sidebar_label: A⭐ 优化
---

前面 A* 算法的效果可以看到，虽然能规划出路径，但是会出现路径紧贴障碍物的情况，导致路径并不完全安全

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/astar/astar_res_01.png)

并且由于 A* 节点的拓展方式，会向周围拓展出很多的节点，对内存的压力较大

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/astar/astar_optimize_01.png)

图中灰色部分为被拓展过的节点，假设路径较长，拓展的节点将会覆盖大部分的地图

## 优化代价函数

为了优化此问题，在代价函数中新增一项参数 $c$ ，总的代价函数可以描述为

$$
f(n) = \frac{g(n) + h(n)}{c(n)}
$$

其中 $c(n)$ 表示当节点距离最近的障碍物的距离，用来模拟对障碍物进行膨胀的过程，为了简化计算，我们可以依据需要膨胀的大小来引入一个参数 `padding`，取内边距的意思，通过如下步骤计算出 $c(n)$

1. 首先根据设定的 `padding` 大小，节点以 $p$ 为半径的圆形范围的区域，寻找到距离当前节点最近的障碍物点

``` cpp
for (int i = -pad_radius_; i <= pad_radius_; ++i) {
    for (int j = -pad_radius_; j <= pad_radius_; ++j) {
        if (i == 0 && j == 0) { continue; }
        // ...
    }
}
```

2. 假设找到了最近的障碍物点 $(i,j)$, 根据其与节点的欧式距离 `std::hypot(i, j)`，计算得到 $c(n)$

``` cpp
uchar distance = static_cast<uchar>(255 - 255 * (1 - std::hypot(i, j) / (pad_radius_ + 1)));
```
- `(pad_radius_ + 1)` 避免除以 0
- `255 - 255 * (...)` 将结果归一化到 $[0, 255]$ 范围
- 当最终结果越小，则表示当前节点越接近障碍物，越大则表示越远离，假设周围完全没有障碍物，则为最大值 255

<details>
<summary> 最终得到的 $c(n) 的计算代码为</summary>

``` cpp
    uchar AStar_Planner::astar_Padding_Cost(int x, int y) {
        uchar min_distance = 255;
        for (int i = -pad_radius_; i <= pad_radius_; ++i) {
            for (int j = -pad_radius_; j <= pad_radius_; ++j) {
                if (i == 0 && j == 0) { continue; }
                if (std::hypot(i, j) > pad_radius_) { continue; }
                int nx = x + i, ny = y + j;
                // 超出地图的点不考虑
                if (nx < 0 || nx >= (*grid_map_ptr_).width() || ny < 0 || ny >= (*grid_map_ptr_).height()) { continue; }
                if ((*grid_map_ptr_).get_Point_Val(nx, ny) == 0) {
                    uchar distance = static_cast<uchar>(255 - 255 * (1 - std::hypot(i, j) / (pad_radius_ + 1)));
                    min_distance = std::min(distance, min_distance);
                }
            }
        }
        return min_distance;
    }
```
</details>

如此优化后，再次运行 A* 执行路径规划，靠近障碍物的节点将不被拓展，路径变得相对安全，拓展的节点总数也有所减少

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/astar/astar_optimize_02.png)

但是从图中可以观察到，还是有很多方向并不完全一致的节点被拓展了，接下来结合 jps 规划的特性，简化一些不相关的节点，只在关键的节点附近拓展 A* 的节点，将会再进一步优化

在相同的地图中，我们先执行一次 jps 算法，得到一条跳点紧贴障碍物的基础路径

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/jps/jps_res_01.png)

在此路径的基础上，根据前面引入的 `padding` 参数，构建一条与基础路径走向相同的管道，将管道标记出来后，应该得到如下结果

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/astar/jps_pipeline.png)

将管道单独提取出来，作为 A* 算法的输入地图，再执行，A* 算法拓展的节点大幅减少，路径也变得更加安全。

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/astar/astar_optimize_jps.png)

## 参考

- **[KumarRobotics / jps3d](https://github.com/KumarRobotics/jps3d)**
