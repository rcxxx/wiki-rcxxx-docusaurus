---
id:  cc-stl-frame
title: STL(标准模板库)
sidebar_label: 构成
---

## 容器(Containers)
容器是用于存储数据的模板类，主要分为以下几类：

### 序列容器
- vector: 动态数组，支持快速随机访问
- deque: 双端队列，支持两端高效插入和删除，不持支随机访问
- list: 双向链表，支持高效的插入和删除，不持支随机访问

### 关联容器
- set: 集合，存储唯一元素，元素自动排序
- multiset: 允许重复元素的集合
- map: 映射，存储键值对，键唯一，自动排序
- multimap: 允许重复元素的映射

### 无序容器
- unordered_set: 无序集合，基于哈希表实现
- unordered_map: 无序映射，基于哈希表实现

## 算法(Algorithms)
STL 中有大量的泛型算法，可以直接应用于容器

- 排序: sort、stable_srot、partial_sort 等
- 查找: find、binary_search、lower_bound、upper_bound 等
- 变换: transform、copy、fill 等
- 还包括其他的: accumulate、count、for_each 等

## 迭代器(Iterators)
迭代器是用于遍历容器元素的对象，提供一种统一的方式来访问容器中的元素，STL 迭代器主要分为一下几种类型

- 输入迭代器: 只读访问容器元素
- 输出迭代器: 只写访问容器元素
- 前向迭代器: 可以多次读取同一元素
- 双向迭代器: 可以向前和向后遍历
- 随机访问迭代器: 支持高效的随机访问

## 函数对象(Function Objects)
函数对象是重载了 operator() 的类，允许将对象像函数一样调用，STL 中的算法常使用函数对象作为参数，以实现自定义操作

## 适配器(Adapters)
适配器用于修改容器或迭代器的接口，使其更加灵活，主要有

### 容器适配器
- stack: 基于 deque 或 vector 实现的后进先出（LIFO）结构
- queue: 基于 deque 实现的先进先出（FIFO）结构
- priority_queue: 基于堆实现的优先级队列

### 迭代器适配器
- reverse_iterator: 反向迭代器。
- insert_iterator: 用于在容器中插入元素的迭代器。