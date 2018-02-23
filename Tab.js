;(function() {
	function Tab() {
		domReady(init.bind(this));
        
        var count = 0;
		function init(){
			var tabContainers = Array.prototype.slice.call(document.querySelectorAll("div[data-ltc-tab]"));
            count = build.apply(this,[tabContainers, count]);
		}
        
        function build(tabContainers, count){
            count = count || 0;
            tabContainers.forEach(function(container, index){
                if(container.dataset.ltcRendered == "true") return;
				var tabItem = new TabItem(container);
				var name = tabItem.name || "tab_" + (count + index);
				Object.defineProperty(this, name, {
					get: function(){
						return tabItem.publicMethod();
					}
				});
                count += 1;
			}.bind(this));
            return count;
        }
        
        this.reset = function(){
            init.call(this);
        };
	}
	 
	Tab.EVENT = Tab.prototype.EVENT = {
			SWITCH: "switch",
			ADD_ITEM: "add_item",
			REMOVE_ITEM: "remove_item",
			HIDE_ITEM: "hide_item",
			SHOW_ITEM: "show_item"
	};
	
	function TabItem(container){
		ObserverPattern.call(this);
		var product = this.renderContainer(container);
		var self = this;
		
        /*
        operation => {
            urlResponse,
            mouseOver,
            mouseOverDelay
        }
        */
        this.operation = this.defineOperation(container.dataset);
        
		this.el = {
				container: container,
				tabListContainer: product.el.tabListContainer,
				arrowLeft: product.el.arrowLeft,
				arrowRight: product.el.arrowRight,
				contentContainer: product.el.contentContainer
		};
		this.store = {
				map : {},
				active: "",
				tabWidth: 0,
				arrowWidth: this.calculateArrow(),
				tabListTouchPoint: 0,
				candidate: [],
				unActiveItem: {},
				tabList: product.list.tabList,
				contentList: product.list.contentList,
                mouseOverDelayTimerId: null,
				_listWidth: 0,
				_containerWidth: 0,
				_isArrowShow: false,
				_tabLeft : 0,
				_tabLeftEdge: false,
				_tabRightEdge: false,
				_tabLeftLimit: 0
		};
		
		Object.defineProperty(this.store, 'listWidth', {
			get: function(){ return this._listWidth; },
			set: function(val){
				if(this._listWidth != val){
					this._listWidth = val;
					self.checkWidth();
				}
			}
		});
		Object.defineProperty(this.store, 'containerWidth', {
			get: function(){ return this._containerWidth; },
			set: function(val){
				if(this._containerWidth != val){
					this._containerWidth = val;
					self.checkWidth();
				}
			}
		});
		Object.defineProperty(this.store, 'isArrowShow', {
			get: function(){ return this._isArrowShow; },
			set: function(val){
				if(this._isArrowShow != val){
					this._isArrowShow = val;
					self.changeArrowStauts(val);
				}
			}
		});
		Object.defineProperty(this.store, 'tabLeft', {
			get: function(){ return this._tabLeft; },
			set: function(val){
				if(this._tabLeft != val){
					this._tabLeft = val;
					self.setTabLeft(val);
				}
			}
		});
		Object.defineProperty(this.store, 'tabLeftEdge', {
			get: function(){ return this._tabLeftEdge; },
			set: function(val){
				if(this._tabLeftEdge != val){
					this._tabLeftEdge = val;
					self.setEdge(self.el.arrowLeft ,val);
				}
			}
		});
		Object.defineProperty(this.store, 'tabRightEdge', {
			get: function(){ return this._tabRightEdge; },
			set: function(val){
				if(this._tabRightEdge != val){
					this._tabRightEdge = val;
					self.setEdge(self.el.arrowRight ,val);
				}
			}
		});
		Object.defineProperty(this.store, 'tabLeftLimit', {
			get: function(){ return this._tabLeftLimit; },
			set: function(val){
				if(this._tabLeftLimit != val){
					this._tabLeftLimit = val;
					self.onLeftLimitChange(val);
				}
			}
		});
		
		this.clickTab = this.clickTab.bind(this);
		this.updateWidth = this.updateWidth.bind(this);
		
		window.addEventListener("resize",function(){
			this.store.containerWidth = container.scrollWidth;
		}.bind(this));
		this.store.containerWidth = container.scrollWidth;
		
		if(this.operation.urlResponse){
			var c1 = window.location.href.split("#")[1];
			c1 && this.store.candidate.push(c1);
			
			this.changeUrl = function(id){
				window.history.replaceState({}, "", window.location.href.split("#")[0] + "#" + id);
			};
		}
		
		container.dataset.init && this.store.candidate.push(container.dataset.init);
		
		var listWidth = this.store.tabList.reduce(this.compileTabListLi.bind(this), this.store.listWidth);
		this.updateWidth(listWidth);
		this.store.contentList.forEach(this.compileContent.bind(this));
		
		for(var i = 0, ln = this.store.candidate.length; i < ln; i++){
			if(this.store.map.hasOwnProperty(this.store.candidate[i])){
				this.switchTab(this.store.candidate[i], this.store.map[this.store.candidate[i]].tab);
				break;
			}
		}
		
		this.el.arrowLeft.addEventListener("click",function(){
			this.shiftTabList(1);
		}.bind(this));
		
		this.el.arrowRight.addEventListener("click",function(){
			this.shiftTabList(-1);
		}.bind(this));
		
		this.el.tabListContainer.addEventListener("touchstart",this.onTouchStart.bind(this));
		this.el.tabListContainer.addEventListener("touchmove",this.onTouchMove.bind(this));
		this.el.tabListContainer.addEventListener("touchend",this.onTouchEnd.bind(this));
		this.el.tabListContainer.addEventListener("touchcancel",this.onTouchEnd.bind(this));
		
		Object.defineProperty(this, 'name', {
			get: function(){
				return container.dataset.name;
			}
		});
		
		this.store.candidate = null;
	}
	
	TabItem.prototype.renderContainer = function(container){
		container.dataset.theme = container.dataset.theme || "light stress";
		
		var listWrapper = document.createElement("div");
		listWrapper.setAttribute("data-ltc-tab-list","");
		listWrapper.classList.add("ltc-tab-list-wrapper");
		
		var tabListContainer = document.createElement("ul");
		tabListContainer.classList.add("ltc-tab-list");
		
		var contentContainer = document.createElement("div");
		contentContainer.setAttribute("data-ltc-tab-content","");
		contentContainer.classList.add("ltc-tab-content-container");
		
		var tabList = [];
		var contentList = [];
		var _contentList = Array.prototype.slice.call(container.childNodes);
		
		_contentList.forEach(function(el){
			if(el.tagName != "DIV" || !el.hasAttribute("data-id") || !el.hasAttribute("data-title")){
				return;
			}
			
			var id = el.dataset.id;
			var _a = document.createElement("a");
			_a.dataset.id = id;
			_a.innerText = el.dataset.title;
			_a.href = "#" + id;
			
			var li = document.createElement("li");
			li.dataset.id = id;
			li.appendChild(_a);
			tabListContainer.appendChild(li);
			tabList.push(li);
			
			contentContainer.appendChild(el);
			contentList.push(el);
		});
		
		var arrowLeft = document.createElement("a");
		arrowLeft.classList.add("ltc-tab-arrow");
		arrowLeft.classList.add("left");
		var arrowRight = document.createElement("a");
		arrowRight.classList.add("ltc-tab-arrow");
		arrowRight.classList.add("right");
		
		var listContainer = document.createElement("div");
		listContainer.classList.add("ltc-tab-list-container");
		listContainer.appendChild(tabListContainer);
		listContainer.appendChild(arrowLeft);
		listContainer.appendChild(arrowRight);
		listWrapper.appendChild(listContainer);
		
		container.appendChild(listWrapper);
		container.appendChild(contentContainer);
		container.classList.add("ltc-tab");
		container.dataset.ltcRendered = "true";
		
		return {
			el:{
				tabListContainer : tabListContainer,
				arrowLeft : arrowLeft,
				arrowRight : arrowRight,
				contentContainer : contentContainer
			},
			list:{
				tabList : tabList,
				contentList : contentList
			}
		};
	};
    
    TabItem.prototype.defineOperation = function(dataset){
        var d_mouseOver = dataset.mouseOver;
        
        var mouseOver = false;
        var mouseOverDelay = -1;
        
        if(typeof d_mouseOver == "string"){
            if(/\d+/.test(d_mouseOver)){
                mouseOver = true;
                mouseOverDelay = parseInt(d_mouseOver);
            }else if(d_mouseOver == "true"){
                mouseOver = true;
            }
        }
        
        return {
            urlResponse : dataset.urlResponse == "true",
            mouseOver : mouseOver,
            mouseOverDelay : mouseOverDelay
        };
    };
	
	TabItem.prototype.compileTabListLi = function(preWidth, el){
		var marginRight = parseFloat(window.getComputedStyle(el, null).getPropertyValue("margin-right"));
		preWidth += el.offsetWidth + marginRight;
		var _a = el.querySelector("a");
		var id = _a.dataset.id;
		var o = this.store.map[id] || {};
		o.tab = el;
		this.store.map[id] = o;
		this.store.candidate && this.store.candidate.push(id);
		
		_a.addEventListener("click",this.clickEventListener.bind(this));
		
		if(this.operation.mouseOver){
			_a.addEventListener("mouseover",this.mouseOverEventListener.bind(this));
            if(this.operation.mouseOverDelay > -1){
                _a.addEventListener("mouseleave", this.mouseLeaveEventListener.bind(this));
            }
		}
		
		return preWidth;
	};
    
    TabItem.prototype.clickEventListener = function(e){
        if(this.store.mouseOverDelayTimerId != null) clearTimeout(this.store.mouseOverDelayTimerId);
        this.clickTab.apply(this,[e]);
    };
    
    TabItem.prototype.mouseOverEventListener = function(e){
        if(this.store.mouseOverDelayTimerId != null) clearTimeout(this.store.mouseOverDelayTimerId);
        if(this.operation.mouseOverDelay > -1){
            this.store.mouseOverDelayTimerId = setTimeout(function(){
                this.clickTab.apply(this, [e]);
            }.bind(this), this.operation.mouseOverDelay);
        }else{
            this.clickTab.apply(this,[e]);
        }
    };
    
    TabItem.prototype.mouseLeaveEventListener = function(e){
        if(this.store.mouseOverDelayTimerId != null) clearTimeout(this.store.mouseOverDelayTimerId);
    };
	
	TabItem.prototype.compileContent = function(el){
		var id = el.dataset.id;
		var o = this.store.map[id] || {};
		o.content = el;
		this.store.map[id] = o;
	};
	
	TabItem.prototype.calculateArrow = function(){
		return parseFloat(window.getComputedStyle(this.el.arrowLeft, null).getPropertyValue("width")) + parseFloat(window.getComputedStyle(this.el.arrowRight, null).getPropertyValue("width"));
	};
	
	TabItem.prototype.updateWidth = function(width){
		this.store.listWidth = width;
		this.store.tabWidth = width / this.store.tabList.length;
	};
	
	TabItem.prototype.clickTab = function(e){
		e.preventDefault();
		this.switchTab(e.target.dataset.id, e.target);
	};
	
	TabItem.prototype.switchTab = function(id, el){
		if(this.store.active != id){
			var oldActiveId = this.store.active;
			var oldActive = {};
			if(this.store.map.hasOwnProperty(oldActiveId)){
				oldActive = this.store.map[oldActiveId];
				oldActive.tab.classList.remove("selected");
				oldActive.content.classList.remove("selected");
			}else{
				nowActiveId = undefined;
			}
			
			var newActive = this.store.map[id];
			newActive.tab && newActive.tab.classList.add("selected");
			newActive.content && newActive.content.classList.add("selected");
			
			this.store.active = id;
			this.changeUrl(id);
			this.slideMiddle(el);
			this.publish(Tab.EVENT.SWITCH,[{
									id: id, 
									tab: newActive.tab, 
									content: newActive.content,
									preId: oldActiveId,
									preTab: oldActive.tab,
									preContent: oldActive.content
									}]);
		}
	};
	
	TabItem.prototype.slideMiddle = function(el){
		var oL = el.offsetLeft;
		var cL = (this.store.containerWidth - this.store.arrowWidth - el.offsetWidth) >> 1;
		this.preSetTabLeft(cL - oL);
	};
	
	TabItem.prototype.changeUrl = function(){};
	
	TabItem.prototype.checkWidth = function(){
		var listWidth = this.store.listWidth;
		var containerWidth = this.store.containerWidth;
		if((listWidth && containerWidth) && listWidth > containerWidth){
			this.store.isArrowShow = true;
		}else{
			this.store.isArrowShow = false;
		}
		
		this.store.tabLeftLimit = this.store.containerWidth - this.store.listWidth - this.store.arrowWidth + 2;
	};
	
	TabItem.prototype.changeArrowStauts = function(val){
		if(val) {
			this.el.container.classList.add("show-arrow");
			this.el.tabListContainer.style.marginLeft = ((this.store.arrowWidth >> 1) - 1) + "px";
		} else {
			this.el.container.classList.remove("show-arrow");
			this.el.tabListContainer.style.marginLeft = "0px";
			return;
		}

		var tabLeft = this.store.tabLeft;
		if(tabLeft >= 0) {
			this.store.tabLeftEdge = true;
		}else if(tabLeft <= this.tabLeftLimit){
			this.store.tabRightEdge = true;
		}
		
		setTimeout(function(){
			this.slideMiddle(this.store.map[this.store.active].tab);
		}.bind(this), 0);
	};
	
	TabItem.prototype.shiftTabList = function(direction){
		var preTabLeft = this.store.tabLeft + direction * this.store.tabWidth;
		this.preSetTabLeft(preTabLeft);
	};
	
	TabItem.prototype.preSetTabLeft = function(preTabLeft){
		var tabLeftEdge = false;
		var tabRightEdge = false;
		if(preTabLeft >= 0) {
			preTabLeft = 0;
			tabLeftEdge = true;
		}else if(preTabLeft <= this.store.tabLeftLimit){
			preTabLeft = this.store.tabLeftLimit;
			tabRightEdge = true;
		}
		this.store.tabLeft = preTabLeft;
		this.store.tabLeftEdge = tabLeftEdge;
		this.store.tabRightEdge = tabRightEdge;
	};
	
	TabItem.prototype.setTabLeft = function(val){
		this.el.tabListContainer.style.left = val + "px";
	};
	
	TabItem.prototype.setEdge = function(el, val){
		if(val == true) el.classList.add("edge");
		else el.classList.remove("edge");
	};
	
	TabItem.prototype.onLeftLimitChange = function(val){
		if(this.store.isArrowShow == false) return;
		
		if(this.store.tabLeft <= this.store.tabLeftLimit){
			this.store.tabLeft = this.store.tabLeftLimit;
			this.store.tabRightEdge = true;
			return;
		}
		
		if(this.store.tabRightEdge == true){
			this.store.tabLeft = val;
		}
	};
	
	TabItem.prototype.onTouchStart = function(e){
		var tabListContainer = this.el.tabListContainer;
		tabListContainer.style.setProperty("-webkit-transition", "none");
		tabListContainer.style.setProperty("transition", "none");
		this.store.tabListTouchPoint = e.targetTouches[0].clientX;
	};
	
	TabItem.prototype.onTouchMove = function(e){
		var p = e.targetTouches[0].clientX;
		var s = p - this.store.tabListTouchPoint;
		this.store.tabListTouchPoint = p;
		var tl = this.store.tabLeft + s;
		this.preSetTabLeft(tl);
	};
	
	TabItem.prototype.onTouchEnd = function(e){
		var tabListContainer = this.el.tabListContainer;
		tabListContainer.style.removeProperty("-webkit-transition");
		tabListContainer.style.removeProperty("transition");
	};
	/*
	TabItem.prototype.findPosition = function(target){
		var list = Array.prototype.slice.call(this.el.tabList.querySelectorAll("li"));
		return list.indexOf(target);
	};
	*/
	TabItem.prototype.publicMethod = function(){
		return {
			addTab : this.addTab.bind(this),
			removeTab : this.removeTab.bind(this),
			showTab : this.showTab.bind(this),
			hideTab : this.hideTab.bind(this),
			setActive : this.setActive.bind(this),
			setActiveById : this.setActiveById.bind(this),
			subscribe : this.subscribe,
			unsubscribe : this.unsubscribe
		}
	};
	
	TabItem.prototype.addTab = function(id, title, content, position){
		if(content == null || typeof content === "undefined"){
			content = document.createElement('div');
			content.dataset.id = id;
			content.dataset.title = title;
		}
		
		if(this.store.map.hasOwnProperty(id)){                             //當 id 重複時置換成新的 Tab
			var _tab = this.store.map[id].tab;
			_tab.querySelector("a").innerText = title;
			var _content = this.store.map[id].content;
			
			content.id = id;
			this.el.contentContainer.replaceChild(content, _content);
			this.store.map[id].content = content;
			
			if(typeof position === "number" && [].indexOf.call(this.el.tabListContainer.childNodes, _tab) != position){
				if(position < 0){
					this.el.tabListContainer.appendChild(_tab);
				}else{
					this.el.tabListContainer.insertBefore(_tab, (this.el.tabListContainer.childNodes[position] || null));
				}
			}
			
			this.publish(Tab.EVENT.ADD_ITEM,[{
				id: id,
				tab: _tab,
				content: content
			}]);
			
			return;
		}
		
		var aTag = document.createElement('a');
		aTag.href = "#" + id;
		aTag.dataset.id = id;
		aTag.innerText = title;
		
		var liTag = document.createElement('li');
		liTag.appendChild(aTag);
		
		if(typeof position !== "number" || position < 0){
			this.el.tabListContainer.appendChild(liTag);
		}else{
			this.el.tabListContainer.insertBefore(liTag, (this.el.tabListContainer.childNodes[position] || null));
		}
		this.store.tabList = Array.prototype.slice.call(this.el.tabListContainer.querySelectorAll("li"));
		this.updateWidth(this.store.listWidth + liTag.offsetWidth);
		content.id = id;
		this.el.contentContainer.appendChild(content);
		
		var o = {};
		o.tab = liTag;
		o.content = content;
		this.store.map[id] = o;
		aTag.addEventListener("click",this.clickTab);
		
		this.publish(Tab.EVENT.ADD_ITEM,[{
				id: id,
				tab: liTag,
				content: content
			}]);
	};
	
	TabItem.prototype.removeTabCore = function(id, keep){
		if(!this.store.map.hasOwnProperty(id)) return;
		var o = this.store.map[id];
		var pos = [].indexOf.call(this.store.tabList, o.tab);
		var activePos = -1;
		if(this.store.active == id){
			if(pos == this.store.tabList.length - 1){
				activePos = pos - 1;
			}else{
				activePos = pos;
			}
		}
		
		var listWidth = this.store.listWidth - o.tab.offsetWidth;
		this.el.tabListContainer.removeChild(o.tab);
		
		this.store.tabList = Array.prototype.slice.call(this.el.tabListContainer.querySelectorAll("li"));
		
		this.updateWidth(listWidth);
		this.el.contentContainer.removeChild(o.content);
		if(activePos > -1) this.setActive(activePos);
		
		var unActiveItem = this.store.unActiveItem;
		for(var k in unActiveItem){
			if(!unActiveItem.hasOwnProperty(k)) continue;
			if(unActiveItem[k].pos > pos){
				unActiveItem[k].pos -= 1;
			}
		}
		
		if(keep == true) {
			unActiveItem[id] = this.store.map[id];
			unActiveItem[id].pos = pos;
			this.store.unActiveItem = unActiveItem;
		}else{
			o.tab.querySelector("a").removeEventListener("click",this.clickTab);
		}
		
		delete this.store.map[id];
		
		this.publish((keep? Tab.EVENT.HIDE_ITEM : Tab.EVENT.REMOVE_ITEM),[{
			id: id,
			tab: o.tab,
			content: o.content
		}]);
		
		o = null;
	};
	
	TabItem.prototype.removeTab = function(id){
		this.removeTabCore(id, false);
	};
	
	TabItem.prototype.hideTab = function(id){
		this.removeTabCore(id, true);
	};
	
	TabItem.prototype.showTab = function(id){
		if(!this.store.unActiveItem.hasOwnProperty(id)) return;
		var o = this.store.unActiveItem[id];
		var _pos = o.pos;
		var _tab = o.tab;
		var _content = o.content;
		
		this.el.tabListContainer.insertBefore(_tab, (this.el.tabListContainer.childNodes[_pos] || null));
		this.store.tabList = Array.prototype.slice.call(this.el.tabListContainer.querySelectorAll("li"));
		this.updateWidth(this.store.listWidth + _tab.offsetWidth);
		this.el.contentContainer.appendChild(_content);
		
		this.store.map[id] = o;
		delete this.store.unActiveItem[id];
		
		this.publish(Tab.EVENT.SHOW_ITEM,[{
			id: id,
			tab: o.tab,
			content: o.content
		}]);
		
		o = null;
	};
	
	TabItem.prototype.setActive = function(index){
		var _tab = this.store.tabList[index];
        if(!_tab) {
            console.warn("This tab does not exist");
            return;
        }
		this.switchTab(_tab.querySelector("a").dataset.id ,_tab);
	};
	
	TabItem.prototype.setActiveById = function(id){
		var _tab = this.store.map[id].tab;
        if(!_tab) {
            console.warn("This tab does not exist");
            return;
        }
		this.switchTab(id ,_tab);
	};
	
    function domReady(fn){
        var readyState = document.readyState;
        if(readyState == "interactive" || readyState == "complete"){
            fn.call();
        }else{
            document.onreadystatechange = function () {
                if (document.readyState == "interactive") {
                    fn.call();
                }
            }
        }
    }
	
    function ObserverPattern(){
        var events = { any: [] };
        this.subscribe = function(type, fn, isPriority) {
            type = type || 'any';
            if (typeof events[type] === 'undefined') {
                events[type] = [];
            }
            if(isPriority == true) events[type].unshift(fn);
            else events[type].push(fn);
        };
        
        this.unsubscribe = function(type, fn) {
            var pubtype = type || 'any';
            if(!events.hasOwnProperty(pubtype)) return;
            var subscribers = events[pubtype];
            var i = subscribers.length;
            while(i--){
                if (subscribers[i] === fn) {
                    subscribers.splice(i,1);
                }
            }
            if(events[pubtype].length === 0) {
                events[pubtype] = null;
                delete events[pubtype];
            }
        };
        
        this.publish = function(type, publication) {
            var pubtype = type || 'any';
            var subscribers = events[pubtype];
            if(subscribers instanceof Array){
                subscribers.concat().reduce(function(proceed, subscriber){
                    if(proceed === false) return false;
                    return subscriber.apply(null, publication);
                }, true);
            }
        };
    }
	
    this.Tab = new Tab();
}).call(window);