---
layout: post
title:  "Install jekyll on Ubuntu 16.04"
date:   2016-06-21 22:30:28 -0400
categories: jekyll update
---
Besides follow instructions on [this page][this-page], one needs to do extra steps on make install works on Ubuntu 16.04. 

{% highlight ruby %}
sudo apt-get install ruby-dev  # for soloving problem on ffi
sudo apt-get install libxml2-dev libxslt-dev # for soloving porblem on nokogiri
{% endhighlight %}

Check out the [Jekyll docs][jekyll-docs] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll’s GitHub repo][jekyll-gh]. If you have questions, you can ask them on [Jekyll Talk][jekyll-talk].

[jekyll-docs]: http://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com/
[this-page]: https://help.github.com/articles/setting-up-your-github-pages-site-locally-with-jekyll/
