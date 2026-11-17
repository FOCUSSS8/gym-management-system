/* ============ 健身房管理系统 MVP · 后台页面 ============ */

var PAGES = {};

function tip(title, body) {
  return '<div class="notice"><span class="n-ico">💡</span><div><b>' + esc(title) + '</b><br>' + body + '</div></div>';
}

function kpi(cls, label, value, unit, foot) {
  return '<div class="kpi ' + cls + '"><div class="kpi-label">' + label + '</div>' +
    '<div class="kpi-value">' + value + (unit ? '<small>' + unit + '</small>' : '') + '</div>' +
    '<div class="kpi-foot">' + foot + '</div></div>';
}

/* ---------- 卡状态 ---------- */
function cardStatus(c) {
  var t = tplOf(c.templateId);
  if (c.status === 'frozen') return { t: '已停卡', cls: 'b-gray' };
  if (c.status === 'expired') return { t: '已过期', cls: 'b-red' };
  if (t.type !== 'period' && c.remaining != null && c.remaining <= 0) return { t: '已用完', cls: 'b-gray' };
  if (c.endDate) {
    var d = daysLeft(c);
    if (d < 0) return { t: '已过期', cls: 'b-red' };
    if (d <= 7) return { t: '即将到期', cls: 'b-amber' };
  }
  return { t: '正常', cls: 'b-green' };
}
function isCardValid(c) {
  var t = tplOf(c.templateId);
  if (c.status !== 'active') return false;
  if (t.type !== 'period' && c.remaining != null && c.remaining <= 0) return false;
  if (c.endDate && daysLeft(c) < 0) return false;
  return true;
}
function remainText(c) {
  var t = tplOf(c.templateId);
  if (t.type === 'period') return c.endDate ? (daysLeft(c) >= 0 ? '剩 ' + daysLeft(c) + ' 天' : '已过期') : '长期有效';
  return '剩 ' + (c.remaining || 0) + (t.type === 'private' ? ' 节' : ' 次');
}

/* ================= 1. 演示导览 ================= */
PAGES.guide = function () {
  var flows = [
    {
      title: '办卡入会', desc: '新会员到店咨询，前台建档 → 选卡 → 收款 → 卡生效',
      steps: [['会员管理', '建立会员档案'], ['收银台', '开单收款'], ['卡项与会籍', '查看卡状态']]
    },
    {
      title: '到店锻炼', desc: '会员到店 → 前台核验卡 → 确认入场 → 扣减权益',
      steps: [['入场签到', '核验并确认入场'], ['会员管理', '查看入场轨迹'], ['经营看板', '今日到店统计']]
    },
    {
      title: '团课预约', desc: '查看周课表 → 预约课程 → 到店核销 → 计入课时',
      steps: [['排课与预约', '查看本周课表'], ['排课与预约', '查看报名名单'], ['财务与业绩', '教练课时结算']]
    },
    {
      title: '经营管理', desc: '老板看板 → 营收趋势 → 员工业绩 → 决策调整',
      steps: [['经营看板', '看核心指标'], ['财务与业绩', '订单与业绩榜'], ['员工管理', '调整提成规则']]
    }
  ];

  var roles = [
    { k: 'boss', desc: '全权限，看经营数据' }, { k: 'manager', desc: '运营与排班' },
    { k: 'reception', desc: '办卡收银签到' }, { k: 'coach', desc: '只看自己课程' },
    { k: 'member', desc: '自助端约课查卡' }
  ];

  return '<div class="page-head"><div><div class="page-title">演示导览</div>' +
    '<div class="page-desc">第一次打开建议按这个顺序点，五分钟看完整套系统</div></div></div>' +
    tip('这页是干什么的', '把系统四条核心业务线列出来，每条线按顺序列出该点哪几个页面。<br><b>右上角可以切换角色</b>，切换后左侧菜单会变化，这是权限设计的演示。') +

    '<div class="grid g2">' + flows.map(function (f) {
      return '<div class="card"><div class="card-head"><div class="card-title">' + f.title + '</div>' +
        '<div class="card-sub" style="margin-left:auto">' + f.desc + '</div></div>' +
        '<div class="flow-steps">' + f.steps.map(function (s, i) {
          return '<div class="flow-step" style="flex:none;min-width:0"><div class="fs-num">' + (i + 1) + '</div>' +
            '<div class="fs-title">' + s[0] + '</div><div class="fs-desc">' + s[1] + '</div></div>';
        }).join('') + '</div>' +
        '<div class="mt12"><button class="btn btn-primary btn-sm" data-act="jump" data-page="' + PAGES_KEY_OF_NAME(f.steps[0][0]) + '">开始 →</button></div>' +
        '</div>';
    }).join('') + '</div>' +

    '<div class="card mt16"><div class="card-head"><div class="card-title">五个角色能看什么</div>' +
      '<div class="card-sub">演示时切换右上角下拉，观察左侧菜单差异</div></div>' +
      '<div class="grid g3">' + roles.map(function (r) {
        return '<div class="list-item" style="border:1px solid var(--border);border-radius:10px;padding:11px 13px">' +
          '<div class="list-avatar">' + (ROLE_NAMES[r.k] || '')[0] + '</div>' +
          '<div class="list-main"><div class="list-title">' + ROLE_NAMES[r.k] + '</div>' +
          '<div class="list-sub">' + r.desc + '</div></div>' +
          '<button class="btn btn-xs" data-act="set-role" data-role="' + r.k + '">切过去</button></div>';
      }).join('') + '</div></div>';
};

