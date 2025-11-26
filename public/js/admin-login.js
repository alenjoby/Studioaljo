// Admin login form submission
document
  .getElementById("adminLoginForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;
    const errorMessageElement = document.getElementById("errorMessage");

    try {
      const response = await fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful - store session token and redirect
        localStorage.setItem("adminToken", data.token);
        window.location.href = "/admin/dashboard?token=" + data.token;
      } else {
        errorMessageElement.textContent =
          data.error || "Invalid credentials. Please try again.";
      }
    } catch (error) {
      errorMessageElement.textContent = "Network error: " + error.message;
      console.error("Admin login error:", error);
    }
  });
