/**
 * DropdownMenu.js
 * @author CKylinMC
 * @license MIT
 * @version 1.0.0
 */

class DropdownMenu {
    _element;
    _id;
    _hasOptions = false;
    _options = [{
        name: 'Sample option',
        event: (dropdown) => {
            alert('Hi!');
            dropdown.close();
        }
    }];
    constructor(bindingElement) {
        DropdownMgr.init();
        if (!(bindingElement instanceof HTMLElement)) {
            throw new Error('Can\'t initialize a dropdown menu with element that\'s not a HTMLElement.');
        } else {
            this._element = bindingElement;
            this._initElement();
            DropdownMgr.register(this);
        }
    }

    _generateId() {
        return 'dropdownmenu' + Math.floor(Math.random() * 10000000);
    }

    _initElement() {
        this._id = this._generateId();
        this._element.classList.add('dropdown-trigger');
        this._element.setAttribute('data-dropdown', this._id);
        this._element.onclick = event => DropdownMgr.eventHandler(event);
        this._element.setAttribute('data-dropdown-status', 'deactived');
    }

    registerOptions(...options) {
        options.forEach(option => {
            let o = {};
            o.name = option.name;
            o.event = option.event;
            if (this._hasOptions) {
                this._options.push(o);
            } else {
                this._options = [o];
                this._hasOptions = true;
            }
        })
    }

    resetState() {
        this._initElement();
    }

    open(event='') {
        if (this._element.getAttribute('data-dropdown-status') == "actived") return;
        this._element.setAttribute('data-dropdown-status', 'actived');
        let invisible = document.createElement('div');
        invisible.style.position = 'absolute';
        invisible.style.top = "-9999px";
        invisible.style.left = "-9999px";
        invisible.style.pointerEvents = "none";
        invisible.style.zIndex = -1000;
        invisible.style.opacity = 0;
        document.body.appendChild(invisible);
        let dropdownContainer = document.createElement('div');
        invisible.appendChild(dropdownContainer);
        dropdownContainer.classList.add('dropdown-container');
        dropdownContainer.setAttribute('data-dropdown-container', this._id);
        this._options.forEach((option, index) => {
            let name = option.name || "Option #" + index;
            let onclick = option.event instanceof Function ? option.event : () => this.close();
            let dom = document.createElement('li');
            dom.classList.add('dropdown-item');
            dom.innerHTML = name;
            dom.onclick = event => onclick(this, onclick);
            dropdownContainer.appendChild(dom);
        })
        dropdownContainer.style.top = this.getTopPosition(dropdownContainer,event) + "px";

        dropdownContainer.style.left = this.getLeftPosition(dropdownContainer,event) + "px";
        document.body.appendChild(dropdownContainer);
        dropdownContainer.style.animation = "dropdown-show .15s cubic-bezier(0.1, 0.79, 0.27, 0.93) forwards";
        invisible.remove();
    }

    isShowing() {
        return this._element.getAttribute('data-dropdown-status') == "actived";
    }

    close() {
        let matches = document.querySelectorAll("[data-dropdown-container=" + this._id + "]");
        if (matches) {
            [...matches].forEach(element => {
                element.style.animation = "dropdown-hide .15s cubic-bezier(0.1, 0.79, 0.27, 0.93) forwards";
                setTimeout(() => element.remove(), 200);

            })
        }
        this._element.setAttribute('data-dropdown-status', 'deactived');
    }

    getTopPosition(dropdown,event = '') {
        let elementTop = event instanceof Event?event.clientY : this._element.offsetTop + this._element.offsetHeight;
        if (elementTop + dropdown.offsetHeight < window.innerHeight) {
            return elementTop;
        }
        return this._element.offsetTop - dropdown.offsetHeight;
    }

    getLeftPosition(dropdown,event = '') {
        let elementLeft = event instanceof Event?event.clientX : this._element.offsetLeft + this._element.offsetWidth;
        if (elementLeft + dropdown.offsetWidth < window.innerWidth) {
            return elementLeft;
        }
        return elementLeft - dropdown.offsetWidth;
    }
    getId() {
        return this._id;
    }
}

var DropdownMgr = {
    inited: false,
    instances: [],
    init: () => {
        if (DropdownMgr.inited) return;
        DropdownMgr.instances = [];
        document.body.addEventListener('click', event => DropdownMgr.globalClickEventHandler(event));
        DropdownMgr.inited = true;
    },
    get: id => {
        let targetInstance;
        DropdownMgr.instances.forEach(instance => {
            if (instance.getId() == id) targetInstance = instance;
        })
        return targetInstance;
    },
    register: instance => {
        if (instance instanceof DropdownMenu) {
            if (DropdownMgr.get(instance.getId())) return;
            DropdownMgr.instances.push(instance);
        }
    },
    eventHandler: (event) => {
        let element;
        let availableElements = [...event.path].filter(e => {
            if ((!e) || (!e.classList)) return false;
            if (e.classList.contains('dropdown-trigger')) return true;
        });
        if (!availableElements) return;
        element = availableElements[0];
        // event.path.forEach(e => {
        //     if ((!e) || (!e.classList)) return;
        //     if(e.classList.contains('dropdown-trigger')) element = e.target;
        // })
        if (!element) return;
        let id = element.getAttribute('data-dropdown');
        if (!id) return;
        switch (element.getAttribute('data-dropdown-status')) {
            case 'deactived':
                DropdownMgr.get(id).open(event);
                break;
            case 'actived':
                DropdownMgr.get(id).close();
                break;
            default:
                DropdownMgr.get(id).resetState();
        }
    },
    globalClickEventHandler: event => {
        // 方案三：监测并关闭
        let availableElements = [...event.path].filter(e => {
            if ((!e) || (!e.classList)) return false;
            if (e.classList.contains('dropdown-trigger')) return true;
        });
        let currId = availableElements.length ? availableElements[0].getAttribute('data-dropdown') : 0;
        let showing = DropdownMgr.instances.filter(i => i.isShowing());
        if (!showing.length) return;
        showing.forEach(instance => {
            if(instance.getId()!=currId) instance.close()
        });
        event.preventDefault();

        // 方案二：仅关闭
        // DropdownMgr.instances.forEach(instance => {
        //     if (instance.isShowing()) {
        //         instance.close();
        //         event.preventDefault();
        //     }
        // })

        // 方案一：按下时关闭其他
        // let availableElements = [...event.path].filter(e => {
        //     if ((!e) || (!e.classList)) return false;
        //     if (e.classList.contains('dropdown-trigger')) return true;
        // });
        // if (!availableElements.length) {
        //     DropdownMgr.instances.forEach(instance => instance.close());
        // } else {
        //     let id = availableElements[0].getAttribute('data-dropdown');
        //     if (id) {
        //         DropdownMgr.instances.forEach(instance => {
        //             if (instance.getId() != id) instance.close()
        //         });
        //     } else {
        //         DropdownMgr.instances.forEach(instance => instance.close());
        //     }
        // }
    }
}