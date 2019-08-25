# Keynote如何高亮显示代码
- brew install highlight
- highlight --style=github -k "Fira Code" -K 36 -u "utf-8" -t 4 -O rtf 文件目录 | pbcopy
  - -s 设置主题样式
  - -k 设置字体
  - -K 设置字体大小
  - -u 设置字符编码
  - -t 代码缩进数量
  - -O 输出文件类型（-O rtf 表示输出rtf类型的文件）
- 执行highlight命令后，直接粘贴剪切板的内容到Keynote中

## [highlight文档](http://www.andre-simon.de/doku/highlight/en/highlight.php)
