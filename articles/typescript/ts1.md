# typescript 入门学习
## 学习目的
- 思维方式（思维方法）
- 编程习惯
- 工程质量
- 能力边界

## [typescript](https://www.typescriptlang.org/zh/) vs javascript
> [typescript在线练习](https://www.typescriptlang.org/play)

| 区别 | typescript | javascript |
| -- | -- | -- |
| 强/弱类型 | 强类型（类型严格） | 弱类型 |
| 静/动态类型 | 静态类型（编译时检查） | 动态类型 |

## 类型学习

##### 1、基本类型
> es6数据类型 + void any never 元组 枚举 高级类型

```ts
let num:number = 10;

let str:string = 'yjh';

let bl:boolean = true;

let und:undefined = undefined;

let nul:null = null;

let sy:symbol = Symbol();

let obj:object = { name: 'yjh' };

let arr:number[] = [1,2,3];

let arr2:Array<number | string> = [1,'2',3];

let fn: (x: number, y: number) => number
fn = (m, n) => m + n;

// 元组
let tuple: [number, string] = [1, '2'];
tuple.push(3); // 不能越界访问 tuple[2]

// void
let noReturnFn = () => {}

// any类型是typescript对js的兼容
let variable: any;
variable = 10;
variable = {};

// never
let error = () => {
  throw new Error('errorMsg')
};
let endless = () => {
  while(true) {}
}
```

##### 2、枚举类型（名字的常量集合）
> 解决硬编码（数字魔法）
- 数字枚举(反向映射)
```ts
// 小数位数字枚举
enum DecimalDigits {
  Amount = 2,
  Price = 5,
  Discount = 2,
  SpecialDiscount = 7,
  AmountDiscount = 5,
  Default = 0,
}

// 事业部id
enum DepartmentIds {
  one = 1,
  two = 2,
  three = 3,
  four = 4,
}
```
- 字符串枚举(不能反向映射)
```ts
enum Message {
  Success = '恭喜您，成功了'，
  Fail = '闯关失败',
}
```

- 异构枚举（混用，不建议使用）
```ts
enum Answer {
  N,
  Yes = 'yes',
}
```

- 常量枚举
```ts
const enum Month {
  Jan = 1,
  Feb = 2,
  Mar = 3,
}
```

- 枚举成员
```ts
enum Char {
  // const
  a,
  b,
  c = 1 + 2,

  // computed (运行时阶段计算)
  d = '123'.length,
}
```

- 枚举类型
```ts
const march:Month = Month.Mar;
const threeDepartmentId:DepartmentIds = DepartmentIds.three;

march === threeDepartmentId // false
```

##### 3、接口（对象类型接口）
```ts
interface IRequestBody {
  departmentId: number,

  // 索引签名
  [key: string]: string | number
}

// 数字索引IPermissions得到一个字符串
interface IPermissions {
  [index: number]: string
}

interface IUserInfo {
  id: number,
  name: string,
  permissions: IPermissions
}

const userInfo = {
  id: 1,
  name: 'yjh',
  permissions: [
    'customer:create:list',
    'system:split:detail',
    'system:subscriptionApply:remove'
  ],
}
const variation = {
  ...userInfo,
  id: '1'
}

function getUserInfo(data: IUserInfo) {
  return data;
}

// 鸭式辩型
getUserInfo(Object.assign(userInfo, { x: 11 }));

// 类型不兼容，IUserInfo类型id成员不兼容
getUserInfo(variation);

// 对象字面量会进行ts类型检查
getUserInfo({
  id: 1,
  name: 'yjh',
  permissions: [
    'customer:create:list',
    'system:split:detail',
    'system:subscriptionApply:remove'
  ],
  // IUserInfo类型不存在x成员
  x: 11
});

// 解决方法，为接口IUserInfo添加索引签名，或者 使用as强制类型断言，告诉ts略过类型检查
```


###### 接口（函数类型接口）
```ts
// 类型注解
// let add: (x: number, y: number) => number

// 类型别名
// type IAdd = (x: number, y: number) => number

// interface IAdd {
//   // 函数签名
//   (x: number, y: number): number
// }

// const add:IAdd = (x, y) => x + y;

// 混合类型接口
interface ILib {
  // 函数签名
  (x: number, y: number): number;
  version: string;
}

let lib:ILib;

lib = ((x, y) => x + y) as ILib;
lib.version = '1.0.0';
```


##### 4、函数重载
```ts
function add(...rest: number[]): number;
function add(...rest: string[]): string;
function add(...rest: any[]): any {
  if (typeof rest[0] === 'string') {
    return rest.join('');
  }
  if (typeof rest[0] === 'number') {
    return rest.reduce((pre, cur) => pre + cur);
  }
}

add(1, 2, 3); // 6
add('1', '2', '3'); // '123'
```

<!-- ##### 类（继承和成员修饰符） -->

<!-- ##### 类（抽象类与多态） -->

##### 5、泛型（泛型函数与泛型接口）
```ts
// 泛型函数
function log<T>(value: T): T {
  return value;
}

type Log = <T>(value: T) => T;

const log:Log = (value) => {
  return value;
}

// 泛型接口
interface IDesignerStore<P> {
  value: P
}
```

##### 6、类型检查
###### 类型检查（类型推断）
- 通用类型推断（从右向左）
```ts
// a: number
let a = 1

// b: number[]
let b = [1]

// let f: (x?: number) => number
let f = (x = 1) => x + 1
```
- 上下文类型推断（从左向右）
```ts
window.addEventListener('touchstart', (event) => {
  // event: TouchEvent
  console.log(event.currentTarget)
});
```

###### 类型检查（类型兼容）
- X 兼容 Y：X（目标类型）= Y（源类型）
- 结构之间兼容：成员少的兼容成员多的
- 函数之间兼容：参数多的兼容参数少的

```ts
// string | number 兼容 number

let strNum:string | number
const n:number = 11;
strNum = n;
```

###### 接口兼容性（鸭式辩型法，成员少的兼容成员多的）
```ts
interface X {
  a:any;
  b:any;
}

interface Y {
  a:any;
  b:any;
  c:any;
}

let x:X = {
  a: 1,
  b: 2,
}

let y:Y = {
  a: 1,
  b: 2,
  c: 3,
}

// 鸭式辩型法，成员少的兼容成员多的
x = y;
// y = x;  // 不兼容，Property 'c' is missing in type 'X' but required in type 'Y'
```

###### 函数兼容性（参数个数）
```ts
type Handle = (a:number, b:number) => void;

function hof(handle: Handle) {
  return handle;
}

// 参数个数
let handle1 = (a: number) => {};
hof(handle1);

// let handle2 = (a: number, b: number, c: number) => {};
// hof(handle2); // 类型不兼容，Handle不兼容handle2函数的类型

// 固定参数兼容 可选参数，剩余参数
// 剩余参数兼容 固定参数，可选参数
let a = (x: number, y: number) => {};
let b = (x?: number, y?: number) => {};
let c = (...rest: number[]) => {};

a = b;
a = c;
c = b;
c = a;
// b = c; // 不兼容
// b = a; // 不兼容
```
###### 函数兼容性（参数类型）
```ts
let handle1 = (a: string) => {};
hof(handle1); // 类型不兼容

interface IPoint3D {
  x: number;
  y: number;
  z: number;
}

interface IPoint2D {
  x: number;
  y: number;
}

let p3d = (point: IPoint3D) => {};
let p2d = (point: IPoint2D) => {};

p3d = p2d; // 与鸭式辩型法相反，这里可以理解为成员多的兼容成员少的，把接口成员作为参数
// p2d = p3d; // 类型不兼容
```

###### 函数兼容性（返回值类型）
```ts
let fn1 = () => ({ x: 1 });
let fn2 = () => ({ x: 1, y: 1 });

fn1 = fn2; // 返回值类型 成员少的兼容成员多的，与鸭式辨型法一致
// fn2 = fn1; // 类型不兼容
```

###### 函数重载
```ts
function overload(a: number, b: number): number; // 函数重载列表，目标函数
function overload(a: string, b: string): string; // 函数重载列表，目标函数
function overload(a: any, b: any): any {} // 函数实现，源函数
```

###### 枚举类型兼容性
```ts
enum Fruit {
  Apple,
  Banana,
}
enum Color {
  Red,
  Yellow,
}
// 枚举类型兼容数字类型
let fruit:Fruit.Apple = 3;

// 枚举类型不兼容枚举类型
// let color:Color.Red = Fruit.Apple;
```

###### 类兼容性
> 静态函数 与 构造函数不参与比较，只比较成员
```ts
class A {
  static aName: string = 'A';
  constructor() {
    // 
  }
  id: number = 1;
}

class B {
  static bName: string = 'B';
  constructor() {
    //
  }
  id: number = 2;
}

let a:A = new A();
let b:B = new B();
a = b;
b = a;
```

###### 泛型兼容性
```ts
interface IDesignerStore<P> {
  value: P
}
interface IVueRef<T> {
  value: T
}
let store:IDesignerStore<object> = {
  value: {}
}
let ref:IVueRef<number> = {
  value: 10
}
// store = ref; // 不兼容
// ref = store; // 不兼容
```


##### 类型检查（类型保护）
```ts
// instanceof
// in 关键字
// typeof
// 类型保护函数

enum LanguageType {
  Java,
  JavaScript
}

class Java {
  name: string;
  constructor() {
    this.name = 'Java';
  }
  helloJava() {
    console.log(`hello ${this.name}`);
  }
}

class JavaScript {
  name: string;
  type: LanguageType;
  constructor() {
    this.name = LanguageType[LanguageType.JavaScript];
    this.type = LanguageType.JavaScript;
  }
  helloJavaScript() {
    console.log(`hello ${this.name}`);
  }
}

// 类型保护函数，类型谓词
function isJavaScript(language: Java | JavaScript): language is JavaScript {
  return (language as JavaScript)?.helloJavaScript !== undefined;
}

function hello(language: Java | JavaScript, otherLanguageName?: string) {
  // instanceof
  if (language instanceof Java) {
    language.helloJava();
  } else {
    language.helloJavaScript();
  }
 
  // in
  if ('type' in language) {
    language.helloJavaScript();
  } else {
    language.helloJava();
  }

  // typeof
  if (typeof otherLanguageName === 'string' && otherLanguageName.length > 0) {
    console.log(`hello ${otherLanguageName}`)
  }

  // 类型保护函数
  if (isJavaScript(language)) {
    language.helloJavaScript();
  } else {
    language.helloJava();
  }
}

```


<!-- ##### 高级类型（交叉类型与联合类型） -->

<!-- ##### 高级类型（索引类型） -->

<!-- #####  高级类型（映射类型） -->

<!-- ##### 高级类型（条件类型） -->


