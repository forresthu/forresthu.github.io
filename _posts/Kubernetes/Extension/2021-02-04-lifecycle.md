---

layout: post
title: 生命周期管理
category: Architecture
tags: Kubernetes
keywords:  lifecycle

---

## 简介（未完成）

由云原生平台管理的**容器化应用对其生命周期没有控制权**，要想成为优秀的云原生化 ，它们必须监听管理平台发出的事件，并相应地调整其生命周期。

1. k8s 可以通过probe 获取应用信息
2. k8s 可以通过postStart/preStop 与应用或外界交互
3. 外界可以通过为pod增加 Finalizer 来干预pod的状态，进而可以通过监听pod状态来 感知k8s的行为

## 生命周期管理

[Kubernetes 设计模式之生命周期管理](https://mp.weixin.qq.com/s/2WJvhW-nKNnkVW45f9HVOQ)

![](/public/upload/kubernetes/pod_hook.png)

注意
1. postStart 与 entrypoint 是异步的
2. preStop 必须在terminationGracePeriodSeconds内完成（默认30s)，一些妙用
    1. 不管容器因为什么原因失败，做一些清理工作。比如容器挂在了volume 写了一些临时文件，容器退出后，清理临时文件
    2. 容器因为一些原因退出时（比如oom），记录oom信息 [Kubernetes PreStop hook for container crash troubleshooting](https://dzlab.github.io/kubernetes/2021/12/16/k8s-prestop/)

从源码可以看到，preStop 是在容器中执行的。

```go
// kubernetes@v1.15.10/pkg/kubelet/lifecycle/handlers.go
func (hr *HandlerRunner) Run(containerID kubecontainer.ContainerID, pod *v1.Pod, container *v1.Container, handler *v1.Handler) (string, error) {
	switch {
	case handler.Exec != nil:
		output, err := hr.commandRunner.RunInContainer(containerID, handler.Exec.Command, 0)
		return msg, err
	case handler.HTTPGet != nil:
		msg, err := hr.runHTTPHandler(pod, container, handler)
		return msg, err
	default:
		err := fmt.Errorf("Invalid handler: %v", handler)
		msg := fmt.Sprintf("Cannot run handler: %v", err)
		klog.Errorf(msg)
		return msg, err
	}
}
// kubernetes@v1.15.10/pkg/kubelet/kuberuntime/kuberuntime_container.go
func (m *kubeGenericRuntimeManager) RunInContainer(id kubecontainer.ContainerID, cmd []string, timeout time.Duration) ([]byte, error) {
	stdout, stderr, err := m.runtimeService.ExecSync(id.ID, cmd, timeout)
	return append(stdout, stderr...), err
}
```

## Finalizer

[Kubernetes模型设计与控制器模式精要](https://mp.weixin.qq.com/s/Dbf0NSJIX-fz28Heix3EtA)如果只看社区实现，那么该属性毫无存在感，因为在社区代码中，很少有对Finalizer的操作。但在企业化落地过程中，它是一个十分重要，值得重点强调的属性。因为Kubernetes不是一个独立存在的系统，它最终会跟企业资源和系统整合，这意味着Kubernetes会操作这些集群外部资源或系统。试想一个场景，用户创建了一个Kubernetes对象，假设对应的控制器需要从外部系统获取资源，当用户删除该对象时，控制器接收到删除事件后，会尝试释放该资源。可是如果此时外部系统无法连通，并且同时控制器发生重启了会有何后果？该对象永远泄露了。

Finalizer本质上是一个资源锁，Kubernetes在接收到某对象的删除请求，会检查Finalizer是否为空，如果不为空则只对其做逻辑删除，即只会更新对象中metadata.deletionTimestamp字段。具有Finalizer的对象，不会立刻删除，需等到Finalizer列表中所有字段被删除后，也就是该对象相关的所有外部资源已被删除，这个对象才会被最终被删除。

因此，如果控制器需要操作集群外部资源，则一定要在操作外部资源之前为对象添加Finalizer，确保资源不会因对象删除而泄露。同时控制器需要监听对象的更新时间，当对象的deletionTimestamp不为空时，则处理对象删除逻辑，回收外部资源，并清空自己之前添加的Finalizer。

PS：本质是可以干预 资源的删除逻辑。



