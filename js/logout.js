
/* Diese Datei steuert den Logout im Browser. Sie hört auf den Klick auf den Logout-Button und sendet eine Anfrage an den Server, um die aktuelle Session zu beenden. 
Nach einer erfolgreichen Antwort wird die Nutzer:in automatisch auf die Login-Seite weitergeleitet. */

document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  // Prevent the default button behavior
  e.preventDefault();

  try {
    const response = await fetch("api/logout.php", {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();

    if (result.status === "success") {
      // Redirect to login page after successful logout
      window.location.href = "login.html";
    } else {
      console.error("Logout failed");
      alert("Logout failed. Please try again.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("Something went wrong during logout!");
  }
});
