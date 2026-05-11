async function loadProfile() {
  
    try {
      const response = await fetch("api/profil.php", {
        credentials: "include",
        })

      const result = await response.json();

      console.log("Profile data", result);
      } catch (error) {
        console.error ("Failed to load profile:", error);
        
}
}

loadProfile();
document.getElementById("profilForm").
addEventListener("submit", async (e) => {
  e.preventDefault();

  const vorname = document.getElementById
  ("vorname").value.trim();
  const nachname = document.getElementById
  ("nachname").value.trim();

})
