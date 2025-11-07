# Space Love Countdown — Cairo ⇄ Amman

一个浪漫的静态网页，包含：
- 全屏高清深空背景（本项目根目录的 `assetsbg-final-nebula.jpg`）
- 柔光覆盖层与欧式花体标题（Great Vibes）
- 居中高对比圆角倒计时（目标：2025年11月10日 21:00:00，开罗时间）
- 音乐面板（Rina Sawayama《Chosen Family》），底部居中
- 弹幕（左→右，近全屏，防重叠车道，小奶油白/浅金色，缓慢漂移）

## 目录结构

```
├── index.html
├── styles.css
├── app.js
└── assetsbg-final-nebula.jpg
```

如需更规范的图片路径，可将图片移动到 `assets/bg-final-nebula.jpg`，同时在 `styles.css` 更新背景路径。

## 本地预览

方法一：使用任意静态服务器（推荐）
- Python：`python -m http.server 8000`
- Node：`npx serve -l 3000`
打开浏览器访问对应地址（例如 `http://localhost:8000/`）。

方法二：直接双击 `index.html`（可能受浏览器跨域策略限制，YouTube IFrame 的音乐需联网）。

## 可配置项

- 背景图片路径：`styles.css` 的 `body` 背景 URL
- 标题字体与颜色：`styles.css` 中 `.main-title`、`.sub-title`
- 弹幕区间与速度：`app.js` 中 `computeDanmuLanes()`、`spawnDanmu()`
- 倒计时目标时间：`app.js` 的 `TARGET_DATE`

## 发布到 Git

初始化并推送到你的远程仓库：

```
git init
git add .
git commit -m "Space Love Countdown: initial release"
git branch -M main
git remote add origin <你的远程仓库URL>
git push -u origin main
```

GitHub Pages（可选）：
- 在仓库 Settings → Pages 中选择 `Deploy from a branch`，分支选 `main`，目录选 `/root`。
- 保存后几分钟内会生成公开地址。

## 发行压缩包（已在本目录生成）

已为你生成一个 ZIP 包，包含当前版本的所有文件，便于发布 Release 或私下分发。