---

layout: post
title: 业务系统设计原则
category: Architecture
tags: Architecture
keywords: system design principle 

---

## 简介

* TOC
{:toc}

开发期的时间跨度虽然可能不长，但是它的影响太大了，基本决定了后期维护期的成本有多高。这也意味着软件工程是需要有极强预见性的工程。

[怎样才算精通软件工程？](https://mp.weixin.qq.com/s/T0l9e8zhBWvMol5QIybeVg)如果你能在技术、解决方案、技术栈甚至算法的弱点或优势之间做出更好的权衡，那么你实际上是在准确地想象问题空间中的一条解决方案曲线。这种想象力不是先天的，而是后天习得的。要做出权衡取舍，你应该清楚地知道在提议的解决方案中什么是对的、什么是错的、什么时候是对的、什么时候是错的，这样你才能知道要舍弃哪些内容、要保留哪些内容以及要添加哪些内容。为此，开发人员需要大量的经验，尝试许多不同的设置，探索许多不同的想法以及更多的反复试验。因此，新手工程师会很难完成工作，他们只会一头扎进自己想到的第一个解决方案，然后被确认偏见推着往下走。中级工程师可以解决问题，却很难做出权衡取舍；专家工程师则可以使用不同的方法来找出可行的解决方案。高级工程师说“不”的次数要比说“是”的次数更多，并且每次会给出合理的理由。

## 以“理想状态” 在指导设计取舍

系统已经平稳运行了一段时间，来了一个新需求，有点别扭但加点ifelse 也能支持， 这个时候是“兼容” 还是“重新设计”？ 我倾向于重新设计，即：假设系统一行代码都没写，基于已有的经验和新需求，重新构思系统的设计，使系统尽量保持在理想状态。不断调整 系统的高层概念，这样做的一个基本假设是：以对系统高层抽象的冲击来说， 量变的需求比质变的需求要多。 

![](/public/upload/practice/business_develop.png)

## KISS（Keep It Simple, Stupid）

|参与系统建设的相关角色|描述|如何看待Simple和 Stupid|
|---|---|---|
|用户|系统的服务对象|业务运作方便，能够节省时间的系统|
|系统拥有者|为整个系统买单的人，也是最终获得系统运营收益的人|花费最少、产出最高<br>在用户的角度之上，多加了一个成本的考虑|
|设计师|从系统拥有者身上拆分出来的|方便自己工作的设计<br>拿出他自己最熟悉的那一套设计|
|实施人员||方便自己的工作，尽早地完成被分派的任务<br>会的或者能够熟练掌握的技术才是 “Simple and Stupid”<br>实施者的水平不同|

“Simple and Stupid”是因人而异的，不同的角色有不同的诉求，并不一致，而且这些诉求都存在于各个参与方的潜意识里，很难识别。于是就会形成这样的结果：实施人员的工作常会受限于设计师的设计，因 为设计师要考虑自身工作的“Simple and Stupid”；同时，实施人员在工作时会和 用户直接打交道，而目标用户则会有业务方的“Simple and Stupid”观点，会对实施人员的工作产生冲击。因此，实施人员被夹在用户和设计师的不同“Simple and Stupid”观点之间而痛苦不堪，甚至长期加班都于事无补。

先需要考虑用户的“Simple and Stupid”，整个系统才会有收益，才有做的价值；然后才能考虑实现目标系统所需成本的“Simple and Stupid”。也就是说：设计师和实施人员所认为的“Simple and Stupid”，都不是真正的“Simple and Stupid”。

如果一个高水平设计师没有考虑到实施团队的水平，给出他所认为的“Simple and Stupid”方案并勉强推进落地的话，要么实现不了，或者勉强实施出来，最后也会问题不断，甚至引发重大事故。因此，设计师要设计 一个系统的话，必须要结合实施团队的技术水平，做出适合他们的架构设计。如此，对实施团队而言才是“Simple and Stupid”。

人们在说“Simple”的时候，往往潜意识里说的是“Easy”，即“容易”。如果把“Simple and Stupid”这句话的主语补全的话，那么“Simple”实际 上指的是用户使用起来“Simple”，而人们潜意识里的“Simple”，指的是自身工作的“Easy”。其实， “Simple”并不等同于“Easy”，要把系统做到“Simple”，往往是最难的，一点都不 “Easy”。如果系统的目标用户是实施人员或设计师自身时，这种情况属于用户、实施者以及设计者三者合体，这是最好的情况。**合体之后，减少了分工对设计的影响，需求也不容易失真**，系统反而好设计，比如 Git 的设计师本身也是 Git 的用户。

**系统拥有者、设计师、实施者和目标用户，他们之间的复杂度总是有一个整体平衡的关系：如果要把某一方的工作变简单，其他角色的工作则往往会变得更加困难**。许多设计师在给企业设计系统的时候，为了其所坚持的“Simple and Stupid”理念，不断地和业务团队发生冲突， **其实只不过是为了方便自己，用自己更熟悉的设计方案而已**。然而这么做很容易降低其用户的使用体验，并且这么继续冲突下去，设计师自身的体验也最终会变得一点也不“Simple and Stupid”。如前所述，用户业务访问的“Simple and Stupid”才是目标，所以要先完成用户业务访问的“Simple and Stupid”，然后考虑到系统拥有者的成本，同时去考虑实施者的“Simple and Stupid”，做到低成本可持续迭代，最后才能考虑设计师自身的“Simple and Stupid”，这才是一个设计师所应考虑的“Simple and Stupid”顺序。**可见，设计师的工作没法变简单**，其自身工作的“Simple and Stupid”只能放在最后才可以考虑。人们总想成为设计师，但为什么只有极少人才能够做到， 可见其工作的困难程度可见一斑。

只有设计师放低自己的身段，从业务上去分析、拆分，才能够得到一个内聚的结构，这个结构也才因此而被称为“Simple and Stupid”。所 以，这个“Simple and Stupid”的效果只不过是系统设计符合用户业务内聚的一个副产品，是内聚的一个外在表现，并非设计的目标。在设计时，设计师一定要站在目标用户的角度，体验并理解用户的 业务，然后再依照目标用户的实际需求进行设计，并形成内聚的系统，那么最终结果一定会是“Simple and Stupid”的。也就是说，“内聚”原则才是设计时的最高目标。一旦仅仅以“Simple and Stupid”原则作为设计的最高目标，会很容易失去业务的目标，忽视业务人员的诉求，失去业务的“内聚”，从而导致业务问题复杂化，反而使业务的运转变得更加困难。这么下去，也会使设计师、施工 人员和用户三者之间产生冲突，矛盾激化，因为**设计师的工作变简单了，用户和施工人员的工作一定会变得更复杂**。

虽然这个原则不能作为设计目标，倒是可以作为审查设计的一个手段。比如在审查一个系统的时候，一旦所设计的系统对于目标用户访问的拆分不够清晰，且不是树状结构的时候，那么这个系统往往会表现出来耦合的问题，牵一发动全身，对用户或施工人员都不够“Simple and Stupid”。查阅了一下这个原则的出处，发现其原本是军工行业对设计飞机的一个要求。“Simple and Stupid”原则中所说的“Stupid”本义，是形容修理人员对系统组件修理维护时的简单程度，不需要复杂的工具，直接简单替换即可。为达到这一目的，系统设计者必须要做好内聚，不能存在耦合，他的工作因此反而变得更复杂、 更加困难了。


一旦形成设计师、施工人员和用户三者的分工，他们各自工作的难易程度会有平衡关系，最终会影响到系统拥有者的难度。而设计师是其中最难的工作，不可能达成“Simple and Stupid”。并且在整个系统的设计中，设计师可以对其他某个角色的工作复杂度作出取舍，但绝不能对自己工作的难易程度作出取舍。哪怕需要取舍，也要放在最后一个来考虑。而设计师对自身工作的取舍，往往都是受限于社会整体技术水平的发展，这个取舍最终也会通过其所设计的系统影响到整个世界。

**“内聚”才是设计的真正目标，只有“内聚”才是各个行业、各个领域通行 的原则**，为什么呢？因为**只有内聚才能够保证权责对等，才能保障个体在空间 上的连续与完整，不同个体才得以占有独立的空间，才能符合现实世界的特质！**因此，做设计时，不如直接强调“内聚”原则。


