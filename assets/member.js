/* ============ 健身房管理系统 MVP · 会员自助端 ============ */

function memberCards(mid) {
  return cardsOfMember(mid);
}
function myValidCard(mid) {
  return memberCards(mid).filter(isCardValid);
}

PAGES.mhome = function () {
  var m = curMember();
  var cs = memberCards(m.id);
  var valid = myValidCard(m.id);
  var today = todayStr();
  var schs = DB.data.schedules.filter(function (s) { return s.date === today; })
    .sort(function (a, b) { return a.time < b.time ? -1 : 1; });
  var myBk = DB.data.bookings.filter(function (b) {
    return b.memberId === m.id && (b.status === 'booked' || b.status === 'checked');
  });
  var mySchIds = myBk.map(function (b) { return b.scheduleId; });

  return '<div class="phone-appbar">' +
    '<div class="pa-title">你好，' + esc(m.name) + '</div>' +
    '<div class="pa-sub">' + m.id + ' · ' + (valid.length ? '会员有效' : '暂无有效会员卡') + ' · ' + m.gender + '</div>' +
    '</div>' +

    '<div class="m-card">' +
    '<div class="m-card-row"><span class="rt">我的会员卡</span>' +
    '<span class="rr">' + valid.length + ' 张有效 / 共 ' + cs.length + ' 张</span></div>' +
    (cs.length ? cs.map(function (c) {
      var t = tplOf(c.templateId), st = cardStatus(c);
      var pct = t.type === 'period'
        ? (c.endDate ? Math.max(0, Math.min(100, Math.round(daysLeft(c) / t.days * 100))) : 100)
        : (t.total ? Math.round((c.remaining || 0) / t.total * 100) : 0);
      var cls = st.t === '正常' || st.t === '即将到期' ? 'var(--primary)' : 'var(--text-3)';
      return '<div style="padding:11px 0;border-top:1px solid var(--border)">' +
        '<div class="row-between"><span style="font-weight:600">' + t.name + '</span>' +
        '<span class="badge ' + st.cls + '">' + st.t + '</span></div>' +
        '<div class="small muted" style="margin:5px 0 7px">' +
        (t.type === 'period'
          ? (c.endDate ? '有效期至 ' + c.endDate : '长期有效')
          : '剩余 ' + (c.remaining || 0) + (t.type === 'private' ? ' 节' : ' 次') + ' / 共 ' + t.total) + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + cls + '"></div></div>' +
        (daysLeft(c) != null && daysLeft(c) <= 7 && daysLeft(c) >= 0
          ? '<div class="small mt8" style="color:var(--amber);font-weight:600">⏰ 还有 ' + daysLeft(c) + ' 天到期，记得续费</div>' : '') +
        '</div>';
    }).join('') : '<div class="small muted">你还没有会员卡，可到前台办理</div>') +
    '</div>' +

    '<div class="m-section-title">今日课表</div>' +
    (schs.length ? schs.slice(0, 5).map(function (s) {
      var c = courseOf(s.courseId);
      var joined = mySchIds.indexOf(s.id) >= 0;
      var full = s.booked >= s.capacity;
      return '<div class="m-list-item">' +
        '<div class="list-avatar" style="background:var(--blue)">' + s.time.slice(0, 5) + '</div>' +
        '<div class="ml-body"><div class="ml-title">' + c.name + '</div>' +
        '<div class="ml-sub">' + staffName(s.coachId) + ' · ' + s.booked + '/' + s.capacity + ' 人</div></div>' +
        (joined ? '<span class="badge b-green">已预约</span>'
          : '<button class="btn btn-xs btn-accent" data-act="do-book" data-id="' + s.id + '" ' + (full || !valid.length ? 'disabled' : '') + '>' +
          (full ? '已满' : valid.length ? '预约' : '无卡') + '</button>') +
        '</div>';
    }).join('') : '<div class="small muted" style="padding:0 12px">今天没有排课</div>') +

    '<div class="m-card mt12" style="margin:16px 12px">' +
    '<div class="m-card-row"><span class="rt">本月到店</span><span class="rr">坚持就是胜利</span></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
    Array.from({ length: 14 }).map(function (_, i) {
      var d = fmt(addDays(TODAY, -13 + i));
      var has = DB.data.checkins.some(function (c) { return c.memberId === m.id && c.date === d; });
      return '<div title="' + d + '" style="width:20px;height:20px;border-radius:5px;background:' +
        (has ? 'var(--accent)' : '#eef1f5') + '"></div>';
    }).join('') + '</div>' +
    '<div class="small muted mt8" style="margin-top:8px">近 14 天到店打卡 · 橙色表示当天有到店</div></div>';
};

