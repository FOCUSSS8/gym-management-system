/* ============ 健身房管理系统 MVP · 后台页面（二） ============ */

/* ================= 3. 会员管理 ================= */
function membersTableHTML() {
  var kw = (state.search || '').trim();
  var f = state.filters.memberStatus || 'all';
  var me = state.role === 'coach' ? 'S05' : null;
  var list = DB.data.members.filter(function (m) {
    if (kw && m.name.indexOf(kw) < 0 && m.phone.indexOf(kw) < 0) return false;
    if (me && m.advisor !== me && !cardsOfMember(m.id).some(function (c) { return c.coachId === me; })) return false;
    var cs = cardsOfMember(m.id);
    if (f === 'expiring') return cs.some(function (c) { var d = daysLeft(c); return c.status === 'active' && d != null && d >= 0 && d <= 7; });
    if (f === 'active') return cs.some(isCardValid);
    if (f === 'none') return !cs.some(isCardValid);
    return true;
  });
  if (!list.length) return '<div class="empty"><span class="emoji">🔍</span>没有符合条件的会员</div>';
  return '<div class="table-wrap"><table><thead><tr><th>会员</th><th>手机号</th><th>性别</th><th>入会时间</th><th>有效卡</th><th>最近到期</th><th>会籍顾问</th><th>来源</th><th>操作</th></tr></thead><tbody>' +
    list.map(function (m) {
      var cs = cardsOfMember(m.id);
      var valid = cs.filter(isCardValid);
      var nearest = null;
      cs.forEach(function (c) {
        if (!c.endDate) return;
        var d = daysLeft(c);
        if (d >= 0 && (nearest == null || d < nearest.d)) nearest = { d: d, t: tplOf(c.templateId).name };
      });
      return '<tr class="clickable-row" data-act="open-member" data-id="' + m.id + '">' +
        '<td><div style="display:flex;align-items:center;gap:9px">' +
        '<div class="list-avatar" style="width:30px;height:30px;font-size:12px">' + m.name[0] + '</div>' +
        '<b>' + esc(m.name) + '</b></div></td>' +
        '<td class="muted">' + esc(m.phone) + '</td><td>' + m.gender + '</td>' +
        '<td class="small muted">' + m.joinDate + '</td>' +
        '<td>' + (valid.length ? '<span class="badge b-green">' + valid.length + ' 张有效</span>' : '<span class="badge b-gray">无有效卡</span>') + '</td>' +
        '<td>' + (nearest ? nearest.t + ' · <span class="' + (nearest.d <= 7 ? 'up' : 'muted') + '">' + nearest.d + '天</span>' : '<span class="muted">—</span>') + '</td>' +
        '<td>' + staffName(m.advisor) + '</td><td class="small muted">' + esc(m.source) + '</td>' +
        '<td><button class="btn btn-xs" data-act="open-member" data-id="' + m.id + '">详情</button></td></tr>';
    }).join('') + '</tbody></table></div>';
}

PAGES.members = function () {
  return '<div class="page-head"><div><div class="page-title">会员管理</div>' +
    '<div class="page-desc">会员档案总库，点任意一行看该会员的完整画像</div></div>' +
    '<div class="page-head-actions"><button class="btn" data-act="export-members">导出 CSV</button>' +
    '<button class="btn btn-primary" data-act="new-member">+ 新增会员</button></div></div>' +
    tip('这页是干什么的', '会员是整套系统的核心数据。<b>点任意一行打开右侧详情抽屉</b>，里面汇总了：持有的卡、消费记录、入场轨迹、教练跟进笔记。<br>上面一排是快速筛选，可以直接点「即将到期」找该打电话的会员。') +

    '<div class="card"><div class="card-head">' +
    '<div style="width:230px"><input type="search" id="m-search" placeholder="搜索姓名或手机号" value="' + esc(state.search) + '" oninput="ACTIONS.searchMember(this.value)"></div>' +
    '<div class="chip-row">' + [['all', '全部'], ['active', '有有效卡'], ['expiring', '即将到期'], ['none', '已失效']].map(function (c) {
      return '<div class="chip ' + ((state.filters.memberStatus || 'all') === c[0] ? 'active' : '') + '" data-act="filter-member" data-v="' + c[0] + '">' + c[1] + '</div>';
    }).join('') + '</div>' +
    '<div class="right small muted">共 ' + DB.data.members.length + ' 位会员</div></div>' +
    '<div id="members-table">' + membersTableHTML() + '</div></div>';
};

