// Task Manager JavaScript
// Optimized and modular for easy maintenance
// Current date: April 13, 2025 (uses real-time for logic)

// -------------------------
// INITIALIZATION
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Card tracking for deduplication
  const cardMap = new Map();

  // Core setup
  initializeSidebar();
  initializeTabs();
  showUsernameModal();
  updateClock();
  setupActivityForm();
  setupListsAndTags();
  setupDragAndDrop();
  loadTasksFromLocalStorage();
  setupNotifications();
  setupAds();

  // Periodic updates
  setInterval(updateClock, 1000);
  setInterval(setupNotifications, 60000); // Check notifications every minute

  // Observe DOM for dynamic updates
  const observer = new MutationObserver(debounce(() => {
      updateTaskStats();
      updateEmptyStateMessages();
  }, 100));
  observer.observe(document.body, { childList: true, subtree: true });
});

// Utility: Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// -------------------------
// CORE LOGIC
// -------------------------

// Initialize sidebar (toggle and clear)
function initializeSidebar() {
  const homeIcon = document.querySelector('.home-icon');
  const appContainer = document.querySelector('.app-container');
  const clearIcon = document.querySelector('.clear-icon');

  homeIcon.addEventListener('click', () => {
      appContainer.classList.toggle('sidebar-expanded');
      homeIcon.textContent = appContainer.classList.contains('sidebar-expanded') ? '>>' : '>';
  });

  clearIcon.addEventListener('click', () => {
      if (confirm('Clear all data? This cannot be undone.')) {
          try {
              localStorage.clear();
              alert('Data cleared. Reloading...');
              location.reload();
          } catch (e) {
              console.error('Error clearing localStorage:', e);
              alert('Failed to clear data.');
          }
      }
  });
}

// Initialize tabs (Today, Tomorrow, etc.)
function initializeTabs() {
  const tabs = document.querySelectorAll('.main-sidebar .tab');
  const habitsSection = document.querySelector('.habits-section');
  const remindersSection = document.querySelector('.reminders-section');
  const todoSection = document.querySelector('.todo-section');
  const containers = {
      today: document.querySelector('.today-items'),
      tomorrow: document.querySelector('.tomorrow-items'),
      week: document.querySelector('.week-items'),
      completed: document.querySelector('.completed-items'),
      trash: document.querySelector('.trash-items')
  };

  tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const tabName = ['today', 'tomorrow', 'week', 'completed', 'trash'][index];
          habitsSection.style.display = (tabName === 'completed' || tabName === 'trash') ? 'none' : 'block';
          remindersSection.style.display = (tabName === 'completed' || tabName === 'trash') ? 'none' : 'block';
          todoSection.style.display = 'block';

          Object.values(containers).forEach(c => c.style.display = 'none');
          containers[tabName].style.display = 'flex';

          updateTaskStats();
          updateEmptyStateMessages();
      });
  });

  // List and tag navigation
  document.querySelector('.main-sidebar').addEventListener('click', (e) => {
      const item = e.target.closest('.section-item');
      if (!item || item.textContent === '+') return;
      const isTag = item.classList.contains('tag-item');
      showListOrTag(item.textContent.trim(), isTag ? 'tag' : 'list');
  });
}

// Show tasks by list or tag
function showListOrTag(name, type) {
  const habitsSection = document.querySelector('.habits-section');
  const remindersSection = document.querySelector('.reminders-section');
  const todoSection = document.querySelector('.todo-section');
  const todoContainer = document.querySelector('.todo-container');

  habitsSection.style.display = 'none';
  remindersSection.style.display = 'none';
  todoSection.style.display = 'block';
  todoContainer.innerHTML = '';

  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter-items';
  filterContainer.innerHTML = `<div class="section-header"><h2>${type === 'list' ? 'List' : 'Tag'}: ${name}</h2></div>`;

  const cards = [];
  document.querySelectorAll('.card:not([data-status="Completed"]):not([data-status="Deleted"])').forEach(card => {
      const items = card.dataset[type + 's'] ? JSON.parse(card.dataset[type + 's']) : [];
      if (items.includes(name)) {
          const clone = card.cloneNode(true);
          addCardEventListeners(clone, card.dataset.type);
          cards.push(clone);
      }
  });

  if (cards.length === 0) {
      filterContainer.innerHTML += '<div class="empty-message">No active tasks found</div>';
  } else {
      cards.forEach(card => filterContainer.appendChild(card));
  }

  todoContainer.appendChild(filterContainer);
  updateTaskStats();
  updateEmptyStateMessages();
  setupDragAndDrop();
}

