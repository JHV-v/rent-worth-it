# 部署说明

## 方案 A：手动部署（备用）

SSH 登录服务器后跑：

```bash
/var/www/rent-app/deploy.sh
```

## 方案 B：GitHub Actions 自动部署（推荐）

`git push` 到 main 分支后自动部署到京东云。需要先配置一次。

### 一、在京东云服务器生成 SSH 密钥（让 GitHub 能登录服务器）

SSH 登录京东云服务器（用京东云网页 SSH 或本地 ssh），执行：

```bash
# 生成密钥对（一路回车，不要设密码）
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N ""

# 把公钥加到信任列表（让 GitHub 用这把私钥能登进来）
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 输出私钥（接下来要复制它到 GitHub Secrets）
cat ~/.ssh/github_actions
```

复制最后一条命令输出的**全部内容**（包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`）。

### 二、在 GitHub 仓库配置 Secrets

1. 浏览器打开仓库 → **Settings** → 左侧菜单 **Secrets and variables** → **Actions**
2. 点 **New repository secret**，依次添加 4 个：

| Name | Value | 说明 |
|------|-------|------|
| `JD_HOST` | `117.72.219.13` | 京东云公网 IP |
| `JD_USER` | `root` | SSH 登录用户名 |
| `JD_PORT` | `22` | SSH 端口（默认 22） |
| `JD_SSH_KEY` | 上一步复制的私钥全文 | 用于 GitHub 登录服务器 |

### 三、测试

本地随便改一行代码 push 到 main：

```powershell
git push
```

打开 GitHub 仓库 → **Actions** 标签，能看到 "Deploy to JD Cloud" 任务在跑，2-3 分钟后绿色对勾就部署完了。

### 四、查看部署日志

GitHub → Actions → 点最新一次运行 → 看每一步的输出。如果失败，最常见原因：

- SSH 连不上：检查 `JD_HOST`/`JD_PORT`/`JD_SSH_KEY` 是否正确
- 服务器端口没开：京东云安全组 + ufw 都要放行 22 端口
- `git pull` 失败：服务器和 GitHub 之间网络问题（国内服务器有时拉 GitHub 不稳定，可以考虑 Gitee 镜像）

## 版本号管理

发版用 npm 命令（**由你决定大中小**）：

```powershell
npm run release:patch    # 1.0.1 → 1.0.2（bug 修复 / 微调）
npm run release:minor    # 1.0.2 → 1.1.0（新功能）
npm run release:major    # 1.1.0 → 2.0.0（破坏性变更）
```

自动完成：
- `package.json` 版本号 +1
- 同步 `app/components/HeaderSection.tsx` 里的徽章
- git commit + tag

然后：

```powershell
git push
git push --tags
```

配了 GitHub Actions 后，push 触发自动部署。
