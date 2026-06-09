!(function (t, e) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = e())
    : "function" == typeof define && define.amd
      ? define(e)
      : ((t || self).Swup = e());
})(this, function () {
  const t = new WeakMap();
  function e(e, n, o, i) {
    if (!e && !t.has(n)) return !1;
    const r = t.get(n) ?? new WeakMap();
    t.set(n, r);
    const s = r.get(o) ?? new Set();
    r.set(o, s);
    const a = s.has(i);
    return (e ? s.add(i) : s.delete(i), a && e);
  }
  const n = (t, e) =>
      String(t)
        .toLowerCase()
        .replace(/[\s/_.]+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      e ||
      "",
    o = ({ hash: t } = {}) => window.location.pathname + window.location.search + (t ? window.location.hash : ""),
    i = (t = null, e = {}) => {
      t = t || o({ hash: !0 });
      const n = { ...(window.history.state || {}), url: t, random: Math.random(), source: "swup", ...e };
      window.history.replaceState(n, "", t);
    },
    r = (t, n, o, i) => {
      const r = new AbortController();
      return (
        (function (t, n, o, i = {}) {
          const { signal: r, base: s = document } = i;
          if (r?.aborted) return;
          const { once: a, ...c } = i,
            l = s instanceof Document ? s.documentElement : s,
            h = Boolean("object" == typeof i ? i.capture : i),
            u = (i) => {
              const r = (function (t, e) {
                let n = t.target;
                if (
                  (n instanceof Text && (n = n.parentElement), n instanceof Element && t.currentTarget instanceof Node)
                ) {
                  const o = n.closest(e);
                  if (o && t.currentTarget.contains(o)) return o;
                }
              })(i, String(t));
              if (r) {
                const t = Object.assign(i, { delegateTarget: r });
                (o.call(l, t), a && (l.removeEventListener(n, u, c), e(!1, l, o, d)));
              }
            },
            d = JSON.stringify({ selector: t, type: n, capture: h });
          (e(!0, l, o, d) || l.addEventListener(n, u, c),
            r?.addEventListener("abort", () => {
              e(!1, l, o, d);
            }));
        })(t, n, o, (i = { ...i, signal: r.signal })),
        { destroy: () => r.abort() }
      );
    };
  class s extends URL {
    constructor(t, e = document.baseURI) {
      (super(t.toString(), e), Object.setPrototypeOf(this, s.prototype));
    }
    get url() {
      return this.pathname + this.search;
    }
    static fromElement(t) {
      const e = t.getAttribute("href") || t.getAttribute("xlink:href") || "";
      return new s(e);
    }
    static fromUrl(t) {
      return new s(t);
    }
  }
  const a = function (t, e = {}) {
    try {
      const o = this;
      function n(n) {
        const { status: r, url: a } = u;
        return Promise.resolve(u.text()).then(function (n) {
          if (500 === r)
            throw (
              o.hooks.call("fetch:error", i, { status: r, response: u, url: a }),
              new c(`Server error: ${a}`, { status: r, url: a })
            );
          if (!n) throw new c(`Empty response: ${a}`, { status: r, url: a });
          const { url: l } = s.fromUrl(a),
            h = { url: l, html: n };
          return (!i.cache.write || (e.method && "GET" !== e.method) || t !== l || o.cache.set(h.url, h), h);
        });
      }
      t = s.fromUrl(t).url;
      const { visit: i = o.visit } = e,
        r = { ...o.options.requestHeaders, ...e.headers },
        a = e.timeout ?? o.options.timeout,
        l = new AbortController(),
        { signal: h } = l;
      e = { ...e, headers: r, signal: h };
      let u,
        d = !1,
        f = null;
      a &&
        a > 0 &&
        (f = setTimeout(() => {
          ((d = !0), l.abort("timeout"));
        }, a));
      const m = (function (n, r) {
        try {
          var s = Promise.resolve(
            o.hooks.call("fetch:request", i, { url: t, options: e }, (t, { url: e, options: n }) => fetch(e, n))
          ).then(function (t) {
            ((u = t), f && clearTimeout(f));
          });
        } catch (t) {
          return r(t);
        }
        return s && s.then ? s.then(void 0, r) : s;
      })(0, function (e) {
        if (d)
          throw (
            o.hooks.call("fetch:timeout", i, { url: t }),
            new c(`Request timed out: ${t}`, { url: t, timedOut: d })
          );
        if ("AbortError" === e?.name || h.aborted) throw new c(`Request aborted: ${t}`, { url: t, aborted: !0 });
        throw e;
      });
      return Promise.resolve(m && m.then ? m.then(n) : n());
    } catch (p) {
      return Promise.reject(p);
    }
  };
  class c extends Error {
    constructor(t, e) {
      (super(t),
        (this.url = void 0),
        (this.status = void 0),
        (this.aborted = void 0),
        (this.timedOut = void 0),
        (this.name = "FetchError"),
        (this.url = e.url),
        (this.status = e.status),
        (this.aborted = e.aborted || !1),
        (this.timedOut = e.timedOut || !1));
    }
  }
  class l {
    constructor(t) {
      ((this.swup = void 0), (this.pages = new Map()), (this.swup = t));
    }
    get size() {
      return this.pages.size;
    }
    get all() {
      const t = new Map();
      return (
        this.pages.forEach((e, n) => {
          t.set(n, { ...e });
        }),
        t
      );
    }
    has(t) {
      return this.pages.has(this.resolve(t));
    }
    get(t) {
      const e = this.pages.get(this.resolve(t));
      return e ? { ...e } : e;
    }
    set(t, e) {
      ((t = this.resolve(t)),
        (e = { ...e, url: t }),
        this.pages.set(t, e),
        this.swup.hooks.callSync("cache:set", void 0, { page: e }));
    }
    update(t, e) {
      t = this.resolve(t);
      const n = { ...this.get(t), ...e, url: t };
      this.pages.set(t, n);
    }
    delete(t) {
      this.pages.delete(this.resolve(t));
    }
    clear() {
      (this.pages.clear(), this.swup.hooks.callSync("cache:clear", void 0, void 0));
    }
    prune(t) {
      this.pages.forEach((e, n) => {
        t(n, e) && this.delete(n);
      });
    }
    resolve(t) {
      const { url: e } = s.fromUrl(t);
      return this.swup.resolveUrl(e);
    }
  }
  const h = (t, e = document) => e.querySelector(t),
    u = (t, e = document) => Array.from(e.querySelectorAll(t)),
    d = () =>
      new Promise((t) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            t();
          });
        });
      });
  function f(t) {
    return !!t && ("object" == typeof t || "function" == typeof t) && "function" == typeof t.then;
  }
  function m(t, e) {
    const n = t?.closest(`[${e}]`);
    return n?.hasAttribute(e) ? n?.getAttribute(e) || !0 : void 0;
  }
  class p {
    constructor(t) {
      ((this.swup = void 0),
        (this.swupClasses = ["to-", "is-changing", "is-rendering", "is-popstate", "is-animating", "is-leaving"]),
        (this.swup = t));
    }
    get selectors() {
      const { scope: t } = this.swup.visit.animation;
      return "containers" === t ? this.swup.visit.containers : "html" === t ? ["html"] : Array.isArray(t) ? t : [];
    }
    get selector() {
      return this.selectors.join(",");
    }
    get targets() {
      return this.selector.trim() ? u(this.selector) : [];
    }
    add() {
      this.targets.forEach((t) => t.classList.add(...[].slice.call(arguments)));
    }
    remove() {
      this.targets.forEach((t) => t.classList.remove(...[].slice.call(arguments)));
    }
    clear() {
      this.targets.forEach((t) => {
        const e = t.className.split(" ").filter((t) => this.isSwupClass(t));
        t.classList.remove(...e);
      });
    }
    isSwupClass(t) {
      return this.swupClasses.some((e) => t.startsWith(e));
    }
  }
  class v {
    constructor(t, e) {
      ((this.id = void 0),
        (this.state = void 0),
        (this.from = void 0),
        (this.to = void 0),
        (this.containers = void 0),
        (this.animation = void 0),
        (this.trigger = void 0),
        (this.cache = void 0),
        (this.history = void 0),
        (this.scroll = void 0),
        (this.meta = void 0));
      const { to: n, from: o, hash: i, el: r, event: s } = e;
      ((this.id = Math.random()),
        (this.state = 1),
        (this.from = { url: o ?? t.location.url, hash: t.location.hash }),
        (this.to = { url: n, hash: i }),
        (this.containers = t.options.containers),
        (this.animation = {
          animate: !0,
          wait: !1,
          name: void 0,
          native: t.options.native,
          scope: t.options.animationScope,
          selector: t.options.animationSelector,
        }),
        (this.trigger = { el: r, event: s }),
        (this.cache = { read: t.options.cache, write: t.options.cache }),
        (this.history = { action: "push", popstate: !1, direction: void 0 }),
        (this.scroll = { reset: !0, target: void 0 }),
        (this.meta = {}));
    }
    advance(t) {
      this.state < t && (this.state = t);
    }
    abort() {
      this.state = 8;
    }
    ignore() {
      this.state = 10;
    }
    get done() {
      return this.state >= 7;
    }
    get ignored() {
      return 10 === this.state;
    }
  }
  function g(t) {
    return new v(this, t);
  }
  const w =
    "undefined" != typeof Symbol ? Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator")) : "@@iterator";
  function y(t, e, n) {
    if (!t.s) {
      if (n instanceof k) {
        if (!n.s) return void (n.o = y.bind(null, t, e));
        (1 & e && (e = n.s), (n = n.v));
      }
      if (n && n.then) return void n.then(y.bind(null, t, e), y.bind(null, t, 2));
      ((t.s = e), (t.v = n));
      const o = t.o;
      o && o(t);
    }
  }
  const k = /*#__PURE__*/ (function () {
    function t() {}
    return (
      (t.prototype.then = function (e, n) {
        const o = new t(),
          i = this.s;
        if (i) {
          const t = 1 & i ? e : n;
          if (t) {
            try {
              y(o, 1, t(this.v));
            } catch (t) {
              y(o, 2, t);
            }
            return o;
          }
          return this;
        }
        return (
          (this.o = function (t) {
            try {
              const i = t.v;
              1 & t.s ? y(o, 1, e ? e(i) : i) : n ? y(o, 1, n(i)) : y(o, 2, i);
            } catch (t) {
              y(o, 2, t);
            }
          }),
          o
        );
      }),
      t
    );
  })();
  function P(t) {
    return t instanceof k && 1 & t.s;
  }
  class b {
    constructor(t) {
      ((this.swup = void 0),
        (this.registry = new Map()),
        (this.hooks = [
          "animation:out:start",
          "animation:out:await",
          "animation:out:end",
          "animation:in:start",
          "animation:in:await",
          "animation:in:end",
          "animation:skip",
          "cache:clear",
          "cache:set",
          "content:replace",
          "content:scroll",
          "enable",
          "disable",
          "fetch:request",
          "fetch:error",
          "fetch:timeout",
          "history:popstate",
          "link:click",
          "link:self",
          "link:anchor",
          "link:newtab",
          "page:load",
          "page:view",
          "scroll:top",
          "scroll:anchor",
          "visit:start",
          "visit:transition",
          "visit:abort",
          "visit:end",
        ]),
        (this.swup = t),
        this.init());
    }
    init() {
      this.hooks.forEach((t) => this.create(t));
    }
    create(t) {
      this.registry.has(t) || this.registry.set(t, new Map());
    }
    exists(t) {
      return this.registry.has(t);
    }
    get(t) {
      const e = this.registry.get(t);
      if (e) return e;
      console.error(`Unknown hook '${t}'`);
    }
    clear() {
      this.registry.forEach((t) => t.clear());
    }
    on(t, e, n = {}) {
      const o = this.get(t);
      if (!o) return (console.warn(`Hook '${t}' not found.`), () => {});
      const i = { ...n, id: o.size + 1, hook: t, handler: e };
      return (o.set(e, i), () => this.off(t, e));
    }
    before(t, e, n = {}) {
      return this.on(t, e, { ...n, before: !0 });
    }
    replace(t, e, n = {}) {
      return this.on(t, e, { ...n, replace: !0 });
    }
    once(t, e, n = {}) {
      return this.on(t, e, { ...n, once: !0 });
    }
    off(t, e) {
      const n = this.get(t);
      n && e ? n.delete(e) || console.warn(`Handler for hook '${t}' not found.`) : n && n.clear();
    }
    call(t, e, n, o) {
      try {
        const i = this,
          [r, s, a] = i.parseCallArgs(t, e, n, o),
          { before: c, handler: l, after: h } = i.getHandlers(t, a);
        return Promise.resolve(i.run(c, r, s)).then(function () {
          return Promise.resolve(i.run(l, r, s, !0)).then(function ([e]) {
            return Promise.resolve(i.run(h, r, s)).then(function () {
              return (i.dispatchDomEvent(t, r, s), e);
            });
          });
        });
      } catch (t) {
        return Promise.reject(t);
      }
    }
    callSync(t, e, n, o) {
      const [i, r, s] = this.parseCallArgs(t, e, n, o),
        { before: a, handler: c, after: l } = this.getHandlers(t, s);
      this.runSync(a, i, r);
      const [h] = this.runSync(c, i, r, !0);
      return (this.runSync(l, i, r), this.dispatchDomEvent(t, i, r), h);
    }
    parseCallArgs(t, e, n, o) {
      return e instanceof v || ("object" != typeof e && "function" != typeof n) ? [e, n, o] : [void 0, e, n];
    }
    run(t, e, n, o = !1) {
      try {
        let i;
        const r = this;
        void 0 === e && (e = r.swup.visit);
        const s = [],
          a = (function (t, e, n) {
            if ("function" == typeof t[w]) {
              var o,
                i,
                r,
                s = t[w]();
              if (
                ((function t(a) {
                  try {
                    for (; !((o = s.next()).done || (n && n())); )
                      if ((a = e(o.value)) && a.then) {
                        if (!P(a)) return void a.then(t, r || (r = y.bind(null, (i = new k()), 2)));
                        a = a.v;
                      }
                    i ? y(i, 1, a) : (i = a);
                  } catch (t) {
                    y(i || (i = new k()), 2, t);
                  }
                })(),
                s.return)
              ) {
                var a = function (t) {
                  try {
                    o.done || s.return();
                  } catch (t) {}
                  return t;
                };
                if (i && i.then)
                  return i.then(a, function (t) {
                    throw a(t);
                  });
                a();
              }
              return i;
            }
            if (!("length" in t)) throw new TypeError("Object is not iterable");
            for (var c = [], l = 0; l < t.length; l++) c.push(t[l]);
            return (function (t, e, n) {
              var o,
                i,
                r = -1;
              return (
                (function s(a) {
                  try {
                    for (; ++r < t.length && (!n || !n()); )
                      if ((a = e(r)) && a.then) {
                        if (!P(a)) return void a.then(s, i || (i = y.bind(null, (o = new k()), 2)));
                        a = a.v;
                      }
                    o ? y(o, 1, a) : (o = a);
                  } catch (t) {
                    y(o || (o = new k()), 2, t);
                  }
                })(),
                o
              );
            })(
              c,
              function (t) {
                return e(c[t]);
              },
              n
            );
          })(
            t,
            function ({ hook: t, handler: i, defaultHandler: a, once: c }) {
              if (!e?.done)
                return (
                  c && r.off(t, i),
                  (function (t, o) {
                    try {
                      var r = Promise.resolve(
                        (function (t, e = []) {
                          return new Promise((n, o) => {
                            const i = t(...e);
                            f(i) ? i.then(n, o) : n(i);
                          });
                        })(i, [e, n, a])
                      ).then(function (t) {
                        s.push(t);
                      });
                    } catch (t) {
                      return o(t);
                    }
                    return r && r.then ? r.then(void 0, o) : r;
                  })(0, function (e) {
                    if (o) throw e;
                    console.error(`Error in hook '${t}':`, e);
                  })
                );
            },
            function () {
              return i;
            }
          );
        return Promise.resolve(
          a && a.then
            ? a.then(function (t) {
                return i ? t : s;
              })
            : i
              ? a
              : s
        );
      } catch (t) {
        return Promise.reject(t);
      }
    }
    runSync(t, e = this.swup.visit, n, o = !1) {
      const i = [];
      for (const { hook: r, handler: s, defaultHandler: a, once: c } of t)
        if (!e?.done) {
          c && this.off(r, s);
          try {
            const t = s(e, n, a);
            (i.push(t), f(t) && console.warn(`Swup will not await Promises in handler for synchronous hook '${r}'.`));
          } catch (t) {
            if (o) throw t;
            console.error(`Error in hook '${r}':`, t);
          }
        }
      return i;
    }
    getHandlers(t, e) {
      const n = this.get(t);
      if (!n) return { found: !1, before: [], handler: [], after: [], replaced: !1 };
      const o = Array.from(n.values()),
        i = this.sortRegistrations,
        r = o.filter(({ before: t, replace: e }) => t && !e).sort(i),
        s = o
          .filter(({ replace: t }) => t)
          .filter((t) => !0)
          .sort(i),
        a = o.filter(({ before: t, replace: e }) => !t && !e).sort(i),
        c = s.length > 0;
      let l = [];
      if (e && ((l = [{ id: 0, hook: t, handler: e }]), c)) {
        const n = s.length - 1,
          { handler: o, once: i } = s[n],
          r = (t) => {
            const n = s[t - 1];
            return n ? (e, o) => n.handler(e, o, r(t - 1)) : e;
          };
        l = [{ id: 0, hook: t, once: i, handler: o, defaultHandler: r(n) }];
      }
      return { found: !0, before: r, handler: l, after: a, replaced: c };
    }
    sortRegistrations(t, e) {
      return (t.priority ?? 0) - (e.priority ?? 0) || t.id - e.id || 0;
    }
    dispatchDomEvent(t, e, n) {
      if (e?.done) return;
      const o = { hook: t, args: n, visit: e || this.swup.visit };
      (document.dispatchEvent(new CustomEvent("swup:any", { detail: o, bubbles: !0 })),
        document.dispatchEvent(new CustomEvent(`swup:${t}`, { detail: o, bubbles: !0 })));
    }
    parseName(t) {
      const [e, ...n] = t.split(".");
      return [e, n.reduce((t, e) => ({ ...t, [e]: !0 }), {})];
    }
  }
  const S = (t) => {
      if ((t && "#" === t.charAt(0) && (t = t.substring(1)), !t)) return null;
      const e = decodeURIComponent(t);
      let n =
        document.getElementById(t) ||
        document.getElementById(e) ||
        h(`a[name='${CSS.escape(t)}']`) ||
        h(`a[name='${CSS.escape(e)}']`);
      return (n || "top" !== t || (n = document.body), n);
    },
    E = function ({ selector: t, elements: e }) {
      try {
        if (!1 === t && !e) return Promise.resolve();
        let n = [];
        if (e) n = Array.from(e);
        else if (t && ((n = u(t, document.body)), !n.length))
          return (console.warn(`[swup] No elements found matching animationSelector \`${t}\``), Promise.resolve());
        const o = n
          .map((t) =>
            (function (t) {
              const {
                type: e,
                timeout: n,
                propCount: o,
              } = (function (t) {
                const e = window.getComputedStyle(t),
                  n = x(e, `${C}Delay`),
                  o = x(e, `${C}Duration`),
                  i = $(n, o),
                  r = x(e, `${U}Delay`),
                  s = x(e, `${U}Duration`),
                  a = $(r, s),
                  c = Math.max(i, a),
                  l = c > 0 ? (i > a ? C : U) : null;
                return { type: l, timeout: c, propCount: l ? (l === C ? o.length : s.length) : 0 };
              })(t);
              return (
                !(!e || !n) &&
                new Promise((i) => {
                  const r = `${e}end`,
                    s = performance.now();
                  let a = 0;
                  const c = () => {
                      (t.removeEventListener(r, l), i());
                    },
                    l = (e) => {
                      e.target === t && ((performance.now() - s) / 1e3 < e.elapsedTime || (++a >= o && c()));
                    };
                  (setTimeout(() => {
                    a < o && c();
                  }, n + 1),
                    t.addEventListener(r, l));
                })
              );
            })(t)
          )
          .filter((t) => !1 !== t);
        return o.length
          ? Promise.resolve(Promise.all(o)).then(function () {})
          : (t && console.warn(`[swup] No CSS animation duration defined on elements matching \`${t}\``),
            Promise.resolve());
      } catch (t) {
        return Promise.reject(t);
      }
    },
    C = "transition",
    U = "animation";
  function x(t, e) {
    return (t[e] || "").split(", ");
  }
  function $(t, e) {
    for (; t.length < e.length; ) t = t.concat(t);
    return Math.max(...e.map((e, n) => A(e) + A(t[n])));
  }
  function A(t) {
    return 1e3 * parseFloat(t);
  }
  const H = function (t, e = {}) {
    try {
      let a;
      const c = this;
      function r(r) {
        if (a) return r;
        ((c.navigating = !0), (c.visit = t));
        const { el: l } = t.trigger;
        ((e.referrer = e.referrer || c.location.url),
          !1 === e.animate && (t.animation.animate = !1),
          t.animation.animate || c.classes.clear());
        const h = e.history || m(l, "data-swup-history");
        "string" == typeof h && ["push", "replace"].includes(h) && (t.history.action = h);
        const u = e.animation || m(l, "data-swup-animation");
        return (
          "string" == typeof u && (t.animation.name = u),
          (t.meta = e.meta || {}),
          "object" == typeof e.cache
            ? ((t.cache.read = e.cache.read ?? t.cache.read), (t.cache.write = e.cache.write ?? t.cache.write))
            : void 0 !== e.cache && (t.cache = { read: !!e.cache, write: !!e.cache }),
          delete e.cache,
          (function (r, a) {
            try {
              var l = (function (r, a) {
                try {
                  var l = Promise.resolve(c.hooks.call("visit:start", t, void 0)).then(function () {
                    function r() {
                      if (t.ignored) throw new Error(`Visit to ${t.to.url} manually ignored`);
                      if (!t.done)
                        return Promise.resolve(
                          c.hooks.call("visit:transition", t, void 0, function () {
                            try {
                              let n;
                              function e(e) {
                                return n
                                  ? e
                                  : (t.advance(4),
                                    Promise.resolve(c.animatePageOut(t)).then(function () {
                                      function e() {
                                        return Promise.resolve(c.animatePageIn(t)).then(function () {});
                                      }
                                      const n = (function () {
                                        if (t.animation.native && document.startViewTransition)
                                          return Promise.resolve(
                                            document.startViewTransition(function () {
                                              try {
                                                const e = c.renderPage;
                                                return Promise.resolve(a).then(function (n) {
                                                  return Promise.resolve(e.call(c, t, n));
                                                });
                                              } catch (t) {
                                                return Promise.reject(t);
                                              }
                                            }).finished
                                          ).then(function () {});
                                        {
                                          const e = c.renderPage;
                                          return Promise.resolve(a).then(function (n) {
                                            return Promise.resolve(e.call(c, t, n)).then(function () {});
                                          });
                                        }
                                      })();
                                      return n && n.then ? n.then(e) : e();
                                    }));
                              }
                              const o = (function () {
                                if (!t.animation.animate)
                                  return Promise.resolve(c.hooks.call("animation:skip", void 0)).then(function () {
                                    const e = c.renderPage;
                                    return Promise.resolve(a).then(function (o) {
                                      return Promise.resolve(e.call(c, t, o)).then(function () {
                                        n = 1;
                                      });
                                    });
                                  });
                              })();
                              return Promise.resolve(o && o.then ? o.then(e) : e(o));
                            } catch (i) {
                              return Promise.reject(i);
                            }
                          })
                        ).then(function () {
                          if (!t.done)
                            return Promise.resolve(c.hooks.call("visit:end", t, void 0, () => c.classes.clear())).then(
                              function () {
                                ((t.state = 7),
                                  (c.navigating = !1),
                                  c.onVisitEnd && (c.onVisitEnd(), (c.onVisitEnd = void 0)));
                              }
                            );
                        });
                    }
                    t.state = 3;
                    const a = c.hooks.call("page:load", t, { options: e }, function (t, e) {
                      try {
                        function n(t) {
                          return ((e.page = t), (e.cache = !!o), e.page);
                        }
                        let o;
                        return (
                          t.cache.read && (o = c.cache.get(t.to.url)),
                          Promise.resolve(o ? n(o) : Promise.resolve(c.fetchPage(t.to.url, e.options)).then(n))
                        );
                      } catch (i) {
                        return Promise.reject(i);
                      }
                    });
                    a.then(({ html: e }) => {
                      (t.advance(5),
                        (t.to.html = e),
                        (t.to.document = new DOMParser().parseFromString(e, "text/html")));
                    });
                    const l = t.to.url + t.to.hash;
                    (t.history.popstate ||
                      ("replace" === t.history.action || t.to.url === c.location.url
                        ? i(l)
                        : (c.currentHistoryIndex++,
                          ((t, e = {}) => {
                            const n = { url: (t = t || o({ hash: !0 })), random: Math.random(), source: "swup", ...e };
                            window.history.pushState(n, "", t);
                          })(l, { index: c.currentHistoryIndex }))),
                      (c.location = s.fromUrl(l)),
                      t.history.popstate && c.classes.add("is-popstate"),
                      t.animation.name && c.classes.add(`to-${n(t.animation.name)}`));
                    const h = (function () {
                      if (t.animation.wait) return Promise.resolve(a).then(function () {});
                    })();
                    return h && h.then ? h.then(r) : r();
                  });
                } catch (t) {
                  return a(t);
                }
                return l && l.then ? l.then(void 0, a) : l;
              })(0, function (e) {
                e && !e?.aborted
                  ? (t.advance(9),
                    console.error(e),
                    (c.options.skipPopStateHandling = () => (window.location.assign(t.to.url + t.to.hash), !0)),
                    window.history.back())
                  : t.advance(8);
              });
            } catch (t) {
              return a(!0, t);
            }
            return l && l.then ? l.then(a.bind(null, !1), a.bind(null, !0)) : a(!1, l);
          })(0, function (e, n) {
            if ((delete t.to.document, e)) throw n;
            return n;
          })
        );
      }
      const l = (function () {
        if (c.navigating)
          return (function () {
            if (!(c.visit.state >= 6))
              return Promise.resolve(c.hooks.call("visit:abort", c.visit, void 0)).then(function () {
                (delete c.visit.to.document, (c.visit.state = 8));
              });
            ((t.state = 2), (c.onVisitEnd = () => c.performNavigation(t, e)), (a = 1));
          })();
      })();
      return Promise.resolve(l && l.then ? l.then(r) : r(l));
    } catch (h) {
      return Promise.reject(h);
    }
  };
  function T(t, e = {}, n = {}) {
    if ("string" != typeof t) throw new Error("swup.navigate() requires a URL parameter");
    if (this.shouldIgnoreVisit(t, { el: n.el, event: n.event })) return void window.location.assign(t);
    const { url: o, hash: i } = s.fromUrl(t),
      r = this.createVisit({ ...n, to: o, hash: i });
    this.performNavigation(r, e);
  }
  const j = function (t) {
      try {
        const e = this;
        return Promise.resolve(
          e.hooks.call("animation:out:start", t, void 0, () => {
            e.classes.add("is-changing", "is-animating", "is-leaving");
          })
        ).then(function () {
          return Promise.resolve(
            e.hooks.call("animation:out:await", t, { skip: !1 }, (t, { skip: n }) => {
              if (!n) return e.awaitAnimations({ selector: t.animation.selector });
            })
          ).then(function () {
            return Promise.resolve(e.hooks.call("animation:out:end", t, void 0)).then(function () {});
          });
        });
      } catch (t) {
        return Promise.reject(t);
      }
    },
    L = function (t) {
      const e = t.to.document;
      if (!e) return !1;
      const n = e.querySelector("title")?.innerText || "";
      document.title = n;
      const o = u('[data-swup-persist]:not([data-swup-persist=""])'),
        i = t.containers
          .map((t) => {
            const n = document.querySelector(t),
              o = e.querySelector(t);
            return n && o
              ? (n.replaceWith(o.cloneNode(!0)), !0)
              : (n || console.warn(`[swup] Container missing in current document: ${t}`),
                o || console.warn(`[swup] Container missing in incoming document: ${t}`),
                !1);
          })
          .filter(Boolean);
      return (
        o.forEach((t) => {
          const e = t.getAttribute("data-swup-persist"),
            n = h(`[data-swup-persist="${e}"]`);
          n && n !== t && n.replaceWith(t);
        }),
        i.length === t.containers.length
      );
    },
    V = function (t) {
      const e = { behavior: "auto" },
        { target: n, reset: o } = t.scroll,
        i = n ?? t.to.hash;
      let r = !1;
      return (
        i &&
          (r = this.hooks.callSync("scroll:anchor", t, { hash: i, options: e }, (t, { hash: e, options: n }) => {
            const o = this.getAnchorElement(e);
            return (o && o.scrollIntoView(n), !!o);
          })),
        o &&
          !r &&
          (r = this.hooks.callSync(
            "scroll:top",
            t,
            { options: e },
            (t, { options: e }) => (window.scrollTo({ top: 0, left: 0, ...e }), !0)
          )),
        r
      );
    },
    I = function (t) {
      try {
        const e = this;
        if (t.done) return Promise.resolve();
        const n = e.hooks.call("animation:in:await", t, { skip: !1 }, (t, { skip: n }) => {
          if (!n) return e.awaitAnimations({ selector: t.animation.selector });
        });
        return Promise.resolve(d()).then(function () {
          return Promise.resolve(
            e.hooks.call("animation:in:start", t, void 0, () => {
              e.classes.remove("is-animating");
            })
          ).then(function () {
            return Promise.resolve(n).then(function () {
              return Promise.resolve(e.hooks.call("animation:in:end", t, void 0)).then(function () {});
            });
          });
        });
      } catch (t) {
        return Promise.reject(t);
      }
    },
    N = function (t, e) {
      try {
        const r = this;
        if (t.done) return Promise.resolve();
        t.advance(6);
        const { url: a } = e;
        return (
          r.isSameResolvedUrl(o(), a) ||
            (i(a), (r.location = s.fromUrl(a)), (t.to.url = r.location.url), (t.to.hash = r.location.hash)),
          Promise.resolve(
            r.hooks.call("content:replace", t, { page: e }, (t, {}) => {
              if (
                (r.classes.remove("is-leaving"),
                t.animation.animate && r.classes.add("is-rendering"),
                !r.replaceContent(t))
              )
                throw new Error("[swup] Container mismatch, aborting");
              t.animation.animate &&
                (r.classes.add("is-changing", "is-animating", "is-rendering"),
                t.animation.name && r.classes.add(`to-${n(t.animation.name)}`));
            })
          ).then(function () {
            return Promise.resolve(r.hooks.call("content:scroll", t, void 0, () => r.scrollToContent(t))).then(
              function () {
                return Promise.resolve(
                  r.hooks.call("page:view", t, { url: r.location.url, title: document.title })
                ).then(function () {});
              }
            );
          })
        );
      } catch (t) {
        return Promise.reject(t);
      }
    },
    q = function (t) {
      var e;
      if (((e = t), Boolean(e?.isSwupPlugin))) {
        if (((t.swup = this), !t._checkRequirements || t._checkRequirements()))
          return (t._beforeMount && t._beforeMount(), t.mount(), this.plugins.push(t), this.plugins);
      } else console.error("Not a swup plugin instance", t);
    };
  function R(t) {
    const e = this.findPlugin(t);
    if (e)
      return (
        e.unmount(),
        e._afterUnmount && e._afterUnmount(),
        (this.plugins = this.plugins.filter((t) => t !== e)),
        this.plugins
      );
    console.error("No such plugin", e);
  }
  function O(t) {
    return this.plugins.find((e) => ("string" == typeof t ? [`Swup${t}`, t].includes(e.name) : e === t));
  }
  function D(t) {
    if ("function" != typeof this.options.resolveUrl)
      return (console.warn("[swup] options.resolveUrl expects a callback function."), t);
    const e = this.options.resolveUrl(t);
    return e && "string" == typeof e
      ? e.startsWith("//") || e.startsWith("http")
        ? (console.warn("[swup] options.resolveUrl needs to return a relative url"), t)
        : e
      : (console.warn("[swup] options.resolveUrl needs to return a url"), t);
  }
  function M(t, e) {
    return this.resolveUrl(t) === this.resolveUrl(e);
  }
  const W = {
    animateHistoryBrowsing: !1,
    animationSelector: '[class*="transition-"]',
    animationScope: "html",
    cache: !0,
    containers: ["#swup"],
    hooks: {},
    ignoreVisit: (t, { el: e } = {}) => !!e?.closest("[data-no-swup]"),
    linkSelector: "a[href]",
    linkToSelf: "scroll",
    native: !1,
    plugins: [],
    resolveUrl: (t) => t,
    requestHeaders: { "X-Requested-With": "swup", Accept: "text/html, application/xhtml+xml" },
    skipPopStateHandling: (t) => "swup" !== t.state?.source,
    timeout: 0,
  };
  return class {
    get currentPageUrl() {
      return this.location.url;
    }
    constructor(t = {}) {
      ((this.version = "4.9.0"),
        (this.options = void 0),
        (this.defaults = W),
        (this.plugins = []),
        (this.visit = void 0),
        (this.cache = void 0),
        (this.hooks = void 0),
        (this.classes = void 0),
        (this.location = s.fromUrl(window.location.href)),
        (this.currentHistoryIndex = void 0),
        (this.clickDelegate = void 0),
        (this.navigating = !1),
        (this.onVisitEnd = void 0),
        (this.use = q),
        (this.unuse = R),
        (this.findPlugin = O),
        (this.log = () => {}),
        (this.navigate = T),
        (this.performNavigation = H),
        (this.createVisit = g),
        (this.delegateEvent = r),
        (this.fetchPage = a),
        (this.awaitAnimations = E),
        (this.renderPage = N),
        (this.replaceContent = L),
        (this.animatePageIn = I),
        (this.animatePageOut = j),
        (this.scrollToContent = V),
        (this.getAnchorElement = S),
        (this.getCurrentUrl = o),
        (this.resolveUrl = D),
        (this.isSameResolvedUrl = M),
        (this.options = { ...this.defaults, ...t }),
        (this.handleLinkClick = this.handleLinkClick.bind(this)),
        (this.handlePopState = this.handlePopState.bind(this)),
        (this.cache = new l(this)),
        (this.classes = new p(this)),
        (this.hooks = new b(this)),
        (this.visit = this.createVisit({ to: "" })),
        (this.currentHistoryIndex = window.history.state?.index ?? 1),
        this.enable());
    }
    enable() {
      try {
        const t = this,
          { linkSelector: e } = t.options;
        ((t.clickDelegate = t.delegateEvent(e, "click", t.handleLinkClick)),
          window.addEventListener("popstate", t.handlePopState),
          t.options.animateHistoryBrowsing && (window.history.scrollRestoration = "manual"),
          (t.options.native = t.options.native && !!document.startViewTransition),
          t.options.plugins.forEach((e) => t.use(e)));
        for (const [e, n] of Object.entries(t.options.hooks)) {
          const [o, i] = t.hooks.parseName(e);
          t.hooks.on(o, n, i);
        }
        return (
          "swup" !== window.history.state?.source && i(null, { index: t.currentHistoryIndex }),
          Promise.resolve(d()).then(function () {
            return Promise.resolve(
              t.hooks.call("enable", void 0, void 0, () => {
                const e = document.documentElement;
                (e.classList.add("swup-enabled"), e.classList.toggle("swup-native", t.options.native));
              })
            ).then(function () {});
          })
        );
      } catch (t) {
        return Promise.reject(t);
      }
    }
    destroy() {
      try {
        const t = this;
        return (
          t.clickDelegate.destroy(),
          window.removeEventListener("popstate", t.handlePopState),
          t.cache.clear(),
          t.options.plugins.forEach((e) => t.unuse(e)),
          Promise.resolve(
            t.hooks.call("disable", void 0, void 0, () => {
              const t = document.documentElement;
              (t.classList.remove("swup-enabled"), t.classList.remove("swup-native"));
            })
          ).then(function () {
            t.hooks.clear();
          })
        );
      } catch (t) {
        return Promise.reject(t);
      }
    }
    shouldIgnoreVisit(t, { el: e, event: n } = {}) {
      const { origin: o, url: i, hash: r } = s.fromUrl(t);
      return (
        o !== window.location.origin ||
        !(!e || !this.triggerWillOpenNewWindow(e)) ||
        !!this.options.ignoreVisit(i + r, { el: e, event: n })
      );
    }
    handleLinkClick(t) {
      const e = t.delegateTarget,
        { href: n, url: o, hash: r } = s.fromElement(e);
      if (this.shouldIgnoreVisit(n, { el: e, event: t })) return;
      if (this.navigating && o === this.visit.to.url) return void t.preventDefault();
      const a = this.createVisit({ to: o, hash: r, el: e, event: t });
      t.metaKey || t.ctrlKey || t.shiftKey || t.altKey
        ? this.hooks.callSync("link:newtab", a, { href: n })
        : 0 === t.button &&
          this.hooks.callSync("link:click", a, { el: e, event: t }, () => {
            const e = a.from.url ?? "";
            (t.preventDefault(),
              o && o !== e
                ? this.isSameResolvedUrl(o, e) || this.performNavigation(a)
                : r
                  ? this.hooks.callSync("link:anchor", a, { hash: r }, () => {
                      (i(o + r), this.scrollToContent(a));
                    })
                  : this.hooks.callSync("link:self", a, void 0, () => {
                      "navigate" === this.options.linkToSelf
                        ? this.performNavigation(a)
                        : (i(o), this.scrollToContent(a));
                    }));
          });
    }
    handlePopState(t) {
      const e = t.state?.url ?? window.location.href;
      if (this.options.skipPopStateHandling(t)) return;
      if (this.isSameResolvedUrl(o(), this.location.url)) return;
      const { url: n, hash: i } = s.fromUrl(e),
        r = this.createVisit({ to: n, hash: i, event: t });
      r.history.popstate = !0;
      const a = t.state?.index ?? 0;
      (a &&
        a !== this.currentHistoryIndex &&
        ((r.history.direction = a - this.currentHistoryIndex > 0 ? "forwards" : "backwards"),
        (this.currentHistoryIndex = a)),
        (r.animation.animate = !1),
        (r.scroll.reset = !1),
        (r.scroll.target = !1),
        this.options.animateHistoryBrowsing && ((r.animation.animate = !0), (r.scroll.reset = !0)),
        this.hooks.callSync("history:popstate", r, { event: t }, () => {
          this.performNavigation(r);
        }));
    }
    triggerWillOpenNewWindow(t) {
      return !!t.matches('[download], [target="_blank"]');
    }
  };
});
!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
      ? define(t)
      : ((e || self).SwupHeadPlugin = t());
})(this, function () {
  function e() {
    return (
      (e = Object.assign
        ? Object.assign.bind()
        : function (e) {
            for (var t = 1; t < arguments.length; t++) {
              var n = arguments[t];
              for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
          }),
      e.apply(this, arguments)
    );
  }
  const t = (e) =>
    String(e)
      .split(".")
      .map((e) => String(parseInt(e || "0", 10)))
      .concat(["0", "0"])
      .slice(0, 3)
      .join(".");
  class n {
    constructor() {
      ((this.isSwupPlugin = !0),
        (this.swup = void 0),
        (this.version = void 0),
        (this.requires = {}),
        (this.handlersToUnregister = []));
    }
    mount() {}
    unmount() {
      (this.handlersToUnregister.forEach((e) => e()), (this.handlersToUnregister = []));
    }
    _beforeMount() {
      if (!this.name) throw new Error("You must define a name of plugin when creating a class.");
    }
    _afterUnmount() {}
    _checkRequirements() {
      return (
        "object" != typeof this.requires ||
          Object.entries(this.requires).forEach(([e, n]) => {
            if (
              !(function (e, n, r) {
                const s = (function (e, t) {
                  var n;
                  if ("swup" === e) return null != (n = t.version) ? n : "";
                  {
                    var r;
                    const n = t.findPlugin(e);
                    return null != (r = null == n ? void 0 : n.version) ? r : "";
                  }
                })(e, r);
                return (
                  !!s &&
                  ((e, n) =>
                    n.every((n) => {
                      const [, r, s] = n.match(/^([\D]+)?(.*)$/) || [];
                      var o, i;
                      return ((e, t) => {
                        const n = {
                          "": (e) => 0 === e,
                          ">": (e) => e > 0,
                          ">=": (e) => e >= 0,
                          "<": (e) => e < 0,
                          "<=": (e) => e <= 0,
                        };
                        return (n[t] || n[""])(e);
                      })(
                        ((i = s), (o = t((o = e))), (i = t(i)), o.localeCompare(i, void 0, { numeric: !0 })),
                        r || ">="
                      );
                    }))(s, n)
                );
              })(e, (n = Array.isArray(n) ? n : [n]), this.swup)
            ) {
              const t = `${e} ${n.join(", ")}`;
              throw new Error(`Plugin version mismatch: ${this.name} requires ${t}`);
            }
          }),
        !0
      );
    }
    on(e, t, n = {}) {
      var r;
      t = !(r = t).name.startsWith("bound ") || r.hasOwnProperty("prototype") ? t.bind(this) : t;
      const s = this.swup.hooks.on(e, t, n);
      return (this.handlersToUnregister.push(s), s);
    }
    once(t, n, r = {}) {
      return this.on(t, n, e({}, r, { once: !0 }));
    }
    before(t, n, r = {}) {
      return this.on(t, n, e({}, r, { before: !0 }));
    }
    replace(t, n, r = {}) {
      return this.on(t, n, e({}, r, { replace: !0 }));
    }
    off(e, t) {
      return this.swup.hooks.off(e, t);
    }
  }
  function r(e) {
    return "title" !== e.localName && !e.matches("[data-swup-theme]");
  }
  function s(e, t) {
    return e.outerHTML === t.outerHTML;
  }
  function o(e, t) {
    void 0 === t && (t = []);
    const n = Array.from(e.attributes);
    return t.length
      ? n.filter((e) => {
          let { name: n } = e;
          return t.some((e) => (e instanceof RegExp ? e.test(n) : n === e));
        })
      : n;
  }
  function i(e) {
    return e.matches("link[rel=stylesheet][href]");
  }
  return class extends n {
    constructor(e) {
      (void 0 === e && (e = {}), super());
      const t = this;
      ((this.name = "SwupHeadPlugin"),
        (this.requires = { swup: ">=4.6" }),
        (this.defaults = {
          persistTags: !1,
          persistAssets: !1,
          awaitAssets: !1,
          attributes: ["lang", "dir"],
          timeout: 3e3,
        }),
        (this.options = void 0),
        (this.updateHead = function (e, n) {
          try {
            const { awaitAssets: n, attributes: u, timeout: a } = t.options,
              l = e.to.document,
              { removed: c, added: h } = (function (e, t, n) {
                let { shouldPersist: o = () => !1 } = void 0 === n ? {} : n;
                const i = Array.from(e.children),
                  u = Array.from(t.children),
                  a = ((l = i), u.reduce((e, t, n) => (l.some((e) => s(t, e)) || e.push({ el: t, index: n }), e), []));
                var l;
                const c = (function (e, t) {
                  return e.reduce((e, n) => (t.some((e) => s(n, e)) || e.push({ el: n }), e), []);
                })(i, u);
                c.reverse()
                  .filter((e) => {
                    let { el: t } = e;
                    return r(t);
                  })
                  .filter((e) => {
                    let { el: t } = e;
                    return !o(t);
                  })
                  .forEach((t) => {
                    let { el: n } = t;
                    return e.removeChild(n);
                  });
                const h = a
                  .filter((e) => {
                    let { el: t } = e;
                    return r(t);
                  })
                  .map((t) => {
                    let n = t.el.cloneNode(!0);
                    return (e.insertBefore(n, e.children[(t.index || 0) + 1] || null), { ...t, el: n });
                  });
                return {
                  removed: c.map((e) => {
                    let { el: t } = e;
                    return t;
                  }),
                  added: h.map((e) => {
                    let { el: t } = e;
                    return t;
                  }),
                };
              })(document.head, l.head, { shouldPersist: (e) => t.isPersistentTag(e) });
            (t.swup.log(`Removed ${c.length} / added ${h.length} tags in head`),
              u?.length &&
                (function (e, t, n) {
                  void 0 === n && (n = []);
                  const r = new Set();
                  for (const { name: s, value: i } of o(t, n)) (e.setAttribute(s, i), r.add(s));
                  for (const { name: t } of o(e, n)) r.has(t) || e.removeAttribute(t);
                })(document.documentElement, l.documentElement, u));
            const d = (function () {
              if (n) {
                const n =
                    (void 0 === (e = a) && (e = 0),
                    h.filter(i).map((t) =>
                      (function (e, t) {
                        let n;
                        void 0 === t && (t = 0);
                        const r = (t) => {
                          e.sheet ? t() : (n = setTimeout(() => r(t), 10));
                        };
                        return new Promise((s) => {
                          (r(() => s(e)),
                            t > 0 &&
                              setTimeout(() => {
                                (n && clearTimeout(n), s(e));
                              }, t));
                        });
                      })(t, e)
                    )),
                  r = (function () {
                    if (n.length)
                      return (
                        t.swup.log(`Waiting for ${n.length} assets to load`),
                        Promise.resolve(Promise.all(n)).then(function () {})
                      );
                  })();
                if (r && r.then) return r.then(function () {});
              }
              var e;
            })();
            return Promise.resolve(d && d.then ? d.then(function () {}) : void 0);
          } catch (e) {
            return Promise.reject(e);
          }
        }),
        (this.options = { ...this.defaults, ...e }),
        this.options.persistAssets &&
          !this.options.persistTags &&
          (this.options.persistTags = "link[rel=stylesheet], script[src], style"));
    }
    mount() {
      this.before("content:replace", this.updateHead);
    }
    isPersistentTag(e) {
      const { persistTags: t } = this.options;
      return "function" == typeof t ? t(e) : "string" == typeof t && t.length > 0 ? e.matches(t) : Boolean(t);
    }
  };
});
!(function (t, o) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = o())
    : "function" == typeof define && define.amd
      ? define(o)
      : ((t || self).SwupScrollPlugin = o());
})(this, function () {
  function t() {
    return (
      (t = Object.assign
        ? Object.assign.bind()
        : function (t) {
            for (var o = 1; o < arguments.length; o++) {
              var e = arguments[o];
              for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
            }
            return t;
          }),
      t.apply(this, arguments)
    );
  }
  const o = (t) =>
    String(t)
      .split(".")
      .map((t) => String(parseInt(t || "0", 10)))
      .concat(["0", "0"])
      .slice(0, 3)
      .join(".");
  class e {
    constructor() {
      ((this.isSwupPlugin = !0),
        (this.swup = void 0),
        (this.version = void 0),
        (this.requires = {}),
        (this.handlersToUnregister = []));
    }
    mount() {}
    unmount() {
      (this.handlersToUnregister.forEach((t) => t()), (this.handlersToUnregister = []));
    }
    _beforeMount() {
      if (!this.name) throw new Error("You must define a name of plugin when creating a class.");
    }
    _afterUnmount() {}
    _checkRequirements() {
      return (
        "object" != typeof this.requires ||
          Object.entries(this.requires).forEach(([t, e]) => {
            if (
              !(function (t, e, n) {
                const s = (function (t, o) {
                  var e;
                  if ("swup" === t) return null != (e = o.version) ? e : "";
                  {
                    var n;
                    const e = o.findPlugin(t);
                    return null != (n = null == e ? void 0 : e.version) ? n : "";
                  }
                })(t, n);
                return (
                  !!s &&
                  ((t, e) =>
                    e.every((e) => {
                      const [, n, s] = e.match(/^([\D]+)?(.*)$/) || [];
                      var r, i;
                      return ((t, o) => {
                        const e = {
                          "": (t) => 0 === t,
                          ">": (t) => t > 0,
                          ">=": (t) => t >= 0,
                          "<": (t) => t < 0,
                          "<=": (t) => t <= 0,
                        };
                        return (e[o] || e[""])(t);
                      })(
                        ((i = s), (r = o((r = t))), (i = o(i)), r.localeCompare(i, void 0, { numeric: !0 })),
                        n || ">="
                      );
                    }))(s, e)
                );
              })(t, (e = Array.isArray(e) ? e : [e]), this.swup)
            ) {
              const o = `${t} ${e.join(", ")}`;
              throw new Error(`Plugin version mismatch: ${this.name} requires ${o}`);
            }
          }),
        !0
      );
    }
    on(t, o, e = {}) {
      var n;
      o = !(n = o).name.startsWith("bound ") || n.hasOwnProperty("prototype") ? o.bind(this) : o;
      const s = this.swup.hooks.on(t, o, e);
      return (this.handlersToUnregister.push(s), s);
    }
    once(o, e, n = {}) {
      return this.on(o, e, t({}, n, { once: !0 }));
    }
    before(o, e, n = {}) {
      return this.on(o, e, t({}, n, { before: !0 }));
    }
    replace(o, e, n = {}) {
      return this.on(o, e, t({}, n, { replace: !0 }));
    }
    off(t, o) {
      return this.swup.hooks.off(t, o);
    }
  }
  const n = (t, o = document) => Array.from(o.querySelectorAll(t)),
    s = (t) => "object" == typeof t && null != t && 1 === t.nodeType,
    r = (t, o) => (!o || "hidden" !== t) && "visible" !== t && "clip" !== t,
    i = (t, o) => {
      if (t.clientHeight < t.scrollHeight || t.clientWidth < t.scrollWidth) {
        const e = getComputedStyle(t, null);
        return (
          r(e.overflowY, o) ||
          r(e.overflowX, o) ||
          ((t) => {
            const o = ((t) => {
              if (!t.ownerDocument || !t.ownerDocument.defaultView) return null;
              try {
                return t.ownerDocument.defaultView.frameElement;
              } catch (t) {
                return null;
              }
            })(t);
            return !!o && (o.clientHeight < t.scrollHeight || o.clientWidth < t.scrollWidth);
          })(t)
        );
      }
      return !1;
    },
    l = (t, o, e, n, s, r, i, l) =>
      (r < t && i > o) || (r > t && i < o)
        ? 0
        : (r <= t && l <= e) || (i >= o && l >= e)
          ? r - t - n
          : (i > o && l < e) || (r < t && l > e)
            ? i - o + s
            : 0,
    c = (t) => {
      const o = t.parentElement;
      return null == o ? t.getRootNode().host || null : o;
    };
  return class extends e {
    constructor(t = {}) {
      (super(),
        (this.name = "SwupScrollPlugin"),
        (this.requires = { swup: ">=4.2.0" }),
        (this.defaults = {
          doScrollingRightAway: !1,
          animateScroll: { betweenPages: !0, samePageWithHash: !0, samePage: !0 },
          getAnchorElement: void 0,
          offset: 0,
          scrollContainers: "[data-swup-scroll-container]",
          shouldResetScrollPosition: () => !0,
          markScrollTarget: !1,
          scrollFunction: void 0,
        }),
        (this.options = void 0),
        (this.cachedScrollPositions = {}),
        (this.previousScrollRestoration = void 0),
        (this.currentCacheKey = void 0),
        (this.getAnchorElement = (t = "") =>
          "function" == typeof this.options.getAnchorElement
            ? this.options.getAnchorElement(t)
            : this.swup.getAnchorElement(t)),
        (this.getOffset = (t, o, e) => {
          let n;
          return (
            (n = "function" == typeof this.options.offset ? this.options.offset(t, o, e) : this.options.offset),
            "object" == typeof n && "number" == typeof n.top && "number" == typeof n.left
              ? n
              : { top: parseInt(String(n ?? ""), 10) || 0, left: 0 }
          );
        }),
        (this.onBeforeLinkToSelf = (t) => {
          t.scroll.animate = this.shouldAnimate("samePage");
        }),
        (this.handleScrollToTop = (t) => (this.scrollTo({ top: 0, left: 0 }, t.scroll.animate), !0)),
        (this.onBeforeLinkToAnchor = (t) => {
          t.scroll.animate = this.shouldAnimate("samePageWithHash");
        }),
        (this.handleScrollToAnchor = (t, { hash: o }) => this.maybeScrollToAnchor(o, t.scroll.animate)),
        (this.onBeforeVisitStart = (t) => {
          ((t.scroll.scrolledToContent = !1), (t.scroll.animate = this.shouldAnimate("betweenPages")));
        }),
        (this.onVisitStart = (t) => {
          (this.cacheScrollPositions(t.from.url),
            this.maybeResetScrollPositions(t),
            t.scroll.animate &&
              this.options.doScrollingRightAway &&
              !(t.scroll.target ?? t.to.hash) &&
              this.doScrollingBetweenPages(t));
        }),
        (this.handleScrollToContent = (t) => {
          (t.scroll.scrolledToContent || this.doScrollingBetweenPages(t), this.restoreScrollContainers(t.to.url));
        }),
        (this.doScrollingBetweenPages = (t) => {
          if (t.history.popstate && !t.animation.animate) return;
          const o = t.scroll.target ?? t.to.hash;
          if (o && this.maybeScrollToAnchor(o, t.scroll.animate)) return;
          if (!t.scroll.reset) return;
          const e = this.getCachedScrollPositions(t.to.url),
            { top: n = 0, left: s = 0 } = e?.window || { top: 0, left: 0 };
          (requestAnimationFrame(() => this.scrollTo({ top: n, left: s }, t.scroll.animate)),
            (t.scroll.scrolledToContent = !0));
        }),
        (this.maybeResetScrollPositions = (t) => {
          const { popstate: o } = t.history,
            { url: e } = t.to,
            { el: n } = t.trigger;
          o || (n && !this.options.shouldResetScrollPosition(n)) || this.resetScrollPositions(e);
        }),
        (this.options = { ...this.defaults, ...t }));
    }
    mount() {
      const t = this.swup;
      (t.hooks.create("scroll:start"),
        t.hooks.create("scroll:end"),
        (t.scrollTo = this.scrollTo.bind(this)),
        (this.previousScrollRestoration = window.history.scrollRestoration),
        t.options.animateHistoryBrowsing && (window.history.scrollRestoration = "manual"),
        (this.updateScrollTarget = this.updateScrollTarget.bind(this)),
        this.options.markScrollTarget &&
          (window.addEventListener("popstate", this.updateScrollTarget),
          window.addEventListener("hashchange", this.updateScrollTarget),
          this.on("page:view", this.updateScrollTarget),
          this.on("link:anchor", this.updateScrollTarget),
          this.on("link:self", this.updateScrollTarget),
          this.updateScrollTarget()),
        this.before("visit:start", this.onBeforeVisitStart, { priority: -1 }),
        this.on("visit:start", this.onVisitStart, { priority: 1 }),
        this.replace("content:scroll", this.handleScrollToContent),
        this.before("link:self", this.onBeforeLinkToSelf, { priority: -1 }),
        this.replace("scroll:top", this.handleScrollToTop),
        this.before("link:anchor", this.onBeforeLinkToAnchor, { priority: -1 }),
        this.replace("scroll:anchor", this.handleScrollToAnchor));
    }
    unmount() {
      (super.unmount(),
        this.previousScrollRestoration && (window.history.scrollRestoration = this.previousScrollRestoration),
        window.removeEventListener("popstate", this.updateScrollTarget),
        window.removeEventListener("hashchange", this.updateScrollTarget),
        (this.cachedScrollPositions = {}),
        delete this.swup.scrollTo);
    }
    shouldAnimate(t) {
      return "boolean" == typeof this.options.animateScroll
        ? this.options.animateScroll
        : this.options.animateScroll[t];
    }
    maybeScrollToAnchor(t, o = !1) {
      if (!t) return !1;
      const e = this.getAnchorElement(t);
      return e
        ? e instanceof Element
          ? (this.scrollElementIntoView(e, o), !0)
          : (console.warn(`Anchor target ${t} is not a DOM node`), !1)
        : (console.warn(`Anchor target ${t} not found`), !1);
    }
    cacheScrollPositions(t) {
      const o = this.swup.resolveUrl(t),
        e = n(this.options.scrollContainers).map((t) => ({ top: t.scrollTop, left: t.scrollLeft })),
        s = { window: { top: window.scrollY, left: window.scrollX }, containers: e };
      this.cachedScrollPositions[o] = s;
    }
    resetScrollPositions(t) {
      const o = this.swup.resolveUrl(t);
      delete this.cachedScrollPositions[o];
    }
    getCachedScrollPositions(t) {
      const o = this.swup.resolveUrl(t);
      return this.cachedScrollPositions[o];
    }
    restoreScrollContainers(t) {
      const o = this.getCachedScrollPositions(t);
      o &&
        0 !== o.containers.length &&
        n(this.options.scrollContainers).forEach((t, e) => {
          const n = o.containers[e];
          null != n && ((t.scrollTop = n.top), (t.scrollLeft = n.left));
        });
    }
    updateScrollTarget() {
      const { hash: t } = window.location,
        o = document.querySelector("[data-swup-scroll-target]");
      let e = this.getAnchorElement(t);
      (e instanceof HTMLBodyElement && (e = null),
        o !== e && (o?.removeAttribute("data-swup-scroll-target"), e?.setAttribute("data-swup-scroll-target", "")));
    }
    getRootScrollContainer() {
      return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : document.documentElement;
    }
    scrollTo(t, o = !0, e) {
      const n = this.swup.createVisit({ to: this.swup.location.url }),
        { top: s = 0, left: r = 0 } = "number" == typeof t ? { top: t } : t;
      ((e ??= this.getRootScrollContainer()),
        (this.options.scrollFunction ?? this.applyScroll)(
          e,
          s,
          r,
          o,
          () => this.swup.hooks.callSync("scroll:start", n, void 0),
          () => this.swup.hooks.callSync("scroll:end", n, void 0)
        ));
    }
    applyScroll(t, o, e, n, s, r) {
      const i = t instanceof HTMLHtmlElement || t instanceof HTMLBodyElement ? window : t;
      (s(),
        i.addEventListener("scrollend", r, { once: !0 }),
        i.addEventListener(
          "wheel",
          () => {
            t.scrollTo({ top: t.scrollTop, left: t.scrollLeft, behavior: "instant" });
          },
          { once: !0 }
        ),
        t.scrollTo({ top: o, left: e, behavior: n ? "smooth" : "instant" }));
    }
    scrollElementIntoView(t, o = !1) {
      const e = ((t) => {
        var o, e, n, r;
        if ("undefined" == typeof document) return [];
        const {
            scrollMode: a,
            block: h,
            inline: u,
            boundary: d,
            skipOverflowHiddenElements: p,
          } = { scrollMode: "always", block: "start", inline: "start" },
          f = "function" == typeof d ? d : (t) => t !== d;
        if (!s(t)) throw new TypeError("Invalid target");
        const m = document.scrollingElement || document.documentElement,
          g = [];
        let w = t;
        for (; s(w) && f(w); ) {
          if (((w = c(w)), w === m)) {
            g.push(w);
            break;
          }
          (null != w && w === document.body && i(w) && !i(document.documentElement)) ||
            (null != w && i(w, p) && g.push(w));
        }
        const S = null != (e = null == (o = window.visualViewport) ? void 0 : o.width) ? e : innerWidth,
          y = null != (r = null == (n = window.visualViewport) ? void 0 : n.height) ? r : innerHeight,
          { scrollX: T, scrollY: v } = window,
          { height: b, width: E, top: P, right: A, bottom: C, left: k } = t.getBoundingClientRect(),
          {
            top: H,
            right: R,
            bottom: L,
            left: W,
          } = ((t) => {
            const o = window.getComputedStyle(t);
            return {
              top: parseFloat(o.scrollMarginTop) || 0,
              right: parseFloat(o.scrollMarginRight) || 0,
              bottom: parseFloat(o.scrollMarginBottom) || 0,
              left: parseFloat(o.scrollMarginLeft) || 0,
            };
          })(t);
        let M = "start" === h || "nearest" === h ? P - H : "end" === h ? C + L : P + b / 2 - H + L,
          B = "center" === u ? k + E / 2 - W + R : "end" === u ? A + R : k - W;
        const V = [];
        for (let t = 0; t < g.length; t++) {
          const o = g[t],
            { height: e, width: n, top: s, right: r, bottom: c, left: d } = o.getBoundingClientRect();
          if (
            "if-needed" === a &&
            P >= 0 &&
            k >= 0 &&
            C <= y &&
            A <= S &&
            ((o === m && !i(o)) || (P >= s && C <= c && k >= d && A <= r))
          )
            return V;
          const p = getComputedStyle(o),
            f = parseInt(p.borderLeftWidth, 10),
            w = parseInt(p.borderTopWidth, 10),
            H = parseInt(p.borderRightWidth, 10),
            R = parseInt(p.borderBottomWidth, 10);
          let L = 0,
            W = 0;
          const j = "offsetWidth" in o ? o.offsetWidth - o.clientWidth - f - H : 0,
            O = "offsetHeight" in o ? o.offsetHeight - o.clientHeight - w - R : 0,
            q = "offsetWidth" in o ? (0 === o.offsetWidth ? 0 : n / o.offsetWidth) : 0,
            I = "offsetHeight" in o ? (0 === o.offsetHeight ? 0 : e / o.offsetHeight) : 0;
          if (m === o)
            ((L =
              "start" === h
                ? M
                : "end" === h
                  ? M - y
                  : "nearest" === h
                    ? l(v, v + y, y, w, R, v + M, v + M + b, b)
                    : M - y / 2),
              (W =
                "start" === u
                  ? B
                  : "center" === u
                    ? B - S / 2
                    : "end" === u
                      ? B - S
                      : l(T, T + S, S, f, H, T + B, T + B + E, E)),
              (L = Math.max(0, L + v)),
              (W = Math.max(0, W + T)));
          else {
            ((L =
              "start" === h
                ? M - s - w
                : "end" === h
                  ? M - c + R + O
                  : "nearest" === h
                    ? l(s, c, e, w, R + O, M, M + b, b)
                    : M - (s + e / 2) + O / 2),
              (W =
                "start" === u
                  ? B - d - f
                  : "center" === u
                    ? B - (d + n / 2) + j / 2
                    : "end" === u
                      ? B - r + H + j
                      : l(d, r, n, f, H + j, B, B + E, E)));
            const { scrollLeft: t, scrollTop: i } = o;
            ((L = 0 === I ? 0 : Math.max(0, Math.min(i + L / I, o.scrollHeight - e / I + O))),
              (W = 0 === q ? 0 : Math.max(0, Math.min(t + W / q, o.scrollWidth - n / q + j))),
              (M += i - L),
              (B += t - W));
          }
          V.push({ el: o, top: L, left: W });
        }
        return V;
      })(t);
      e.forEach(({ top: e, left: n, el: s }) => {
        const { top: r = 0, left: i = 0 } = this.getOffset(t, s, { top: e, left: n });
        this.scrollTo({ top: e - r, left: n - i }, o, s);
      });
    }
  };
});
!(function (t, e) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = e())
    : "function" == typeof define && define.amd
      ? define(e)
      : ((t || self).SwupScriptsPlugin = e());
})(this, function () {
  function t() {
    return (
      (t = Object.assign
        ? Object.assign.bind()
        : function (t) {
            for (var e = 1; e < arguments.length; e++) {
              var n = arguments[e];
              for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (t[r] = n[r]);
            }
            return t;
          }),
      t.apply(this, arguments)
    );
  }
  const e = (t) =>
    String(t)
      .split(".")
      .map((t) => String(parseInt(t || "0", 10)))
      .concat(["0", "0"])
      .slice(0, 3)
      .join(".");
  class n {
    constructor() {
      ((this.isSwupPlugin = !0),
        (this.swup = void 0),
        (this.version = void 0),
        (this.requires = {}),
        (this.handlersToUnregister = []));
    }
    mount() {}
    unmount() {
      (this.handlersToUnregister.forEach((t) => t()), (this.handlersToUnregister = []));
    }
    _beforeMount() {
      if (!this.name) throw new Error("You must define a name of plugin when creating a class.");
    }
    _afterUnmount() {}
    _checkRequirements() {
      return (
        "object" != typeof this.requires ||
          Object.entries(this.requires).forEach(([t, n]) => {
            if (
              !(function (t, n, r) {
                const o = (function (t, e) {
                  var n;
                  if ("swup" === t) return null != (n = e.version) ? n : "";
                  {
                    var r;
                    const n = e.findPlugin(t);
                    return null != (r = null == n ? void 0 : n.version) ? r : "";
                  }
                })(t, r);
                return (
                  !!o &&
                  ((t, n) =>
                    n.every((n) => {
                      const [, r, o] = n.match(/^([\D]+)?(.*)$/) || [];
                      var s, i;
                      return ((t, e) => {
                        const n = {
                          "": (t) => 0 === t,
                          ">": (t) => t > 0,
                          ">=": (t) => t >= 0,
                          "<": (t) => t < 0,
                          "<=": (t) => t <= 0,
                        };
                        return (n[e] || n[""])(t);
                      })(
                        ((i = o), (s = e((s = t))), (i = e(i)), s.localeCompare(i, void 0, { numeric: !0 })),
                        r || ">="
                      );
                    }))(o, n)
                );
              })(t, (n = Array.isArray(n) ? n : [n]), this.swup)
            ) {
              const e = `${t} ${n.join(", ")}`;
              throw new Error(`Plugin version mismatch: ${this.name} requires ${e}`);
            }
          }),
        !0
      );
    }
    on(t, e, n = {}) {
      var r;
      e = !(r = e).name.startsWith("bound ") || r.hasOwnProperty("prototype") ? e.bind(this) : e;
      const o = this.swup.hooks.on(t, e, n);
      return (this.handlersToUnregister.push(o), o);
    }
    once(e, n, r = {}) {
      return this.on(e, n, t({}, r, { once: !0 }));
    }
    before(e, n, r = {}) {
      return this.on(e, n, t({}, r, { before: !0 }));
    }
    replace(e, n, r = {}) {
      return this.on(e, n, t({}, r, { replace: !0 }));
    }
    off(t, e) {
      return this.swup.hooks.off(t, e);
    }
  }
  return class extends n {
    constructor(t) {
      (void 0 === t && (t = {}),
        super(),
        (this.name = "SwupScriptsPlugin"),
        (this.requires = { swup: ">=4" }),
        (this.defaults = { head: !0, body: !0, optin: !1 }),
        (this.options = void 0),
        (this.options = { ...this.defaults, ...t }));
    }
    mount() {
      this.on("content:replace", this.runScripts);
    }
    runScripts() {
      const { head: t, body: e, optin: n } = this.options,
        r = this.getScope({ head: t, body: e });
      if (!r) return;
      const o = Array.from(
        r.querySelectorAll(n ? "script[data-swup-reload-script]" : "script:not([data-swup-ignore-script])")
      );
      (o.forEach((t) => this.runScript(t)), this.swup.log(`Executed ${o.length} scripts.`));
    }
    runScript(t) {
      const e = document.createElement("script");
      for (const { name: n, value: r } of t.attributes) e.setAttribute(n, r);
      return ((e.textContent = t.textContent), t.replaceWith(e), e);
    }
    getScope(t) {
      let { head: e, body: n } = t;
      return e && n ? document : e ? document.head : n ? document.body : null;
    }
  };
});

