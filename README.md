# 我的工作台

一个极简的个人网站导航页，用来统一访问分散在不同域名下的工具、研究和知识网站。

## 本地运行

```bash
npm install
npm run dev
```

## 修改默认网站

编辑 `sites.js` 中的 `defaultSites` 数组。每个网站包含名称、网址、一句话介绍、标记颜色和 favicon 地址。

网页中的“添加网站”和删除功能使用浏览器本地存储，改动只会出现在操作它的浏览器中。删除默认网站只会隐藏对应卡片，不会修改 `sites.js` 中的源数据。

## 构建与部署

```bash
npm run build
```

Netlify 构建配置已写入 `netlify.toml`，推送到 GitHub 后可直接连接仓库部署。
