// ../assets/javascripts/t2r/storage.js
var LocalStorage = class {
  constructor(prefix) {
    this._prefix = prefix;
    if (typeof window["localStorage"] === "undefined") {
      throw new Error("Missing browser feature: localStorage");
    }
  }
  get prefix() {
    return this._prefix;
  }
  get(key, fallback = void 0) {
    const value = window.localStorage.getItem(this.prefix + key);
    if (value !== null) {
      return value;
    }
    return fallback;
  }
  set(key, value) {
    if (value === null || typeof value === "undefined") {
      return this.delete(key);
    }
    try {
      window.localStorage.setItem(this.prefix + key, value.toString());
      return value;
    } catch (e) {
      console.error("Value not representable as string", value);
      throw "Value could not be stored";
    }
  }
  delete(key) {
    const value = this.get(key);
    window.localStorage.removeItem(this.prefix + key);
    return value;
  }
};
var TemporaryStorage = class {
  constructor() {
    this.data = {};
  }
  get(key, fallback = void 0) {
    if (typeof this.data[key] !== "undefined") {
      return this.data[key];
    }
    return fallback;
  }
  set(key, value) {
    if (value === null || typeof value === "undefined") {
      this.delete(key);
      return value;
    }
    this.data[key] = value;
    return this.data[key];
  }
  delete(key) {
    const value = this.get(key);
    if (key in this.data) {
      delete this.data[key];
    }
    return value;
  }
};

// ../assets/javascripts/t2r/i18n.js
function translate(key, vars = {}) {
  if (typeof T2R_TRANSLATIONS[key] === "undefined") {
    const lang = $("html").attr("lang") || "??";
    return `translation missing: ${lang}.${key}`;
  }
  let result = T2R_TRANSLATIONS[key];
  for (const name in vars) {
    result = result.replace("@" + name, vars[name]);
  }
  return result;
}

