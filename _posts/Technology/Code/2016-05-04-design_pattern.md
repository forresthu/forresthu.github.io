---

layout: post
title: 换个角度看待设计模式
category: 技术
tags: Code
keywords: java design pattern

---

## 前言

世事纷扰，但总有几个线头。兵法多样，就那几个套路。

||设计模式|军事|
|---|---|---|
|战术|二十三个设计模式|三十六计|
|战略|4个原则|以正合以奇胜|

**以正合，以奇胜**。以奇胜，被人们误读为奇袭得胜，还是贪巧求速的心理作怪。以奇胜的奇，不念qi，念ji，是个数学词汇，奇数、偶数的奇，古人又称为“余奇”，多余的部分，正兵安排好了，余下来的就是奇兵，关键的时候用。  简单地说，奇（ji）兵，不是出奇制胜的部队，是预备队。孙子的意思是：不要一下子把所有的牌都打完了，留一张在手上，关键时候打出去。 “奇正之变，不可胜穷也。奇正相生，如环之无端。” 奇正之间怎么相互转化呢？其实很简单，已经投入战斗的，是正兵；预备队，是奇兵。预备队投上去，就变为正兵了。正在打的部队撤下来，又变成奇兵。

## 分类方式

《Pattern Oriented Software Architecture》中提到，将模式分为三种类型：

1. 体系结构模式，比如mvc
2. 设计模式
3. 惯用法，比如引用计数法

Design patterns were originally grouped into the categories: creational patterns, structural patterns, and behavioral patterns, and described using the concepts of delegation, aggregation, and consultation

Design patterns are composed of several sections . Of particular interest are the Structure, Participants, and Collaboration sections. These sections describe a design motif:

1. a prototypical **micro-architecture** that developers copy and adapt to their particular designs to solve the recurrent problem described by the design pattern. 
2. A micro-architecture is a set of program constituents (e.g., classes, methods...) and their relationships. 
3. Developers use the design pattern by introducing in their designs this prototypical micro-architecture, which means that micro-architectures in their designs will have structure and organization similar to the chosen design motif.

`http://design-patterns.readthedocs.io/zh_CN/latest/` 传统分类方式

- 创建型模式，创建型模式(Creational Pattern)对类的实例化过程进行了抽象，能够**将软件模块中对象的创建和对象的使用分离**单一职责原则，仅一个对象的创建独立出来，催生了spring的ioc，减少了代码中的创建类代码）。在创建什么(What)，由谁创建(Who)，何时创建(When)等方面都为软件设计者提供了尽可能大的灵活性。
- 结构型模式(Structural Pattern)描述如何将类或者对 象结合在一起形成**更大的结构**.结构型模式可以分为类结构型模式和对象结构型模式

	- 类结构型模式关心类的组合,一般只存在继承关系和实现关系.
	- 对象结构型模式关心类与对象的组合，通过关联关系使得在一 个类中定义另一个类的实例对象(也就是成员变量)，然后通过该对象调用其方法。
- 行为型模式(Behavioral Pattern)**是对在不同的对象之间划分责任和算法的抽象化**（所以一般先定义好高层接口，定义好交互关系）。行为型模式不仅仅关注类和对象的结构（涉及到结构设计，但不是重点），而且重点关注它们之间的相互作用。

    行为型模式分为类行为型模式和对象行为型模式两种：

    - 类行为型模式：类的行为型模式使用继承关系在几个类之间分配行为，类行为型模式主要通过多态等方式来分配父类与子类的职责。
    - 对象行为型模式：对象的行为型模式则使用对象的聚合关联关系来分配行为，对象行为型模式主要是通过对象关联等方式来分配两个或多个类的职责。

根据“合成复用原则”，系统中要尽量使用关联关系来取代继承关系，因此大部分结构/行为型设计模式都属于对象结构/行为型设计模式。

