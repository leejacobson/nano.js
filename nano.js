const nanoEvent = {
    UUID: 0,
    add() {
        let UUID = this.UUID++;
        let myArgs = [...arguments];
        myArgs[2] = UUID;
        let event = new this._class(...myArgs);
        this._events[UUID] = event;
        return event;
    },
    removeByUUID(UUID) {
        delete this._events[UUID];
    },
    remove() {
        this.find(...arguments).forEach(evnt => this.removeByUUID(evnt.UUID));
    },
    find(type, fn) {
        let matchedEvents = Object.values(this._events).filter(evnt => {
            let typeArray = type.split('.');
            let eventType = typeArray[0];
            let namespace = typeArray[1];
            return (!eventType || eventType == evnt.eventType) && (!namespace || namespace == evnt.namespace);
        });
        if (typeof fn == 'function') matchedEvents = matchedEvents.filter(evnt => evnt.fn == fn);
        return matchedEvents;
    },
    _events: {},
    _class: class {
        constructor(eventType, fn, UUID) {
            let eventTypeArr = eventType.split('.');
            this.eventType = eventTypeArr[0];
            this.namespace = eventTypeArr[1];
            this.fn = fn;
            this.UUID = UUID;
            // Wrap the event handler so return false will result in e.preventDefault()
            this.handler = function(e) {
                if (fn.bind(this)(...arguments) === false) e.preventDefault();
            };
        }
    }
};

class Nano {
    constructor(el) {
        this.el = el;
        this.length = el.length;
        this.el.forEach((el, i) => {
            this[i] = el;
        });
    }

    attr(a, v = null) {
        if (!v && v != '') return this.getAttr(a);
        return this.each(function(i) {
            i.el[0].setAttribute(a, v);
        });
    }

    get(i) {
        if (!this.el[i]) return Nano([null]);
        return new Nano([this.el[i]]);
    }

    children(s) {
        let els = [];
        this.each(function(i) {
            els.push(Array.from(i.el[0].children).reduce(curEl => curEl.matches(s)));
        });
        return new Nano(els);
    }

    find(s) {
        return new Nano(this.el.reduce((a, c) => [...a, ...Array.from(c.querySelectorAll(s))], []));
    }

    filter(s) {
        return new Nano(this.el.filter(curEl => curEl.matches(s)));
    }

    matches(s) {
        return this.el.some(curEl => curEl.matches(s));
    }

    clone() {
        if (this.length == 0) return null;
        return this.el[0].outerHTML;
    }

    css(v) {
        return this.each(function(i) {
            i.el[0].style.cssText = i.el[0].style.cssText + v;
        });
    }

    style(v) {
        this.each(function(i) {
            for (var key in v) {
                if (!v[key]) return i.el[0].style.removeProperty(key);
                i.el[0].style[key] = v[key];
            }
        });
        return this;
    }

    data(a, v) {
        return this.attr('data-' + a, v);
    }

    each(fn) {
        let i = 0;
        this.el.forEach(e => {
            let _this = new Nano([e]);
            let boundfn = fn.bind(_this);
            boundfn(_this, i++);
        });
        return this;
    }

    getAttr(v) {
        if (this.length == 0) return null;
        return this.el[0].getAttribute(v);
    }

    removeAttr(v) {
        return this.each(function(i) {
            i.el[0].removeAttribute(v);
        });
    }

    animate(time, scale, rotate, rotateX, rotateY, translateX, translateY, skewX, skewY, opacity) {
        return this.each(function(i) {
            i.el[0].style.cssText = `${i.style.cssText}transition: all ${time}s ease-in-out;
                transform: scale(${scale}) rotate(${rotate}deg) rotateX(${rotateX}deg) rotateY(${rotateY}'deg) translate(${translateX}px, ${translateY}px) skew(${skewX}deg, ${skewY}deg);
                opacity: ${opacity};`;
        });
    }

    on(type, fn) {
        if (typeof type == 'string') type = [type];
        this.each(function(i) {
            type.forEach(thisType => {
                let event = nanoEvent.add(thisType, fn);
                i.el[0].addEventListener(event.eventType, event.handler, true);
            });
        });
        return this;
    }

    unbind(type, fn = null) {
        if (typeof type == 'string') type = [type];
        return this.each(function(i) {
            type.forEach(thisType => {
                let matchedEvents = nanoEvent.find(thisType, fn);
                matchedEvents.forEach(event => {
                    i.el[0].removeEventListener(event.eventType, event.handler, true);
                    nanoEvent.removeByUUID(event.UUID);
                });
            });
        });
    }

