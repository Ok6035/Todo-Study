document.addEventListener("DOMContentLoaded", function() {
  // Elements for task creation and subject controls
  const todoText = document.getElementById('todoText');
  const priority = document.getElementById('priority');
  const subject = document.getElementById('subject');
  const subSubject = document.getElementById('subSubject');
  const addTodoButton = document.getElementById('addTodo');
  const deleteSubjectButton = document.getElementById('deleteSubject');
  const deleteSubSubjectButton = document.getElementById('deleteSubSubject');
  const todoList = document.getElementById('todoList');
  const startAllTimersButton = document.getElementById('startAllTimers');
  const timerStatus = document.getElementById('timerStatus');

  // Default main subjects and sub-subject mapping
  const defaultMainSubjects = ["STATISTICS", "MATHEMATICS", "ECONOMICS"];
  const subSubjectsMapping = {
    "STATISTICS": ["Probability", "Data Analysis", "Inferential"],
    "MATHEMATICS": ["Algebra", "Calculus", "Geometry"],
    "ECONOMICS": ["Microeconomics", "Macroeconomics", "Econometrics"]
  };
  const customSubs = {
    "STATISTICS": [],
    "MATHEMATICS": [],
    "ECONOMICS": []
  };
  const customMainSubjects = [];

  // Flag to indicate if a task timer is running
  let isTimerRunning = false;
  // Array to hold tasks with timers set (each task is an li element)
  let taskQueue = [];
  // Index of the current task being processed
  let currentTaskIndex = 0;
  let countdownIntervalId = null;

  // Subject / Sub-Subject handling
  function updateSubSubjects(selectedSubject) {
    subSubject.innerHTML = "";
    let defaultOption = document.createElement('option');
    defaultOption.value = "None";
    defaultOption.textContent = "Select Sub-Subject";
    subSubject.appendChild(defaultOption);
    
    // Add default sub-subjects
    const subs = subSubjectsMapping[selectedSubject] || [];
    subs.forEach(function(item) {
      let option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      subSubject.appendChild(option);
    });
    // Add custom sub-subjects if any
    (customSubs[selectedSubject] || []).forEach(function(item) {
      let option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      subSubject.appendChild(option);
    });
    // Add "Add More" option
    let addMoreOption = document.createElement('option');
    addMoreOption.value = "ADD_MORE";
    addMoreOption.textContent = "Add More";
    subSubject.appendChild(addMoreOption);
  }
  
  subSubject.addEventListener('change', function() {
    if (subSubject.value === "ADD_MORE") {
      let customSub = prompt("Enter custom sub-subject:");
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
  
  subject.addEventListener('change', function() {
    if (subject.value === "ADD_MORE") {
      let customMain = prompt("Enter custom subject:");
      if (customMain && customMain.trim() !== "") {
        customMainSubjects.push(customMain.trim());
        let newOption = document.createElement('option');
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
  
  deleteSubjectButton.addEventListener('click', function() {
    const selected = subject.value;
    if (defaultMainSubjects.includes(selected)) {
      alert("Default subjects cannot be deleted.");
    } else {
      if (confirm(`Are you sure you want to delete the subject "${selected}"?`)) {
        const index = customMainSubjects.indexOf(selected);
        if (index !== -1) {
          customMainSubjects.splice(index, 1);
        }
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
      }
    }
  });
  
  deleteSubSubjectButton.addEventListener('click', function() {
    const currentSubject = subject.value;
    const selectedSub = subSubject.value;
    if ((subSubjectsMapping[currentSubject] && subSubjectsMapping[currentSubject].includes(selectedSub))) {
      alert("Default sub-subjects cannot be deleted.");
    } else if (customSubs[currentSubject] && customSubs[currentSubject].includes(selectedSub)) {
      if (confirm(`Delete sub-subject "${selectedSub}"?`)) {
        const index = customSubs[currentSubject].indexOf(selectedSub);
        if (index !== -1) {
          customSubs[currentSubject].splice(index, 1);
        }
        updateSubSubjects(currentSubject);
      }
    } else {
      alert("Please select a custom sub-subject to delete.");
    }
  });
  
  updateSubSubjects(subject.value);
  
  // Function to create a new task element in the todo list.
  // Each task has its own two time inputs (HH:MM) and a "Set Timer" button.
  function createTaskElement(text, priorityValue, subjectValue, subSubjectValue) {
    const li = document.createElement('li');
    // Task details div: displays the task text and a delete button.
    const detailsDiv = document.createElement('div');
    detailsDiv.className = "task-details";
    const taskSpan = document.createElement('span');
    taskSpan.className = "task-text";
    taskSpan.textContent = `Todo: ${text} | Priority: ${priorityValue} | Subject: ${subjectValue} | Sub-Subject: ${subSubjectValue}`;
    detailsDiv.appendChild(taskSpan);
    const delButton = document.createElement('button');
    delButton.className = "delete-task";
    delButton.textContent = "Delete";
    // Delete task immediately on click.
    delButton.addEventListener('click', function() {
      li.remove();
    });
    detailsDiv.appendChild(delButton);
    li.appendChild(detailsDiv);
    
    // Timer section for the task.
    const timerDiv = document.createElement('div');
    timerDiv.className = "task-timer-section";
    timerDiv.innerHTML = `
      <label>Start Time: <input type="time" class="task-start"></label>
      <label>End Time: <input type="time" class="task-end"></label>
      <button class="set-task-timer">Set Timer</button>
      <span class="task-timer-display"></span>
    `;
    li.appendChild(timerDiv);
    li.dataset.timerSet = "false";
    li.dataset.taskStart = "";
    li.dataset.taskEnd = "";
    
    // Set Timer event.
    const setTimerButton = timerDiv.querySelector('.set-task-timer');
    setTimerButton.addEventListener('click', function() {
      const startInput = timerDiv.querySelector('.task-start').value;
      const endInput = timerDiv.querySelector('.task-end').value;
      if (!startInput || !endInput) {
        alert("Please set both start and end times for the task.");
        return;
      }
      if (endInput <= startInput) {
        alert("End time must be after start time.");
        return;
      }
      li.dataset.timerSet = "true";
      li.dataset.taskStart = startInput;
      li.dataset.taskEnd = endInput;
      const displaySpan = timerDiv.querySelector('.task-timer-display');
      displaySpan.textContent = `Timer set: ${startInput} to ${endInput}`;
    });
    
    return li;
  }
  
  // Add new task event.
  addTodoButton.addEventListener('click', function() {
    const text = todoText.value.trim();
    if (text === "") {
      alert("Please enter a todo item.");
      return;
    }
    const taskEl = createTaskElement(text, priority.value, subject.value, subSubject.value);
    todoList.appendChild(taskEl);
    todoText.value = "";
  });
  
  // Disable delete buttons while timer is running (not used now since deletion is allowed).
  function toggleDeleteButtons(disable) {
    const deleteButtons = document.querySelectorAll(".delete-task");
    deleteButtons.forEach(btn => {
      if (disable) {
        btn.classList.add("disabled");
      } else {
        btn.classList.remove("disabled");
      }
    });
  }
  
  // Beep sound using Web Audio API.
  function beepSound(duration, isSiren) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = isSiren ? 'sawtooth' : 'sine';
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
    oscillator.start();
    let startTime = audioCtx.currentTime;
    
    if (isSiren) {
      function modulate() {
        let now = audioCtx.currentTime;
        let elapsed = now - startTime;
        if (elapsed >= duration) {
          oscillator.stop();
        } else {
          let newFreq = 750 + 250 * Math.sin(2 * Math.PI * elapsed);
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
  
  // Convert HH:MM string to a Date object (today; if passed, add one day).
  function getScheduledTime(timeStr) {
    let [hours, minutes] = timeStr.split(":").map(Number);
    let now = new Date();
    let scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    if (scheduled < now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    return scheduled;
  }
  
  // Scheduler to process tasks sequentially.
  function startTaskTimers() {
    taskQueue = [];
    const tasks = todoList.querySelectorAll("li");
    tasks.forEach(task => {
      if (task.dataset.timerSet === "true" && task.dataset.taskStart && task.dataset.taskEnd) {
        taskQueue.push(task);
      }
    });
    if (taskQueue.length === 0) {
      alert("No tasks with timer set found.");
      return;
    }
    taskQueue.sort((a, b) => getScheduledTime(a.dataset.taskStart) - getScheduledTime(b.dataset.taskStart));
    currentTaskIndex = 0;
    isTimerRunning = true;
    toggleDeleteButtons(true);
    processNextTask();
  }
  
  // Process next task in the scheduler.
  function processNextTask() {
    if (currentTaskIndex >= taskQueue.length) {
      timerStatus.textContent = "All tasks completed.";
      isTimerRunning = false;
      toggleDeleteButtons(false);
      return;
    }
    const currentTask = taskQueue[currentTaskIndex];
    const scheduledStart = getScheduledTime(currentTask.dataset.taskStart);
    const scheduledEnd = getScheduledTime(currentTask.dataset.taskEnd);
    const now = new Date();
    let waitTime = scheduledStart - now;
    if (waitTime < 0) { waitTime = 0; }
    timerStatus.textContent = `Waiting for task ${currentTaskIndex+1} to start at ${currentTask.dataset.taskStart}`;
    setTimeout(() => {
      timerStatus.textContent = `Task ${currentTaskIndex+1} starting...`;
      beepSound(5, false);
      setTimeout(() => {
        let interval = setInterval(() => {
          let nowTime = new Date();
          let remaining = Math.max(0, scheduledEnd - nowTime);
          timerStatus.textContent = formatTime(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
            timerStatus.textContent = `Task ${currentTaskIndex+1} time over!`;
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
  
  // Helper to format remaining time (mm:ss).
  function formatTime(milliseconds) {
    let seconds = Math.ceil(milliseconds / 1000);
    let mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    let ss = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `Time Remaining: ${mm}:${ss}`;
  }
  
  startAllTimersButton.addEventListener('click', function() {
    if (isTimerRunning) {
      alert("Timer is already running.");
      return;
    }
    startTaskTimers();
  });
});
