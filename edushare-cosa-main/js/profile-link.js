(function () {
    const btnProfile = document.getElementById("btnProfile");
    if (!btnProfile) return;

    btnProfile.addEventListener("click", () => {
        // Save last context if needed in the future
        sessionStorage.setItem("lastPage", "user-area");

        // Go to profile page
        window.location.href = "profile.html";
    });
})();
