document.addEventListener('DOMContentLoaded', () => {
    /* --------------------------- DOM ELEMENTS & GLOBALS --------------------------- */
    const searchInput = document.querySelector('.search-input');
    const resultsContainer = document.getElementById('results-container');
    const playerTitle = document.getElementById('player-title');
    const playerCard = document.getElementById('player-card');
    const testContainer = document.getElementById('test-content');
    const messageFinalContainer = document.querySelector('.end-message');
    const overlay = document.createElement('div');

    let previousQuery = '';
    let selectedPlayer = null;
    let randomPlayer = null;

    /* --------------------------- UTILITY FUNCTIONS --------------------------- */

    // Debounce to limit frequency of calls (e.g., search input)
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Wrapper for fetch returning JSON
    async function fetchData(url, options = {}) {
        const response = await fetch(url, options);
        return response.json();
    }

    /* --------------------------- UI & ANIMATION --------------------------- */

    // Animate a list of elements with staggered delay
    function animateElements(elements, delay) {
        elements.forEach((el, idx) => {
        if (idx === 0) {
            el.classList.add('initial-delay');
            setTimeout(() => el.classList.add('show'), 100);
        } else {
            setTimeout(() => el.classList.add('show'), idx * delay);
        }
        });
    }

    // Display final message overlay for success/failure with player image
    function displayMessage(player, colorClass) {
        overlay.className = 'end-message-overlay';
        if (!overlay.parentNode) document.body.appendChild(overlay);
        messageFinalContainer.innerHTML = `
        <div class="message ${colorClass}">
            <img src="${player.image}" alt="${player.name}">
        </div>
        `;
    }

    // Show success overlay and reset game after delay
    function showSuccess(player) {
        setTimeout(() => {
            displayMessage(player, 'message-green');
        }, 2500);

        setTimeout(resetGame, 7000);
    }

    // Show failure overlay and reset game after delay
    function showFailure(player) {
        displayMessage(player, 'message-red');
        setTimeout(resetGame, 2500);
    }

    /* --------------------------- ATTEMPTS MANAGEMENT --------------------------- */

    // Update the search input placeholder to show remaining attempts
    function updateAttempts() {
        fetchData('/attempts/')
        .then(data => {
            const attemptsLeft = data.attempts ?? 0;
            searchInput.placeholder = `Buscando...                                      ${attemptsLeft}/7`;

            if (attemptsLeft === 0 && randomPlayer) {
            showFailure(randomPlayer);
            disableSearch();
            }
        })
        .catch(console.error);
    }

    // Decrement attempts in backend and update UI
    function decrementAttempts() {
        fetchData('/attempts/decrement/', { method: 'PUT' })
        .then(updateAttempts)
        .catch(console.error);
    }

    // Reset attempts to initial state
    function resetAttempts() {
        fetchData('/attempts/reset/', { method: 'PUT' })
        .then(() => {
            enableSearch();
            updateAttempts();
        })
        .catch(console.error);
    }

    // Enable search input
    function enableSearch() {
        searchInput.disabled = false;
    }

    // Disable search input
    function disableSearch() {
        searchInput.disabled = true;
    }

    /* --------------------------- PLAYER SEARCH --------------------------- */

    // Search for players based on input query
    function searchPlayers(query) {
        if (query.length === 0) {
        resultsContainer.innerHTML = '';
        previousQuery = '';
        return;
        }

        // If user shortens query, clear previous results
        if (query.length < previousQuery.length) {
        resultsContainer.innerHTML = '';
        }

        fetchData(`/search/player/?query=${encodeURIComponent(query)}`)
        .then(players => {
            resultsContainer.innerHTML = '';
            players.forEach(player => {
            const btn = document.createElement('button');
            btn.classList.add('player-item');
            btn.innerHTML = `
                <img src="${player.image}" alt="${player.name}" class="player-image">
                <span class="player-name">${player.name.toUpperCase()}</span>
            `;
            btn.addEventListener('click', () => createPlayerCard(player));
            resultsContainer.appendChild(btn);
            });
        })
        .catch(error => console.error("Error searching players:", error));

        previousQuery = query;
    }

    /* --------------------------- PLAYER COMPARISON & CARD CREATION --------------------------- */

    // Return arrows indicating numeric comparison (↑ smaller, ↓ larger)
    function getComparisonIcon(playerValue, randomValue) {
        if (playerValue > randomValue) return `<span class="text-animation"> ↓</span>`;
        if (playerValue < randomValue) return `<span class="text-animation"> ↑</span>`;
        return '';
    }

    // Compare arrays for position matching
    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every(pos => arr2.includes(pos));
    }

    // Partial match check for positions
    function hasPartialMatch(arr1, arr2) {
        return arr1.some(pos => arr2.includes(pos)) && !arraysEqual(arr1, arr2);
    }

    // Change background color for a class inside playerInfo based on matching value
    function updateBackgroundColor(playerInfo, className, playerValue, randomValue) {
        const elements = playerInfo.getElementsByClassName(className);
        Array.from(elements).forEach(el => {
        if (playerValue === randomValue) {
            el.style.backgroundColor = '#4CAF50';
            el.style.borderBottomColor = '#007800';
        } else {
            el.style.backgroundColor = '';
            el.style.borderBottomColor = '';
        }
        });
    }

    // Special background color logic for position with partial matches
    function updatePositionBackground(playerInfo, playerPositions, randomPositions) {
        const elements = playerInfo.getElementsByClassName('position');
        Array.from(elements).forEach(el => {
        if (arraysEqual(playerPositions, randomPositions)) {
            el.style.backgroundColor = '#4CAF50';
            el.style.borderBottomColor = '#007800';
        } else if (hasPartialMatch(playerPositions, randomPositions)) {
            el.style.backgroundColor = 'rgb(255, 165, 0)';
            el.style.borderBottomColor = 'rgb(100, 65, 0)';
        } else {
            el.style.backgroundColor = '';
            el.style.borderBottomColor = '';
        }
        });
    }

    // Create player card, send selection to backend for comparison and handle response
    function createPlayerCard(player) {
        selectedPlayer = player;

        // Clear previous input and results
        searchInput.value = '';
        resultsContainer.innerHTML = '';

        // Send selected player ID and current random player ID to backend for comparison
        fetchData('/compare/random_player/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: player.id, random_id: randomPlayer.id })
        })
        .then(data => {
            // Data includes comparison and full randomPlayer info
            const randPlayer = data;

            // Build player info card
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
                    ${player.age}${getComparisonIcon(player.age, randPlayer.age)}
                </div>
                </div>
                <div class="animated-info meta-background number">
                <div class="text-animation">
                    ${player.number}${getComparisonIcon(player.number, randPlayer.number)}
                </div>
                </div>
            </div>
            <div class="player-container-name animated-name">${player.name.toUpperCase()}</div>
            `;

            playerTitle.innerHTML = `<p>NAC</p><p>EQU</p><p>POS</p><p>EDA</p><p>NUM</p>`;

            playerCard.prepend(playerInfo);

            animateElements(playerInfo.querySelectorAll('.animated-info'), 500);
            animateElements(playerInfo.querySelectorAll('.animated-name'), 1200);

            // Update backgrounds for visual comparison
            updateBackgroundColor(playerInfo, 'nation', player.nation.text, randPlayer.nation.text);
            updateBackgroundColor(playerInfo, 'club', player.current_team.text, randPlayer.current_team.text);
            updatePositionBackground(playerInfo, player.position, randPlayer.position);
            updateBackgroundColor(playerInfo, 'age', player.age, randPlayer.age);
            updateBackgroundColor(playerInfo, 'number', player.number, randPlayer.number);

            // Handle attempt results based on backend color status
            if (data.color === 'green') {
            showSuccess(data);
            resetAttempts();
            } else if (data.color === 'red') {
            showFailure(data);
            disableSearch();
            } else {
            decrementAttempts();
            }
        })
        .catch(error => console.error("Error comparing players:", error));
    }

    /* --------------------------- RANDOM PLAYER & INITIALIZATION --------------------------- */

    // Fetch the random player from backend and display info
    function fetchRandomPlayer() {
        fetchData('/random_player/')
        .then(player => {
            randomPlayer = player;
            updateAttempts();
        })
        .catch(console.error);
    }

    // Reset the game: clear UI and fetch new random player & attempts
    function resetGame() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        messageFinalContainer.innerHTML = '';
        resultsContainer.innerHTML = '';
        playerCard.innerHTML = '';
        searchInput.value = '';
        fetchRandomPlayer();
        resetAttempts();
        enableSearch();
    }

    /* --------------------------- EVENT LISTENERS --------------------------- */

    // Debounced search input
    const debouncedSearch = debounce(() => searchPlayers(searchInput.value.trim()), 300);
    searchInput.addEventListener('input', debouncedSearch);

    /* --------------------------- STARTUP --------------------------- */

    fetchRandomPlayer();
    resetAttempts();
});
