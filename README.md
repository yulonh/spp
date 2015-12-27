结构指令
=======

```
Angular拥有强大的模版引擎让我们可以轻易地操纵元素的DOM结构。
```

操纵DOM是单页应用的一个基本特性。通过应用的状态来控制DOM的部分出现或消失，而不是用户每次点击导航时都要刷新整个页面。在这一章我们将会看到Angular是如何操纵DOM，并且学习如何写我们自己的指令来操纵DOM。

在本章我们将会：
* 学习什么是结构指令
* 学习ngIf指令
* 了解```<template>```标签
* 理解星号在＊ngFor中的含义
* 写我们自己的结构指令

[线上例子](http://plnkr.co/edit/?p=preview)

####什么是结构指令？
Angular的指令有以下三种：
* 组件
* 属性指令
* 结构指令

结构指令是带有模版的真正指令，它是这三种指令中最常见的也是我们在实际的应用开发中用得最多的。

属性指令用于改变元素的外观和行为。例如，内置的ngStyle指令可以同时改变一个元素的多个样式。我们可以通过把它绑定到一个组件的属性上实现对文本加粗，字体为斜体，颜色设置为石灰绿这样一系列蛋疼的效果。

结构指令通过添加或删除DOM元素来改变DOM的布局。在其他章节中我们已经见过三个内置的结构指令：ngIf，ngSwitch和ngFor。

```html
<div *ngIf="hero">{{hero}}</div>
<div *ngFor="#hero of heroes">{{hero}}</div>
<div [ngSwitch]="status">
  <template [ngSwitchWhen]="'in-mission'">In Mission</template>
  <template [ngSwitchWhen]="'ready'">Ready</template>
  <template ngSwitchDefault>Unknown</template>
</div>
```

####ngIf例子
让我们把注意力放到ngIf上。它是结构指令的一个很好的例子。它通过一个布尔值来控制一整块DOM的消失和出现。
```html
<p *ngIf="condition">
  condition is true and ngIf is true.
</p>
<p *ngIf="!condition">
  condition is false and ngIf is false.
</p>
```
ngIf并不是通过隐藏元素来实现的。利用浏览器的开发者工具我们可以看到，当condition的值为true的时候，上面这一段内容会出现在DOM中而下面这段内容却完全消失了，取而代之的是一个空的```<script```标签。
```html
<p _ngcontent-tnn-1>
 condition is true and ngIf is true.
</p>
<script></script>
```
####为什么删除而不是隐藏？
我们可以通过设置css样式display为none来隐藏我们不想要的内容。这些元素虽然不可见却仍然存在DOM中。但是ngIf却会删除这些元素。

他们的不同之处在于，如果我们隐藏一个元素，组件的行为将会继续。它仍然保留在DOM中，它会继续监听事件。Angular会继续检测那些可能发生变化的数据绑定。组件的所有行为将会保持。

虽然不可见，但是组件以及他所有的子孙组件仍然会占用那些可能在其他地方更有用处的资源。这样会消耗更多的性能和内存，却对用户一点好处也没有。

当然隐藏也有好的一面，如果元素需要再次显示将会非常快速。组件的状态也会被保留而且可以马上显示。组件不需要重新初始化－这通常是一个昂贵的操纵。

ngIf不一样。设置ngIf为false确实会影响组件的资源消耗。Angular把这些元素从DOM中移除，停止检测相关组件的改变，释放它的DOM事件并且销毁组件。组件将会被垃圾回收（我们希望的）并且释放内存。

组件一般会包含子组件，而这些子组件本身也可能包含它自己的子组件。他们全部都会被销毁如果ngIf指令销毁了他们共同的祖先。这样的清理模式往往是一件好事。

当然这不可能永远都是一件好事。如果这个组件我们很快就需要再次使用的话这就变成一件坏事了。

重建组件的状态可能是一个昂贵的操作。当ngIf的值再次变为true，angular会重新创建组件和他的子树。Angular再次重新执行每个组件的初始逻辑。这可能是一个非常昂贵的动作...因为组件很可能需要重新抓取那些片刻之前出现在内存里的数据。

```
设计思想：尽量简化初始工作并且考虑在它的服务中缓存状态。
```
虽然每种方法都有优点和缺点，但最好使用ngIf去移除不需要的组件而不是隐藏它们。

**这些思想对每个结构指令都适用的，无论是内置的还是自定义的。**我们应该问自己－和那些使用我们组件的用户－认真考虑添加或删除元素，创建或销毁组件所带来的后果。

让我们来看看那些有用的东西，为了显得更加有趣，我们在遵循上面的建议的基础上设计一个叫heavy-loader的组件，假设这个组件在初始化的时候会加载大量的数据。

我们会显示这个组件的两个实例。在第一个组件中我们用css来切换它的可见性。在第二个组件中我们使用ngIf把它从DOM中移除或添加。


*模版代码：*
```html
<div><!-- Visibility -->
  <button (click)="isVisible = !isVisible">show | hide</button>
  <heavy-loader [style.display]="isVisible ? 'inline' : 'none'" [logs]="logs"></heavy-loader>
</div>
<div><!-- NgIf -->
  <button (click)="condition = !condition">if | !if</button>
  <heavy-loader *ngIf="condition" [logs]="logs"></heavy-loader>
</div>
<h4>heavy-loader log:</h4>
<div *ngFor="#message of logs">{{message}}</div>
```
*TypeScript代码:*
```TypeScript
import {Component, Input, Output} from 'angular2/core';
let nextId = 1;
@Component({
  selector: 'heavy-loader',
  template: '<span>heavy loader #{{id}} on duty!</span>'
})
export class HeavyLoaderComponent {
  id = nextId++;
  @Input() logs: string[];
  ngOnInit() {
    // Mock todo: get 10,000 rows of data from the server
    this._log(`heavy-loader ${this.id} initialized,
      loading 10,000 rows of data from the server`);
  }
  ngOnDestroy() {
    // Mock todo: clean-up
    this._log(`heavy-loader ${this.id} destroyed, cleaning up`);
  }
  private _log(msg: string) {
    this.logs.push(msg);
    this._tick();
  }
  // Triggers the next round of Angular change detection
  // after one turn of the JavaScript cycle
  // ensuring display of msg added in onDestroy
  private _tick() { setTimeout(() => { }, 0); }
}

```

我们使用内置的ngOnInit和ngOnDestroy生命周期钩子来记录组件创建和销毁的日志。

下面是例子的动画：

![](heavy-loader-toggle.gif)


刚开始两个组件都存在DOM中。首先我们重复地切换第一个组建的可见性。这个组件一直都存在DOM中。当组件可见时它一直都是同一个实例日志也没有动静。

然后我们通过ngIf切换第二个组件。我们每次都会创建新的实例而且日志也显示我们要付出很大的代价去创建或销毁这个组件。

如果我们真的只是想像例子这样闪烁的使用组件，切换可见性是更好的选择。但在大多数UI中，当我们关闭一个组件就意味着我们在未来很长一段时间内不想再见到它。如果是这样，那么使用ngIf是更好的方案。

####template标签
结构标签，例如ngIf，是通过使用[HTML5模版标签](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)实现的。
```html
<p>
  Hip!
</p>
<template>
  <p>
    Hip!
  </p>
</template>
<p>
  Hooray!
</p>
```
上面显示的结果是一个“Hip!”,完美热情的缩写。当被angular控制时DOM的效果是不一样的。
![](template-in-out-of-a2.png)

很显然angular用空的```<script>```标签替换了```<template>```标签和他的内容。这只是它的默认行为。用它还可以做各种不同的事情如果我们把各种各样的ngSwitch标签用在```<template>``标签上：

```html
<div [ngSwitch]="status">
  <template [ngSwitchWhen]="'in-mission'">In Mission</template>
  <template [ngSwitchWhen]="'ready'">Ready</template>
  <template ngSwitchDefault>Unknown</template>
</div>
```
当某一个switch的条件值是true时angular会把```<template>```的内容插入到DOM中。

如果用ngIf和ngFor来实现我们必须要做什么？用这两个标签时我们不使用```<template>```标签。

####星号(*)的作用
那两个指令又出现了，发现不同之处了吗？
```html
<div *ngIf="hero">{{hero}}</div>
<div *ngFor="#hero of heroes">{{hero}}</div>
```
我们使用一个星号(*)作为那些指令的前缀。
这个星号其实是一个语法糖。它是ngIf和ngFor语法的一种简写简写。Angular引擎的内部实现是将一个更加详细的```<template>```代码片替换这个带星号的代码片。

下面是使用ngIf的两种不同风格，他们实际上是完全一样的，我们用任何一种风格编写都可以。

```html
<!-- Examples (A) and (B) are the same -->
<!-- (A) *ngIf paragraph -->
<p *ngIf="condition">
  Our heroes are true!
</p>

<!-- (B) [ngIf] with template -->
<template [ngIf]="condition">
  <p>
    Our heroes are true!
  </p>
</template>
```
**我们一般会使用（A）代码段的编写风格。**

我们知道Angular会把风格(A)扩展到风格(B)是有好处的。它会将P标签和其内容移到一个```<template>```标签内部。同时会将指令移到```<template>```的一个属性上绑定。主组件的condition属性的布尔值决定模版的内容是否显示。

Angular将*ngIf转换成下面这种类似的方式：
```html
<!-- Examples (A) and (B) are the same -->

<!-- (A) *ngFor div -->
<div *ngFor="#hero of heroes">{{ hero }}</div>

<!-- (B) ngFor with template -->
<template ngFor #hero [ngForOf]="heroes">
  <div>{{ hero }}</div>
</template>
```
他们的基本模式是一样的，创建一个```<template>```标签，重新定位其内容，并且将指令移到```<template>```上。

这两种方式之间还是存在细微的差别，Angular的[ngFor微语法](https://angular.io/docs/ts/latest/guide/template-syntax#!#micro-syntax)会扩展到一个ngForOf的属性上绑定（可迭代的）和本地的#hero模版变量（迭代的当前对象）。

####写一个结构指令
我们来写一个自己的结构指令，一个Unless指令，和ngIf刚好相反的指令。ngIf在值为true时展示模版的内容，而我们的指令在值为false时才会展示模版的内容。

创建一个指令和创建一个组件是类似的：
* 引入Directive装饰器
* 添加一个css的属性选择器（在括号内），用于标识我们的指令
* 为用于绑定的公共input属性指定名称。（通常是指令本身的名称）
* 把装饰器应用到我们实现的类上。

下面是我们开始的代码：

unless.directive.ts (excerpt):
```typescript
import {Directive, Input} from 'angular2/core';

@Directive({ selector: '[myUnless]' })
export class UnlessDirective {
}
```

**方括号选择器[]**

css选择一个属性的语法是把一个属性的名称包括在方括号里。所以我们把的指令名称包括在一个方括号中，可参见上面的小抄。

**选择器名称前缀**

我们建议起一个带前缀的选择器名称来确保不管现在还是以后都不会和任何标准的HTML属性冲突。

我们不在unless指令上使用ng前缀，这个ng前缀是属于angular的，我们不希望我们的指令和angular的指令混淆。

我们使用的前缀是my。

我们需要去访问那些可以渲染它们的内容的模版和一些东西。我们通过TemplateRef访问模版。渲染器是一个ViewContainerRef。我们把这两个都注入到构造函数中作为一个私有变量。

```typescript
constructor(
  private _templateRef: TemplateRef,
  private _viewContainer: ViewContainerRef
  ) { }
```

我们指令的使用者会绑定一个true|false的值到我们指令的myUnless的input属性上。指令会根据这个值添加或者删除模版。

现在让我们添加一个myUnless属性作为一个只有setter的定义属性。

```typescript
@Input() set myUnless(condition: boolean) {
  if (!condition) {
    this._viewContainer.createEmbeddedView(this._templateRef);
  } else {
    this._viewContainer.clear();
  }
}
```
这个@Input()装饰器把这个属性标记为指令的一个输入。

这里没有什么特别的：如果条件值是false，我们会渲染这个模版，否我们会清除模版的那天。

The end result should look like below:
最终的结果看起来是这样的：
```typescript
unless.directive.ts
import {Directive, Input} from 'angular2/core';
import {TemplateRef, ViewContainerRef} from 'angular2/core';
@Directive({ selector: '[myUnless]' })
export class UnlessDirective {
  constructor(
    private _templateRef: TemplateRef,
    private _viewContainer: ViewContainerRef
    ) { }
  @Input() set myUnless(condition: boolean) {
    if (!condition) {
      this._viewContainer.createEmbeddedView(this._templateRef);
    } else {
      this._viewContainer.clear();
    }
  }
}
```
现在我们把它添加到这些主组件的指令数值上并且尝试它。首先我们添加一些测试HTML代码到这个模版。
```html
<p *myUnless="condition">
  condition is false and myUnless is true.
</p>

<p *myUnless="!condition">
  condition is true and myUnless is false.
</p>
```
我们运行它并且它的行为和预期的一样，做了和ngIf相反的事情。当条件是true的时候。上面的内容会被移除(被一个```<script>```标签替换)并且下面的内容会显示。
```html
<script></script>
<p _ng-content-tnn1>
condition is true and myUnless is false.
</p>
```
我们的myUnless指令是非常的简单。当然，我们遗留了一些东西，ngIf会更加复杂？

看下这些源代码。它是有据可查的，我们不用羞于咨询这些代码当我们想知道它是如果工作的。

ngIf并没有太多的不同。它有做一些额外的检查以提高性能(非必要的时候不会清除或者重新创建视图)，除此之外大部分是一样的。


下面是这章的相关代码：

unless.directive.ts:
```typescript
import {Directive, Input} from 'angular2/core';
import {TemplateRef, ViewContainerRef} from 'angular2/core';
@Directive({ selector: '[myUnless]' })
export class UnlessDirective {
  constructor(
    private _templateRef: TemplateRef,
    private _viewContainer: ViewContainerRef
    ) { }
  @Input() set myUnless(condition: boolean) {
    if (!condition) {
      this._viewContainer.createEmbeddedView(this._templateRef);
    } else {
      this._viewContainer.clear();
    }
  }
}
```
heavy-loader.component.ts：
```typescript
import {Component, Input, Output} from 'angular2/core';
let nextId = 1;
@Component({
  selector: 'heavy-loader',
  template: '<span>heavy loader #{{id}} on duty!</span>'
})
export class HeavyLoaderComponent {
  id = nextId++;
  @Input() logs: string[];
  ngOnInit() {
    // Mock todo: get 10,000 rows of data from the server
    this._log(`heavy-loader ${this.id} initialized,
      loading 10,000 rows of data from the server`);
  }
  ngOnDestroy() {
    // Mock todo: clean-up
    this._log(`heavy-loader ${this.id} destroyed, cleaning up`);
  }
  private _log(msg: string) {
    this.logs.push(msg);
    this._tick();
  }
  // Triggers the next round of Angular change detection
  // after one turn of the JavaScript cycle
  // ensuring display of msg added in onDestroy
  private _tick() { setTimeout(() => { }, 0); }
}
```
structural-directives.component.ts：
```typescript
import {Component, Input, Output} from 'angular2/core';
import {UnlessDirective}          from './unless.directive';
import {HeavyLoaderComponent}     from './heavy-loader.component';
@Component({
  selector: 'structural-directives',
  templateUrl: 'app/structural-directives.component.html',
  styles: ['button { min-width: 100px; }'],
  directives: [UnlessDirective, HeavyLoaderComponent]
})
export class StructuralDirectivesComponent {
  heroes = ['Mr. Nice', 'Narco', 'Bombasto'];
  hero = this.heroes[0];
  condition = true;
  isVisible = true;
  logs: string[] = [];
  status = 'ready';
}
```
structural-directives.component.html：
```html
<h1>Structural Directives</h1>
<div *ngIf="hero">{{hero}}</div>
<div *ngFor="#hero of heroes">{{hero}}</div>
<div [ngSwitch]="status">
  <template [ngSwitchWhen]="'in-mission'">In Mission</template>
  <template [ngSwitchWhen]="'ready'">Ready</template>
  <template ngSwitchDefault>Unknown</template>
</div>
<hr>
<button
  (click)="condition = !condition"
  [style.background] = "condition ? 'orangered': 'lightgreen'"
  >
  Set 'condition' to {{condition ? 'False': 'True'}}
</button>
<p *ngIf="condition">
  condition is true and ngIf is true.
</p>
<p *ngIf="!condition">
  condition is false and ngIf is false.
</p>
<p *myUnless="condition">
  condition is false and myUnless is true.
</p>
<p *myUnless="!condition">
  condition is true and myUnless is false.
</p>
<hr>
<div><!-- Visibility -->
  <button (click)="isVisible = !isVisible">show | hide</button>
  <heavy-loader [style.display]="isVisible ? 'inline' : 'none'" [logs]="logs"></heavy-loader>
</div>
<div><!-- NgIf -->
  <button (click)="condition = !condition">if | !if</button>
  <heavy-loader *ngIf="condition" [logs]="logs"></heavy-loader>
</div>
<h4>heavy-loader log:</h4>
<div *ngFor="#message of logs">{{message}}</div>
<hr>
<p>
  Hip!
</p>
<template>
  <p>
    Hip!
  </p>
</template>
<p>
  Hooray!
</p>
<hr>
<!-- Examples (A) and (B) are the same -->
<!-- (A) *ngIf paragraph -->
<p *ngIf="condition">
  Our heroes are true!
</p>
<!-- (B) [ngIf] with template -->
<template [ngIf]="condition">
  <p>
    Our heroes are true!
  </p>
</template>
<hr>
<!-- Examples (A) and (B) are the same -->
<!-- (A) *ngFor div -->
<div *ngFor="#hero of heroes">{{ hero }}</div>
<!-- (B) ngFor with template -->
<template ngFor #hero [ngForOf]="heroes">
  <div>{{ hero }}</div>
</template>
```
我们学习了如何用结构指令像ngFor和ngIf一样操纵我们HTML的布局，并且我们写了自己的结构指令，myUnless，去做一些类似的事情。

Angular提供了更多先进的技术管理布局，例如结构组件可以提取外部的内容和自己模版内的内容结合起来。Tab和tab空间是很好的例子。

我们将会在后面的章节学习结构组件。

下一步

Hierarchical Injectors
