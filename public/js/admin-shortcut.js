// Secret admin shortcut: Shift + ADMIN
(function () {
  let keySequence = [];
  const targetSequence = ["a", "d", "m", "i", "n"];
  let shiftPressed = false;
  let sequenceTimeout = null;

  document.addEventListener("keydown", function (e) {
    // Check if Shift is pressed
    shiftPressed = e.shiftKey;

    // Only track keys when Shift is pressed
    if (shiftPressed && e.key.length === 1) {
      const key = e.key.toLowerCase();

      // Add key to sequence
      keySequence.push(key);

      // Keep only the last 5 keys
      if (keySequence.length > 5) {
        keySequence.shift();
      }

      // Check if sequence matches "admin"
      if (keySequence.join("") === targetSequence.join("")) {
        e.preventDefault();
        // Redirect to admin login
        window.location.href = "/admin/login";
        keySequence = []; // Reset sequence
      }

      // Reset sequence after 2 seconds of inactivity
      clearTimeout(sequenceTimeout);
      sequenceTimeout = setTimeout(() => {
        keySequence = [];
      }, 2000);
    }
  });

  document.addEventListener("keyup", function (e) {
    // Reset shift flag when released
    shiftPressed = e.shiftKey;
  });
})();
