# 怎么把它发到 GitHub

本机现在**没有装 git，也没有 gh CLI**，所以下面三条路任选一条。

## A. 网页上传（零安装，最省事）

1. 打开 <https://github.com/new>，Repository name 填 `command-card-battle`，Public，**不要**勾 README
2. 建好后页面会给你一个空仓库，点 **uploading an existing file**
3. 把 `cardbattle/` 里的东西全选拖进去（`.gitignore`、`LICENSE`、`README.md`、`README.en.md`、`package.json`、`src/`、`demo/`、`tests/`、`scripts/`）
4. Commit message 写 `feat: command-card battle engine`，点 Commit
5. Settings → Pages → Source 选 `main` / `root`，等一分钟，demo 就在
   `https://<你的用户名>.github.io/command-card-battle/demo/`

也可以直接上传同级目录里的 `cardbattle.zip` 解压后的内容。

## B. 给一个 GitHub PAT，我通过 API 建仓库并推

不需要装 git。步骤：

1. 打开 <https://github.com/settings/tokens> → Generate new token (classic) → 勾 `repo` → 生成
2. 把 token 发我（只在本次会话里用，我不会写到任何文件）
3. 我用 REST API 建仓库、逐个文件提交、开 Pages

> 如果不想给 token，也可以用 B 的变体：你在网页建好空仓库，告诉我仓库地址，我只给你一串 `git` 命令自己跑。

## C. 装 git + gh 自己推

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
gh auth login          # 浏览器授权
cd 'F:\桌面\Harness\07_开源项目\cardbattle'
git init -b main
git add .
git commit -m "feat: zero-dependency command-card battle engine"
gh repo create command-card-battle --public --source=. --push
```

## 发布后建议做的三件事

1. **About** 填一句：`Zero-dependency command-card battle engine (draw 5 / play 3) for web games`，Topics 填 `game`、`turn-based`、`browser`、`zero-dependency`
2. `Settings → Pages` 打开，拿 demo 链接
3. 发一条 B 站动态/专栏：录 30 秒「Excel 里打游戏」式的演示，比贴代码更容易被看到
