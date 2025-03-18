
        window.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();

            switch (key) {
                case "1":
                    document.getElementById("terrainTab").click();
                    console.log("terrainTab clicked");
                    break;
                case "2":
                    document.getElementById("creaturesTab").click();
                    break;
                case "3":
                    document.getElementById("animalsTab").click();
                    break;
                case "4":
                    document.getElementById("budgetsTab").click();
                    break;
                case "5":
                    document.getElementById("buildingsTab").click();
                    break;
            }
        });

