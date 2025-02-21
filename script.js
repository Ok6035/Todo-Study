document.addEventListener("DOMContentLoaded", function() {
  const todoText = document.getElementById('todoText');
  const priority = document.getElementById('priority');
  const subject = document.getElementById('subject');
  const subSubject = document.getElementById('subSubject');
  const addTodoButton = document.getElementById('addTodo');
  const deleteSubjectButton = document.getElementById('deleteSubject');
  const deleteSubSubjectButton = document.getElementById('deleteSubSubject');
  const todoList = document.getElementById('todoList');
  const startTimerButton = document.getElementById('startTimer');
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  const timerStatus = document.getElementById('timerStatus');

  // Default main subjects that cannot be deleted
  const defaultMainSubjects = ["STATISTICS", "MATHEMATICS", "ECONOMICS"];
  
  // Default mapping for sub-subjects based on selected main subject
  const subSubjectsMapping = {
    "STATISTICS": ["Probability", "Data Analysis", "Inferential"],
    "MATHEMATICS": ["Algebra", "Calculus", "Geometry"],
    "ECONOMICS": ["Microeconomics", "Macroeconomics", "Econometrics"]
  };

  // Store custom sub-subjects added by the user for each main subject
  const customSubs = {
    "STATISTICS": [],
    "MATHEMATICS": [],
    "ECONOMICS": []
  };

  // Store custom main subjects added by the user
  const customMainSubjects = [];

  // Function to update the Sub-Subject dropdown based on the selected main subject
  function updateSubSubjects(selectedSubject) {
    subSubject.innerHTML = "";
    let defaultOption = document.createElement('option');
    defaultOption.value = "None";
    defaultOption.textContent = "Select Sub-Subject";
    subSubject.appendChild(defaultOption);
    
    // Add default sub-subjects if available
    const subs = subSubjectsMapping[selectedSubject] || [];
    subs.forEach(function(item) {
      let option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      subSubject.appendChild(option);
    });

    // Add any custom sub-subjects for this main subject
    (customSubs[selectedSubject] || []).forEach(function(item) {
      let option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      subSubject.appendChild(option);
    });
    
    // Add "Add More" option for adding new custom sub-subjects
    let addMoreOption = document.createElement('option');
    addMoreOption.value = "ADD_MORE";
    addMoreOption.textContent = "Add More";
    subSubject.appendChild(addMoreOption);
  }

  // Listener for when user selects "Add More" in the Sub-Subject dropdown
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

  // Listener for main subject dropdown "Add More" option or deletion
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
        // Initialize empty sub-subject lists for the new subject
        subSubjectsMapping[customMain.trim()] = [];
        customSubs[customMain.trim()] = [];
      } else {
        subject.value = subject.options[0].value;
      }
    }
    updateSubSubjects(subject.value);
  });

  // Delete main subject if it is a custom subject
  deleteSubjectButton.addEventListener('click', function() {
    const selected = subject.value;
    if (defaultMainSubjects.includes(selected)) {
      alert("Default subjects cannot be deleted.");
    } else {
      const confirmDelete = confirm(`Are you sure you want to delete the subject "${selected}"?`);
      if (confirmDelete) {
        // Remove from customMainSubjects
        const index = customMainSubjects.indexOf(selected);
        if (index !== -1) {
          customMainSubjects.splice(index, 1);
        }
        // Remove the option from the subject dropdown
        for (let i = 0; i < subject.options.length; i++) {
          if (subject.options[i].value === selected) {
            subject.remove(i);
            break;
          }
        }
        // Remove associated sub-subject data
        delete subSubjectsMapping[selected];
        delete customSubs[selected];
        // Set subject to first default subject
        subject.value = defaultMainSubjects[0];
        updateSubSubjects(subject.value);
      }
    }
  });

  // Delete sub-subject if it is custom
  deleteSubSubjectButton.addEventListener('click', function() {
    const currentSubject = subject.value;
    const selectedSub = subSubject.value;
    // Check if this sub-subject is a default (present in subSubjectsMapping) or custom (present in customSubs)
    if ((subSubjectsMapping[currentSubject] && subSubjectsMapping[currentSubject].includes(selectedSub))) {
      alert("Default sub-subjects cannot be deleted.");
    } else if (customSubs[currentSubject] && customSubs[currentSubject].includes(selectedSub)) {
      const confirmDelete = confirm(`Are you sure you want to delete the sub-subject "${selectedSub}"?`);
      if (confirmDelete) {
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

  // Initialize sub-subject dropdown based on the default selected subject
  updateSubSubjects(subject.value);

  // Add a todo item to the list
  addTodoButton.addEventListener('click', function() {
    let text = todoText.value.trim();
    if (text === "") {
      alert("Please enter a todo item.");
      return;
    }
    let li = document.createElement('li');
    li.textContent = `Todo: ${text} | Priority: ${priority.value} | Subject: ${subject.value} | Sub-Subject: ${subSubject.value}`;
    todoList.appendChild(li);
    todoText.value = "";
  });

  // Timer functionality for study sessions
  startTimerButton.addEventListener('click', function() {
    const startTimeVal = startTimeInput.value;
    const endTimeVal = endTimeInput.value;
    if (!startTimeVal || !endTimeVal) {
      alert("Please set both start and end times.");
      return;
    }
    const now = new Date();
    const [startHours, startMinutes] = startTimeVal.split(':').map(Number);
    const [endHours, endMinutes] = endTimeVal.split(':').map(Number);
    let startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMinutes, 0);
    let endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHours, endMinutes, 0);

    // If the chosen times are in the past, assume next day
    if (startTime < now) {
      startTime.setDate(startTime.getDate() + 1);
    }
    if (endTime < now) {
      endTime.setDate(endTime.getDate() + 1);
    }
    if (endTime <= startTime) {
      alert("End time must be after start time.");
      return;
    }
    timerStatus.textContent = "Timer set. Waiting for start time...";

    // Wait until the start time is reached, then start countdown
    setTimeout(function() {
      // At the start time, play a 5-second normal beep to indicate the timer has started
      beepSound(5, false);

      // Start the countdown interval updating every second
      let countdownInterval = setInterval(function() {
        let nowTime = new Date();
        let remaining = Math.max(0, endTime - nowTime);
        let minutes = Math.floor((remaining / 1000) / 60).toString().padStart(2, '0');
        let seconds = Math.floor((remaining / 1000) % 60).toString().padStart(2, '0');
        timerStatus.textContent = `Time Remaining: ${minutes}:${seconds}`;

        if (remaining <= 0) {
          clearInterval(countdownInterval);
          timerStatus.textContent = "Time is over!";
          // When time is over, play a 10-second siren beep
          beepSound(10, true);
        }
      }, 1000);
    }, startTime - now);
  });

  // Generate beep sound using the Web Audio API.
  // duration: seconds, isSiren: true for siren-like sound, false for normal beep.
  function beepSound(duration, isSiren) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = isSiren ? 'sawtooth' : 'sine';
    
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Set initial gain (volume/intensity)
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
    
    oscillator.start();

    let startTime = audioCtx.currentTime;
    
    if (isSiren) {
      // Siren-like modulation for a more intense sound over the specified duration
      function modulate() {
        let now = audioCtx.currentTime;
        let elapsed = now - startTime;
        if (elapsed >= duration) {
          oscillator.stop();
        } else {
          // Oscillate frequency between 500Hz and 1000Hz
          let newFreq = 750 + 250 * Math.sin(2 * Math.PI * elapsed);
          oscillator.frequency.setValueAtTime(newFreq, now);
          requestAnimationFrame(modulate);
        }
      }
      modulate();
    } else {
      // For normal beep, use fixed frequency (e.g., 440Hz - A4 note)
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration);
    }
  }
});
