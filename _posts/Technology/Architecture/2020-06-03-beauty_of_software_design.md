---

layout: post
title: 《软件设计之美》笔记
category: Architecture
tags: Architecture
keywords: system design principle 

---

## 简介

* TOC
{:toc}

软件设计学习的难度，不在于一招一式，而在于融会贯通。

算法对抗的是数据的规模，而**软件设计对抗的是需求的规模**。

一个好的设计是在一个“小内核”上构建起来，然后逐步添加更多模型。比如Spring代码那么多，核心却很简单。[程序员必备的思维能力：抽象思维](https://mp.weixin.qq.com/s/cJ0odiYcphhNBoAVjqpCZQ)我们知道Spring的核心功能是Bean容器，那么在看Spring源码的时候，我们可以着重去看它是如何进行Bean管理的？它使用的核心抽象是什么？不难发现，Spring是使用了BeanDefinition、BeanFactory、BeanDefinitionRegistry、BeanDefinitionReader等核心抽象**实现了Bean的定义、获取和创建**。抓住了这些核心抽象，我们就抓住了Spring设计主脉。

## 分离关注点

大多数系统设计的不够好，问题常常出在分解这步没做好。常见的分解问题就是分解粒度太大，把各种维度混淆在一起（比如技术维度和业务维度）。 举个例子，比如因为存储性能不够，又是批量又是缓存，代码写的很麻烦。但其实最根本的解决之道 是找一个性能较高的存储。

## 如何了解一个软件的设计？

了解设计三步走：模型 ==> 接口 ==> 实现。

1. 模型，也可以称为抽象，是一个软件的核心部分，是这个系统与其它系统有所区别的关键，是我们理解整个软件设计最核心的部分。
2. 接口，是通过怎样的方式将模型提供的能力暴露出去，是我们与这个软件交互的入口。
3. 实现，就是软件提供的模型和接口在内部是如何实现的

我们肯定要先知道项目提供了哪些模型，模型又提供了怎样的能力。如果模型都还没有弄清楚，就贸然进入细节的讨论，你很难分清哪些东西是核心，是必须保留的，哪些东西是可以替换的。如果你清楚了解了模型，也就知道哪些内容在系统中是广泛适用的，哪些内容必须要隔离。

**但如果只知道这些，你只是在了解别人设计的结果，这种程度并不足以支撑你后期对模型的维护**。在一个项目中，常常会出现新人随意向模型中添加内容，修改实现，让模型变得难以维护的情况。造成这一现象的原因就在于他们对于模型的理解不到位。

我们都知道，任何模型都是为了解决问题而生的，所以，理解一个模型，需要了解在没有这个模型之前，问题是如何被解决的，这样，你才能知道新的模型究竟提供了怎样的提升。也就是说，**理解一个模型的关键在于**，要了解这个模型设计的来龙去脉，知道它是如何解决相应的问题。

## 程序设计语言

程序设计语言的发展就是一个“逐步远离计算机硬件，向着待解决的问题靠近”的过程。

程序库就是为了消除重复而出现的。而**消除重复，也是软件设计的初衷**。

程序库最初只是为了消除重复。后来，逐渐有了标准库，然后有了大量的第三方库，进而发展出包管理器。程序设计语言的接口不只包含语法，还有程序库。而且，学习一种程序设计语言提供的模型时，不仅仅要看语法本身有什么，还要了解有语言特性的一些程序库。语法和程序库是在解决同一个问题，二者之间是相互促进的关系。一些经过大量实践验证过的程序库会变成语言的语法；如果语法不够好，新的程序库就会出现，新一轮的编程模型就开始孵化。比如synchronized ==> aqs ==> synchronized。

## 设计原则

软件设计是一门关注长期变化的学问。一个模块应该有且仅有一个变化的原因。一个模块最理想的状态是不改变，其次是少改变，它可以成为一个模块设计好坏的衡量标准。**需求为什么会改变？因为有各种提出需求的人，不同的人提出的需求，其关注点是不同的**。

开闭原则：软件实体（类、模块、函数）应该对扩展开放，对修改封闭。不修改代码，那怎么实现新的需求呢？靠扩展。用更通俗的话来解释，就是新需求应该用新代码实现。**开放封闭原则向我们描述的是一个结果**，但是，**这个结果的前提是要在软件内部留好扩展点，而这正是需要我们去设计的地方。因为每一个扩展点都是一个需要设计的模型**。面向对象“封装”的要点是行为，**数据只是实现细节**，而很多人习惯性的写法是面向数据的，这也是导致很多人在设计上缺乏扩展性思考的一个重要原因。在真实的项目中，想要达到开放封闭原则的要求并不是一蹴而就的。“有变动再说”，但总的来说，我们每做一次这种模型构建，**最核心的类**就会朝着稳定的方向迈进一步。

依赖倒置原则（Dependency inversion principle，简称 DIP）
1. 高层模块不应依赖于低层模块，二者应依赖于抽象。High-level modules should not depend on low-level modules. Both should depend on abstractions.
2. 抽象不应依赖于细节，细节应依赖于抽象。Abstractions should not depend on details. Details (concrete implementations) should depend on abstractions.

理解这个原则的关键在于理解“倒置”，**它是相对于传统自上而下的解决问题然后组合的方式而言的**。高层模块不依赖于低层模块，可以通过引入一个抽象，或者模型，将二者解耦开来。高层模块依赖于这个模型，而低层模块实现这个模型。

在 DIP 的指导下，具体类还是能少用就少用。但有一个问题，**最终具体类我们还是要用的，毕竟代码要运行起来不能只依赖于接口。那具体类应该在哪用呢？**在 Java 世界里，做这些组装工作的就是 DI 容器。

理解这些原则，关键的第一步还是**分离关注点**（PS：想起了公司的战略拆解会），把不同的内容区分开来。所有原则都是在讲，尽可能把变的部分和不变的部分分开，让不变的部分稳定下来。我们知道，模型是相对稳定的，实现细节则是容易变动的部分。所以，构建出一个稳定的模型层，对任何一个系统而言，都是至关重要的。

几乎每个人在初学设计的时候，都会有用力过猛的倾向。如何把握设计的度，是每个做设计的人需要耐心锤炼的。所以，行业里有人总结了一些实践原则，给了我们一些启发性的规则，帮助我们把握设计的度。KISS 原则，是“Keep it simple, stupid”的缩写，也就是保持简单、愚蠢的意思。它告诫我们，对于大多数系统而言，和变得复杂相比，**保持简单能够让系统运行得更好**。这种级别的原则听上去很有吸引力，但问题是，你并不能用它指导具体的工作。因为，怎么做叫保持简单，怎么做就叫复杂了呢？这个标准是没办法确定的。所以，有人基于自己的理解给出了一些稍微具体一点的原则，比如简单设计（Simple Design）原则：
1. 通过所有测试；
2. 消除重复；
3. 表达出程序员的意图；PS：代码要说明做什么，而不是怎么做。
4. 让类和方法的数量最小化。

没有良好的设计，代码就没有可测试的接口，根本没有办法测试，TDD 也就无从谈起。不懂设计，重构就只是简单的提取方法，改改名字，对代码的改进也是相当有限的。


## 巩固

阻碍一个程序员写出好的程序库的原因，往往是没有找到一个好问题去解决。程序员不能只当一个问题的解决者，还应该经常抬头看路，做一个问题的发现者。

一个好的设计，应该找到一个最小的核心模型，所有其他的内容都是在这个核心模型上生长出来的，越小的模型越容易理解，相对地，也越容易保持稳定。比如设计一个http mock服务器，其核心模型为`server.request("foo").response("bar");` 一方面表达出预期；另一方面给出返回的结果。


既然我们已经决定要改进了，就应该好好地把设计改进一下，而不只是把功能重新实现一遍。如何改进既有项目的设计？
1. 我们要找到改进的目标，也就是一个系统本来应有的面貌。**如果有机会从头设计这个系统，它应该是什么样子呢？**这就是为什么我们前面要学习那么多设计一个系统的知识，否则，没有一个设计知识的沉淀，所谓的“重新设计”，因为思维的惯性实在是太大了，弄不好就会回到原来的老路上。
2. 接下来，我们要做的是，对比新旧设计，找到一条改进路径。对于不同的项目，选择的路径可能是不同的，有人会选择关键路径上的关键模块进行改进，也有人会选择影响较小的模块先进行探索，无论是哪种方案都是可以的。一个关键点就在于，**动作要小**。永远不要指望一个真实的项目停下来，一步到位地进行改进。

## 扩展系统

《系统性能调优必知必会》AKF 立方体在《The Art of Scalability》一书中被首次提出，旨在提供一个系统化的扩展思路。AKF 把系统扩展分为以下三个维度：
1. X 轴：直接水平复制应用进程来扩展系统。X 轴扩展系统时实施成本最低，只需要将程序复制到不同的服务器上运行，再用下游的负载均衡分配流量即可。X 轴只能应用在无状态进程上，故无法解决数据增长引入的性能瓶颈。
2. Y 轴：将功能拆分出来扩展系统。Y 轴扩展系统时实施成本最高，通常涉及到部分代码的重构，但它通过拆分功能，使系统中的组件分工更细，因此可以解决数据增长带来的性能压力，也可以提升系统的总体效率。比如关系数据库的读写分离、表字段的垂直拆分，或者引入缓存
3. Z 轴：基于用户信息扩展系统。Z 轴扩展系统时实施成本也比较高，但它基于用户信息拆分数据后，可以在解决数据增长问题的同时，基于地理位置就近提供服务，进而大幅度降低请求的时延，比如常见的 CDN 就是这么提升用户体验的。但 Z 轴扩展系统后，一旦发生路由规则的变动导致数据迁移时，运维成本就会比较高。

|扩展维度|以负载均衡组件为例|
|---|---|
|X轴|三/四层负载均衡<br>Kubernetes Service 等|
|Y轴|七层负载均衡<br>nginx 等，将不同的url 路由到不同的server|
|Z轴|七层负载均衡<br>nginx 等，根据请求中的uid cookie/session 等信息做路由|

七层负载均衡是分布式系统提升性能的必备工具。除了基于各种路由策略分发流量，提高性能及可用性（如宕机迁移）外，负载均衡还需要完成上、下游协议间的适配、转换。例如考虑到信息安全，跑在公网上的外部协议常基于 TLS/SSL 协议，而在效率优先的企业内网中，一般不会使用大幅降低性能的 TLS 协议，因此负载均衡需要拥有卸载或者装载 TLS 层的能力。

## 体会

开发层面讨论微服务的更多是框架、治理、性能等，但是**从完整的软件工程来看我们严重缺失分析、设计能力**，这也是我们现在的工程师普遍缺乏的技术。我们经常会发现一旦你想重构点东西是多么的艰难，**就是因为在初期构造这栋建筑的时候严重缺失了通盘的分析、设计**，最终导致这个建筑慢慢僵化最后人见人怕，因为他逐渐变成一个怪物。

依赖方先ready，然后我们紧接着进行测试、发布吗。如果是业务、架构合理的情况下，这种场景最大的问题就是我们的项目容易被依赖方牵制，这会带来很多问题，比如，研发人员需要切换出来做其他事情，branch 一直挂着，不知道哪天突然来找你说可以对接了，也许这已经过去一个月或者更久，这种方式一旦养成习惯性研发流程就很容易产生线上 BUG 。

“最简单的需求分析，是将需求抽象成函数，比如findMax(),findMin()。**好的需求分析，是将需求抽象成参数**,比如findData(int sortIndex)”