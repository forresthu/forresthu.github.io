## Image classification

Why does it hard to do image classification,
* 300*300*3, the pixel a simple image
* Viewpoint variation
* Illumination
* Deformation
* Occlusion
* Background
* Intraclass variation

## A image classifer

def predict(image):
   ....
   retrn class_label

No obvious way to hard-code the algorithm for recognizing a object in a image

## Attempts have been made

## Data-driven approach
* Collect a dataset of images and labels
* Use machine learning to train an image classifer
* Evaluate the classifer on a withheld set of test images

def train(image, label):  
  return model

def predict(model, test_image):  
  return test_label

CIFAR-10

## Nearest Neighbor Classifer
Distance: k-Nearest neighbour
Hyperparameters

## Linear classification
Parametric approach
image[32*32*3] --> f(x, W) --> 10 numbers, indicating class scores
f(x, W) = Wx + b (x is 3072*1, and W is 10*3072), b is also 10*1
10 * 1

## Loss function:
SVM vs Softmax

## Opimization
* Random (try and trail)
* 








