async function loadProfile() {
  
    try {
      const response = await fetch("api/profil.php", {
        credentials: "include",
        })

      const result = await response.json();

      console.log("Profile data", result);
      
      document.querySelector("#vorname").value = result.vorname || "";
      document.getElementById("nachname").value = result.nachname || "";

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

try {
  const response = await fetch("api/profilUpdate.php",
    {
      method: "POST",
      headers: {
        "Content-Type":
        "application/json",
        },
        body: JSON.stringify
        ({vorname, nachname}),
        });
        const result = await  response.json();
        console.log("Update response:", result);

  } catch (error) {
        console.error ("Failed to update profile:", error);
        
}

})

