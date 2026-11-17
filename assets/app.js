/* ============ 健身房管理系统 MVP · 核心框架 ============ */

var ROLE_NAMES = { boss: '老板', manager: '店长', reception: '前台', coach: '教练', member: '会员' };

var NAV = [
  {
    group: '概览', items: [
      { key: 'guide', name: '演示导览', ico: '🧭', roles: ['boss', 'manager', 'reception', 'coach'] },
      { key: 'dashboard', name: '经营看板', ico: '📊', roles: ['boss', 'manager'] }
    ]
  },
  {
    group: '会员运营', items: [
      { key: 'members', name: '会员管理', ico: '👥', roles: ['boss', 'manager', 'reception', 'coach'] },
      { key: 'cards', name: '卡项与会籍', ico: '🎫', roles: ['boss', 'manager', 'reception'] },
      { key: 'checkin', name: '入场签到', ico: '🚪', roles: ['boss', 'manager', 'reception'] }
    ]
  },
  {
    group: '课程中心', items: [
      { key: 'courses', name: '排课与预约', ico: '🗓', roles: ['boss', 'manager', 'reception', 'coach'] }
    ]
  },
  {
    group: '经营管理', items: [
      { key: 'cashier', name: '收银台', ico: '💰', roles: ['boss', 'manager', 'reception'] },
      { key: 'finance', name: '财务与业绩', ico: '📈', roles: ['boss', 'manager'] },
      { key: 'staff', name: '员工管理', ico: '👷', roles: ['boss', 'manager'] }
    ]
  },
  {
    group: '', items: [
      { key: 'about', name: '项目信息', ico: 'ℹ️', roles: ['boss', 'manager', 'reception', 'coach'] }
    ]
  }
];

var MEMBER_NAV = [
  { key: 'mhome', name: '首页', ico: '🏠' },
  { key: 'mclass', name: '课表', ico: '🗓' },
  { key: 'mmine', name: '我的', ico: '👤' }
];

var state = {
  role: 'boss',
  page: 'guide',
  memberPhone: '13823410021',
  filters: {},
  search: '',
  weekOffset: 0,
  cashierTpl: 'CT2',
  cashierMember: '',
  selectedMember: null,
  selectedSchedule: null,
  drawerMember: null
};

/* ---------- 工具 ---------- */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function money(n) {
  var v = Number(n) || 0;
  return '¥' + v.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function staffName(id) { var s = DB.data.staff.find(function (x) { return x.id === id; }); return s ? s.name : '—'; }
function memberName(id) { var m = DB.data.members.find(function (x) { return x.id === id; }); return m ? m.name : '—'; }
function courseOf(id) { return DB.data.courses.find(function (c) { return c.id === id; }) || {}; }
function cardTypeLabel(t) { return { period: '时间卡', count: '次卡', private: '私教包' }[t] || t; }
function curMember() {
  return DB.data.members.find(function (m) { return m.phone === state.memberPhone; }) || DB.data.members[0];
}
function cardsOfMember(mid) {
  return DB.data.memberships.filter(function (c) { return c.memberId === mid; });
}
function daysLeft(c) {
  if (!c.endDate) return null;
  return daysBetween(TODAY, parseD(c.endDate));
}
function todayCheckins() {
  return DB.data.checkins.filter(function (c) { return c.date === todayStr(); });
}

/* ---------- 提示条 ---------- */
function toast(msg, type) {
  var wrap = $('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  var t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.innerHTML = (type === 'err' ? '⚠️ ' : type === 'ok' ? '✅ ' : '💬 ') + esc(msg);
  wrap.appendChild(t);
  setTimeout(function () {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0'; t.style.transform = 'translateX(20px)';
    setTimeout(function () { t.remove(); }, 320);
  }, 2200);
}

/* ---------- 弹层 ---------- */
function openModal(html, opts) {
  opts = opts || {};
  var mask = $('#mask');
  mask.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '">' +
    '<div class="modal-head"><h3>' + esc(opts.title || '') + '</h3>' +
    '<button class="icon-btn modal-close" style="background:#eef1f5;color:#5a6675" onclick="closeModal()">✕</button></div>' +
    '<div class="modal-body">' + html + '</div>' +
    (opts.footer === false ? '' : '<div class="modal-foot">' + (opts.footer || '<button class="btn" onclick="closeModal()">取消</button>') + '</div>') +
    '</div>';
  mask.classList.add('show');
}
function closeModal() { $('#mask').classList.remove('show'); $('#mask').innerHTML = ''; }

function openDrawer(html, title) {
  var d = $('#drawer');
  d.innerHTML = '<div class="drawer-head"><h3 style="font-size:16px;font-weight:700">' + esc(title) + '</h3>' +
    '<button class="icon-btn" style="margin-left:auto;background:#eef1f5;color:#5a6675" onclick="closeDrawer()">✕</button></div>' +
    '<div class="drawer-body">' + html + '</div>';
  d.classList.add('show');
  $('#drawer-mask').classList.add('show');
}
function closeDrawer() { $('#drawer').classList.remove('show'); $('#drawer-mask').classList.remove('show'); }

/* ---------- 渲染主框架 ---------- */
function navItemsForRole() {
  var out = [];
  NAV.forEach(function (g) {
    var items = g.items.filter(function (i) { return i.roles.indexOf(state.role) >= 0; });
    if (items.length) out.push({ group: g.group, items: items });
  });
  return out;
}

function renderSidebar() {
  var html = '';
  navItemsForRole().forEach(function (g) {
    if (g.group) html += '<div class="nav-group-title">' + esc(g.group) + '</div>';
    g.items.forEach(function (i) {
      var badge = i.key === 'cards' ? DB.data.memberships.filter(function (c) { return daysLeft(c) != null && daysLeft(c) >= 0 && daysLeft(c) <= 7; }).length
        : i.key === 'checkin' ? todayCheckins().length : 0;
      html += '<div class="nav-item ' + (state.page === i.key ? 'active' : '') + '" data-act="nav" data-page="' + i.key + '">' +
        '<span class="ico">' + i.ico + '</span><span>' + esc(i.name) + '</span>' +
        (badge ? '<span class="nav-badge">' + badge + '</span>' : '') + '</div>';
    });
  });
  $('#sidebar').innerHTML = html;
}

function render() {
  document.body.className = '';
  $('#sidebar').style.display = (state.role === 'member') ? 'none' : '';
  if (state.role === 'member') {
    renderMemberApp();
    return;
  }
  renderSidebar();
  var pfn = PAGES[state.page] || PAGES.guide;
  $('#main').className = 'main';
  $('#main').innerHTML = pfn();
  updateBadges();
}

function updateBadges() { /* 预留：页码角标 */ }

/* ---------- 会员端渲染 ---------- */
function renderMemberApp() {
  var nav = '<div class="phone-frame">' +
    '<div class="phone-screen" id="phone-screen">' + (PAGES[state.page] || PAGES.mhome)() + '</div>' +
    '<div class="phone-nav">' +
    MEMBER_NAV.map(function (n) {
      return '<div class="phone-nav-item ' + (state.page === n.key ? 'active' : '') + '" data-act="nav" data-page="' + n.key + '">' +
        '<span class="pn-ico">' + n.ico + '</span><span>' + n.name + '</span></div>';
    }).join('') +
    '</div></div>';
  $('#main').className = 'main member-app';
  $('#main').innerHTML =
    '<div class="page-head"><div><div class="page-title">会员自助端</div>' +
    '<div class="page-desc">会员视角的手机端界面：查卡余额、在线约课、查看消费记录</div></div>' +
    '<div class="page-head-actions"><button class="btn btn-sm" data-act="switch-member">切换会员身份</button></div></div>' +
    '<div class="phone-stage">' + nav + '</div>';
}

/* ---------- 事件总线 ---------- */
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]');
  if (!el) return;
  var act = el.getAttribute('data-act');
  if (ACTIONS[act]) { e.preventDefault(); ACTIONS[act](el.dataset, el); }
});

