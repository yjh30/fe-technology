# 浅析百度umeditor编辑器toolbar工具运行原理

## 一、浅析UM.ui.define
> 源码位置： _src/ui/widget.js
> 理解：定义ui工厂函数，如定义：$.eduibutton
> 示例：_src/ui/button.js

```js
UM.ui.define('button', {
    tpl: '<<%if(!texttype){%>div class="edui-btn edui-btn-<%=icon%> <%if(name){%>edui-btn-name-<%=name%><%}%>" unselectable="on" onmousedown="return false" <%}else{%>a class="edui-text-btn"<%}%><% if(title) {%> data-original-title="<%=title%>" <%};%>> ' +
        '<% if(icon) {%><div unselectable="on" class="edui-icon-<%=icon%> edui-icon"></div><% }; %><%if(text) {%><span unselectable="on" onmousedown="return false" class="edui-button-label"><%=text%></span><%}%>' +
        '<%if(caret && text){%><span class="edui-button-spacing"></span><%}%>' +
        '<% if(caret) {%><span unselectable="on" onmousedown="return false" class="edui-caret"></span><% };%></<%if(!texttype){%>div<%}else{%>a<%}%>>',

    init: function(options) {
        // root函数的参数成为了this._$el
        // $.eduibutton函数返回的就是(this._$el === this.root())，并且this._$el绑定了click监听器options.click
        this.root($($.parseTmpl(this.tpl, options)))
            .click(function(evt) {
                this.wrapclick(options.click, evt)
            });
    },
    // ...
});
```

上述示例代码将一个匿名函数保存在UM.ui['button']中，该匿名函数原型继承UM.ui.define的第二个参数对象，内部_widget函数的原型；同时该匿名函数内部实例化了一个原型继承匿名函数原型的空函数实例，匿名函数返回($el = $($.parseTmpl(tpl, opts)))，并且设置$el.data('eduiwidget', $el)，最后扩展jQ，也是最重要的一步，$.eduibutton = UM.ui['button']，使用如下：
```js
$.eduibutton({
    icon: 'bold',
    click: function() {
        console.log('test');
    },
    title: 'test'
});
```


## 二、浅析UM.registerUI
> 源码位置：_src/adapter/adapter.js
> 理解：实例化通过UM.ui.define定义的工厂函数，如：实例化 $.eduibutton
> 示例：_src/adapter/button.js

```js
UM.registerUI('bold italic redo undo underline strikethrough superscript subscript insertorderedlist insertunorderedlist ' +
    'cleardoc selectall link unlink print preview justifyleft justifycenter justifyright justifyfull removeformat horizontal drafts',
    function(name) {
        var me = this; // this代指editor
        var $btn = $.eduibutton({
            icon: name,
            click: function() {
                // 执行编辑命令cmdName，完成富文本编辑效果
                // execCommand方法位于 _src/core/Editor.js 763(line)，最终将会执行插件定义的execCommand方法
                me.execCommand(name);
            },
            title: this.getLang('labelMap')[name] || ''
        });

        this.addListener('selectionchange', function() {
            var state = this.queryCommandState(name);
            $btn.edui().disabled(state == -1).active(state == 1)
        });
        return $btn;
    }
);
```

上述示例代码将循环遍历结果缓存如下：
```js
_editorUI['bold'] = fn; // fn指UM.registerUI的第二个参数
_editorUI['italic'] = fn;
_editorUI['redo'] = fn;
// ...
```

在创建编辑器初始化注册的ui组件，执行如下：
```js
_cacheUI['bold'] = fn.call(editor, 'bold');
_cacheUI['italic'] = fn.call(editor, 'italic');
_cacheUI['redo'] = fn.call(editor, 'redo');
```
创建toolbar将缓存的ui组件插入到toolbar中，...