    trigger(type, params = {}) {
        return this.each(i => i.el[0].dispatchEvent(new CustomEvent(type, { detail: params })));
    }

    addClass(v) {
        var a = v.split(' ');
        return this.each(function(i) {
            for (var x = 0; x < a.length; x++) {
                if (i.el[0].classList) {
                    i.el[0].classList.add(a[x]);
                } else {
                    i.el[0].className += ' ' + a[x];
                }
            }
        });
    }

    toggleClass(v) {
        var a = v.split(' ');
        return this.each(function(i) {
            for (var x = 0; x < a.length; x++) {
                i.el[0].classList.toggle(a[x]);
            }
        });
    }

    remove() {
        return this.each(i => i.el[0].parentNode.removeChild(i.el[0]));
    }

    removeClass(v) {
        var a = v.split(' ');
        return this.each(function(i) {
            for (var x = 0; x < a.length; x++) {
                i.el[0].classList.remove(a[x]);
            }
        });
    }

    hasClass(c) {
        return this.el.some(el => el.classList.contains(c));
    }

    hide() {
        this.each(function(i) {
            i.attr('hidden', '');
            i.style({ display: 'none' });
        });
    }

    html(v) {
        if (!v && v !== '') return this.el[0].innerHTML;
        return this.each(function(i) {
            i.el[0].innerHTML = v;
        });
    }

    show() {
        return this.each(function(i) {
            i.removeAttr('hidden');
            i.style({ display: this.getDefaultValue('display') });
        });
    }

    text(v) {
        if (this.length == 0) return null;
        if (typeof v == 'undefined') return this.el[0].innerText || this.el[0].textContent;
        return this.each(function(i) {
            i.el[0].innerText = v;
            i.el[0].textContent = v;
        });
    }

    _insertAdjacent(v, position) {
        if (typeof v === 'object') {
            if (v instanceof Nano) v = v[0];
            return this.each(function(i) {
                i.el[0].insertAdjacentElement(position, v);
            });
        } else {
            return this.each(function(i) {
                i.el[0].insertAdjacentHTML(position, v);
            });
        }
    }

    insertBefore(v) {
        return this._insertAdjacent(v, 'beforeBegin');
    }

    insertAfter(v) {
        return this._insertAdjacent(v, 'afterEnd');
    }

    insertFirst(v) {
        return this._insertAdjacent(v, 'afterBegin');
    }

    insertLast(v) {
        return this._insertAdjacent(v, 'beforeEnd');
    }

    empty() {
        return this.each(function(i) {
            i.el[0].innerHTML = '';
        });
    }

    parent() {
        return new Nano([this.el[0].parentNode]);
    }

    is(t) {
        if (this.length == 0) return false;
        return this.el[0].tagName.toLowerCase() == t.toLowerCase();
    }

    log() {
        console.log(this);
    }

    value(val) {
        if (typeof val === 'undefined') return this.el[0].value;
        this.each(function(i) {
            i.el[0].value = val;
            i.el[0].dispatchEvent(new CustomEvent('input'));
        });
        return this;
    }

    focus() {
        if (this.length == 0) return this;
        this.el[0].focus();
        return this;
    }

    blur() {
        if (this.length == 0) return this;
        this.el[0].blur();
        return this;
    }

    ready(func) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            func();
            return this;
        }
        document.addEventListener(
            'DOMContentLoaded',
            () => {
                func();
            },
            false
        );
        return this;
    }

    getDefaultValue(style) {
        let temp = document.body.appendChild(document.createElement(this.el[0].tagName));
        let value = window.getComputedStyle(temp).getPropertyValue(style);
        temp.parentNode.removeChild(temp);
        return value;
    }
}

let nano = function(param) {
    let el = [];
    if (typeof param === 'string') {
        el = Array.from(document.querySelectorAll(param));
    } else if (Array.isArray(param)) {
        el = param;
    } else if (typeof param === 'object') {
        if (param instanceof HTMLElement || param instanceof Document || param instanceof Window) el = [param];
        else if (param instanceof Nano) el = param.el;
    } else if (typeof param === 'function') {
        el = [document];
        nano = new Nano(el);
        return nano.ready(param);
    }

    return new Nano(el);
};

nano.prototype = Nano.prototype;

export default nano;