// Username modal
function showUsernameModal() {
  if (localStorage.getItem('username')) {
      document.querySelector('.username').textContent = localStorage.getItem('username');
      return;
  }

  const modal = document.createElement('div');
  modal.className = 'username-modal';
  modal.innerHTML = `
      <div class="modal-content">
          <h3>Welcome to Task Manager</h3>
          <p>Please enter your name</p>
          <input type="text" id="username-input" placeholder="Your name">
          <button id="save-username">Continue</button>
      </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('save-username').addEventListener('click', () => {
      const username = document.getElementById('username-input').value.trim();
      if (username) {
          localStorage.setItem('username', username);
          document.querySelector('.username').textContent = username;
          modal.remove();
      }
  });
}

// -------------------------
// TIME AND NOTIFICATIONS
// -------------------------

// Update clock and quote
function updateClock() {
  const now = new Date();
  const timeDisplay = document.querySelector('.time-display');
  const dateDisplay = document.querySelector('.date-display');
  const greeting = document.querySelector('.greeting');
  const quoteContainer = document.querySelector('.quote-container');
  const username = localStorage.getItem('username') || 'User';

  timeDisplay.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  dateDisplay.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  greeting.innerHTML = `Hey <span class="username">${username}</span>, ${now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}`;

  const quotes = [
      "The journey of a thousand miles begins with a single step.",
      "Do something today that your future self will thank you for.",
      "Success is the sum of small efforts, repeated daily.",
      "Your time is now. Start where you stand.",
      "Every day is a new chance to change the world."
  ];
  const currentQuote = localStorage.getItem('currentQuote') || quotes[0];
  let newQuote = quotes[Math.floor(Math.random() * quotes.length)];
  if (newQuote === currentQuote) newQuote = quotes[(quotes.indexOf(newQuote) + 1) % quotes.length];
  localStorage.setItem('currentQuote', newQuote);
  quoteContainer.textContent = `"${newQuote}"`;
}

// Setup reminder notifications
function setupNotifications() {
  const notificationMinutes = parseInt(localStorage.getItem('notificationMinutes')) || 30;
  const now = new Date();
  const popup = document.getElementById('notificationPopup');
  const popupCards = popup.querySelector('.popup-cards');

  // Update notification buttons
  document.querySelectorAll('.notification-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.minutes) === notificationMinutes);
      btn.onclick = () => {
          document.querySelectorAll('.notification-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          localStorage.setItem('notificationMinutes', btn.dataset.minutes);
          setupNotifications();
      };
  });

  // Find upcoming reminders
  const reminders = Array.from(document.querySelectorAll('.reminder-card:not([data-status="Completed"])')).map(card => ({
      card,
      id: card.dataset.id,
      title: card.dataset.title,
      time: card.dataset.time,
      date: card.dataset.date
  }));

  popupCards.innerHTML = '';
  let hasUpcoming = false;

  reminders.forEach(reminder => {
      const reminderTime = new Date(`${reminder.date}T${reminder.time}`);
      const notificationTime = new Date(reminderTime.getTime() - notificationMinutes * 60 * 1000);

      if (notificationTime <= now && now < reminderTime) {
          hasUpcoming = true;
          playNotificationSound();
          const clone = reminder.card.cloneNode(true);
          addCardEventListeners(clone, 'reminder');
          popupCards.appendChild(clone);
      }
  });

  popup.style.display = hasUpcoming ? 'block' : 'none';

  // Close popup
  document.querySelector('.close-popup').onclick = () => {
      popup.style.display = 'none';
  };
}

// Play notification sound
function playNotificationSound() {
  // Assumes ring.mp3 is in project root or /assets/
  const audio = new Audio('ring.mp3'); // Update path as needed
  audio.play().catch(e => console.error('Error playing sound:', e));
}

// -------------------------
// CARD MANAGEMENT
// -------------------------

// Get todo container by date
function getTodoContainerByDate(dateStr, containers) {
  const selectedDate = new Date(dateStr);
  selectedDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekLimit = new Date(today);
  weekLimit.setDate(today.getDate() + 7);

  if (selectedDate.toDateString() === today.toDateString()) return containers.today;
  if (selectedDate.toDateString() === tomorrow.toDateString()) return containers.tomorrow;
  if (selectedDate > tomorrow && selectedDate <= weekLimit) return containers.week;
  return null;
}

// Create habit card
function createHabitCard({ title, description, time, lists = [], tags = [], streak = 0, id, comments = [] }) {
  id = id || `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const card = document.createElement('div');
  card.className = 'habit-card card';
  card.dataset.type = 'habit';
  card.dataset.id = id;
  card.dataset.title = title;
  card.dataset.description = description;
  card.dataset.time = time || '';
  card.dataset.lists = JSON.stringify(lists);
  card.dataset.tags = JSON.stringify(tags);
  card.dataset.streak = streak;
  card.dataset.comments = JSON.stringify(comments);
  card.draggable = true;

  card.innerHTML = `
      <div class="card-header">
          <div class="checkbox-container">
              <input type="checkbox" class="habit-checkbox">
          </div>
          <div class="card-actions">
              <button class="habit-comment" title="Add comment"><i class="fa-solid fa-comment"></i></button>
              <button class="habit-edit" title="Edit"><i class="fa-solid fa-edit"></i></button>
              <button class="habit-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
      </div>
      <div class="card-body">
          <div class="card-title"><h3>${title}</h3></div>
          <div class="card-description"><p>${description}</p></div>
      </div>
      <div class="card-footer">
          <span class="habit-time">${time || 'No time set'}</span>
          <span class="card-meta">${streak ? `Streak: ${streak} days | ` : ''}${lists.length ? `Lists: ${lists.join(', ')}` : ''}${lists.length && tags.length ? ' | ' : ''}${tags.length ? `Tags: ${tags.join(', ')}` : ''}</span>
      </div>
  `;

  comments.forEach(comment => {
      const commentEl = document.createElement('div');
      commentEl.className = 'card-comment';
      commentEl.innerHTML = `<p><strong>Comment:</strong> ${comment}</p>`;
      card.insertBefore(commentEl, card.querySelector('.card-footer'));
  });

  return card;
}

