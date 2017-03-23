---
layout: post
title:  "1. TensorFlow the basis"
date:   2016-06-21 22:30:28 -0400
categories: TensorFlow tutorial
---

## What is Tensor
A TensorFlow tensor is sort of n-dimentional array or list. A tensor has a static type, a rank, and a shape. 
Only tensors may be passed between ops in the computation graph. 


#### Rank
Tensor rank is the number of dimension of the tensor
   * Rnak 0: Scalar
   * Rank 1: Vector
   * Rank 2: Matrix
   * Rank 3: 3-Tensor
   * ...
   * Rank n: n-Tensor

#### Shape

### Type
Tensor has it own data type schema, such as float32, int64, and strin etc. 

```python
import tensorflow as tf

tensor_scalar = tf.constant(0, name="Scalar")
tensor_vector = tf.constant([1,2,3,4.0], name="Vector")
tensor_matrix = tf.constant([[1,2], [3,4], [5,6]], name="Matrix")

tensors = [tensor_scalar, tensor_vector, tensor_matrix]

for tensor in tensors:
    print (tf.rank(tensor))

"""
Please refer to https://www.tensorflow.org/api_guides/python/array_ops for tensor rank, shape and type information
"""

with tf.Session() as sess:
    print("======Print Rank=========")
    for tensor in tensors:
       print (sess.run(tf.rank(tensor)))

    print("======Print Shape=========")
    for tensor in tensors:
        print(sess.run(tf.shape(tensor)))

    print("======Print Shape=========")
    for tensor in tensors:
        print(sess.run(tf.shape_n([tensor])))

    print("======Print Size=========")
    for tensor in tensors:
        print(sess.run(tf.size([tensor])))

    print("======Print Reshape=========")
    print(sess.run(tf.reshape(tensor_matrix, [2, -1] )))
    print(sess.run(tf.reshape(tensor_matrix, [-1])))
```


## Const, Placehold and Variable

## Computation Graph

## Tensorboard