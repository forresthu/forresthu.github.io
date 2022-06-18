---

layout: post
title: java8 实践
category: Technology
tags: Java
keywords: java forkjoin

---

## 简介(持续更新)

## optional

假设有一个接口`User queryByName(String name)`，name 可能不存在，有以下改进点

1. `Optional<User> queryByName(String name)`
2. 从使用角度看，假设要获取User 的 age，仍需要

		Optional<User> user = queryByName("zhangsan");
		if(user.isPresent()){
			long uid = user.get().getId();
			business code
		}
3. 一行解决问题的办法是`long uid = queryByName("zhangsan").map(User::getId).orElse(0l)`
		
stream map 之后是stream，optional map 之后是optional ，不要彼此相互干扰

[Optional 是个好东西，你真的会用么？](https://mp.weixin.qq.com/s/QCGBS0gi25Gbp18Hwj7AFg)

### 获取一个可能为null的对象的成员

2018.11.14 补充，再看一个工具类

	public class Nulls {
	    public static <T, R> Optional<R> tryGet(T t, Function<T, R> function) {
	        return null == t ? Optional.empty() : Optional.ofNullable(function.apply(t));
	    }
	    public static <T, R> Optional<R> tryGet(T t, Supplier<R> supplier) {
	        return null == t ? Optional.empty() : Optional.ofNullable(supplier.get());
	    }
	    public static <T extends Collection, R> Optional<R> tryGet(T t, Supplier<R> supplier) {
	        return null == t || 0 == t.size() ? Optional.empty() : Optional.ofNullable(supplier.get());
	    }
	}
	
使用时

	public class NullsTest {
	    @Setter
	    @Getter
	    class User {
	        Long id;
	    }
	    
	    @Test
	    public void testUser() {
	        User user = getUser();
	        Optional<Long> id = Nulls.tryGet(user, () -> user.getId());
	        System.out.println(id.orElse(null));
	    }
	
	    @Test
	    public void testList() {
	        List<String> list = new ArrayList<>();
	        Optional<String> id = Nulls.tryGet(list, () -> list.get(0));
	        System.out.println(id.orElse(null));
	    }
	
	    private User getUser() {
	        return null;
	    }
	}

## Supplier

[函数式编程的Java编码实践：利用惰性写出高性能且抽象的代码](https://mp.weixin.qq.com/s/e-9hrjWK513VJqqyeGLxrQ)Java 8 引入了全新的函数式接口 Supplier，从老 Java 程序员的角度理解，它不过就是一个可以获取任意值的接口而已，Lambda 不过是这种接口实现类的语法糖。这是站在语言角度而不是计算角度的理解。当你了解了严格（strict）与惰性（lazy）的区别之后，可能会有更加接近计算本质的看法。因为 Java 和 C 都是严格的编程语言，所以我们习惯了变量在定义的地方就完成了计算。事实上，还有另外一个编程语言流派，它们是在变量使用的时候才进行计算的，比如函数式编程语言 Haskell。

##  filter

假设对一个用户列表，先找到所有的成年人。

`users.stream().filter(user -> user.getAge > 18).collect(Collectors.toList())`

但若是还有一个需求，对18岁以下的人打个日志，以方便debug， 一般会

	users.stream().filter(user -> {
		if(user.getAge < 18){
			log...
			return false;
		}
		return true;
	}).collect(Collectors.toList());
	
这样就破坏了stream 的美感，同时实际需求 通常比这个更复杂，因此可以

	class Logable{
		private User user;
		private Logable(User user){
			this.user = user;
		}
		public static Logable of(User user){
			return new Logable(user);
		}
		public boolean isGreaterThan18(){
			if(user.getAge < 18){
				log...
				return false;
			}
			return true;
		}
	}

然后`users.stream().map(Logable::of).filter(logable:: isGreaterThan18).collect(Collectors.toList())`

这个可以称之为，给对象加一个方法。如果加上观察者，就可以演化为rxjava。