var ACTIONS = {
  nav: function (d) { state.page = d.page; state.weekOffset = 0; state.search = ''; render(); window.scrollTo(0, 0); },
  closeModal: closeModal,
  'reset-data': function () {
    if (confirm('确定要恢复演示数据吗？当前所有改动会丢失。')) {
      DB.reset(); toast('已恢复到初始演示数据', 'ok'); render();
    }
  },
  'switch-member': function () {
    var opts = DB.data.members.map(function (m) {
      return '<option value="' + m.phone + '" ' + (m.phone === state.memberPhone ? 'selected' : '') + '>' + esc(m.name) + ' · ' + m.phone + '</option>';
    }).join('');
    openModal('<div class="field"><label class="field-label">选择要查看的会员身份</label><select id="sw-member">' + opts + '</select>' +
      '<div class="field-hint">会员端支持多角色切换，可演示不同会员的卡余量与预约差异</div></div>',
      {
        title: '切换登录会员',
        footer: '<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="ACTIONS.doSwitchMember()">切换</button>'
      });
  },
  doSwitchMember: function () {
    state.memberPhone = $('#sw-member').value;
    closeModal(); toast('已切换会员身份', 'ok'); render();
  }
};

/* ---------- 启动 ---------- */
function boot() {
  DB.load();
  var hash = (location.hash || '').replace('#', '');
  if (hash) {
    state.page = hash;
    if (['mhome', 'mclass', 'mmine'].indexOf(hash) >= 0) state.role = 'member';
  }
  var sel = $('#role-select');
  sel.innerHTML = ['boss', 'manager', 'reception', 'coach', 'member'].map(function (r) {
    return '<option value="' + r + '">' + ROLE_NAMES[r] + '</option>';
  }).join('');
  sel.value = state.role;
  sel.addEventListener('change', function () {
    state.role = sel.value;
    var allowed = Object.keys(PAGES).filter(function (k) { return true; });
    var ok = false;
    navItemsForRole().forEach(function (g) { g.items.forEach(function (i) { if (i.key === state.page) ok = true; }); });
    if (state.role === 'member') {
      if (['mhome', 'mclass', 'mmine'].indexOf(state.page) < 0) state.page = 'mhome';
    } else if (!ok) state.page = 'guide';
    toast('已切换到「' + ROLE_NAMES[state.role] + '」视角，注意左侧菜单与可见数据的变化');
    render();
  });
  $('#store-chip').textContent = PROJECT.store;
  $('#proj-name').textContent = PROJECT.name;
  render();
}

document.addEventListener('DOMContentLoaded', boot);
