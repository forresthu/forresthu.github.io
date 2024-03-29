---

layout: post
title: mecha 架构学习
category: Architecture
tags: Mesh
keywords: mecha

---

## 简介

* TOC
{:toc}

两篇文章很多深度，需要多次重复阅读。 

[Mecha：将Mesh进行到底](https://mp.weixin.qq.com/s/sLnfZoVimiieCbhtYMMi1A)

[Multi-Runtime Microservices Architecture](https://www.infoq.com/articles/multi-runtime-microservice-architecture/)[[译] 多运行时微服务架构](https://skyao.io/post/202003-multi-runtime-microservice-architecture/)  

[云原生时代，Java危矣？](https://mp.weixin.qq.com/s/fVz2A-AmgfhF0sTkz8ADNw)不可变基础设施的内涵已不再局限于方便运维、程序升级和部署的手段，而是升华一种为**向应用代码隐藏环境复杂性的手段**，是分布式服务得以成为一种可普遍推广的普适架构风格的必要前提。

## Kubernetes+Mesh是不够的

对于Kubernetes，要管理的最小原语是容器，它专注于在容器级别和流程模型上交付分布式原语。这意味着它在管理应用的生命周期，健康检查，恢复，部署和扩展方面做得很出色，但是在容器内的分布式应用的其他方面却没有做得很好，例如灵活的网络，状态管理和绑定。 

[Dapr 在阿里云原生的实践](https://mp.weixin.qq.com/s/6t7BGz_rC4N-n-DPxcnuhQ)
1. Service Mesh 的实现，本质是**原协议转发**，原协议转发可以给应用带来零侵入的优势。但是原协议转发也带来了一些问题，应用侧中间件SDK还需要去实现序列化和编解码工作，所以在多语言实现方面还有一定成本；随着开源技术的不断发展，使用的技术也在不断迭代，如果想从 Spring Cloud 迁移到 Dubbo ，要么应用开发者需要切换依赖的 SDK，如果想借助Service Mesh来达到这个效果，Service Mesh 需要进行协议转换，成本较高。
2. Service Mesh 更加聚焦于服务间的通讯，而对其他形态的 Mesh 的支持上非常少。比如 Envoy， 除了在 RPC 领域比较成功外，在 Redis、消息等领域的尝试都未见成效。如此多形态的 Mesh ，是共用一个进程吗？如果是共用一个进程，那么是共用一个端口吗？许多问题都没有答案。而控制面方面，从功能角度来看的话，大都围绕流量来展开。看过 xDS 协议里的内容，核心是围绕发现服务和路由来展开。其他类型的分布式能力，在 Service Mesh的控制面中基本没有涉及，更谈不上抽象各种类似 xDS 的协议去支持这些分布式能力。
3. 用户在云上部署业务的形态主要有普通应用类型和FaaS类型。Faas 场景下，比较吸引用户的是成本和研发效率。FaaS 对多语言和编程 API 的友好性上有了更多诉求，那么 Service Mesh 在这两块还是不能给客户带来额外的的价值。

rpc 有mesh，db、mq、redis 都搞mesh，mesh 的未来一定不是更多的sidecar， 运维根本受不了。[蚂蚁云原生应用运行时的探索和实践](https://mp.weixin.qq.com/s/vi1lWDIbhCFdQKf1FKqoVg)
1. 跨语言 SDK 的维护成本高：拿 RPC 举例，大部分逻辑已经下沉到了 MOSN 里，但是还有一部分通信编解码协议的逻辑是在 Java 的一个轻量级 SDK 里的，这个 SDK 还是有一定的维护成本的，有多少个语言就有多少个轻量级 SDK，一个团队不可能有精通所有语言的研发，所以这个轻量级 SDK 的代码质量就是一个问题。
2. 从 Service Mesh 到 Multi-Mesh：蚂蚁最早的场景是 Service Mesh，MOSN 通过网络连接代理的方式进行了流量拦截，其它的中间件都是通过原始的 SDK 与服务端进行交互。而现在的 MOSN 已经不仅仅是 Service Mesh 了，而是 Multi-Mesh，因为除了 RPC，我们还支持了更多中间件的 Mesh 化落地，包括消息、配置、缓存的等等。可以看到每个下沉的中间件，在应用侧几乎都有一个对应的轻量级 SDK 存在，这个在结合刚才的第一问题，就发现有非常多的轻量级 SDK 需要维护。为了保持功能不互相影响，每个功能它们开启不同的端口，通过不同的协议去和 MOSN 进行调用。例如 RPC 用的 RPC 协议，消息用的 MQ 协议，缓存用的 Redis 协议。然后现在的 MOSN 其实也不仅仅是面向流量了，例如配置就是暴露了一下 API 给业务代码去使用。
必然需要出现新的形态来解决 Sidecar 过多的问题，合并为一个或者多个 Sidecar 就会成为必然。

## 从云原生中间件的视角

[无责任畅想：云原生中间件的下一站](https://mp.weixin.qq.com/s/EWR6xwbf53XHZ8O3m2bdVA)在云原生时代，不变镜像作为核心技术的 docker 定义了不可变的单服务部署形态，统一了容器编排形态的 k8s 则定义了不变的 service 接口，二者结合定义了服务可依赖的不可变的基础设施。有了这种完备的不变的基础设置，就可以定义不可变的中间件新形态 -- 云原生中间件。云原生时代的中间件，包含了不可变的缓存、通信、消息、事件(event) 等基础通信设施，应用只需通过本地代理即可调用所需的服务，无需关心服务能力来源。

除了序列化协议和通信协议，微服务时代的中间件体系大概有如下技术栈：

* RPC，其代表是 Dubbo/Spring Cloud/gRPC 等。
* 限流熔断等流控，如 hystrix/sentinel 等。
* Cache，其代表是 Redis。
* MQ，其代表有 kafka/rocketmq 等。
* 服务跟踪，如兼容 Opentracing 标准的各种框架。
* 日志收集，如 Flume/Logtail 等。
* 指标收集，如 prometheus。
* 事务框架，如阿里的 seata。
* 配置下发，如 apollo/nacos。
* 服务注册，如 zookeeper/etcd 等。
* 流量控制，如 hystrix/sentinel 等。
* 搜索，如 ElasticSearch。
* 流式计算，如 spark/flink。

把各种技术栈统一到一种事实上的技术标准，才能反推定义出**不可变的中间件设施的终态**。把上面这些事实上的中间件梳理一番后，整体工作即是：

* 统一定义各服务的标准模型
* 定义这些标准模型的可适配多种语言的 API
* 一个具备通信和中间件标准模型 API 的 Proxy
* 适配这些 API 的业务

![](/public/upload/architecture/application_mesh.png)

Service Proxy 可能是一个集状态管理、event 传递、消息收发、分布式追踪、搜索、配置管理、缓存数据、旁路日志传输等诸多功能于一体的 Proxy， 也可能是分别提供部分服务的多个 Proxy 的集合，但对上提供的各个服务的 API 是不变的。Application Mesh 具有如下更多的收益：

* 更好的扩展性与向后兼容性
* 与语言无关
* 与云平台无关
* 应用与中间件更彻底地解耦
* 应用开发更简单。基于新形态的中间件方案，Low Code 或者 No Code 技术才能更好落地。单体时代的 IDE 才能更进一步 -- 分布式时代的 IDE，基于各种形态中间件的标准 API 之对这些中间件的能力进行组合，以 WYSIWYG 方式开发出分布式应用。
* 更快的启动速度。[蚂蚁云原生应用运行时的探索和实践](https://mp.weixin.qq.com/s/vi1lWDIbhCFdQKf1FKqoVg)FaaS 冷启预热池也是我们近期在探索的一个场景，大家知道 FaaS 里的 Function 在冷启的时候，是需要从创建 Pod 到下载 Function 再到启动的，这个过程会比较长。有了运行时之后，我们可以提前把 Pod 创建出来并启动好运行时，等到应用启动的时候其实已经非常简单的应用逻辑了，经过测试发现可以将从 5s 缩短 80% 到 1s。这个方向我们还会持续探索当中。
* 以统一技术形态的 Service Mesh 为基础的云原生中间件技术体系真正发起起来，在其之上的 Serverless 才有更多的落地场景，广大中小企业才能分享云原生时代的技术红利，业务开发人员的编码工作就会越来越少，编程技术也会越来越智能--从手工作坊走向大规模机器自动生产时代。

## Mecha 架构

[云原生运行时的下一个五年](https://mp.weixin.qq.com/s/eS0MB8OiVFmpA_vMFkd9lg) 重sdk ==> mesh ==> 基础设施泛mesh化 ==> 

![](/public/upload/architecture/mesh_rpc.png)
![](/public/upload/architecture/mesh_mosn.png)
在这种架构下，虽然应用跟基础设施之间加了一层网络代理，但对于基础设施协议部分的处理依然保留在 SDK 中，这就导致应用本质上还是要面向某个基础设施做开发，比如想使用 Redis 作为缓存实现，那么应用需要引入 Redis 的 SDK，未来如果想切换到 Memcache 等其他缓存实现，则必须对应用进行改造。由于 SDK 里仍然保留了通信、序列化等协议的处理逻辑，因此随着接入的语言越来越多样化，这里依然存在不能忽视的开发成本。换句话说，泛 Mesh 化改造带来的“轻” SDK 跟传统微服务架构相比虽然降低了异构语言接入基础设施的门槛，但是随着接入语言越来越多样，依赖的中间件能力越来越丰富，我们还需要尝试进一步降低这种门槛。如果对上述两个问题做一层抽象，本质上都可以归结为应用跟基础设施之间的边界不够清晰，或者说**应用中始终嵌入了某种基础设施实现中特有的处理逻辑**，导致两者一直耦合在一起。

dapr和mesh虽然有一些交集，但本质不同，Service Mesh 强调的是透明的网络代理，它并不关心数据本身，而 Dapr 强调的是提供能力，是真正站在应用的角度来思考如何降低应用的开发成本。

现代分布式应用的对外需求分为四种类型（生命周期，网络，状态，绑定）。

![](/public/upload/architecture/four_needs_of_app.jpg)

单机时代，我们习惯性认为 应用 ==> systemcall ==> 内核。  但实际上，换个视角（以应用为中心），应用 对外的需求由systemcall 抽象，最终由内核提供服务。那么在分布式时代，就缺一个类似systemcall 的分布式原语，把分布式的能力 统一标准化之后 给到应用。

![](/public/upload/architecture/mecha_overview.png)

当前的项目开发，开发人员就像老妈子一样，把db、redis、mq 等资源聚在一起，还得考虑他们的容量、负载、连接池等。后续，它们 会向水电一样，支持项目随取随用。

API 和配置的制订以及标准化，预计将会是 Mecha 成败的关键。PS：历史一次次的告诉我们：产品不重要，协议才重要，协议才是最直接反应理念的东西

1. 数据库产品不重要，牛逼的是sql
2. istio 还好， 牛逼的是xds

![](/public/upload/architecture/mecha_intro.png)

1. 所有分布式能力使用的过程（包括访问内部生态体系和访问外部系统）都被 Runtime 接管和屏蔽实现
2. 通过 CRD/ 控制平面实现声明式配置和管理（类似 Servicemesh）
3. 部署方式上 Runtime 可以部署为 Sidecar 模式，或者 Node 模式，取决于具体需求，不强制

在传统的中间件模式下，应用和分布式能力是在一个进程中，以 SDK 方式进行集成。随着各种基础设施下沉，各种分布式能力从应用中移到了应用外。如 K8s 负责了生命周期相关的需求，Istio、Knative 等都负责一些分布式能力。如果将这些能力都移动到独立的 Runtime 中，那么这种情况无论从运维层面还是资源层面来看，都是没办法接受的。所以这时候肯定需要将部分 Runtime 进行整合，最理想的方式肯定是整合成一个。这种方式被定义成 Mecha ，中文意思是机甲的意思。那么对于将各种分布式能力进行整合的 Mecha Runtime 这一目标本身问题不大，那么怎么整合呢？对 Mecha 有什么要求呢？

1. Mecha 的组件能力是抽象的，任何一个开源产品可以快速进行扩展和集成。
2. Mecha 需要有一定的可配置能力，可以通过 yaml/json 进行配置和激活。这些文件格式最好能和主流的云原生方式对齐。
3. Mecha 提供标准的 API ，和主应用之间的交互的网络通信基于此 API 来完成，不再是原协议转发，这样对于组件扩展和 SDK 的维护都能带来极大的便利性。
分布式能力中的生命周期，可以将部分能力交接过底层的基础设施，比如 K8s。当然有些复杂的场景，可能需要 K8s、APP、Mecha Runtime 一起来完成。


## 应用运行时落地——以dapr 为例

[在云原生的时代，我们到底需要什么样的应用运行时？](https://mp.weixin.qq.com/s/PwPC1ZWNZvzQoOZvOAF2Qw)

以微软开源的 dapr 为例，应用所有与 外界的交互（消息队列、redis、db、rpc） 都通过dapr http api

1. 消息队列：
    * 发布消息 `http://localhost:daprport/v1.0/publish/<topic>`
    * 订阅消息  dapr 询问app 要订阅哪些topic，dapr 订阅topic， 当收到topic 消息时，发给app

2. rpc : 请求远程服务 `http://localhost:daprport/v1.0/invoke/<appId>/method/<method-name>`

为了进一步简化调用的过程（毕竟发一个最简单的 HTTP GET 请求也要应用实现 HTTP 协议的调用 / 连接池管理等），dapr 提供了各个语言的 SDK，如 java / go / python / dotnet / js / cpp / rust 。另外同时提供 HTTP 客户端和 gRPC 客户端。我们以 Java 为例，java 的 client API 接口定义如下：

```java
public interface DaprClient {  
   Mono<Void> publishEvent(String topic, Object event);
   Mono<Void> invokeService(Verb verb, String appId, String method, Object request);
    ......
}
```
[蚂蚁开源多运行时项目 Layotto 简介](https://mp.weixin.qq.com/s/IkvsQqpyCTVhnXOfUXswcA)

![](/public/upload/architecture/mesh_layotto.png)

Layotto 作为 Dapr 之外的一个应用运行时实现方案，目的就是希望把应用运行时跟 Service Mesh 两者的优势结合起来。因此 Layotto 是建立在 MOSN 之上，分工上希望让 MOSN 来处理网络部分，而自己负责向应用提供各种中间件能力。此外基于蚂蚁集团内部的生产运维经验，Layotto 还抽象了一套面向 PaaS 的 API，主要目的是希望把应用跟 Layotto 本身的运行状态透出给 PaaS 平台，让 SRE 可以快速了解应用的运行状态，降低日常运维的成本。

Dapr 项目给我们最大的启示在于，它定义了应用跟基础设施之间的边界，但应用需要的不仅仅是这些。Dapr 为我们提供了很好的思路，是一个好的开端，但还不能够完全覆盖我们想要的东西，我们希望可以完全定义应用跟依赖资源之间的边界，可以覆盖系统资源，基础设施，资源限制等多个环节。成为应用的“真”运行时，应用除了业务逻辑之外无需关注任何其他资源。以当前 Sidecar 思路的落地情况来看，无论是 Dapr，MOSN 还是 Envoy，解决的都是应用到基础设施的问题。而对于系统调用，资源限制等方面仍旧由应用自己完成，这部分操作不需要经过任何中间环节，而没有被接管就意味着很难统一治理，类似网络流量如果没有统一的出入口，治理起来自然会困难重重。同时如果不能对应用可访问的系资源进行精细化控制，那始终会存在安全隐患。现在一名业务开发人员想要上手写代码，不仅要熟悉本身的业务逻辑，还需要熟悉缓存、消息、配置等各种各样基础设施的实现细节，成本非常高，而一旦把边界定义清楚以后，会降低业务开发人员的上手门槛，进而降低整体的开发成本。PS：就好像，java至于jvm，python 至于python 代码，开发些代码 直接`python script` 即可，剩下的所有事情 python runtime 解决。

![](/public/upload/architecture/mesh_function.png)

函数是不是下一站？FaaS 和 Dapr 结合的点：Dapr 能够给函数计算的价值就是提供多语言的统一的面向能力的编程界面，而开发者无需关注具体的产品。像 Java 语言如果要使用阿里云上的 OSS 服务，需要引入 maven 依赖，同时需要写一些 OSS 代码，而通过 Dapr 你只需要调用 Dapr SDK 的 Binding 方法即可以做到，方便编程的同时，整个可运行包也无需引入多余的依赖包，而是可控的。函数计算英文名是 Function Compute，简称为 FC。FC 的架构包含的系统比较多，和开发者相关的主要包括 Function Compute Gateway和函数运行的环境。FC Gateway主要负责承接流量，同时会根据承接的流量的大小，当前的 CPU、内存使用情况，对当前函数实例进行扩缩容。函数计算运行时环境部署在一个 Pod 中，函数实例在主容器中，dapr 则是在 sidecar 容器中。当有外部流量访问函数计算的服务时，流量会先走到 Gateway ，Gateway 会根据访问的内容将流量转发到提供当前服务的函数实例中，函数实例接收到请求之后如果需要访问外部资源，就可以通过Dapr 的多语言 SDK 来发起调用。这时候 SDK 会向 Dapr实例发起gRPC请求，而在dapr 实例中回根据请求的类型和 body 体，选择对应的能力和组件实现，进而向外部资源发起调用。

[云原生运行时的下一个五年](https://mp.weixin.qq.com/s/eS0MB8OiVFmpA_vMFkd9lg) 如果未来以函数作为跟当前微服务架构具有同等地位的另一种基础研发模型，我们就需要考虑整个函数模式的生态建设问题
1. 基础框架，得益于 WebAssembly 这项技术的支持，函数本身是可以使用多种主流语言进行开发， 但为了更好的管理每个函数，仍旧需要让业务同学在开发过程中遵循一定的模板，如函数加载时会执行一个 start() 方法，可以做一些初始化工作，卸载时会执行一个 destroy() 方法，这可以做一些清理工作。
2. 开发调试
3. 打包部署，wasm 跟镜像之间的关系是什么？K8s 是以镜像为基础来创建 Pod，而函数编译的产物是 wasm  文件
4. 生命周期管理 + 资源调度，如何让 K8s 管理部署 wasm ？

对于编译好的 *.wasm 文件，我们把它打在一个镜像里，然后 push 到镜像仓库用于后续调度使用。我们自己实现了一个叫做 containerd-shim-layotto-v2 的插件，在 K8s 收到调度 Pod 的请求以后它会把真正的处理逻辑交给 Kubelet，然后再经过 Containerd 转交给我们的自定义插件，该插件会从目标镜像中提取出 *.wasm 文件让 Layotto 加载运行。目前 Layotto 集成了 wasmer 作为 wasm 的运行时。对于一个开发好的函数来说，首先把它编译成 *.wasm 文件，然后再构建成镜像，部署过程中只需要在 yaml 文件中指定 runtimeClassName 为 Layotto 即可。后续如创建容器、查看容器状态、删除容器等操作都保留了 K8s 的语义

我们来畅想一下未来可能的研发模型
1. 在研发阶段，开发人员可以自由选择适合业务场景的语言编写代码。对于开发工具来说，除了本地 IDE 以外可能越来越多的人会选择 Cloud IDE 来开发，这将很大的提高开发人员的协作效率。
2. 部署阶段，对于一些轻量的业务场景，可能会按照函数模型进行部署，而对于传统的业务，可能会保留 BaaS 模型，同时如果有更高的安全性诉求，一种可行方案是把业务部署在 Kata 之类的安全容器中。随着 Unikernel 技术的成熟，可能会有越来越多的人在这个方向上进行尝试，比如把 Layotto 打在 kernel 中跟应用一起编译部署。
3. 最后在向用户提供服务的阶段，随着函数服务启动的速度越来越快，可以做到收到请求以后再加载运行函数，并且对它们可使用的资源进行严格精确的控制，真正做到按需计费。





## 基础设施下沉的大趋势

![](/public/upload/architecture/architecture_develop.png)

软件架构的发展历史及其精彩。回顾阿里巴巴系统架构演进的历史，能让人了解国内甚至全球的软件架构的发展历史。淘宝最开始成立的时候，是单体应用；随着业务规模的发展，系统首先对硬件进行升级这种Scale Up的方式；但是很快发现这种方式遇到了各种各样的问题，所以在2008年开始引入了微服务的解决方案；SOA的解决方案是分布式的，对于稳定性，可观测性等方面，需要引入熔断、隔离、全链路监控等高可用方案；接下来面临的问题是怎么在机房、IDC层面来让业务达到99.99%以上可用的SLA，这时候就有了同城双机房、异地多活等解决方案。而随着云技术的不断发展，阿里巴巴拥抱和引导云原生技术的发展，积极拥抱云原生技术，以K8s为基础，积极开展云原生技术的升级。从这个历史中，我们可以发现，软件架构新的诉求越来越多，原先底层基础设施无法完成只能交给应用侧富SDK去完成，在K8s和容器逐渐成为标准之后，**重新将微服务和一些分布式能力还给基础设施**。未来的趋势是以Service Mesh和Dapr为代表的分布式能力下沉，释放云和云原生技术发展的红利。

[从软件历史看架构的未来：编程不再是精英们的游戏](https://mp.weixin.qq.com/s/Uhk834RAPCDm6SUE73YINA)

[如何看待 Dapr、Layotto 这种多运行时架构？](https://mp.weixin.qq.com/s/d9JsvrgiAG0c0Ol1l3rbXQ)
1. 如何看待“可移植性”。标准化 API 能满足所有需求吗？[死生之地不可不察：论API标准化对Dapr的重要性](https://mp.weixin.qq.com/s/UcvV7oARIkFDpCH0JzBrDw) 计算机科学中有一种思想：如果一个问题太难了解决不了，那就放宽假设，弱化需求。既然“可移植性”这个问题太难了，那就让我们弱化一下需求，先解决一些更简单的问题：“弱移植性”。
    1. level 0：业务系统换云平台部署时，需要改业务代码（比如换一套基础设施 sdk，然后重构业务代码）。
    2. level 1：换云平台部署时，业务代码不用改，但是需要换一套 sdk，重新编译。
    2. level 2：换云平台部署时，业务系统不需要改代码，不需要重新编译，但是 Sidecar 要改代码。
    3. level 3：换云平台部署时，业务系统和 Sidecar 都不需要改代码，不需要重新编译，只需要改配置。
    5. level 4：换依赖的开源产品时（比如原先使用 Redis，现在要换成别的分布式缓存），业务系统和 Sidecar 都不需要改代码。
2. 让“下沉”合理化
    2. 多语言复用中间件，比如，以前的中间件都是为 Java 开发的，C++ 用不了，现在可以让 Node.js/Python/C++ 语言的应用通过 gRPC 调 Sidecar，复用中间件。
    2. 微服务启动加速、FaaS 冷启加速，原先微服务应用的框架比较重，比如有和配置中心建连、初始化、缓存预热之类的逻辑，现在这些启动逻辑都挪到 Runtime 里。当应用或者函数需要扩容时，可以复用原有 Runtime，不需要再做一遍类似的建连预热动作，从而达到启动加速的效果。
    4. 不用推动用户升级 sdk 了
    4. 让业务逻辑也能下沉
2. 让“下沉”规范化：约束“私有协议”
3. 如何划分 Serivce Mesh，Event Mesh 和 Multi-Runtime 的边界？Layotto 这个 Sidecar 支持了各种协议，好像已经“非驴非马”了。可以把 Dapr 的“标准化 API”看做“Sidecar 增强”。比如“InvokeService API”可以看成“Service Mesh 增强”，“Pubsub API”可以看成是“Event Mesh 增强”，“State API”可以看成“数据中间件增强”，这里说的数据中间件包括缓存流量转发和 DB Mesh。从这种角度看，Layotto 更像是 Sidecar 里的“API 网关”。

如果你把 Runtime 类比成操作系统的内核，那么 API 这层就是系统调用，负责抽象基础设施，简化编程，而不同的组件类似于驱动，负责把系统调用翻译成不同基础设施的协议。Runtime 把所有组件都放在一个进程里，类似于“宏内核”的操作系统把所有子模块都塞在一起，变成了巨石应用。巨石应用有什么问题？模块间互相耦合，隔离性不好，稳定性降低。如果 Dapr 或者 Layotto 的一个组件出现 bug，会影响整个 Sidecar。怎么解决巨石应用的问题呢？拆！一个思路是把 Runtime 按模块拆分，每个模块是一个 Container，整个 Runtime 以 DaemonSet 的形式部署：这种方案就像操作系统的“微内核”，不同子模块之间有一定的隔离性，但相互通信的性能损耗会高一些。那么应该选择单容器 Runtime 还是多容器 Runtime 呢？这就像操作系统选择“宏内核”还是“微内核”架构，全看取舍。巨石应用的好处是子模块之间互相通信性能好，缺点是紧耦合，隔离性不好；如果把 Runtime 拆成多个 Sidecar 则刚好相反。

## 其它

[未来：应用交付的革命不会停止](https://mp.weixin.qq.com/s/x7lTp9fJXav6nIJH_bgVMA)Kubernetes 项目一直在做的，其实是在进一步清晰和明确“应用交付”这个亘古不变的话题。只不过，相比于交付一个容器和容器镜像， Kubernetes 项目正在尝试明确的定义云时代“应用”的概念。在这里，应用是一组容器的有机组合，同时也包括了应用运行所需的网络、存储的需求的描述。而像这样一个“描述”应用的 YAML 文件，放在 etcd 里存起来，然后通过控制器模型驱动整个基础设施的状态不断地向用户声明的状态逼近，就是 Kubernetes 的核心工作原理了。PS: 以后你给公有云一个yaml 文件就可以发布自己的应用了。

[解读容器 2019：把“以应用为中心”进行到底](https://www.kubernetes.org.cn/6408.html)云原生的本质是一系列最佳实践的结合；更详细的说，云原生为实践者指定了一条低心智负担的、能够以可扩展、可复制的方式最大化地利用云的能力、发挥云的价值的最佳路径。这种思想，以一言以蔽之，就是“以应用为中心”。正是因为以应用为中心，云原生技术体系才会无限强调**让基础设施能更好的配合应用**、以更高效方式为应用“输送”基础设施能力，而不是反其道而行之。而相应的， Kubernetes 、Docker、Operator 等在云原生生态中起到了关键作用的开源项目，就是让这种思想落地的技术手段。

[分布式系统在 Kubernetes 上的进化](https://mp.weixin.qq.com/s/fyg27y1hQPVDXvZz0mSYvg) 是讲mecha的，但对k8s有一个新的视角
1. 从一开始，进行健康状况探测的能力就是 Kubernetes 受欢迎的原因
2. 围绕应用程序的托管生命周期–你不再控制何时启动、何时关闭服务。你相信平台可以做到这一点。Kubernetes 可以启动你的应用；它可以将其关闭，然后在不同的节点上移动它。为此，你必须正确执行平台在应用启动和关闭期间告诉你的事件。
3. 围绕着声明式部署。这意味着你不再需要启动服务；检查日志是否已经启动。你不必手动升级实例
4. 声明你的资源需求。 Kubernetes将为我们做出最佳的决策。

[互联网后端架构演进及未来猜想](https://mp.weixin.qq.com/s/5kNgnYHeGOuoXyAdzN3ZGA)
1. 单体 ==> 按业务功能拆分 ==> SOA ==> 微服务( 富sdk ==> service mesh) ==> 统一编程平面/应用运行时（比如dapr） ==> Serverless。回顾整个历史的发展，应用被不断拆分的越来越细，且从前期的横向拆分到后面的 sidecar 等方式的纵向单节点内的拆分
2. 如果将来统一编程平面成了后端开发者的编程标准，那么将彻底屏蔽所有中间件以及基础设施和服务调用的差异，开发者的所有业务逻辑都将由标准 api 来组合完成，就像内核接口和系统调用一样，**底层基础设施就变成了这个"庞大操作系统的内核"**。
3. 云原生编程语言：既然 Serverless 目的是让业务不再关注服务器等基础设施的细节，那么能不能直接从编程语言下手，细到每一个对象的 new ，每一行语句的执行都能被整个集群内分布式的调度(比函数级别更细)，而开发者方编程的时候只需要把这个集群都当成一个巨大的单机机器即可

[知乎是怎么落地Istio的？](https://mp.weixin.qq.com/s/U0NS1zIm56JNhNsP-eqhyg)我们将为业务：
1. 提供缓存能力⽽不是 Redis、Memcached ……
2. 提供异步通信⽽不是 Kafka、Pulsar ……
3. 提供存储能⼒⽽不是 MySQL、TiDB ……
4. 提供同步通信⽽不是 Dubbo、Spring Cloud、go-micro