PAGES.mclass = function () {
  var m = curMember();
  var start = weekStart();
  var days = [];
  for (var i = 0; i < 7; i++) days.push(fmt(addDays(start, i)));
  var valid = myValidCard(m.id);
  var myBk = DB.data.bookings.filter(function (b) { return b.memberId === m.id; });
  var myMap = {};
  myBk.forEach(function (b) { myMap[b.scheduleId] = b; });

  var tabsHtml = '<div style="display:flex;gap:4px;background:#fff;margin:12px;padding:3px;border-radius:10px;border:1px solid var(--border)">' +
    days.map(function (d, i) {
      var isToday = d === todayStr();
      return '<div style="flex:1;text-align:center;padding:7px 0;border-radius:8px;font-size:11.5px;cursor:pointer;' +
        (isToday ? 'background:var(--primary);color:#fff;font-weight:700' : 'color:var(--text-2)') + '">' +
        '周' + ['一', '二', '三', '四', '五', '六', '日'][i] + '<br><span style="font-size:10px">' + d.slice(5) + '</span></div>';
    }).join('') + '</div>';

  var listHtml = days.map(function (d) {
    var schs = DB.data.schedules.filter(function (s) { return s.date === d; })
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; });
    if (!schs.length) return '';
    return '<div class="m-section-title">' + d + (d === todayStr() ? '（今天）' : '') + '</div>' +
      schs.map(function (s) {
        var c = courseOf(s.courseId);
        var b = myMap[s.id];
        var full = s.booked >= s.capacity;
        var state = b && (b.status === 'booked' || b.status === 'checked')
          ? '<span class="badge b-green">' + (b.status === 'checked' ? '已上课' : '已预约') + '</span>'
          : '<button class="btn btn-xs btn-accent" data-act="do-book" data-id="' + s.id + '" ' + (full || !valid.length ? 'disabled' : '') + '>' +
          (full ? '已满' : valid.length ? '预约' : '需购卡') + '</button>';
        return '<div class="m-list-item">' +
          '<div class="list-avatar" style="background:' + (c.kind === 'private' ? 'var(--purple)' : 'var(--blue)') + '">' + s.time.slice(0, 5) + '</div>' +
          '<div class="ml-body"><div class="ml-title">' + c.name + '</div>' +
          '<div class="ml-sub">' + staffName(s.coachId) + ' · ' + s.booked + '/' + s.capacity + ' 人 · ' + c.duration + '分钟</div></div>' +
          state + '</div>';
      }).join('');
  }).join('');

  var soon = myBk.filter(function (b) {
    var s = DB.data.schedules.find(function (x) { return x.id === b.scheduleId; });
    return s && b.status === 'booked' && daysBetween(TODAY, parseD(s.date)) >= 0;
  }).map(function (b) {
    var s = DB.data.schedules.find(function (x) { return x.id === b.scheduleId; });
    return { b: b, s: s };
  }).sort(function (a, b) { return a.s.date < b.s.date ? -1 : 1; });

  return '<div class="phone-appbar"><div class="pa-title">本周课表</div>' +
    '<div class="pa-sub">共 ' + DB.data.schedules.filter(function (s) { return days.indexOf(s.date) >= 0; }).length + ' 节课可选</div></div>' +
    tabsHtml + listHtml +
    (soon.length ? '<div class="m-section-title">我的预约（' + soon.length + '）</div>' +
      soon.slice(0, 6).map(function (x) {
        var c = courseOf(x.s.courseId);
        return '<div class="m-list-item"><div class="ml-body">' +
          '<div class="ml-title">' + c.name + ' · ' + x.s.time + '</div>' +
          '<div class="ml-sub">' + x.s.date + ' · ' + staffName(x.s.coachId) + '</div></div>' +
          '<button class="btn btn-xs" data-act="do-cancel" data-id="' + x.b.id + '">取消</button></div>';
      }).join('') : '');
};

