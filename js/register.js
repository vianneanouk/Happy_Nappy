document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const mode = document.querySelector('select[name="mode"]').value;
  const familien_id = document.querySelector('input[name="familien_id"]').value.trim();

  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "none";
  errorMessage.textContent = "";

  try {
    const response = await fetch("api/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        mode,
        familien_id
      }),
    });

    const result = await response.json();

    if (result.status === "success") {
      window.location.href = "login.html";
    } else {
      errorMessage.style.display = "block";
      errorMessage.textContent = result.message || "Fehler beim Registrieren";
    }

  } catch (error) {
    console.error(error);
    errorMessage.style.display = "block";
    errorMessage.textContent = "Serverfehler";
  }
});