/* ================= 4. 卡项与会籍 ================= */
PAGES.cards = function () {
  var expiring = DB.data.memberships.filter(function (c) { var d = daysLeft(c); return c.status === 'active' && d != null && d >= 0 && d <= 7; });
  return '<div class="page-head"><div><div class="page-title">卡项与会籍</div>' +
    '<div class="page-desc">上半部分是可售卖的卡模板，下半部分是会员实际持有的卡</div></div></div>' +
    tip('这页是干什么的', '<b>卡模板</b>决定了能卖什么卡（价格、有效期、次数学时可以后台配置，不用改代码）；<b>会员持卡</b>是实际发出去的卡，支持到期监控。') +

    '<div class="grid g3">' + DB.data.templates.map(function (t) {
      var cnt = DB.data.memberships.filter(function (c) { return c.templateId === t.id; }).length;
      return '<div class="card" style="border-left:3px solid var(--primary)">' +
        '<div class="row-between"><div class="card-title">' + t.name + '</div>' +
        '<span class="badge b-blue">' + cardTypeLabel(t.type) + '</span></div>' +
        '<div style="font-size:22px;font-weight:700;color:var(--accent);margin:6px 0">' + money(t.price) + '</div>' +
        '<div class="small muted">' + t.desc + '</div>' +
        '<div class="small muted mt8">' + (t.type === 'period' ? '有效期 ' + t.days + ' 天' : '共 ' + t.total + (t.type === 'private' ? ' 节 · 课时费 ' + money(t.coachFee) : ' 次')) + '</div>' +
        '<div class="row-between mt12"><span class="small muted">已售出 ' + cnt + ' 张</span>' +
        '<button class="btn btn-xs btn-primary" data-act="sell-card" data-tpl="' + t.id + '">去开卡</button></div></div>';
    }).join('') + '</div>' +

    (expiring.length ? '<div class="notice warn mt16"><span class="n-ico">⏰</span><div><b>' + expiring.length + ' 张卡即将到期</b>（剩余 ≤ 7 天）：' +
      expiring.map(function (c) { return esc(memberName(c.memberId)) + '（' + daysLeft(c) + '天）'; }).join('、') + '</div></div>' : '') +

    '<div class="card mt16"><div class="card-head"><div class="card-title">会员持卡明细</div>' +
      '<div class="card-sub">共 ' + DB.data.memberships.length + ' 张</div></div>' +
      '<div class="table-wrap"><table><thead><tr><th>卡号</th><th>会员</th><th>卡类型</th><th>购买日期</th><th>到期日</th><th>剩余权益</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
      DB.data.memberships.slice().sort(function (a, b) { return (a.endDate || '9999') < (b.endDate || '9999') ? -1 : 1; }).map(function (c) {
        var st = cardStatus(c), t = tplOf(c.templateId);
        return '<tr><td class="small muted">' + c.id + '</td>' +
          '<td><b>' + esc(memberName(c.memberId)) + '</b></td><td>' + t.name + '</td>' +
          '<td class="small muted">' + c.buyDate + '</td><td>' + (c.endDate || '不限期') + '</td>' +
          '<td>' + remainText(c) + '</td><td><span class="badge ' + st.cls + '">' + st.t + '</span></td>' +
          '<td><div style="display:flex;gap:5px">' +
          (c.status === 'active' ? '<button class="btn btn-xs" data-act="freeze-card" data-id="' + c.id + '">停卡</button>' : '<button class="btn btn-xs" data-act="unfreeze-card" data-id="' + c.id + '">复卡</button>') +
          '<button class="btn btn-xs btn-danger" data-act="goto-member" data-id="' + c.memberId + '">会员</button></div></td></tr>';
      }).join('') + '</tbody></table></div></div>';
};

