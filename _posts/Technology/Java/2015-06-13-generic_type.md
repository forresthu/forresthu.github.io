---

layout: post
title: Java泛型
category: Technology
tags: Java
keywords: JAVA Generic Type 泛型

---

## 前言 ##

“泛型”只在程序源码中存在，在编译后的字节码文件中，就已经被替换为原来的原始类型（Raw Type，也称为裸类型）了，并且在相应的地方插入了强制转型代码，因此对于运行期的Java语言来说，ArrayList<int>与ArrayList<String>就是同一个类。所以说泛型技术实际上是Java语言的一颗语法糖，Java语言中的泛型实现方法称为类型擦除，基于这种方法实现的泛型被称为伪泛型。最大好处是编绎期的类型错误检查。

C++的泛型是在编绎期实现的，为每一个类型都生成一份代码，所以C++的泛型容易让编绎后的代码出现膨胀。

## 实例对比


    public class A{  
        public static void main(String[] args) {  
            A a = new A();  
            a.test();  
              
            String r = a.test();  
        }  
          
        public <T> T test() {  
            return (T) new Object();  
        }  
    } 
    

`javap -c A`对应的字节码


    public class A {
      public A();
        Code:
           0: aload_0
           1: invokespecial #1                  // Method java/lang/Object."<init>":()V
           4: return
    
      public static void main(java.lang.String[]);
        Code:
           0: new           #2                  // class A
           3: dup
           4: invokespecial #3                  // Method "<init>":()V
           7: astore_1
           8: aload_1
           9: invokevirtual #4                  // Method test:()Ljava/lang/Object;
          12: checkcast     #5                  // class java/lang/String
          15: astore_2
          16: return
    
      public <T extends java/lang/Object> T test();
        Code:
           0: new           #6                  // class java/lang/Object
           3: dup
           4: invokespecial #1                  // Method java/lang/Object."<init>":()V
           7: areturn
    }

Java的泛型是伪泛型。在编译期间，所有的泛型信息都会被擦除掉。

    public class A{  
        public static void main(String[] args) {  
            A a = new A();  
            a.test();  
              
            String r = (String)a.test();  
        }  
          
        public  Object test() {  
            return new Object();  
        }  
    } 


对应的字节码

    public class A {
      public A();
        Code:
           0: aload_0
           1: invokespecial #1                  // Method java/lang/Object."<init>":()V
           4: return
    
      public static void main(java.lang.String[]);
        Code:
           0: new           #2                  // class A
           3: dup
           4: invokespecial #3                  // Method "<init>":()V
           7: astore_1
           8: aload_1
           9: invokevirtual #4                  // Method test:()Ljava/lang/Object;
          12: pop
          13: aload_1
          14: invokevirtual #4                  // Method test:()Ljava/lang/Object;
          17: checkcast     #5                  // class java/lang/String
          20: astore_2
          21: return
    
      public java.lang.Object test();
        Code:
           0: new           #6                  // class java/lang/Object
           3: dup
           4: invokespecial #1                  // Method java/lang/Object."<init>":()V
           7: areturn
    }
    
可见，两个类的字节码文件基本一摸一样。

```java

import java.util.ArrayList;
class Playground {
    public static void main(String[ ] args) {
        ArrayList<Integer> int_list = new ArrayList<Integer>();
        ArrayList<String> str_list = new ArrayList<String>();
        System.out.println(int_list.getClass() == str_list.getClass());
    }
}
```
关于 C++ 泛型的实现，ArrayList 和 ArrayList 应该是不同的两种类型。java这段代码的输出是 true。
```java
import java.util.ArrayList;
class Playground {
    public static void main(String[ ] args) {
        System.out.println("Hello World");
    }
    public static void sayHello(ArrayList<String> list) {}
    public static void sayHello(ArrayList<Integer> list) {}
}
```
我们知道，方法的重载的基本条件是两个同名方法的参数列表并不相同。但是当我们尝试编译上述程序的时候，却会得到这样的错误提示：
```
Playground.java:12: error: name clash: sayHello(ArrayList<Integer>) and sayHello(ArrayList<String>) have the same erasure
    public static void sayHello(ArrayList<Integer> list) {
                       ^
1 error
```
这是因为当对泛型进行擦除以后，两个 sayHello 方法的参数类型都变成了 ArrayList，从而变成了同名方法，所以就会出现命名冲突报错。
    
## 引用

[java泛型（一）、泛型的基本介绍和使用][]
    





[java泛型（一）、泛型的基本介绍和使用]: http://blog.csdn.net/lonelyroamer/article/details/7864531