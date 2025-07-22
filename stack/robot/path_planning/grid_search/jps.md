---
id: path_planning_jps
title: JPS 路径规划算法
sidebar_label: JPS
---

> JPS(Jump Point Search) 是一种基于栅格地图的寻路算法，基于 A* 算法的框架进行改进，提升了速度并减小了内存开销 
> 
> [《Online Graph Pruning for Pathfinding On Grid Maps》](https://ojs.aaai.org/index.php/AAAI/article/view/7994)

## 概念
**强迫邻居 (Forced Neighbour)**
> 当前节点 x 相邻的八个点中有障碍，父节点经过 x 到达与障碍物相邻的点 n 的距离代价最小，则 n 为 x 的强迫邻居
>
> 例如下图 (b) 中 3 为 x 的强迫邻居；(d) 中 1 为 x 的强迫邻居

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/jps/forced_neighbour.png)

**跳点 (Jump Point)**
满足以下条件的点可以称为跳点，跳点将会被添加到 openlist 中
1. 当前节点是起点/终点
2. 当前节点至少有一个强迫邻居
3. 如果在斜向搜索，当前节点水平或垂直方向上有满足上述两点的节点

<details>
<summary> 跳点搜索图示</summary>

非斜向搜索到跳点

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/jps/jump_point_02.png)

斜向搜索到跳点

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/jps/jump_point.png)
</details>

这里可以引出

**JPS 算法的搜索方式**
1. 起点没有父节点，搜索方向为全部的八个方向
2. 跳点的搜索方向为，父节点的搜索方向以及强迫邻居的方向
3. 当搜索方向为斜向搜索时，同时搜索该斜向的垂直以及水平方向
4. 不停的搜索直至搜索到跳点或者搜索到障碍物、地图边界


## 启发函数
**启发函数与 `A*` 一致**

$$
f(n) = g(n) + h(n)
$$

- $f(n)$ 是节点的综合优先级，总会选择综合优先级最小的节点作为下一个节点
- $g(n)$ 是节点距离起点的代价
- $h(n)$ 是节点距离终点的代价

**JPS 需要地图支持斜向移动，所以采用欧式距离**
$$
d = \sqrt{(x_1-x_2)^2+(y_1-y_2)^2}
$$

## JPS 节点数据结构

<details>
<summary> 节点在地图内的坐标 $(x, y)$</summary>

``` cpp
class Point {
public:
    int x = 0, y = 0;
    Point() = default;
    Point(int x, int y) : x(x), y(y) {}
    Point operator+(const Point &other) const {
        return {x + other.x, y + other.y};
    }
};
```
</details>

- 表示搜索方向的常量数组，总共八个搜索方向

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/robot/jps/n8_dir.png)
``` cpp
/**
    * @brief N_8 dir, use by bit --> 0b00000000
    * 
    */
static const int8_t N8_DIR[8][2] = {{-1,-1}, {0,-1}, {1,-1},
                                    {-1, 0},         {1, 0},
                                    {-1, 1}, {0, 1}, {1, 1}};
```

:::info
> 通过一个 uint8 类型来存储搜索方向，`0b0000'0000` 八位中的 0 或 1 表示是否需要搜索
:::

<details>
<summary>从 uint8 中获取搜索方向的相关方法</summary>

``` cpp
typedef uint8_t jps_nds;

static int8_t get_N8_Direction_Position(int8_t dx, int8_t dy) {
    for (int8_t i = 0; i < 8; i++) {
        if (N8_DIR[i][0] == dx && N8_DIR[i][1] == dy) {
            return i;
        }
    }
    return -1;
}

static void set_Direction_Bit(jps_nds& val, uint8_t position) {
    val |= (1 << position);
}

static bool is_Direction_Bit_Set(jps_nds val, uint8_t position) {
    return (val & (1 << position)) != 0;
}
```
</details>

- JPS 节点

