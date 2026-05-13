async function loadProfile() {

    try {

        const response = await fetch(
            "api/profil.php",
            {
                credentials: "include"
            }
        );

        const result = await response.json();

        console.log(result);

        // Userdaten
        document.getElementById("vorname").value =
            result.user.vorname || "";

        document.getElementById("nachname").value =
            result.user.nachname || "";

        document.getElementById("email").value =
            result.user.email || "";

        document.getElementById("beitrittsdatum").value =
            result.user.beitrittsdatum || "";

        // Kinder anzeigen
        renderKinder(result.kinder);

    } catch (error) {

        console.error("Profil konnte nicht geladen werden", error);

    }
}

function getWindelgroesse(gewicht) {

    gewicht = parseFloat(gewicht);

    if (gewicht < 3) return 0;
    if (gewicht <= 5) return 1;
    if (gewicht <= 8) return 2;
    if (gewicht <= 10) return 3;

    return 4;
}

function createKindHTML(kind = {}) {

    const windelgroesse =
        kind.windelgroesse ||
        getWindelgroesse(kind.gewicht || 0);

    return `
        <div class="kind-block">

            <input
                type="hidden"
                class="kindId"
                value="${kind.id || ""}"
            >

            <div>
                <label>Vorname</label>

                <input
                    type="text"
                    class="kindVorname"
                    value="${kind.vorname || ""}"
                    required
                >
            </div>

            <div>
                <label>Geburtsdatum</label>

                <input
                    type="date"
                    class="kindGeburtsdatum"
                    value="${kind.geburtsdatum || ""}"
                    required
                >
            </div>

            <div>
                <label>Gewicht (kg)</label>

                <input
                    type="number"
                    step="0.1"
                    class="kindGewicht"
                    value="${kind.gewicht || ""}"
                    required
                >
            </div>

            <div>
                <label>Windelgrösse</label>

                <input
                    type="text"
                    class="kindWindelgroesse"
                    value="${windelgroesse}"
                    readonly
                >
            </div>

            <button
                type="button"
                class="removeKindBtn"
            >
                Entfernen
            </button>

            <hr>

        </div>
    `;
}

function renderKinder(kinder) {

    const container =
        document.getElementById("kinderContainer");

    container.innerHTML = "";

    kinder.forEach(kind => {

        container.innerHTML += createKindHTML(kind);

    });

    attachEvents();
}

document.getElementById("addKindBtn")
.addEventListener("click", () => {

    const container =
        document.getElementById("kinderContainer");

    container.innerHTML += createKindHTML();

    attachEvents();
});

function attachEvents() {

    // Entfernen
    document.querySelectorAll(".removeKindBtn")
    .forEach(btn => {

        btn.onclick = () => {

            btn.closest(".kind-block").remove();

        };

    });

    // Gewicht ändern
    document.querySelectorAll(".kindGewicht")
    .forEach(input => {

        input.oninput = () => {

            const block =
                input.closest(".kind-block");

            const gewicht = input.value;

            const groesse =
                getWindelgroesse(gewicht);

            block.querySelector(
                ".kindWindelgroesse"
            ).value = groesse;

        };

    });
}

document.getElementById("profilForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const vorname =
        document.getElementById("vorname").value;

    const nachname =
        document.getElementById("nachname").value;

    const kinder = [];

    document.querySelectorAll(".kind-block")
    .forEach(block => {

        kinder.push({

            id:
                block.querySelector(".kindId").value,

            vorname:
                block.querySelector(".kindVorname").value,

            geburtsdatum:
                block.querySelector(".kindGeburtsdatum").value,

            gewicht:
                block.querySelector(".kindGewicht").value,

            windelgroesse:
                block.querySelector(".kindWindelgroesse").value

        });

    });

    try {

        const response = await fetch(
            "api/profilUpdate.php",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    vorname,
                    nachname,
                    kinder
                })
            }
        );

        const result = await response.json();

        alert(result.message);

    } catch (error) {

        console.error(error);

    }
});

loadProfile();