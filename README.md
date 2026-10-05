# Forrest Hu's Blogs

博客地址：<https://forresthu.github.io>

基于 [Jekyll](https://jekyllrb.com/) 构建，托管在 GitHub Pages。推送到 `master` 分支后自动发布。

## 本地运行

### 1. 安装 Ruby

需要 Ruby 3.x（当前使用 3.4）。macOS 自带的系统 Ruby 太旧，建议用 Homebrew 安装：

```bash
brew install ruby
```

把 Homebrew 的 Ruby 加到 `PATH`（写进 `~/.zshrc`，然后重开终端）：

```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
```

确认生效：

```bash
which ruby   # 应输出 /opt/homebrew/opt/ruby/bin/ruby
ruby -v
```

### 2. 安装依赖

依赖安装在项目内的 `vendor/bundle`，不污染全局环境：

```bash
git clone https://github.com/forresthu/forresthu.github.io.git
cd forresthu.github.io
bundle config set --local path vendor/bundle
bundle install
```

### 3. 启动本地服务

```bash
bundle exec jekyll serve --livereload
```

打开 <http://127.0.0.1:4000>。修改文章、样式或模板后页面会自动刷新。

常用参数：

| 参数 | 作用 |
|---|---|
| `--livereload` | 文件变化后浏览器自动刷新 |
| `--drafts` | 同时显示 `_drafts/` 里的草稿 |
| `--port 4001` | 换端口（4000 被占用时） |
| `--incremental` | 增量构建，文章多时更快（偶尔需要完整重建） |

> **注意：** 修改 `_config.yml` 后不会自动生效，需要 `Ctrl+C` 停止服务再重新启动。

## 写新文章

在 `_posts/` 下对应分类目录中新建文件，文件名格式为 `YYYY-MM-DD-slug.md`：

```
_posts/Technology/Tool/2026-10-04-my_new_post.md
```

文件开头写 front matter：

```markdown
---

layout: post
title: 文章标题
category: Technology
tags: Tool
keywords: 关键词

---

## 简介

正文……
```

- `category` 决定文章出现在「分类」页的哪个分组；`tags` 对应「标签」页。
- 文章 URL 为 `/:year/:month/:day/:slug.html`。
- 图片放在 `public/upload/<主题>/` 下，用绝对路径引用：`![](/public/upload/architecture/xxx.png)`。
- 支持 MathJax 公式（`$$...$$`），只在包含公式的页面加载。
- 文章内容不执行 Liquid（`render_with_liquid: false`），代码里的 `{{ }}`、`{% %}` 会原样显示。

## 目录结构

```
_config.yml          站点配置（标题、作者、头像、分页等）
_layouts/            页面模板：base（外框）、post（文章）、page（普通页面）
_includes/           页头、导航、页脚等片段
_posts/              文章，按分类分子目录
pages/               分类、标签、归档、关于、RSS
index.html           首页（分页文章列表）
public/css/main.css  全部样式（含深色模式、代码高亮）
public/js/main.js    主题切换、文章目录、代码复制、MathJax 按需加载
public/upload/       图片等静态资源
```

## 发布

```bash
git add .
git commit -m "add post: xxx"
git push
```

推送到 `master` 后 GitHub Pages 会自动构建，通常一两分钟内生效。

> GitHub Pages 使用自己的 Jekyll 版本构建（与本地的 Jekyll 4 不完全相同），并且只支持白名单内的插件。本项目只用了 `jekyll-paginate` 和 `jekyll-seo-tag`，两者都受支持。

## 常见问题

**`bundle install` 报权限错误或装到了系统目录**
确认 `which ruby` 指向 Homebrew 的 Ruby，并且执行过 `bundle config set --local path vendor/bundle`。

**端口 4000 被占用**
上一次的服务可能还在运行：`lsof -i :4000` 找到进程后结束它，或用 `--port` 换端口。

**页面没有更新**
改的是 `_config.yml` 的话需要重启服务；否则试试 `Cmd+Shift+R` 强制刷新浏览器缓存。
