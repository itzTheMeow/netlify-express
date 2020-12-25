let ProgramList = {};
let GetProgram = function (program) {
  if (MeowOS.error) return;
  return ProgramList[(program || "").toLowerCase()] || {};
};

let InstallProgram = function (p) {
  if (MeowOS.error) return;

  MeowOS.log("i", "PROGRAM MANAGER", `Loading '${p}'...`);

  $.ajax({
    type: "GET",
    url: `${APIURL}programs/${p}`,
    success: function (program, text) {
      if (MeowOS.error) return;

      let css = program.style || "";
      if (css) {
        // set CSS for each program in the head tag
        let style = document.createElement("style");
        style.innerHTML = css;
        style.setAttribute("os-for-program", p);
        document.head.appendChild(style);
      }

      let html = program.html || "";
      window[`program-html-${p}`] = html; // temporary until a better solution is found (possibly adding into the script)

      let js = program.script;
      eval(js);

      MeowOS.log("S", "PROGRAM MANAGER", `Loaded '${p}'`);
    },
    error: function (request, status, error) {
      if (MeowOS.error) return;

      MeowOS.ErrorHandler(
        "PROGRAM MANAGER",
        `Failed to load ${p} due to: ${AjaxErrorMsg(request, status, error)}`,
        true
      );
    },
  });
};
let UninstallProgram = function (prog) {
  let newPrograms = [];
  Object.keys(ProgramList).forEach((p) => {
    if (p !== prog) newPrograms.push(p); //TODO: find a better way to do this
  });

  $.ajax({
    type: "POST",
    url: `${APIURL}fs/writeFile`,
    data: {
      path: "/system/installed.syscfg",
      token: Auth.token,
      content: JSON.stringify(newPrograms),
    },
    success: function (data, text) {
      window.location.reload();
    },
    error: function (request, status, error) {
      if (MeowOS.error) return;

      MeowOS.ErrorHandler(
        "SYSTEM",
        `Failed to uninstall ${prog} due to: ${AjaxErrorMsg(request, status, error)}`,
        true
      );
    },
  });
};

let SetPrograms = function () {
  _("taskbar-menu").innerHTML = "";
  Object.keys(ProgramList)
    .sort((a, b) => {
      // Sorts programs by formattedName in programs list.
      a = ProgramList[a].formattedName;
      b = ProgramList[b].formattedName;
      return a > b ? 1 : -1;
    })
    .forEach((prog) => {
      // Creates program in start menu.
      prog = ProgramList[prog];
      if (prog.hidden) return;

      let progBox = document.createElement("div");
      progBox.className = "taskbar-program";
      progBox.setAttribute("noselect", "");
      progBox.onclick = function () {
        new Window(prog.defaultTitle, prog.name);
        _("taskbar-menu").style.display = "none";
      };

      let progIcon = document.createElement("img");
      progIcon.className = "taskbar-program-icon";
      progIcon.src = prog.icon || "";
      progIcon.alt = prog.name;
      progIcon.setAttribute("noselect", "");
      progBox.appendChild(progIcon);

      let progTitle = document.createElement("div");
      progTitle.className = "taskbar-program-title";
      progTitle.innerHTML = prog.formattedName;
      progBox.appendChild(progTitle);

      _("taskbar-menu").appendChild(progBox);
    });

  $.ajax({
    type: "POST",
    url: `${APIURL}fs/writeFile`,
    data: {
      path: "/system/installed.syscfg",
      token: Auth.token,
      content: JSON.stringify(Object.keys(ProgramList)),
    },
    error: function (request, status, error) {
      if (MeowOS.error) return;

      MeowOS.ErrorHandler(
        "PROGRAM MANAGER",
        `Failed to load ${prog} due to: ${AjaxErrorMsg(request, status, error)}`,
        true
      );
    },
  });
};