/**
 * swup-init.js — SWUP 页面过渡引擎 (替换 spa-router.js 的路由功能)
 *
 * SWUP v4.9.0 + 插件体系取代手工 SPA 路由.
 * spa-router.js 保留为临时回退，但不再加载.
 *
 * 收益:
 *   - SWUP 原生处理: 内容替换, popstate, head 更新, scroll 恢复
 *   - persist 属性: navigator / footer 保留 (data-swup-persist)
 *   - 更短的维护成本, 更成熟的社区支持
 *
 * 脚本热重载 (替代 ScriptsPlugin optin 模式):
 *   - ScriptsPlugin 设为 { head: false, body: false } 基本禁用
 *   - content:replace hook 中自动提取新页面 HTML 的 <script src> 标签
 *   - 跳过 SPA shell 已加载的全局脚本（_globalScriptPatterns）
 *   - 跳过已注入过的脚本（查重）
 *   - 按批次（3个/批）注入到 <head>，使用 requestIdleCallback
 *
 * 兼容性:
 *   - window.SpaRouter 保留 (有限方法, 供旧模块调用)
 *   - 继续派发 document "spa:load" 事件
 *   - 保留骨架屏逻辑
 *   - 保留 __spaNavigating 标志 (供 device-utils 检测)
 *   - spa-router.js 不再加载 (index.html 中注释掉)
 *
 * 依赖 (必须在此之前加载):
 *   <script defer src="/assets/js/vendor/swup.umd.js"></script>
 *   <script defer src="/assets/js/vendor/swup-head-plugin.umd.js"></script>
 *   <script defer src="/assets/js/vendor/swup-scroll-plugin.umd.js"></script>
 *   <script defer src="/assets/js/vendor/swup-scripts-plugin.umd.js"></script>
 */