// Create reminder card
function createReminderCard({ title, description, date, time, lists = [], tags = [], status = 'Pending', id, comments = [] }) {
  id = id || `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const card = document.createElement('div');
  card.className = 'reminder-card card';
  card.dataset.type = 'reminder';
  card.dataset.id = id;
  card.dataset.title = title;
  card.dataset.description = description;
  card.dataset.date = date;
  card.dataset.time = time || '';
  card.dataset.lists = JSON.stringify(lists);
  card.dataset.tags = JSON.stringify(tags);
  card.dataset.status = status;
  card.dataset.comments = JSON.stringify(comments);
  card.draggable = true;

  card.innerHTML = `
      <div class="card-header">
          <div class="checkbox-container">
              <input type="checkbox" class="reminder-checkbox" ${status === 'Completed' ? 'checked' : ''}>
          </div>
          <div class="card-actions">
              <button class="reminder-comment" title="Add comment"><i class="fa-solid fa-comment"></i></button>
              <button class="reminder-edit" title="Edit"><i class="fa-solid fa-edit"></i></button>
              <button class="reminder-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
      </div>
      <div class="card-body">
          <div class="card-title"><h3>${title}</h3></div>
          <div class="card-description"><p>${description}</p></div>
      </div>
      <div class="card-footer">
          <span class="reminder-time">${time || 'No time set'}</span>
          <span class="card-meta">${lists.length ? `Lists: ${lists.join(', ')}` : ''}${lists.length && tags.length ? ' | ' : ''}${tags.length ? `Tags: ${tags.join(', ')}` : ''}</span>
      </div>
  `;

  comments.forEach(comment => {
      const commentEl = document.createElement('div');
      commentEl.className = 'card-comment';
      commentEl.innerHTML = `<p><strong>Comment:</strong> ${comment}</p>`;
      card.insertBefore(commentEl, card.querySelector('.card-footer'));
  });

  return card;
}

// Create todo card
function createTodoCard({ title, description, date, time, status = 'To Do', origin = 'todo', lists = [], tags = [], id, comments = [] }) {
  id = id || `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const card = document.createElement('div');
  card.className = 'todo-card card';
  card.dataset.type = 'todo';
  card.dataset.id = id;
  card.dataset.title = title;
  card.dataset.description = description;
  card.dataset.date = date;
  card.dataset.time = time || '';
  card.dataset.status = status;
  card.dataset.origin = origin;
  card.dataset.lists = JSON.stringify(lists);
  card.dataset.tags = JSON.stringify(tags);
  card.dataset.comments = JSON.stringify(comments);
  card.draggable = true;

  const dateDisplay = new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });

  card.innerHTML = `
      <div class="card-header">
          <div class="checkbox-container">
              <input type="checkbox" class="todo-check" ${status === 'Completed' ? 'checked' : ''}>
          </div>
          <div class="card-actions">
              <button class="todo-comment" title="Add comment"><i class="fa-solid fa-comment"></i></button>
              <button class="todo-edit" title="Edit"><i class="fa-solid fa-edit"></i></button>
              <button class="todo-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
      </div>
      <div class="card-body">
          <div class="card-title"><h3>${title}</h3></div>
          <div class="card-description"><p>${description}</p></div>
      </div>
      <div class="card-footer">
          <span class="todo-time">${time || 'No time set'}</span>
          <span class="card-meta">Date: ${dateDisplay}${lists.length ? ` | Lists: ${lists.join(', ')}` : ''}${tags.length ? ` | Tags: ${tags.join(', ')}` : ''}</span>
      </div>
  `;

  comments.forEach(comment => {
      const commentEl = document.createElement('div');
      commentEl.className = 'card-comment';
      commentEl.innerHTML = `<p><strong>Comment:</strong> ${comment}</p>`;
      card.insertBefore(commentEl, card.querySelector('.card-footer'));
  });

  return card;
}

