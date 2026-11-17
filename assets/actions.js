/* ============ 健身房管理系统 MVP · 交互动作 ============ */

function nowTime() {
  var d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function recalcSch(sid) {
  var s = DB.data.schedules.find(function (x) { return x.id === sid; });
  if (!s) return;
  s.booked = DB.data.bookings.filter(function (b) {
    return b.scheduleId === sid && (b.status === 'booked' || b.status === 'checked');
  }).length;
}

/* ---------- 会员检索 ---------- */
ACTIONS.searchMember = function (v) {
  state.search = v;
  var box = document.getElementById('members-table');
  if (box) box.innerHTML = membersTableHTML();
};
ACTIONS['filter-member'] = function (d) {
  state.filters.memberStatus = d.v; render();
};
ACTIONS['goto-member'] = function (d) { ACTIONS['open-member'](d); };

ACTIONS['open-member'] = function (d) {
  var m = DB.data.members.find(function (x) { return x.id === d.id; });
  if (!m) return;
  state.drawerMember = m.id;
  var cs = cardsOfMember(m.id);
  var os = DB.data.orders.filter(function (o) { return o.memberId === m.id; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 6);
  var ck = DB.data.checkins.filter(function (c) { return c.memberId === m.id; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 6);
  var fu = DB.data.followUps.filter(function (f) { return f.memberId === m.id; });
  var bks = DB.data.bookings.filter(function (b) { return b.memberId === m.id; }).slice(-5);
  var age = Math.floor(daysBetween(parseD(m.birth), TODAY) / 365);

  var html =
    '<div class="card"><div class="row-between">' +
    '<div style="display:flex;align-items:center;gap:13px">' +
    '<div class="list-avatar" style="width:52px;height:52px;font-size:20px">' + m.name[0] + '</div>' +
    '<div><div style="font-size:19px;font-weight:700">' + esc(m.name) + '</div>' +
    '<div class="small muted">' + m.phone + ' · ' + m.gender + ' · ' + age + ' 岁</div></div></div>' +
    '<span class="badge b-green">' + m.id + '</span></div>' +
    '<div class="grid g3 mt12" style="gap:10px">' +
    cell('入会日期', m.joinDate) + cell('会籍顾问', staffName(m.advisor)) + cell('来源渠道', m.source) +
    '</div></div>' +

    '<div class="card mt12"><div class="card-head"><div class="card-title">持有会员卡</div>' +
    '<div class="card-sub">' + cs.length + ' 张</div></div>' +
    (cs.length ? cs.map(function (c) {
      var st = cardStatus(c), t = tplOf(c.templateId);
      return '<div class="list-item"><div class="list-main">' +
        '<div class="list-title">' + t.name + ' <span class="badge ' + st.cls + '">' + st.t + '</span></div>' +
        '<div class="list-sub">' + remainText(c) + ' · 购于 ' + c.buyDate + (c.coachId ? ' · 教练 ' + staffName(c.coachId) : '') + '</div></div>' +
        '<div style="text-align:right"><div class="small muted">' + (c.endDate || '不限期') + '</div></div></div>';
    }).join('') : '<div class="empty"><span class="emoji">🎫</span>暂无会员卡</div>') + '</div>' +

    '<div class="grid g2 mt12" style="gap:12px">' +
    '<div class="card"><div class="card-head"><div class="card-title">消费记录</div></div>' +
    (os.length ? os.map(function (o) {
      return '<div class="list-item"><div class="list-main"><div class="list-title">' + esc(o.item) + '</div>' +
        '<div class="list-sub">' + o.date + ' · ' + o.pay + '</div></div>' +
        '<div class="money pos">' + money(o.amount) + '</div></div>';
    }).join('') : '<div class="empty">暂无消费</div>') + '</div>' +

    '<div class="card"><div class="card-head"><div class="card-title">入场记录</div></div>' +
    (ck.length ? ck.map(function (c) {
      return '<div class="list-item"><div class="list-main"><div class="list-title">' + c.date + ' ' + c.time + '</div>' +
        '<div class="list-sub">经手 ' + staffName(c.by) + '</div></div></div>';
    }).join('') : '<div class="empty">暂无入场记录</div>') + '</div>' +
    '</div>' +

    '<div class="card mt12"><div class="card-head"><div class="card-title">跟进笔记</div>' +
      '<div class="card-sub">教练与顾问记录，用于续卡时复盘</div></div>' +
      '<div class="field" style="margin-bottom:8px"><input type="text" id="fu-input" placeholder="写一条跟进记录，回车保存"></div>' +
      '<button class="btn btn-sm btn-primary" data-act="add-followup" data-id="' + m.id + '">保存笔记</button>' +
      '<div class="timeline mt12">' +
      (fu.length ? fu.slice().reverse().map(function (f) {
        return '<div class="tl-item"><div class="tl-time">' + f.date + ' · ' + staffName(f.staffId) + '</div>' +
          '<div class="tl-body">' + esc(f.content) + '</div></div>';
      }).join('') : '<div class="small muted">还没有跟进记录</div>') + '</div></div>';

  openDrawer(html, '会员详情 · ' + m.name);
};

function cell(l, v) {
  return '<div><div class="small muted">' + l + '</div><div style="font-weight:600">' + esc(v) + '</div></div>';
}

ACTIONS['add-followup'] = function (d) {
  var inp = document.getElementById('fu-input');
  if (!inp || !inp.value.trim()) { toast('请先输入跟进内容', 'err'); return; }
  DB.data.followUps.push({
    id: DB.nextId('F', DB.data.followUps), memberId: d.id, staffId: 'S08',
    date: todayStr(), content: inp.value.trim()
  });
  DB.save(); toast('跟进记录已保存', 'ok');
  ACTIONS['open-member'](d);
};

ACTIONS['new-member'] = function () {
  openModal(
    '<div class="field"><label class="field-label">姓名</label><input type="text" id="nm-name" placeholder="请输入会员姓名"></div>' +
    '<div class="field"><label class="field-label">手机号</label><input type="tel" id="nm-phone" placeholder="11 位手机号，将作为登录账号"></div>' +
    '<div class="field"><label class="field-label">性别</label><select id="nm-gender"><option>女</option><option>男</option></select></div>' +
    '<div class="field"><label class="field-label">出生日期</label><input type="date" id="nm-birth" value="1995-01-01"></div>' +
    '<div class="field"><label class="field-label">来源渠道</label><select id="nm-source">' +
    ['朋友介绍', '抖音团购', '到店咨询', '老会员推荐', '大众点评', '地推活动', '企业团单'].map(function (s) { return '<option>' + s + '</option>'; }).join('') +
    '</select></div>' +
    '<div class="field"><label class="field-label">会籍顾问</label><select id="nm-advisor">' +
    DB.data.staff.filter(function (s) { return s.rate > 0; }).map(function (s) { return '<option value="' + s.id + '">' + s.name + ' · ' + s.title + '</option>'; }).join('') +
    '</select></div>',
    {
      title: '新增会员档案',
      footer: '<button class="btn" onclick="closeModal()">取消</button>' +
        '<button class="btn btn-primary" onclick="ACTIONS.saveMember()">建档</button>'
    });
};

ACTIONS.saveMember = function () {
  var name = document.getElementById('nm-name').value.trim();
  var phone = document.getElementById('nm-phone').value.trim();
  if (!name || !phone) { toast('姓名和手机号不能为空', 'err'); return; }
  if (DB.data.members.some(function (m) { return m.phone === phone; })) { toast('该手机号已存在', 'err'); return; }
  var id = DB.nextId('M', DB.data.members);
  DB.data.members.push({
    id: id, name: name, phone: phone, gender: document.getElementById('nm-gender').value,
    birth: document.getElementById('nm-birth').value, advisor: document.getElementById('nm-advisor').value,
    source: document.getElementById('nm-source').value, joinDate: todayStr(), status: 'normal', note: ''
  });
  DB.save(); closeModal();
  toast('会员「' + name + '」建档成功，可到收银台为其办卡', 'ok');
  render();
};

ACTIONS['export-members'] = function () {
  var rows = [['会员编号', '姓名', '手机号', '性别', '出生日期', '入会日期', '有效卡数', '累计消费', '会籍顾问', '来源']];
  DB.data.members.forEach(function (m) {
    var valid = cardsOfMember(m.id).filter(isCardValid).length;
    var sum = DB.data.orders.filter(function (o) { return o.memberId === m.id; }).reduce(function (s, o) { return s + o.amount; }, 0);
    rows.push([m.id, m.name, m.phone, m.gender, m.birth, m.joinDate, valid, sum, staffName(m.advisor), m.source]);
  });
  var csv = '\ufeff' + rows.map(function (r) { return r.join(','); }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '会员名单_' + todayStr() + '.csv';
  a.click();
  toast('已导出 ' + (DB.data.members.length) + ' 条会员数据', 'ok');
};

/* ---------- 卡操作 ---------- */
ACTIONS['sell-card'] = function (d) {
  state.page = 'cashier'; state.cashierTpl = d.tpl; render();
  toast('已选中该卡项，请选择会员并确认收款');
};
ACTIONS.pickTpl = function (v) { state.cashierTpl = v; render(); };
ACTIONS['freeze-card'] = function (d) {
  var c = DB.data.memberships.find(function (x) { return x.id === d.id; });
  c.status = 'frozen'; DB.save(); toast('已停卡（正式版支持按天数顺延到期日）', 'ok'); render();
};
ACTIONS['unfreeze-card'] = function (d) {
  var c = DB.data.memberships.find(function (x) { return x.id === d.id; });
  c.status = 'active'; DB.save(); toast('已恢复该卡', 'ok'); render();
};

ACTIONS['create-order'] = function () {
  var mid = document.getElementById('cs-member').value;
  var tplId = document.getElementById('cs-tpl').value;
  var pay = document.getElementById('cs-pay').value;
  var sales = document.getElementById('cs-sales').value;
  var tpl = tplOf(tplId);
  var oid = DB.nextId('O', DB.data.orders);
  DB.data.orders.unshift({
    id: oid, memberId: mid, type: 'card', item: tpl.name, amount: tpl.price,
    pay: pay, salesId: sales, date: todayStr(), note: ''
  });
  var cid = DB.nextId('MC', DB.data.memberships);
  DB.data.memberships.push({
    id: cid, memberId: mid, templateId: tplId, buyDate: todayStr(),
    endDate: tpl.days ? fmt(addDays(TODAY, tpl.days)) : '',
    remaining: (tpl.type === 'period') ? null : tpl.total,
    total: tpl.total || null, coachId: tpl.type === 'private' ? 'S05' : '', status: 'active'
  });
  DB.save();
  toast('收款成功！会员卡已生效，订单号 ' + oid, 'ok');
  state.cashierMember = mid;
  render();
};

/* ---------- 入场签到 ---------- */
ACTIONS.searchCheckin = function (v) {
  state.checkinQuery = v;
  var box = document.getElementById('checkin-result');
  if (box) box.innerHTML = checkinResultHTML();
};

ACTIONS['do-checkin'] = function (d) {
  var valid = cardsOfMember(d.id).filter(isCardValid);
  if (!valid.length) { toast('该会员没有有效会员卡，入场被拦截', 'err'); return; }
  var countCard = valid.filter(function (c) { return tplOf(c.templateId).type === 'count'; })[0];
  var main = countCard || valid[0];
  if (countCard) countCard.remaining = Math.max(0, (countCard.remaining || 0) - 1);
  DB.data.checkins.push({
    id: DB.nextId('CI', DB.data.checkins), memberId: d.id, date: todayStr(), time: nowTime(),
    by: 'S03', cardId: main.id, cardText: tplOf(main.templateId).name
  });
  DB.save();
  toast('入场成功：' + memberName(d.id) + (countCard ? '（已扣 1 次，剩余 ' + countCard.remaining + ' 次）' : ''), 'ok');
  render();
};

/* ---------- 课程 ---------- */
ACTIONS.week = function (d) {
  state.weekOffset = d.v === '0' ? 0 : state.weekOffset + parseInt(d.v, 10);
  render();
};

ACTIONS['open-sch'] = function (d) {
  var s = DB.data.schedules.find(function (x) { return x.id === d.id; });
  if (!s) return;
  var c = courseOf(s.courseId);
  var bks = DB.data.bookings.filter(function (b) { return b.scheduleId === s.id; });
  var stMap = { booked: ['已预约', 'b-blue'], checked: ['已签到', 'b-green'], cancel: ['已取消', 'b-gray'], noshow: ['未到', 'b-red'] };
  var html =
    '<div class="card"><div class="row-between">' +
    '<div><div style="font-size:18px;font-weight:700">' + c.name + '</div>' +
    '<div class="small muted">' + s.date + ' ' + s.time + ' · ' + s.duration + '分钟 · 教练 ' + staffName(s.coachId) + '</div></div>' +
    '<div style="text-align:right"><div style="font-size:20px;font-weight:700">' + s.booked + '/' + s.capacity + '</div>' +
    '<div class="small muted">已约 / 容量</div></div></div>' +
    '<div class="bar-track mt12"><div class="bar-fill" style="width:' + Math.round(s.booked / s.capacity * 100) + '%"></div></div>' +
    '<div class="small muted mt8">消耗规则：' + (c.kind === 'private' ? '核销 1 节私教课时' : '核销 1 次人次') + '</div></div>' +

    '<div class="card mt12"><div class="card-head"><div class="card-title">报名名单</div>' +
    '<div class="card-sub">' + bks.length + ' 条记录</div></div>' +
    (bks.length ? '<div class="table-wrap"><table><thead><tr><th>会员</th><th>来源</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
      bks.map(function (b) {
        var st = stMap[b.status] || ['未知', 'b-gray'];
        return '<tr><td><b>' + esc(memberName(b.memberId)) + '</b></td>' +
          '<td class="small muted">' + b.via + '</td>' +
          '<td><span class="badge ' + st[1] + '">' + st[0] + '</span></td>' +
          '<td>' + (b.status === 'booked'
            ? '<div style="display:flex;gap:5px"><button class="btn btn-xs btn-primary" data-act="check-booking" data-id="' + b.id + '">签到核销</button>' +
            '<button class="btn btn-xs" data-act="cancel-booking" data-id="' + b.id + '">取消</button></div>'
            : '<span class="small muted">已完成</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty"><span class="emoji">🪑</span>这节课还没有人报名</div>') + '</div>';
  openDrawer(html, '课程详情 · ' + s.date);
};

ACTIONS['check-booking'] = function (d) {
  var b = DB.data.bookings.find(function (x) { return x.id === d.id; });
  if (!b) return;
  var s = DB.data.schedules.find(function (x) { return x.id === b.scheduleId; });
  var c = courseOf(s.courseId);
  if (c.kind === 'private') {
    var pc = cardsOfMember(b.memberId).filter(function (x) {
      return isCardValid(x) && tplOf(x.templateId).type === 'private';
    })[0];
    if (pc) {
      pc.remaining = Math.max(0, (pc.remaining || 0) - 1);
      DB.data.ptSessions.push({
        id: DB.nextId('PT', DB.data.ptSessions), memberId: b.memberId, coachId: s.coachId,
        cardId: pc.id, date: todayStr(), note: c.name
      });
    } else {
      toast('该会员无私教课时可用，无法核销', 'err'); return;
    }
  } else {
    var cc = cardsOfMember(b.memberId).filter(function (x) {
      return isCardValid(x) && tplOf(x.templateId).type === 'count';
    })[0];
    if (cc) cc.remaining = Math.max(0, (cc.remaining || 0) - 1);
  }
  b.status = 'checked';
  recalcSch(s.id);
  DB.save();
  toast('已核销：' + memberName(b.memberId) + ' · ' + c.name, 'ok');
  ACTIONS['open-sch']({ id: s.id });
  renderSidebar();
};

ACTIONS['cancel-booking'] = function (d) {
  var b = DB.data.bookings.find(function (x) { return x.id === d.id; });
  if (!b) return;
  b.status = 'cancel'; recalcSch(b.scheduleId); DB.save();
  toast('已取消预约（正式版会自动递补候补会员）');
  ACTIONS['open-sch']({ id: b.scheduleId });
  renderSidebar();
};

ACTIONS['new-sch'] = function () {
  var curseOpts = DB.data.courses.map(function (c) {
    return '<option value="' + c.id + '">' + c.name + '（' + c.duration + '分钟 · ' + c.capacity + '人）</option>';
  }).join('');
  var coachOpts = DB.data.staff.filter(function (s) { return s.role === 'coach'; }).map(function (s) {
    return '<option value="' + s.id + '">' + s.name + '</option>';
  }).join('');
  openModal(
    '<div class="field"><label class="field-label">课程</label><select id="ns-course">' + curseOpts + '</select></div>' +
    '<div class="field"><label class="field-label">授课教练</label><select id="ns-coach">' + coachOpts + '</select></div>' +
    '<div class="field"><label class="field-label">日期</label><input type="date" id="ns-date" value="' + todayStr() + '"></div>' +
    '<div class="field"><label class="field-label">时间</label><select id="ns-time">' +
    WEEK_TIMES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>',
    {
      title: '新增排课',
      footer: '<button class="btn" onclick="closeModal()">取消</button>' +
        '<button class="btn btn-primary" onclick="ACTIONS.saveSch()">保存</button>'
    });
};

ACTIONS.saveSch = function () {
  var courseId = document.getElementById('ns-course').value;
  var c = courseOf(courseId);
  var sid = DB.nextId('SCH', DB.data.schedules);
  DB.data.schedules.push({
    id: sid, courseId: courseId, coachId: document.getElementById('ns-coach').value,
    date: document.getElementById('ns-date').value, time: document.getElementById('ns-time').value,
    capacity: c.capacity, booked: 0, done: false
  });
  DB.save(); closeModal();
  toast('排课成功：' + c.name, 'ok');
  render();
};

/* ---------- 财务 ---------- */
ACTIONS['fin-tab'] = function (d) { state.financeTab = d.v; render(); };

/* ---------- 员工 ---------- */
ACTIONS['edit-staff'] = function (d) {
  var s = DB.data.staff.find(function (x) { return x.id === d.id; });
  openModal(
    '<div class="field"><label class="field-label">员工</label><input type="text" value="' + esc(s.name) + ' · ' + esc(s.title) + '" disabled></div>' +
    '<div class="field"><label class="field-label">签单提成比例（%）</label><input type="number" id="es-rate" value="' + (s.rate * 100) + '" min="0" max="100" step="0.5">' +
    '<div class="field-hint">修改后，「财务与业绩」页的提成会自动按新比例计算</div></div>' +
    '<div class="field"><label class="field-label">私教课时费（元/节）</label><input type="number" id="es-fee" value="' + s.coachFee + '" min="0" step="10"></div>' +
    '<div class="field"><label class="field-label">在职状态</label><select id="es-status">' +
    '<option value="on"' + (s.status === 'on' ? ' selected' : '') + '>在职</option>' +
    '<option value="off"' + (s.status === 'off' ? ' selected' : '') + '>离职</option></select></div>',
    {
      title: '编辑员工参数',
      footer: '<button class="btn" onclick="closeModal()">取消</button>' +
        '<button class="btn btn-primary" onclick="ACTIONS.saveStaff(\'' + s.id + '\')">保存</button>'
    });
};

ACTIONS.saveStaff = function (id) {
  var s = DB.data.staff.find(function (x) { return x.id === id; });
  s.rate = parseFloat(document.getElementById('es-rate').value) / 100 || 0;
  s.coachFee = parseFloat(document.getElementById('es-fee').value) || 0;
  s.status = document.getElementById('es-status').value;
  DB.save(); closeModal(); toast('参数已更新', 'ok'); render();
};