[如何写好单元测试？](https://mp.weixin.qq.com/s/EZejQam6n_qU5ZLDOv82Rg)设计模式最重要的点还是在于解耦和复用，创建型模式**将创建代码与使用代码解耦**，结构型模式是将**功能代码**解耦，行为型模式将**行为代码**解耦，最终达到高内聚，松耦合的目标，设计模式体现了设计原则。我们经常说的“高内聚 松耦合”**究竟什么是高内聚，什么是松耦合？**
1. 高内聚：相近功能放在同一类中，相近功能往往会被同时修改，放到同一个类中在修改时，代码更易维护（指导类本身的设计）。PS：比如将两个字段拼成一个字符串来作为map的key，“将两个字段拼成字符串”和“将字符串解析为两个字段”的方法就一定要放在一起，这样可以改一个，就知道需要改另一个。
2. 松耦合：类与类之间的依赖关系简单清晰，一个类的代码改动不会或者很少导致依赖类的代码修改（指导类间依赖关系设计）。PS：假设一个A类里有List成员，不要在B类里 `a.getList().add(element)` 这样操作，A类尽量写成充血模型，否则List 换成Map了，B类恨不能也要重写。

## 成为通用术语

[从技术演变的角度看互联网后台架构](https://mp.weixin.qq.com/s/7Qc8irbh0rz43OPWKbO2Ag)20多年前的经典著作DesignPatterns中讲过学习设计模式的意义：学习设计模式并不是要你学习一种新的技术或者编程语言，而是建立一种交流的共同语言和词汇，在方案设计时方便沟通，同时也帮助人们从更抽象的层次去分析问题本质，而不被一些实现的细枝末节所困扰。同时，当我们能把很多问题抽象出来之后，也能帮我们更深入更好地去了解现有系统。

[​圣杯与银弹——没用的设计模式](https://mp.weixin.qq.com/s/3TbunRkouM7PtCQrC52brQ)设计模式作为通用的术语确实可以增加不同工程师之间的沟通效率，但是降低沟通成本的前提是双方对同术语有着相同的并且正确的认识，如果双方的理解有差异，反而会制造更多的困惑。我们可以将 23 种不同的设计模式分成两部分来分析，其中一部分是单例模式、抽象工厂模式这些被广泛接受并理解的模式，另一部分是迭代子模型、命令模式和解释器模式等不容易被理解的复杂模式。从单例模式以及观察者模式的命名，我们就能猜到它们想要解决的问题，使用类似的术语也很难造成歧义，确实能够起到提高沟通效率的作用；不过，**对于复杂的设计模式想要正确理解就非常困难，更不用说用来沟通了**。

## 软件设计之美

如果用数学来比喻的话，**设计原则就像公理**，它们是我们讨论各种问题的基础，而**设计模式则是定理**，它们是在特定场景下，对于经常发生的问题给出的一个可复用的解决方案。设计模式之所以能成为一个特定的解决方案，很大程度上是因为它是一种好的做法，符合软件设计原则，所以，设计原则其实是这些模式背后的东西。

学习设计模式，我们应该有一个更开阔的视角：要看到语言的局限，虽然设计模式本身并不局限于语言，但**很多模式之所以出现，就是受到了语言本身的限制**。比如，Visitor 模式主要是因为 C++、Java 之类的语言只支持单分发，也就是只能根据一个对象来决定调用哪个方法。而对于支持多分发的语言，Visitor 模式存在的意义就不大了。PS：比如golang有了channel，则观察者订阅者模式的意义就不大了。

**Annotation 可以说是消灭设计模式的一个利器**。语言本身的局限造成了一些设计模式的出现，这一点在 Java 上表现得尤其明显。随着 Java 自身的发展，随着 Java 世界的发展，有一些设计模式就越来越少的用到了。比如，Builder 模式通过 Lombok 这个库的一个 Annotation 就可以做到：

```java
@Builder
class Student {
  private String name;
  private int age;
  ...
}
```

Decorator 模式也可以通过 Annotation 实现，比如，一种使用 Decorator 模式的典型场景，是实现事务，很多 Java 程序员熟悉的一种做法就是使用 Spring 的 Transactional

```java
class Handler {
  @Transactional
  public void execute() {
    ...
  }
}
```

所以，**我们学习设计模式除了学习标准写法的样子，还要知道，随着语言的不断发展，新的写法变成了什么样子**。

## 底层逻辑

[洞察设计模式的底层逻辑](https://mp.weixin.qq.com/s/qRjn_4xZdmuUPQFoWMBQ4Q)
1. 过程式就是过分强调了how，一开始就思考怎么去做，过程式思维是以自己为中心，导演了整个功能流程，自己承担了太多自己不应该承担的职责，整个设计就显得不灵活。面向对象是从对象的角度去看问题，解决问题是由各个对象协作完成，设计模式的基石就是面向对象，脱离了面向对象去谈设计模式那是耍流氓。
2. “找到变化，封装变化”，这才是设计模式的底层逻辑

![](/public/upload/code/change.png)

## 其它

许式伟：我个人不太喜欢常规意义上的 “设计模式”。或者说，我们对设计模式常规的打开方式是有问题的。**理解每一个设计模式，都应该放到它想要解决的问题域来看**。所以，我个人更喜欢的架构范式更多的是 “设计场景” 的总结。“设计场景” 和设计模式的区别在于它有自己清晰的问题域定义，是一个实实在在的通用子系统。是的，这些 “通用的设计场景”，才是架构师真正的武器库。如果我们架构师总能把自己所要解决的业务场景分解为多个 “通用的设计场景” 的组合，这就代表架构师有了极强的架构范式的抽象能力。而这一点，正是架构师成熟度的核心标志。

[​圣杯与银弹——没用的设计模式](https://mp.weixin.qq.com/s/3TbunRkouM7PtCQrC52brQ)软件系统中处处都是设计，学习设计模式无法让我们成为优秀的工程师，如果我们错误的理解了这本书的目的，以为自己学到了软件设计或者面向对象设计的精髓，那就大错特错了。软件设计的能力并不是一朝一夕就能培养出来的，它需要我们不断对代码进行思考，**理解可能存在的扩展点**并设计合理的抽象。PS：面向扩展点设计。[​圣杯与银弹——没用的设计模式](https://mp.weixin.qq.com/s/3TbunRkouM7PtCQrC52brQ) 对设计模式做了一定的批评，对“单元测试”推崇有加，提升项目单元测试覆盖率的过程会让我们思考如何写出更利于测试的代码，虽然软件工程中没有银弹，但是单元测试不是银弹可能也所差无几了。

[​圣杯与银弹——没用的设计模式](https://mp.weixin.qq.com/s/3TbunRkouM7PtCQrC52brQ)抽象的设计模式是从不同具体项目中总结出来的通用经验，从具体到抽象的过程相对容易，然而**从抽象的模式套用到具体场景却很困难**，如果没有足够的经验或者思考只会做出拙劣的设计。而且并不是居高临下的架构设计才是系统设计，每个包、方法甚至代码中的空行中都体现了作者的设计思路，抽象的理论和模式能够起到指导的作用，但是真正让设计融入系统的还是工程师的丰富经验和深入思考。

21 世纪诞生的一些编程语言与过去的编程语言有着很大的不同，不仅新的编程语言开始接收函数式编程中的一些思想和设计，上个世纪诞生的编程语言也在吸纳不同的编程范式，函数和方法成为了语言中的一等公民，我们可以直接**向函数中传递函数来简化过去复杂的类关系**。比如观察者模式[函数式编程的设计模式](http://qiankunli.github.io/2018/12/15/functional_programming_patterns.html)

```
object.OnUpdate(func(u *updates) {
    ...
})
```
