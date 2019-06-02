# nvm重装笔记

> [官网](https://github.com/nvm-sh/nvm)

## 安装nvm

- 步骤1：新建文件(~/.bash_profile, ~/.zshrc, ~/.profile, or ~/.bashrc).
``` bash
touch ~/.bash_profile
touch ~/.~/.bashrc
touch ~/.zshrc
```

- 步骤2：执行以下命令
``` bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
```

- 步骤3：测试安装是否成功
```bash
nvm -help
```

## 安装node

- 查看node版本，安装指定node版本
```bash
nvm ls-remote
nvm install v12.3.1
```

- 指定终端node版本，指定默认node版本
```
nvm use 12
nvm alias default v12.3.1
```

## 设置npm，nvm淘宝镜像

在~/.npmrc文件写入
```bash
registry=https://registry.npm.taobao.org
```
或者直接bash中直接执行
```bash
npm config set registry https://registry.npm.taobao.org
```

在~/.zshrc文件写入
```bash
export NVM_NODEJS_ORG_MIRROR=https://npm.taobao.org/mirrors/node
```


## 卸载nvm
to remove, delete, or uninstall nvm - just remove the `$NVM_DIR` folder (usually `~/.nvm`)
