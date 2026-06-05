(function($){

    const DEFAULTS = {
        url: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/',
        files: [
            'worldcup.json',
            'worldcup.quali_playoffs.json',
            'worldcup.stadiums.json',
            'worldcup.teams.json'
        ],
        localPath: 'source/', // Relativ zur HTML oder absolut
        locale: 'de-DE',
        bsVersion: null // null = auto detect, 4 or 5
    };

    $.fn.bsWorldcup = function(optionsOrMethod) {
        const options = $.extend({}, DEFAULTS, typeof optionsOrMethod === 'object' ? optionsOrMethod : {});
        
        return this.each(function() {
            const $this = $(this);
            const data = {};
            let searchTerm = '';
            
            // Bootstrap Version erkennen
            let bsVer = options.bsVersion;
            if (!bsVer) {
                if (typeof bootstrap !== 'undefined' && bootstrap.Tab && bootstrap.Tab.VERSION) {
                    bsVer = parseInt(bootstrap.Tab.VERSION, 10);
                } else if ($.fn.tab && $.fn.tab.Constructor && $.fn.tab.Constructor.VERSION) {
                    bsVer = parseInt($.fn.tab.Constructor.VERSION, 10);
                } else {
                    bsVer = 5; // Default fallback
                }
            }

            const bs = {
                toggle: bsVer === 4 ? 'data-toggle' : 'data-bs-toggle',
                target: bsVer === 4 ? 'data-target' : 'data-bs-target',
                dismiss: bsVer === 4 ? 'data-dismiss' : 'data-bs-dismiss',
                hidden: bsVer === 4 ? 'sr-only' : 'visually-hidden',
                marginEnd: bsVer === 4 ? 'mr-' : 'me-',
                marginStart: bsVer === 4 ? 'ml-' : 'ms-',
                paddingEnd: bsVer === 4 ? 'pr-' : 'pe-',
                paddingStart: bsVer === 4 ? 'pl-' : 'ps-',
                borderEnd: bsVer === 4 ? 'border-right-' : 'border-end-',
                borderStart: bsVer === 4 ? 'border-left-' : 'border-start-',
                floatEnd: bsVer === 4 ? 'float-right' : 'float-end',
                floatStart: bsVer === 4 ? 'float-left' : 'float-start',
                textEnd: bsVer === 4 ? 'text-right' : 'text-end',
                textStart: bsVer === 4 ? 'text-left' : 'text-start',
                opacity10: bsVer === 4 ? '' : 'bg-opacity-10',
                badgePill: bsVer === 4 ? 'badge-pill' : 'rounded-pill',
                bgLight: bsVer === 4 ? 'bg-light' : 'bg-body-secondary border',
                bgDark: bsVer === 4 ? 'bg-dark text-white' : 'bg-body-secondary text-body border-bottom',
                bgScore: bsVer === 4 ? 'bg-dark text-white' : 'bg-body-emphasis text-body',
                bgInput: bsVer === 4 ? 'bg-white' : 'bg-body',
                textMuted: bsVer === 4 ? 'text-muted' : 'text-secondary'
            };

            const getFavorites = () => {
                const favs = localStorage.getItem('bsWorldcup_favorites');
                return favs ? JSON.parse(favs) : [];
            };

            const toggleFavorite = (teamName) => {
                let favs = getFavorites();
                if (favs.includes(teamName)) {
                    favs = favs.filter(f => f !== teamName);
                } else {
                    favs.push(teamName);
                }
                localStorage.setItem('bsWorldcup_favorites', JSON.stringify(favs));
                render(); // Neu rendern, um Änderungen anzuzeigen
            };

            const init = async () => {
                $this.html(`<div class="text-center p-5"><div class="spinner-border" role="status"><span class="${bs.hidden}">Loading...</span></div><p class="mt-2">Loading World Cup data...</p></div>`);
                
                try {
                    await loadData();
                    render();
                } catch (error) {
                    $this.html('<div class="alert alert-danger">Error loading data: ' + error.message + '</div>');
                }
            };

            const loadData = async () => {
                const baseUrl = options.url + '2026/';
                const promises = options.files.map(file => {
                    return $.getJSON(baseUrl + file)
                        .done(json => {
                            data[file] = json;
                            // Speichere lokal, falls gewünscht (optionaler Wunsch des Nutzers)
                            // In einer echten Browser-Umgebung könnten wir hier nichts direkt in dist/source schreiben
                            // Aber wir könnten es im localStorage cachen.
                        })
                        .fail((jqxhr, textStatus, error) => {
                            console.warn(`Fehler beim Laden von ${file} von GitHub, versuche lokal...`);
                            return $.getJSON(options.localPath + file)
                                .done(json => {
                                    data[file] = json;
                                })
                                .fail(() => {
                                    console.error(`Auch lokal konnte ${file} nicht geladen werden.`);
                                });
                        });
                });
                return Promise.all(promises);
            };

            const render = () => {
                // Merke aktuellen Tab
                const activeTabId = $this.find('.nav-link.active').attr('id') || 'matches-tab';

                let html = `
                    <style>
                        .wc-match-card { transition: all 0.2s ease-in-out; }
                        .wc-match-card:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
                        @media (min-width: 768px) { .border-end-md { border-right: 1px solid #dee2e6; } }
                    </style>
                    <div class="d-flex flex-wrap align-items-center justify-content-between">
                        <ul class="nav nav-tabs border-bottom-0 mb-3 mb-md-0" id="wcTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTabId === 'matches-tab' ? 'active' : ''}" id="matches-tab" ${bs.toggle}="tab" ${bs.target}="#matches" type="button" role="tab">Schedule</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTabId === 'quali-tab' ? 'active' : ''}" id="quali-tab" ${bs.toggle}="tab" ${bs.target}="#quali" type="button" role="tab">Qualification</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTabId === 'groups-tab' ? 'active' : ''}" id="groups-tab" ${bs.toggle}="tab" ${bs.target}="#groups" type="button" role="tab">Groups</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTabId === 'teams-tab' ? 'active' : ''}" id="teams-tab" ${bs.toggle}="tab" ${bs.target}="#teams" type="button" role="tab">Teams</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${activeTabId === 'stadiums-tab' ? 'active' : ''}" id="stadiums-tab" ${bs.toggle}="tab" ${bs.target}="#stadiums" type="button" role="tab">Stadiums</button>
                            </li>
                        </ul>
                        <div class="d-flex align-items-center mb-1"> 
                            <div class="search-container ${bs.marginEnd}2" style="min-width: 250px;">
                                <div class="input-group shadow-sm">
                                    <div class="input-group-prepend">
                                        <span class="input-group-text ${bs.bgInput} ${bs.borderEnd}0"><i class="bi bi-search ${bs.textMuted}"></i></span>
                                    </div>
                                    <input type="text" id="wcSearch" class="form-control ${bs.bgInput} ${bs.borderStart}0 ${bs.paddingStart}0" placeholder="Search team..." value="${searchTerm}">
                                    ${searchTerm ? `<div class="input-group-append"><button class="btn btn-outline-secondary ${bs.borderStart}0" type="button" id="wcClearSearch"><i class="bi bi-x-lg"></i></button></div>` : ''}
                                </div>
                            </div>
                            <button class="btn btn-outline-primary shadow-sm" id="wcRefresh" title="Refresh data">
                                <i class="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </div>
                    <div class="tab-content p-3 border" id="wcTabsContent">
                        <div class="tab-pane fade ${activeTabId === 'matches-tab' ? 'show active' : ''}" id="matches" role="tabpanel">
                            ${renderMatches()}
                        </div>
                        <div class="tab-pane fade ${activeTabId === 'quali-tab' ? 'show active' : ''}" id="quali" role="tabpanel">
                            ${renderQuali()}
                        </div>
                        <div class="tab-pane fade ${activeTabId === 'groups-tab' ? 'show active' : ''}" id="groups" role="tabpanel">
                            ${renderGroups()}
                        </div>
                        <div class="tab-pane fade ${activeTabId === 'teams-tab' ? 'show active' : ''}" id="teams" role="tabpanel">
                            ${renderTeams()}
                        </div>
                        <div class="tab-pane fade ${activeTabId === 'stadiums-tab' ? 'show active' : ''}" id="stadiums" role="tabpanel">
                            ${renderStadiums()}
                        </div>
                    </div>
                `;
                $this.html(html);

                // Event Handler für Favoriten
                $this.find('.toggle-favorite').on('click', function(e) {
                    e.preventDefault();
                    const teamName = $(this).data('team');
                    toggleFavorite(teamName);
                });

                // Event Handler für Suche
                $this.find('#wcSearch').on('input', function() {
                    searchTerm = $(this).val();
                    // Wir rendern nur den Content neu, um den Fokus im Input zu behalten
                    updateFilteredContent();
                });

                $this.find('#wcClearSearch').on('click', function() {
                    searchTerm = '';
                    render();
                });

                // Event Handler für Refresh
                $this.find('#wcRefresh').on('click', function() {
                    init();
                });

                // Event Handler für Tab-Wechsel (Bootstrap Event)
                // Wenn der Nutzer den Tab wechselt, wenden wir die aktuelle Suche auf den neuen Tab an
                $this.find('button[' + bs.toggle + '="tab"]').on('shown.bs.tab', function () {
                    updateFilteredContent();
                });
            };

            const updateFilteredContent = () => {
                const activeTabId = $this.find('.nav-link.active').attr('id');
                if (activeTabId === 'matches-tab') {
                    $this.find('#matches').html(renderMatches());
                } else if (activeTabId === 'quali-tab') {
                    $this.find('#quali').html(renderQuali());
                } else if (activeTabId === 'groups-tab') {
                    $this.find('#groups').html(renderGroups());
                } else if (activeTabId === 'teams-tab') {
                    $this.find('#teams').html(renderTeams());
                }
                
                // Wir müssen auch die Clear-Button Logik im Input-Group updaten, falls nötig
                // Aber einfacher ist es, wenn wir den Button immer da lassen oder die ganze Leiste neu rendern.
                // Da der Nutzer tippt, wollen wir das Input nicht verlieren.
                if (searchTerm) {
                    if (!$this.find('#wcClearSearch').length) {
                        $this.find('#wcSearch').after(`<div class="input-group-append"><button class="btn btn-outline-secondary ${bs.borderStart}0" type="button" id="wcClearSearch"><i class="bi bi-x-lg"></i></button></div>`);
                        $this.find('#wcClearSearch').on('click', function() {
                            searchTerm = '';
                            render();
                        });
                    }
                } else {
                    $this.find('#wcClearSearch').closest('.input-group-append').remove();
                }
            };

            const getTeamInfo = (teamName) => {
                const teamsData = data['worldcup.teams.json'];
                if (!teamsData) return { name: teamName, code: '' };
                const teams = Array.isArray(teamsData) ? teamsData : teamsData.teams;
                const team = teams.find(t => t.name === teamName);
                return {
                    name: teamName,
                    code: team ? (team.fifa_code || team.code || '') : ''
                };
            };

            const getFlagUrl = (code, name) => {
                const searchKey = (code || name || '').toUpperCase();
                if (!searchKey) return '';
                
                // FIFA Codes & Team Names zu ISO Mapping
                const mapping = {
                    // FIFA Codes
                    'KOR': 'kr', 'GER': 'de', 'FRA': 'fr', 'ESP': 'es', 'ITA': 'it',
                    'BRA': 'br', 'ARG': 'ar', 'MEX': 'mx', 'USA': 'us', 'CAN': 'ca',
                    'ENG': 'gb-eng', 'WAL': 'gb-wls', 'SCO': 'gb-sct', 'NIR': 'gb-nir',
                    'RSA': 'za', 'JPN': 'jp', 'CHN': 'cn', 'AUS': 'au',
                    'NED': 'nl', 'SUI': 'ch', 'POR': 'pt', 'CRO': 'hr', 'GRE': 'gr',
                    'DEN': 'dk', 'SWE': 'se', 'NOR': 'no', 'AUT': 'at', 'BEL': 'be',
                    'URU': 'uy', 'PAR': 'py', 'CHI': 'cl', 'COL': 'co', 'ECU': 'ec',
                    'VEN': 've', 'PER': 'pe', 'BOL': 'bo', 'KSA': 'sa', 'IRN': 'ir',
                    'IRQ': 'iq', 'UAE': 'ae', 'QAT': 'qa', 'EGY': 'eg', 'MAR': 'ma',
                    'TUN': 'tn', 'ALG': 'dz', 'NGA': 'ng', 'SEN': 'sn', 'CIV': 'ci',
                    'GHA': 'gh', 'CMR': 'cm', 'RSA': 'za', 'COD': 'cd', 'ZAM': 'zm',
                    'CPV': 'cv', 'HAI': 'ht', 'PAN': 'pa', 'CRC': 'cr', 'HON': 'hn',
                    'SLV': 'sv', 'GUA': 'gt', 'JAM': 'jm', 'TRI': 'tt', 'NZL': 'nz',
                    'CZE': 'cz', 'SVK': 'sk', 'POL': 'pl', 'UKR': 'ua', 'SRB': 'rs',
                    'SVN': 'si', 'HUN': 'hu', 'ROU': 'ro', 'BUL': 'bg', 'FIN': 'fi',
                    'ISL': 'is', 'IRL': 'ie', 'TUR': 'tr', 'UZB': 'uz', 'JOR': 'jo',
                    'BIH': 'ba', 'ALB': 'al', 'MKD': 'mk', 'KOS': 'xk', 'SUR': 'sr',
                    'BOL': 'bo',

                    // Team Names Fallback
                    'ITALY': 'it', 'DENMARK': 'dk', 'ALBANIA': 'al', 'POLAND': 'pl',
                    'UKRAINE': 'ua', 'WALES': 'gb-wls', 'NORTHERN IRELAND': 'gb-nir',
                    'NORTH MACEDONIA': 'mk', 'KOSOVO': 'xk', 'REPUBLIC OF IRELAND': 'ie',
                    'ROMANIA': 'ro', 'JAMAICA': 'jm', 'SURINAME': 'sr', 'BOLIVIA': 'bo',
                    'CZECH REPUBLIC': 'cz', 'SLOVAKIA': 'sk', 'SWEDEN': 'se', 'TURKEY': 'tr'
                };
                
                const iso = mapping[searchKey] || (code ? code.toLowerCase().substring(0, 2) : '');
                return iso ? `https://flagcdn.com/w40/${iso}.png` : '';
            };

            const formatDateTime = (dateStr, timeStr) => {
                if (!dateStr) return '';
                try {
                    let dateObj;
                    let hasTime = false;

                    if (timeStr) {
                        // Extrahiere Zeit und Zeitzone (z.B. "13:00 UTC-6", "20:45 CET", "20:45 CEST")
                        const timeMatch = timeStr.match(/(\d{1,2}:\d{2})\s*(UTC?([-+]\d{1,2})?|CET|CEST)?/i);
                        if (timeMatch) {
                            const timePart = timeMatch[1];
                            let zonePart = timeMatch[2] || '';
                            let offsetPart = '';
                            
                            if (zonePart.toUpperCase() === 'CET') {
                                offsetPart = '+01:00';
                            } else if (zonePart.toUpperCase() === 'CEST') {
                                offsetPart = '+02:00';
                            } else if (zonePart.toUpperCase().startsWith('UTC')) {
                                let utcOffset = timeMatch[3] || '';
                                if (utcOffset) {
                                    let offsetNum = parseInt(utcOffset, 10);
                                    let sign = offsetNum >= 0 ? '+' : '-';
                                    let absOffset = Math.abs(offsetNum);
                                    offsetPart = sign + (absOffset < 10 ? '0' : '') + absOffset + ':00';
                                } else {
                                    offsetPart = 'Z';
                                }
                            } else {
                                offsetPart = 'Z'; // Fallback
                            }

                            // Erstelle ISO String: YYYY-MM-DDTHH:mm:ss+HH:mm
                            const isoString = `${dateStr}T${timePart.padStart(5, '0')}:00${offsetPart}`;
                            dateObj = new Date(isoString);
                            hasTime = !isNaN(dateObj.getTime());
                        }
                    }

                    if (!hasTime) {
                        // Fallback auf nur Datum, wenn Zeit nicht parst
                        dateObj = new Date(dateStr + 'T00:00:00Z');
                    }

                    if (isNaN(dateObj.getTime())) {
                        // Letzter Fallback für sehr alte Browser
                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                            dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                        }
                    }

                    if (isNaN(dateObj.getTime())) return dateStr;

                    const dateFormatted = dateObj.toLocaleDateString(options.locale);
                    
                    if (timeStr && hasTime) {
                        return {
                            date: dateFormatted,
                            time: dateObj.toLocaleTimeString(options.locale, { hour: '2-digit', minute: '2-digit' })
                        };
                    }
                    
                    return dateFormatted;
                } catch (e) {
                    console.error('Error formatting date:', e);
                    return dateStr;
                }
            };

            const renderMatches = () => {
                const wc = data['worldcup.json'];
                if (!wc) return '<p>No match data available.</p>';
                return processMatchData(wc) || '<p>No match data found in expected format.</p>';
            };

            // Robustes Score-Parsing
            const getScoreValue = (matchObj, idx) => {
                // 1. Check matchObj.score object (highest priority in quali_playoffs)
                if (matchObj.score) {
                    // Order of priority for display: p > et > ft
                    if (Array.isArray(matchObj.score.p)) {
                        return matchObj.score.p[idx];
                    }
                    if (Array.isArray(matchObj.score.et)) {
                        return matchObj.score.et[idx];
                    }
                    if (Array.isArray(matchObj.score.ft)) {
                        return matchObj.score.ft[idx];
                    }
                }

                // 2. Check score1/score2 (or goals1/goals2)
                let val = idx === 0 ? (matchObj.score1 ?? matchObj.goals1) : (matchObj.score2 ?? matchObj.goals2);
                
                if (val !== undefined && val !== null) {
                    if (typeof val === 'object') {
                        return val.goals !== undefined ? val.goals : (val.score !== undefined ? val.score : '-');
                    }
                    return val;
                }

                return '-';
            };

            const renderQuali = () => {
                const quali = data['worldcup.quali_playoffs.json'];
                if (!quali) return '<p>No qualification data available.</p>';
                
                let html = `<div class="mt-2 mb-4 p-3 ${bs.bgLight} rounded shadow-sm border-left ${bs.borderStart}4 border-primary" ${bsVer === 4 ? 'style="border-left: 4px solid #007bff !important;"' : ''}>`;
                html += `<h2 class="h4 mb-0 text-primary fw-bold"><i class="bi bi-trophy-fill ${bs.marginEnd}2"></i>Qualification & Playoffs</h2>`;
                html += '</div>';
                html += processMatchData(quali);
                
                return html || '<p>No qualification data found in expected format.</p>';
            };

            const processMatchData = (d) => {
                if (!d) return '';
                let matches = [];
                if (d.rounds) {
                    d.rounds.forEach(round => {
                        if (round.matches) matches = matches.concat(round.matches);
                    });
                } else if (d.matches) {
                    matches = d.matches;
                }

                if (searchTerm) {
                    const s = searchTerm.toLowerCase();
                    matches = matches.filter(m => {
                        const t1 = typeof m.team1 === 'object' ? m.team1.name : m.team1;
                        const t2 = typeof m.team2 === 'object' ? m.team2.name : m.team2;
                        const t1Info = getTeamInfo(t1);
                        const t2Info = getTeamInfo(t2);
                        
                        return t1.toLowerCase().includes(s) || 
                               t2.toLowerCase().includes(s) || 
                               (t1Info.code && t1Info.code.toLowerCase().includes(s)) ||
                               (t2Info.code && t2Info.code.toLowerCase().includes(s));
                    });
                }

                if (matches.length === 0 && searchTerm) {
                    return `<div class="alert alert-info">No matches found for "${searchTerm}"</div>`;
                }

                // Sortiere alle Spiele chronologisch nach Datum und Zeit
                const sortedMatches = [...matches].sort((a, b) => {
                    const getDateTime = (match) => {
                        const dStr = match.date;
                        const tMatch = match.time ? match.time.match(/(\d{1,2}:\d{2})/) : null;
                        const tStr = tMatch ? tMatch[1].padStart(5, '0') : '00:00';
                        return `${dStr}T${tStr}`;
                    };
                    return getDateTime(a).localeCompare(getDateTime(b));
                });

                const groups = {};
                const groupOrder = [];

                sortedMatches.forEach(m => {
                    const rName = m.round || 'Matches';
                    if (!groups[rName]) {
                        groups[rName] = [];
                        groupOrder.push(rName);
                    }
                    groups[rName].push(m);
                });
                
                let subHtml = '';
                groupOrder.forEach(rName => {
                    subHtml += `<h4 class="mt-4 border-bottom pb-2">${rName}</h4>`;
                    subHtml += renderMatchList(groups[rName]);
                });
                
                return subHtml;
            };

            const renderMatchList = (matches) => {
                if (!matches || !matches.length) return '';
                let html = '<div class="mb-4">';
                matches.forEach(match => {
                    const t1Info = typeof match.team1 === 'object' ? match.team1 : getTeamInfo(match.team1);
                    const t2Info = typeof match.team2 === 'object' ? match.team2 : getTeamInfo(match.team2);
                    
                    const t1Name = t1Info.name;
                    const t1Code = t1Info.code;
                    const t2Name = t2Info.name;
                    const t2Code = t2Info.code;

                    let score1 = '-';
                    let score2 = '-';

                    const renderGoals = (goals) => {
                        if (!goals || !Array.isArray(goals) || goals.length === 0) return '';
                        return `<div class="mt-1 small text-muted" style="font-size: 0.7rem;">
                            ${goals.map(g => {
                                let icon = g.owngoal ? '<i class="bi bi-arrow-left-right text-danger" title="Own Goal"></i>' : (g.penalty ? '<i class="bi bi-p-circle text-primary" title="Penalty"></i>' : '<i class="bi bi- soccer-ball"></i>');
                                return `<span>${g.name} ${g.minute}${g.offset ? `+${g.offset}` : ''}' ${icon}</span>`;
                            }).join(', ')}
                        </div>`;
                    };

                    score1 = getScoreValue(match, 0);
                    score2 = getScoreValue(match, 1);

                    const isAet = match.score && match.score.et;
                    const isPen = match.score && match.score.p;

                    const dt = formatDateTime(match.date, match.time);
                    const displayDate = typeof dt === 'object' ? dt.date : dt;
                    const displayTime = typeof dt === 'object' ? dt.time : '';

                    const favs = getFavorites();
                    const isFav = favs.includes(t1Name) || favs.includes(t2Name);

                    html += `
                        <div class="card wc-match-card mb-2 shadow-sm border-0 ${bs.borderStart} ${bs.borderStart}5 ${isFav ? 'border-warning' : 'border-light'}" style="border-left-width: 5px !important; ${bsVer === 4 ? 'border-left-style: solid;' : ''}">
                            <div class="card-body p-2 p-md-3">
                                <div class="row align-items-center">
                                    <!-- Zeit/Datum -->
                                    <div class="col-12 col-md-2 text-md-center border-right ${bs.borderEnd}md">
                                        <div class="fw-bold text-primary small">${displayDate}</div>
                                        <div class="text-muted small">${displayTime || '--:--'}</div>
                                    </div>
                                    
                                    <!-- Match Details -->
                                    <div class="col-12 col-md-8">
                                        <div class="row align-items-center justify-content-center">
                                            <!-- Team 1 -->
                                            <div class="col-5 text-right ${bs.textEnd} d-flex flex-column align-items-end justify-content-center">
                                                <div class="d-flex align-items-center">
                                                    <span class="${bs.marginEnd}2 fw-semibold d-none d-lg-inline text-truncate" style="max-width: 150px;" title="${t1Name}">${t1Name}</span>
                                                    <span class="${bs.marginEnd}2 fw-semibold d-lg-none">${t1Code || t1Name}</span>
                                                    <img src="${getFlagUrl(t1Code, t1Name)}" onerror="this.src='https://flagcdn.com/w40/un.png'" class="rounded shadow-sm border" style="width:32px; height: 20px; object-fit: cover;">
                                                </div>
                                                ${renderGoals(match.goals1)}
                                            </div>
                                            
                                            <!-- Score -->
                                            <div class="col-2 text-center px-0">
                                                <div class="${bs.bgScore} rounded px-1 py-1 fw-bold d-inline-block shadow-sm" style="min-width: 50px; font-size: 0.9rem;">
                                                    ${score1}:${score2}
                                                </div>
                                                ${isAet || isPen ? `
                                                    <div class="mt-0 small text-uppercase" style="font-size: 0.6rem; line-height: 1;">
                                                        ${isPen ? `<span class="text-danger fw-bold" title="Penalty Shootout ${match.score.p[0]}:${match.score.p[1]}">PSO</span>` : `<span class="${bs.textMuted}">AET</span>`}
                                                    </div>
                                                ` : ''}
                                            </div>
                                            
                                            <!-- Team 2 -->
                                            <div class="col-5 text-left ${bs.textStart} d-flex flex-column align-items-start justify-content-center">
                                                <div class="d-flex align-items-center">
                                                    <img src="${getFlagUrl(t2Code, t2Name)}" onerror="this.src='https://flagcdn.com/w40/un.png'" class="rounded shadow-sm border ${bs.marginEnd}2" style="width:32px; height: 20px; object-fit: cover;">
                                                    <span class="fw-semibold d-none d-lg-inline text-truncate" style="max-width: 150px;" title="${t2Name}">${t2Name}</span>
                                                    <span class="fw-semibold d-lg-none">${t2Code || t2Name}</span>
                                                </div>
                                                ${renderGoals(match.goals2)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Info Icons -->
                                    <div class="col-12 col-md-2 text-md-right ${bs.textEnd}">
                                        ${match.group ? `<span class="badge ${bs.badgePill} ${bs.bgLight} mb-1 d-inline-block" style="font-size: 0.7rem;">${match.group}</span><br>` : ''}
                                        ${match.ground ? `<span class="${bs.textMuted}" style="font-size: 0.75rem;" title="${match.ground}"><i class="bi bi-geo-alt-fill"></i> ${match.ground.split(',')[0]}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                return html;
            };

            const renderGroups = () => {
                const wc = data['worldcup.json'];
                if (!wc) return '<p>No group data available.</p>';

                const groupData = {};
                let matches = [];
                if (wc.rounds) {
                    wc.rounds.forEach(r => { if (r.matches) matches = matches.concat(r.matches); });
                } else if (wc.matches) {
                    matches = wc.matches;
                }

                // Initialisierung der Standings
                matches.forEach(m => {
                    if (m.group) {
                        if (!groupData[m.group]) groupData[m.group] = {};
                        
                        const t1 = typeof m.team1 === 'object' ? m.team1.name : m.team1;
                        const t2 = typeof m.team2 === 'object' ? m.team2.name : m.team2;

                        if (!groupData[m.group][t1]) {
                            groupData[m.group][t1] = { name: t1, played: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
                        }
                        if (!groupData[m.group][t2]) {
                            groupData[m.group][t2] = { name: t2, played: 0, win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
                        }

                        const score1 = getScoreValue(m, 0);
                        const score2 = getScoreValue(m, 1);

                        if (score1 !== '-' && score2 !== '-') {
                            const s1 = parseInt(score1, 10);
                            const s2 = parseInt(score2, 10);

                            groupData[m.group][t1].played++;
                            groupData[m.group][t2].played++;
                            groupData[m.group][t1].goalsFor += s1;
                            groupData[m.group][t1].goalsAgainst += s2;
                            groupData[m.group][t2].goalsFor += s2;
                            groupData[m.group][t2].goalsAgainst += s1;

                            if (s1 > s2) {
                                groupData[m.group][t1].win++;
                                groupData[m.group][t1].points += 3;
                                groupData[m.group][t2].loss++;
                            } else if (s1 < s2) {
                                groupData[m.group][t2].win++;
                                groupData[m.group][t2].points += 3;
                                groupData[m.group][t1].loss++;
                            } else {
                                groupData[m.group][t1].draw++;
                                groupData[m.group][t1].points += 1;
                                groupData[m.group][t2].draw++;
                                groupData[m.group][t2].points += 1;
                            }
                        }
                    }
                });

                const groupNames = Object.keys(groupData).sort();
                if (groupNames.length === 0) return '<p>No groups found in match data.</p>';

                let html = '<div class="row row-cols-1 row-cols-xl-2 g-4">';
                
                groupNames.forEach(gn => {
                    // Sortierung der Teams in der Gruppe
                    let teams = Object.values(groupData[gn]).sort((a, b) => {
                        if (b.points !== a.points) return b.points - a.points;
                        const diffA = a.goalsFor - a.goalsAgainst;
                        const diffB = b.goalsFor - b.goalsAgainst;
                        if (diffB !== diffA) return diffB - diffA;
                        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
                        return a.name.localeCompare(b.name);
                    });
                    
                    if (searchTerm) {
                        const s = searchTerm.toLowerCase();
                        const hasMatchingTeam = teams.some(t => {
                            const info = getTeamInfo(t.name);
                            return t.name.toLowerCase().includes(s) || (info.code && info.code.toLowerCase().includes(s));
                        });
                        if (!hasMatchingTeam && !gn.toLowerCase().includes(s)) return;
                    }

                    html += `
                        <div class="col">
                            <div class="card h-100 shadow-sm border-0">
                                <div class="card-header ${bs.bgDark} fw-bold d-flex justify-content-between align-items-center">
                                    <span>${gn}</span>
                                    <small class="${bsVer === 4 ? 'text-white-50' : 'text-muted'}">Standings</small>
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-hover table-sm mb-0 align-middle" style="font-size: 0.85rem;">
                                        <thead class="${bsVer === 4 ? 'table-light' : 'table-secondary'}">
                                            <tr>
                                                <th class="text-center" style="width: 30px;">#</th>
                                                <th>Team</th>
                                                <th class="text-center" title="Played">P</th>
                                                <th class="text-center d-none d-sm-table-cell" title="Won">W</th>
                                                <th class="text-center d-none d-sm-table-cell" title="Drawn">D</th>
                                                <th class="text-center d-none d-sm-table-cell" title="Lost">L</th>
                                                <th class="text-center" title="Goals">Goals</th>
                                                <th class="text-center" title="Difference">Diff</th>
                                                <th class="text-center fw-bold text-primary" title="Points">Pts</th>
                                                <th style="width: 30px;"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${teams.map((t, index) => {
                                                const info = getTeamInfo(t.name);
                                                const favs = getFavorites();
                                                const isFav = favs.includes(t.name);
                                                const diff = t.goalsFor - t.goalsAgainst;
                                                return `
                                                    <li class="d-none"></li> <!-- Fix for map in template literal -->
                                                    <tr class="${isFav ? 'table-warning text-dark' : ''}">
                                                        <td class="text-center ${bs.textMuted}">${index + 1}</td>
                                                        <td>
                                                            <div class="d-flex align-items-center">
                                                                <img src="${getFlagUrl(info.code, t.name)}" onerror="this.src='https://flagcdn.com/w40/un.png'" class="${bs.marginEnd}2 border shadow-sm" style="width:20px; height:12px; object-fit:cover;">
                                                                <span class="text-nowrap ${isFav ? 'fw-bold' : ''}">${t.name}</span>
                                                            </div>
                                                        </td>
                                                        <td class="text-center">${t.played}</td>
                                                        <td class="text-center d-none d-sm-table-cell">${t.win}</td>
                                                        <td class="text-center d-none d-sm-table-cell">${t.draw}</td>
                                                        <td class="text-center d-none d-sm-table-cell">${t.loss}</td>
                                                        <td class="text-center text-nowrap">${t.goalsFor}:${t.goalsAgainst}</td>
                                                        <td class="text-center ${diff > 0 ? 'text-success' : (diff < 0 ? 'text-danger' : bs.textMuted)}">${diff > 0 ? '+' : ''}${diff}</td>
                                                        <td class="text-center fw-bold text-primary">${t.points}</td>
                                                        <td class="${bsVer === 4 ? 'text-right' : 'text-end'}">
                                                            <button class="btn btn-link toggle-favorite p-0 text-decoration-none" data-team="${t.name}">
                                                                <i class="bi ${isFav ? 'bi-star-fill text-warning' : `bi-star ${bs.textMuted}`}"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('').replace(/<li class="d-none"><\/li>/g, '')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += '</div>';
                return html;
            };

            const renderTeams = () => {
                const teamsData = data['worldcup.teams.json'];
                if (!teamsData) return '<p>No team data available.</p>';

                // Teams können ein direktes Array sein oder in einem Property 'teams' stecken
                let teams = Array.isArray(teamsData) ? teamsData : teamsData.teams;
                if (!teams || !teams.length) return '<p>No team data found in expected format.</p>';

                if (searchTerm) {
                    const s = searchTerm.toLowerCase();
                    teams = teams.filter(t => 
                        t.name.toLowerCase().includes(s) || 
                        (t.fifa_code && t.fifa_code.toLowerCase().includes(s)) ||
                        (t.code && t.code.toLowerCase().includes(s))
                    );
                }

                if (teams.length === 0 && searchTerm) {
                    return `<div class="alert alert-info">No teams found for "${searchTerm}"</div>`;
                }

                let html = '<div class="row row-cols-1 row-cols-md-3 g-4">';
                const favs = getFavorites();
                
                teams.forEach(team => {
                    const code = team.fifa_code || team.code || '';
                    const isFav = favs.includes(team.name);
                    
                    html += `
                        <div class="col">
                            <div class="card h-100 ${isFav ? 'border-warning shadow-sm' : ''}">
                                <div class="card-body d-flex align-items-center justify-content-between">
                                    <div class="d-flex align-items-center">
                                        ${code ? `<img src="${getFlagUrl(code, team.name)}" class="${bs.marginEnd}3 border" onerror="this.style.display='none'" style="width:40px;">` : ''}
                                        <div>
                                            <h5 class="card-title mb-0">${team.name}</h5>
                                            <small class="${bs.textMuted}">${code}${team.continent ? ` | ${team.continent}` : ''}</small>
                                        </div>
                                    </div>
                                    <button class="btn btn-link toggle-favorite p-0 text-decoration-none" data-team="${team.name}" title="Toggle favorite">
                                        <i class="bi ${isFav ? 'bi-star-fill text-warning' : `bi-star ${bs.textMuted}`}" style="font-size: 1.25rem;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                return html;
            };

            const renderStadiums = () => {
                const stadiumsData = data['worldcup.stadiums.json'];
                if (!stadiumsData || !stadiumsData.stadiums) return '<p>No stadium data available.</p>';

                let html = '<div class="table-responsive"><table class="table table-striped"><thead><tr><th>Name</th><th>City</th><th>Capacity</th></tr></thead><tbody>';
                stadiumsData.stadiums.forEach(s => {
                    html += `
                        <tr>
                            <td>${s.name}</td>
                            <td>${s.city}</td>
                            <td>${s.capacity ? s.capacity.toLocaleString() : '-'}</td>
                        </tr>
                    `;
                });
                html += '</tbody></table></div>';
                return html;
            };

            init();
        });
    };
}(jQuery));