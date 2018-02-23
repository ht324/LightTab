# Light Tab Module

簡易方便無依賴的 Tab 模組，旨在建立一個無門檻套件。  
以下內容為 Tab 模組的使用指引。內容漸進增強，因此如果只是簡單使用，無需通盤了解即可使用。

## 使用

###JavaScript

`<script type="application/javascript" src="Tab.js"></script>`

###CSS

`<link rel="stylesheet" type="text/css" href="ltc_Tab.css" />`


###HTML

```
<div data-ltc-tab>
	<div data-id="test1" data-title="測試1">test1 content</div>
	<div data-id="test2" data-title="測試2">test2 content</div>
	<div data-id="test3" data-title="測試3">test3 content</div>
</div>
```

## Optional

### data-url-response

> 是否與網址響應，參照網址 hash tag 來決定 Active 在哪一個 tab，切換 tab 時也會改變網址 hash tag。  
> eg. `<div data-ltc-tab data-url-response="true">`  
>   
> 預設值為 `false`

### data-mouse-over

> 是否啟用 mouse over 切換 tab。  
> eg. `<div data-ltc-tab data-mouse-over="true">`  
> 
> 或者指定毫秒數，將會延遲切換 tab。  
> eg. `<div data-ltc-tab data-mouse-over="500">` //延遲 500 毫秒切換 tab  
> 
> 預設值為 `false`

### data-theme

> 提供一些預設的 Theme 來簡易設置不同樣式。  
> eg. `<div data-ltc-tab data-theme="dark">`  
> 提供的 Theme 有  
> * light : 亮色系  
> * dark : 暗色系  
> * single : 每個 tab bottom 單獨呈現  
> * stress : 強調啟用中的 tab button  
> 以上 Theme 可以混用，建議以空格隔開。eg.`<div data-ltc-tab data-theme="dark single">`  
> 如有更多需要客制的樣式，請參閱 **客制 Style**。  
> 預設值為 `light stress`

### data-name

> 替 Tab component 命名，讓 JavaScript 可以對此操作。請參閱 **JavaScript 操作**。  
> eg. `<div data-ltc-tab data-name="myTab">`  
> 如沒有命名，將會自動依序給定名稱，eg.`tab_0`

## 客制 Style

首先需要瞭解此模組會將 HTML 重新結構化成下面形式：  

```
<div data-ltc-tab data-theme="light stress" class="ltc-tab" data-ltc-rendered="true">
	<div data-ltc-tab-list class="ltc-tab-list-wrapper">
		<div class="ltc-tab-list-container">
			<ul class="ltc-tab-list">
				<li data-id="test1" class="selected">
					<a data-id="test1" href="#test1">測試1</a>
				</li>
				<li data-id="test2">
					<a data-id="test2" href="#test2">測試2</a>
				</li>
				<li data-id="test3">
					<a data-id="test3" href="#test3">測試3</a>
				</li>
			</ul>
			<a class="ltc-tab-arrow left edge"></a>
			<a class="ltc-tab-arrow right"></a>
		</div>
	</div>
	<div data-ltc-tab-content class="ltc-tab-content-container">
		<div data-id="test1" data-title="測試1" class="selected">test1 content</div>
		<div data-id="test2" data-title="測試2" >test2 content</div>
		<div data-id="test3" data-title="測試3" >test3 content</div>
	</div>
</div>
```
請依這個結構進行 CSS 的操作，例如要改變 tab button 的文字顏色，可以這麼做：  

CSS

```
.ltc-tab.custom_tab .ltc-tab-list a{
	color: #ff6600;
}
```

HTML

```
<div data-ltc-tab class="custom_tab">
	...（略）
</div>
```

ps: 預設的 tab button 高度為 `42px` 

## JavaScript 操作

### 取得目標 Tab component 的實體

eg.```var myTab = Tab.myTab;```

`Tab` 是整個 module，  
`myTab` 是 `data-name` 命的名字(請參考 Optional/data-name)，  
`Tab.myTab` 會回傳 myTab component。

### 開放方法

* **addTab**  
用途：新增一個 tab section。  
參數：id, title, content[, position]  

> id: tab 身份識別。  
> title: tab bottom 顯示名稱。  
> content: 欲顯示的內容，為 HTML Element Object。  
> position: 指定放在哪個位置，如沒指定就放在最後。

* **removeTab**  
用途：移除一個 tab section。  
參數：id  

> id: 欲刪除的 tab 身份識別。

* **hideTab**
用途：隱藏一個 tab section。  
參數：id  

> id: 欲隱藏的 tab 身份識別。

* **showTab**  
用途：顯示一個被隱藏的 tab section。  
參數：id  

> id: 欲隱藏的 tab 身份識別。

* **setActive**
用途：指定顯示的 tab section。  
參數：index  

> index: 欲顯示的 tab 位置。  

* **setActiveById**  
用途：指定顯示的 tab section。  
參數：id  

> id: 欲顯示的 tab 身份識別。 

* **subscribe**  
用途：訂閱事件。更多事件相關內容請參閱 **事件**  
參數：type, fn

> type: 事件類型  
> fn: 回調函式

* **unsubscribe**
用途：取消訂閱事件。  
參數：type, fn

> type: 事件類型  
> fn: 回調函式

### 全域的開放方法

* **reset**
用途：重新檢查是否有遺漏未渲染的 Tab，將之渲染。  

eg.```Tab.reset();```

### 事件

下列事件提供訂閱：

* **Tab.EVENT.SWITCH**  

> 當 tab section 切換時派發  
> 事件回調會帶回以下資訊： `{ id, tab, content, preId, preTab, preContent }`  
>   
> id: 新的 active tab 的身份識別  
> tab: 新的 active tab button  
> content: 新的 active tab content  
> preId: 舊的 active tab 的身份識別  
> preTab: 舊的 active tab button  
> preContent: 舊的 active tab content

* **Tab.EVENT.ADD_ITEM**  

> 當新增 tab section 時派發
> 事件回調會帶回以下資訊：`{ id, tab, content }`  
>   
> id: 新增的 active tab 的身份識別  
> tab: 新增的 active tab button  
> content: 新增的 active tab content  

* **Tab.EVENT.REMOVE_ITEM**  

> 當移除 tab section 時派發
> 事件回調會帶回以下資訊：`{ id, tab, content }`  
>   
> id: 移除的 active tab 的身份識別  
> tab: 移除的 active tab button  
> content: 移除的 active tab content  

* **Tab.EVENT.HIDE_ITEM**  

> 當隱藏 tab section 時派發
> 事件回調會帶回以下資訊：`{ id, tab, content }`  
>   
> id: 隱藏的 active tab 的身份識別  
> tab: 隱藏的 active tab button  
> content: 隱藏的 active tab content  

* **Tab.EVENT.SHOW_ITEM**  

> 當顯示一個被隱藏的 tab section 時派發
> 事件回調會帶回以下資訊：`{ id, tab, content }`  
>   
> id: 顯示的 active tab 的身份識別  
> tab: 顯示的 active tab button  
> content: 顯示的 active tab content  

eg.

```
var myTab = Tab.myTab;
myTab.subscribe(Tab.EVENT.SWITCH, onSwitchTab);
function onSwitchTab(e){
	console.log(e);
}
```