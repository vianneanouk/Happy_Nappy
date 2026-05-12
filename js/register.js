// register.js

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const errorMessage = document.getElementById("error-message");

  /* Fehlermeldung zurücksetzen */
  errorMessage.style.display = "none";
  errorMessage.textContent = "";

  try {
    const response = await fetch("api/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.status === "success") {

      window.location.href = "login.html";

    } else {

      errorMessage.style.display = "block";
      errorMessage.textContent = "Diese Mailadresse ist bereits registriert";

    }

  } catch (error) {

    console.error("Error:", error);

    errorMessage.style.display = "block";
    errorMessage.textContent = "Etwas ist schiefgelaufen";

  }
});