// Add card event listeners
function addCardEventListeners(card, type) {
  const checkbox = card.querySelector(`.${type}-checkbox, .${type}-check`);
  const editBtn = card.querySelector(`.${type}-edit`);
  const deleteBtn = card.querySelector(`.${type}-delete`);
  const commentBtn = card.querySelector(`.${type}-comment`);
  const containers = {
      habits: document.querySelector('.habits-container'),
      reminders: document.querySelector('.reminders-container'),
      today: document.querySelector('.today-items'),
      tomorrow: document.querySelector('.tomorrow-items'),
      week: document.querySelector('.week-items'),
      completed: document.querySelector('.completed-items'),
      trash: document.querySelector('.trash-items')
  };

  deleteBtn.onclick = () => {
      card.dataset.status = 'Deleted';
      containers.trash.appendChild(card);
      saveTasksToLocalStorage();
      updateTaskStats();
      updateEmptyStateMessages();
      setupNotifications();
  };

  editBtn.onclick = () => {
      const formOverlay = document.getElementById('activityFormOverlay');
      const form = document.getElementById('newActivityForm');

      // Populate form
      document.querySelector(`.checkbox-group input[value="${type}"]`).checked = true;
      document.querySelectorAll('.checkbox-group input').forEach(input => {
          if (input.value !== type) input.checked = false;
      });
      document.getElementById('activityTitle').value = card.dataset.title;
      document.getElementById('activityDescription').value = card.dataset.description;
      document.getElementById('activityTime').value = card.dataset.time;
      if (type !== 'habit') document.getElementById('activityDate').value = card.dataset.date;
      const lists = JSON.parse(card.dataset.lists || '[]');
      const tags = JSON.parse(card.dataset.tags || '[]');
      document.querySelectorAll('#activityLists input').forEach(input => {
          input.checked = lists.includes(input.value);
      });
      document.querySelectorAll('#activityTags input').forEach(input => {
          input.checked = tags.includes(input.value);
      });

      formOverlay.style.display = 'flex';

      form.onsubmit = e => {
          e.preventDefault();
          const newType = document.querySelector('.checkbox-group input:checked')?.value || type;
          const title = document.getElementById('activityTitle').value;
          const description = document.getElementById('activityDescription').value;
          const date = document.getElementById('activityDate').value;
          const time = document.getElementById('activityTime').value;
          const newLists = Array.from(document.querySelectorAll('#activityLists input:checked')).map(input => input.value);
          const newTags = Array.from(document.querySelectorAll('#activityTags input:checked')).map(input => input.value);

          // Validate
          if (!newType) return alert('Select an activity type');
          if ((newType === 'todo' || newType === 'reminder') && !date) return alert('Select a date');

          // Update card
          card.dataset.title = title;
          card.dataset.description = description;
          card.dataset.time = time;
          card.dataset.lists = JSON.stringify(newLists);
          card.dataset.tags = JSON.stringify(newTags);
          if (newType !== 'habit') card.dataset.date = date;

          card.querySelector('.card-title h3').textContent = title;
          card.querySelector('.card-description p').textContent = description;
          card.querySelector(`.${type}-time`).textContent = time || 'No time set';
          const meta = card.querySelector('.card-meta');
          if (newType === 'habit') {
              meta.textContent = `${card.dataset.streak ? `Streak: ${card.dataset.streak} days | ` : ''}${newLists.length ? `Lists: ${newLists.join(', ')}` : ''}${newLists.length && newTags.length ? ' | ' : ''}${newTags.length ? `Tags: ${newTags.join(', ')}` : ''}`;
          } else {
              const dateDisplay = newType === 'todo' ? `Date: ${new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : '';
              meta.textContent = `${dateDisplay}${newLists.length ? ` | Lists: ${newLists.join(', ')}` : ''}${newTags.length ? ` | Tags: ${newTags.join(', ')}` : ''}`;
          }

          // Move if type changed
          if (newType !== type || (newType === 'todo' && card.parentElement !== getTodoContainerByDate(date, containers))) {
              card.remove();
              let targetContainer;
              if (newType === 'habit') targetContainer = containers.habits;
              else if (newType === 'reminder') targetContainer = containers.reminders;
              else targetContainer = getTodoContainerByDate(date, containers);
              if (targetContainer) {
                  const newCard = newType === 'habit' ? createHabitCard({ title, description, time, lists: newLists, tags: newTags, streak: card.dataset.streak || 0, id: card.dataset.id, comments: JSON.parse(card.dataset.comments || '[]') }) :
                                  newType === 'reminder' ? createReminderCard({ title, description, date, time, lists: newLists, tags: newTags, status: card.dataset.status, id: card.dataset.id, comments: JSON.parse(card.dataset.comments || '[]') }) :
                                  createTodoCard({ title, description, date, time, status: card.dataset.status, origin: card.dataset.origin, lists: newLists, tags: newTags, id: card.dataset.id, comments: JSON.parse(card.dataset.comments || '[]') });
                  targetContainer.appendChild(newCard);
                  addCardEventListeners(newCard, newType);
              }
          }

          formOverlay.style.display = 'none';
          form.reset();
          document.querySelectorAll('.checkbox-group input').forEach(input => input.checked = false);

          saveTasksToLocalStorage();
          updateTaskStats();
          updateEmptyStateMessages();
          setupNotifications();
          return false;
      };
  };

  commentBtn.onclick = () => {
      const comment = prompt('Add a comment:');
      if (comment?.trim()) {
          const commentEl = document.createElement('div');
          commentEl.className = 'card-comment';
          commentEl.innerHTML = `<p><strong>Comment:</strong> ${comment}</p>`;
          card.insertBefore(commentEl, card.querySelector('.card-footer'));

          const comments = JSON.parse(card.dataset.comments || '[]');
          comments.push(comment);
          card.dataset.comments = JSON.stringify(comments);

          saveTasksToLocalStorage();
      }
  };

  if (checkbox) {
      checkbox.onclick = () => {
          if (type === 'habit') {
              if (checkbox.checked) {
                  card.dataset.streak = parseInt(card.dataset.streak || 0) + 1;
                  card.querySelector('.card-meta').textContent = `${card.dataset.streak ? `Streak: ${card.dataset.streak} days | ` : ''}${card.dataset.lists ? `Lists: ${JSON.parse(card.dataset.lists).join(', ')}` : ''}${card.dataset.lists && card.dataset.tags ? ' | ' : ''}${card.dataset.tags ? `Tags: ${JSON.parse(card.dataset.tags).join(', ')}` : ''}`;
              }
          } else if (type === 'reminder') {
              if (checkbox.checked) {
                  const newCard = createTodoCard({
                      title: card.dataset.title,
                      description: card.dataset.description,
                      date: new Date().toISOString().split('T')[0],
                      time: card.dataset.time,
                      status: 'Completed',
                      origin: 'reminder',
                      lists: JSON.parse(card.dataset.lists || '[]'),
                      tags: JSON.parse(card.dataset.tags || '[]'),
                      id: card.dataset.id,
                      comments: JSON.parse(card.dataset.comments || '[]')
                  });
                  containers.completed.appendChild(newCard);
                  addCardEventListeners(newCard, 'todo');
                  card.remove();
              }
          } else if (type === 'todo') {
              const origin = card.dataset.origin || 'todo';
              if (checkbox.checked) {
                  card.dataset.status = 'Completed';
                  containers.completed.appendChild(card);
              } else if (origin === 'reminder') {
                  const newCard = createReminderCard({
                      title: card.dataset.title,
                      description: card.dataset.description,
                      date: card.dataset.date,
                      time: card.dataset.time,
                      lists: JSON.parse(card.dataset.lists || '[]'),
                      tags: JSON.parse(card.dataset.tags || '[]'),
                      status: 'Pending',
                      id: card.dataset.id,
                      comments: JSON.parse(card.dataset.comments || '[]')
                  });
                  containers.reminders.appendChild(newCard);
                  addCardEventListeners(newCard, 'reminder');
                  card.remove();
              } else {
                  card.dataset.status = 'To Do';
                  const targetContainer = getTodoContainerByDate(card.dataset.date, containers);
                  if (targetContainer && card.parentElement !== targetContainer) {
                      targetContainer.appendChild(card);
                  }
              }
          }
          saveTasksToLocalStorage();
          updateTaskStats();
          updateEmptyStateMessages();
          setupNotifications();
      };
  }
}

// -------------------------
// FORM AND INPUTS
// -------------------------

// Setup activity form
function setupActivityForm() {
  const newActivityBtn = document.querySelector('.new-activity-btn');
  const formOverlay = document.getElementById('activityFormOverlay');
  const form = document.getElementById('newActivityForm');
  const cancelBtn = document.querySelector('.cancel-btn');
  const containers = {
      habits: document.querySelector('.habits-container'),
      reminders: document.querySelector('.reminders-container'),
      today: document.querySelector('.today-items'),
      tomorrow: document.querySelector('.tomorrow-items'),
      week: document.querySelector('.week-items')
  };

  newActivityBtn.onclick = () => {
      updateListOptions();
      updateTagOptions();
      formOverlay.style.display = 'flex';
      form.onsubmit = handleFormSubmit;
  };

  cancelBtn.onclick = () => {
      formOverlay.style.display = 'none';
      form.reset();
      document.querySelectorAll('.checkbox-group input').forEach(input => input.checked = false);
  };

  // Single-select activity type
  document.querySelector('.checkbox-group').addEventListener('change', e => {
      if (e.target.type === 'checkbox') {
          document.querySelectorAll('.checkbox-group input').forEach(input => {
              if (input !== e.target) input.checked = false;
          });
      }
  });

  function handleFormSubmit(e) {
      e.preventDefault();
      const type = document.querySelector('.checkbox-group input:checked')?.value;
      const title = document.getElementById('activityTitle').value;
      const description = document.getElementById('activityDescription').value;
      const date = document.getElementById('activityDate').value;
      const time = document.getElementById('activityTime').value;
      const lists = Array.from(document.querySelectorAll('#activityLists input:checked')).map(input => input.value);
      const tags = Array.from(document.querySelectorAll('#activityTags input:checked')).map(input => input.value);

      if (!type) return alert('Select an activity type');
      if ((type === 'todo' || type === 'reminder') && !date) return alert('Select a date');

      let newCard;
      if (type === 'habit') {
          newCard = createHabitCard({ title, description, time, lists, tags });
          containers.habits.appendChild(newCard);
      } else if (type === 'reminder') {
          newCard = createReminderCard({ title, description, date, time, lists, tags });
          containers.reminders.appendChild(newCard);
      } else {
          newCard = createTodoCard({ title, description, date, time, lists, tags });
          const targetContainer = getTodoContainerByDate(date, containers);
          if (targetContainer) {
              targetContainer.appendChild(newCard);
          } else {
              console.error('Invalid date:', date);
              return;
          }
      }

      addCardEventListeners(newCard, type);
      formOverlay.style.display = 'none';
      form.reset();
      document.querySelectorAll('.checkbox-group input').forEach(input => input.checked = false);

      saveTasksToLocalStorage();
      updateTaskStats();
      updateEmptyStateMessages();
      setupNotifications();
  }
}

// Update list options in form
function updateListOptions() {
  const listSelect = document.getElementById('activityLists');
  listSelect.innerHTML = '';
  document.querySelectorAll('.sidebar-section .section-item:not(.tag-item):not(:last-child)').forEach(list => {
      const name = list.textContent.trim();
      listSelect.innerHTML += `
          <div>
              <input type="checkbox" name="lists" value="${name}" id="list-${name}">
              <label for="list-${name}">${name}</label>
          </div>
      `;
  });
}

// Update tag options in form
function updateTagOptions() {
  const tagSelect = document.getElementById('activityTags');
  tagSelect.innerHTML = '';
  document.querySelectorAll('.sidebar-section .tag-item:not(:last-child)').forEach(tag => {
      const name = tag.textContent.trim();
      tagSelect.innerHTML += `
          <div>
              <input type="checkbox" name="tags" value="${name}" id="tag-${name}">
              <label for="tag-${name}">${name}</label>
          </div>
      `;
  });
}

// Setup lists and tags
function setupListsAndTags() {
  const addListBtn = document.querySelector('.sidebar-section .section-item:not(.tag-item):last-child');
  const addTagBtn = document.querySelector('.sidebar-section .tag-item:last-child');

  addListBtn.onclick = () => {
      const listName = prompt('Enter new list name:')?.trim();
      if (listName) {
          const li = document.createElement('li');
          li.className = 'section-item';
          li.textContent = listName;
          addListBtn.parentElement.insertBefore(li, addListBtn);
          updateListOptions();
      }
  };

  addTagBtn.onclick = () => {
      const tagName = prompt('Enter new tag name:')?.trim();
      if (tagName) {
          const li = document.createElement('li');
          li.className = 'section-item tag-item';
          li.innerHTML = `<span class="tag-color ${tagName.toLowerCase()}"></span>${tagName}`;
          addTagBtn.parentElement.insertBefore(li, addTagBtn);
          updateTagOptions();
      }
  };
}

// -------------------------
// DRAG AND DROP
// -------------------------

// Setup drag-and-drop
function setupDragAndDrop() {
  const containers = document.querySelectorAll('.habits-container, .reminders-container, .today-items, .tomorrow-items, .week-items, .completed-items, .trash-items, .filter-items');

  containers.forEach(container => {
      container.ondragover = e => {
          e.preventDefault();
          const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
          const draggable = document.querySelector('.dragging');
          if (afterElement) {
              container.insertBefore(draggable, afterElement);
          } else {
              container.appendChild(draggable);
          }
      };

      container.ondrop = () => {
          saveTasksToLocalStorage();
          updateTaskStats();
          updateEmptyStateMessages();
      };
  });

  document.querySelectorAll('.card').forEach(card => {
      card.ondragstart = () => card.classList.add('dragging');
      card.ondragend = () => card.classList.remove('dragging');
  });
}

// Get element to insert dragged card after
function getDragAfterElement(container, x, y) {
  const draggables = [...container.querySelectorAll('.card:not(.dragging)')];
  return draggables.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const isHorizontal = container.classList.contains('habits-container') || container.classList.contains('reminders-container');
      const offset = isHorizontal ? x - box.left - box.width / 2 : y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
      }
      return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// -------------------------
// STORAGE
// -------------------------

// Save tasks to localStorage
function saveTasksToLocalStorage() {
  const tasks = {
      habits: [],
      reminders: [],
      todos: [],
      lastResetDate: new Date().toISOString().split('T')[0]
  };

  document.querySelectorAll('.habit-card').forEach(card => {
      tasks.habits.push({
          type: 'habit',
          id: card.dataset.id,
          title: card.dataset.title,
          description: card.dataset.description,
          time: card.dataset.time,
          checked: card.querySelector('.habit-checkbox').checked,
          streak: parseInt(card.dataset.streak || 0),
          lists: JSON.parse(card.dataset.lists || '[]'),
          tags: JSON.parse(card.dataset.tags || '[]'),
          comments: JSON.parse(card.dataset.comments || '[]')
      });
  });

  document.querySelectorAll('.reminder-card').forEach(card => {
      tasks.reminders.push({
          type: 'reminder',
          id: card.dataset.id,
          title: card.dataset.title,
          description: card.dataset.description,
          date: card.dataset.date,
          time: card.dataset.time,
          status: card.dataset.status,
          lists: JSON.parse(card.dataset.lists || '[]'),
          tags: JSON.parse(card.dataset.tags || '[]'),
          comments: JSON.parse(card.dataset.comments || '[]')
      });
  });

  document.querySelectorAll('.todo-card').forEach(card => {
      tasks.todos.push({
          type: 'todo',
          id: card.dataset.id,
          title: card.dataset.title,
          description: card.dataset.description,
          date: card.dataset.date,
          time: card.dataset.time,
          status: card.dataset.status,
          origin: card.dataset.origin,
          lists: JSON.parse(card.dataset.lists || '[]'),
          tags: JSON.parse(card.dataset.tags || '[]'),
          comments: JSON.parse(card.dataset.comments || '[]')
      });
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasksFromLocalStorage() {
  const tasksData = localStorage.getItem('tasks');
  if (!tasksData) return;

  const tasks = JSON.parse(tasksData);
  const today = new Date().toISOString().split('T')[0];
  const lastResetDate = tasks.lastResetDate || today;

  // Reset habit checkboxes if date changed
  if (lastResetDate !== today) {
      tasks.habits.forEach(habit => habit.checked = false);
  }

  const containers = {
      habits: document.querySelector('.habits-container'),
      reminders: document.querySelector('.reminders-container'),
      today: document.querySelector('.today-items'),
      tomorrow: document.querySelector('.tomorrow-items'),
      week: document.querySelector('.week-items'),
      completed: document.querySelector('.completed-items'),
      trash: document.querySelector('.trash-items')
  };

  Object.values(containers).forEach(container => container.innerHTML = '');

  tasks.habits.forEach(data => {
      const card = createHabitCard(data);
      if (data.checked && lastResetDate === today) {
          card.querySelector('.habit-checkbox').checked = true;
      }
      containers.habits.appendChild(card);
      addCardEventListeners(card, 'habit');
  });

  tasks.reminders.forEach(data => {
      const card = createReminderCard(data);
      containers.reminders.appendChild(card);
      addCardEventListeners(card, 'reminder');
  });

  tasks.todos.forEach(data => {
      const targetContainer = data.status === 'Deleted' ? containers.trash :
                             data.status === 'Completed' ? containers.completed :
                             getTodoContainerByDate(data.date, containers);
      if (targetContainer) {
          const card = createTodoCard(data);
          targetContainer.appendChild(card);
          addCardEventListeners(card, 'todo');
      }
  });

  updateTaskStats();
  updateEmptyStateMessages();
  setupNotifications();
  setupDragAndDrop();
}

// -------------------------
// UI UPDATES
// -------------------------

// Update task stats
function updateTaskStats() {
  const activeTab = document.querySelector('.tab.active').className.split(' ')[1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let targetDate = today;

  if (activeTab === 'tomorrow') {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 1);
  } else if (activeTab === 'week') {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 7);
  }

  const habitCount = activeTab === 'today' ? document.querySelectorAll('.habit-card').length : 0;
  const reminderCount = Array.from(document.querySelectorAll('.reminder-card:not([data-status="Completed"])')).filter(card => {
      const cardDate = new Date(card.dataset.date);
      cardDate.setHours(0, 0, 0, 0);
      return activeTab === 'today' ? cardDate.toDateString() === today.toDateString() :
             activeTab === 'tomorrow' ? cardDate.toDateString() === targetDate.toDateString() :
             cardDate <= targetDate && cardDate > today;
  }).length;
  const todoCount = Array.from(document.querySelectorAll('.todo-card:not([data-status="Completed"]):not([data-status="Deleted"])')).filter(card => {
      const cardDate = new Date(card.dataset.date);
      cardDate.setHours(0, 0, 0, 0);
      return activeTab === 'today' ? cardDate.toDateString() === today.toDateString() :
             activeTab === 'tomorrow' ? cardDate.toDateString() === targetDate.toDateString() :
             cardDate <= targetDate && cardDate > today;
  }).length;
  const completedCount = document.querySelectorAll('.completed-items .todo-card').length;

  document.querySelector('.total-tasks').textContent = habitCount + reminderCount + todoCount;
  document.querySelector('.completed-tasks').textContent = completedCount;
}

// Update empty state messages
function updateEmptyStateMessages() {
  const containers = [
      { element: document.querySelector('.habits-container'), message: 'Add a habit' },
      { element: document.querySelector('.reminders-container'), message: 'No reminders' },
      { element: document.querySelector('.today-items'), message: 'Add a task to Today' },
      { element: document.querySelector('.tomorrow-items'), message: 'Add a task to Tomorrow' },
      { element: document.querySelector('.week-items'), message: 'Add a task to Next 7 Days' },
      { element: document.querySelector('.completed-items'), message: 'No completed tasks' },
      { element: document.querySelector('.trash-items'), message: 'Trash is empty' },
      { element: document.querySelector('.filter-items'), message: 'No tasks for this filter' }
  ];

  containers.forEach(({ element, message }) => {
      if (!element) return;
      const existingMessage = element.querySelector('.empty-message');
      const hasContent = Array.from( element.children).some(child => !child.classList.contains('empty-message'));
      if (!hasContent && !existingMessage) {
          const emptyMessage = document.createElement('div');
          emptyMessage.className = 'empty-message';
          emptyMessage.textContent = message;
          element.appendChild(emptyMessage);
      } else if (hasContent && existingMessage) {
          existingMessage.remove();
      }
  });
}

// -------------------------
// AD SYSTEM
// -------------------------

// Setup advertisements
function setupAds() {
  const adContainer = document.querySelector('.ad-container');
  fetch('/ads.json') // Update path as needed
      .then(response => response.json())
      .then(ads => {
          if (!ads.length) return;

          let currentIndex = 0;
          function showAd() {
              const ad = ads[currentIndex];
              adContainer.innerHTML = '<div class="ad-content"></div>';
              const adContent = adContainer.querySelector('.ad-content');

              if (ad.type === 'image') {
                  adContent.innerHTML = `
                      <a href="${ad.actualUrl}" target="_blank">
                          <img src="${ad.src}" alt="Ad">
                          <div class="ad-overlay">${ad.displayUrl}</div>
                      </a>
                  `;
              } else if (ad.type === 'video') {
                  adContent.innerHTML = `
                      <video src="${ad.src}" autoplay muted loop></video>
                      <div class="ad-overlay"><a href="${ad.actualUrl}" target="_blank">${ad.displayUrl}</a></div>
                  `;
              } else if (ad.type === 'youtube') {
                  adContent.innerHTML = `
                      <iframe src="${ad.src}?controls=0&showinfo=0&rel=0&autoplay=1&mute=1&loop=1" frameborder="0"></iframe>
                      <div class="ad-overlay"><a href="${ad.actualUrl}" target="_blank">${ad.displayUrl}</a></div>
                  `;
              }

              setTimeout(() => {
                  currentIndex = (currentIndex + 1) % ads.length;
                  showAd();
              }, (ad.duration || 5) * 1000);
          }

          showAd();
      })
      .catch(e => console.error('Error loading ads:', e));
}