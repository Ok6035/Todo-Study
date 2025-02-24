document.addEventListener("DOMContentLoaded", function () {
  // Elements for task creation and subject controls
  const todoText = document.getElementById("todoText");
  const priority = document.getElementById("priority");
  const subject = document.getElementById("subject");
  const subSubject = document.getElementById("subSubject");
  const addTodoButton = document.getElementById("addTodo");
  const deleteSubjectButton = document.getElementById("deleteSubject");
  const deleteSubSubjectButton = document.getElementById("deleteSubSubject");
  const todoList = document.getElementById("todoList");
  const startAllTimersButton = document.getElementById("startAllTimers");
  const timerStatus = document.getElementById("timerStatus");
  const realtime = document.getElementById("realtime");
  const darkModeToggle = document.getElementById("darkModeToggle");

  // Default subjects and mappings
  const defaultMainSubjects = ["STATISTICS", "MATHEMATICS", "ECONOMICS"];
  const subSubjectsMapping = {
    STATISTICS: ["Probability", "Data Analysis", "Inferential"],
    MATHEMATICS: ["Algebra", "Calculus", "Geometry"],
    ECONOMICS: ["Microeconomics", "Macroeconomics", "Econometrics"],
  };
  const customSubs = {
    STATISTICS: [],
    MATHEMATICS: [],
    ECONOMICS: [],
  };
  const customMainSubjects = [];

  // Timer state variables
  let isTimerRunning = false;
  let taskQueue = [];
  let currentTaskIndex = 0;
  let countdownIntervalId = null;

  // Toggle dark mode function
  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
    darkModeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  }

  // Check stored preference for dark mode
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️";
  } else {
    darkModeToggle.textContent = "🌙";
  }

  darkModeToggle.addEventListener("click", toggleDarkMode);

  // Update sub-subject dropdown based on selected subject
  function updateSubSubjects(selectedSubject) {
    subSubject.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "None";
    defaultOption.textContent = "Select Sub-Subject";
    subSubject.appendChild(defaultOption);

    const subs = subSubjectsMapping[selectedSubject] || [];
    subs.forEach(function (item) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      subSubject.appendChild(option);
    });
    (customSubs[selectedSubject] || []).forEach(function (item) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      subSubject.appendChild(option);
    });
    const addMoreOption = document.createElement("option");
    addMoreOption.value = "ADD_MORE";
    addMoreOption.textContent = "Add More";
    subSubject.appendChild(addMoreOption);
  }

  subSubject.addEventListener("change", function () {
    if (subSubject.value === "ADD_MORE") {
      const customSub = prompt("Enter custom sub-subject:");
      const currentSubject = subject.value;
      if (customSub && customSub.trim() !== "") {
        if (!customSubs[currentSubject].includes(customSub.trim())) {
          customSubs[currentSubject].push(customSub.trim());
        }
        updateSubSubjects(currentSubject);
        subSubject.value = customSub.trim();
      } else {
        subSubject.value = "None";
      }
    }
  });

  subject.addEventListener("change", function () {
    if (subject.value === "ADD_MORE") {
      const customMain = prompt("Enter custom subject:");
      if (customMain && customMain.trim() !== "") {
        customMainSubjects.push(customMain.trim());
        const newOption = document.createElement("option");
        newOption.value = customMain.trim();
        newOption.textContent = customMain.trim();
        subject.insertBefore(newOption, subject.lastElementChild);
        subject.value = customMain.trim();
        subSubjectsMapping[customMain.trim()] = [];
        customSubs[customMain.trim()] = [];
      } else {
        subject.value = subject.options[0].value;
      }
    }
    updateSubSubjects(subject.value);
  });

  deleteSubjectButton.addEventListener("click", function () {
    const selected = subject.value;
    if (defaultMainSubjects.includes(selected)) {
      alert("Default subjects cannot be deleted.");
    } else {
      if (confirm(`Are you sure you want to delete the subject "${selected}"?`)) {
        const index = customMainSubjects.indexOf(selected);
        if (index !== -1) customMainSubjects.splice(index, 1);
        for (let i = 0; i < subject.options.length; i++) {
          if (subject.options[i].value === selected) {
            subject.remove(i);
            break;
          }
        }
        delete subSubjectsMapping[selected];
        delete customSubs[selected];
        subject.value = defaultMainSubjects[0];
        updateSubSubjects(subject.value);
        saveTasksToLocalStorage();
      }
    }
  });

  deleteSubSubjectButton.addEventListener("click", function () {
    const currentSubject = subject.value;
    const selectedSub = subSubject.value;
    if (
      subSubjectsMapping[currentSubject] &&
      subSubjectsMapping[currentSubject].includes(selectedSub)
    ) {
      alert("Default sub-subjects cannot be deleted.");
    } else if (
      customSubs[currentSubject] &&
      customSubs[currentSubject].includes(selectedSub)
    ) {
      if (confirm(`Delete sub-subject "${selectedSub}"?`)) {
        const index = customSubs[currentSubject].indexOf(selectedSub);
        if (index !== -1) customSubs[currentSubject].splice(index, 1);
        updateSubSubjects(currentSubject);
        saveTasksToLocalStorage();
      }
    } else {
      alert("Please select a custom sub-subject to delete.");
    }
  });

  updateSubSubjects(subject.value);

  // Create a task element with timer inputs in 12-hour format
  function createTaskElement(
    text,
    priorityValue,
    subjectValue,
    subSubjectValue,
    timerSet = false,
    taskStart = "",
    taskEnd = ""
  ) {
    const li = document.createElement("li");

    // Task details
    const detailsDiv = document.createElement("div");
    detailsDiv.className = "task-details";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", function () {
      li.classList.toggle("task-completed", checkbox.checked);
      saveTasksToLocalStorage();
    });
    detailsDiv.appendChild(checkbox);

    const taskSpan = document.createElement("span");
    taskSpan.className = "task-text";
    taskSpan.textContent = `Todo: ${text} | Priority: ${priorityValue} | Subject: ${subjectValue} | Sub-Subject: ${subSubjectValue}`;
    detailsDiv.appendChild(taskSpan);

    const editButton = document.createElement("button");
    editButton.className = "edit-task";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", function () {
      const newText = prompt("Edit task:", text);
      if (newText !== null && newText.trim() !== "") {
        taskSpan.textContent = `Todo: ${newText.trim()} | Priority: ${priorityValue} | Subject: ${subjectValue} | Sub-Subject: ${subSubjectValue}`;
        saveTasksToLocalStorage();
      }
    });
    detailsDiv.appendChild(editButton);

    const delButton = document.createElement("button");
    delButton.className = "delete-task";
    delButton.textContent = "Delete";
    delButton.addEventListener("click", function () {
      if (isTimerRunning && taskQueue[currentTaskIndex] === li) {
        stopTaskTimers();
      }
      li.remove();
      saveTasksToLocalStorage();
    });
    detailsDiv.appendChild(delButton);
    li.appendChild(detailsDiv);

    // Timer section with text inputs and AM/PM selectors
    const timerDiv = document.createElement("div");
    timerDiv.className = "task-timer-section";
    timerDiv.innerHTML = `
      <label>Start Time: 
         <input type="text" class="task-start" placeholder="HH:MM">
         <select class="task-start-ampm">
             <option value="AM">AM</option>
             <option value="PM">PM</option>
         </select>
      </label>
      <label>End Time: 
         <input type="text" class="task-end" placeholder="HH:MM">
         <select class="task-end-ampm">
             <option value="AM">AM</option>
             <option value="PM">PM</option>
         </select>
      </label>
      <button class="set-task-timer">Set Timer</button>
      <span class="task-timer-display"></span>
    `;
    li.appendChild(timerDiv);

    li.dataset.timerSet = timerSet ? "true" : "false";
    li.dataset.taskStart = taskStart;
    li.dataset.taskEnd = taskEnd;

    if (timerSet) {
      const displaySpan = timerDiv.querySelector(".task-timer-display");
      displaySpan.textContent = `Timer set: ${taskStart} to ${taskEnd}`;
    }

    const setTimerButton = timerDiv.querySelector(".set-task-timer");
    setTimerButton.addEventListener("click", function () {
      const startTimeInput = timerDiv.querySelector(".task-start").value;
      const startAmpmSelect = timerDiv.querySelector(".task-start-ampm").value;
      const endTimeInput = timerDiv.querySelector(".task-end").value;
      const endAmpmSelect = timerDiv.querySelector(".task-end-ampm").value;
      if (!startTimeInput || !endTimeInput) {
        alert("Please set both start and end times for the task in HH:MM format.");
        return;
      }
      if (!/^\d{1,2}:\d{2}$/.test(startTimeInput) || !/^\d{1,2}:\d{2}$/.test(endTimeInput)) {
        alert("Please enter time in HH:MM format.");
        return;
      }
      const startTimeStr = startTimeInput.trim() + " " + startAmpmSelect;
      const endTimeStr = endTimeInput.trim() + " " + endAmpmSelect;
      li.dataset.timerSet = "true";
      li.dataset.taskStart = startTimeStr;
      li.dataset.taskEnd = endTimeStr;
      const displaySpan = timerDiv.querySelector(".task-timer-display");
      displaySpan.textContent = `Timer set: ${startTimeStr} to ${endTimeStr}`;
      saveTasksToLocalStorage();
    });

    return li;
  }

  addTodoButton.addEventListener("click", function () {
    const text = todoText.value.trim();
    if (text === "") {
      alert("Please enter a todo item.");
      return;
    }
    const taskEl = createTaskElement(text, priority.value, subject.value, subSubject.value);
    todoList.appendChild(taskEl);
    todoText.value = "";
    saveTasksToLocalStorage();
  });

  function saveTasksToLocalStorage() {
    const tasks = [];
    const taskElements = todoList.querySelectorAll("li");
    taskElements.forEach((li) => {
      tasks.push({
        text: li.querySelector(".task-text").textContent,
        timerSet: li.dataset.timerSet,
        taskStart: li.dataset.taskStart,
        taskEnd: li.dataset.taskEnd,
        completed: li.classList.contains("task-completed"),
      });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function loadTasksFromLocalStorage() {
    const tasksString = localStorage.getItem("tasks");
    if (tasksString) {
      const tasks = JSON.parse(tasksString);
      tasks.forEach((task) => {
        const li = createTaskElement(
          task.text,
          "",
          "",
          "",
          task.timerSet === "true",
          task.taskStart,
          task.taskEnd
        );
        if (task.completed) {
          li.classList.add("task-completed");
          li.querySelector('input[type="checkbox"]').checked = true;
        }
        todoList.appendChild(li);
      });
    }
  }

  loadTasksFromLocalStorage();

  function stopTaskTimers() {
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    isTimerRunning = false;
    currentTaskIndex = 0;
    timerStatus.textContent = "No Task Running";
  }

  function beepSound(duration, isSiren) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = isSiren ? "sawtooth" : "sine";
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
    oscillator.start();
    const startTime = audioCtx.currentTime;
    if (isSiren) {
      function modulate() {
        const now = audioCtx.currentTime;
        const elapsed = now - startTime;
        if (elapsed >= duration) {
          oscillator.stop();
        } else {
          const newFreq = 750 + 250 * Math.sin(2 * Math.PI * elapsed);
          oscillator.frequency.setValueAtTime(newFreq, now);
          requestAnimationFrame(modulate);
        }
      }
      modulate();
    } else {
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration);
    }
  }

  // Parse a 12-hour time string "HH:MM AM/PM" to a Date object (today; if passed, assume next day)
  function getScheduledTime(timeStr) {
    const parts = timeStr.trim().split(" ");
    if (parts.length !== 2) return null;
    const [timePart, period] = parts;
    const timeParts = timePart.split(":");
    let hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const periodUpper = period.toUpperCase();
    if (periodUpper === "PM" && hours < 12) hours += 12;
    if (periodUpper === "AM" && hours === 12) hours = 0;
    const now = new Date();
    const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    if (scheduled < now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    return scheduled;
  }

  function startTaskTimers() {
    taskQueue = [];
    const tasks = todoList.querySelectorAll("li");
    tasks.forEach((task) => {
      if (task.dataset.timerSet === "true" && task.dataset.taskStart && task.dataset.taskEnd) {
        taskQueue.push(task);
      }
    });
    if (taskQueue.length === 0) {
      alert("No tasks with timer set found.");
      return;
    }
    taskQueue.sort(
      (a, b) => getScheduledTime(a.dataset.taskStart) - getScheduledTime(b.dataset.taskStart)
    );
    currentTaskIndex = 0;
    isTimerRunning = true;
    timerStatus.textContent = "";
    processNextTask();
  }

  function processNextTask() {
    if (currentTaskIndex >= taskQueue.length) {
      timerStatus.textContent = "All tasks completed.";
      isTimerRunning = false;
      return;
    }
    const currentTask = taskQueue[currentTaskIndex];
    const scheduledStart = getScheduledTime(currentTask.dataset.taskStart);
    const scheduledEnd = getScheduledTime(currentTask.dataset.taskEnd);
    const now = new Date();
    let waitTime = scheduledStart - now;
    if (waitTime < 0) waitTime = 0;
    timerStatus.textContent = `Waiting for task ${currentTaskIndex + 1} to start at ${
      currentTask.dataset.taskStart
    }`;
    setTimeout(() => {
      timerStatus.textContent = `Task ${currentTaskIndex + 1} starting...`;
      beepSound(5, false);
      setTimeout(() => {
        const interval = setInterval(() => {
          const nowTime = new Date();
          const remaining = Math.max(0, scheduledEnd - nowTime);
          timerStatus.textContent = formatTime(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
            timerStatus.textContent = `Task ${currentTaskIndex + 1} time over!`;
            beepSound(10, true);
            currentTask.style.opacity = 0.5;
            setTimeout(() => {
              currentTaskIndex++;
              processNextTask();
            }, 10000);
          }
        }, 1000);
      }, 5000);
    }, waitTime);
  }

  function formatTime(milliseconds) {
    const seconds = Math.ceil(milliseconds / 1000);
    const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
    const ss = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `Time Remaining: ${mm}:${ss}`;
  }

  startAllTimersButton.addEventListener("click", function () {
    if (isTimerRunning) {
      alert("Timer is already running.");
      return;
    }
    startTaskTimers();
  });

  // Update real-time clock in 12-hour format with AM/PM
  function updateRealTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    realtime.textContent = `${hours.toString().padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
  }

  setInterval(updateRealTime, 1000);
  updateRealTime();
});
