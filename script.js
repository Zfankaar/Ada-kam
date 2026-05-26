/* ─── SUPABASE ─── */

var SUPABASE_URL = 'https://pxsdcnsuqgarknbaczsd.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4c2RjbnN1cWdhcmtuYmFjenNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTM0MjEsImV4cCI6MjA5NTE4OTQyMX0.oEDW_8Rgahqcp775C-ZtXNqu9rx26Bc1SYALXj7JXYM';
var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ─── URL REFERRAL ─── */

var _urlRefCode = '';

(function checkUrlRef() {
  var hash = window.location.hash;
  if (hash && hash.length > 1) {
    _urlRefCode = hash.substring(1).toUpperCase();
  }
})();

/* ─── LOCAL STORAGE ─── */

var LS_KEY = 'adaKamUser';
var WD_KEY = 'adaKamWithdrawals';
var DAILY_KEY = 'adaKamDaily';

var DAILY_LIMIT = 50;

function getDailyData() {
  try {
    var raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      var today = new Date().toDateString();
      if (data.date === today) return data;
    }
  } catch (e) {}
  return { date: new Date().toDateString(), count: 0, earned: 0 };
}

function getDailyAds() {
  return getDailyData().count || 0;
}

function getDailyEarned() {
  return getDailyData().earned || 0;
}

function incrementDailyAds(amount) {
  try {
    var data = getDailyData();
    data.count = (data.count || 0) + 1;
    data.earned = (data.earned || 0) + amount;
    localStorage.setItem(DAILY_KEY, JSON.stringify(data));
  } catch (e) {}
}

function updateDailyDisplay() {
  var count = getDailyAds();
  var earned = getDailyEarned();
  document.getElementById('adDailyCount').textContent = count + ' / ' + DAILY_LIMIT;
  document.getElementById('adDailyEarned').textContent = 'Rs' + earned.toFixed(2);
  document.getElementById('adProgressFill').style.width = Math.min(100, (count / DAILY_LIMIT) * 100) + '%';
}

function clearDailyAds() {
  try { localStorage.removeItem(DAILY_KEY); } catch (e) {}
}

function saveLocalUser(email, accType, accName, accNum) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      email: email,
      acc_type: accType,
      acc_name: accName,
      acc_num: accNum
    }));
  } catch (e) {}
}

function loadLocalUser() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function clearLocalUser() {
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
}

function saveLocalWithdrawal(amount) {
  try {
    var list = loadLocalWithdrawals();
    var now = new Date();
    list.unshift({
      amount: amount,
      date: now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending'
    });
    localStorage.setItem(WD_KEY, JSON.stringify(list));
  } catch (e) {}
}

