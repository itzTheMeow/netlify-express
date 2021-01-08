/**
 * Creates a new window.
 * @constructor
 * @param {String} title - The title to initialize the window with.
 * @param {String} program - The name of the program to run with the window.
 * @param {any} pass - Data to pass to the program when run.
 */
let Window = function (title, program, pass) {
  this.title = title;
  this.program = GetProgram(program);
  this.passedData = pass;
  this.id = Date.now(); //TODO: add actual IDs

  let win = document.createElement("window");
  win.style.position = "absolute";
  win.style.display = "none";
  if (this.program.defaultWidth) win.style.width = this.program.defaultWidth;
  if (this.program.defaultHeight) win.style.height = this.program.defaultHeight;
  if (this.program.minWidth) win.style["min-width"] = this.program.minWidth;
  if (this.program.minHeight) win.style["min-height"] = this.program.minHeight;
  if (this.program.noResize) win.setAttribute("noresize", "");
  win.setAttribute("os-id", this.id);

  let winMaxZ = 1;

  document.querySelectorAll("window").forEach((w) => {
    if (winMaxZ < (Number(w.style["z-index"]) || 1)) winMaxZ = Number(w.style["z-index"]);
  });

  win.style["z-index"] = winMaxZ + 1;

  let winTitle = document.createElement("div");
  winTitle.className = "window-title";
  winTitle.setAttribute("noselect", "");
  winTitle.innerHTML = title;
  win.appendChild(winTitle);

  let winContent = document.createElement("div");
  winContent.className = "window-content";
  win.appendChild(winContent);

  let winMinimize = document.createElement("button");
  winMinimize.className = "window-minimize";
  win.appendChild(winMinimize);

  let winClose = document.createElement("button");
  winClose.className = "window-close";
  win.appendChild(winClose);

  let taskbarIcon = document.createElement("div");
  taskbarIcon.className = "taskbar-item";
  taskbarIcon.setAttribute("for-window", this.id);
  let taskbarIconImage = document.createElement("img");
  taskbarIconImage.className = "taskbar-item-image";
  taskbarIconImage.src = this.program.icon || "";
  taskbarIcon.appendChild(taskbarIconImage);
  taskbarIcon.onclick = function () {
    winMinimize.click();
  };
  _("taskbar-items").appendChild(taskbarIcon);

  _("active-area").appendChild(win);
  // kind of hacky, but it works
  win.style.transform = "scale(0.7)";
  $(win).fadeIn({
    start: function () {
      $(this).css("transform", "scale(1)");
    },
    complete: function () {
      this.style.transform = "";
    },
    duration: 350,
  });

  MakeWindowsInteractive();
  this.window = win;
  this.titleElement = winTitle;
  this.content = winContent;
  this.minimizeButton = winMinimize;
  this.closeButton = winClose;

  // Puts the new window in the middle of the screen.
  win.style.top = _("active-area").offsetHeight / 2 - win.offsetHeight / 2 + "px";
  win.style.left = _("active-area").offsetWidth / 2 - win.offsetWidth / 2 + "px";

  this.offscreen = function () {
    //TODO: find better way of doing this (detect when any part of the window is offscreen)
    var rect = this.window.getBoundingClientRect();
    return (
      rect.x + rect.width < 0 ||
      rect.y + rect.height < 0 ||
      rect.x > window.innerWidth ||
      rect.y > window.innerHeight
    );
  };

  let _this = this;
  this.sizeInterval = setInterval(function () {
    // Sets the height of the window content to the size of the window (minus title bar)
    _this.content.style.height = _this.window.offsetHeight - _this.titleElement.offsetHeight + "px";
  });

  try {
    this.program.eval(this.window, pass);
  } catch (e) {
    console.error(e);
    this.content.innerHTML = "Error."; //TODO: pass actual error, and maybe more info
  }

  MeowOS.WINDOWS.push(this);
};