/* ================= 5. 入场签到 ================= */
function checkinResultHTML() {
  var q = (state.checkinQuery || '').trim();
  if (!q) return '<div class="empty"><span class="emoji">👋</span>输入手机号或姓名，系统会自动核验会员身份和卡状态</div>';
  var list = DB.data.members.filter(function (m) { return m.phone.indexOf(q) >= 0 || m.name.indexOf(q) >= 0; });
  if (!list.length) return '<div class="empty"><span class="emoji">❓</span>没有找到匹配的会员，请确认后新增档案</div>';
  return list.map(function (m) {
    var cs = cardsOfMember(m.id).filter(function (c) { return c.status === 'active'; });
    var valid = cs.filter(isCardValid);
    return '<div class="card" style="margin-bottom:12px;border-left:3px solid ' + (valid.length ? 'var(--green)' : 'var(--red)') + '">' +
      '<div class="row-between"><div style="display:flex;align-items:center;gap:11px">' +
      '<div class="list-avatar" style="width:42px;height:42px;font-size:16px">' + m.name[0] + '</div>' +
      '<div><div style="font-size:16px;font-weight:700">' + esc(m.name) + '</div>' +
      '<div class="small muted">' + m.phone + ' · ' + m.gender + ' · 顾问 ' + staffName(m.advisor) + '</div></div></div>' +
      '<span class="badge ' + (valid.length ? 'b-green' : 'b-red') + '">' + (valid.length ? '卡有效' : '无有效卡') + '</span></div>' +
      (cs.length ? '<div class="mt12">' + cs.map(function (c) {
        var st = cardStatus(c);
        return '<div class="small row-between" style="padding:6px 0;border-top:1px solid var(--border)">' +
          '<span>' + tplOf(c.templateId).name + ' <span class="muted">' + remainText(c) + '</span></span>' +
          '<span class="badge ' + st.cls + '">' + st.t + '</span></div>';
      }).join('') + '</div>' : '<div class="small muted mt12">该会员尚未购买任何会员卡</div>') +
      '<div class="mt12" style="display:flex;gap:8px">' +
      '<button class="btn btn-primary btn-sm" data-act="do-checkin" data-id="' + m.id + '" ' + (valid.length ? '' : 'disabled') + '>确认入场</button>' +
      '<button class="btn btn-sm" data-act="open-member" data-id="' + m.id + '">查看档案</button></div></div>';
  }).join('');
}