function loadLocalWithdrawals() {
  try {
    var raw = localStorage.getItem(WD_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function clearLocalWithdrawals() {
  try { localStorage.removeItem(WD_KEY); } catch (e) {}
}

/* ─── PAGE NAV ─── */

function show(id) {
  var pages = ['landingPage', 'signupPage', 'loginPage', 'appPage'];
  for (var i = 0; i < pages.length; i++) {
    document.getElementById(pages[i]).classList.add('off');
  }
  document.getElementById(id).classList.remove('off');
}

function goHome() { show('landingPage'); }
function showSignup() {
  _authUserId = null;
  document.getElementById('step1').classList.remove('off');
  document.getElementById('step2').classList.add('off');
  document.getElementById('step3').classList.add('off');
  document.getElementById('signupEmail').value = '';
  document.getElementById('signupPass').value = '';
  document.getElementById('signupConfirm').value = '';
  document.getElementById('stepAccName').value = '';
  document.getElementById('stepAccNum').value = '';
  document.getElementById('referCode').value = '';
  document.getElementById('referMsg').textContent = '';
  document.getElementById('referCode').disabled = false;
  document.getElementById('referCode').style.opacity = '1';
  var m = document.querySelectorAll('.step-method');
  for (var i = 0; i < m.length; i++) m[i].classList.remove('active');

  if (_urlRefCode) {
    document.getElementById('referCode').value = _urlRefCode;
    document.getElementById('referCode').disabled = true;
    document.getElementById('referCode').style.opacity = '0.6';
    document.getElementById('skipBtn').classList.add('off');
  } else {
    document.getElementById('skipBtn').classList.remove('off');
  }

  show('signupPage');
}
function showLogin() { show('loginPage'); }

/* ─── PASSWORD TOGGLE ─── */

function togglePass(id, el) {
  var inp = document.getElementById(id);
  if (inp.type === 'password') {
    inp.type = 'text';
    el.textContent = 'hide';
  } else {
    inp.type = 'password';
    el.textContent = 'show';
  }
}

/* ─── STEPS ─── */

var _stepEmail, _stepPass;
var _authUserId = null;

async function goStep2() {
  var email = document.getElementById('signupEmail').value.trim();
  var pass = document.getElementById('signupPass').value;
  var confirm = document.getElementById('signupConfirm').value;
  if (!email || !pass || !confirm) { toast('fill all fields'); return; }
  if (pass.length < 8) { toast('password min 8 characters'); return; }
  if (pass !== confirm) { toast('passwords do not match'); return; }

  showLoading('creating account');
  var { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: pass
  });
  hideLoading();

  if (authError) {
    toast(authError.message);
    return;
  }

  if (!authData.user) {
    toast('check your email for confirmation');
    return;
  }

  _stepEmail = email;
  _stepPass = pass;
  _authUserId = authData.user.id;

  document.getElementById('step1').classList.add('off');
  document.getElementById('step2').classList.remove('off');
}

function pickMethod(m) {
  var items = document.querySelectorAll('.step-method');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
  var map = { easypaisa: 0, jazzcash: 1 };
  items[map[m]].classList.add('active');
}

async function goStep3() {
  var active = document.querySelector('.step-method.active');
  if (!active) { toast('select a payment method'); return; }
  var name = document.getElementById('stepAccName').value.trim();
  var num = document.getElementById('stepAccNum').value.trim();
  if (!name) { toast('enter account name'); return; }
  if (!num) { toast('enter account number'); return; }

  showLoading('saving info');
  var type = active.querySelector('input').value;
  var refCode = _authUserId.replace(/-/g, '').substring(0, 10).toUpperCase();
  var signupBonus = 10;
  var { error: insertError } = await supabase.from('users').insert({
    id: _authUserId,
    email: _stepEmail,
    acc_type: type,
    acc_name: name,
    acc_num: num,
    balance: signupBonus,
    referral_code: refCode
  });
  hideLoading();

  if (insertError) {
    toast(insertError.message);
    return;
  }

  document.getElementById('step2').classList.add('off');
  document.getElementById('step3').classList.remove('off');
}

async function finishSignup() {
  var active = document.querySelector('.step-method.active');
  var type = active ? active.querySelector('input').value : '';
  var name = document.getElementById('stepAccName').value.trim();
  var num = document.getElementById('stepAccNum').value.trim();

  var refCode = document.getElementById('referCode').value.trim().toUpperCase();
  var bonus = 0;
  var referredById = null;

  if (refCode) {
    if (VALID_CODES[refCode]) {
      bonus = 0.50;
    } else {
      var { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', refCode)
        .maybeSingle();
      if (referrer) {
        referredById = referrer.id;
      }
    }
  }

  if (referredById) {
    await supabase.from('users').update({ referred_by: referredById }).eq('id', _authUserId);
  }

  var totalBalance = 10 + bonus;

  if (bonus > 0) {
    showLoading('adding bonus');
    var newBal = 10 + bonus;
    var { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBal })
      .eq('id', _authUserId);
    hideLoading();
    if (updateError) console.error(updateError);
  }

  balance = totalBalance;
  updateDisplay();

  show('appPage');
  await setUser({ email: _stepEmail, id: _authUserId }, type, name, num);
  toast('welcome to ada kam');
}

async function handleLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass = document.getElementById('loginPass').value.trim();
  if (!email || !pass) { toast('fill all fields'); return; }
  showLoading('signing in');

  var { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: pass
  });

  if (error) {
    hideLoading();
    toast(error.message);
    return;
  }

  var { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (fetchError) {
    hideLoading();
    toast('account data not found');
    return;
  }

  balance = userData.balance || 0;
  totalEarned = userData.total_earned || 0;
  updateDisplay();

  hideLoading();
  show('appPage');
  await setUser(data.user, userData.acc_type, userData.acc_name, userData.acc_num);
  toast('welcome back');
}

async function setUser(user, accType, accName, accNum) {
  if (!user) {
    document.getElementById('profileSigned').classList.add('off');
    document.getElementById('profileGuest').classList.remove('off');
    return;
  }

  var displayName = user.email.split('@')[0];
  document.getElementById('profileName').textContent = displayName;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('avatarLetter').textContent = user.email.charAt(0).toUpperCase();
  document.getElementById('profileSigned').classList.remove('off');
  document.getElementById('profileGuest').classList.add('off');
  document.getElementById('profileBtn').textContent = 'sign out';

  window._userAccType = accType || '';
  window._userAccName = accName || '';
  window._userAccNum = accNum || '';

  var payDetail = (accType ? accType + ' — ' + (accName || '') + ' — ' + (accNum || '') : '—');
  document.getElementById('payDetail').textContent = payDetail;

  saveLocalUser(user.email, accType, accName, accNum);

  document.getElementById('profileBtn').onclick = async function () {
    showLoading('signing out');
    var { error } = await supabase.auth.signOut();
    if (error) console.error(error);
    balance = 0;
    totalEarned = 0;
    adsWatched = 0;
    clearLocalUser();
    clearLocalWithdrawals();
    clearDailyAds();
    document.getElementById('profileSigned').classList.add('off');
    document.getElementById('profileGuest').classList.remove('off');
    hideLoading();
    updateDisplay();
    document.getElementById('earningsList').innerHTML = '<p class="empty">no earnings yet</p>';
    document.getElementById('walletList').innerHTML = '<p class="empty">no transactions yet</p>';
    goHome();
    toast('signed out');
  };
  await loadReferralStats();
  switchTab('home');
}

/* ─── TABS ─── */

var screens = ['screenHome', 'screenTasks', 'screenWallet', 'screenProfile'];
var tabs = ['tabHome', 'tabTasks', 'tabWallet', 'tabProfile'];

function switchTab(tab) {
  for (var i = 0; i < screens.length; i++) {
    document.getElementById(screens[i]).classList.add('off');
    document.getElementById(tabs[i]).classList.remove('act');
  }
  var map = { home: 0, tasks: 1, wallet: 2, profile: 3 };
  var idx = map[tab] || 0;
  document.getElementById(screens[idx]).classList.remove('off');
  document.getElementById(tabs[idx]).classList.add('act');

  if (tab !== 'profile') {
    document.getElementById('panelHistory').classList.add('off');
    document.getElementById('panelHelp').classList.add('off');
    document.getElementById('profileSigned').classList.remove('off');
  }

  ['Ad', 'Register', 'Like', 'Review', 'Youtube'].forEach(function(t) {
    document.getElementById('task' + t + 'View').classList.add('off');
  });
  document.getElementById('taskMenu').classList.remove('off');
  resetAdCoins();
}

/* ─── TASK CATEGORIES ─── */

function openTask(type) {
  document.getElementById('taskMenu').classList.add('off');
  document.getElementById('task' + type.charAt(0).toUpperCase() + type.slice(1) + 'View').classList.remove('off');
  if (type === 'ad') updateDailyDisplay();
}

function closeTask(type) {
  document.getElementById('task' + type.charAt(0).toUpperCase() + type.slice(1) + 'View').classList.add('off');
  document.getElementById('taskMenu').classList.remove('off');
  if (type === 'ad') resetAdCoins();
}

function resetAdCoins() {
  var coins = document.getElementById('adCoins');
  if (coins) {
    var dots = coins.querySelectorAll('span');
    for (var d = 0; d < dots.length; d++) dots[d].classList.remove('lit');
  }
}

/* ─── APP ─── */

var balance = 0;
var totalEarned = 0;
var adsWatched = 0;
var cooldown = false;

function updateDisplay() {
  var b = 'Rs' + balance.toFixed(2);
  document.getElementById('balanceDisplay').textContent = b;
  document.getElementById('balanceDisplay2').textContent = b;
  document.getElementById('balanceDisplay3').textContent = b;
  document.getElementById('balanceDisplay4').textContent = b;
  document.getElementById('walletAmount').textContent = balance.toFixed(2);
  document.getElementById('profileAds').textContent = adsWatched;
  document.getElementById('profileEarned').textContent = 'Rs' + (balance + totalEarned).toFixed(2);
  var te = document.getElementById('refTotalEarned');
  if (te) te.textContent = 'Rs' + (balance + totalEarned).toFixed(2);
}

function watchAd() {
  if (cooldown) return;

  if (getDailyAds() >= DAILY_LIMIT) {
    toast('daily limit reached — ' + DAILY_LIMIT + ' ads per day');
    return;
  }

  var btn = document.getElementById('watchBtn');
  var label = document.getElementById('adLabel');
  var earn = document.getElementById('adEarn');
  var timer = document.getElementById('timerDisplay');

  showLoading('loading ad');
  setTimeout(function () {
    hideLoading();
    btn.disabled = true;
    cooldown = true;

    label.textContent = 'playing...';
    earn.textContent = '+Rs0.10';
    timer.textContent = '3';

    var coins = document.getElementById('adCoins');
    if (coins) {
      var dots = coins.querySelectorAll('span');
      for (var d = 0; d < dots.length; d++) dots[d].classList.remove('lit');
    }

    var count = 3;
    var interval = setInterval(function () {
      count--;
      timer.textContent = count;
      if (coins && count >= 0) {
        var dots = coins.querySelectorAll('span');
        if (dots[2 - count]) dots[2 - count].classList.add('lit');
      }
      if (count <= 0) {
        clearInterval(interval);
        timer.textContent = '';
        label.textContent = 'tap to watch';
        earn.textContent = '+Rs0.10';
        cooldown = false;
        btn.disabled = false;
        addEarning();
      }
    }, 1000);
  }, 600);
}

async function addEarning() {
  adsWatched++;
  var reward = 0.10;
  incrementDailyAds(reward);
  updateDailyDisplay();
  updateDisplay();

  var list = document.getElementById('earningsList');
  var empty = list.querySelector('.empty');
  if (empty) empty.remove();

  var now = new Date();
  var time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  var p = document.createElement('p');
  var left = document.createElement('span');
  left.textContent = '+Rs0.10';

  var right = document.createElement('span');
  right.textContent = time;
  right.style.color = '#9a8f83';
  p.appendChild(left);
  p.appendChild(right);
  list.insertBefore(p, list.firstChild);

  toast('+Rs0.10');

  var { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  var { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userData) {
    balance = (userData.balance || 0) + reward;
    await supabase.from('users').update({ balance: balance }).eq('id', user.id);

    if (userData.referred_by) {
      var commission = 0.01;
      var { data: refData } = await supabase
        .from('users')
        .select('total_earned')
        .eq('id', userData.referred_by)
        .single();
      if (refData) {
        var newTotal = (refData.total_earned || 0) + commission;
        await supabase.from('users').update({ total_earned: newTotal }).eq('id', userData.referred_by);
      }
    }

    updateDisplay();
  }
}

/* ─── REFERRAL HOME ─── */

async function loadReferralStats() {
  var { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  var { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userData) {
    var code = userData.referral_code;
    if (!code) {
      code = user.id.replace(/-/g, '').substring(0, 10).toUpperCase();
      await supabase.from('users').update({ referral_code: code }).eq('id', user.id);
    }
    document.getElementById('refCodeDisplay').textContent = code;
    document.getElementById('refUrlDisplay').textContent = 'https://zfankaar.github.io/Ada-kam/#' + code;
  }

  var { data: referred } = await supabase
    .from('users')
    .select('balance')
    .eq('referred_by', user.id);

  var count = referred ? referred.length : 0;
  var taskEarnings = 0;
  if (referred) {
    for (var i = 0; i < referred.length; i++) {
      var earned = referred[i].balance || 0;
      if (earned > 10) taskEarnings += earned - 10;
    }
  }
  var totalCommission = count * 10 + taskEarnings * 0.1;
  var rawPaid = userData ? userData.referral_paid : undefined;
  var paidCount = rawPaid || 0;

  if (paidCount < count && userData && rawPaid !== undefined) {
    var newUsers = count - paidCount;
    var flatBonus = newUsers * 10;
    await supabase.from('users').update({ total_earned: (userData.total_earned || 0) + flatBonus }).eq('id', user.id);
    try { await supabase.from('users').update({ referral_paid: count }).eq('id', user.id); } catch (e) {}
    if (userData.total_earned !== undefined && userData.total_earned !== null) {
      userData.total_earned += flatBonus;
      totalEarned = userData.total_earned;
    }
  }

  document.getElementById('refCount').textContent = count;
  document.getElementById('refCommission').textContent = 'Rs' + totalCommission.toFixed(2);

  if (userData) {
    var te = (userData.total_earned !== undefined && userData.total_earned !== null) ? (userData.total_earned || 0) : 0;
    totalEarned = te;
    var showTotal = (userData.balance || 0) + te;
    document.getElementById('refTotalEarned').textContent = 'Rs' + showTotal.toFixed(2);
  }
}

function copyRefCode() {
  var code = document.getElementById('refCodeDisplay').textContent;
  if (code && code !== '------') {
    var link = 'https://zfankaar.github.io/Ada-kam/#' + code;
    navigator.clipboard.writeText(link).then(function () {
      toast('link copied');
    });
  }
}

/* ─── PROFILE PAYMENT EDIT ─── */

function togglePayEdit() {
  var local = loadLocalUser();
  if (!local) return;

  document.getElementById('profilePay').classList.add('off');
  document.getElementById('profilePayEdit').classList.remove('off');

  var methods = document.querySelectorAll('#payMethods .step-method');
  for (var i = 0; i < methods.length; i++) methods[i].classList.remove('active');
  if (local.acc_type === 'jazzcash') methods[1].classList.add('active');
  else methods[0].classList.add('active');

  document.getElementById('payEditName').value = local.acc_name || '';
  document.getElementById('payEditNum').value = local.acc_num || '';
}

function pickMethodPay(m) {
  var items = document.querySelectorAll('#payMethods .step-method');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
  var map = { easypaisa: 0, jazzcash: 1 };
  items[map[m]].classList.add('active');
}

async function savePayEdit() {
  var active = document.querySelector('#payMethods .step-method.active');
  if (!active) { toast('select a payment method'); return; }
  var name = document.getElementById('payEditName').value.trim();
  var num = document.getElementById('payEditNum').value.trim();
  if (!name) { toast('enter account name'); return; }
  if (!num) { toast('enter account number'); return; }

  var type = active.querySelector('input').value;

  var { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast('not signed in'); return; }

  showLoading('saving');
  var { error } = await supabase.from('users').update({
    acc_type: type,
    acc_name: name,
    acc_num: num
  }).eq('id', user.id);
  hideLoading();

  if (error) { toast(error.message); return; }

  saveLocalUser(user.email, type, name, num);
  window._userAccType = type;
  window._userAccName = name;
  window._userAccNum = num;

  document.getElementById('payDetail').textContent = type + ' — ' + name + ' — ' + num;
  document.getElementById('profilePay').classList.remove('off');
  document.getElementById('profilePayEdit').classList.add('off');
  toast('payment info updated');
}

function cancelPayEdit() {
  document.getElementById('profilePay').classList.remove('off');
  document.getElementById('profilePayEdit').classList.add('off');
}

/* ─── PROFILE PANELS ─── */

function showWithdrawHistory() {
  document.getElementById('profileSigned').classList.add('off');
  document.getElementById('panelHistory').classList.remove('off');

  var list = document.getElementById('withdrawHistoryList');
  var local = loadLocalWithdrawals();
  list.innerHTML = '';

  if (local.length === 0) {
    list.innerHTML = '<p class="empty">no withdrawals yet</p>';
  } else {
    for (var i = 0; i < local.length; i++) {
      var wd = local[i];
      var p = document.createElement('p');
      var left = document.createElement('span');
      left.innerHTML = '<span class="wd-amt">-Rs' + wd.amount.toFixed(2) + '</span> <span class="wd-date">' + wd.date + ' ' + wd.time + '</span>';
      var right = document.createElement('span');
      right.className = 'wd-status ' + wd.status;
      right.textContent = wd.status;
      p.appendChild(left);
      p.appendChild(right);
      list.appendChild(p);
    }

    fetchLatestStatuses();
  }
}

async function fetchLatestStatuses() {
  var { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  var { data: rows } = await supabase
    .from('withdrawals')
    .select('amount, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!rows || rows.length === 0) return;

  var local = loadLocalWithdrawals();

  for (var i = 0; i < local.length && i < rows.length; i++) {
    if (local[i].status !== rows[i].status) {
      local[i].status = rows[i].status;
    }
  }

  try { localStorage.setItem(WD_KEY, JSON.stringify(local)); } catch (e) {}

  var items = document.querySelectorAll('#withdrawHistoryList p:not(.empty)');
  for (var j = 0; j < items.length && j < rows.length; j++) {
    var statusEl = items[j].querySelector('.wd-status');
    if (statusEl) {
      statusEl.textContent = rows[j].status;
      statusEl.className = 'wd-status ' + rows[j].status;
    }
  }
}

function showHelpSupport() {
  document.getElementById('profileSigned').classList.add('off');
  document.getElementById('panelHelp').classList.remove('off');
}

function hidePanel(id) {
  document.getElementById(id).classList.add('off');
  document.getElementById('profileSigned').classList.remove('off');
}

/* ─── REFER ─── */

var VALID_CODES = { 'ADA10': true, 'KAM20': true, 'FRIEND5': true };

async function handleRefer() {
  var code = document.getElementById('referCode').value.trim().toUpperCase();
  var msg = document.getElementById('referMsg');

  if (!code) {
    msg.textContent = 'enter a valid code or tap skip';
    msg.style.color = '#b85c4e';
    return;
  }

  if (VALID_CODES[code]) {
    msg.textContent = 'code accepted!';
    msg.style.color = '#2c3a33';
    setTimeout(function () { finishSignup(); }, 800);
    return;
  }

  var { data: referrer } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle();

  if (referrer) {
    msg.textContent = 'code accepted!';
    msg.style.color = '#2c3a33';
    setTimeout(function () { finishSignup(); }, 800);
  } else {
    msg.textContent = 'invalid code';
    msg.style.color = '#b85c4e';
  }
}

function skipRefer() {
  finishSignup();
}

/* ─── WITHDRAW PANEL ─── */

function openWithdraw() {
  document.getElementById('walletMain').classList.add('off');
  document.getElementById('withdrawPanel').classList.remove('off');
  document.getElementById('wpBalance').textContent = balance.toFixed(2);
  document.getElementById('wpNote').textContent = '';
  document.getElementById('wpAmount').value = '';
  resetWpPayView();

  document.getElementById('wpAccType').textContent = window._userAccType || '—';
  document.getElementById('wpAccName').textContent = window._userAccName || '—';
  document.getElementById('wpAccNum').textContent = window._userAccNum || '—';
}

function resetWpPayView() {
  document.getElementById('wpInfo').classList.remove('off');
  document.getElementById('wpPayEdit').classList.add('off');
}

function closeWithdraw() {
  document.getElementById('walletMain').classList.remove('off');
  document.getElementById('withdrawPanel').classList.add('off');
}

/* ─── WITHDRAW PAYMENT EDIT ─── */

function toggleWpPayEdit() {
  var local = loadLocalUser();
  if (!local) return;

  document.getElementById('wpInfo').classList.add('off');
  document.getElementById('wpPayEdit').classList.remove('off');

  var methods = document.querySelectorAll('#wpPayMethods .step-method');
  for (var i = 0; i < methods.length; i++) methods[i].classList.remove('active');
  if (local.acc_type === 'jazzcash') methods[1].classList.add('active');
  else methods[0].classList.add('active');

  document.getElementById('wpPayEditName').value = local.acc_name || '';
  document.getElementById('wpPayEditNum').value = local.acc_num || '';
}

function pickMethodWp(m) {
  var items = document.querySelectorAll('#wpPayMethods .step-method');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
  var map = { easypaisa: 0, jazzcash: 1 };
  items[map[m]].classList.add('active');
}

async function saveWpPayEdit() {
  var active = document.querySelector('#wpPayMethods .step-method.active');
  if (!active) { toast('select a payment method'); return; }
  var name = document.getElementById('wpPayEditName').value.trim();
  var num = document.getElementById('wpPayEditNum').value.trim();
  if (!name) { toast('enter account name'); return; }
  if (!num) { toast('enter account number'); return; }

  var type = active.querySelector('input').value;

  var { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast('not signed in'); return; }

  showLoading('saving');
  var { error } = await supabase.from('users').update({
    acc_type: type,
    acc_name: name,
    acc_num: num
  }).eq('id', user.id);
  hideLoading();

  if (error) { toast(error.message); return; }

  saveLocalUser(user.email, type, name, num);
  window._userAccType = type;
  window._userAccName = name;
  window._userAccNum = num;

  document.getElementById('wpAccType').textContent = type;
  document.getElementById('wpAccName').textContent = name;
  document.getElementById('wpAccNum').textContent = num;

  document.getElementById('wpInfo').classList.remove('off');
  document.getElementById('wpPayEdit').classList.add('off');

  var payDetail = type + ' — ' + name + ' — ' + num;
  document.getElementById('payDetail').textContent = payDetail;

  toast('payment info updated');
}

function cancelWpPayEdit() {
  document.getElementById('wpInfo').classList.remove('off');
  document.getElementById('wpPayEdit').classList.add('off');
}

async function sendWithdraw() {
  var amt = parseFloat(document.getElementById('wpAmount').value);
  if (!amt || amt < 1) { document.getElementById('wpNote').textContent = 'minimum withdrawal is Rs1.00'; return; }
  if (amt > balance) { document.getElementById('wpNote').textContent = 'insufficient balance'; return; }

  showLoading('sending request');

  var { data: { user } } = await supabase.auth.getUser();
  if (!user) { hideLoading(); toast('not signed in'); return; }

  var { error: wError } = await supabase.from('withdrawals').insert({
    user_id: user.id,
    amount: amt,
    status: 'pending'
  });

  if (wError) {
    hideLoading();
    toast(wError.message);
    return;
  }

  balance -= amt;
  updateDisplay();

  await supabase.from('users').update({ balance: balance }).eq('id', user.id);

  hideLoading();

  saveLocalWithdrawal(amt);

  var list = document.getElementById('walletList');
  var empty = list.querySelector('.empty');
  if (empty) empty.remove();

  var now = new Date();
  var time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  var date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  var p = document.createElement('p');
  var left = document.createElement('span');
  left.textContent = '-Rs' + amt.toFixed(2);
  left.style.color = '#2c3a33';
  var right = document.createElement('span');
  right.textContent = date + ' ' + time;
  right.style.color = '#9a8f83';
  p.appendChild(left);
  p.appendChild(right);
  list.insertBefore(p, list.firstChild);

  closeWithdraw();
  toast('withdraw request sent');
}

/* ─── TOAST ─── */

function toast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.classList.remove('show'); }, 2000);
}

/* ─── LOADING ─── */

function showLoading(msg) {
  document.getElementById('loadingText').textContent = msg || 'loading';
  document.getElementById('loading').classList.add('show');
}

function hideLoading() {
  document.getElementById('loading').classList.remove('show');
}

/* ─── AD CLICK ─── */

document.getElementById('adBox').addEventListener('click', function () {
  if (!cooldown) watchAd();
});

/* ─── SESSION CHECK ─── */

(async function init() {
  var { data: { session }, error } = await supabase.auth.getSession();
  if (error) { console.error(error); return; }

  if (session) {
    showLoading('restoring session');
    var { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!fetchError && userData) {
      balance = userData.balance || 0;
      totalEarned = userData.total_earned || 0;
      updateDisplay();
    }

    setTimeout(async function () {
      hideLoading();
      show('appPage');
      await setUser(session.user, userData?.acc_type, userData?.acc_name, userData?.acc_num);
    }, 600);
  }
})();
