---
id:  design-pattern-singleton
title: 设计模式 -- 单例模式
sidebar_label: 单例模式
---

> 单例模式是一种创建型设计模式，它确保一个类只有一个实例，并提供一个全局访问点来访问该实例

## 特点
1. 唯一实例：保证一个类只有一个实例存在
2. 全局访问：提供对该实例的全局访问点
3. 延迟初始化：通常在第一次被访问时才创建实例
4. 线程安全：在多线程环境下也能保证单例的唯一性

## 适用场景
- 当类只能有一个实例且客户可以从一个众所周知的访问点访问它时
- 需要控制全局变量或共享资源的访问时
- 当这个唯一实例应该通过子类化可扩展，并且客户应该无需更改代码就能使用扩展后的实例时

## C++ 实现

### 基础版本

<details>
<summary> 简单易懂的单例实现 (非线程安全) </summary>

``` cpp
class Singleton {
private:
    static Singleton* instance;  // 静态实例指针
    Singleton() {}              // 私有构造函数
    ~Singleton() {}             // 私有析构函数
    Singleton(const Singleton&) = delete;             // 禁止拷贝构造
    Singleton& operator=(const Singleton&) = delete;  // 禁止赋值操作

public:
    static Singleton* getInstance() {
        if (instance == nullptr) {
            instance = new Singleton();
        }
        return instance;
    }

    void do_Something() {
        std::cout << "Singleton is doing something." << std::endl;
    }
};

// 初始化静态成员变量
Singleton* Singleton::instance = nullptr;
```

</details>

此形式的单例模式实现是非线程安全的，在多线程环境下，可能会创建多个实例

### 线程安全版本

<details>
<summary> 使用双重检查锁定 </summary>

``` cpp
#include <iostream>
#include <mutex>

class Singleton {
private:
    static Singleton* instance;
    static std::mutex mtx;  // 互斥锁
    Singleton() {}
    ~Singleton() {}
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

public:
    static Singleton* getInstance() {
        if (instance == nullptr) {  // 第一次检查
            std::lock_guard<std::mutex> lock(mtx);  // 加锁
            if (instance == nullptr) {  // 第二次检查
                instance = new Singleton();
            }
        }
        return instance;
    }

    void do_Something() {
        std::cout << "Singleton is doing something." << std::endl;
    }
};

// 初始化静态成员变量
Singleton* Singleton::instance = nullptr;
std::mutex Singleton::mtx;
```

</details>

<details>
<summary> 使用局部静态变量 (C++11或更高标准) </summary>

``` cpp
class Singleton {
private:
    Singleton() {}
    ~Singleton() {}
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

public:
    static Singleton& getInstance() {
        static Singleton instance;  // C++11保证局部静态变量的线程安全
        return instance;
    }

    void do_Something() {
        std::cout << "Singleton is doing something." << std::endl;
    }
};
```

</details>

### 使用单例

<details>
<summary> 获取以及使用单例 </summary>

``` cpp
int main() {
    // 获取单例实例
    Singleton& singleton = Singleton::getInstance();
    
    // 使用单例
    singleton.do_Something();
    
    // 尝试创建另一个实例（会失败，因为构造函数是私有的）
    // Singleton another;  // 错误
    
    return 0;
}
```

</details>

### 懒汉式 || 饿汉式
单例模式根据实例化时机可以分为懒汉式(Lazy Initialization)和饿汉式(Eager Initialization)两种

#### 懒汉式单例 (Lazy Singleton)
- 延迟加载: 只有在第一次调用 `getInstance()` 时才创建实例
- 节省资源: 如果从未使用，则不会创建实例
- 需要考虑线程安全

<details>
<summary> 懒汉式 C++ 实现 </summary>

``` cpp
class Singleton {
private:
    Singleton() {}
    ~Singleton() {}
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

public:
    static Singleton& getInstance() {
        static Singleton instance;  // C++11保证局部静态变量的线程安全
        return instance;
    }
};
```

</details>

#### 饿汉式单例 (Eager Singleton)
- 立即加载: 在程序启动时（静态变量初始化时）就创建实例
- 可能浪费资源: 即使从未使用也会创建实例
- 线程安全: 由于实例在main函数之前就已创建，天然线程安全 

<details>
<summary> 饿汉式 C++ 实现 </summary>

``` cpp
class Singleton {
private:
    static Singleton instance;  // 静态实例
    Singleton() {}
    ~Singleton() {}
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

public:
    static Singleton& getInstance() {
        return instance;
    }
};

// 在类外部初始化静态成员（在main函数之前完成）
Singleton Singleton::instance;
```

</details>

### 懒汉式 vs 饿汉式

|特性       |懒汉式                     |饿汉式|
|:--------:|:--------------------------:|:---------------------------:|
|初始化时机 |第一次调用getInstance()时  |程序启动时（静态变量初始化阶段）|
|线程安全   |需要额外处理               |天然线程安全|
|资源占用   |按需分配，节省资源         |始终占用资源|
|性能       |首次访问可能有延迟         |无初始化延迟|

1. 更推荐使用懒汉式实现
2. 当确定单例在程序运行期间一定会被使用时选择饿汉式
3. 当需要避免任何可能的初始化竞争时，推荐使用饿汉式
