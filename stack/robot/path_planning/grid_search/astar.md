---
id: path_planning_astar
title: A* 路径规划算法
sidebar_label: A*
---



## 启发函数
$$
f(n) = g(n) + h(n)
$$

- $f(n)$ 是节点的综合优先级，总会选择综合优先级最小的节点作为下一个节点
- $g(n)$ 是节点距离起点的代价
- $h(n)$ 是节点距离终点的代价

**关于距离**

如果地图只允许朝四个方向移动，可以使用曼哈顿距离
$$
d = \lvert x_1-x_2\rvert+\lvert y_1-y_2\rvert
$$
- 使用曼哈顿距离的情况下，两点间距离相等，路径不唯一

如果允许朝任意方向移动，则可以使用欧式距离
$$
d = \sqrt{(x_1-x_2)^2+(y_1-y_2)^2}
$$

## A* 节点数据结构

- 地图内的坐标 $(x, y)$

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

- 启发函数的代价 $g,~h,~f$
- 指向父节点的指针 $*parent$ ，用于回溯最终路径

``` cpp
class AStar_Node : public Point {
    using AStar_NodePtr = std::shared_ptr<AStar_Node>;
public:
    float g = 0;
    float h = 0;
    AStar_NodePtr parent = nullptr;

    AStar_Node() = default;
    explicit
    AStar_Node(int _x, int _y, float _g, float _h, AStar_NodePtr _parent) :
            Point(_x, _y), g(_g), h(_h), parent(std::move(_parent)) {}

    float f() const { return g + h; }

    struct Comparators {
        bool operator()(const AStar_NodePtr& a, const AStar_NodePtr& b) const {
            if (std::fabs(a->f() - b->f()) > 1e-6) {
                return a->f() > b->f();
            }
            return a->g > b->g;
        }
    };
    bool operator==(const AStar_Node &other) const { return x == other.x && y == other.y; }
};
```

## A* 算法流程

首先定义几种容器类型
``` cpp
// A* 节点的智能指针
using AStar_NodePtr     = std::shared_ptr<AStar_Node>;
// 节点指针的优先级队列
using AStar_NodePtrPq   = std::priority_queue<AStar_NodePtr, std::vector<AStar_NodePtr>, AStar_Node::Comparators>;
// 存储节点的 map
using AStar_NodeMap     = std::unordered_map<int, AStar_Node>;
// 存储路径的数组
using Points            = std::vector<Point>;
```

**算法流程**

> 初始化 open_list、expanded_list、closed_set
> - 将起点加入 expanded_list、open_list
> - 如果 open_list 非空，则取其顶部的节点
>   - 如果该节点为终点，回溯路径，结束
>   - 如果该节点已被处理过，则跳过
>   - 否则将该点标记为已处理，拓展相邻的节点
>     - 如果该点未被拓展
>       - 拓展该节点，加入 expanded_list、open_list
>     - 否则判断当前的代价，是否更新其父节点为当前节点，更新其代价
> - 返回路径

- `AStar_NodePtrPq open_list;` 获取最优节点的列表
- `AStar_NodeMap expanded_list;` 存储所有已被拓展的节点
- `std::unordered_set<int> closed_set;` 已被处理过的节点

``` cpp
AStar_Planner::Points
AStar_Planner::astar_Plan(const int start_x, const int start_y, const int goal_x, const int goal_y) const {
    Points          path          = Points();
    AStar_NodePtr   p_curr_node   = nullptr;
    AStar_NodePtrPq open_list     = AStar_NodePtrPq();
    AStar_NodeMap   expanded_list = AStar_NodeMap();
    std::unordered_set<int> closed_set;
    auto coord_2_Idx = [&](int x, int y) -> int {
        return x + y * map_ptr_->cols();
    };
    expanded_list[coord_2_Idx(start_x, start_y)] = AStar_Node(start_x, start_y, 0, euclidean_Distance(start_x, start_y, goal_x, goal_y), nullptr);
    open_list.emplace(std::make_shared<AStar_Node>(expanded_list[coord_2_Idx(start_x, start_y)]));
    while (!open_list.empty()) {
        p_curr_node = open_list.top();
        open_list.pop();
        const int x = p_curr_node->x;
        const int y = p_curr_node->y;
        if (closed_set.find(coord_2_Idx(x, y)) != closed_set.end()) {
            continue;
        }
        closed_set.insert(coord_2_Idx(x, y));
        if (x == goal_x && y == goal_y) {
            while (p_curr_node != nullptr) {
                path.emplace_back(p_curr_node->x, p_curr_node->y);
                p_curr_node = p_curr_node->parent;
            }
            break;
        }
        // expand node
        for (const auto i : N8_DIR) {
            int n_x = x + i[0];
            int n_y = y + i[1];
            if (!map_ptr_->is_Point_Valid(n_x, n_y) || !map_ptr_->is_Point_Free(n_x, n_y)) {
                continue;
            }
            int idx = coord_2_Idx(n_x, n_y);
            auto g = p_curr_node->g + static_cast<float>(std::hypot(i[0], i[1]));
            auto h = euclidean_Distance(n_x, n_y, goal_x, goal_y);
            if (expanded_list.find(idx) == expanded_list.end()) {
                expanded_list[idx] = AStar_Node(n_x, n_y, g, h, p_curr_node);
                open_list.emplace(std::make_shared<AStar_Node>(expanded_list[idx]));
            } else {
                if (g < expanded_list[idx].g) {
                    expanded_list[idx].g = g;
                    expanded_list[idx].parent = p_curr_node;
                }
            }
        }
    }
    return path;
}
```

## 参考
- **[kairaedsch / GridSearchVisualiser](https://github.com/kairaedsch/GridSearchVisualiser)**