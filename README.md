# EatWhat

一个可直接部署到 GitHub Pages 的“今天中午吃什么”静态小工具。

## 功能

- 手动添加吃饭候选项
- 自动去重并过滤空输入
- 随机抽出一个主选和一个备选
- 尽量避免连续两次抽到相同主选
- 支持删除单项与清空全部
- 候选项自动保存在浏览器本地

## 本地运行

```bash
npm install
npm start
```

打开 `http://127.0.0.1:4173`。

## 测试

```bash
npm test
```

## 发布到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 把当前目录文件推送到仓库默认分支。
3. 在 GitHub 仓库设置中打开 **Pages**。
4. Source 选择 **Deploy from a branch**。
5. Branch 选择默认分支，目录选择 **/(root)**。
6. 保存后等待 GitHub 生成公开访问地址。

因为这是纯静态页面，不需要构建步骤，仓库内容可直接发布。
