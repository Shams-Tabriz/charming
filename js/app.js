(function () {
  "use strict";

  var SHOP = window.SHOP;
  var PRODUCTS = window.PRODUCTS || [];
  var CART_KEY = "charminglane.cart.v1";
  var MAX_QTY = 20;

  var state = { cart: loadCart(), option: null, qty: 1 };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(label, className, onClick) {
    var b = el("button", className, label);
    b.type = "button";
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }

  var formatter;
  try {
    formatter = new Intl.NumberFormat(SHOP.locale, {
      style: "currency", currency: SHOP.currencyCode,
      minimumFractionDigits: 0, maximumFractionDigits: 2
    });
  } catch (e) {
    formatter = { format: function (n) { return SHOP.currencyCode + " " + n; } };
  }
  function money(n) { return formatter.format(n); }

  function slug(text) { return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  function findProduct(id) { return byId[id] || null; }

  // ---------- Cart storage ----------
  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) { /* storage unavailable */ }
  }
  state.cart = state.cart.filter(function (l) { return l && findProduct(l.id) && l.qty > 0; });

  // ---------- Feedback ----------
  var toastEl = $("#toast");
  var hasPopover = typeof toastEl.showPopover === "function";
  if (!hasPopover) { toastEl.removeAttribute("popover"); toastEl.hidden = true; }
  var toastTimer;

  function toast(message) {
    toastEl.textContent = message;
    $("#live").textContent = message;
    if (hasPopover) {
      if (toastEl.matches(":popover-open")) toastEl.hidePopover();
      toastEl.showPopover();
    } else {
      toastEl.hidden = false;
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (hasPopover) { if (toastEl.matches(":popover-open")) toastEl.hidePopover(); }
      else toastEl.hidden = true;
    }, 4500);
  }

  // ---------- Visuals ----------
  var BOW = '<svg viewBox="0 0 64 44" aria-hidden="true" focusable="false"><path fill="#a65469" d="M32 20C22 5 6 4 5 18c-1 13 15 14 27 2zM32 20C42 5 58 4 59 18c1 13-15 14-27 2zM28 22l-9 18 7-3 4 4 3-15zM36 22l9 18-7-3-4 4-3-15z"/><circle cx="32" cy="20" r="5" fill="#8a3f54"/></svg>';

  function placeholder(product, index) {
    var ph = el("span", "tile-ph tone-" + (index % 4));
    ph.innerHTML = BOW;
    ph.setAttribute("role", "img");
    ph.setAttribute("aria-label", product.name);
    return ph;
  }

  function media(product, index, eager) {
    if (!product.image) return placeholder(product, index);
    var img = el("img");
    img.src = product.image;
    img.alt = product.name;
    img.width = 640;
    img.height = 800;
    if (!eager) img.loading = "lazy";
    img.addEventListener("error", function () { img.replaceWith(placeholder(product, index)); });
    return img;
  }

  // ---------- Catalog ----------
  function categories() {
    var list = [];
    PRODUCTS.forEach(function (p) { if (list.indexOf(p.category) === -1) list.push(p.category); });
    return list;
  }

  function renderCatalog() {
    var root = $("#catalog");
    var nav = $("#catNav");
    root.textContent = "";
    nav.textContent = "";
    $("#empty").hidden = PRODUCTS.length > 0;

    var counter = 0;
    categories().forEach(function (cat) {
      var id = "cat-" + slug(cat);

      var li = el("li");
      var link = el("a", null, cat);
      link.href = "#" + id;
      li.appendChild(link);
      nav.appendChild(li);

      var section = el("div", "cat");
      var h = el("h3", null, cat);
      h.id = id;
      section.appendChild(h);

      var grid = el("ul", "grid");
      PRODUCTS.filter(function (p) { return p.category === cat; }).forEach(function (p) {
        var index = counter++;
        var row = el("li");
        var card = el("button", "item" + (p.soldOut ? " is-sold" : ""));
        card.type = "button";
        card.setAttribute("aria-haspopup", "dialog");

        var tile = el("span", "tile");
        tile.appendChild(media(p, index, false));
        if (p.soldOut) tile.appendChild(el("span", "badge", "Sold out"));
        else if (p.badge) tile.appendChild(el("span", "badge", p.badge));
        tile.appendChild(el("span", "price-tag", money(p.price)));

        card.appendChild(tile);
        card.appendChild(el("span", "item-name", p.name));
        card.setAttribute("aria-label", p.name + ", " + money(p.price) + (p.soldOut ? ", sold out" : ""));

        card.addEventListener("click", function () { openProduct(p, index); });
        row.appendChild(card);
        grid.appendChild(row);
      });
      section.appendChild(grid);
      root.appendChild(section);
    });
  }

  // ---------- Dialog helpers ----------
  var productDialog = $("#productDialog");
  var drawer = $("#drawer");

  function lockScroll() { document.body.classList.add("lock"); }
  function unlockScroll() {
    if (!productDialog.open && !drawer.open) document.body.classList.remove("lock");
  }
  [productDialog, drawer].forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
    d.addEventListener("close", unlockScroll);
  });

  // ---------- Product dialog ----------
  function setItemParam(id) {
    try {
      var url = new URL(window.location.href);
      if (id) url.searchParams.set("item", id); else url.searchParams.delete("item");
      history.replaceState(null, "", url);
    } catch (e) { /* history unavailable, for example on file:// */ }
  }

  productDialog.addEventListener("close", function () { setItemParam(null); });

  function qtyControl(initial, onChange, labelSuffix) {
    var qty = el("div", "qty");
    var value = initial;
    var num = el("span", null, String(value));
    num.setAttribute("aria-live", "polite");
    var minus = button("\u2212", null, function () { value = onChange(value - 1); num.textContent = value; });
    var plus = button("+", null, function () { value = onChange(value + 1); num.textContent = value; });
    minus.setAttribute("aria-label", "Decrease quantity" + labelSuffix);
    plus.setAttribute("aria-label", "Increase quantity" + labelSuffix);
    qty.appendChild(minus); qty.appendChild(num); qty.appendChild(plus);
    return qty;
  }

  function openProduct(p, index) {
    state.option = p.options && p.options.length ? p.options[0] : null;
    state.qty = 1;
    productDialog.textContent = "";

    var wrap = el("div", "pd");

    var close = button("\u00d7", "icon-btn dialog-close", function () { productDialog.close(); });
    close.setAttribute("aria-label", "Close item details");
    wrap.appendChild(close);

    var mediaBox = el("div", "pd-media");
    mediaBox.appendChild(media(p, index, true));
    wrap.appendChild(mediaBox);

    var info = el("div", "pd-info");
    info.appendChild(el("p", "pd-cat", p.category));
    var title = el("h3", null, p.name);
    title.id = "pd-title";
    info.appendChild(title);
    info.appendChild(el("p", "pd-price", money(p.price)));
    if (p.description) info.appendChild(el("p", "pd-desc", p.description));
    productDialog.setAttribute("aria-labelledby", "pd-title");
    productDialog.removeAttribute("aria-label");

    if (p.options && p.options.length) {
      info.appendChild(el("p", "pd-label", "Choose one"));
      var opts = el("div", "pd-options");
      opts.setAttribute("role", "group");
      opts.setAttribute("aria-label", "Options for " + p.name);
      p.options.forEach(function (name) {
        var b = button(name, "opt", function () {
          state.option = name;
          Array.prototype.forEach.call(opts.children, function (c) {
            c.setAttribute("aria-pressed", String(c === b));
          });
        });
        b.setAttribute("aria-pressed", String(name === state.option));
        opts.appendChild(b);
      });
      info.appendChild(opts);
    }

    var actions = el("div", "pd-actions");
    if (p.soldOut) {
      var sold = button("Sold out", "btn btn-primary");
      sold.disabled = true;
      actions.appendChild(sold);
    } else {
      actions.appendChild(qtyControl(1, function (n) {
        state.qty = Math.max(1, Math.min(MAX_QTY, n));
        return state.qty;
      }, ""));
      actions.appendChild(button("Add to bag", "btn btn-primary", function (e) {
        var from = e.currentTarget.getBoundingClientRect();
        addToCart(p.id, state.option, state.qty);
        productDialog.close();
        toast(p.name + " added to your bag.");
        flyToBag(from);
      }));
    }
    info.appendChild(actions);

    wrap.appendChild(info);
    productDialog.appendChild(wrap);
    lockScroll();
    productDialog.showModal();
    setItemParam(p.id);
  }

  // ---------- Cart ----------
  function addToCart(id, option, qty) {
    var existing = null;
    state.cart.forEach(function (l) { if (l.id === id && (l.option || null) === (option || null)) existing = l; });
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    else state.cart.push({ id: id, option: option || null, qty: qty });
    saveCart();
    renderBag();
  }

  function bumpBag() {
    var btn = $("#openBag");
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // A small bow leaves the button, arcs up, and drops into the bag icon.
  function flyToBag(from) {
    var bag = $("#openBag");
    if (reduceMotion.matches || !bag.animate) { bumpBag(); return; }
    var to = bag.getBoundingClientRect();
    var size = 40;
    var startX = from.left + from.width / 2 - size / 2;
    var startY = from.top + from.height / 2 - size / 2;
    var dx = to.left + to.width / 2 - size / 2 - startX;
    var dy = to.top + to.height / 2 - size / 2 - startY;

    var node = el("span", "fly");
    node.innerHTML = '<svg viewBox="0 0 64 44" aria-hidden="true"><use href="#bow"/></svg>';
    node.style.left = startX + "px";
    node.style.top = startY + "px";
    document.body.appendChild(node);

    var arc = node.animate([
      { transform: "translate(0, 0) scale(0.6) rotate(0deg)", opacity: 0 },
      { transform: "translate(" + dx * 0.3 + "px, " + (dy * 0.3 - 70) + "px) scale(1.25) rotate(-18deg)", opacity: 1, offset: 0.3 },
      { transform: "translate(" + dx * 0.75 + "px, " + (dy * 0.75 - 20) + "px) scale(0.9) rotate(14deg)", opacity: 1, offset: 0.75 },
      { transform: "translate(" + dx + "px, " + dy + "px) scale(0.35) rotate(0deg)", opacity: 0.9 }
    ], { duration: 800, easing: "cubic-bezier(0.45, 0, 0.35, 1)" });
    arc.onfinish = function () { node.remove(); bumpBag(); };
    arc.oncancel = function () { node.remove(); bumpBag(); };
  }

  function cartTotal() {
    return state.cart.reduce(function (sum, l) { return sum + findProduct(l.id).price * l.qty; }, 0);
  }

  function renderBag() {
    var count = state.cart.reduce(function (n, l) { return n + l.qty; }, 0);
    var badge = $("#bagCount");
    badge.textContent = count;
    badge.hidden = count === 0;
    $("#openBag").setAttribute("aria-label", count ? "Open your bag, " + count + (count === 1 ? " item" : " items") : "Open your bag");

    var body = $("#bagItems");
    body.textContent = "";
    $("#bagFoot").hidden = state.cart.length === 0;

    if (!state.cart.length) {
      var empty = el("p", "bag-empty", "Your bag is empty. ");
      var link = el("a", null, "Browse the shop");
      link.href = "#shop";
      link.addEventListener("click", function () { drawer.close(); });
      empty.appendChild(link);
      body.appendChild(empty);
      return;
    }

    state.cart.forEach(function (l, index) {
      var p = findProduct(l.id);
      var row = el("div", "line");

      var thumb = el("div", "line-thumb");
      thumb.appendChild(media(p, PRODUCTS.indexOf(p), false));

      var mid = el("div");
      mid.appendChild(el("p", "line-name", p.name));
      mid.appendChild(el("p", "line-meta", (l.option ? l.option + " \u00b7 " : "") + money(p.price)));

      var qty = el("div", "qty");
      var num = el("span", null, String(l.qty));
      var minus = button("\u2212", null, function () {
        if (l.qty > 1) l.qty -= 1; else state.cart.splice(index, 1);
        saveCart(); renderBag();
      });
      var plus = button("+", null, function () {
        l.qty = Math.min(MAX_QTY, l.qty + 1);
        saveCart(); renderBag();
      });
      minus.setAttribute("aria-label", "Decrease quantity of " + p.name);
      plus.setAttribute("aria-label", "Increase quantity of " + p.name);
      qty.appendChild(minus); qty.appendChild(num); qty.appendChild(plus);
      mid.appendChild(qty);

      var end = el("div", "line-end");
      end.appendChild(el("span", "line-price", money(p.price * l.qty)));
      var remove = button("Remove", "remove", function () {
        state.cart.splice(index, 1);
        saveCart(); renderBag();
      });
      remove.setAttribute("aria-label", "Remove " + p.name + " from your bag");
      end.appendChild(remove);

      row.appendChild(thumb); row.appendChild(mid); row.appendChild(end);
      body.appendChild(row);
    });

    $("#bagTotal").textContent = money(cartTotal());
  }

  function openBag() { lockScroll(); drawer.showModal(); }

  // ---------- Order message ----------
  function buildMessage() {
    var lines = ["Hi Charming Lane! I'd like to order:", ""];
    state.cart.forEach(function (l, i) {
      var p = findProduct(l.id);
      lines.push((i + 1) + ". " + p.name + (l.option ? " (" + l.option + ")" : "") + " x" + l.qty + " - " + money(p.price * l.qty));
    });
    lines.push("", "Total: " + money(cartTotal()) + " (shipping not included)");
    var name = $("#custName").value.trim();
    var notes = $("#custNotes").value.trim();
    if (name || notes) lines.push("");
    if (name) lines.push("Name: " + name);
    if (notes) lines.push("Delivery address / notes: " + notes);
    return lines.join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = el("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) resolve(); else reject(new Error("copy failed"));
    });
  }

  function isPlaceholder(value) { return !value || value.indexOf("YOUR_") === 0; }

  function openLink(url) {
    var a = el("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function sendOrder(platform) {
    if (!state.cart.length) return;
    var isMessenger = platform === "messenger";
    var handle = isMessenger ? SHOP.facebookPage : SHOP.instagramUser;
    if (isPlaceholder(handle)) {
      toast("Shop owner: set your " + (isMessenger ? "Facebook page" : "Instagram username") + " in js/config.js.");
      return;
    }
    var url = (isMessenger ? "https://m.me/" : "https://ig.me/m/") + encodeURIComponent(handle);

    // Start the copy first, then open the chat, all inside the click so browsers allow both.
    var copied = copyText(buildMessage());
    openLink(url);
    copied.then(function () {
      toast("Order copied. Paste it in the chat and send.");
    }, function () {
      toast("Could not copy your order. Please type it in the chat.");
    });
  }

  // ---------- Contact links ----------
  function setupLinks() {
    var fbOk = !isPlaceholder(SHOP.facebookPage);
    var igOk = !isPlaceholder(SHOP.instagramUser);
    var fb = encodeURIComponent(SHOP.facebookPage || "");
    var ig = encodeURIComponent(SHOP.instagramUser || "");

    [
      ["#linkFacebook", fbOk && "https://facebook.com/" + fb, "Facebook page"],
      ["#linkInstagram", igOk && "https://instagram.com/" + ig, "Instagram username"],
      ["#contactMessenger", fbOk && "https://m.me/" + fb, "Facebook page"],
      ["#contactInstagram", igOk && "https://ig.me/m/" + ig, "Instagram username"]
    ].forEach(function (item) {
      var a = $(item[0]);
      if (item[1]) { a.href = item[1]; return; }
      a.addEventListener("click", function (e) {
        e.preventDefault();
        toast("Shop owner: set your " + item[2] + " in js/config.js.");
      });
    });
  }

  // ---------- Init ----------
  $("#year").textContent = new Date().getFullYear();
  $("#openBag").addEventListener("click", openBag);
  $("#closeBag").addEventListener("click", function () { drawer.close(); });
  $("#sendMessenger").addEventListener("click", function () { sendOrder("messenger"); });
  $("#sendInstagram").addEventListener("click", function () { sendOrder("instagram"); });
  var clearBtn = $("#clearBag");
  var clearTimer;
  clearBtn.addEventListener("click", function () {
    if (!state.cart.length) return;
    if (clearBtn.dataset.confirm !== "1") {
      clearBtn.dataset.confirm = "1";
      clearBtn.textContent = "Tap again to empty your bag";
      clearTimer = setTimeout(resetClear, 4000);
      return;
    }
    resetClear();
    state.cart = [];
    saveCart(); renderBag();
    toast("Bag emptied.");
  });
  function resetClear() {
    clearTimeout(clearTimer);
    clearBtn.dataset.confirm = "0";
    clearBtn.textContent = "Empty bag";
  }
  drawer.addEventListener("close", resetClear);

  // ---------- Category bar: a bow follows the section you are reading ----------
  function setupCategoryBar() {
    var links = Array.prototype.slice.call(document.querySelectorAll("#catNav a"));
    if (!links.length) return;
    var navList = $("#catNav");
    var bar = $(".cat-bar-inner");
    var bow = el("span", "cat-bow");
    bow.setAttribute("aria-hidden", "true");
    bow.innerHTML = '<svg viewBox="0 0 64 44"><use href="#bow"/></svg>';
    navList.appendChild(bow);

    var activeLink = null;
    function setActive(link, instant) {
      if (link === activeLink) return;
      activeLink = link;
      links.forEach(function (a) { a.classList.toggle("is-active", a === link); });
      var x = link.offsetLeft + link.offsetWidth / 2;
      if (instant) bow.style.transition = "none";
      bow.style.transform = "translateX(" + x + "px)";
      bow.classList.add("on");
      if (instant) { void bow.offsetWidth; bow.style.transition = ""; }
      // keep the active link visible when the bar scrolls sideways on phones
      var lr = link.getBoundingClientRect();
      var br = bar.getBoundingClientRect();
      bar.scrollTo({ left: bar.scrollLeft + (lr.left - br.left) - bar.clientWidth / 2 + lr.width / 2, behavior: reduceMotion.matches ? "auto" : "smooth" });
    }

    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var sections = Array.prototype.slice.call(document.querySelectorAll(".cat > h3"));
    if (!("IntersectionObserver" in window)) { setActive(links[0], true); return; }

    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      for (var i = 0; i < sections.length; i++) {
        if (seen[sections[i].id]) { setActive(byId[sections[i].id]); return; }
      }
    }, { rootMargin: "-25% 0px -65% 0px" });
    sections.forEach(function (h) { io.observe(h); });
    setActive(links[0], true);
    window.addEventListener("resize", function () {
      var current = activeLink; activeLink = null; if (current) setActive(current, true);
    });
  }

  // ---------- Price tags swing once as they come into view ----------
  function setupTagSwing() {
    var tags = document.querySelectorAll(".price-tag");
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var tag = en.target;
        io.unobserve(tag);
        var col = Array.prototype.indexOf.call(tag.closest(".grid").children, tag.closest("li")) % 4;
        tag.style.setProperty("--d", col * 0.12 + "s");
        tag.classList.add("swing");
        tag.addEventListener("animationend", function () { tag.classList.remove("swing"); }, { once: true });
      });
    }, { threshold: 0.6 });
    tags.forEach(function (t) { io.observe(t); });
  }

  setupLinks();
  renderCatalog();
  renderBag();
  setupCategoryBar();
  setupTagSwing();

  var initial = null;
  try { initial = new URL(window.location.href).searchParams.get("item"); } catch (e) { /* ignore */ }
  if (initial && findProduct(initial)) openProduct(findProduct(initial), PRODUCTS.indexOf(findProduct(initial)));
})();