<details>
<summary> 默认构造起点，八个方向都为搜索方向</summary>

``` cpp
class JPS_Node : public Point {
    using JPS_NodePtr = std::shared_ptr<JPS_Node>;
public:
    float g = 0;
    float h = 0;
    JPS_NodePtr parent_ = nullptr;
    jps_nds n_ds_       = 0b00000000;
    bool is_closed      = false;

    JPS_Node() = default;

    explicit
    JPS_Node(int x, int y) : Point(x, y), g(0), h(0), is_closed(false) {
        n_ds_ = 0b11111111;
    }
    explicit
    JPS_Node(int _x, int _y, int d_x, int d_y, float _g, float _h, JPS_NodePtr _parent, jps_nds _n_ds) :
            Point(_x, _y), parent_(std::move(_parent))
            , g(_g), h(_h), is_closed(false)
    {
        n_ds_ = _n_ds;
        set_Direction_Bit(n_ds_, get_N8_Direction_Position(d_x, d_y));
    }

    float f() { return g + h; }

    struct Comparators {
        bool operator()(const JPS_NodePtr& a, JPS_NodePtr& b) const {
            return (((*a).f() != (*b).f()) ? ((*a).f() > (*b).f()) : ((*a).g > (*b).g));
        }
    };
    bool operator==(const JPS_Node& other) const { return x == other.x && y == other.y; }
};
```

</details>

## JPS 算法流程

定义几种容器类型

``` cpp
// JPS 节点的智能指针
using JPS_NodePtr       = std::shared_ptr<JPS_Node>;
// 节点指针的优先级队列
using JPS_NodePtrPq     = std::priority_queue<JPS_NodePtr, std::vector<JPS_NodePtr>, JPS_Node::Comparators>;
// 存储节点的 map
using JPS_NodeMap       = std::unordered_map<int, JPS_Node>;
// 存储路径的数组
using Points            = std::vector<Point>;
```

**算法流程**
> 初始化 open_list、closed_list
> - 将起点加入 open_list
> - 如果 open_list 非空，则取其顶部的节点
>   - 如果该节点为终点，回溯路径，结束
>   - 如果该节点在 closed_list 中，则根据 $g(n)$ 判断是否更新父节点
>   - 根据搜索方向搜索新的跳点
>     - 如果拓展的点是跳点，将其加入 open_list
>     - 如果是斜向搜索，分别拓展同侧的垂直于水平方向，如果搜索到跳点，记录下搜索方向，将其加入 open_list
> - 返回路径

**搜索强迫邻居**

<details>
<summary>根据搜索方向分为斜向，垂直与水平搜索</summary>