// ../assets/javascripts/t2r/datetime.js
var DateTime = class _DateTime {
  constructor(date = void 0) {
    this.date = date || /* @__PURE__ */ new Date();
  }
  toHTMLDateString() {
    const yyyy = this.date.getFullYear();
    const mm = (this.date.getMonth() + 1).toString().padStart(2, "0");
    const dd = this.date.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  toISOString(zeroTime = false) {
    if (!zeroTime) {
      return this.date.toISOString();
    }
    return this.date.toISOString().split("T")[0] + "T00:00:00.000Z";
  }
  static fromString(date) {
    const dateParts = date.split(/[^\d]/).map((part) => {
      return parseInt(part);
    });
    if (dateParts.length < 3) {
      throw `Invalid date: ${date}`;
    }
    for (let i = 3; i <= 6; i++) {
      if (typeof dateParts[i] === "undefined") {
        dateParts[i] = 0;
      }
    }
    for (let i = 1; i <= 6; i++) {
      if (isNaN(dateParts[i]))
        throw `Invalid date: ${date}`;
    }
    if (dateParts[1] < 1 || dateParts[1] > 12) {
      throw `Invalid date: ${date}`;
    }
    try {
      return new _DateTime(new Date(dateParts[0], dateParts[1] - 1, dateParts[2], dateParts[3], dateParts[4], dateParts[5], dateParts[6]));
    } catch (e) {
      console.error("Invalid date", date);
      throw `Invalid date: ${date}`;
    }
  }
};
var DurationRoundingMethod;
(function(DurationRoundingMethod2) {
  DurationRoundingMethod2["Up"] = "U";
  DurationRoundingMethod2["Down"] = "D";
  DurationRoundingMethod2["Regular"] = "R";
})(DurationRoundingMethod || (DurationRoundingMethod = {}));
var Duration = class _Duration {
  constructor(duration = 0) {
    this._seconds = 0;
    duration = duration || 0;
    if ("number" === typeof duration) {
      this.seconds = duration;
      return;
    }
    if (duration.match(/^\d+$/)) {
      this.seconds = parseInt(duration);
      return;
    }
    try {
      this.setHHMM(duration);
    } catch (e) {
      throw 'Error: "' + duration + '" is not a number or an hh:mm string.';
    }
  }
  get hours() {
    return Math.floor(this._seconds / 3600);
  }
  get minutes() {
    return Math.floor(this._seconds / 60);
  }
  get seconds() {
    return this._seconds;
  }
  set seconds(value) {
    if (value < 0) {
      throw `Value cannot be negative: ${value}`;
    }
    this._seconds = value;
  }
  setHHMM(hhmm) {
    let parts = [];
    let pattern;
    let hh;
    let mm;
    const error2 = `Invalid hh:mm format: ${hhmm}`;
    pattern = /^(\d{0,2})$/;
    if (hhmm.match(pattern)) {
      const matches = hhmm.match(pattern);
      hh = parseInt(matches.pop());
      this.seconds = hh * 60 * 60;
      return;
    }
    pattern = /^(\d{0,2}):(\d{0,2})$/;
    if (hhmm.match(pattern)) {
      const matches = hhmm.match(pattern);
      parts = matches.slice(-2);
      mm = parseInt(parts.pop() || "0");
      hh = parseInt(parts.pop() || "0");
      if (mm > 59)
        throw error2;
      this.seconds = hh * 60 * 60 + mm * 60;
      return;
    }
    pattern = /^(\d{0,2})\.(\d{1,2})$/;
    if (hhmm.match(pattern)) {
      const matches = hhmm.match(pattern);
      parts = matches.slice(-2);
      hh = parseInt(parts[0] || "0");
      hh = Math.round(hh);
      mm = parseInt(parts[1] || "0");
      mm = 60 * mm / Math.pow(10, parts[1].length);
      this.seconds = hh * 60 * 60 + mm * 60;
      return;
    }
    throw error2;
  }
  asHHMM() {
    const hh = this.hours.toString().padStart(2, "0");
    const mm = (this.minutes % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
  }
  asDecimal() {
    const hours = this.minutes / 60;
    const output = hours.toFixed(3);
    return output.substr(0, output.length - 1);
  }
  add(other) {
    this.seconds = this.seconds + other.seconds;
  }
  sub(other) {
    this.seconds = Math.max(this.seconds - other.seconds, 0);
  }
  roundTo(minutes, method) {
    if (0 === minutes)
      return;
    const seconds = minutes * 60;
    const correction = this.seconds % seconds;
    if (correction === 0)
      return;
    switch (method) {
      case DurationRoundingMethod.Regular:
        if (correction >= seconds / 2) {
          this.roundTo(minutes, DurationRoundingMethod.Up);
        } else {
          this.roundTo(minutes, DurationRoundingMethod.Down);
        }
        break;
      case DurationRoundingMethod.Up:
        this.add(new _Duration(seconds - correction));
        break;
      case DurationRoundingMethod.Down:
        this.sub(new _Duration(correction));
        break;
      default:
        throw "Invalid rounding method.";
    }
  }
};

// ../assets/javascripts/t2r/flash.js
var Type;
(function(Type2) {
  Type2["Notice"] = "notice";
  Type2["Error"] = "error";
  Type2["Warning"] = "warning";
})(Type || (Type = {}));
function message(text, type = Type.Notice) {
  $("#content").prepend(`<div class="flash t2r ${type}">${text.trim()}</div>`);
}
function error(text) {
  message(text, Type.Error);
}
function clear() {
  $(".t2r.flash").remove();
}

// ../assets/javascripts/t2r/request.js
var RequestQueue = class {
  constructor() {
    this._items = [];
    this._requestInProgress = false;
  }
  get length() {
    return this._items.length;
  }
  addItem(opts) {
    this._items.push(opts);
    this.processItem();
  }
  processItem() {
    if (this.length === 0 || this._requestInProgress)
      return;
    this._requestInProgress = true;
    const that = this;
    const opts = this._items.shift();
    if (opts === void 0) {
      return;
    }
    console.debug("Processing AJAX queue (" + this.length + " remaining).", opts);
    const originalCallback = opts.complete;
    opts.complete = function(xhr, status) {
      if (typeof originalCallback !== "undefined") {
        originalCallback.call(this, xhr, status);
      }
      that._requestInProgress = false;
      that.processItem();
    };
    $.ajax(opts);
  }
};

// ../assets/javascripts/t2r/services.js
var RedmineAPIService = class {
  constructor(apiKey) {
    this._baseUrl = window.location.origin;
    this._apiKey = apiKey;
    this._cache = new TemporaryStorage();
    this.requestQueue = new RequestQueue();
  }
  request(opts) {
    if (!opts.url)
      throw "Missing required parameter: url";
    if (opts.url.match(/^\//)) {
      opts.url = this._baseUrl + opts.url;
    }
    opts.headers = opts.headers || {};
    opts.headers["X-Redmine-API-Key"] = this._apiKey;
    opts.timeout = opts.timeout || 3e3;
    this.requestQueue.addItem(opts);
  }
  handleRequestSuccess(type, data) {
    console.debug(`Request succeeded: ${type}`, data);
  }
  handleRequestError(type) {
    error(translate("t2r.error.ajax_load"));
    console.error(`Request failed: ${type}`);
  }
  getTimeEntries(params, callback) {
    const that = this;
    this.request({
      async: true,
      method: "get",
      url: "/toggl2redmine/redmine/time_entries",
      data: {
        from: params.from.toISOString(true),
        till: params.till.toISOString(true)
      },
      success: function(data) {
        if (typeof data.time_entries === "undefined") {
          that.handleRequestError("Redmine time entries");
          callback(null);
          return;
        }
        that.handleRequestSuccess("Redmine time entries", data);
        const time_entries = data.time_entries.map((entry) => {
          entry.duration = new Duration(Math.floor(parseFloat(entry.hours) * 3600));
          return entry;
        });
        callback(time_entries);
      },
      error: () => {
        that.handleRequestError("Redmine time entries");
        callback(null);
      }
    });
  }
  getTimeEntryActivities(callback) {
    const activities = this._cache.get("redmine.activities");
    if (activities) {
      callback(activities);
      return;
    }
    const that = this;
    this.request({
      url: "/enumerations/time_entry_activities.json",
      success: (data) => {
        that.handleRequestSuccess("Time entry activities", data);
        that._cache.set("redmine.activities", data.time_entry_activities);
        callback(data.time_entry_activities);
      },
      error: () => {
        that.handleRequestError("Time entry activities");
        callback(null);
      }
    });
  }
  getLastImportDate(callback) {
    const opts = {};
    opts.url = "/time_entries.json";
    opts.data = {
      user_id: "me",
      limit: 1,
      to: new DateTime().toHTMLDateString()
    };
    const that = this;
    opts.success = (data) => {
      this.handleRequestSuccess("Last import date", data);
      if (data.time_entries.length === 0) {
        callback(null);
        return;
      }
      const lastTimeEntry = data.time_entries.pop();
      const lastImportDate = DateTime.fromString(`${lastTimeEntry.spent_on} 00:00:00`);
      callback(lastImportDate);
    };
    opts.error = () => {
      that.handleRequestError("Last import date");
      callback(null);
    };
    this.request(opts);
  }
  getTogglTimeEntries(params, callback) {
    const data = {
      from: params.from.toISOString(),
      till: params.till.toISOString(),
      workspace_id: params.workspaceId || null
    };
    this.request({
      url: "/toggl2redmine/toggl/time_entries",
      data,
      success: (time_entries) => {
        this.handleRequestSuccess("Toggl time entries", time_entries);
        callback(time_entries);
      },
      error: () => {
        this.handleRequestError("Toggl time entries");
        callback({});
      }
    });
  }
  getTogglWorkspaces(callback) {
    const workspaces = this._cache.get("toggl.workspaces");
    if (workspaces) {
      callback(workspaces);
      return;
    }
    const that = this;
    this.request({
      url: "/toggl2redmine/toggl/workspaces",
      success: (workspaces2) => {
        that.handleRequestSuccess("Toggl workspaces", workspaces2);
        that._cache.set("toggl.workspaces", workspaces2);
        callback(workspaces2);
      },
      error: () => {
        that.handleRequestError("Toggl workspaces");
        callback(null);
      }
    });
  }
  postTimeEntry(params, callback) {
    const that = this;
    this.request({
      async: true,
      url: "/toggl2redmine/import",
      method: "post",
      data: JSON.stringify(params),
      contentType: "application/json",
      success: (data) => {
        that.handleRequestSuccess("Time entry import", data);
        callback([]);
      },
      error: function(xhr) {
        that.handleRequestError("Time entry import");
        let errors;
        try {
          const oResponse = JSON.parse(xhr.responseText);
          errors = typeof oResponse.errors === "undefined" ? ["Unknown error"] : oResponse.errors;
        } catch (e) {
          errors = ["The server returned an unexpected response"];
        }
        callback(errors);
      }
    });
  }
};

// ../assets/javascripts/t2r/widgets.js
var redmineService = new RedmineAPIService(T2R_REDMINE_API_KEY);
function buildDropdownFromDictionary(data) {
  const $el = $("<select />");
  const placeholder = data.placeholder || null;
  const attributes = data.attributes || null;
  if (placeholder) {
    $el.append(`<option value="">${placeholder}</option>`);
  }
  if (attributes) {
    $el.attr(attributes);
  }
  for (const value in data.options) {
    const label = data.options[value];
    $el.append(`<option value="${value}">${label}</option>`);
  }
  return $el;
}
function buildDropdownFromRecords(data) {
  const options = {};
  for (const record of data.records) {
    options[record.id.toString()] = record.name;
  }
  return buildDropdownFromDictionary({
    options,
    attributes: data.attributes,
    placeholder: data.placeholder
  });
}
function initialize(el = document.body) {
  $(el).find("[data-t2r-widget]").each(function() {
    const widgetList = this.getAttribute("data-t2r-widget");
    if (!widgetList)
      return;
    for (const widget of widgetList.split(" ")) {
      const flag = `Widget${widget}Ready`;
      if (this.dataset[flag] == "true") {
        continue;
      }
      let initializer;
      switch (widget) {
        case "Tooltip":
          initializer = initTooltip;
          break;
        case "TogglRow":
          initializer = initTogglRow;
          break;
        case "DurationInput":
          initializer = initDurationInput;
          break;
        case "DurationRoundingMethodDropdown":
          initializer = initDurationRoundingMethodDropdown;
          break;
        case "RedmineActivityDropdown":
          initializer = initRedmineActivityDropdown;
          break;
        case "TogglWorkspaceDropdown":
          initializer = initTogglWorkspaceDropdown;
          break;
        default:
          throw `Unrecognized widget: ${widget}`;
      }
      this.dataset[flag] = "true";
      this.classList.add(`t2r-widget-${widget}`);
      initializer(this);
    }
  });
}
function initTooltip(el) {
  $(el).tooltip();
}
function initTogglRow(el) {
  const $el = $(el);
  $el.find(".cb-import").on("change", function() {
    const $checkbox = $(this);
    const $tr = $checkbox.closest("tr");
    if ($checkbox.is(":checked")) {
      $tr.find(":input").not(".cb-import").removeAttr("disabled").attr("required", "required");
    } else {
      $tr.find(":input").not(".cb-import").removeAttr("required").attr("disabled", "disabled");
    }
  }).trigger("change");
  $el.find(":input").tooltip();
}
function initDurationInput(el) {
  const input = el;
  const $el = $(el);
  $el.on("input", function() {
    const val = $el.val();
    try {
      new Duration(val);
      input.setCustomValidity("");
    } catch (e) {
      if (e instanceof Error) {
        input.setCustomValidity(e.toString());
      } else {
        throw e;
      }
    }
  }).on("keyup", function(e) {
    const $input = $(this);
    const dur = new Duration();
    try {
      dur.setHHMM($input.val());
    } catch (e2) {
      return;
    }
    const mm = dur.minutes % 60;
    const step = e.shiftKey ? 15 : 5;
    let delta = 0;
    if (e.key === "ArrowUp") {
      delta = step - mm % step;
      dur.add(new Duration(delta * 60));
    } else if (e.key === "ArrowDown") {
      delta = mm % step || step;
      dur.sub(new Duration(delta * 60));
    } else {
      return;
    }
    $(this).val(dur.asHHMM()).trigger("input").trigger("select");
  }).on("change", function() {
    const $input = $(this);
    const value = $input.val();
    const dur = new Duration();
    try {
      dur.setHHMM(value);
    } catch (e) {
      console.debug(`Could not understand time: ${value}`);
    }
    $input.val(dur.asHHMM());
  });
}
function initDurationRoundingMethodDropdown(el) {
  const $el = $(el);
  const options = {};
  options[DurationRoundingMethod.Regular] = "Round off";
  options[DurationRoundingMethod.Up] = "Round up";
  options[DurationRoundingMethod.Down] = "Round down";
  const $select = buildDropdownFromDictionary({
    placeholder: "Don't round",
    options
  });
  $el.append($select.find("option"));
}
function initRedmineActivityDropdown(el) {
  const $el = $(el);
  redmineService.getTimeEntryActivities((activities) => {
    if (activities === null)
      return;
    const activeActivities = activities.filter((a) => a.active !== false);
    const $select = buildDropdownFromRecords({
      placeholder: $el.data("placeholder"),
      records: activeActivities
    });
    $el.append($select.find("option")).val("");
    let value = $el.data("selected") || "";
    if (value && !activeActivities.find((a) => a.id.toString() === value.toString())) {
      const defaultActivity = activeActivities.find((a) => a.is_default);
      value = defaultActivity ? defaultActivity.id : "";
    }
    $el.val(value).removeData("selected");
  });
}
function initTogglWorkspaceDropdown(el) {
  const $el = $(el);
  redmineService.getTogglWorkspaces((workspaces) => {
    if (workspaces === null)
      return;
    const $select = buildDropdownFromRecords({
      placeholder: $el.data("placeholder"),
      records: workspaces
    });
    $el.append($select.find("option"));
    const value = $el.data("selected");
    if ("undefined" !== typeof value) {
      $el.val(value).data("selected", null);
    }
  });
}

// ../assets/javascripts/t2r/utils.js
function htmlEntityEncode(str) {
  return $("<div />").text(str).text().replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function getDateFromLocationHash() {
  const matches = window.location.hash.match(/^#?([\d]{4}-[\d]{2}-[\d]{2})$/);
  if (!matches)
    return;
  const match = matches.pop();
  try {
    return DateTime.fromString(match).toHTMLDateString();
  } catch (e) {
    console.debug("Date not detected in URL fragment");
  }
}
var EventManager = class {
  constructor() {
    this.listeners = {};
  }
  on(eventName, callback) {
    if (typeof this.listeners[eventName] === "undefined") {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }
  trigger(eventName) {
    if (typeof this.listeners[eventName] === "undefined")
      return;
    for (const listener of this.listeners[eventName]) {
      listener();
    }
  }
};

// ../assets/javascripts/t2r/renderers.js
function renderRedmineProjectLabel(project) {
  const classes = ["project"];
  if (project.status != 1) {
    classes.push("closed");
  }
  return '<a href="' + project.path + '" class="' + classes.join(" ") + '" target="_blank"><strong>' + htmlEntityEncode(project.name) + "</strong></a>";
}
function renderRedmineProjectStubLabel() {
  return '<span class="project"><strong>-</strong></span>';
}
function renderRedmineIssueLabel(issue) {
  const classes = ["issue"];
  if (issue.is_closed) {
    classes.push("closed");
  }
  return '<a href="' + issue.path + '" class="' + classes.join(" ") + '" target="_blank">' + htmlEntityEncode(issue ? issue.tracker.name : "-") + htmlEntityEncode(issue ? " #" + issue.id : "") + htmlEntityEncode(issue.subject ? ": " + issue.subject : "") + "</a>";
}
function renderRedmineIssueStubLabel(issueId) {
  if (!issueId) {
    return "Unknown";
  }
  return "#" + issueId.toString() + ": -";
}
function renderTogglRow(data) {
  const issue = data.issue;
  const issueLabel = issue ? renderRedmineIssueLabel(issue) : renderRedmineIssueStubLabel(data.issue_id);
  const project = data.project || null;
  const projectLabel = project ? renderRedmineProjectLabel(project) : renderRedmineProjectStubLabel();
  const oDuration = data.duration;
  const rDuration = data.roundedDuration;
  const markup = '<tr data-t2r-widget="TogglRow"><td class="checkbox"><input class="cb-import" type="checkbox" value="1" title="Check this box if you want to import this entry." /></td><td class="status"></td><td class="issue"><input data-property="issue_id" type="hidden" data-value="' + htmlEntityEncode(issue ? issue.id.toString() : "") + '" value="' + htmlEntityEncode(issue ? issue.id.toString() : "") + '" />' + projectLabel + "<br />" + issueLabel + '</td><td class="comments"><input data-property="comments" type="text" value="' + htmlEntityEncode(data.comments) + '" maxlength="255" /></td><td class="activity"><select data-property="activity_id" required="required" data-placeholder="-" data-t2r-widget="RedmineActivityDropdown"></select></td><td class="hours"><input data-property="hours" required="required" data-t2r-widget="DurationInput" type="text" title="Value as on Toggl is ' + oDuration.asHHMM() + '." value="' + rDuration.asHHMM() + '" size="6" maxlength="5" /></td></tr>';
  const $tr = $(markup);
  $tr.data("t2r.entry", data);
  let statusLabel = null;
  switch (data.status) {
    case "pending":
      if (data.errors.length > 0) {
        $tr.addClass("t2r-error");
        $tr.find(":input").attr("disabled", "disabled");
        statusLabel = renderImportStatusLabel("Invalid", data.errors.join("\n"), "error");
      }
      break;
    case "imported":
      $tr.find(".cb-import").removeAttr("checked");
      $tr.addClass("t2r-success");
      $tr.find(":input").attr("disabled", "disabled");
      statusLabel = renderImportStatusLabel("Imported");
      break;
    case "running":
      $tr.addClass("t2r-running");
      $tr.find(":input").attr("disabled", "disabled");
      statusLabel = renderImportStatusLabel("Running", "The timer is still running on Toggl.", "error");
      break;
    default:
      throw `Unrecognized status: ${data.status}.`;
  }
  if (statusLabel) {
    $tr.find("td.status").html(statusLabel);
  }
  return $tr;
}
function renderRedmineRow(data) {
  const issue = data.issue;
  const issueLabel = renderRedmineIssueLabel(issue);
  const project = data.project;
  const projectLabel = renderRedmineProjectLabel(project);
  const oDuration = data.duration;
  oDuration.roundTo(1, DurationRoundingMethod.Up);
  const markup = '<tr id="time-entry-' + data.id + '"  class="time-entry hascontextmenu"><td class="subject">' + projectLabel + "<br />" + issueLabel + '<input type="checkbox" name="ids[]" value="' + data.id + '" hidden /></td><td class="comments">' + htmlEntityEncode(data.comments) + '</td><td class="activity">' + htmlEntityEncode(data.activity.name) + '</td><td class="hours">' + oDuration.asHHMM() + '</td><td class="buttons">' + T2R_BUTTON_ACTIONS + "</td></tr>";
  const $tr = $(markup);
  $tr.find(".js-contextmenu").on("click", contextMenuRightClick);
  return $tr;
}
function renderImportStatusLabel(label, description = null, icon = "checked") {
  const el = document.createElement("span");
  el.innerHTML = label;
  el.dataset.t2rWidget = "Tooltip";
  el.classList.add("icon", `icon-${icon}`);
  if (description) {
    el.setAttribute("title", description);
  }
  return el;
}

// ../assets/javascripts/t2r.js
var ImportForm = class {
  constructor(element, filterForm, redmineAPI, redmineReport, togglReport) {
    const that = this;
    this.element = $(element);
    this.importButton = this.element.find("#btn-import");
    this.filterForm = filterForm;
    this.redmineAPI = redmineAPI;
    this.redmineReport = redmineReport;
    this.togglReport = togglReport;
    this.filterForm.eventManager.on("preSubmit", function() {
      that.disable();
    });
    this.filterForm.eventManager.on("postSubmit", function() {
      that.enable();
    });
    this.element.on("submit", () => {
      that.onSubmit();
      return false;
    });
  }
  onSubmit() {
    const that = this;
    const filterFormValues = this.filterForm.getValues();
    if (!confirm(translate("t2r.import_confirmation"))) {
      return;
    }
    this.disable();
    clear();
    if (this.togglReport.element.find("tbody input.cb-import").filter(":checked").length === 0) {
      error(translate("t2r.error.no_entries_selected"));
      this.enable();
      return;
    }
    console.info("Sending time entries to Redmine.");
    this.togglReport.element.find("tbody tr").each(function() {
      const $tr = $(this);
      if (!$tr.find("input.cb-import").prop("checked")) {
        return;
      }
      const timeEntry = {
        spent_on: filterFormValues["date"],
        issue_id: parseInt($tr.find('[data-property="issue_id"]').val()),
        comments: $tr.find('[data-property="comments"]').val(),
        activity_id: parseInt($tr.find('[data-property="activity_id"]').val()),
        hours: "0.00"
      };
      const dur = new Duration();
      try {
        dur.setHHMM($tr.find('[data-property="hours"]').val());
        timeEntry.hours = dur.asDecimal();
      } catch (e) {
        console.warn("Entry ignored: Invalid duration.", timeEntry);
        return;
      }
      if (dur.seconds < 30) {
        console.warn("Entry ignored: Duration is less than 30 seconds.", timeEntry);
        return;
      }
      that.redmineAPI.postTimeEntry({
        time_entry: timeEntry,
        toggl_ids: $tr.data("t2r.entry").ids
      }, (errors) => {
        if (that.redmineAPI.requestQueue.length === 0) {
          that.enable();
          that.redmineReport.update();
        }
        if (errors.length !== 0) {
          $tr.addClass("t2r-error");
          const statusLabel2 = renderImportStatusLabel("Failed", errors.join("\n"), "error");
          $tr.find("td.status").html(statusLabel2);
          return;
        }
        $tr.addClass("t2r-success");
        $tr.find(":input").attr("disabled", "disabled");
        $tr.find("input.cb-import").removeAttr("checked");
        const statusLabel = renderImportStatusLabel("Imported");
        $tr.find("td.status").html(statusLabel);
      });
    });
  }
  disable() {
    this.importButton.attr("disabled", "disabled");
  }
  enable() {
    this.importButton.removeAttr("disabled");
  }
};
var FilterForm = class {
  constructor(element, localStorage) {
    const that = this;
    this.element = $(element);
    this.localStorage = localStorage;
    this.eventManager = new EventManager();
    this.element.find("#btn-apply-filters").on("click", () => {
      return that.onSubmit();
    });
    this.element.find("#btn-reset-filters").on("click", () => {
      that.reset();
      return false;
    });
    this.element.on("submit", (e) => {
      e.preventDefault();
      return that.onSubmit();
    });
  }
  getDefaults() {
    const values = {};
    values["date"] = new DateTime().toHTMLDateString();
    const workspaceId = this.localStorage.get("toggl-workspace-id");
    if (workspaceId) {
      values["toggl-workspace-id"] = parseInt(workspaceId);
    }
    const defaultActivityId = this.localStorage.get("default-activity-id");
    if (defaultActivityId) {
      values["default-activity-id"] = parseInt(defaultActivityId);
    }
    const roundingValue = this.localStorage.get("rounding-value") || "0";
    values["rounding-value"] = parseInt(roundingValue);
    const roundingMethod = this.localStorage.get("rounding-method");
    if (roundingMethod) {
      values["rounding-method"] = roundingMethod;
    }
    return values;
  }
  getValues() {
    const values = {};
    const $defaultActivityId = $("select#default-activity-id");
    const defaultActivityId = $defaultActivityId.val() || $defaultActivityId.data("selected");
    if (defaultActivityId) {
      values["default-activity-id"] = parseInt(defaultActivityId);
    }
    const $togglWorkspaceId = $("select#toggl-workspace-id");
    const togglWorkspaceId = $togglWorkspaceId.val() || $togglWorkspaceId.data("selected");
    if (togglWorkspaceId) {
      values["toggl-workspace-id"] = togglWorkspaceId;
    }
    const sRoundingValue = $("input#rounding-value").val();
    const nRoundingValue = parseInt(sRoundingValue);
    if (sRoundingValue && !isNaN(nRoundingValue)) {
      values["rounding-value"] = parseInt(sRoundingValue);
    }
    const roundingMethod = $("select#rounding-method").val();
    if (roundingMethod) {
      values["rounding-method"] = roundingMethod;
    }
    const sDate = $("#date").val();
    try {
      DateTime.fromString(sDate);
      values["date"] = sDate;
    } catch (e) {
      console.error(e);
    }
    return values;
  }
  setValues(values) {
    this.element.find(":input").each(function() {
      const $field = $(this);
      const name = $field.attr("name");
      if (!name)
        return;
      switch (name) {
        case "date":
          if (!values["date"])
            return;
          $field.val(values["date"]);
          break;
        case "default-activity-id":
          if (!values["default-activity-id"])
            return;
          $field.data("selected", values["default-activity-id"]).val(values["default-activity-id"]);
          break;
        case "toggl-workspace-id":
          if (!values["toggl-workspace-id"])
            return;
          $field.data("selected", values["toggl-workspace-id"]).val(values["toggl-workspace-id"]);
          break;
        case "rounding-method":
          if (!values["rounding-method"])
            return;
          $field.val(values["rounding-method"]);
          break;
        case "rounding-value":
          if (!values["rounding-value"])
            return;
          $field.val(values["rounding-value"]);
          break;
        default:
          throw `Unexpected field: ${name}`;
      }
    });
  }
  reset(values = {}) {
    const defaults = this.getDefaults();
    if (!values["date"]) {
      values["date"] = defaults["date"];
    }
    if (!values["default-activity-id"]) {
      values["default-activity-id"] = defaults["default-activity-id"];
    }
    if (!values["toggl-workspace-id"]) {
      values["toggl-workspace-id"] = defaults["toggl-workspace-id"];
    }
    if (!values["rounding-method"]) {
      values["rounding-method"] = defaults["rounding-method"];
    }
    if (!values["rounding-value"]) {
      values["rounding-value"] = defaults["rounding-value"];
    }
    this.element.find(":input").val("");
    this.setValues(values);
    this.onSubmit();
  }
  onSubmit() {
    this.eventManager.trigger("preSubmit");
    const values = this.getValues();
    if (!values["date"]) {
      this.element.find("#date").trigger("focus");
      return false;
    }
    const oDate = DateTime.fromString(values["date"]);
    if (!oDate) {
      error(translate("t2r.error.date_invalid"));
      this.element.find("#date").trigger("focus");
      return false;
    }
    this.localStorage.set("default-activity-id", values["default-activity-id"]);
    this.localStorage.set("toggl-workspace-id", values["toggl-workspace-id"]);
    this.localStorage.set("rounding-value", values["rounding-value"]);
    this.localStorage.set("rounding-method", values["rounding-method"]);
    console.info("Filter updated", values);
    window.location.hash = oDate.toHTMLDateString();
    $("h2 .date").html("(" + oDate.date.toLocaleDateString() + ")");
    this.eventManager.trigger("postSubmit");
    return false;
  }
};
var RedmineReport = class {
  constructor(element, filterForm, redmineAPI) {
    const that = this;
    this.element = $(element);
    this.lastImported = $("#last-imported");
    this.filterForm = filterForm;
    this.redmineAPI = redmineAPI;
    this.filterForm.eventManager.on("postSubmit", function() {
      that.update();
    });
  }
  update() {
    const that = this;
    this.showLoader();
    this.makeEmpty();
    const sDate = this.filterForm.getValues()["date"];
    const oDate = DateTime.fromString(sDate);
    this.updateLink(oDate);
    this.updateLastImportDate();
    const query = { from: oDate, till: oDate };
    this.redmineAPI.getTimeEntries(query, (entries) => {
      if (entries === null) {
        entries = [];
      }
      if (entries.length === 0) {
        that.showEmptyMessage();
      }
      for (const time_entry of entries) {
        const markup = renderRedmineRow(time_entry);
        that.element.find("tbody").append(markup);
      }
      that.updateTotal();
      that.hideLoader();
    });
  }
  updateLink(date) {
    const url = `/time_entries?utf8=\u2713&set_filter=1&sort=spent_on:desc&f[]=spent_on&op[spent_on]=%3D&v[spent_on][]=[${date.toHTMLDateString()}]&f[]=user_id&op[user_id]=%3D&v[user_id][]=me&c[]=project&c[]=spent_on&c[]=user&c[]=activity&c[]=issue&c[]=comments&c[]=hours&group_by=spent_on&t[]=hours&t[]=`;
    $("#redmine-report-link").attr("href", url);
  }
  updateTotal() {
    const total = new Duration();
    this.element.find("tbody tr .hours").each(function() {
      const hours = $(this).text().trim();
      if (hours.length > 0) {
        total.add(new Duration(hours));
      }
    });
    this.element.find('[data-property="total-hours"]').html(total.asHHMM());
  }
  updateLastImportDate() {
    const that = this;
    this.lastImported.html("&nbsp;").addClass("t2r-loading");
    this.redmineAPI.getLastImportDate((lastImportDate) => {
      const sDate = lastImportDate ? lastImportDate.date.toLocaleDateString() : "Unknown";
      that.lastImported.text(sDate).removeClass("t2r-loading");
    });
  }
  showEmptyMessage() {
    const colspan = this.element.find("thead tr:first th").length;
    const message2 = translate("t2r.error.list_empty");
    const markup = `<tr><td colspan="${colspan}">${message2}</td></tr>`;
    this.element.find("tbody").html(markup);
  }
  makeEmpty() {
    this.element.find("tbody").html("");
  }
  showLoader() {
    this.element.addClass("t2r-loading");
  }
  hideLoader() {
    this.element.removeClass("t2r-loading");
  }
};
var TogglReport = class {
  constructor(element, filterForm, redmineAPI) {
    const that = this;
    this.element = $(element);
    this.checkAll = this.element.find("input.check-all");
    this.filterForm = filterForm;
    this.redmineAPI = redmineAPI;
    this.filterForm.eventManager.on("postSubmit", function() {
      that.update();
    });
    this.checkAll.on("change", () => {
      const checked = $(that.checkAll).prop("checked");
      that.element.find("tbody input.cb-import:enabled").prop("checked", checked).trigger("change");
    });
  }
  update() {
    const that = this;
    const filterFormValues = this.filterForm.getValues();
    this.showLoader();
    this.makeEmpty();
    const sDate = filterFormValues["date"];
    const oDate = DateTime.fromString(sDate);
    const workspaceId = filterFormValues["toggl-workspace-id"];
    this.updateLink(oDate, workspaceId);
    this.checkAll.prop("checked", false).attr("disabled", "disabled");
    const query = {
      from: DateTime.fromString(sDate + " 00:00:00"),
      till: DateTime.fromString(sDate + " 23:59:59"),
      workspaceId
    };
    this.redmineAPI.getTogglTimeEntries(query, (entries) => {
      let pendingEntriesExist = false;
      const roundingValue = filterFormValues["rounding-value"];
      const roundingMethod = filterFormValues["rounding-method"];
      for (const key in entries) {
        const entry = entries[key];
        entry.duration = new Duration(Math.max(0, entry.duration));
        entry.roundedDuration = new Duration(entry.duration.seconds);
        if (roundingMethod && roundingValue > 0) {
          entry.roundedDuration.roundTo(roundingValue, roundingMethod);
        } else {
          entry.roundedDuration.roundTo(1, DurationRoundingMethod.Regular);
        }
        entries[key] = entry;
      }
      if (Object.keys(entries).length === 0) {
        this.showEmptyMessage();
      }
      for (const key in entries) {
        const entry = entries[key];
        if (entry.status === "running") {
          const $tr = renderTogglRow(entry);
          that.element.find("tbody").append($tr);
          delete entries[key];
        }
      }
      const sDefaultActivityId = filterFormValues["default-activity-id"] ? filterFormValues["default-activity-id"].toString() : "";
      for (const key in entries) {
        const entry = entries[key];
        if (entry.status === "pending" && entry.errors.length === 0) {
          const $tr = renderTogglRow(entry);
          that.element.find("tbody").append($tr);
          pendingEntriesExist = true;
          $tr.find("input[data-property=hours]").on("input change", () => {
            that.updateTotal();
          });
          $tr.find("select[data-property=activity_id]").attr("data-selected", sDefaultActivityId);
          $tr.find(".cb-import").on("change", () => {
            that.updateTotal();
          });
        }
      }
      for (const key in entries) {
        const entry = entries[key];
        if (entry.status === "pending" && entry.errors.length > 0) {
          const $tr = renderTogglRow(entry);
          that.element.find("tbody").append($tr);
        }
      }
      for (const key in entries) {
        const entry = entries[key];
        if (entry.status === "imported") {
          const $tr = renderTogglRow(entry);
          that.element.find("tbody").append($tr);
        }
      }
      that.updateTotal();
      initialize(that.element[0]);
      that.hideLoader();
      if (!pendingEntriesExist) {
        return;
      }
      that.checkAll.removeAttr("disabled");
      if (that.filterForm.element.has(":focus").length > 0) {
        that.checkAll.trigger("focus");
      }
    });
  }
  updateLink(date, workspaceId) {
    workspaceId = workspaceId || 0;
    const url = `https://track.toggl.com/reports/summary/${workspaceId}/from/${date.toHTMLDateString()}/to/${date.toHTMLDateString()}`;
    $("#toggl-report-link").attr("href", url);
  }
  updateTotal() {
    const total = new Duration();
    this.element.find("tbody tr").each(function() {
      const $tr = $(this);
      const dur = new Duration();
      if ($tr.hasClass("t2r-error")) {
        return;
      }
      if (!$tr.find(".cb-import").is(":checked")) {
        return;
      }
      const hours = $tr.find('[data-property="hours"]').val();
      try {
        dur.setHHMM(hours);
        total.add(dur);
      } catch (e) {
        console.error(e);
      }
    });
    this.element.find('[data-property="total-hours"]').html(total.asHHMM());
  }
  showEmptyMessage() {
    const colspan = this.element.find("thead tr:first th").length;
    const message2 = translate("t2r.error.list_empty");
    const markup = `<tr><td colspan="${colspan}">${message2}</td></tr>`;
    this.element.find("tbody").html(markup);
  }
  makeEmpty() {
    this.element.find("tbody").html("");
  }
  showLoader() {
    this.element.addClass("t2r-loading");
  }
  hideLoader() {
    this.element.removeClass("t2r-loading");
  }
};
var Application = class _Application {
  constructor(redmineAPI, localStorage = void 0, filterForm = void 0, redmineReport = void 0, togglReport = void 0, importForm = void 0) {
    this.redmineAPI = redmineAPI;
    this.localStorage = localStorage || new LocalStorage("toggl2redmine.");
    this.filterForm = filterForm || new FilterForm(document.getElementById("filter-form"), this.localStorage);
    this.redmineReport = redmineReport || new RedmineReport(document.getElementById("redmine-report"), this.filterForm, this.redmineAPI);
    this.togglReport = togglReport || new TogglReport(document.getElementById("toggl-report"), this.filterForm, this.redmineAPI);
    this.importForm = importForm || new ImportForm(document.getElementById("import-form"), this.filterForm, this.redmineAPI, this.redmineReport, this.togglReport);
  }
  static instance() {
    if (!_Application._instance) {
      _Application._instance = new _Application(new RedmineAPIService(T2R_REDMINE_API_KEY));
    }
    return _Application._instance;
  }
  initialize() {
    this.filterForm.reset({ date: getDateFromLocationHash() });
  }
};
$(() => {
  initialize();
  Application.instance().initialize();
});
