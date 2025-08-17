(() => {
  // --- Elements
  const taskInput      = document.getElementById("taskInput");
  const taskDate       = document.getElementById("taskDate");
  const taskCategory   = document.getElementById("taskCategory");
  const addTaskBtn     = document.getElementById("addTaskBtn");
  const searchBox      = document.getElementById("searchBox");
  const filterCategory = document.getElementById("filterCategory");
  const filterStatus   = document.getElementById("filterStatus");
  const taskList       = document.getElementById("taskList");
  const emptyState     = document.getElementById("emptyState");
  const themeToggle    = document.getElementById("themeToggle");
  const root           = document.documentElement;

  // --- State
  let tasks = JSON.parse(localStorage.getItem("tasks-v1") || "[]");
  let theme = localStorage.getItem("theme") || "dark";
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "light" ? "☀️" : "🌙";

  // --- Helpers
  const save = () => localStorage.setItem("tasks-v1", JSON.stringify(tasks));

  const createId = () => Date.now() + Math.random().toString(16).slice(2);

  const formatDate = (iso) => {
    if (!iso) return "No date";
    // keep YYYY-MM-DD readable
    return iso;
  };

  function render() {
    // filters
    const query = searchBox.value.toLowerCase();
    const cat   = filterCategory.value;
    const stat  = filterStatus.value;

    let view = tasks.filter(t =>
      (t.text.toLowerCase().includes(query) ||
       t.category.toLowerCase().includes(query)) &&
      (cat === "all" || t.category === cat) &&
      (stat === "all" ||
       (stat === "completed" && t.completed) ||
       (stat === "pending" && !t.completed))
    );

    // empty state
    emptyState.style.display = view.length ? "none" : "block";

    // render
    taskList.innerHTML = "";
    view.forEach(task => {
      const li = document.createElement("li");
      li.className = `task ${task.completed ? "completed" : ""}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <input type="checkbox" ${task.completed ? "checked" : ""} aria-label="Complete task" />
        <div>
          <div class="task__title">${escapeHtml(task.text)}</div>
          <div class="task__meta">📅 ${formatDate(task.date)} &nbsp; <span class="badge">${task.category}</span></div>
        </div>
        <button class="icon-btn" data-action="edit" title="Edit">✏️</button>
        <button class="icon-btn icon-btn--ok" data-action="toggle" title="Complete">✔</button>
        <button class="icon-btn icon-btn--danger" data-action="delete" title="Delete">🗑️</button>
      `;

      taskList.appendChild(li);
    });
  }

  // tiny XSS-safe escape for titles
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (m) =>
      ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[m])
    );
  }

  // --- Events

  // Add task
  function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push({
      id: createId(),
      text,
      date: taskDate.value || "",
      category: taskCategory.value,
      completed: false
    });

    taskInput.value = "";
    taskDate.value = "";
    save();
    render();
    taskInput.focus();
  }

  addTaskBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  // Delegated actions (edit/toggle/delete + checkbox)
  taskList.addEventListener("click", (e) => {
    const li = e.target.closest(".task");
    if (!li) return;
    const id = li.dataset.id;
    const action = e.target.dataset.action;

    if (action === "edit") {
      const t = tasks.find(x => x.id === id);
      const next = prompt("Edit task text:", t.text);
      if (next !== null) {
        t.text = next.trim() || t.text;
        save(); render();
      }
    } else if (action === "toggle") {
      const t = tasks.find(x => x.id === id);
      t.completed = !t.completed;
      save(); render();
    } else if (action === "delete") {
      tasks = tasks.filter(x => x.id !== id);
      save(); render();
    }
  });

  // checkbox toggle (for accessibility—direct input click)
  taskList.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      const li = e.target.closest(".task");
      const id = li.dataset.id;
      const t = tasks.find(x => x.id === id);
      t.completed = e.target.checked;
      save(); render();
    }
  });

  // Filters
  [searchBox, filterCategory, filterStatus].forEach(el =>
    el.addEventListener("input", render)
  );

  // Theme
  themeToggle.addEventListener("click", () => {
    theme = (theme === "dark") ? "light" : "dark";
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeToggle.textContent = theme === "light" ? "☀️" : "🌙";
  });

  // Initial paint
  render();
})();
