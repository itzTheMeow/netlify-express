MakeWindowsInteractive = function () {
  if (MeowOS.error) return;
  $("window").draggable({
    handle: ".window-title",
    containment: "document",
    stack: "window",
  });
  $("window:not([noresize])").resizable({
    // Makes the proper windows resizeable.
    containment: "document",
    handles: "all",
    minHeight: 50,
    minWidth: 100,
  });
  document.querySelectorAll("window:not([noresize])").forEach((win) => {
    let title = win.querySelector(".window-title");
    let originalSize = {};
    let full = false;
    title.ondblclick = function () {
      // fullscreen on double-click of title bar
      let fullSize = {
        height: _("active-area").offsetHeight,
        width: _("active-area").offsetWidth,
        left: "0px",
        top: "0px",
      };

      let handle = function () {
        let windowElem = title.parentElement;
        let isFull =
          windowElem.offsetWidth == fullSize.width &&
          windowElem.offsetHeight == fullSize.height &&
          windowElem.style.left == fullSize.left &&
          windowElem.style.top == fullSize.top;

        if (!full) {
          full = true;
          originalSize = {
            height: windowElem.offsetHeight,
            width: windowElem.offsetWidth,
            left: windowElem.style.left,
            top: windowElem.style.top,
          };
          $(windowElem).animate(fullSize);
        } else {
          full = false;
          if (!isFull) return handle();
          $(windowElem).animate(originalSize);
        }
      };
      handle();
    };
  });
  // Init minimize buttons.
  document.querySelectorAll(".window-minimize").forEach((minimize) => {
    minimize.onclick = function () {
      if (MeowOS.error) return;
      $(minimize.parentElement).fadeOut({
        start: function () {
          $(this).css("transform", "scale(0.3)");
        },
        complete: function () {
          this.style.display = "none";
        },
        duration: 300,
      });
      let icon = document.querySelector(
        `[for-window="${minimize.parentElement.getAttribute("os-id")}"]`
      );
      icon.onclick = function () {
        minimize.parentElement.style.transform = "";
        minimize.parentElement.style.display = "block";
        icon.onclick = function () {
          minimize.click();
        };
      };
    };
  });
  // Init close buttons.
  document.querySelectorAll(".window-close").forEach((close) => {
    close.onclick = function () {
      let newWINDOWS = [];
      MeowOS.WINDOWS.forEach((w) => {
        if (close.parentElement !== w.window) newWINDOWS.push(w);
      });
      MeowOS.WINDOWS = newWINDOWS;
      $(close.parentElement).fadeOut({
        start: function () {
          $(this).css("transform", "scale(0.3)");
        },
        complete: function () {
          $(this).remove();
        },
        duration: 300,
      });
      let icon = document.querySelector(
        `[for-window="${close.parentElement.getAttribute("os-id")}"]`
      );
      icon.remove();
    };
  });
};

SaveWindows = function () {
  if (MeowOS.error) return;

  let windows = [];
  MeowOS.WINDOWS.forEach((w) => {
    if (w.program.hidden) return;
    windows.push({
      left: w.window.style.left,
      top: w.window.style.top,
      width: w.window.style.width || w.window.offsetWidth + "px",
      height: w.window.style.height || w.window.offsetHeight + "px",
      zIndex: w.window.style["z-index"],
      title: w.title,
      program: w.program.name,
      content: w.content.innerHTML,
    });
  });

  // Formats the window JSON. (for easier reading/editing)
  let formattedWindowContent = js_beautify(JSON.stringify(windows)) || JSON.stringify(windows);

  $.ajax({
    type: "POST",
    url: `${MeowOS.APIURL}fs/writeFile`,
    data: {
      path: "/system/windowStore.syscfg",
      token: Auth.token,
      content: formattedWindowContent,
    },
    error: function (request, status, error) {
      if (MeowOS.error) return;

      MeowOS.ErrorHandler(
        "SYSTEM",
        `Failed to save window data due to: ${AjaxErrorMsg(request, status, error)}`,
        true
      );
    },
  });
};

LoadWindows = function () {
  if (MeowOS.error) return;

  MeowOS.log("i", "SYSTEM", "Loading windowStore...");

  $.ajax({
    type: "POST",
    url: `${MeowOS.APIURL}fs/fetchFiles`,
    data: {
      token: Auth.token,
      path: "/system",
    },
    success: function (f, text) {
      let syscfg = f.files.filter((p) => p.path == "/system/windowStore.syscfg")[0].content;
      MeowOS.log("i", "SYSTEM", "Loaded windowStore...");

      let windowStore = JSON.parse(syscfg) || [];
      windowStore.forEach((w) => {
        let waitInterval = setInterval(function () {
          if (!MeowOS.ProgramList[w.program]) return;
          clearInterval(waitInterval);
          let win = new Window(w.title, w.program);
          win.window.style.top = w.top;
          win.window.style.left = w.left;
          win.window.style.height = w.height;
          win.window.style.width = w.width;
          if (w.zIndex) win.window.style["z-index"] = w.zIndex;
        }, 500);
      });
    },
    error: function (request, status, error) {
      if (MeowOS.error) return;

      MeowOS.ErrorHandler(
        "SYSTEM",
        `Failed to load windowStore due to: ${AjaxErrorMsg(request, status, error)}`,
        true
      );
    },
  });
};

// Detect if windows are off-screen and move them into the screen.
setInterval(function () {
  if (MeowOS.error) return;

  MeowOS.WINDOWS.forEach((W) => {
    if (W.offscreen()) {
      W.window.style.top = "0px";
      W.window.style.left = "0px";
    }
  });
}, 1000);
