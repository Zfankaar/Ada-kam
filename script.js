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

function dailyKey() {
  var u = uid();
  return 'adaKamDaily_' + u;
}

function getDailyData() {
  try {
    var raw = localStorage.getItem(dailyKey());
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
    localStorage.setItem(dailyKey(), JSON.stringify(data));
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
  try { localStorage.removeItem(dailyKey()); } catch (e) {}
}

function userKey(prefix) { return prefix + '_' + uid(); }

function saveLocalUser(email, accType, accName, accNum) {
  try {
    localStorage.setItem(userKey('adaKamUser'), JSON.stringify({
      email: email,
      acc_type: accType,
      acc_name: accName,
      acc_num: accNum
    }));
  } catch (e) {}
}

function loadLocalUser() {
  try {
    var raw = localStorage.getItem(userKey('adaKamUser'));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function clearLocalUser() {
  try { localStorage.removeItem(userKey('adaKamUser')); } catch (e) {}
}

function saveLocalWithdrawal(amount, id, fromBal) {
  try {
    var list = loadLocalWithdrawals();
    var now = new Date();
    list.unshift({
      id: id || null,
      amount: amount,
      fromBal: fromBal || 0,
      date: now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending'
    });
    localStorage.setItem(userKey('adaKamWithdrawals'), JSON.stringify(list));
  } catch (e) {}
}

function loadLocalWithdrawals() {
  try {
    var raw = localStorage.getItem(userKey('adaKamWithdrawals'));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function clearLocalWithdrawals() {
  try { localStorage.removeItem(userKey('adaKamWithdrawals')); } catch (e) {}
}

function loadLocalTasks() {
  try {
    var raw = localStorage.getItem(userKey('adaKamTasks'));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalTasks(list) {
  try { localStorage.setItem(userKey('adaKamTasks'), JSON.stringify(list)); } catch (e) {}
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
  _incompleteFlow = false;
  document.getElementById('step2Heading').textContent = 'step 2 &mdash; payment info';
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
var _incompleteFlow = false;

function beginIncompleteFlow(authUserId, email) {
  _authUserId = authUserId;
  _stepEmail = email;
  _incompleteFlow = true;

  document.getElementById('step1').classList.add('off');
  document.getElementById('step3').classList.add('off');
  document.getElementById('step2Heading').textContent = 'complete registration &mdash; payment info';
  document.getElementById('stepAccName').value = '';
  document.getElementById('stepAccNum').value = '';
  document.getElementById('referCode').value = '';
  document.getElementById('referMsg').textContent = '';
  document.getElementById('referCode').disabled = false;
  document.getElementById('referCode').style.opacity = '1';
  document.getElementById('skipBtn').classList.remove('off');

  if (_urlRefCode) {
    document.getElementById('referCode').value = _urlRefCode;
    document.getElementById('referCode').disabled = true;
    document.getElementById('referCode').style.opacity = '0.6';
    document.getElementById('skipBtn').classList.add('off');
  }

  var m = document.querySelectorAll('.step-method');
  for (var i = 0; i < m.length; i++) m[i].classList.remove('active');
  document.getElementById('step2').classList.remove('off');
  show('signupPage');
}

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
  var refCode = _authUserId.replace(/-/g, '').substring(0, 6).toUpperCase();
  var signupBonus = 10;

  var { error: insertError } = await supabase.from('users').upsert({
    id: _authUserId,
    email: _stepEmail,
    acc_type: type,
    acc_name: name,
    acc_num: num,
    balance: signupBonus,
    referral_code: refCode
  }, { onConflict: 'id' });
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
    await supabase.from('users').update({ referred_by: referredById, referral_paid: 1 }).eq('id', _authUserId);
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
  try { localStorage.setItem('adaKamSessionId', _authUserId.replace(/[^a-zA-Z0-9]/g, '_')); } catch (e) {}
  await setUser({ email: _stepEmail, id: _authUserId }, type, name, num);
  _incompleteFlow = false;
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
    beginIncompleteFlow(data.user.id, data.user.email);
    toast('complete your registration');
    return;
  }

  balance = userData.balance || 0;
  totalEarned = userData.total_earned || 0;
  updateDisplay();

  hideLoading();
  show('appPage');
  try { localStorage.setItem('adaKamSessionId', data.user.id.replace(/[^a-zA-Z0-9]/g, '_')); } catch (e) {}
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
    pendingClaim = false;
    cooldown = false;
    try { localStorage.removeItem(userKey('adaKamPendingClaim')); } catch (e) {}
    clearLocalUser();
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

  if (tab === 'wallet') { loadWalletHistory(); fetchLatestStatuses(); }

  if (tab === 'home') restoreClaimState();

  if (tab !== 'profile') {
    document.getElementById('panelHistory').classList.add('off');
    document.getElementById('panelHelp').classList.add('off');
    document.getElementById('profileSigned').classList.remove('off');
  }

  ['Ad', 'Register', 'Like', 'Review', 'Youtube'].forEach(function(t) {
    document.getElementById('task' + t + 'View').classList.add('off');
  });
  document.getElementById('taskMenu').classList.remove('off');

  if (tab === 'home') { restoreClaimState(); } else { resetAdCoins(); }
}

async function loadWalletHistory() {
  var { data: { user } } = await supabase.auth.getUser();
  var rows = [];
  if (user) {
    var { data: dbRows, error: dbErr } = await supabase
      .from('withdrawals')
      .select('id, amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (dbErr) console.error('loadWalletHistory err', dbErr);
    if (dbRows) rows = dbRows;
  }

  if (rows.length === 0) {
    var local = loadLocalWithdrawals();
    if (local.length > 0) rows = local;
  }

  var list = document.getElementById('walletList');
  list.innerHTML = '';

  if (rows.length === 0) {
    list.innerHTML = '<p class="empty">no transactions yet</p>';
  } else {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < rows.length; i++) {
      var wd = rows[i];
      var p = document.createElement('p');
      var left = document.createElement('span');
      var d = wd.created_at ? new Date(wd.created_at) : new Date();
      var dateStr = wd.date || d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      var timeStr = wd.time || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      left.innerHTML = '<span class="wd-amt">-Rs' + wd.amount.toFixed(2) + '</span> <span class="wd-date">' + dateStr + ' ' + timeStr + '</span>';
      var right = document.createElement('span');
      right.className = 'wd-status ' + (wd.status || 'pending');
      right.textContent = wd.status || 'pending';
      p.appendChild(left);
      p.appendChild(right);
      frag.appendChild(p);
    }
    list.appendChild(frag);
  }
}

/* ─── TASK CATEGORIES ─── */

function openTask(type) {
  document.getElementById('taskMenu').classList.add('off');
  document.getElementById('task' + type.charAt(0).toUpperCase() + type.slice(1) + 'View').classList.remove('off');
  if (type === 'ad') updateDailyDisplay();
  if (type === 'register') openRegTaskList();
  if (type === 'submissions') loadSubmissions();
}

function closeTask(type) {
  document.getElementById('task' + type.charAt(0).toUpperCase() + type.slice(1) + 'View').classList.add('off');
  document.getElementById('taskMenu').classList.remove('off');
  if (type === 'ad') resetAdCoins();
  if (type === 'register') { currentRegTask = null; }
}

function resetAdCoins() {
  var coins = document.getElementById('adCoins');
  if (coins) {
    var dots = coins.querySelectorAll('span');
    for (var d = 0; d < dots.length; d++) dots[d].classList.remove('lit');
  }
  var bar = document.getElementById('adBtnBar');
  if (bar) bar.style.width = '0%';
}

function clearClaimState() {
  pendingClaim = false;
  try { localStorage.removeItem(userKey('adaKamPendingClaim')); } catch (e) {}
  var bt = document.querySelector('.ad-btn-text');
  if (bt) bt.textContent = 'watch ad';
  var lbl = document.getElementById('adLabel');
  if (lbl) lbl.textContent = 'tap to watch';
  var btn = document.getElementById('watchBtn');
  if (btn) btn.disabled = false;
  var bar = document.getElementById('adBtnBar');
  if (bar) bar.style.width = '0%';
}

function restoreClaimState() {
  try {
    if (localStorage.getItem(userKey('adaKamPendingClaim')) === '1') {
      pendingClaim = true;
      var btn = document.getElementById('watchBtn');
      var lbl = document.getElementById('adLabel');
      var timer = document.getElementById('timerDisplay');
      var bar = document.getElementById('adBtnBar');
      if (btn) {
        btn.disabled = false;
        var txt = btn.querySelector('.ad-btn-text');
        if (txt) txt.textContent = 'claim';
      }
      if (lbl) lbl.textContent = 'claim reward';
      if (timer) timer.textContent = '';
      if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; }
    } else {
      pendingClaim = false;
    }
  } catch (e) {}
}

/* ─── TASK SUBMISSION ─── */

var REG_TASKS = {
  gemgala: {
    name: 'Gemgala App',
    reward: 30,
    link: 'https://getblock.me/u/24957910',
    videoUrl: 'https://youtu.be/eyckS6V4zeM',
    desc: 'Sign up, complete face verification, and submit your profile screenshot to earn Rs 30.',
    instructions: [
      'Download the Gemgala app using the link below',
      'Sign up with your Google account or Email',
      'Complete face verification inside the app',
      'Go to Settings \u2192 Profile section',
      'Take a screenshot of your profile page',
      'Copy your User ID from the profile'
    ]
  }
};

var currentRegTask = null;

function openRegTaskList() {
  document.getElementById('taskMenu').classList.add('off');
  document.getElementById('taskRegisterView').classList.remove('off');
  document.getElementById('regTaskListView').classList.remove('off');
  document.getElementById('regTaskDetailView').classList.add('off');
  renderRegTaskList();
}

function renderRegTaskList() {
  var container = document.getElementById('regTaskListItems');
  container.innerHTML = '';
  var keys = Object.keys(REG_TASKS);
  if (keys.length === 0) {
    container.innerHTML = '<p class="empty">no tasks available yet</p>';
    return;
  }
  keys.forEach(function (key) {
    var task = REG_TASKS[key];
    var div = document.createElement('div');
    div.className = 'reg-task-card';
    div.innerHTML =
      '<div class="reg-task-card-body">' +
        '<p class="reg-task-card-name">' + task.name + '</p>' +
        '<p class="reg-task-card-reward">Rs ' + task.reward + '</p>' +
        '<p class="reg-task-card-desc">' + task.desc + '</p>' +
      '</div>' +
      '<button class="ts-btn reg-task-card-btn" onclick="selectRegTask(\'' + key + '\')">select</button>';
    container.appendChild(div);
  });
}

function selectRegTask(key) {
  currentRegTask = key;
  var task = REG_TASKS[key];

  document.getElementById('regTaskListView').classList.add('off');
  document.getElementById('regTaskDetailView').classList.remove('off');

  document.getElementById('regDetailTitle').textContent = task.name;
  document.getElementById('regDetailHeading').textContent = 'complete ' + task.name;
  document.getElementById('regSubmitDesc').textContent = 'Upload your screenshot and enter your ' + task.name + ' User ID.';

  var list = document.getElementById('regStepList');
  list.innerHTML = '';
  task.instructions.forEach(function (text, i) {
    var p = document.createElement('p');
    p.className = 'ts-step-list-item';
    p.innerHTML = '<span>' + (i + 1) + '</span> ' + text;
    list.appendChild(p);
  });

  var videoArea = document.getElementById('regVideoArea');
  videoArea.innerHTML = '<a class="ts-video-btn" href="' + task.videoUrl + '" target="_blank">\u25B6 watch tutorial on YouTube</a>';

  document.getElementById('regStep1').classList.remove('off');
  document.getElementById('regStep2').classList.add('off');
  document.getElementById('regFileInput').value = '';
  document.getElementById('regFileName').textContent = '';
  document.getElementById('regFileLabel').textContent = 'choose screenshot';
  document.getElementById('regAppUserId').value = '';
  document.getElementById('regTaskNote').textContent = '';
  setupFileInput();
  loadRegHistory();
}

function backToRegTaskList() {
  document.getElementById('regTaskDetailView').classList.add('off');
  document.getElementById('regTaskListView').classList.remove('off');
  document.getElementById('regStep1').classList.remove('off');
  document.getElementById('regStep2').classList.add('off');
  currentRegTask = null;
}

function setupFileInput() {
  var input = document.getElementById('regFileInput');
  input.onchange = function () {
    var name = input.files && input.files[0] ? input.files[0].name : '';
    document.getElementById('regFileName').textContent = name;
    document.getElementById('regFileLabel').textContent = name ? 'change file' : 'choose screenshot';
  };
}

async function startRegTask() {
  var task = REG_TASKS[currentRegTask];
  if (!task) { toast('no task selected'); return; }

  var { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast('not signed in'); return; }

  var { data: pending } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('task_type', 'register')
    .eq('status', 'pending');

  if (pending && pending.length > 0) {
    document.getElementById('regTaskNote').textContent = 'you already have a pending submission \u2014 wait for review';
    return;
  }

  window.open(task.link, '_blank');
  document.getElementById('regStep1').classList.add('off');
  document.getElementById('regStep2').classList.remove('off');
}

function backRegStep() {
  document.getElementById('regStep2').classList.add('off');
  document.getElementById('regStep1').classList.remove('off');
}

async function submitRegTask() {
  var task = REG_TASKS[currentRegTask];
  if (!task) { toast('no task selected'); return; }

  var fileInput = document.getElementById('regFileInput');
  var file = fileInput.files && fileInput.files[0];
  if (!file) { document.getElementById('regTaskNote').textContent = 'select a screenshot'; return; }

  var appUserId = document.getElementById('regAppUserId').value.trim();
  if (!appUserId) { document.getElementById('regTaskNote').textContent = 'enter your User ID'; return; }

  var valid = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (valid.indexOf(file.type) === -1) { document.getElementById('regTaskNote').textContent = 'only PNG, JPG, or WEBP allowed'; return; }

  var { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast('not signed in'); return; }

  var { data: pending } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('task_type', 'register')
    .eq('status', 'pending');

  if (pending && pending.length > 0) {
    document.getElementById('regTaskNote').textContent = 'you already have a pending submission';
    return;
  }

  showLoading('uploading');

  var ext = file.name.split('.').pop();
  var path = user.id + '/' + Date.now() + '.' + ext;

  var { error: upError } = await supabase.storage
    .from('screenshots')
    .upload(path, file, { upsert: false });

  if (upError) { hideLoading(); toast(upError.message); return; }

  var { data: urlData } = supabase.storage
    .from('screenshots')
    .getPublicUrl(path);

  var imageUrl = urlData.publicUrl;

  var { data: inserted, error } = await supabase.from('tasks').insert({
    user_id: user.id,
    task_type: 'register',
    image_url: imageUrl,
    app_user_id: appUserId,
    status: 'pending',
    reward: task.reward
  }).select();
  hideLoading();

  if (error) {
    toast(error.message);
    return;
  }

  var d = new Date();
  var dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  var timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  var localTask = {
    id: inserted && inserted[0] ? inserted[0].id : null,
    task_type: 'register',
    reward: task.reward,
    status: 'pending',
    app_user_id: appUserId,
    date: dateStr,
    time: timeStr,
    created_at: d.toISOString()
  };
  var tasks = loadLocalTasks();
  tasks.unshift(localTask);
  saveLocalTasks(tasks);

  fileInput.value = '';
  document.getElementById('regFileName').textContent = '';
  document.getElementById('regFileLabel').textContent = 'choose screenshot';
  document.getElementById('regAppUserId').value = '';
  document.getElementById('regTaskNote').textContent = '';
  toast('submitted for review \u2014 will be verified within 6-8 hours');
  loadRegHistory();
}

async function loadRegHistory() {
  var { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  var list = document.getElementById('regTaskList');
  var local = loadLocalTasks();
  var filtered = [];
  for (var t = 0; t < local.length; t++) {
    if (local[t].task_type === 'register') filtered.push(local[t]);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty">no submissions yet</p>';
  } else {
    renderTaskList(list, filtered);
  }

  fetchLatestRegStatuses(user.id);
}

async function fetchLatestRegStatuses(userId) {
  var local = loadLocalTasks();
  var ids = [];
  for (var i = 0; i < local.length; i++) {
    if (local[i].id) ids.push(local[i].id);
  }
  if (ids.length === 0) return;

  var { data: rows } = await supabase
    .from('tasks')
    .select('id, status, reward_paid, reward')
    .eq('user_id', userId)
    .in('id', ids);

  if (!rows || rows.length === 0) return;

  var pendingCredit = 0;
  var creditIds = [];
  var changed = false;

  for (var j = 0; j < rows.length; j++) {
    var dbRow = rows[j];
    for (var k = 0; k < local.length; k++) {
      if (local[k].id === dbRow.id && local[k].status !== dbRow.status) {
        local[k].status = dbRow.status;
        changed = true;
      }
    }
    if (dbRow.status === 'approved' && !dbRow.reward_paid) {
      pendingCredit += dbRow.reward;
      creditIds.push(dbRow.id);
    }
  }

  if (changed) {
    saveLocalTasks(local);
    var list = document.getElementById('regTaskList');
    var filtered = [];
    for (var m = 0; m < local.length; m++) {
      if (local[m].task_type === 'register') filtered.push(local[m]);
    }
    renderTaskList(list, filtered);
  }

  if (pendingCredit > 0) {
    var { data: userData } = await supabase
      .from('users')
      .select('balance, referred_by, gross_earned')
      .eq('id', userId)
      .single();

    if (userData) {
      var newBal = (userData.balance || 0) + pendingCredit;
      var newGross = (userData.gross_earned || 0) + pendingCredit;
      await supabase.from('users').update({ balance: newBal, gross_earned: newGross }).eq('id', userId);
      balance = newBal;

      for (var n = 0; n < creditIds.length; n++) {
        await supabase.from('tasks').update({ reward_paid: true }).eq('id', creditIds[n]);
      }
      updateDisplay();
      toast('+Rs' + pendingCredit.toFixed(2) + ' from approved tasks');
    }
  }
}

function renderTaskList(container, tasks) {
  container.innerHTML = '';
  for (var i = 0; i < tasks.length; i++) {
    var row = tasks[i];
    var p = document.createElement('p');
    var left = document.createElement('span');
    left.innerHTML = '<span class="wd-amt">Rs ' + (row.reward || 0).toFixed(2) + '</span> <span class="wd-date">' + row.date + ' ' + row.time + '</span>';
    var right = document.createElement('span');
    right.className = 'wd-status ' + row.status;
    right.textContent = row.status;
    p.appendChild(left);
    p.appendChild(right);
    container.appendChild(p);
  }
}

var submissionFilter = 'all';

async function loadSubmissions() {
  var { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  filterSubmissions('all');

  var local = loadLocalTasks();
  renderSubmissionsList(local);

  fetchLatestAllStatuses(user.id);
}

function renderSubmissionsList(tasks) {
  var list = document.getElementById('submissionsList');
  list.innerHTML = '';

  var filtered = tasks;
  if (submissionFilter !== 'all') {
    filtered = tasks.filter(function (r) { return r.status === submissionFilter; });
  }

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty">no ' + (submissionFilter === 'all' ? '' : submissionFilter + ' ') + 'submissions</p>';
    return;
  }

  for (var i = 0; i < filtered.length; i++) {
    var row = filtered[i];
    var taskLabel = row.task_type === 'register' ? 'registration' : row.task_type;
    var p = document.createElement('p');
    var left = document.createElement('span');
    left.innerHTML = '<span class="wd-amt">' + taskLabel + '</span> <span class="wd-date">Rs ' + (row.reward || 0).toFixed(2) + ' \u2022 ' + row.date + ' ' + row.time + '</span>';
    var right = document.createElement('span');
    right.className = 'wd-status ' + row.status;
    right.textContent = row.status;
    p.appendChild(left);
    p.appendChild(right);
    list.appendChild(p);
  }
}

function filterSubmissions(status) {
  submissionFilter = status;
  var items = document.querySelectorAll('.sub-filter-item');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.toggle('active', items[i].getAttribute('data-filter') === status);
  }
  var local = loadLocalTasks();
  renderSubmissionsList(local);
}

async function fetchLatestAllStatuses(userId) {
  var local = loadLocalTasks();
  var ids = [];
  for (var i = 0; i < local.length; i++) {
    if (local[i].id) ids.push(local[i].id);
  }
  if (ids.length === 0) return;

  var { data: rows } = await supabase
    .from('tasks')
    .select('id, status')
    .eq('user_id', userId)
    .in('id', ids);

  if (!rows || rows.length === 0) return;

  var changed = false;
  for (var j = 0; j < rows.length; j++) {
    var dbRow = rows[j];
    for (var k = 0; k < local.length; k++) {
      if (local[k].id === dbRow.id && local[k].status !== dbRow.status) {
        local[k].status = dbRow.status;
        changed = true;
      }
    }
  }

  if (changed) {
    saveLocalTasks(local);
    renderSubmissionsList(local);
  }
}

async function syncLocalTasksFromDB(userId) {
  var local = loadLocalTasks();
  if (local.length > 0) {
    var localIds = {};
    for (var i = 0; i < local.length; i++) {
      if (local[i].id) localIds[local[i].id] = true;
    }
    var { data: rows } = await supabase
      .from('tasks')
      .select('id, task_type, reward, status, created_at, app_user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (rows) {
      var added = false;
      for (var j = 0; j < rows.length; j++) {
        if (!localIds[rows[j].id]) {
          var d = new Date(rows[j].created_at);
          local.push({
            id: rows[j].id,
            task_type: rows[j].task_type,
            reward: rows[j].reward,
            status: rows[j].status,
            app_user_id: rows[j].app_user_id || '',
            date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            created_at: rows[j].created_at
          });
          added = true;
        }
      }
      if (added) {
        local.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
        saveLocalTasks(local);
      }
    }
  } else {
    var { data: rows } = await supabase
      .from('tasks')
      .select('id, task_type, reward, status, created_at, app_user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (rows && rows.length > 0) {
      var mapped = rows.map(function (r) {
        var d = new Date(r.created_at);
        return {
          id: r.id,
          task_type: r.task_type,
          reward: r.reward,
          status: r.status,
          app_user_id: r.app_user_id || '',
          date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          created_at: r.created_at
        };
      });
      saveLocalTasks(mapped);
    }
  }
}

/* ─── APP ─── */

var balance = 0;
var totalEarned = 0;
var adsWatched = 0;

function getTotalAds() {
  try { return parseInt(localStorage.getItem(userKey('adaKamTotalAds'))) || 0; } catch (e) { return 0; }
}
function setTotalAds(n) {
  try { localStorage.setItem(userKey('adaKamTotalAds'), n); } catch (e) {}
}
var cooldown = false;
var pendingClaim = false;

var AD_LINKS = [
  'https://www.effectivecpmnetwork.com/s52c7nbbkg?key=5f93f1dc7934f63b91945a5838664650',
  'https://www.effectivecpmnetwork.com/j6gdsq6n?key=6cacab6999ba48d14e506dc7fe780a5c'
];

function updateDisplay() {
  var b = 'Rs' + balance.toFixed(2);
  document.getElementById('balanceDisplay').textContent = b;
  document.getElementById('balanceDisplay2').textContent = b;
  document.getElementById('balanceDisplay3').textContent = b;
  document.getElementById('balanceDisplay4').textContent = b;
  var showTotal = balance + totalEarned;
  document.getElementById('walletAmount').textContent = showTotal.toFixed(2);
  document.getElementById('profileAds').textContent = getTotalAds();
  document.getElementById('profileEarned').textContent = 'Rs' + showTotal.toFixed(2);
  var te = document.getElementById('refTotalEarned');
  if (te) te.textContent = 'Rs' + showTotal.toFixed(2);
}

function watchAd() {
  if (cooldown) return;
  if (pendingClaim) { toast('claim your current ad first'); return; }

  if (getDailyAds() >= DAILY_LIMIT) {
    toast('daily limit reached — ' + DAILY_LIMIT + ' ads per day');
    return;
  }

  var btn = document.getElementById('watchBtn');
  var label = document.getElementById('adLabel');
  var earn = document.getElementById('adEarn');
  var timer = document.getElementById('timerDisplay');
  var bar = document.getElementById('adBtnBar');

  showLoading('loading ad');
  setTimeout(function () {
    hideLoading();
    btn.disabled = true;
    cooldown = true;

    label.textContent = 'playing...';
    earn.textContent = '+Rs0.10';
    var total = Math.floor(Math.random() * 5) + 3;
    timer.textContent = total;
    bar.style.width = '0%';

    var coins = document.getElementById('adCoins');
    if (coins) {
      var dots = coins.querySelectorAll('span');
      for (var d = 0; d < dots.length; d++) dots[d].classList.remove('lit');
    }

    var count = total;
    var interval = setInterval(function () {
      count--;
      timer.textContent = count;
      var pct = ((total - count) / total) * 100;
      bar.style.width = pct + '%';
      if (coins && count >= 0) {
        var dots = coins.querySelectorAll('span');
        if (dots[total - 1 - count]) dots[total - 1 - count].classList.add('lit');
      }
      if (count <= 0) {
        clearInterval(interval);
        bar.style.width = '100%';
        btn.disabled = false;
        cooldown = false;
        pendingClaim = true;
        try { localStorage.setItem(userKey('adaKamPendingClaim'), '1'); } catch (e) {}
        label.textContent = 'claim reward';
        timer.textContent = '';
        btn.querySelector('.ad-btn-text').textContent = 'claim';
      }
    }, 1000);
  }, 600);
}

function claimAd() {
  if (!pendingClaim) return;

  var btn = document.getElementById('watchBtn');
  btn.disabled = true;

  var link = AD_LINKS[Math.floor(Math.random() * AD_LINKS.length)];

  if (Math.random() < 0.75) {
    window.open(link, '_blank');
  }

  clearClaimState();
  addEarning();
}

async function addEarning() {
  adsWatched++;
  setTotalAds(getTotalAds() + 1);
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
  left.style.fontWeight = '600';
  left.style.color = '#2c3a33';

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
    var gross = (userData.gross_earned || 0) + reward;
    await supabase.from('users').update({ balance: balance, gross_earned: gross }).eq('id', user.id);
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
      code = user.id.replace(/-/g, '').substring(0, 6).toUpperCase();
      await supabase.from('users').update({ referral_code: code }).eq('id', user.id);
    }
    document.getElementById('refCodeDisplay').textContent = code;
    document.getElementById('refUrlDisplay').textContent = 'zfankaar.github.io/Ada-kam/#' + code;
    var email = userData.email || user.email || '';
    var namePart = email.split('@')[0] || '';
    var greeting = ['good morning', 'good afternoon', 'good evening'][new Date().getHours() < 12 ? 0 : new Date().getHours() < 17 ? 1 : 2];
    document.getElementById('refGreeting').textContent = greeting + ', ' + namePart;
  }

  var { data: referred, error: refErr } = await supabase
    .from('users')
    .select('gross_earned')
    .eq('referred_by', user.id);

  if (refErr || !referred) {
    var { data: referred2 } = await supabase
      .from('users')
      .select('balance')
      .eq('referred_by', user.id);
    referred = referred2;
  }

  var count = referred ? referred.length : 0;
  document.getElementById('refCount').textContent = count;

  var taskEarnings = 0;
  if (referred) {
    for (var i = 0; i < referred.length; i++) {
      var val = referred[i].gross_earned != null ? referred[i].gross_earned : referred[i].balance;
      taskEarnings += val || 0;
    }
  }
  var expectedCommission = count * 10 + taskEarnings * 0.1;

  if (userData) {
    var storedTotal = userData.total_earned || 0;
    var lastExpected = userData.last_ref_expected || 0;

    if (lastExpected === 0) {
      var addAmt = expectedCommission;
      if (addAmt > 0) {
        storedTotal += addAmt;
        await supabase.from('users').update({ total_earned: storedTotal, last_ref_expected: expectedCommission }).eq('id', user.id);
      } else {
        await supabase.from('users').update({ last_ref_expected: expectedCommission }).eq('id', user.id);
      }
    } else if (expectedCommission > lastExpected) {
      var diff = expectedCommission - lastExpected;
      storedTotal += diff;
      await supabase.from('users').update({ total_earned: storedTotal, last_ref_expected: expectedCommission }).eq('id', user.id);
    }

    totalEarned = storedTotal;
    var showTotal = (userData.balance || 0) + storedTotal;
    document.getElementById('refCommission').textContent = 'Rs' + storedTotal.toFixed(2);
    document.getElementById('refTotalEarned').textContent = 'Rs' + showTotal.toFixed(2);
    updateDisplay();
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
  renderWithdrawHistory();
  fetchLatestStatuses();
}

async function renderWithdrawHistory() {
  var list = document.getElementById('withdrawHistoryList');
  var { data: { user } } = await supabase.auth.getUser();
  var rows = [];
  if (user) {
    var { data: dbRows } = await supabase
      .from('withdrawals')
      .select('id, amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (dbRows) rows = dbRows;
  }

  if (rows.length === 0) {
    var local = loadLocalWithdrawals();
    if (local.length > 0) rows = local;
  }

  list.innerHTML = '';

  if (rows.length === 0) {
    list.innerHTML = '<p class="empty">no withdrawals yet</p>';
  } else {
    for (var i = 0; i < rows.length; i++) {
      var wd = rows[i];
      var p = document.createElement('p');
      var left = document.createElement('span');
      var d = wd.created_at ? new Date(wd.created_at) : new Date();
      var dateStr = wd.date || d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      var timeStr = wd.time || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      left.innerHTML = '<span class="wd-amt">-Rs' + wd.amount.toFixed(2) + '</span> <span class="wd-date">' + dateStr + ' ' + timeStr + '</span>';
      var right = document.createElement('span');
      right.className = 'wd-status ' + (wd.status || 'pending');
      right.textContent = wd.status || 'pending';
      p.appendChild(left);
      p.appendChild(right);
      list.appendChild(p);
    }
  }
}

async function fetchLatestStatuses() {
  var { data: { user } } = await supabase.auth.getUser();
  if (!user) { console.warn('fetchLatestStatuses: no user'); return; }

  var { data: rows, error: dbErr } = await supabase
    .from('withdrawals')
    .select('id, amount, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (dbErr) { console.error('fetchLatestStatuses err', dbErr); return; }
  if (!rows || rows.length === 0) {
    console.log('fetchLatestStatuses: no rows for', user.id);
    try { localStorage.setItem(userKey('adaKamWithdrawals'), '[]'); } catch (e) {}
    return;
  }

  var local = loadLocalWithdrawals();
  var localById = {};
  for (var li = 0; li < local.length; li++) {
    if (local[li].id) localById[local[li].id] = local[li];
  }

  var merged = [];
  for (var r = 0; r < rows.length; r++) {
    var existing = localById[rows[r].id];
    var d = new Date(rows[r].created_at);
    merged.push({
      id: rows[r].id,
      amount: rows[r].amount,
      fromBal: existing ? existing.fromBal || 0 : 0,
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: rows[r].status,
      refunded: existing ? existing.refunded || false : false
    });
  }

  var changed = false;
  for (var mi = 0; mi < merged.length; mi++) {
    var m = merged[mi];
    var old = localById[m.id];
    if (old && old.status !== m.status) {
      changed = true;
      if (m.status === 'rejected' && !m.refunded) {
        var fb = m.fromBal || 0;
        var fromTe = m.amount - fb;
        totalEarned += fromTe;
        balance += fb;
        await supabase.from('users').update({ balance: balance, total_earned: totalEarned }).eq('id', user.id);
        m.refunded = true;
        updateDisplay();
      }
    }
  }

  try { localStorage.setItem(userKey('adaKamWithdrawals'), JSON.stringify(merged)); } catch (e) {}

  var allItems = document.querySelectorAll('#withdrawHistoryList p:not(.empty), #walletList p:not(.empty)');
  for (var k = 0; k < allItems.length && k < merged.length; k++) {
    var statusEl = allItems[k].querySelector('.wd-status');
    if (statusEl) {
      statusEl.textContent = merged[k].status;
      statusEl.className = 'wd-status ' + merged[k].status;
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
  document.getElementById('wpBalance').textContent = (balance + totalEarned).toFixed(2);
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
  var showTotal = balance + totalEarned;
  if (amt > showTotal) { document.getElementById('wpNote').textContent = 'insufficient balance'; return; }

  showLoading('sending request');

  var { data: { user } } = await supabase.auth.getUser();
  if (!user) { hideLoading(); toast('not signed in'); return; }

  var { data: wdData, error: wError } = await supabase.from('withdrawals').insert({
    user_id: user.id,
    amount: amt,
    status: 'pending'
  }).select('id');

  if (wError) {
    hideLoading();
    toast(wError.message);
    return;
  }

  var dedFromBal = 0;
  if (amt <= totalEarned) {
    totalEarned -= amt;
  } else {
    var remaining = amt - totalEarned;
    dedFromBal = remaining;
    totalEarned = 0;
    balance -= remaining;
  }
  updateDisplay();

  await supabase.from('users').update({ balance: balance, total_earned: totalEarned }).eq('id', user.id);

  hideLoading();

  saveLocalWithdrawal(amt, wdData && wdData[0] ? wdData[0].id : null, dedFromBal);

  var list = document.getElementById('walletList');
  var empty = list.querySelector('.empty');
  if (empty) empty.remove();

  var now = new Date();
  var time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  var date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  var p = document.createElement('p');
  var left = document.createElement('span');
  left.innerHTML = '<span class="wd-amt">-Rs' + amt.toFixed(2) + '</span> <span class="wd-date">' + date + ' ' + time + '</span>';
  var right = document.createElement('span');
  right.className = 'wd-status pending';
  right.textContent = 'pending';
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
    try { localStorage.setItem('adaKamSessionId', session.user.id.replace(/[^a-zA-Z0-9]/g, '_')); } catch (e) {}
    var { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!fetchError && userData) {
      balance = userData.balance || 0;
      totalEarned = userData.total_earned || 0;
      updateDisplay();

      syncLocalTasksFromDB(session.user.id);

      setTimeout(async function () {
        hideLoading();
        show('appPage');
        await setUser(session.user, userData?.acc_type, userData?.acc_name, userData?.acc_num);
        restoreClaimState();
      }, 600);
    } else {
      hideLoading();
      beginIncompleteFlow(session.user.id, session.user.email);
    }
  }
})();