``` cpp
bool JPS_Planner::is_Point_Valid(int x, int y) const
{
    // 判断当前坐标是否在地图内
}

bool JPS_Planner::search_Force_Neighbor(int x, int y, int d_x, int d_y, jps_nds &n_ds) {
    auto value = ([&](int x, int y) -> jps_nds {
        // 获取地图点的值
    });
    bool res = false;
    if (d_x != 0 && d_y != 0) {
        /*
            * | O |   |   |
            * | # | N |   |
            * | ↗ | # | O |
            */
        if (is_Point_Valid(x - d_x, y      ) && value(x - d_x, y      ) == 0 && 
            is_Point_Valid(x - d_x, y + d_y) && value(x - d_x, y + d_y) != 0 && 
                                                value(x      , y      ) != 0)
        {
            set_Direction_Bit(n_ds, get_N8_Direction_Position(-1 * d_x, d_y));
            res = true;
        }
        if (is_Point_Valid(x      , y - d_y) && value(x      , y - d_y) == 0 && 
            is_Point_Valid(x + d_x, y - d_y) && value(x + d_x, y - d_y) != 0 && 
                                                value(x      , y      ) != 0)
        {
            set_Direction_Bit(n_ds, get_N8_Direction_Position(d_x, -1 * d_y));
            res = true;
        }
        return res;
    }
    if (d_x == 0) {
        /*
            * | O |   | O |
            * | # | N | # |
            * | * | ↑ | * |
            */
        if (is_Point_Valid(x  -  1, y      ) && value(x  -  1, y      ) == 0 && 
            is_Point_Valid(x  -  1, y + d_y) && value(x  -  1, y + d_y) != 0 && 
                                                value(x      , y      ) != 0)
        {
            set_Direction_Bit(n_ds, get_N8_Direction_Position(-1, d_y));
            res = true;
        }
        if (is_Point_Valid(x  +  1, y      ) && value(x  +  1, y      ) == 0 && 
            is_Point_Valid(x  +  1, y + d_y) && value(x  +  1, y + d_y) != 0 && 
                                                value(x      , y      ) != 0)
        {
            set_Direction_Bit(n_ds, get_N8_Direction_Position( 1, d_y));
            res = true;
        }
        return res;
    } else if (d_y == 0) {
        /*
            * | * | # | O |
            * | → | N |   |
            * | * | # | O |
            */
        if (is_Point_Valid(x      , y  -  1) && value(x      , y  -  1) == 0 && 
            is_Point_Valid(x + d_x, y  -  1) && value(x + d_x, y  -  1) != 0 && 
                                                value(x      , y      ) != 0)
        {
            set_Direction_Bit(n_ds, get_N8_Direction_Position(d_x, -1));
            res = true;
        }
        if (is_Point_Valid(x      , y  +  1) && value(x      , y  +  1) == 0 && 
            is_Point_Valid(x + d_x, y  +  1) && value(x + d_x, y  +  1) != 0 && 
                                                value(x      , y      ) != 0)
        {
            set_Direction_Bit(n_ds, get_N8_Direction_Position(d_x,  1));
            res = true;
        }
        return res;
    }
    return false;
}
```

</details>

**JPS 算法搜索路径**

<details>
<summary>以循环的形式实现jps搜索过程</summary>