## 三、浅析UM.plugins中的插件
> 编辑器源码将会执行目录_src/plugins/ 下所有的插件
> 位置：_src/plugins/*
> 示例：_src/plugins/preview.js

```js
UM.commands['preview'] = {
    execCommand: function() {
        // this 指编辑器实例
        var w = window.open('', '_blank', ''),
            d = w.document,
            c = this.getContent(null, null, true),
            path = this.getOpt('UMEDITOR_HOME_URL'),
            formula = c.indexOf('mathquill-embedded-latex') != -1 ?
            '<link rel="stylesheet" href="' + path + 'third-party/mathquill/mathquill.css"/>' +
            '<script src="' + path + 'third-party/jquery.min.js"></script>' +
            '<script src="' + path + 'third-party/mathquill/mathquill.min.js"></script>' : '';
        d.open();
        d.write('<html><head>' + formula + '</head><body><div>' + c + '</div></body></html>');
        d.close();
    },
    notNeedUndo: 1
};
```
上述插件代码定义了一个execCommand方法，该方法将会在编辑器实例execCommand方法中执行，服务于UM.registerUI


## 四、浅析toolbar中较复杂的ui工具
>示例：_src/adapter/dialog.js

```js
UM.registerUI('link image video map formula',function(name){

    var me = this, currentRange, $dialog,
        opt = {
            title: (me.options.labelMap && me.options.labelMap[name]) || me.getLang("labelMap." + name),
            url: me.options.UMEDITOR_HOME_URL + 'dialogs/' + name + '/' + name + '.js'
        };

    // 为什么没有传click监听器，底部的attachTo执行有说明
    var $btn = $.eduibutton({
        icon: name,
        title: this.getLang('labelMap')[name] || ''
    });

    // 加载模板数据 `/dialogs/${name}/${name}.js`
    utils.loadFile(document,{
        src: opt.url,
        tag: "script",
        type: "text/javascript",
        defer: "defer"
    },function(){
        // 调整数据
        var data = UM.getWidgetData(name);
        if(!data) return;
        if(data.buttons){
            var ok = data.buttons.ok;
            if(ok){
                opt.oklabel = ok.label || me.getLang('ok');
                if(ok.exec){
                    opt.okFn = function(){
                        return $.proxy(ok.exec,null,me,$dialog)()
                    }
                }
            }
            var cancel = data.buttons.cancel;
            if(cancel){
                opt.cancellabel = cancel.label || me.getLang('cancel');
                if(cancel.exec){
                    opt.cancelFn = function(){
                        return $.proxy(cancel.exec,null,me,$dialog)()
                    }
                }
            }
        }
        data.width && (opt.width = data.width);
        data.height && (opt.height = data.height);

        $dialog = $.eduimodal(opt);

        $dialog.attr('id', 'edui-dialog-' + name).addClass('edui-dialog-' + name)
            .find('.edui-modal-body').addClass('edui-dialog-' + name + '-body');

        $dialog.edui().on('beforehide',function () {
            var rng = me.selection.getRange();
            if (rng.equals(currentRange)) {
                rng.select()
            }
        }).on('beforeshow', function () {
                var $root = this.root(),
                    win = null,
                    offset = null;
                currentRange = me.selection.getRange();
                if (!$root.parent()[0]) {
                    me.$container.find('.edui-dialog-container').append($root);
                }

                //IE6下 特殊处理, 通过计算进行定位
                if( $.IE6 ) {

                    win = {
                        width: $( window ).width(),
                        height: $( window ).height()
                    };
                    offset = $root.parents(".edui-toolbar")[0].getBoundingClientRect();
                    $root.css({
                        position: 'absolute',
                        margin: 0,
                        left: ( win.width - $root.width() ) / 2 - offset.left,
                        top: 100 - offset.top
                    });

                }
                UM.setWidgetBody(name,$dialog,me);
                UM.setTopEditor(me);
        }).on('afterbackdrop',function(){
            this.$backdrop.css('zIndex',me.getOpt('zIndex')+1).appendTo(me.$container.find('.edui-dialog-container'))
            $dialog.css('zIndex',me.getOpt('zIndex')+2)
        }).on('beforeok',function(){
            try{
                currentRange.select()
            }catch(e){}
        })
        // 点击$btn[0] 将触发beforeshow事件
        .attachTo($btn)
    });

    me.addListener('selectionchange', function () {
        var state = this.queryCommandState(name);
        $btn.edui().disabled(state == -1).active(state == 1)
    });
    return $btn;
});
```
上述代码通过UM.registerUI实例化$.eduibutton，编辑器工具栏中有link image video map  formula等工具，这些ui工具都是$.eduibutton的实例化对象，这里举例image工具，首先实例化$.eduibutton，$btn = $.eduibutton({ icon: 'image', title: '图片' })，然后异步加载/dialogs/image/image.js，该js通过UM.registerWidget注册对话框的widget对象，js文件加载完成后，获取通过UM.registerWidget注册的image widget对象，根据该widget对象数据实例化$.eduimodal，$dialog = $.eduimodal(opt)；最重要的点来了，$btn与$dialog是咋样的关系，仔细看代码，$dialog.attachTo($btn);该代码执行后，点击$btn[0]节点将会执行$dialog注册的beforeshow事件监听器，该监听器逻辑就是处理/dialogs/image/image.js与$eduimodal之间的渲染

