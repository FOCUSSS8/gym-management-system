/* ============ 健身房管理系统 MVP · 数据与存储 ============ */

/* ---------- 项目信息 ---------- */
var PROJECT = {
  name: '健身房管理系统',
  version: 'V1.0（MVP 原型版）',
  license: 'MIT',
  store: '示例门店 · 中山旗舰店',
  intro: '面向单店健身房的轻量化管理系统，覆盖会员、卡项、课程、收银、员工五条业务线，' +
    '按老板 / 店长 / 前台 / 教练 / 会员五类角色提供差异化权限，双击即可离线运行。',
  highlights: [
    ['13', '功能页面'],
    ['5', '角色权限'],
    ['9', '数据模型'],
    ['8', '业务模块']
  ]
};

/* ---------- 日期工具 ---------- */
var _now = new Date();
var TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());

function fmt(d) {
  var y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate();
  return y + '-' + (m < 10 ? '0' + m : m) + '-' + (dd < 10 ? '0' + dd : dd);
}
function addDays(base, n) { var d = new Date(base.getTime()); d.setDate(d.getDate() + n); return d; }
function parseD(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function daysBetween(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }
function todayStr() { return fmt(TODAY); }
function monthKey(s) { return s.slice(0, 7); }
function tplOf(id) {
  var t = CARD_TEMPLATES.find(function (x) { return x.id === id; });
  return t || { name: '未知卡项', type: 'period', price: 0 };
}

/* ---------- 员工 ---------- */
var STAFF = [
  { id: 'S01', name: '王海涛', role: 'boss', title: '总经理', phone: '13800138001', rate: 0, coachFee: 0, join: '2021-03-01', status: 'on' },
  { id: 'S02', name: '李静', role: 'manager', title: '店长', phone: '13800138002', rate: 0.02, coachFee: 0, join: '2021-06-15', status: 'on' },
  { id: 'S03', name: '张蕾', role: 'reception', title: '前台主管', phone: '13800138003', rate: 0.04, coachFee: 0, join: '2022-01-08', status: 'on' },
  { id: 'S04', name: '刘洋', role: 'reception', title: '前台', phone: '13800138004', rate: 0.03, coachFee: 0, join: '2023-04-20', status: 'on' },
  { id: 'S05', name: '陈锋', role: 'coach', title: '高级私教 · 力量塑形', phone: '13800138005', rate: 0.06, coachFee: 190, join: '2022-03-11', status: 'on' },
  { id: 'S06', name: '赵宇', role: 'coach', title: '私教 · 减脂体能', phone: '13800138006', rate: 0.06, coachFee: 170, join: '2022-09-01', status: 'on' },
  { id: 'S07', name: '孙悦', role: 'coach', title: '团操教练 · 瑜伽', phone: '13800138007', rate: 0.05, coachFee: 150, join: '2023-02-14', status: 'on' },
  { id: 'S08', name: '周敏', role: 'reception', title: '会籍顾问', phone: '13800138008', rate: 0.08, coachFee: 0, join: '2023-07-05', status: 'on' }
];

var ROLE_META = {
  boss: { label: '老板', color: 'purple' },
  manager: { label: '店长', color: 'purple' },
  reception: { label: '前台', color: 'blue' },
  coach: { label: '教练', color: 'green' }
};

/* ---------- 卡模板 ---------- */
var CARD_TEMPLATES = [
  { id: 'CT1', name: '月卡', type: 'period', price: 399, days: 30, desc: '30 天内不限次到店，含全部团课' },
  { id: 'CT2', name: '季卡', type: 'period', price: 1099, days: 90, desc: '90 天通卡，性价比最高' },
  { id: 'CT3', name: '年卡', type: 'period', price: 3299, days: 365, desc: '全年通卡，赠体测 4 次' },
  { id: 'CT4', name: '次卡 · 10 次', type: 'count', price: 299, total: 10, days: 180, desc: '半年有效，每次到店扣 1 次' },
  { id: 'CT5', name: '私教包 · 10 节', type: 'private', price: 2680, total: 10, coachFee: 190, desc: '一对一指导，绑定专属教练' },
  { id: 'CT6', name: '私教包 · 20 节', type: 'private', price: 4980, total: 20, coachFee: 190, desc: '长期训练计划首选' }
];

/* ---------- 课程库 ---------- */
var COURSES = [
  { id: 'C1', name: '动感单车', type: 'private_room', kind: 'group', duration: 45, capacity: 16, cost: 1, color: 'blue' },
  { id: 'C2', name: '流瑜伽', kind: 'group', duration: 60, capacity: 20, cost: 1, color: 'blue' },
  { id: 'C3', name: '搏击操', kind: 'group', duration: 50, capacity: 18, cost: 1, color: 'blue' },
  { id: 'C4', name: '普拉提', kind: 'group', duration: 55, capacity: 12, cost: 1, color: 'blue' },
  { id: 'C5', name: '核心训练', kind: 'group', duration: 40, capacity: 15, cost: 1, color: 'blue' },
  { id: 'C6', name: 'HIIT 燃脂', kind: 'group', duration: 45, capacity: 20, cost: 1, color: 'blue' },
  { id: 'C7', name: '私教 · 力量塑形', kind: 'private', duration: 60, capacity: 1, cost: 1, color: 'purple' },
  { id: 'C8', name: '私教 · 减脂体能', kind: 'private', duration: 60, capacity: 1, cost: 1, color: 'purple' }
];

/* ---------- 会员种子数据 ---------- */
var MEMBER_SEED = [
  { name: '陈自如', phone: '13823410021', gender: '女', birth: '1995-03-12', advisor: 'S08', source: '朋友介绍', joinDays: -412 },
  { name: '林招娣', phone: '13923410088', gender: '男', birth: '1992-11-05', advisor: 'S08', source: '抖音团购', joinDays: -86 },
  { name: '王梦琪', phone: '13623410567', gender: '女', birth: '1998-07-22', advisor: 'S02', source: '到店咨询', joinDays: -134 },
  { name: '赵启明', phone: '13523413210', gender: '男', birth: '1989-01-30', advisor: 'S08', source: '地推活动', joinDays: -360 },
  { name: '孙佳怡', phone: '13723419002', gender: '女', birth: '2000-05-18', advisor: 'S02', source: '老会员推荐', joinDays: -64 },
  { name: '吴泽凯', phone: '18823417765', gender: '男', birth: '1996-09-09', advisor: 'S08', source: '大众点评', joinDays: -211 },
  { name: '郑思远', phone: '13323415432', gender: '女', birth: '1994-12-01', advisor: 'S02', source: '朋友介绍', joinDays: -29 },
  { name: '黄振宇', phone: '18623418790', gender: '男', birth: '1991-04-27', advisor: 'S08', source: '抖音团购', joinDays: -153 },
  { name: '许文洁', phone: '13123416688', gender: '女', birth: '1997-08-14', advisor: 'S02', source: '到店咨询', joinDays: -48 },
  { name: '何俊熙', phone: '15023412345', gender: '男', birth: '1993-06-03', advisor: 'S08', source: '企业团单', joinDays: -276 },
  { name: '梁雨薇', phone: '15923410987', gender: '女', birth: '2001-02-19', advisor: 'S02', source: '老会员推荐', joinDays: -17 },
  { name: '罗天佑', phone: '18723413579', gender: '男', birth: '1988-10-11', advisor: 'S08', source: '地推活动', joinDays: -520 }
];

/* 每位会员购买的卡：[模板id, 距今购买天数, 剩余次数/课时(可选)] */
var MEMBER_CARDS_SEED = [
  [['CT3', -360], ['CT5', -70, 4]],
  [['CT1', -17]],
  [['CT4', -95, 3]],
  [['CT3', -360]],
  [['CT2', -64]],
  [['CT3', -180], ['CT6', -40, 11]],
  [['CT3', -29]],
  [['CT2', -88]],
  [['CT4', -30, 7]],
  [['CT3', -276]],
  [['CT1', -17]],
  [['CT3', -520]]
];

/* ---------- 初始数据构造 ---------- */
function buildSeed() {
  var members = [], memberships = [], orders = [], checkins = [], bookings = [], schedules = [], pts = [], follows = [];
  var mid = 1, cid = 1, oid = 1, bid = 1, sid = 1, pid = 1, fid = 1;
  var payWays = ['微信支付', '支付宝', '现金', '银行卡'];

  MEMBER_SEED.forEach(function (m, mi) {
    var memberId = 'M' + String(mid).padStart(3, '0'); mid++;
    members.push({
      id: memberId, name: m.name, phone: m.phone, gender: m.gender, birth: m.birth,
      advisor: m.advisor, source: m.source, joinDate: fmt(addDays(TODAY, m.joinDays)),
      status: 'normal', note: ''
    });

    MEMBER_CARDS_SEED[mi].forEach(function (cs) {
      var tpl = CARD_TEMPLATES.find(function (t) { return t.id === cs[0]; });
      var buyDate = addDays(TODAY, cs[1]);
      var end = tpl.days ? addDays(buyDate, tpl.days) : null;
      var remaining = cs[2] != null ? cs[2] : null;
      if (tpl.type === 'private' && remaining == null) remaining = Math.max(0, Math.floor(tpl.total * 0.6));
      if (tpl.type === 'count' && remaining == null) remaining = Math.max(0, tpl.total - 3);
      memberships.push({
        id: 'MC' + String(cid).padStart(3, '0'), cid, memberId: memberId, templateId: tpl.id,
        buyDate: fmt(buyDate), endDate: end ? fmt(end) : '',
        remaining: remaining, total: tpl.total || null,
        coachId: tpl.type === 'private' ? (parseInt(memberId.slice(1)) % 2 ? 'S05' : 'S06') : '',
        status: end && daysBetween(TODAY, end) <= 0 ? 'expired' : 'active'
      });
      cid++;
      orders.push({
        id: 'O' + String(oid).padStart(4, '0'), oid,
        memberId: memberId, type: 'card', item: tpl.name, amount: tpl.price,
        pay: payWays[(cid + oid) % 4], salesId: m.advisor, date: fmt(buyDate), note: '系统初始化数据'
      });
      oid++;
    });

    /* 近期入场记录 */
    var visits = 2 + (mi % 4);
    for (var v = 0; v < visits; v++) {
      var dd = addDays(TODAY, -(mi % 6) - v * 3);
      if (daysBetween(dd, TODAY) < 0) continue;
      var fc = memberships.filter(function (x) { return x.memberId === memberId; })[0];
      checkins.push({
        id: 'CI' + String(sid).padStart(4, '0'), memberId: memberId, date: fmt(dd),
        time: [7, 8, 12, 18, 19, 20][(mi + v) % 6] + ':' + ['05', '20', '40', '10', '30', '55'][(mi + v) % 6],
        by: 'S03', cardId: fc ? fc.id : '', cardText: fc ? tplOf(fc.templateId).name : '—'
      });
      sid++;
    }
  });

  /* 额外散单（零售、体测等） */
  for (var x = 0; x < 6; x++) {
    var mm = members[x * 2];
    var od = addDays(TODAY, -(x * 4 + 1));
    orders.push({
      id: 'O' + String(oid).padStart(4, '0'), oid, memberId: mm.id,
      type: 'other', item: ['运动补剂', '体测服务', '私教体验课', '储物柜月租'][x % 4],
      amount: [128, 99, 199, 30][x % 4], pay: payWays[x % 4], salesId: x % 2 ? 'S03' : 'S08',
      date: fmt(od), note: '系统初始化数据'
    });
    oid++;
  }

  /* 历史营收散单：保证近半年每月都有收入，看板柱状图不会断档 */
  [[1, 'CT1', -40], [3, 'CT1', -70], [5, 'CT2', -100], [7, 'CT1', -130],
   [9, 'CT1', -160], [0, 'CT2', -35], [10, 'CT1', -20], [11, 'CT2', -55]].forEach(function (p) {
    var mm = members[p[0]];
    var tpl = CARD_TEMPLATES.find(function (t) { return t.id === p[1]; });
    var d0 = addDays(TODAY, p[2]);
    var end0 = addDays(d0, tpl.days);
    var cn = String(memberships.length + 1).padStart(3, '0');
    memberships.push({
      id: 'MC' + cn, cid: parseInt(cn, 10), memberId: mm.id, templateId: tpl.id,
      buyDate: fmt(d0), endDate: fmt(end0), remaining: null, total: null,
      coachId: '', status: daysBetween(TODAY, end0) >= 0 ? 'active' : 'expired'
    });
    orders.push({
      id: 'O' + String(oid).padStart(4, '0'), oid: oid, memberId: mm.id, type: 'card',
      item: tpl.name, amount: tpl.price, pay: payWays[p[0] % 4],
      salesId: ['S08', 'S02', 'S03'][p[0] % 3], date: fmt(d0), note: ''
    });
    oid++;
  });

  /* 本周排课（今天 -3 天 ~ 未来 6 天） */
  var TIMES = ['08:00', '10:00', '12:15', '15:00', '18:30', '19:40'];
  var PATTERN = [
    { c: 'C1', coach: 'S05' }, { c: 'C2', coach: 'S07' }, { c: 'C3', coach: 'S06' },
    { c: 'C4', coach: 'S07' }, { c: 'C6', coach: 'S06' }, { c: 'C5', coach: 'S05' }
  ];
  for (var d = -3; d <= 6; d++) {
    var day = addDays(TODAY, d);
    var dow = day.getDay();
    PATTERN.forEach(function (p, pi) {
      if ((dow + pi) % 3 === 2 && pi > 3) return;
      var cap = COURSES.find(function (c) { return c.id === p.c; }).capacity;
      var booked = Math.max(0, Math.floor(cap * (0.3 + ((d + pi * 7) % 10) / 14)));
      schedules.push({
        id: 'SCH' + String(bid).padStart(4, '0'), courseId: p.c, coachId: p.coach,
        date: fmt(day), time: TIMES[pi], capacity: cap, booked: 0, done: false
      });
      /* 报名明细 */
      var start = (pi * 3 + Math.abs(d) * 2) % members.length;
      for (var k = 0; k < booked; k++) {
        var mb = members[(start + k) % members.length];
        if (!mb) continue;
        var isPast = d < 0;
        bookings.push({
          id: 'B' + String(pid).padStart(4, '0'), scheduleId: 'SCH' + String(bid).padStart(4, '0'),
          memberId: mb.id, status: isPast ? (k % 7 === 0 ? 'noshow' : 'checked') : (k % 9 === 0 ? 'cancel' : 'booked'),
          via: k % 3 === 0 ? '会员小程序' : '前台代约'
        });
        pid++;
      }
      var sch = schedules[schedules.length - 1];
      sch.booked = bookings.filter(function (b) {
        return b.scheduleId === sch.id && (b.status === 'booked' || b.status === 'checked');
      }).length;
      bid++;
    });
  }

  /* 私教课时核销记录 */
  members.filter(function (m) { return ['M001', 'M006'].indexOf(m.id) >= 0; }).forEach(function (m) {
    var mc = memberships.filter(function (x) {
      return x.memberId === m.id && (x.templateId === 'CT5' || x.templateId === 'CT6');
    })[0];
    if (!mc) return;
    var used = (mc.total || 10) - (mc.remaining || 0);
    for (var i = 0; i < used; i++) {
      pts.push({
        id: 'PT' + String(fid).padStart(4, '0'), memberId: m.id, coachId: mc.coachId,
        cardId: mc.id, date: fmt(addDays(TODAY, -(used - i) * 5 - 2)), note: '常规训练'
      });
      fid++;
    }
  });

  /* 跟进记录 */
  follows.push(
    { id: 'F001', memberId: 'M001', staffId: 'S05', date: fmt(addDays(TODAY, -6)), content: '腰部不适，训练计划调整为低冲击动作' },
    { id: 'F002', memberId: 'M003', staffId: 'S08', date: fmt(addDays(TODAY, -3)), content: '次卡仅剩 3 次，电话邀约续卡' },
    { id: 'F003', memberId: 'M004', staffId: 'S08', date: fmt(addDays(TODAY, -1)), content: '年卡即将到期，已发送续费方案' },
    { id: 'F004', memberId: 'M011', staffId: 'S08', date: fmt(addDays(TODAY, -2)), content: '新会员首周到店 3 次，适应良好' }
  );

  /* 保证"今天"有充足的演示数据，看板数字才有说服力 */
  var tStr = fmt(TODAY);
  [[0, '07:05'], [1, '08:20'], [2, '12:40'], [3, '18:10'], [4, '18:35'],
   [5, '19:05'], [6, '19:40'], [7, '20:15'], [8, '07:50']].forEach(function (v, i) {
    var m = members[v[0]];
    if (!m) return;
    var c = memberships.filter(function (x) { return x.memberId === m.id; })[0];
    checkins.push({
      id: 'CI9' + String(i).padStart(3, '0'), memberId: m.id, date: tStr, time: v[1],
      by: i % 2 ? 'S03' : 'S04', cardId: c ? c.id : '', cardText: c ? tplOf(c.templateId).name : '—'
    });
  });

  [[4, 'CT6'], [6, 'CT1'], [8, 'CT2']].forEach(function (p, i) {
    var mm = members[p[0]];
    var tpl = CARD_TEMPLATES.find(function (t) { return t.id === p[1]; });
    var cn = String(memberships.length + 1).padStart(3, '0');
    memberships.push({
      id: 'MC' + cn, cid: parseInt(cn, 10), memberId: mm.id, templateId: tpl.id,
      buyDate: tStr, endDate: tpl.days ? fmt(addDays(TODAY, tpl.days)) : '',
      remaining: tpl.type === 'period' ? null : tpl.total, total: tpl.total || null,
      coachId: tpl.type === 'private' ? 'S06' : '', status: 'active'
    });
    orders.push({
      id: 'O9' + String(i).padStart(3, '0'), oid: 900 + i, memberId: mm.id, type: 'card',
      item: tpl.name, amount: tpl.price, pay: ['微信支付', '支付宝', '银行卡'][i],
      salesId: ['S08', 'S02', 'S03'][i], date: tStr, note: '今日新签单'
    });
  });

  orders.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return {
    members: members, memberships: memberships, orders: orders, checkins: checkins,
    bookings: bookings, schedules: schedules, ptSessions: pts, followUps: follows,
    staff: STAFF, templates: CARD_TEMPLATES, courses: COURSES
  };
}

/* ---------- 存储层（localStorage 不可用时自动降级到内存） ---------- */
var STORE_KEY = 'gym_mvp_data_v1';
var MEM_STORE = {};
var HAS_LS = (function () {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch (e) { return false; }
})();
function lsGet(k) { try { return HAS_LS ? localStorage.getItem(k) : (MEM_STORE[k] || null); } catch (e) { return MEM_STORE[k] || null; } }
function lsSet(k, v) { try { if (HAS_LS) localStorage.setItem(k, v); else MEM_STORE[k] = v; } catch (e) { MEM_STORE[k] = v; } }

var DB = {
  data: null,
  load: function () {
    var raw = lsGet(STORE_KEY);
    if (raw) {
      try { this.data = JSON.parse(raw); return; } catch (e) { }
    }
    this.reset();
  },
  save: function () { lsSet(STORE_KEY, JSON.stringify(this.data)); },
  reset: function () { this.data = buildSeed(); this.save(); },
  nextId: function (prefix, arr) {
    var max = 0;
    arr.forEach(function (x) {
      var n = parseInt(String(x.id).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return prefix + String(max + 1).padStart(4, '0');
  }
};