``` cpp
Points JPS_Planner::jps_Plan(int start_x, int start_y, int goal_x, int goal_y) {
    Points          jps_path    = Points();
    JPS_NodePtr     p_curr_node = nullptr;
    JPS_NodePtrPq   open_list   = JPS_NodePtrPq();
    JPS_NodeMap     closed_list = JPS_NodeMap();
    auto coord_2_Idx = [&](int x, int y) -> int {
        // return x + y * map_cols
        // 将坐标转换为唯一 idx
    };
    closed_list[coord_2_Idx(start_x, start_y)] = JPS_Node(start_x, start_y);
    open_list.emplace(std::make_shared<JPS_Node>(closed_list[coord_2_Idx(start_x, start_y)]));
    while (!open_list.empty()) {
        p_curr_node = open_list.top();
        open_list.pop();
        if (p_curr_node->is_closed) {
            continue;
        } else {
            p_curr_node->is_closed = true;
        }
        int x = p_curr_node->x;
        int y = p_curr_node->y;
        if (x == goal_x && y == goal_y) {
            while (p_curr_node != nullptr) {
                jps_path.emplace_back(p_curr_node->x, p_curr_node->y);
                p_curr_node = p_curr_node->parent_;
            }
            break;
        }
        for (int i = 0; i < 8; ++i) {
            if (!is_Direction_Bit_Set(p_curr_node->n_ds_, i)) {
                continue;
            }
            int d_x = N8_DIR[i][0], d_y = N8_DIR[i][1];
            int n_x = x + d_x, n_y = y + d_y;
            jps_nds n_ds = 0b00000000;
            bool is_jump_point = false;
            while (true) {
                if (!is_Point_Valid(n_x, n_y) || !is_Point_Free(n_x, n_y)) {
                    break;
                }

                if (n_x == goal_x && n_y == goal_y) {
                    is_jump_point = true;
                    break;
                }

                bool res = false;
                if (search_Force_Neighbor(n_x, n_y, d_x, d_y, n_ds)) {
                    res = true;
                }

                int tmp_n_x, tmp_n_y;
                if (d_x != 0 && d_y != 0) {
                    // 斜向搜索时，需要同时搜索同向的水平与垂直方向
                    /*
                        * | * | ↑ |   |
                        * | * | ↑ |   |
                        * | * | N | → | → | → |
                        * | ↗ | * | * | * | * |
                        */
                    tmp_n_x = n_x + d_x; tmp_n_y = n_y;
                    bool is_jump_point_straight = false;
                    while (true) {
                        if (!is_Point_Valid(tmp_n_x, tmp_n_y) || !is_Point_Free(tmp_n_x, tmp_n_y)) {
                            break;
                        }
                        if (tmp_n_x == goal_x && tmp_n_y == goal_y) {
                            is_jump_point_straight = true;
                            break;
                        }
                        jps_nds tmp_n_ds = 0b00000000;
                        if (search_Force_Neighbor(tmp_n_x, tmp_n_y, d_x, 0, tmp_n_ds)) {
                            is_jump_point_straight = true;
                            break;
                        }
                        tmp_n_x += d_x;
                    }
                    if (is_jump_point_straight) {
                        set_Direction_Bit(n_ds, get_N8_Direction_Position(d_x, 0));
                        res = true;
                    }
                    is_jump_point_straight = false;
                    tmp_n_x = n_x; tmp_n_y = n_y + d_y;
                    while (true) {
                        if (!is_Point_Valid(tmp_n_x, tmp_n_y) || !is_Point_Free(tmp_n_x, tmp_n_y)) {
                            break;
                        }
                        if (tmp_n_x == goal_x && tmp_n_y == goal_y) {
                            is_jump_point_straight = true;
                            break;
                        }
                        jps_nds tmp_n_ds = 0b00000000;
                        if (search_Force_Neighbor(tmp_n_x, tmp_n_y, 0, d_y, tmp_n_ds)) {
                            is_jump_point_straight = true;
                            break;
                        }
                        tmp_n_y += d_y;
                    }
                    if (is_jump_point_straight) {
                        set_Direction_Bit(n_ds, get_N8_Direction_Position(0, d_y));
                        res = true;
                    }
                }

                if (res) {
                    is_jump_point = true;
                    break;
                }
                n_x += d_x;
                n_y += d_y;

            }

            if (is_jump_point) {
                float g = p_curr_node->g + euclidian_Distance(n_x, n_y, p_curr_node->x, p_curr_node->y);
                float h = euclidian_Distance(n_x, n_y, goal_x, goal_y);
                if (closed_list.find(coord_2_Idx(n_x, n_y)) == closed_list.end()) {
                    closed_list[coord_2_Idx(n_x, n_y)] = JPS_Node(n_x, n_y, d_x, d_y, g, h, p_curr_node, n_ds);
                    open_list.emplace(std::make_shared<JPS_Node>(closed_list[coord_2_Idx(n_x, n_y)]));
                } else {
                    if (g < closed_list[coord_2_Idx(n_x, n_y)].g) {
                        closed_list[coord_2_Idx(n_x, n_y)] = JPS_Node(n_x, n_y, d_x, d_y, g, h, p_curr_node, n_ds);
                        open_list.emplace(std::make_shared<JPS_Node>(closed_list[coord_2_Idx(n_x, n_y)]));
                    }
                }
            }
        }
    }
    return jps_path;
}
```
</details>

- 这部分用循环实现有一些代码冗余，可以改为更简洁的递归实现（待整理）


## 参考
- **[kairaedsch / GridSearchVisualiser](https://github.com/kairaedsch/GridSearchVisualiser)**
- **[JPS/JPS+ 寻路算法](https://www.cnblogs.com/KillerAery/p/12242445.html)**