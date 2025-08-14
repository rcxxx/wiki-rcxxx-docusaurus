---
id:  cc-classes-virtual-function
title: 虚函数
sidebar_label: 虚函数
---

## 虚函数定义
- 基类将类型相关的函数与派生类不做改变直接继承的函数区分对待，一种是基类希望派生类直接继承而不要改变的函数；另一种是基类希望派生类进行覆盖的函数，这样的函数通常在基类中定义为 **虚函数（virtual function）**

- 对于某些函数，基类希望它的派生类各自定义适合自身的版本，此时基类就将这些函数声明成 **虚函数（virtual function）**

- 任何构造函数之外的非静态函数都可以是虚函数。关键字 `virtual` 只能出现在类内部的声明语句之前而不能用于类外部的定义

<details>
<summary> 其基本语法如下 </summary>

``` cpp
class Base {
public:
    virtual void show() {  // 虚函数
        std::cout << "Base class show function called." << std::endl;
    }
};

class Derived : public Base {
public:
    void show() override {  // 重写虚函数
        std::cout << "Derived class show function called." << std::endl;
    }
};
```

</details>


- 如果基类声明了一个虚函数，则该函数在派生类中隐式的也是虚函数

- 当我们使用指针或者引用调用函数的时候，该调用将被动态绑定。根据引用或者指针所绑定的对象类型不同，决定执行函数的版本

## 虚函数与多态的关系
1. **运行时多态**：虚函数实现了运行时多态，允许程序在运行时根据对象的实际类型来选择调用哪个函数。通过基类指针或引用可以调用派生类的重写版本

2. **虚表(vtable)**：当一个类包含虚函数时，编译器会为该类生成一个虚表(vtable)，虚表是一个指向该类虚函数的指针数组。每个对象实例会持有一个指向其虚表的指针(vptr)。在调用虚函数时，程序会通过 vptr 查找实际的函数地址

3. **动态绑定**：虚函数的调用是动态绑定的。在编译时，编译器无法确定调用哪个版本的函数，直到运行时根据对象的实际类型进行绑定。这使得同一接口可以在不同的派生类上表现出不同的行为

<details>
<summary> 示例代码 </summary>

``` cpp
int main() {
    Base* b;           // 基类指针
    Derived d;        // 派生类对象
    b = &d;           // 指向派生类对象

    b->show();        // 调用派生类的 show() 函数
    return 0;
}
```

</details>


## 纯虚函数
- 纯虚函数是在基类中声明但没有提供实现的虚函数。它用于定义一个接口，要求所有派生类必须重写这个函数，以便提供具体的实现。纯虚函数通过在函数声明的末尾添加 = 0 来标识

<details>
<summary> 语法 </summary>

``` cpp
class Base {
public:
    virtual void show() = 0;  // 纯虚函数
};
```

</details>

1. 纯虚函数在基类中没有实现，只有声明。
2. 任何派生自包含纯虚函数的基类的类都必须实现这些纯虚函数，否则该派生类也将成为抽象类，无法实例化。

### 抽象类

- 包含至少一个纯虚函数的类被称为抽象类，不能直接创建该类的对象（不能实例化）。
- 抽象类强制派生类提供实现，确保所有派生类遵循相同的接口。

<details>
<summary> 示例代码 </summary>

``` cpp
#include <iostream>

class Shape {
public:
    virtual void draw() = 0;  // 纯虚函数
};

class Circle : public Shape {
public:
    void draw() override {  // 实现纯虚函数
        std::cout << "Drawing Circle" << std::endl;
    }
};

class Square : public Shape {
public:
    void draw() override {  // 实现纯虚函数
        std::cout << "Drawing Square" << std::endl;
    }
};

int main() {
    Shape* shape1 = new Circle();  // 创建 Circle 对象
    Shape* shape2 = new Square();  // 创建 Square 对象

    shape1->draw();  // 输出: Drawing Circle
    shape2->draw();  // 输出: Drawing Square

    delete shape1;
    delete shape2;

    return 0;
}
```

</details>

## 虚函数表
虚函数表（vtable）是由编译器自动生成的数据结构，用于支持运行时多态。它的主要功能是存储类的虚函数地址，以便在调用虚函数时能够动态绑定到正确的函数实现

1. 每个包含虚函数的类都有一个虚函数表，存储了该类的虚函数指针
2. 每个对象实例持有一个指向虚函数表的指针：虚指针（vptr）指向该对象的类的虚函数表。
3. 当通过基类指针或引用调用虚函数时，程序会通过 vptr 查找对应的函数地址，从而实现动态绑定

<details>
<summary> 示例代码 </summary>

``` cpp
class Base {
public:
    virtual void show() {
        std::cout << "Base show" << std::endl;
    }
};

class Derived : public Base {
public:
    void show() override {
        std::cout << "Derived show" << std::endl;
    }
};

int main() {
    Base* b = new Derived();
    b->show();  // 输出: Derived show
    delete b;
    return 0;
}
```
- Derived 类的对象有一个指向 Derived 类的虚函数表的指针，通过这个指针，程序能够找到并调用 Derived 类的 show() 函数

</details>

## 虚析构函数
当涉及到继承和多态的情况下，构造和析构的顺序需要注意
1. 构造顺序：创建一个派生类时，会先调用基类的构造函数，再调用派生类的构造函数，确保基类部分在派生类使用之前已经完全初始化

<details>
<summary> 示例代码 </summary>

``` cpp
class Base {
public:
    Base() {
        std::cout << "Base constructor" << std::endl;
    }
};

class Derived : public Base {
public:
    Derived() {
        std::cout << "Derived constructor" << std::endl;
    }
};

int main() {
    Derived d;
    return 0;
}
```
- 输出

```
Base constructor
Derived constructor
```

</details>

1. 析构顺序：销毁一个派生类时，先调用派生类的析构函数，再调用基类的析构函数，确保派生类在基类部分被销毁前能正确清理资源

**虚析构函数的作用**

确保派生类的析构函数被调用
- 如果通过基类指针删除派生类对象，而基类的析构函数非虚析构函数，那么只有基类的虚构函数被调用，派生类的析构函数则不会执行，可能导致资源泄漏

<details>
<summary> 示例代码 </summary>

``` cpp
class Base {
public:
    virtual ~Base() {  // 虚析构函数
        std::cout << "Base destructor" << std::endl;
    }
};

class Derived : public Base {
public:
    ~Derived() override {
        std::cout << "Derived destructor" << std::endl;
    }
};

int main() {
    Base* obj = new Derived();  // 创建派生类对象
    delete obj;
    return 0;
}
```
- 输出

```
Derived destructor
Base destructor
```

</details>

## override 和 final 关键字

- 使用 override 关键字明确表示一个函数是重写基类的虚函数，这样可以在编译时检查函数签名是否匹配
- 使用 final 关键字可以禁止派生类重写某个虚函数，增强代码的可读性和安全性