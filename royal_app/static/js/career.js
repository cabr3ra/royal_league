document.addEventListener('DOMContentLoaded', function() {
    // Page elements and global variables
    const searchInput = document.querySelector('.search-input');
    const resultsContainer = document.getElementById('results-container');
    const mensajeFinalContainer = document.querySelector('.end-message');
    const overlay = document.createElement('div');
    let previousQuery = '';
    let selectedCareer = null;
    let dailyCareer = null;    

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

    // Displays the daily career (final effect when guessed correctly)
    function showDailyCareerCorrect(career) {
        setTimeout(() => displayEnd(career, 'message-green'), 2500);
    }

    // Displays the "attempts exhausted" message
    function showDailyCareerIncorrect(career) {
        setTimeout(() => displayEnd(career, 'message-red'), 2500);
    }

    // Creates the overlay and shows the final message
    function displayEnd(career, colorClass) {
        overlay.className = 'end-message-overlay';
        document.body.appendChild(overlay);
        mensajeFinalContainer.innerHTML = `
            <div class="message ${colorClass}">
                <img src="${career.image}" alt="${career.name}">
            </div>
        `;
    }

    /* --------------------------- Attempts Functions --------------------------- */

    // Updates the placeholder with the number of attempts (gets the record of the day)
    function updateAttempts() {
        fetchData('/attempts/')
            .then(data => {
                searchInput.placeholder = `Buscando...                                      ${data.attempts}/7`;
                if (data.attempts === 0 && dailyCareer) {
                    showDailyCareerIncorrect(dailyCareer);
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

    function searchCareers(query) {
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
                        playerButton.classList.add('career-item');
                        playerButton.innerHTML = `
                            <img src="${player.image}" alt="${player.name}" class="career-image">
                            <span class="career-name">${player.name.toUpperCase()}</span>
                        `;
                        playerButton.addEventListener('click', () => {
                            createCareerCard(player);
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

    // Function to handle the comparison of careers and colors
    function compareCareer(careerCard, data) {
        // Verificar si hay coincidencia completa (color: green)
        if (data.color === 'green') {
            // Mostrar mensaje de éxito
            showDailyCareerCorrect(data);

            // Resaltar todas las coincidencias completas
            if (data.coincidences && data.coincidences.length > 0) {
                data.coincidences.forEach(coincidences => {
                    matchingTeam(careerCard, coincidences.season, coincidences.team.name);
                });
            }
            return; // Salir de la función para evitar procesar coincidencias parciales
        }

        // Cambiar colores de fondo para coincidencias parciales
        if (data.coincidences && data.coincidences.length > 0) {
            data.coincidences.forEach(coincidences => {
                matchingTeam(careerCard, coincidences.season, coincidences.team.name);
            });
        }

        // Verificar si los intentos se han agotado
        if (data.color === 'red') {
            showDailyCareerIncorrect(data); // Mostrar mensaje de intentos agotados
            return;
        }

        // Si no pasa nada, decrementar intentos
        decrementAttempts();
    }

    // Function to highlight a specific team based on season and team
    function matchingTeam(careerCard, season, team) {
        const elements = careerCard.getElementsByClassName('meta-background');
        Array.from(elements).forEach(element => {
            const playerSeason = element.getAttribute('data-season'); // Temporada almacenada en un atributo
            const playerTeam = element.getAttribute('data-team'); // Equipo almacenado en un atributo

            if (playerSeason === season && playerTeam === team) {
                element.style.backgroundColor = '#4CAF50'; // Cambiar color de fondo
                element.style.borderBottom = `4px solid rgb(0, 120, 0)`; // Cambiar color del borde
            }
        });
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
    function createCareerCard(player) {
        selectedCareer = player;

        // Crear elementos principales
        const careerCard = document.createElement('div');
        careerCard.classList.add('career-info');

        const careerTitle = document.createElement('div');
        careerTitle.classList.add('career-title');

        const playerNameDiv = document.createElement('div');
        playerNameDiv.classList.add('career-container-name');

        const careerTeamsDiv = document.createElement('div');
        careerTeamsDiv.classList.add('career-container');

        // Añadir nombre del jugador (se tiene desde el objeto player)
        playerNameDiv.textContent = player.name.toUpperCase();
        playerNameDiv.classList.add('animated-name');

        // Obtener historial de carreras del jugador
        fetchData(`/search/career/?player_id=${player.id}`)
            .then(careers => {
                console.log("[DEBUG] Careers fetched:", careers);

                careers.forEach(career => {

                    if (career && career.team && career.season) {
                        const teamDiv = document.createElement('div');
                        teamDiv.classList.add('meta-background', 'animated-info');
                        teamDiv.setAttribute('data-season', career.season);
                        teamDiv.setAttribute('data-team', career.team.name);

                        if (career.team.image) {
                            const img = document.createElement('img');
                            img.src = career.team.image;
                            img.alt = career.team.name;
                            teamDiv.appendChild(img);
                        } else {
                            teamDiv.textContent = career.team.name;
                        }

                        careerTeamsDiv.appendChild(teamDiv);
                    } else {
                        console.error("Invalid career object:", career);
                    }
                });

                // Mostrar títulos de temporada (formato S1, S2...)
                const seasons = careers.map(c => {
                    const match = c.season.match(/Split (\d+)/);
                    return match ? `S${match[1]}` : c.season;
                });

                seasons.forEach(season => {
                    const seasonDiv = document.createElement('div');
                    seasonDiv.textContent = season;
                    careerTitle.appendChild(seasonDiv);
                });

                // Construcción completa de la tarjeta
                careerCard.appendChild(careerTitle);
                careerCard.appendChild(careerTeamsDiv);
                careerCard.appendChild(playerNameDiv);
                document.getElementById('career-card').prepend(careerCard);

                // Animaciones
                animateElements(careerTeamsDiv.querySelectorAll('.animated-info'), 500);
                animateElements([playerNameDiv], 1200);

                // Limpiar búsqueda
                searchInput.value = '';
                resultsContainer.innerHTML = '';

                // Comparar con la carrera del día
                const postData = { id: player.id };
                fetchData('/compare/career/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                })
                .then(data => compareCareer(careerCard, data))
                .catch(error => console.error("Error al comparar carreras:", error));
            })
            .catch(error => console.error("Error al buscar carreras:", error));
    }

    /* --------------------------- Events and Initialization --------------------------- */

    // Search with debounce
    const debouncedSearch = debounce(() => searchCareers(searchInput.value), 300);
    searchInput.addEventListener('input', debouncedSearch);     

    // Gets the DailyCareer and updates attempts
    function fetchDailyCareer() {
        fetchData('/daily_career/')
            .then(career => {
                dailyCareer = career;
                updateAttempts();
            })
            .catch(error => console.error("Error getting DailyCareer:", error));
    }

    // Initialization
    fetchDailyCareer();
    resetAttempts();
});
