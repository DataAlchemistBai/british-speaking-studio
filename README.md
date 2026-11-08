# British Speaking Studio

一个零前端依赖的英语听说练习网站：双人／四人对话、同步字幕、人物说话高亮，以及可重复选择的连续故事卡片。

[在线体验：手机／电脑直接打开](https://dataalchemistbai.github.io/british-speaking-studio/) · [人物与故事档案](docs/STORY_NOTES.md) · [素材说明](ASSETS.md)

在线版无需 GitHub 账号、无需安装软件或配置环境。手机上点播放按钮即可开始；主题和学习进度保存在当前浏览器中。

## 功能

- 36 张练习卡片，包含英语对话、中文释义、场景背景和预生成音频。
- 六位虚构成年人物，连续的友情、工作、健身和男同性恋约会故事；不含露骨性描写。
- 双人和四人场景；当前说话者照片高亮，四人照片以 2×2 排列。
- 点击任意句子跳转播放，加载时保留所选句子，加载完成后再定位。
- 字幕自动滚动、单句循环、前后句切换、倍速播放、明暗主题。
- 浏览器本地保存进度、主题和已使用素材缓存；无账号、无后端、无分析追踪、无录音上传。

## 本地运行

需要 Node.js 18 或更新版本。没有第三方 npm 依赖，无须执行 `npm install`。

```sh
git clone https://github.com/DataAlchemistBai/british-speaking-studio.git
cd british-speaking-studio
npm start
```

打开终端显示的 `http://127.0.0.1:4173`。停止服务按 Ctrl+C。端口也可通过 `PORT` 环境变量指定。

请通过 HTTP 服务打开，不要直接双击 `index.html`：字幕读取和 Service Worker 缓存需要受支持的来源。远程部署建议使用 HTTPS。附带服务器仅供本地开发，不是生产服务。

```sh
npm test
```

测试会检查脚本语法、卡片与音频／时间轴对应关系、素材路径、四人高亮逻辑及双人布局回切；不替代浏览器视觉测试。

## 项目结构

```text
index.html                 页面、播放器、首两张卡片、背景与章节映射
practice-pack.js           人物资料和其余对话卡片
practice-cache-sw.js       浏览器音频、图片和时间轴缓存
audio/                     36 段合成对话音频
images/                    AI 人物图片，包括历史版本
timings*.json              每段音频的逐句起止时间
docs/STORY_NOTES.md         人物性格、关系及剧情连续性记录
tools/serve.mjs             支持音频 Range 请求的本地静态服务器
tools/check.mjs             零依赖检查
```

## 自己修改

1. **人物照片和介绍**：编辑 `practice-pack.js` 中的 `window.speakingCharacters`。图片放进 `images/`；替换时采用新文件名，避免旧缓存遮盖更新。`crop` 是原图坐标中的 SVG 显示裁切框，不会改动原始图片。
2. **对话**：每轮是 `[speaker, english, chinese]`。新卡片列出实际出场的 `speakers`；四人场景通常 24 轮。
3. **背景与章节**：在 `index.html` 的 `backgrounds`、`chapterBySession` 中补上相同卡片 ID。卡片 ID 必须唯一。
4. **音频与时间轴**：修改英语后，应重新生成对应音频并制作 `timings-卡片ID.json`。时间单位为秒；不能仅修改字幕而保留不匹配的时间轴。
5. **外观**：主要样式位于 `index.html`。四人样式限定在 `.group-stage`，双人卡片有自己的原始尺寸。

播放现有内容不需要任何 API 密钥。本仓库不附带语音服务凭据或自动生成服务。语音配置见 [ASSETS.md](ASSETS.md)；原始 `130wpm` 文件名是历史命名，并非每段都精确为 130 词／分钟。

## 静态部署

仓库根目录即网站根目录，已使用 GitHub Pages 从 `main` 分支的根目录发布。`.nojekyll` 保证前端文件按静态资源直接发布。推送到此分支后，GitHub 会重新发布；访客只需打开在线链接。

也可部署到其他支持静态文件、HTTPS 和音频播放的托管服务。保留目录结构即可，无须构建。浏览、下载或克隆仓库本身不会更改在线站点。

## 开源与素材

原创代码、对话文本及项目所有者提供的 AI 图片按 [MIT 许可证](LICENSE) 发布。项目所有者已明确表示图片由 AI 生成，并同意图片随项目公开。

合成音频一并提供用于练习。MIT 不授予第三方语音模型、服务或商标的权利；涉及语音服务的再生成或其他使用，还需遵守其适用条款。详见 [素材说明](ASSETS.md)。

人物和关系均为虚构，图片不用于对真实人物的身份、经历或性取向作出判断。贡献时请保留这个边界，不提交密钥、私人档案、真实聊天记录或未经授权的素材。

---

An open-source, buildless English listening and speaking studio. Includes bilingual dialogue cards, six fictional adult characters, synchronized audio/transcripts, speaker portraits, sentence seeking, local caching and light/dark themes. Run `npm start`; verify with `npm test`. See the asset notice for AI-image provenance and synthesized-audio information.