(function (global) {
  "use strict";

  if (typeof global.Swup === "undefined") {
    console.warn("[SWUP] Swup library not loaded. Skipping SWUP, relying on SPA Router fallback.");
    return;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 骨架屏 — CSS 过渡版
  // ═══════════════════════════════════════════════════════════════════
  //
  // display:none → opacity transition (需要 skeleton.css 升级)
  // - skeleton.css: #skeleton-overlay { transition: opacity 350ms ease-out }
  // - skeleton.css: #skeleton-overlay[hidden] { opacity:0; pointer-events:none }
  //
  // 过渡时序:
  //   0ms     → 骨架 fadeOut (opacity: 1→0, 350ms ease-out)
  //   350ms   → 骨架不可见, 内容 fadeIn (opacity: 0→1)
  //   700ms   → 过渡完成

  function hideSkeleton() {
    clearTimeout(global._skDebugTimer);
    var overlay = document.getElementById("skeleton-overlay");
    var container = document.getElementById("spa-content");
    if (overlay) {
      // 清除 showSkeleton 设置的 inline style，让 CSS [data-hidden] 生效
      overlay.style.transition = "";
      overlay.style.opacity = "";
      overlay.style.pointerEvents = "";
      overlay.setAttribute("data-hidden", "");
    }
    if (container && container.innerHTML.trim()) {
      container.classList.add("swup-fade-in");
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 骨架类型推断：从 URL path 推断当前页面类型
  // ═══════════════════════════════════════════════════════════

  function getSkeletonType(path) {
    if (
      path === "/" ||
      path === "/home/" ||
      path === "/solutions/" ||
      path === "/about/" ||
      path === "/compliance/" ||
      path === "/manufacturing/"
    ) {
      return "hero-grid";
    }
    if (path === "/products/" || path.startsWith("/products/")) {
      return "product-grid";
    }
    if (path === "/contact/" || path === "/thank-you/") {
      return "form-page";
    }
    if (path.startsWith("/pdp/")) {
      return "pdp";
    }
    // privacy, terms, resources, solutions sub, cases, etc.
    return "content-page";
  }

  // ═══════════════════════════════════════════════════════════
  // 各类型骨架构建函数（DOM API，不用字符串拼接）
  // ═══════════════════════════════════════════════════════════

  function buildHeroGridSkeleton(container) {
    // Hero: badge + title(s) + desc + CTAs + card grid
    var hero = document.createElement("div");
    hero.className = "sk-hero";

    var badge = document.createElement("div");
    badge.className = "sk-badge";
    hero.appendChild(badge);

    var title = document.createElement("div");
    title.className = "sk-line";
    hero.appendChild(title);

    var subtitle = document.createElement("div");
    subtitle.className = "sk-line sk-line--short";
    hero.appendChild(subtitle);

    var desc = document.createElement("div");
    desc.className = "sk-line sk-line--desc";
    hero.appendChild(desc);

    var ctaGroup = document.createElement("div");
    ctaGroup.className = "sk-cta-group";
    var cta1 = document.createElement("div");
    cta1.className = "sk-line sk-cta";
    ctaGroup.appendChild(cta1);
    var cta2 = document.createElement("div");
    cta2.className = "sk-line sk-cta sk-cta--outline";
    ctaGroup.appendChild(cta2);
    hero.appendChild(ctaGroup);

    container.appendChild(hero);

    // Card grid
    var grid = document.createElement("div");
    grid.className = "sk-grid";
    for (var i = 0; i < 3; i++) {
      var card = document.createElement("div");
      card.className = "sk-card";
      grid.appendChild(card);
    }
    container.appendChild(grid);
  }

  function buildProductGridSkeleton(container) {
    // Filter bar
    var filterBar = document.createElement("div");
    filterBar.className = "sk-filter-bar";
    for (var fi = 0; fi < 3; fi++) {
      var chip = document.createElement("div");
      chip.className = "sk-filter-chip";
      filterBar.appendChild(chip);
    }
    container.appendChild(filterBar);

    // Product grid: 6 cards (fills 2 rows)
    var pGrid = document.createElement("div");
    pGrid.className = "sk-product-grid";
    for (var pi = 0; pi < 6; pi++) {
      var card = document.createElement("div");
      card.className = "sk-product-card";
      var img = document.createElement("div");
      img.className = "sk-product-img";
      card.appendChild(img);
      var text = document.createElement("div");
      text.className = "sk-product-text";
      card.appendChild(text);
      pGrid.appendChild(card);
    }
    container.appendChild(pGrid);
  }

  function buildContentPageSkeleton(container) {
    // Title
    var title = document.createElement("div");
    title.className = "sk-page-title";
    container.appendChild(title);

    // Paragraph 1
    var p1 = document.createElement("div");
    p1.className = "sk-paragraph";
    for (var i = 0; i < 4; i++) {
      var row = document.createElement("div");
      row.className = "sk-paragraph-row";
      if (i === 3) row.className += " sk-paragraph-row--short";
      p1.appendChild(row);
    }
    container.appendChild(p1);

    // Image placeholder
    var img = document.createElement("div");
    img.className = "sk-content-image";
    container.appendChild(img);

    // Paragraph 2
    var p2 = document.createElement("div");
    p2.className = "sk-paragraph";
    for (var j = 0; j < 3; j++) {
      var row2 = document.createElement("div");
      row2.className = "sk-paragraph-row";
      if (j === 2) row2.className += " sk-paragraph-row--short";
      p2.appendChild(row2);
    }
    container.appendChild(p2);
  }

  function buildFormSkeleton(container) {
    // Title
    var title = document.createElement("div");
    title.className = "sk-page-title";
    container.appendChild(title);

    // 4 form rows
    var fields = ["name", "email", "company", "message"];
    for (var fi = 0; fi < fields.length; fi++) {
      var row = document.createElement("div");
      row.className = "sk-form-row";

      var label = document.createElement("div");
      label.className = "sk-form-label";
      row.appendChild(label);

      if (fi === 3) {
        // textarea field
        var ta = document.createElement("div");
        ta.className = "sk-form-textarea";
        row.appendChild(ta);
      } else {
        var inp = document.createElement("div");
        inp.className = "sk-form-input";
        row.appendChild(inp);
      }

      container.appendChild(row);
    }

    // Submit button
    var submit = document.createElement("div");
    submit.className = "sk-form-submit";
    container.appendChild(submit);
  }

  function buildPdpSkeleton(container) {
    var layout = document.createElement("div");
    layout.className = "sk-pdp-layout";

    // Left: image
    var image = document.createElement("div");
    image.className = "sk-pdp-image";
    layout.appendChild(image);

    // Right: details
    var details = document.createElement("div");
    details.className = "sk-pdp-details";

    var title = document.createElement("div");
    title.className = "sk-pdp-title";
    details.appendChild(title);

    for (var i = 0; i < 4; i++) {
      var desc = document.createElement("div");
      desc.className = "sk-pdp-desc";
      details.appendChild(desc);
    }

    // Specs grid (2x3)
    var specs = document.createElement("div");
    specs.className = "sk-pdp-specs";
    for (var si = 0; si < 6; si++) {
      var spec = document.createElement("div");
      spec.className = "sk-pdp-spec";
      specs.appendChild(spec);
    }
    details.appendChild(specs);

    layout.appendChild(details);
    container.appendChild(layout);
  }

  // ═══════════════════════════════════════════════════════════
  // 类型化骨架创建（替代旧的通用 HTML 字符串版本）
  // ═══════════════════════════════════════════════════════════

  function createSkeletonIfMissing() {
    if (document.getElementById("skeleton-overlay")) return true;
    var container = document.getElementById("spa-content");
    if (!container) return false;

    var type = getSkeletonType(global.location.pathname);

    var overlay = document.createElement("div");
    overlay.id = "skeleton-overlay";

    var skelContainer = document.createElement("div");
    skelContainer.className = "skeleton-container";

    // Build type-specific skeleton
    switch (type) {
      case "hero-grid":
        buildHeroGridSkeleton(skelContainer);
        break;
      case "product-grid":
        buildProductGridSkeleton(skelContainer);
        break;
      case "form-page":
        buildFormSkeleton(skelContainer);
        break;
      case "pdp":
        buildPdpSkeleton(skelContainer);
        break;
      case "content-page":
      default:
        buildContentPageSkeleton(skelContainer);
        break;
    }

    overlay.appendChild(skelContainer);
    overlay.setAttribute("data-hidden", "");

    // 插入到 main#spa-content 内部作为第一个子元素，相对定位
    container.insertBefore(overlay, container.firstChild);
    return true;
  }

  function getNavigatorHeight() {
    var nav = document.querySelector('navigator, [data-component="navigator"], nav, header');
    if (nav) {
      var h = nav.getBoundingClientRect().height;
      if (h > 0) return h;
    }
    // fallback: 读取 CSS 变量
    var cssVal = getComputedStyle(document.documentElement).getPropertyValue("--nav-height");
    return parseInt(cssVal, 10) || 65;
  }

  function showSkeleton() {
    createSkeletonIfMissing();
    var overlay = document.getElementById("skeleton-overlay");
    if (overlay && overlay.hasAttribute("data-hidden")) {
      // 跳过过渡：先禁用 transition, 显示, 再恢复
      overlay.style.transition = "none";
      overlay.removeAttribute("data-hidden");
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "auto";
      // 三屏适配：读取 navigator 实际高度
      overlay.style.paddingTop = getNavigatorHeight() + "px";
      void overlay.offsetHeight; // 强制重绘
      overlay.style.transition = "";
    }
  }

  function ensureSkeletonHidden() {
    var overlay = document.getElementById("skeleton-overlay");
    if (overlay && !overlay.hasAttribute("data-hidden")) {
      overlay.setAttribute("data-hidden", "");
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 页面级 JS 初始化函数映射 (SPA 导航后重运行)
  // ═══════════════════════════════════════════════════════════════════

  function runPageInitByRoute() {
    var path = global.location.pathname;

    // product-grid: /products/<slug>/ 产品分类页
    var prodMatch = path.match(/^\/products\/(all|coffee|tea|meal|beauty|weight|gut|lifestyle|legacy)\//);
    if (prodMatch) {
      try {
        if (
          typeof global.ProductGrid !== "undefined" &&
          global.ProductGrid &&
          typeof global.ProductGrid.autoRender === "function"
        ) {
          global.ProductGrid.autoRender();
        } else if (
          typeof global.ProductGrid !== "undefined" &&
          global.ProductGrid &&
          typeof global.ProductGrid.init === "function"
        ) {
          global.ProductGrid.init();
        }
      } catch (e) {
        console.warn("[SWUP] ProductGrid init error:", e);
      }
    }

    // home-core-products: 首页
    if (/^\/home\//.test(path) || path === "/") {
      if (typeof global.HomeCoreProducts !== "undefined" && global.HomeCoreProducts && global.HomeCoreProducts.init) {
        try {
          global.HomeCoreProducts.init();
        } catch (e) {
          /* noop */
        }
      }
    }

    // product-detail PDP: /products/<category>/<model>/（新路由）+ 旧兼容
    if (/^\/products\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/$/.test(path) || /^\/products\/detail\//.test(path)) {
      if (typeof global.ProductDetail !== "undefined" && global.ProductDetail && typeof global.ProductDetail.init) {
        try {
          global.ProductDetail.init();
        } catch (e) {
          console.warn("[SWUP] ProductDetail.init error:", e);
        }
      } else if (!document.querySelector("script[data-force-product-detail]")) {
        var pd = document.createElement("script");
        pd.src = "/assets/js/product-detail.js?v=" + (global.SW_VERSION || Date.now());
        pd.async = true;
        pd.setAttribute("data-force-product-detail", "1");
        pd.onload = function () {
          try {
            global.ProductDetail && global.ProductDetail.init();
          } catch (e) {
            console.warn("[SWUP] ProductDetail.init after inject error:", e);
          }
        };
        document.head.appendChild(pd);
      }
    }

    // cases: 案例页
    if (/^\/cases/.test(path)) {
      // Detail page (e.g. /cases/sea-coffee-brand/)
      if (/^\/cases\/[a-z-]+/.test(path)) {
        if (
          typeof global.CaseDetail !== "undefined" &&
          global.CaseDetail &&
          typeof global.CaseDetail.init === "function"
        ) {
          try {
            global.CaseDetail.init();
          } catch (e) {
            console.warn("[SWUP] CaseDetail.init error:", e);
          }
        } else if (!document.querySelector("script[data-force-case-detail]")) {
          var cs = document.createElement("script");
          cs.src = "/assets/js/case-detail.js?v=" + (global.SW_VERSION || Date.now());
          cs.async = true;
          cs.setAttribute("data-force-case-detail", "1");
          cs.onload = function () {
            try {
              global.CaseDetail && global.CaseDetail.init();
            } catch (e) {
              console.warn("[SWUP] CaseDetail.init after inject error:", e);
            }
          };
          document.head.appendChild(cs);
        }
      } else {
        // List page (/cases/)
        if (typeof global.CaseGrid !== "undefined" && global.CaseGrid && typeof global.CaseGrid.init) {
          try {
            global.CaseGrid.init();
          } catch (e) {
            console.warn("[SWUP] CaseGrid.init error:", e);
          }
        } else if (!document.querySelector("script[data-force-case-grid]")) {
          var cg = document.createElement("script");
          cg.src = "/assets/js/case-grid.js?v=" + (global.SW_VERSION || Date.now());
          cg.async = true;
          cg.setAttribute("data-force-case-grid", "1");
          cg.onload = function () {
            try {
              global.CaseGrid && global.CaseGrid.init();
            } catch (e) {
              console.warn("[SWUP] CaseGrid.init after inject error:", e);
            }
          };
          document.head.appendChild(cg);
        }
      }
    }

    // news-detail: 新闻详情
    if (/^\/news\/detail\//.test(path)) {
      if (typeof global.NewsDetail !== "undefined" && global.NewsDetail && global.NewsDetail.init) {
        try {
          global.NewsDetail.init();
        } catch (e) {
          /* noop */
        }
      }
    }

    // profit-calculator
    if (/^\/profit-calculator\//.test(path)) {
      if (typeof global.ProfitCalculator !== "undefined" && global.ProfitCalculator && global.ProfitCalculator.init) {
        try {
          global.ProfitCalculator.init();
        } catch (e) {
          /* noop */
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Navigator/Footer active 状态 (从 incoming HTML 提取)
  // ═══════════════════════════════════════════════════════════════════

  function extractActiveNav(html) {
    var m = html && html.match(/<navigator[\s\S]*?data-component="navigator"[\s\S]*?>/i);
    if (!m) return null;
    var v = m[0].match(/data-active="([^"]*)"/i);
    return v ? v[1] : null;
  }

  function extractActiveFooter(html) {
    var m = html && html.match(/<footer[\s\S]*?data-component="footer"[\s\S]*?>/i);
    if (!m) return null;
    var v = m[0].match(/data-active="([^"]*)"/i);
    return v ? v[1] : null;
  }

  function updateActiveState(html) {
    var navActive = extractActiveNav(html);
    if (navActive && global.Navigator && typeof global.Navigator.updateActive === "function") {
      global.Navigator.updateActive(navActive);
    }
    // SPA 导航后同步更新手机菜单高亮
    if (global.SlideMenu && typeof global.SlideMenu.updateActive === "function") {
      global.SlideMenu.updateActive();
    }

    var footerActive = extractActiveFooter(html);
    if (!footerActive) {
      var path = global.location.pathname.replace(/\/$/, "");
      var map = {
        "/home": "home",
        "/products": "products",
        "/solutions": "solutions",
        "/manufacturing": "manufacturing",
        "/compliance": "compliance",
        "/contact": "contact",
        "/cases": "cases",
        "/about": "about",
        "/news": "news",
        "/quote": "quote",
        "/support": "support",
        "/profit-calculator": "profit-calculator",
        "/resources": "resources",
      };
      var best = "";
      for (var k in map) {
        if (path.indexOf(k) === 0 && k.length > best.length) best = k;
      }
      footerActive = map[best] || "home";
    }
    if (global.Footer && typeof global.Footer.updateActive === "function") {
      global.Footer.updateActive(footerActive);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // spa:load 兼容事件派发
  // ═══════════════════════════════════════════════════════════════════

  function dispatchSpaLoad() {
    document.dispatchEvent(new CustomEvent("spa:load", { bubbles: true }));
  }
  function dispatchSpaReady() {
    // spa:ready = spa:load 后的下一个 microtask
    Promise.resolve().then(function () {
      document.dispatchEvent(new CustomEvent("spa:ready", { bubbles: true }));
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 设备感知页面路径映射 (适配 dev 的 88 个 SSG 页面)
  // ═══════════════════════════════════════════════════════════════════

  function getDeviceSuffix() {
    if (typeof DeviceUtils !== "undefined" && DeviceUtils && DeviceUtils.getDevicePagePath) {
      // 使用项目统一的设备检测
      var device = DeviceUtils.getDeviceType ? DeviceUtils.getDeviceType() : "pc";
      if (device === "mobile") return "index-mobile.html";
      if (device === "tablet") return "index-tablet.html";
      return "index-pc.html";
    }
    // fallback: viewport width
    var w = window.innerWidth;
    if (w < 768) return "index-mobile.html";
    if (w < 1280) return "index-tablet.html";
    return "index-pc.html";
  }

  /**
   * 将 SPA 路由路径转换为设备特定页面的 fetch URL.
   * 映射关系（对齐 dev 的 SpaRouter.routes + 文件约定）:
   * /              → /home/index-pc.html
   * /home/         → /home/index-pc.html
   * /products/     → /products/index-pc.html
   * /products/coffee/ → /products/coffee/index-pc.html
   * /products/<category>/<model>/ → /pdp/index-pc.html  (PDP)
   * /solutions/oem/ → /solutions/oem/index-pc.html
   * /manufacturing/ → /manufacturing/index-pc.html
   * /compliance/   → /compliance/index-pc.html
   * /cases/        → /cases/index-pc.html
   * /resources/catalog/ → /resources/catalog/index-pc.html
   * /news/detail/  → /news/detail-pc.html (flat-file pattern)
   */
  function routeToFetchUrl(path) {
    // 所有路由都有 index.html (PC版fallback)，直接请求干净路径
    // serve 会返回 dist/<route>/index.html
    return path;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SPA shell 全局脚本列表 (不重复加载)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 定义哪些 JS 文件已由 src/index.html 的 SPA shell 加载。
   * SPA 导航时自动注入页面特有脚本，跳过这些全局脚本。
   * 匹配模式: 正则 test() 对 script src 路径进行匹配。
   *
   * 更新: 添加新的全局 JS 文件时，在此列表追加即可。
   */
  var _globalScriptPatterns =
    window._BREW_GLOBAL_PATTERNS ||
    /(?:^|[/])(?:device-utils|swup-bundle|swup-init|i18n-bundle|dropdown-bundle|nav-bundle|footer|bottom-tab|search-engine|trust-bar|analytics|theme-init|runtime-guard|product-data-table|product-grid|product-detail|home-core-products|case-grid|search-index|page-init|dom-utils|nav-config|breadcrumb|spa-router|utils|page-interactions|helpers|page-effects|form-interactions|hero-video|currency|floating-actions|lang-registry|translations|translations-dropdown-template|contacts|product-list)\.js/;

  /**
   * 用于缓存当前 SPA 导航周期中已动态注入的 script 元素。
   * 后续导航会清除旧注入，避免累积。
   */
  var _dynamicScripts = [];

  /**
   * 从新页面 document 中提取 <script src> 标签，
   * 过滤掉全局脚本和已加载/已注入的脚本，
   * 按批次（3个/批）注入到 <head>。
   *
   * @param {Document|null} newDoc - 新页面的 document (visit.to.document)
   */
  function reloadPageScripts(newDoc) {
    if (!newDoc) return;

    // 清除上一轮注入的脚本
    for (var d = 0; d < _dynamicScripts.length; d++) {
      try {
        if (_dynamicScripts[d].parentNode) {
          _dynamicScripts[d].parentNode.removeChild(_dynamicScripts[d]);
        }
      } catch (e) {
        // ignore: removeChild may fail if parent was modified by SPA
      }
    }
    _dynamicScripts = [];

    // 从新页面的 head 和 body 提取所有 <script src> 标签
    var headScripts = newDoc.head.querySelectorAll("script[src]");
    var bodyScripts = newDoc.body.querySelectorAll("script[src]");
    var allNewScripts = Array.prototype.slice.call(headScripts).concat(Array.prototype.slice.call(bodyScripts));

    // 构建当前页面已加载的 script src 集合（去版本号）
    var currentScripts = document.querySelectorAll("script[src]");
    var currentSrcs = {};
    for (var c = 0; c < currentScripts.length; c++) {
      var curKey = currentScripts[c].getAttribute("src").replace(/\?.*$/, "");
      currentSrcs[curKey] = true;
    }

    // 筛选需要注入的脚本
    var toInject = [];
    for (var i = 0; i < allNewScripts.length; i++) {
      var src = allNewScripts[i].getAttribute("src");
      if (!src) continue;
      var srcKey = src.replace(/\?.*$/, "");
      // 跳过全局脚本（SPA shell 已加载）
      if (_globalScriptPatterns.test(srcKey)) continue;
      // 跳过当前页面已存在的脚本
      if (currentSrcs[srcKey]) continue;
      toInject.push(src);
      currentSrcs[srcKey] = true;
    }

    // 按批次注入（防阻塞）
    function injectBatch(idx) {
      var batchSize = 3;
      var end = Math.min(idx + batchSize, toInject.length);
      for (var j = idx; j < end; j++) {
        var newScript = document.createElement("script");
        newScript.src = toInject[j];
        newScript.async = true;
        document.head.appendChild(newScript);
        _dynamicScripts.push(newScript);
      }
      if (end < toInject.length) {
        (window.requestIdleCallback || window.setTimeout)(function () {
          injectBatch(end);
        });
      }
    }

    if (toInject.length > 0) {
      (window.requestIdleCallback || window.setTimeout)(function () {
        injectBatch(0);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 创建 SWUP 实例
  // ═══════════════════════════════════════════════════════════════════

  var swup = null;
  var swupEnabled = false;

  function initSwup() {
    try {
      swup = new global.Swup({
        containers: ["#spa-content"],
        animateHistoryBrowsing: false,
        linkSelector:
          'a[href]:not([href^="http"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([href^="javascript:"])',
        resolveUrl: function (url) {
          // PDP 模板 /pdp/ — 保持当前地址栏路径
          if (url.indexOf("/pdp/") !== -1) return window.location.pathname;
          // Cases detail /cases/detail/index-pc.html?slug=xxx → /cases/xxx/
          var cm = url.match(/^(\/cases\/detail\/index(?:-[a-z0-9-]+)?\.html)\?slug=([a-z0-9-]+)$/i);
          if (cm) return "/cases/" + cm[2] + "/";

          // 将 /<section>/<sub>/.../index-mobile.html → /<section>/<sub>/.../
          var m = url.match(/^\/pages(.+)\/index(?:-[a-z0-9-]+)?\.html$/i);
          if (m && m[1]) return m[1] + "/";
          // 响应 URL: /products/index-mobile.html → /products/
          var dm = url.match(/^\/([^/].*)\/index(?:-[a-z0-9-]+)?\.html$/i);
          if (dm && dm[1]) return "/" + dm[1] + "/";
          // flat-file: /news/detail-pc.html → /news/detail/
          var fm = url.match(/^\/news\/detail(?:-[a-z0-9-]+)?\.html$/i);
          if (fm) return "/news/detail/";
          return url;
        },
        ignoreVisit: function (url, _a) {
          var el = _a ? _a.el : null;
          if (!el) return false;
          if (el.getAttribute("target") === "_blank") return true;
          if (el.getAttribute("download") !== null) return true;
          // 面包屑/同级导航链接：整页加载（避免swup SPA状态冲突）
          if (el.closest('[data-no-swup]') || el.getAttribute('data-no-swup') !== null) return true;
          // 跳过后端/外部路径
          if (url.match(/^(https?:|mailto:|tel:|javascript:)/)) return true;
          return false;
        },
        cache: false,
        plugins: [
          new global.SwupHeadPlugin({
            persistTags:
              "style, link[rel=stylesheet], link[rel=icon], meta[property], link[rel=canonical], link[rel=alternate], script[src]",
            persistAssets: true,
            awaitAssets: true,
            attributes: ["lang", "dir", "class"],
          }),
          new global.SwupScrollPlugin({
            animateScroll: {
              betweenPages: false,
              samePageWithHash: true,
              samePage: false,
            },
            doScrollingRightAway: true,
            offset: 0,
          }),
          // ScriptsPlugin 基本禁用 (head/body: false)，
          // 脚本热重载由 content:replace 中的 reloadPageScripts() 负责。
          new global.SwupScriptsPlugin({
            head: false,
            body: false,
            optin: true,
          }),
        ],
      });

      // ─── content:replace — 骨架屏 + 脚本热重载 + 状态更新 + 页面重初始化 ───
      swup.hooks.on("content:replace", function (visit, _a) {
        var page = _a ? _a.page : null;
        if (!page) return;

        hideSkeleton();

        // 检查容器是否存在（避免 404 页面缺少 #spa-content）
        var container = document.getElementById("spa-content");
        if (!container) {
          // 容器不存在 → 404 页面，直接跳转避免无限循环
          console.warn("[SWUP] #spa-content not found in incoming page, redirecting to 404");
          global.location.replace("/404?from=" + encodeURIComponent(visit.to.url));
          return;
        }
        container.classList.add("swup-fade-in");

        var p = global.location.pathname;

        // SPA 导航到产品分类页（非 PDP）：触发 ProductGrid 渲染
        if (/^\/products\/(all|[a-z]+)\/$/.test(p)) {
          if (global.ProductGrid && typeof global.ProductGrid.autoRender === "function") {
            try {
              global.ProductGrid.autoRender();
            } catch (e) {
              console.warn("[SWUP] ProductGrid.autoRender error:", e);
            }
          } else if (!document.querySelector("script[data-force-grid]")) {
            // product-grid.js not loaded — force inject once
            var gridContainer = document.getElementById("product-grid") || document.getElementById("product-list");
            if (gridContainer) {
              var s = document.createElement("script");
              s.src = "/assets/js/product-grid.js?v=" + (global.SW_VERSION || Date.now());
              s.async = true;
              s.setAttribute("data-force-grid", "1");
              s.onload = function () {
                try {
                  global.ProductGrid && (global.ProductGrid.autoRender || global.ProductGrid.init)();
                } catch (e) {
                  console.warn("[SWUP] ProductGrid init after inject error:", e);
                }
              };
              document.head.appendChild(s);
            }
          }
        }

        // ─── 脚本热重载：提取新页面特有脚本并注入 ───
        // 替代 ScriptsPlugin optin 模式，解决 data-swup-reload-script 遗漏问题
        var newDoc = visit.to && visit.to.document ? visit.to.document : null;
        if (newDoc) {
          reloadPageScripts(newDoc);
        }

        // 重新运行页面 init 函数
        runPageInitByRoute();

        // 更新 nav/footer active 状态
        updateActiveState(page.html);

        // SPA 导航后重新 mount footer（响应设备变化）
        if (global.Footer && typeof global.Footer.mount === "function") {
          global.Footer.mount();
        }

        // SPA 导航后重新 mount navigator（响应设备变化）
        if (global.Navigator && typeof global.Navigator.mount === "function") {
          global.Navigator.mount();
        }

        // SPA 导航后重新 inject bottom-tab（避免被 swup 清空）
        if (
          typeof global.BottomTab !== "undefined" &&
          global.BottomTab &&
          typeof global.BottomTab.inject === "function"
        ) {
          var existing = document.getElementById("bottom-tab-bar");
          if (!existing || existing.parentNode !== document.body) {
            global.BottomTab.inject();
          }
        }
        // ─── 全局：SPA 导航后重新触发所有 lazy 图片加载 ───
        // swup 通过 innerHTML 替换内容时，浏览器不会为
        // loading="lazy" 的图片重新触发 IntersectionObserver
        setTimeout(function () {
          var container = document.getElementById("spa-content");
          if (!container) return;
          var imgs = container.querySelectorAll('img[loading="lazy"]');
          for (var i = 0; i < imgs.length; i++) {
            var src = imgs[i].getAttribute("src");
            if (src) {
              imgs[i].removeAttribute("src");
              void imgs[i].offsetWidth;
              imgs[i].setAttribute("src", src);
            }
          }
        }, 100);
      });

      // ─── page:view — 派发 spa:load 兼容事件（页面完全渲染后）───
      swup.hooks.on("page:view", function () {
        // hash 锚点滚动：页面加载完成后处理 hash
        if (window.location.hash) {
          var hashTarget = document.querySelector(window.location.hash);
          if (hashTarget) {
            setTimeout(function () {
              hashTarget.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        }
        dispatchSpaLoad();
        dispatchSpaReady();
      });

      // ─── visit:start — 显示骨架屏并设置导航标志 ───
      swup.hooks.on("visit:start", function () {
        global.__spaNavigating = true;
        showSkeleton();
        var container = document.getElementById("spa-content");
        if (container) {
          container.classList.remove("swup-fade-in");
        }
      });

      // ─── visit:abort — 容器不匹配 / fetch 失败时 404 ───
      swup.hooks.on("visit:abort", function (visit) {
        global.__spaNavigating = false;
        // 跳转到 404 页面（保留当前 URL 用 replaceState 设 404）
        global.location.replace("/404?from=" + encodeURIComponent(visit.to.url));
      });

      // ─── visit:end — 清除导航标志 ───
      swup.hooks.on("visit:end", function () {
        setTimeout(function () {
          global.__spaNavigating = false;
        }, 100);
      });

      // ─── fetch:request — 将 SPA URL 转换为设备特定页面 ───
      swup.hooks.replace("fetch:request", function (visit, _a, defaultFetch) {
        var originalUrl = _a.url;
        var deviceUrl = routeToFetchUrl(originalUrl);
        return defaultFetch(visit, {
          url: deviceUrl,
          options: _a.options,
        });
      });

      // ─── enable — 首次加载：空容器→navigate 或 hideSkeleton ───
      swup.hooks.on("enable", function () {
        swupEnabled = true;
        window.__swupEnabled = true;
        var container = document.getElementById("spa-content");
        var isEmpty = !container || !container.innerHTML.trim();
        if (isEmpty) {
          // SPA shell 模式: 容器为空, 加载当前路由
          var currentUrl = window.location.pathname;
          if (currentUrl === "/" || currentUrl === "/index.html") {
            currentUrl = "/home/";
          }
          swup.navigate(currentUrl, { history: "replace" });
        } else {
          // SSG 模式: 页面上已有内容
          // 如果页面有骨架元素（通过 SSG 构建注入），渐变过渡
          // 否则直接显示内容
          if (document.getElementById("skeleton-overlay")) {
            hideSkeleton();
          } else {
            // 无骨架：创建骨架并人工设置初始状态，然后渐隐
            createSkeletonIfMissing();
            var overlay = document.getElementById("skeleton-overlay");
            if (overlay) {
              // 立即显示骨架，然后在下一帧设置 fade-out
              overlay.style.transition = "none";
              overlay.removeAttribute("data-hidden");
              overlay.style.opacity = "1";
              overlay.style.pointerEvents = "auto";
              // 三屏适配：读取 navigator 实际高度
              overlay.style.paddingTop = getNavigatorHeight() + "px";
              // 强制重绘后触发过渡
              overlay.offsetWidth;
              overlay.style.transition = "";
              overlay.setAttribute("data-hidden", "");
              container.classList.add("swup-fade-in");
            }
          }
          // 运行页面级 JS 初始化（如 product-grid, home-core-products 等）
          // 这确保 SSG 页面首次加载时渲染动态内容
          setTimeout(function () {
            runPageInitByRoute();
          }, 0);
        }
      });
    } catch (e) {
      console.error("[SWUP] Failed to initialize SWUP:", e);
    }
  }

  // 暴露 initSwup 供 swup-init.js 调用 — JJC-020 T0.1
  window.__initSwup = initSwup;

  // ═══════════════════════════════════════════════════════════════════
  // SpaRouter 向前兼容层 (供旧模块调用)
  // ═══════════════════════════════════════════════════════════════════

  // 如果 spa-router.js 先加载了 SpaRouter, 我们替换其 navigate 方法
  // 否则创建新的兼容对象
  if (!global.SpaRouter) {
    global.SpaRouter = {};
  }

  // 保存旧引用（如果有的话）
  var _oldNavigate = global.SpaRouter.navigate;
  var _oldReplace = global.SpaRouter.replace;
  var _oldGetPath = global.SpaRouter.getCurrentPath;

  global.SpaRouter.navigate = function (path) {
    var url = path;
    if (url && url.charAt(0) !== "/") url = "/" + url;
    if (swup && swupEnabled) {
      var navResult = swup.navigate(url);
      if (navResult && typeof navResult.catch === "function") {
        navResult.catch(function () {
          global.location.href = url;
        });
      } else {
        // swup navigate 及时返回 undefined 或非 Promise:
        // 用 setTimeout 确认 content:replace 已触发
      }
      return;
    }
    global.location.href = url;
  };

  global.SpaRouter.replace = function (path) {
    var url = path;
    if (url && url.charAt(0) !== "/") url = "/" + url;
    if (swup && swupEnabled) {
      var navResult = swup.navigate(url, { history: "replace" });
      if (navResult && typeof navResult.catch === "function") {
        navResult.catch(function () {
          global.location.replace(url);
        });
      }
      return;
    }
    global.location.replace(url);
  };

  global.SpaRouter.getCurrentPath = function () {
    var path = global.location.pathname;
    if (path.endsWith(".html")) {
      var ls = path.lastIndexOf("/");
      if (ls > 0) path = path.substring(0, ls + 1);
    }
    if (!path.endsWith("/")) path = path + "/";
    return path;
  };

  global.SpaRouter._pendingScroll = null;

  // ═══════════════════════════════════════════════════════════════════
  // __spaNavigate — 统一 SPA 导航入口（供 bottom-tab 等模块调用）
  // ═══════════════════════════════════════════════════════════════════

  global.__spaNavigate = function (url) {
    if (swup && swupEnabled) {
      swup.navigate(url);
    } else {
      global.location.href = url;
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 启动 (已迁移至 swup-init.js — JJC-020 T0.1)
  // ═══════════════════════════════════════════════════════════════════

  // ② 初始化 SWUP (已迁移至 swup-init.js — JJC-020 T0.1)
  // if (document.readyState === "loading") {
  //   document.addEventListener("DOMContentLoaded", initSwup);
  // } else {
  //   initSwup();  (已迁移至 swup-init.js — JJC-020 T0.1)
  // }
})(window);