function PAGES_KEY_OF_NAME(name) {
  var map = { '会员管理': 'members', '收银台': 'cashier', '卡项与会籍': 'cards', '入场签到': 'checkin', '会员自助端': 'mhome', '排课与预约': 'courses', '财务与业绩': 'finance', '员工管理': 'staff', '经营看板': 'dashboard' };
  return map[name] || 'guide';
}

/* ================= 2. 经营看板 ================= */
PAGES.dashboard = function () {
  var today = todayStr();
  var tCheck = todayCheckins();
  var todayOrders = DB.data.orders.filter(function (o) { return o.date === today; });
  var todayAmount = todayOrders.reduce(function (s, o) { return s + o.amount; }, 0);
  var mk0 = today.slice(0, 7);
  var monthOrders = DB.data.orders.filter(function (o) { return o.date.slice(0, 7) === mk0; });
  var monthAmount = monthOrders.reduce(function (s, o) { return s + o.amount; }, 0);
  var monthNew = DB.data.members.filter(function (m) { return m.joinDate.slice(0, 7) === mk0; }).length;
  var activeMembers = DB.data.members.filter(function (m) {
    return cardsOfMember(m.id).some(isCardValid);
  }).length;

  /* 近 6 个月营收 */
  var months = [];
  for (var i = 5; i >= 0; i--) {
    var d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
    var key = fmt(d).slice(0, 7);
    var sum = DB.data.orders.filter(function (o) { return o.date.slice(0, 7) === key; })
      .reduce(function (s, o) { return s + o.amount; }, 0);
    months.push({ key: key, label: (+key.slice(5)) + '月', val: sum });
  }
  var maxV = Math.max.apply(null, months.map(function (m) { return m.val; }).concat([1]));

  /* 今日课程 */
  var todaySch = DB.data.schedules.filter(function (s) { return s.date === today; })
    .sort(function (a, b) { return a.time < b.time ? -1 : 1; });

  /* 到期提醒 */
  var expiring = DB.data.memberships.filter(function (c) {
    var d = daysLeft(c); return c.status === 'active' && d != null && d >= 0 && d <= 7;
  }).map(function (c) {
    return { name: memberName(c.memberId), phone: (DB.data.members.find(function (m) { return m.id === c.memberId; }) || {}).phone, item: tplOf(c.templateId).name, left: daysLeft(c) };
  });

  return '<div class="page-head"><div><div class="page-title">经营看板</div>' +
    '<div class="page-desc">老板和店长的主页：一屏掌握门店当天的经营状况</div></div></div>' +
    tip('这页是干什么的', '顶部四个核心指标 → 今日实收与到店人次；中间是<b>近半年营收走势</b>和<b>今日课表</b>；右下角是<b>需要跟进的会员</b>（卡快到期）。数据来自真实业务操作：在收银台开单，这里的数字会同步变化。') +

    '<div class="grid g4">' +
    kpi('', '👥 今日到店人次', tCheck.length, ' 人', '累计入场记录 ' + DB.data.checkins.length + ' 条') +
    kpi('accent', '💰 今日实收', money(todayAmount), '', '今日订单 ' + todayOrders.length + ' 笔') +
    kpi('green', '📈 本月营收', money(monthAmount), '', '本月订单 ' + monthOrders.length + ' 笔') +
    kpi('amber', '✨ 本月新增会员', monthNew, ' 人', '在籍有效会员 ' + activeMembers + ' / ' + DB.data.members.length + ' 人') +
    '</div>' +

    '<div class="grid g-2-1 mt16">' +
    '<div class="card"><div class="card-head"><div class="card-title">近半年营收趋势</div>' +
      '<div class="card-sub">单位：元</div></div>' +
      '<div class="chart-bars">' + months.map(function (m) {
        var h = Math.round(m.val / maxV * 118);
        return '<div class="chart-col ' + (m.key === mk0 ? 'hot' : '') + '">' +
          '<div class="cb-val">' + (m.val ? Math.round(m.val / 1000 * 10) / 10 + 'k' : '0') + '</div>' +
          '<div class="cb-bar" style="height:' + Math.max(h, 3) + 'px"></div>' +
          '<div class="cb-lbl">' + m.label + '</div></div>';
      }).join('') + '</div></div>' +

    '<div class="card"><div class="card-head"><div class="card-title">今日课表</div>' +
      '<div class="card-sub">' + today + '</div></div>' +
      (todaySch.length ? todaySch.map(function (s) {
        var c = courseOf(s.courseId);
        return '<div class="list-item"><div class="list-avatar" style="background:var(--blue)">' + s.time.slice(0, 2) + '时</div>' +
          '<div class="list-main"><div class="list-title">' + c.name + '</div>' +
          '<div class="list-sub">' + staffName(s.coachId) + ' · ' + s.booked + '/' + s.capacity + ' 人</div></div>' +
          '<button class="btn btn-xs" data-act="open-sch" data-id="' + s.id + '">名单</button></div>';
      }).join('') : '<div class="empty"><span class="emoji">📅</span>今天没有排课</div>') +
    '</div></div>' +

    '<div class="card mt16"><div class="card-head"><div class="card-title">⚠️ 需要跟进的会员</div>' +
      '<div class="card-sub">卡剩余 ≤ 7 天，建议今日电话通知续费</div></div>' +
      (expiring.length ? '<div class="table-wrap"><table><thead><tr><th>会员</th><th>手机号</th><th>持有卡</th><th>剩余</th><th>操作</th></tr></thead><tbody>' +
        expiring.map(function (e) {
          return '<tr><td><b>' + esc(e.name) + '</b></td><td class="muted">' + esc(e.phone) + '</td>' +
            '<td>' + esc(e.item) + '</td><td><span class="badge b-amber">' + e.left + ' 天</span></td>' +
            '<td><button class="btn btn-xs" data-act="goto-cards">去提醒</button></td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="empty"><span class="emoji">✅</span>近期没有即将到期的会员卡</div>') +
    '</div>';
};

ACTIONS.jump = function (d) { state.page = d.page; render(); window.scrollTo(0, 0); };
ACTIONS['set-role'] = function (d) {
  state.role = d.role; $('#role-select').value = d.role;
  if (state.role === 'member') state.page = 'mhome';
  else if (!navItemsForRole().some(function (g) { return g.items.some(function (i) { return i.key === state.page; }); })) state.page = 'guide';
  toast('已切换到「' + ROLE_NAMES[d.role] + '」视角'); render();
};
ACTIONS['goto-cards'] = function () { state.page = 'cards'; render(); };
