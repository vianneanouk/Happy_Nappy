async function checkAuth() {
  try {
    const response = await fetch("/api/protected.php", {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = "/login.html";
      return false;
    }

    const result = await response.json();

    document.getElementById("userVorname").textContent =
      result.vorname;

    document.getElementById("userId").textContent =
      result.user_id;

    return true;

  } catch (error) {

    console.error("Auth check failed:", error);

    window.location.href = "/login.html";

    return false;
  }
}

window.addEventListener("load", checkAuth);