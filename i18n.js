// i18n.js - Diccionario Maestro de Idiomas para KUBOKI

(function() {
    // Estructura de Diccionario (Se puede escalar a 24 idiomas fácilmente)
    const DICTIONARY = {
        'es': {
            games: {
                balloons: '🎈 Globos Locos',
                moles: '🔨 Atrapa al Topo',
                face: '🐼 Arma la Cara',
                piano: '🎹 Piano Mágico',
                paint: '🎨 Pintar',
                store: '🏪 Tienda Mágica'
            },
            ui: {
                close: '❌ Salir',
                back: '🏠 Volver',
                games_zone: '¡Zona de Juegos!',
                magic_backpack: 'Mochila Mágica:',
                empty_backpack: 'Tu mochila está vacía. ¡Ve a la Tienda!',
                radio: '🎵 Radio Mágica',
                cinema: '🎬 Cine Kuboki',
                child_status_listening: 'El bosque te escucha...',
                child_status_thinking: 'Pensando...',
                child_status_speaking: 'Hablando...'
            },
            pet: {
                hunger: '🍎 Hambre',
                happy: '🎾 Felicidad',
                hygiene: '🛁 Higiene',
                energy: '⚡ Energía',
                level: 'Nivel',
                sleep_warning: '¡Shhh! Tu mascota está durmiendo. Despiértala tocándola antes de jugar.',
                no_eggs: '❌ ¡Oh no! No tienes suficientes Huevos de Plata (🥚). ¡Ve una historia o juega para ganar más!'
            },
            store: {
                apple: 'Manzana Roja',
                apple_desc: '+20 Hambre',
                bear: 'Oso de Peluche',
                bear_desc: '+50 Felicidad',
                hat: 'Sombrero Mágico',
                hat_desc: '¡Equipable!'
            }
        },
        'en': {
            games: {
                balloons: '🎈 Crazy Balloons',
                moles: '🔨 Whack a Mole',
                face: '🐼 Build the Face',
                piano: '🎹 Magic Piano',
                paint: '🎨 Paint',
                store: '🏪 Magic Store'
            },
            ui: {
                close: '❌ Close',
                back: '🏠 Back',
                games_zone: 'Games Zone!',
                magic_backpack: 'Magic Backpack:',
                empty_backpack: 'Your backpack is empty. Go to the store!',
                radio: '🎵 Magic Radio',
                cinema: '🎬 Kuboki Cinema',
                child_status_listening: 'The forest is listening...',
                child_status_thinking: 'Thinking...',
                child_status_speaking: 'Speaking...'
            },
            pet: {
                hunger: '🍎 Hunger',
                happy: '🎾 Happiness',
                hygiene: '🛁 Hygiene',
                energy: '⚡ Energy',
                level: 'Level',
                sleep_warning: 'Shhh! Your pet is sleeping. Tap to wake it up.',
                no_eggs: '❌ Oh no! Not enough Silver Eggs (🥚). Watch a story or play to earn more!'
            },
            store: {
                apple: 'Red Apple',
                apple_desc: '+20 Hunger',
                bear: 'Teddy Bear',
                bear_desc: '+50 Happiness',
                hat: 'Magic Hat',
                hat_desc: 'Equippable!'
            }
        },
        'pt': {
            games: {
                balloons: '🎈 Balões Loucos',
                moles: '🔨 Pega Toupeira',
                face: '🐼 Monte o Rosto',
                piano: '🎹 Piano Mágico',
                paint: '🎨 Pintar',
                store: '🏪 Loja Mágica'
            },
            ui: {
                close: '❌ Fechar',
                back: '🏠 Voltar',
                games_zone: 'Zona de Jogos!',
                magic_backpack: 'Mochila Mágica:',
                empty_backpack: 'Sua mochila está vazia. Vá à loja!',
                radio: '🎵 Rádio Mágica',
                cinema: '🎬 Cinema Kuboki',
                child_status_listening: 'A floresta te ouve...',
                child_status_thinking: 'Pensando...',
                child_status_speaking: 'Falando...'
            },
            pet: {
                hunger: '🍎 Fome',
                happy: '🎾 Felicidade',
                hygiene: '🛁 Higiene',
                energy: '⚡ Energia',
                level: 'Nível',
                sleep_warning: 'Shhh! Seu pet está dormindo. Toque para acordar.',
                no_eggs: '❌ Ah não! Ovos de Prata insuficientes (🥚). Assista uma história ou jogue para ganhar mais!'
            },
            store: {
                apple: 'Maçã Vermelha',
                apple_desc: '+20 Fome',
                bear: 'Ursinho de Pelúcia',
                bear_desc: '+50 Felicidade',
                hat: 'Chapéu Mágico',
                hat_desc: 'Equipável!'
            }
        }
    };

    window.i18n = {
        lang: 'es',
        
        init: function() {
            // Sincronizar idioma con StorageManager o userData
            if (window.StorageManager) {
                const conf = window.StorageManager.getState().configuracion;
                if (conf && conf.idioma) {
                    this.lang = conf.idioma.split('-')[0];
                }
            } else if (typeof userData !== 'undefined' && userData.idioma) {
                this.lang = userData.idioma.split('-')[0];
            }
            
            // Fallback a inglés si el idioma no está en diccionario
            if (!DICTIONARY[this.lang]) {
                this.lang = 'en';
            }
            console.log("[i18n] Idioma configurado:", this.lang);
        },

        // T(key) - Permite acceso de tipo 'games.balloons'
        T: function(path) {
            let current = DICTIONARY[this.lang];
            const parts = path.split('.');
            for (let i = 0; i < parts.length; i++) {
                if (current[parts[i]] === undefined) {
                    // Fallback a inglés si no se tradujo algo
                    let engFallback = DICTIONARY['en'];
                    for(let j=0; j<=i; j++) engFallback = engFallback ? engFallback[parts[j]] : undefined;
                    return engFallback || path;
                }
                current = current[parts[i]];
            }
            return current;
        }
    };

    window.i18n.init();
    
    // Alias corto T() para todo el código
    window.T = function(path) {
        return window.i18n.T(path);
    };

    // Escuchar si el usuario cambia el idioma para re-inicializar
    window.addEventListener('KUBOKI_STATE_CHANGED', () => {
        window.i18n.init();
    });

})();
