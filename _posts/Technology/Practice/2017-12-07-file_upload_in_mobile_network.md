---

layout: post
title: 移动网络下的文件上传要注意的几个问题
category: Architecture
tags: Practice
keywords: fileupload

---

## 简介

本文根据作者的实践及材料汇总，讨论移动网络下文件上传涉及到的几个问题。对于一些问题，不谈解决方案，只谈利弊。

1. 移动网络(相对有线网络)的一些特点

	[腾讯原创分享(一)：如何大幅提升移动网络下手机QQ的图片传输速度和成功率](http://www.52im.net/thread-675-1-1.html)要点：

	1. 网络好时提高速度率；网络差时提高成功率
	2. 移动网络容易出现“跳变”，下一秒中的传送速度可能降到前一秒的几十分之一，RTO（超时重传机制）容易因为超时导致大量失败
	3. 移动网络里经常会有“网络真空 (NV)”，即便信号满格也传不出去 1 个字节。
2. 移动网络上传场景

	* 音频、短视频、视频
	* IM语音、图片等



## 笔者曾经实现的一个简单方案

上传文件的基本过程：

1. create请求，向server报告要上传文件。server若同意，返回一个文件标识，id或name
2. 发送文件数据

音频上传，采用netty实现：

![](/public/upload/architecture/file_upload_1.png)

上传流程如下：

![](/public/upload/architecture/file_upload_2.png)

缺点：

1. 转发host（图中的forwarder） 不够高效
2. executor（实际负责文件处理）中存在阻塞逻辑

	* netty中直接调用fdfs上传文件，原因：要向客户端返回文件id

3. 数据采集、统计和查询能力几乎没有

当时的一些考虑：

1. 使用tcp的理由：http容易被运营商劫持
2. 有一个专门的转发host：对外端口有限；单个文件的完整处理过程耗时稍长，转发器只负责转发，文件的处理能力通过加executor机器扩展。
3. 断点续传：简化客户端开发


## 要理清的几个问题

1. 是否采用分片，分片是自定义协议，还是http chunk。[如何让你产品的用户拥有一流的上传体验](https://zhuanlan.zhihu.com/p/28306136)网易云采用自定义的http方式

	* 4g和wifi网络下，分片大小不同

2. 是否保留转发
3. 接收端避免随机读写数据数据。

	* 接收端将接收到的数据，写入内存即返回，由类似kafka的accumulator将内存中的数据整理落盘，或者由内存直接上传fastfs
	* 根据接收文件块的顺序 顺序写入文件，同时记录文件块与实际文件中的位置的关系，在上传文件时，重新恢复成原文件
4. 整个上传过程中，http与tcp的关系。

	* 全用http协议
	* 全用tcp协议
	* http与tcp协议混合。哪些信息通过http方式完成，哪些信息通过tcp方式完成？
5. 接收端如何与存储系统对接，接收端将文件落盘到本地后，还需要将文件上传到dfs中。
6. 接收端如何与业务系统对接，server应该在文件数据接收完毕后，返回client一个file id，以便client可以根据file id 获取文件对应的business id。

	* 文件上传系统调用业务系统完成声音、视频的转码、图片的裁剪等，一些就绪后，返回文件的business id
	* 文件上传系统只负责将文件上传到文件存储系统中，然后发消息通知业务系统
5. 上传系统的目标：公司各个场景的统一的上传平台。包括录音，群聊的图片、语音，私信的语音，富音频等

### 协议

1. 基于tcp定制协议
2. 基于http定制协议 [tus/tus-resumable-upload-protocol](https://github.com/tus/tus-resumable-upload-protocol/blob/master/protocol.md)，从中可以学到一下几点：

 	* 可以基于http定制协议。笔者以前常见的、习惯的是基于tcp定制协议
 	* 协议可以分为core protocol、Protocol Extensions。笔者以前制定协议，就只是一个core protocol，完成基本的文件上传。新增功能，要新增字段，或者放在协议的自定义kv中，这就给encode和decode带来很大的不方便。这个下文细说
 	* 使用http协议的好处：复用大部分基础设施，比如nginx负载均衡等。在旧有的文件上传系统中，便需要申请外网端口；client和server均有现成框架支持，比如spring mvc、http client等；http1.1是文本协议，调试方便；大量的协议可以复用http现有的状态码，比如403 Conflict

一个协议包括，请求、响应。请求包括查询信息、上传文件、重传文件、查询文件断点等。协议的制定通常有两种风格：

1. 一个结构包办所有情况，比如

		length,8 byte
		request or response, 1 byte
		type, 4 byte
		param length, 4 byte
		params, param length byte
		body length, 4 byte
		body , body length byte
		
		
	这样做的缺点就是
	
	* 所有请求类型的编解码在一个编码器里面
	* 请求的分发略微复杂
	* 新增一个请求类型，要更改当前的编解码器以及请求处理流程
		
2. 每一种交互定义一个结构

此外，一个交互的包大小不应过大。否则，一个包无法在内存中完成编解码，或者server无法做到多个包同时在内存中进行编解码，也就无法支撑较大的并发量。即或server可以边解码边消费，不用缓存在内存，内存也需要维护包数据的上下文信息，增加了不可靠性。		
## 分片

在移动网络下，分片上传文件几乎是毫无疑问的。

### 分片协议

假设只有两个分片

1. 分片连续发送

	1. 发送create请求，表示要上传文件，并采用分片，表明文件大小
	2. 上传分片1
	3. 上传分片2
	
	服务端自行判断文件是否接受完整，合并分片并处理
	
2. 将分片当成文件发送

	1. 发送create请求，上传分片1
	2. 发送分片1数据
	3. 发送create请求，上传分片2
	4. 发送分片2数据
	5. 发送create请求，表示要上传原文件
	6. 发送数据，数据内容为分片的归并信息

### 服务端对分片的处理

[服务器端文件分片合并的思考和实践](http://www.pchou.info/web/2014/10/16/chunk-upload-and-merge.html#)

1. 对接收到的分片立即持久化，缺点：持久化工作较为耗时，影响服务端性能

	1. 同一个分片存储在同一个文件中，缺点：并发访问文件
	
		* 预先分配好文件空间，按文件位置持久化
		* 按分片接收顺序持久化，同时存储分片与位置的映射关系
	2. 单纯的将分片持久化，一个分片存储为一个文件
	
2. 将接收到的分片缓存到内存中，等文件接收完毕后持久化，缺点：没那么大内存

## 现有的开源云存储系统

这里指带有完善的后端 + 前端套件

1. [tus](https://tus.io/)，后端采用Go语言，基于http协议上传文件。

2. [haiwen/seafile](https://github.com/haiwen/seafile) 后端采用C+Python，文件上传协议http

3. [ownCloud](https://github.com/owncloud) 及其衍生的nextcloud，后端采用php