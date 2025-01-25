document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("github-username");
    const generateButton = document.getElementById("generate-timeline");
    const warningMessage = document.getElementById("warning-message");
    const repoList = document.getElementById("repo-list");
    const chartCanvas = document.getElementById("repo-timeline-chart");
    const filterLanguage = document.getElementById("filter-language");
    const toggleThemeButton = document.getElementById("toggle-theme");
  
    let darkMode = false;
  
    // Toggle dark mode
    toggleThemeButton.addEventListener("click", () => {
      darkMode = !darkMode;
      document.body.classList.toggle("dark-mode", darkMode);
    });
  
    generateButton.addEventListener("click", async () => {
      const username = usernameInput.value.trim();
  
      warningMessage.textContent = "";
      repoList.innerHTML = "";
      chartCanvas.style.display = "none";
      filterLanguage.innerHTML = '<option value="">All Languages</option>';
      filterLanguage.style.display = "none";
  
      if (!username) {
        warningMessage.textContent = "Please enter a GitHub username.";
        return;
      }
  
      try {
        const response = await axios.get(
          `https://api.github.com/users/${username}/repos`
        );
  
        const repos = response.data;
        if (repos.length === 0) {
          warningMessage.textContent = `No public repos found for user ${username}.`;
          return;
        }
  
        const repoData = repos.map((repo) => ({
          name: repo.name,
          created_at: new Date(repo.created_at),
          description: repo.description || "No description provided.",
          language: repo.language,
        }));
  
        repoData.sort((a, b) => a.created_at - b.created_at);
  
        // Populate repo list and language filter
        const languages = new Set();
        repoData.forEach((repo) => {
          const listItem = document.createElement("li");
          listItem.innerHTML = `
            <strong>${repo.name}</strong> - Created: ${repo.created_at.toDateString()}<br>
            ${repo.description}<br>Language: ${repo.language || "N/A"}
          `;
          repoList.appendChild(listItem);
          if (repo.language) languages.add(repo.language);
        });
  
        languages.forEach((lang) => {
          const option = document.createElement("option");
          option.value = lang;
          option.textContent = lang;
          filterLanguage.appendChild(option);
        });
  
        filterLanguage.style.display = "block";
        filterLanguage.addEventListener("change", () => {
          const selectedLanguage = filterLanguage.value;
          repoList.innerHTML = "";
  
          const filteredRepos = selectedLanguage
            ? repoData.filter((repo) => repo.language === selectedLanguage)
            : repoData;
  
          filteredRepos.forEach((repo) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
              <strong>${repo.name}</strong> - Created: ${repo.created_at.toDateString()}<br>
              ${repo.description}<br>Language: ${repo.language || "N/A"}
            `;
            repoList.appendChild(listItem);
          });
        });
  
        // Prepare data for chart
        const repoSummary = repoData.reduce((acc, repo) => {
          const year = repo.created_at.getFullYear();
          acc[year] = (acc[year] || 0) + 1;
          return acc;
        }, {});
  
        const chartLabels = Object.keys(repoSummary).sort();
        const chartData = chartLabels.map((year) => repoSummary[year]);
  
        // Render chart
        const ctx = chartCanvas.getContext("2d");
        chartCanvas.style.display = "block";
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: "Number of Repos by Year",
                data: chartData,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      } catch (error) {
        warningMessage.textContent = "Invalid GitHub username or network error.";
      }
    });
  });
  