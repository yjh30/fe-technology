# 在vscode中调试nodejs

> tip1：在终端用命令启动vscode，打开vscode，按command+shift+p，选择Shell命令：在PATH中安装“code”命令，之后你就可以在终端使用code .命令启动vscode了，vscode默认打开你当前所在的目录文件夹  

> tip2：调试nodejs前提需要 开启自动附加，vscode最底部状态栏点击自动附加，可以切换自动附加功能；或者按command+shift+p，选择 Debug:切换开关自动附加

## 调试启动程序
- 在vscode终端输入以下命令
```bash
node --inspect app.js
```
参数--inspect-brk表示debugger调试器已经准备就绪，然后执行应用程序代码
```bash
node --inspect-brk app.js
```
- 依次点击编辑器最左侧 调试按钮(🐜) -> 调试下拉选项 -> 增加配置 -> Node.js:启动程序 配置launch.json(该文件位于项目跟目录.vscode隐藏目录下)
```json
{
  // 使用 IntelliSense 了解相关属性。 
  // 悬停以查看现有属性的描述。
  // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/app.js"
    }
  ]
}
```

## 调试nodejs进程
- 




