PAGES.checkin = function () {
  var t = todayCheckins();
  return '<div class="page-head"><div><div class="page-title">入场签到</div>' +
    '<div class="page-desc">前台每天用得最多的页面：核验会员身份 → 系统自动判卡 → 一键确认入场</div></div></div>' +
    tip('这页是干什么的', '左边输入会员<b>手机号或姓名</b>搜索，系统会实时显示该会员的卡是否有效；点「确认入场」完成签到，并自动扣减次卡的次数。<br>右边是今天的入场流水，顶部会同步显示今天的到店人次。') +

    '<div class="grid g-1-2">' +
    '<div class="card"><div class="card-head"><div class="card-title">会员核验</div></div>' +
    '<div class="field"><label class="field-label">手机号 / 姓名</label>' +
    '<input type="search" placeholder="试试 13823410021" value="' + esc(state.checkinQuery || '') + '" oninput="ACTIONS.searchCheckin(this.value)"></div>' +
    '<div class="small muted">💡 演示提示：复制上面的手机号粘贴进去，或输入「陈」「林」等姓氏</div>' +
    '<div class="mt16" id="checkin-result">' + checkinResultHTML() + '</div></div>' +

    '<div class="card"><div class="card-head"><div class="card-title">今日入场记录</div>' +
      '<div class="card-sub">' + todayStr() + ' · 共 ' + t.length + ' 人次</div></div>' +
      (t.length ? '<div class="table-wrap"><table><thead><tr><th>时间</th><th>会员</th><th>手机号</th><th>核验卡</th><th>操作人</th></tr></thead><tbody>' +
        t.slice().reverse().map(function (c) {
          return '<tr><td class="small">' + c.time + '</td><td><b>' + esc(memberName(c.memberId)) + '</b></td>' +
            '<td class="muted small">' + esc((DB.data.members.find(function (m) { return m.id === c.memberId; }) || {}).phone) + '</td>' +
            '<td class="small">' + esc(c.cardText || '—') + '</td><td class="small muted">' + staffName(c.by) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="empty"><span class="emoji">🚪</span>今天还没有会员入场</div>') +
    '</div></div>';
};

/* ================= 6. 排课与预约 ================= */
var WEEK_TIMES = ['08:00', '10:00', '12:15', '15:00', '18:30', '19:40'];

function weekStart() {
  var off = ((TODAY.getDay() + 6) % 7);
  return addDays(TODAY, state.weekOffset * 7 - off);
}

PAGES.courses = function () {
  var start = weekStart();
  var days = [];
  for (var i = 0; i < 7; i++) {
    var d = addDays(start, i);
    days.push({ date: fmt(d), dow: ['一', '二', '三', '四', '五', '六', '日'][i], dd: d.getDate(), isToday: fmt(d) === todayStr() });
  }
  return '<div class="page-head"><div><div class="page-title">排课与预约</div>' +
    '<div class="page-desc">一周课程日历，点任意一节课程查看报名名单并进行核销</div></div>' +
    '<div class="page-head-actions">' +
    '<button class="btn btn-sm" data-act="week" data-v="-1">← 上一周</button>' +
    '<button class="btn btn-sm" data-act="week" data-v="0">本周</button>' +
    '<button class="btn btn-sm" data-act="week" data-v="1">下一周 →</button>' +
    '<button class="btn btn-primary btn-sm" data-act="new-sch">+ 新增排课</button></div></div>' +

    tip('这页是干什么的', '健身房的核心运营页面。格子里的每块是一节课，颜色区分团课（蓝）和私教（紫）。<b>点任意一节课程</b>可以看报名名单、做签到核销、取消预约。') +

    '<div class="card"><div class="card-head"><div class="card-title">' + fmt(start) + ' 至 ' + fmt(addDays(start, 6)) + '</div>' +
      '<div class="card-sub">周视图 · 每节课显示已约 / 容量</div></div>' +
      '<div class="week-grid">' +
      '<div></div>' + days.map(function (d) {
        return '<div class="week-head ' + (d.isToday ? 'today' : '') + '"><div class="dow">周' + d.dow + '</div><div class="date">' + d.dd + '日</div></div>';
      }).join('') +
      WEEK_TIMES.map(function (tm) {
        return '<div class="time-cell">' + tm + '</div>' + days.map(function (d) {
          var schs = DB.data.schedules.filter(function (s) { return s.date === d.date && s.time === tm; });
          return '<div class="slot">' + schs.map(function (s) {
            var c = courseOf(s.courseId);
            var full = s.booked >= s.capacity;
            var cls = c.kind === 'private' ? 'private' : (s.booked / s.capacity > 0.7 ? 'hot' : '');
            return '<div class="class-block ' + cls + (full ? ' full' : '') + '" data-act="open-sch" data-id="' + s.id + '">' +
              '<div class="cb-name">' + c.name + '</div>' +
              '<div class="cb-meta">' + staffName(s.coachId) + '</div>' +
              '<div class="cb-meta">' + s.booked + '/' + s.capacity + ' 人' + (full ? ' · 满' : '') + '</div></div>';
          }).join('') + '</div>';
        }).join('');
      }).join('') +
      '</div></div>';
};

/* ================= 7. 收银台 ================= */
PAGES.cashier = function () {
  var today = todayStr();
  var to = DB.data.orders.filter(function (o) { return o.date === today; }).slice(0, 12);
  var memberOpts = DB.data.members.map(function (m) {
    return '<option value="' + m.id + '" ' + (state.cashierMember === m.id ? 'selected' : '') + '>' + m.name + ' · ' + m.phone + '</option>';
  }).join('');
  var tplOpts = DB.data.templates.map(function (t) {
    return '<option value="' + t.id + '" ' + (state.cashierTpl === t.id ? 'selected' : '') + '>' + t.name + ' · ' + money(t.price) + '</option>';
  }).join('');
  var tpl = tplOf(state.cashierTpl || 'CT2');
  return '<div class="page-head"><div><div class="page-title">收银台</div>' +
    '<div class="page-desc">前台办卡收款的开单页面，开单后会员卡立即生效并计入销售业绩</div></div></div>' +
    tip('这页是干什么的', '标准收银流程：选会员 → 选卡 → 选支付方式 → 选成交的销售顾问 → 开单。<br>开单后数据会<b>同时</b>出现在四个地方：会员的持卡列表、经营看板的今日实收、财务的订单流水、那位销售的业绩榜。这就是所谓的<b>数据联动</b>。') +

    '<div class="grid g-1-2">' +
    '<div class="card"><div class="card-head"><div class="card-title">开单收款</div></div>' +
    '<div class="field"><label class="field-label">选择会员</label><select id="cs-member">' + memberOpts + '</select></div>' +
    '<div class="field"><label class="field-label">选择卡项</label><select id="cs-tpl" onchange="ACTIONS.pickTpl(this.value)">' + tplOpts + '</select>' +
    '<div class="field-hint">' + tpl.desc + '</div></div>' +
    '<div class="field"><label class="field-label">支付方式</label><select id="cs-pay">' +
    ['微信支付', '支付宝', '现金', '银行卡'].map(function (p) { return '<option>' + p + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label class="field-label">成交顾问（业绩归属）</label><select id="cs-sales">' +
    DB.data.staff.filter(function (s) { return s.role !== 'boss'; }).map(function (s) {
      return '<option value="' + s.id + '" ' + (s.id === 'S08' ? 'selected' : '') + '>' + s.name + ' · ' + s.title + (s.rate ? ' · 提成' + (s.rate * 100) + '%' : '') + '</option>';
    }).join('') + '</select></div>' +
    '<div class="card" style="background:var(--surface-2);border-style:dashed">' +
    '<div class="row-between"><span class="small muted">应收金额</span>' +
    '<span style="font-size:24px;font-weight:700;color:var(--accent)">' + money(tpl.price) + '</span></div>' +
    '<div class="small muted mt8">业绩提成估算：' + money(tpl.price * 0.08) + '（按所选顾问比例自动计算）</div></div>' +
    '<button class="btn btn-primary btn-block mt12" data-act="create-order">确认收款并开卡</button>' +
    '</div>' +

    '<div class="card"><div class="card-head"><div class="card-title">今日订单流水</div>' +
      '<div class="card-sub">' + today + '</div></div>' +
      (to.length ? '<div class="table-wrap"><table><thead><tr><th>单号</th><th>会员</th><th>项目</th><th>金额</th><th>支付</th><th>销售</th><th>时间</th></tr></thead><tbody>' +
        to.map(function (o) {
          return '<tr><td class="small muted">' + o.id + '</td><td><b>' + esc(memberName(o.memberId)) + '</b></td>' +
            '<td>' + esc(o.item) + '</td><td class="money pos">' + money(o.amount) + '</td>' +
            '<td class="small">' + o.pay + '</td><td class="small">' + staffName(o.salesId) + '</td>' +
            '<td class="small muted">' + o.date.slice(5) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="empty"><span class="emoji">🧾</span>今天还没有订单，试着在左边开一单</div>') +
    '</div></div>';
};

/* ================= 8. 财务与业绩 ================= */
PAGES.finance = function () {
  var tab = state.financeTab || 'orders';
  var body = '';
  if (tab === 'orders') {
    var total = DB.data.orders.reduce(function (s, o) { return s + o.amount; }, 0);
    body = '<div class="table-wrap"><table><thead><tr><th>单号</th><th>日期</th><th>会员</th><th>项目</th><th>类型</th><th>金额</th><th>支付</th><th>业绩归属</th></tr></thead><tbody>' +
      DB.data.orders.slice(0, 40).map(function (o) {
        return '<tr><td class="small muted">' + o.id + '</td><td class="small">' + o.date + '</td>' +
          '<td><b>' + esc(memberName(o.memberId)) + '</b></td><td>' + esc(o.item) + '</td>' +
          '<td><span class="badge ' + (o.type === 'card' ? 'b-blue' : 'b-gray') + '">' + (o.type === 'card' ? '会籍卡' : '零售/其他') + '</span></td>' +
          '<td class="money pos">' + money(o.amount) + '</td><td class="small">' + o.pay + '</td>' +
          '<td class="small">' + staffName(o.salesId) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="notice mt12" style="background:var(--green-soft);border-color:#c3e9d4;color:#166534">' +
      '<span class="n-ico">🧮</span><div>累计营收 <b>' + money(total) + '</b> · 共 ' + DB.data.orders.length + ' 笔订单 · 客单价 <b>' + money(Math.round(total / DB.data.orders.length)) + '</b></div></div>';
  } else if (tab === 'rank') {
    var map = {};
    DB.data.orders.forEach(function (o) { map[o.salesId] = (map[o.salesId] || 0) + o.amount; });
    var rank = Object.keys(map).map(function (k) { return { id: k, val: map[k] }; }).sort(function (a, b) { return b.val - a.val; });
    var mx = rank.length ? rank[0].val : 1;
    body = rank.map(function (r, i) {
      var s = DB.data.staff.find(function (x) { return x.id === r.id; }) || {};
      return '<div class="rank-row"><div class="rank-num ' + (i === 0 ? 'top' : '') + '">' + (i + 1) + '</div>' +
        '<div class="rank-body"><div class="rank-name"><span>' + (s.name || '未知') + ' <span class="small muted">' + (s.title || '') + '</span></span>' +
        '<span>' + money(r.val) + '</span></div>' +
        '<div class="rank-track"><div class="rank-fill ' + (i === 0 ? 'top' : '') + '" style="width:' + Math.round(r.val / mx * 100) + '%"></div></div></div>' +
        '<div class="small muted" style="width:72px;text-align:right">提成 ' + money(Math.round(r.val * (s.rate || 0))) + '</div></div>';
    }).join('');
  } else {
    var cmap = {};
    DB.data.ptSessions.forEach(function (p) { cmap[p.coachId] = (cmap[p.coachId] || 0) + 1; });
    body = '<div class="table-wrap"><table><thead><tr><th>教练</th><th>职称</th><th>累计核销课时</th><th>单节课时费</th><th>应结算金额</th></tr></thead><tbody>' +
      DB.data.staff.filter(function (s) { return s.role === 'coach'; }).map(function (s) {
        var n = cmap[s.id] || 0;
        return '<tr><td><b>' + s.name + '</b></td><td class="small muted">' + s.title + '</td>' +
          '<td>' + n + ' 节</td><td>' + money(s.coachFee) + '</td>' +
          '<td class="money">' + money(n * s.coachFee) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="small muted mt12">课时结算依据「私教课时核销记录」自动累计，每核销一节同步计入教练课时费。</div>';
  }
  return '<div class="page-head"><div><div class="page-title">财务与业绩</div>' +
    '<div class="page-desc">订单流水、员工业绩排行、教练课时结算</div></div></div>' +
    tip('这页是干什么的', '三个标签页：<b>订单流水</b>是每一笔钱的明细；<b>业绩排行</b>按销售顾问汇总签单额并算出提成；<b>课时结算</b>按教练核销节数算课时费。<br>这一页最能体现「财务口径自动计算」。') +
    '<div class="card"><div class="tabs">' +
    [['orders', '订单流水'], ['rank', '员工业绩榜'], ['pt', '教练课时结算']].map(function (t) {
      return '<div class="tab ' + (tab === t[0] ? 'active' : '') + '" data-act="fin-tab" data-v="' + t[0] + '">' + t[1] + '</div>';
    }).join('') + '</div>' + body + '</div>';
};

/* ================= 9. 员工管理 ================= */
PAGES.staff = function () {
  var counts = {};
  DB.data.staff.forEach(function (s) { counts[s.role] = (counts[s.role] || 0) + 1; });
  return '<div class="page-head"><div><div class="page-title">员工管理</div>' +
    '<div class="page-desc">员工档案与提成规则，教练课时费在这里配置</div></div></div>' +
    tip('这页是干什么的', '每个员工有<b>角色</b>（决定能看到哪些菜单）和<b>提成参数</b>（决定能拿多少钱）。点「编辑」可以现场改提成比例，改完财务页的业绩榜会跟着变——这是提成规则可配置的演示。') +
    '<div class="grid g3">' + DB.data.staff.map(function (s) {
      var rm = ROLE_META[s.role] || { label: s.role, color: 'gray' };
      return '<div class="card"><div class="row-between">' +
        '<div style="display:flex;align-items:center;gap:11px">' +
        '<div class="list-avatar" style="width:40px;height:40px">' + s.name[0] + '</div>' +
        '<div><div style="font-size:15px;font-weight:700">' + s.name + '</div>' +
        '<div class="small muted">' + s.title + '</div></div></div>' +
        '<span class="badge b-' + rm.color + '">' + rm.label + '</span></div>' +
        '<div class="grid g2 mt12" style="gap:8px">' +
        '<div><div class="small muted">入职</div><div class="small">' + s.join + '</div></div>' +
        '<div><div class="small muted">状态</div><div class="small">' + (s.status === 'on' ? '在职' : '离职') + '</div></div>' +
        '<div><div class="small muted">签单提成</div><div class="small">' + (s.rate ? (s.rate * 100) + '%' : '—') + '</div></div>' +
        '<div><div class="small muted">课时费</div><div class="small">' + (s.coachFee ? money(s.coachFee) + '/节' : '—') + '</div></div>' +
        '</div><div class="mt12"><button class="btn btn-xs" data-act="edit-staff" data-id="' + s.id + '">编辑参数</button></div></div>';
    }).join('') + '</div>';
};

/* ================= 10. 项目信息 ================= */
PAGES.about = function () {
  return '<div class="page-head"><div><div class="page-title">项目信息</div>' +
    '<div class="page-desc">' + PROJECT.name + ' · ' + PROJECT.version + '</div></div></div>' +

    '<div class="card"><div class="card-head"><div class="card-title">项目简介</div>' +
    '<div class="card-sub">' + PROJECT.license + ' License</div></div>' +
    '<div class="small" style="line-height:1.85">' + PROJECT.intro + '</div>' +
    '<div class="grid g4 mt16" style="gap:12px">' +
    PROJECT.highlights.map(function (h) {
      return '<div style="background:#F5F7FB;border-radius:8px;padding:14px 10px;text-align:center">' +
        '<div style="font-size:28px;font-weight:700;color:var(--primary)">' + h[0] + '</div>' +
        '<div class="small muted mt4">' + h[1] + '</div></div>';
    }).join('') + '</div>' +
    '<div class="small muted mt12">开源许可：' + PROJECT.license + '　|　建议运行环境：Chrome / Edge 任意现代版本</div></div>' +

    '<div class="grid g2 mt16">' +
    '<div class="card"><div class="card-head"><div class="card-title">技术选型</div></div>' +
    '<div class="table-wrap"><table><tbody>' +
    [['前端', 'HTML5 + CSS3 + 原生 JavaScript（零框架依赖）'],
    ['数据存储', 'localStorage（原型阶段）→ 二期迁移 MySQL'],
    ['架构模式', '单页应用 SPA · 状态驱动渲染'],
    ['权限模型', 'RBAC 角色访问控制（角色 → 菜单 → 数据）'],
    ['部署方式', '静态资源直接打开，无需服务器'],
    ['浏览器要求', 'Chrome / Edge / Firefox 任意现代版本']].map(function (r) {
      return '<tr><td style="width:96px"><b>' + r[0] + '</b></td><td class="small">' + r[1] + '</td></tr>';
    }).join('') + '</tbody></table></div></div>' +

    '<div class="card"><div class="card-head"><div class="card-title">目录结构</div></div>' +
    '<div class="table-wrap"><table><tbody>' +
    [['index.html', '单页应用入口'],
    ['assets/data.js', '实体定义、种子数据、存储层'],
    ['assets/app.js', '状态管理、路由、权限、公共组件'],
    ['assets/pages.js / pages2.js', '各业务页面渲染'],
    ['assets/actions.js', '业务动作与数据写回'],
    ['assets/member.js', '会员自助端'],
    ['assets/styles.css', '全局样式'],
    ['一键启动.bat', 'Windows 下双击运行']].map(function (r) {
      return '<tr><td style="width:150px"><b>' + r[0] + '</b></td><td class="small">' + r[1] + '</td></tr>';
    }).join('') + '</tbody></table></div></div>' +
    '</div>' +

    '<div class="card mt16"><div class="card-head"><div class="card-title">版本规划路线图</div>' +
      '<div class="card-sub">一期已完成，二三期为规划内容</div></div>' +
      '<div class="flow-steps">' +
      '<div class="flow-step" style="background:var(--green-soft)"><div class="fs-num">一</div><div class="fs-title">原型验证（本次）</div>' +
      '<div class="fs-desc">业务逻辑跑通 · 离线可演示</div></div>' +
      '<div class="flow-step"><div class="fs-num">二</div><div class="fs-title">前后端分离</div>' +
      '<div class="fs-desc">Vue3 + SpringBoot + MySQL</div></div>' +
      '<div class="flow-step"><div class="fs-num">三</div><div class="fs-title">云原生与多租户</div>' +
      '<div class="fs-desc">微服务 · 连锁 SaaS</div></div>' +
      '</div></div>';
};
