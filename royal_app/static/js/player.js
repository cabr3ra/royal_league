document.addEventListener('DOMContentLoaded', function() {
    // Page elements and global variables
    const searchInput = document.querySelector('.search-input');
    const resultsContainer = document.getElementById('results-container');
    const playerTitle = document.getElementById('player-title');
    const playerCard = document.getElementById('player-card');
    const messageFinalContainer = document.querySelector('.end-message');
    const overlay = document.createElement('div');
    let previousQuery = '';
    let selectedPlayer = null;
    let dailyPlayer = null;

    /* --------------------------- Utilities --------------------------- */

    // Debounce function to optimize calls (e.g., during search)
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Performs a fetch request and returns the corresponding JSON
    async function fetchData(url, options = {}) {
        const response = await fetch(url, options);
        return await response.json();
    }

    /* --------------------------- UI Functions --------------------------- */

    // Displays the daily player (final effect when guessed correctly)
    function showDailyPlayerCorrect(player) {
        setTimeout(() => displayEnd(player, 'message-green'), 2500);
    }

    // Displays the "attempts exhausted" message
    function showDailyPlayerIncorrect(player) {
        setTimeout(() => displayEnd(player, 'message-red'), 2500);
    }

    // Creates the overlay and shows the final message
    function displayEnd(player, colorClass) {
        overlay.className = 'end-message-overlay';
        document.body.appendChild(overlay);
        messageFinalContainer.innerHTML = `
            <div class="message ${colorClass}">
                <img src="${player.image}" alt="${player.name}">
            </div>
        `;
    }

    /* --------------------------- Attempts Functions --------------------------- */

    // Updates the placeholder with the number of attempts (gets the record of the day)
    function updateAttempts() {
        fetchData('/attempts/')
            .then(data => {
                searchInput.placeholder = `Buscando...                                      ${data.attempts}/7`;
                if (data.attempts === 0 && dailyPlayer) {
                    showDailyPlayerIncorrect(dailyPlayer);
                }
            });
    }

    // Decreases the attempts (only does the subtraction; assumes the record already exists)
    function decrementAttempts() {
        fetchData('/attempts/decrement/', { method: 'PUT' }).then(updateAttempts);
    }

    // Resets the attempts (e.g., for development or manual reset)
    function resetAttempts() {
        fetchData('/attempts/reset/', { method: 'PUT' }).then(updateAttempts);
    }

    /* --------------------------- Search Functions --------------------------- */

    function searchPlayers(query) {
        if (query.length > 0) {
            // If the query is reduced, clear previous results
            if (query.length < previousQuery.length) {
                resultsContainer.innerHTML = '';
            }
            fetchData(`/search/player/?query=${query}`)
                .then(players => {
                    resultsContainer.innerHTML = '';
                    players.forEach(player => {
                        const playerButton = document.createElement('button');
                        playerButton.classList.add('player-item');
                        playerButton.innerHTML = `
                            <img src="${player.image}" alt="${player.name}" class="player-image">
                            <span class="player-name">${player.name.toUpperCase()}</span>
                        `;
                        playerButton.addEventListener('click', () => {
                            createPlayerCard(player);
                        });
                        resultsContainer.appendChild(playerButton);
                    });
                })
                .catch(error => console.error("Error searching players:", error));
        } else {
            resultsContainer.innerHTML = '';
        }
        previousQuery = query;
    }

    /* --------------------------- Comparison and Styling Functions --------------------------- */

    // Function to change the background color based on comparison
    function changeBackgroundColor(playerInfo, className, playerValue, dailyValue) {
        const elements = playerInfo.getElementsByClassName(className);
        Array.from(elements).forEach(element => {
            if (playerValue === dailyValue) {
                element.style.backgroundColor = '#4CAF50';
                element.style.borderBottomColor = '#007800';
            } else {
                element.style.backgroundColor = '';
                element.style.borderBottomColor = '';
            }
        });
    }

    // Changes the background for position considering partial matches
    function changePositionBackgroundColor(playerInfo, playerPositions, dailyPositions) {
        const elements = playerInfo.getElementsByClassName('position');
        const playerPosList = Array.isArray(playerPositions) ? playerPositions : [];
        const dailyPosList = Array.isArray(dailyPositions) ? dailyPositions : [];

        function arraysAreEqual(arr1, arr2) {
            return arr1.length === arr2.length && arr1.every(pos => arr2.includes(pos));
        }

        function isPartialMatch(arr1, arr2) {
            return arr1.some(pos => arr2.includes(pos)) && !arraysAreEqual(arr1, arr2);
        }

        Array.from(elements).forEach(element => {
            if (arraysAreEqual(playerPosList, dailyPosList)) {
                element.style.backgroundColor = '#4CAF50';
                element.style.borderBottomColor = '#007800';
            } else if (isPartialMatch(playerPosList, dailyPosList)) {
                element.style.backgroundColor = 'rgb(255, 165, 0)';
                element.style.borderBottomColor = 'rgb(100, 65, 0)';
            } else {
                element.style.backgroundColor = '';
                element.style.borderBottomColor = '';
            }
        });
    }

    // Returns an icon (arrows) based on value comparison
    function getComparisonIcon(playerValue, dailyValue) {
        if (playerValue > dailyValue) {
            return `<span class="text-animation"> ↓</span>`;
        } else if (playerValue < dailyValue) {
            return `<span class="text-animation"> ↑</span>`;
        }
        return '';
    }

    // Element animation
    function animateElements(elements, delay) {
        elements.forEach((el, index) => {
            if (index === 0) {
                el.classList.add('initial-delay');
                setTimeout(() => el.classList.add('show'), 100);
            } else {
                setTimeout(() => el.classList.add('show'), index * delay);
            }
        });
    }

    /* --------------------------- Main Flow --------------------------- */

    // Create the player card and start comparison
    function createPlayerCard(player) {
        selectedPlayer = player;

        // Create the player card
        const playerInfo = document.createElement('div');
        playerInfo.classList.add('player-info');
        playerInfo.innerHTML = `
            <div class="player-container">
                <div class="animated-info meta-background nation">
                    <img src="${player.nation.image}" alt="${player.nation.text}" class="nation-image">
                </div>
                <div class="animated-info meta-background club">
                    <img src="${player.current_team.image}" alt="${player.current_team.text}" class="club-image">
                </div>
                <div class="animated-info meta-background position">
                    <div class="text-animation-position">${player.position.join('\n').toUpperCase()}</div>
                </div>
                <div class="animated-info meta-background age">
                    <div class="text-animation">
                        ${player.age}${getComparisonIcon(player.age, dailyPlayer.age)}
                    </div>
                </div>
                <div class="animated-info meta-background number">
                    <div class="text-animation">
                        ${player.number}${getComparisonIcon(player.number, dailyPlayer.number)}
                    </div>
                </div>
            </div>
            <div class="player-container-name animated-name">${player.name.toUpperCase()}</div>
        `;

        // Update the UI title (optional)
        playerTitle.innerHTML = `
            <p>NAC</p>
            <p>EQU</p>
            <p>POS</p>
            <p>EDA</p>
            <p>NUM</p>
        `;

        // Add the card to the container and prepend the info
        playerCard.prepend(playerInfo);

        // Start animations on the card
        animateElements(playerInfo.querySelectorAll('.animated-info'), 500);
        animateElements(playerInfo.querySelectorAll('.animated-name'), 1200);

        // Restart the search and clear results
        searchInput.value = '';
        resultsContainer.innerHTML = '';

        // Backend call for comparison
        fetchData('/compare/player/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: player.id })
        })
        .then(data => {
            // Apply comparison styles
            changeBackgroundColor(playerInfo, 'nation', player.nation.text, dailyPlayer.nation.text);
            changeBackgroundColor(playerInfo, 'club', player.current_team.text, dailyPlayer.current_team.text);
            changePositionBackgroundColor(playerInfo, player.position, dailyPlayer.position);
            changeBackgroundColor(playerInfo, 'age', player.age, dailyPlayer.age);
            changeBackgroundColor(playerInfo, 'number', player.number, dailyPlayer.number);

            // Show overlays or decrease attempts
            if (data.color === 'green') {
                showDailyPlayerCorrect(data);
            } else if (data.color === 'red') {
                showDailyPlayerIncorrect(data);
            } else {
                decrementAttempts();
            }
        })
        .catch(error => console.error("Error comparing players:", error));
    }

    /* --------------------------- Events and Initialization --------------------------- */

    // Search with debounce
    const debouncedSearch = debounce(() => searchPlayers(searchInput.value), 300);
    searchInput.addEventListener('input', debouncedSearch);

    // Gets the DailyPlayer and updates attempts
    function fetchDailyPlayer() {
        fetchData('/daily_player/')
            .then(player => {
                dailyPlayer = player;
                updateAttempts();
            })
            .catch(error => console.error("Error getting DailyPlayer:", error));
    }

    // Initialization
    fetchDailyPlayer();
    resetAttempts();
});