PAGES.mmine = function () {
  var m = curMember();
  var os = DB.data.orders.filter(function (o) { return o.memberId === m.id; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var total = os.reduce(function (s, o) { return s + o.amount; }, 0);
  var visits = DB.data.checkins.filter(function (c) { return c.memberId === m.id; }).length;
  return '<div class="phone-appbar">' +
    '<div style="display:flex;align-items:center;gap:13px">' +
    '<div class="list-avatar" style="width:52px;height:52px;font-size:20px;background:rgba(255,255,255,.22)">' + m.name[0] + '</div>' +
    '<div><div class="pa-title">' + esc(m.name) + '</div><div class="pa-sub">' + m.phone + '</div></div></div></div>' +

    '<div class="m-card" style="display:flex;text-align:center">' +
    '<div style="flex:1"><div style="font-size:20px;font-weight:700">' + visits + '</div><div class="small muted">累计到店</div></div>' +
    '<div style="flex:1;border-left:1px solid var(--border);border-right:1px solid var(--border)">' +
    '<div style="font-size:20px;font-weight:700">' + Math.round(daysBetween(parseD(m.joinDate), TODAY) / 30) + '</div>' +
    '<div class="small muted">入会月数</div></div>' +
    '<div style="flex:1"><div style="font-size:20px;font-weight:700;color:var(--accent)">' + Math.round(total / 1000 * 10) / 10 + 'k</div>' +
    '<div class="small muted">累计消费</div></div></div>' +

    '<div class="m-section-title">消费记录</div>' +
    (os.length ? os.slice(0, 8).map(function (o) {
      return '<div class="m-list-item"><div class="ml-body">' +
        '<div class="ml-title">' + esc(o.item) + '</div><div class="ml-sub">' + o.date + ' · ' + o.pay + '</div></div>' +
        '<div class="money">' + money(o.amount) + '</div></div>';
    }).join('') : '<div class="small muted" style="padding:0 12px">暂无消费记录</div>') +

    '<div class="m-section-title">账户信息</div>' +
    '<div class="m-card" style="margin:0 12px">' +
    [['会员编号', m.id], ['出生日期', m.birth], ['入会日期', m.joinDate],
    ['来源渠道', m.source], ['专属顾问', staffName(m.advisor)]].map(function (r) {
      return '<div class="row-between" style="padding:8px 0;border-bottom:1px solid var(--border)">' +
        '<span class="small muted">' + r[0] + '</span><span class="small" style="font-weight:600">' + esc(r[1]) + '</span></div>';
    }).join('') +
    '<div class="mt12"><button class="btn btn-block btn-sm" data-act="switch-member">切换演示会员</button></div></div>';
};

/* ---------- 会员端动作 ---------- */
ACTIONS['do-book'] = function (d) {
  var m = curMember();
  var s = DB.data.schedules.find(function (x) { return x.id === d.id; });
  if (!s) return;
  var valid = myValidCard(m.id);
  if (!valid.length) { toast('你还没有有效会员卡，请先到前台办理', 'err'); return; }
  if (DB.data.bookings.some(function (b) {
    return b.scheduleId === s.id && b.memberId === m.id && (b.status === 'booked' || b.status === 'checked');
  })) { toast('你已经预约过这节课了', 'err'); return; }
  if (s.booked >= s.capacity) { toast('该课程已约满，可选择候补', 'err'); return; }
  DB.data.bookings.push({
    id: DB.nextId('B', DB.data.bookings), scheduleId: s.id, memberId: m.id,
    status: 'booked', via: '会员小程序'
  });
  recalcSch(s.id);
  DB.save();
  toast('预约成功：' + courseOf(s.courseId).name + ' ' + s.time, 'ok');
  render();
};

ACTIONS['do-cancel'] = function (d) {
  var b = DB.data.bookings.find(function (x) { return x.id === d.id; });
  if (!b) return;
  b.status = 'cancel'; recalcSch(b.scheduleId); DB.save();
  toast('已取消预约（开课前 2 小时内取消将记为未到）', 'ok');
  render();
};
