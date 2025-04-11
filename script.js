const addButton = document.querySelector(".add-button");
const taskSection = document.querySelector(".task-section ol");
let total = document.querySelector('.task-count')
let completed = document.querySelector('.task-done')
let pending = document.querySelector('.task-left')

addButton.addEventListener("click", () => {
  const taskText = prompt(" add a task:");
  if (taskText) {
    const li = document.createElement("li");
    li.style.display = "flex";
li.style.alignItems = "center";
li.style.gap = "12px";

// Styling the box
li.style.width = "12%";
li.style.padding = "12px";
li.style.margin = "3px auto";
li.style.border = "1px solid #72aee6"; // bluish border
li.style.borderRadius = "10px";
li.style.backgroundColor = "#f0f8ff"; // soft bluish background

// Text wrap and height fit
li.style.wordBreak = "break-word";
li.style.flexWrap = "wrap";

// Optional shadow for better look
li.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const label = document.createElement("label");
    label.textContent = taskText;
    label.style.fontWeight = "600";
    

    li.appendChild(checkbox);
    li.appendChild(label);
    taskSection.appendChild(li);



    checkbox.addEventListener('change', () => {
        label.style.textDecoration = checkbox.checked ? "line-through" : "none";
        updateCounts();
    })
  }
  updateCounts()
});

function updateCounts() {
    const allTasks = taskSection.querySelectorAll("li");
    const checkedTasks = taskSection.querySelectorAll("input[type='checkbox']:checked");
  
    total.textContent = allTasks.length;
    completed.textContent = checkedTasks.length;
    pending.textContent = allTasks.length - checkedTasks.length;
  }