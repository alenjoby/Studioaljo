// Check authentication
function checkAuth() {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "/admin/login";
    return null;
  }
  return token;
}

// Get headers with auth token
function getAuthHeaders() {
  const token = checkAuth();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Logout function
function logout() {
  const token = localStorage.getItem("adminToken");
  fetch("/admin/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  }).then(() => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication first
  const token = checkAuth();
  if (!token) {
    return;
  }

  // Ensure token is in URL for server-side auth check
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("token")) {
    window.location.href = "/admin/dashboard?token=" + token;
    return;
  }

  // Hide add user form initially
  document.getElementById("addUserSection").classList.add("hidden");

  // Load users when the page loads
  await loadUsers();

  // Add event listeners
  document
    .getElementById("addUserForm")
    .addEventListener("submit", handleAddUser);
  document
    .getElementById("editUserForm")
    .addEventListener("submit", handleEditUser);
  document
    .getElementById("showAddUserForm")
    .addEventListener("click", showAddUserForm);
  document
    .getElementById("cancelAddUser")
    .addEventListener("click", hideAddUserForm);
  document
    .getElementById("cancelEditUser")
    .addEventListener("click", hideEditUserForm);
});

// Show add user form
function showAddUserForm() {
  document.getElementById("addUserSection").classList.remove("hidden");
  document.getElementById("editUserSection").classList.add("hidden");
  // Scroll to the form
  document
    .getElementById("addUserSection")
    .scrollIntoView({ behavior: "smooth" });
}

// Hide add user form
function hideAddUserForm() {
  document.getElementById("addUserSection").classList.add("hidden");
  document.getElementById("addUserForm").reset();
}

// Show edit user form
function showEditUserForm(user) {
  document.getElementById("userId").value = user._id;
  document.getElementById("editName").value = user.name;
  document.getElementById("editEmail").value = user.email;

  document.getElementById("addUserSection").classList.add("hidden");
  document.getElementById("editUserSection").classList.remove("hidden");

  // Scroll to the form
  document
    .getElementById("editUserSection")
    .scrollIntoView({ behavior: "smooth" });
}

// Hide edit user form
function hideEditUserForm() {
  document.getElementById("editUserSection").classList.add("hidden");
  document.getElementById("editUserForm").reset();
}

// Show notification
function showNotification(message, type) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove("hidden");

  // Hide notification after 5 seconds
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 5000);
}

// Handle add user form submission
async function handleAddUser(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
      showNotification("User added successfully!", "success");
      document.getElementById("addUserForm").reset();
      hideAddUserForm();
      await loadUsers(); // Refresh the user list
    } else {
      const errorData = await response.json();
      showNotification(
        `Error: ${errorData.error || "Failed to add user"}`,
        "error"
      );
    }
  } catch (error) {
    showNotification(`Network error: ${error.message}`, "error");
    console.error("Add user error:", error);
  }
}

// Handle edit user form submission
async function handleEditUser(e) {
  e.preventDefault();

  const id = document.getElementById("userId").value;
  const name = document.getElementById("editName").value;
  const email = document.getElementById("editEmail").value;
  const password = document.getElementById("editPassword").value;

  // Only include password in the request if it's not empty
  const userData = { name, email };
  if (password) {
    userData.password = password;
  }

  try {
    const response = await fetch(`/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      showNotification("User updated successfully!", "success");
      hideEditUserForm();
      await loadUsers(); // Refresh the user list
    } else {
      const errorData = await response.json();
      showNotification(
        `Error: ${errorData.error || "Failed to update user"}`,
        "error"
      );
    }
  } catch (error) {
    showNotification(`Network error: ${error.message}`, "error");
    console.error("Edit user error:", error);
  }
}

// Load users from the API
async function loadUsers() {
  try {
    const users = await fetch("/users").then((res) => res.json());
    const userTableBody = document.getElementById("userTableBody");

    // Clear existing rows
    userTableBody.innerHTML = "";

    // Add users to the table
    users.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick='showEditUserForm(${JSON.stringify(
                          user
                        )})'>Edit</button>
                        <button class="delete-btn" onclick="deleteUser('${
                          user._id
                        }')">Delete</button>
                    </div>
                </td>
            `;
      userTableBody.appendChild(row);
    });
  } catch (error) {
    showNotification(`Error loading users: ${error.message}`, "error");
    console.error("Load users error:", error);
  }
}

// Delete user
async function deleteUser(id) {
  if (
    confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    )
  ) {
    try {
      const response = await fetch(`/users/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showNotification("User deleted successfully!", "success");
        await loadUsers(); // Refresh the user list
      } else {
        const errorData = await response.json();
        showNotification(
          `Error: ${errorData.error || "Failed to delete user"}`,
          "error"
        );
      }
    } catch (error) {
      showNotification(`Network error: ${error.message}`, "error");
      console.error("Delete user error:", error);
    }
  }
}
