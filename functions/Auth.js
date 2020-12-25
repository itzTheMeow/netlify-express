let Auth = {};

let LoginErrors = {
  DIR_NOT_EXIST: "Invalid username.",
  NO_CREDENTIALS:
    "There is no password associated with this account. Please contact to have it reset.",
  ERR_WHEN_READING_CREDENTIALS: "An unexpected error getting your password occurred.",
  INCORRECT_PASSWORD: "Incorrect password.",
};

let OnLogin = function () {
  $.ajax({
    type: "POST",
    url: `${MeowOS.APIURL}fs/fetchFiles`,
    data: {
      token: Auth.token,
      path: "/system",
    },
    success: function (f, text) {
      let settings = f.files.filter((p) => p.path == "/system/settings.syscfg")[0].content;
      settings = JSON.parse(settings);
      if (settings.background)
        _("active-area").style["background-image"] = `url("${settings.background}")`;

      let syscfg = f.files.filter((p) => p.path == "/system/installed.syscfg")[0].content; //TODO: add orangescreen if no file
      if (!syscfg) return;

      (JSON.parse(syscfg) || []).forEach((p) => {
        InstallProgram(p, true);
      });
    },
    error: function (request, status, error) {
      if (MeowOS.error) return;

      MeowOS.ErrorHandler(
        "SYSTEM",
        `Failed to load data due to: ${AjaxErrorMsg(request, status, error)}`,
        true
      );
    },
  });
};

let Login = function () {
  let username = _("overlay-login-username").value || "";
  let password = _("overlay-login-password").value || "";
  let rememberUsername = _("remember-username").checked;
  let rememberPassword = _("remember-password").checked;

  if (!username) return (_("overlay-login-error").innerHTML = "Please enter a username.");
  if (!password) return (_("overlay-login-error").innerHTML = "Please enter a password.");

  let oldHTML = _("overlay-login-enter").innerHTML;
  _("overlay-login-enter").innerHTML = "...";
  let loadingInt = setInterval(function () {
    if (MeowOS.error) return;
    _("overlay-login-enter").innerHTML += ".";
  }, 400);

  $.ajax({
    type: "POST",
    url: `${MeowOS.APIURL}account/login`,
    data: {
      username: username,
      password: password,
    },
    success: function (data, text) {
      _("overlay-login-enter").innerHTML = oldHTML;
      clearInterval(loadingInt);

      if (data.error) return (_("overlay-login-error").innerHTML = LoginErrors[data.error]);

      Auth = {
        username: username,
        password: password,
        token: data.token,
      };

      $("#overlay").fadeOut(500, function () {
        $("#overlay").remove();
      });

      if (rememberUsername) localStorage.setItem("usernameStore", username);
      else localStorage.removeItem("usernameStore");

      if (rememberPassword) localStorage.setItem("passwordStore", password);
      else localStorage.removeItem("passwordStore");

      clearInterval(getStatusInt);

      OnLogin();
    },
    error: function (request, status, error) {
      if (MeowOS.error) return;

      MeowOS.ErrorHandler(
        "SYSTEM",
        `Failed to login to MeowOS due to: ${AjaxErrorMsg(request, status, error)}`,
        true
      );
    },
  });
};

let storedUsername = localStorage.getItem("usernameStore");
if (storedUsername) _("overlay-login-username").value = storedUsername;
let storedPassword = localStorage.getItem("passwordStore");
if (storedPassword) {
  _("overlay-login-password").value = storedPassword;
  _("remember-password").click();
}
_("overlay-login-username").select();

_("overlay-login-enter").onclick = Login;
_("overlay-login-username").onkeyup = function (e) {
  if (e.key == "Enter") Login();
};
_("overlay-login-password").onkeyup = function (e) {
  if (e.key == "Enter") Login();
};

_("overlay-login-create").onclick = function () {
  $("#overlay-login").fadeOut(400);
  $("#overlay-create").fadeIn(400);
};
_("overlay-create-login").onclick = function () {
  $("#overlay-create").fadeOut(400);
  $("#overlay-login").fadeIn(400);
};

let getStatus = function () {
  if (MeowOS.error) return;
  $.get(MeowOS.APIURL, function (status) {
    _("overlay-status").innerHTML = `Server Status: <div id="overlay-status-icon" st="up"></div>`;
  }).fail(() => {
    _("overlay-status").innerHTML = `Server Status: <div id="overlay-status-icon" st="down"></div>`;
  });
};
getStatus();
let getStatusInt = setInterval(getStatus, 4000);
