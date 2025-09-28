/**
 * SIMULADOR C1 VALENCIÀ CIEACOVA
 * Funcionalitat JavaScript avançada per a la simulació de l'examen oficial
 */

class SimuladorC1Valencià {
    constructor() {
        this.seccióActual = 'comprensió';
        this.tempsRestant = 150 * 60; // 2.5 hores en segons
        this.pausat = false;
        this.respostes = {};
        this.progrés = 0;
        this.totalPreguntes = 35;
        this.intervalCronòmetre = null;

        // Claus de resposta per a la puntuació automàtica
        this.clausRespostes = {
            comprensió: {
                p1: 'C', p2: 'A', p3: 'B', p4: 'A', p5: 'C', p6: 'A', p7: 'B', p8: 'A',
                p9: 'als', p10: 'centenars', p11: 'en', p12: 'suposa', p13: 'que', p14: 'Si', p15: 'sense'
            }
        };

        this.init();
    }

    init() {
        this.vincularEvents();
        this.iniciarCronòmetre();
        this.carregarProgrés();
        this.actualitzarProgrés();
        this.initComptadorsParaules();
        this.initSeleccióTasques();
    }

    vincularEvents() {
        // Navegació
        document.querySelectorAll('.pastilla-nav').forEach(pastilla => {
            pastilla.addEventListener('click', (e) => {
                const secció = e.currentTarget.dataset.secció;
                this.navegarASecció(secció);
            });
        });

        // Botons de navegació de secció
        document.getElementById('següent-expressió')?.addEventListener('click', () => {
            this.navegarASecció('expressió');
        });

        document.getElementById('següent-mediació')?.addEventListener('click', () => {
            this.navegarASecció('mediació');
        });

        document.getElementById('següent-oral')?.addEventListener('click', () => {
            this.navegarASecció('oral');
        });

        // Control del cronòmetre
        document.getElementById('botó-pausa')?.addEventListener('click', () => {
            this.alternarCronòmetre();
        });

        // Botons de guardar progrés
        document.getElementById('guardar-comprensió')?.addEventListener('click', () => {
            this.guardarProgrés();
        });

        document.getElementById('guardar-expressió')?.addEventListener('click', () => {
            this.guardarProgrés();
        });

        document.getElementById('guardar-mediació')?.addEventListener('click', () => {
            this.guardarProgrés();
        });

        document.getElementById('guardar-oral')?.addEventListener('click', () => {
            this.guardarProgrés();
        });

        // Finalitzar examen
        document.getElementById('finalitzar-examen')?.addEventListener('click', () => {
            this.finalitzarExamen();
        });

        // Controls FAB
        document.getElementById('fab-principal')?.addEventListener('click', () => {
            this.alternarFAB();
        });

        document.getElementById('fab-ajuda')?.addEventListener('click', () => {
            this.mostrarAjuda();
        });

        document.getElementById('fab-marcador')?.addEventListener('click', () => {
            this.marcarPregunta();
        });

        document.getElementById('fab-calculadora')?.addEventListener('click', () => {
            this.obrirCalculadora();
        });

        // Controls del modal
        document.getElementById('tancar-resultats')?.addEventListener('click', () => {
            this.tancarResultats();
        });

        // Seguiment de respostes
        this.seguirRespostes();

        // Events de finestra
        window.addEventListener('beforeunload', (e) => {
            if (this.tèCanvisNoGuardats()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Dreceres de teclat
        document.addEventListener('keydown', (e) => {
            this.gestionarDreceresTeclat(e);
        });
    }

    navegarASecció(secció) {
        // Amagar secció actual
        document.querySelectorAll('.secció-examen').forEach(sec => {
            sec.classList.remove('activa');
        });

        // Mostrar secció objectiu
        const seccióObjectiu = document.getElementById(`secció-${secció}`);
        if (seccióObjectiu) {
            seccióObjectiu.classList.add('activa');
        }

        // Actualitzar pastilles de navegació
        document.querySelectorAll('.pastilla-nav').forEach(pastilla => {
            pastilla.classList.remove('activa');
        });

        const pastillaObjectiu = document.querySelector(`[data-secció="${secció}"]`);
        if (pastillaObjectiu) {
            pastillaObjectiu.classList.add('activa');
        }

        this.seccióActual = secció;
        this.guardarProgrés();

        // Desplaçament suau a dalt
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    iniciarCronòmetre() {
        this.actualitzarPantallaCronòmetre();
        
        this.intervalCronòmetre = setInterval(() => {
            if (!this.pausat && this.tempsRestant > 0) {
                this.tempsRestant--;
                this.actualitzarPantallaCronòmetre();

                // Autoguardat cada minut
                if (this.tempsRestant % 60 === 0) {
                    this.guardarProgrés();
                }

                // Advertència als 15 minuts
                if (this.tempsRestant === 15 * 60) {
                    this.mostrarAdvertènciaTemps('Queden 15 minuts!');
                }

                // Advertència als 5 minuts
                if (this.tempsRestant === 5 * 60) {
                    this.mostrarAdvertènciaTemps('Queden 5 minuts!');
                }

                // Temps esgotat
                if (this.tempsRestant === 0) {
                    this.tempsEsgotat();
                }
            }
        }, 1000);
    }

    actualitzarPantallaCronòmetre() {
        const hores = Math.floor(this.tempsRestant / 3600);
        const minuts = Math.floor((this.tempsRestant % 3600) / 60);
        const segons = this.tempsRestant % 60;

        const pantalla = `${hores.toString().padStart(2, '0')}:${minuts.toString().padStart(2, '0')}:${segons.toString().padStart(2, '0')}`;
        
        const elementCronòmetre = document.getElementById('pantalla-temps');
        if (elementCronòmetre) {
            elementCronòmetre.textContent = pantalla;
        }

        // Codificació de colors per urgència
        const contenidorCronòmetre = document.querySelector('.cronòmetre');
        if (contenidorCronòmetre) {
            if (this.tempsRestant < 5 * 60) {
                contenidorCronòmetre.style.background = '#dc2626'; // Roig
            } else if (this.tempsRestant < 15 * 60) {
                contenidorCronòmetre.style.background = '#d97706'; // Taronja
            } else {
                contenidorCronòmetre.style.background = '#0f172a'; // Fosc
            }
        }
    }

    alternarCronòmetre() {
        this.pausat = !this.pausat;
        const botóPausa = document.getElementById('botó-pausa');
        
        if (this.pausat) {
            botóPausa.innerHTML = '<i class="fas fa-play"></i> Reprendre';
            botóPausa.style.background = '#059669'; // Verd
        } else {
            botóPausa.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            botóPausa.style.background = '#d97706'; // Taronja
        }
    }

    mostrarAdvertènciaTemps(missatge) {
        // Crear notificació
        const notificació = document.createElement('div');
        notificació.className = 'advertència-temps';
        notificació.innerHTML = `
            <div class="contingut-advertència">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${missatge}</span>
            </div>
        `;
        notificació.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc2626;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
            z-index: 3000;
            animation: aparèixer 0.3s ease;
        `;

        document.body.appendChild(notificació);

        // Eliminar després de 3 segons
        setTimeout(() => {
            notificació.remove();
        }, 3000);

        // Reproduir so d'advertència (si es permet)
        this.reproduirSoAdvertència();
    }

    tempsEsgotat() {
        clearInterval(this.intervalCronòmetre);
        alert('El temps s\'ha esgotat! L\'examen s\'enviarà automàticament.');
        this.finalitzarExamen();
    }

    seguirRespostes() {
        // Seguir respostes de múltiple elecció
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const nomPregunta = e.target.name;
                const resposta = e.target.value;
                this.respostes[nomPregunta] = resposta;
                this.actualitzarProgrés();
                this.guardarProgrés();
            });
        });

        // Seguir respostes de text
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const nomPregunta = e.target.name;
                const resposta = e.target.value.trim();
                this.respostes[nomPregunta] = resposta;
                this.actualitzarProgrés();
                
                // Guardat amb retard
                clearTimeout(this.timeoutGuardat);
                this.timeoutGuardat = setTimeout(() => {
                    this.guardarProgrés();
                }, 1000);
            });
        });

        // Seguir respostes de textarea
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const id = e.target.id;
                const resposta = e.target.value;
                this.respostes[id] = resposta;
                
                // Actualitzar recompte de paraules
                this.actualitzarRecompteParaules(id);
                
                // Guardat amb retard
                clearTimeout(this.timeoutGuardat);
                this.timeoutGuardat = setTimeout(() => {
                    this.guardarProgrés();
                }, 2000);
            });
        });
    }

    actualitzarProgrés() {
        const preguntesContestades = Object.keys(this.respostes).filter(clau => {
            const resposta = this.respostes[clau];
            return resposta && resposta.toString().trim() !== '';
        }).length;

        this.progrés = preguntesContestades;
        
        const farcimentProgrés = document.getElementById('farciment-progrés');
        const textProgrés = document.getElementById('text-progrés');
        
        if (farcimentProgrés && textProgrés) {
            const percentatge = (this.progrés / this.totalPreguntes) * 100;
            farcimentProgrés.style.width = `${percentatge}%`;
            textProgrés.textContent = `${this.progrés} / ${this.totalPreguntes} preguntes completades`;
        }
    }

    initComptadorsParaules() {
        const textareaAssaig = document.getElementById('text-assaig');
        const textareaTasca2 = document.getElementById('text-tasca2');

        if (textareaAssaig) {
            this.configurarComptadorParaules(textareaAssaig, 'recompte-assaig', 'farciment-assaig', 250);
        }

        if (textareaTasca2) {
            this.configurarComptadorParaules(textareaTasca2, 'recompte-tasca2', 'farciment-tasca2', 250);
        }
    }

    configurarComptadorParaules(textarea, idComptador, idFarciment, maxParaules) {
        const actualitzarComptador = () => {
            const text = textarea.value;
            const recompteParaules = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            
            const elementComptador = document.getElementById(idComptador);
            const elementFarciment = document.getElementById(idFarciment);
            
            if (elementComptador) {
                elementComptador.textContent = recompteParaules;
                
                // Codificació de colors
                if (recompteParaules < 200) {
                    elementComptador.style.color = '#dc2626'; // Roig - massa poques
                } else if (recompteParaules > maxParaules) {
                    elementComptador.style.color = '#dc2626'; // Roig - massa
                } else {
                    elementComptador.style.color = '#059669'; // Verd - bé
                }
            }
            
            if (elementFarciment) {
                const percentatge = Math.min((recompteParaules / maxParaules) * 100, 100);
                elementFarciment.style.width = `${percentatge}%`;
                
                if (recompteParaules > maxParaules) {
                    elementFarciment.style.background = '#dc2626';
                } else if (recompteParaules >= 200) {
                    elementFarciment.style.background = '#059669';
                } else {
                    elementFarciment.style.background = '#d97706';
                }
            }
        };

        textarea.addEventListener('input', actualitzarComptador);
        actualitzarComptador(); // Actualització inicial
    }

    actualitzarRecompteParaules(idTextarea) {
        if (idTextarea === 'text-assaig') {
            this.configurarComptadorParaules(
                document.getElementById('text-assaig'),
                'recompte-assaig',
                'farciment-assaig',
                250
            );
        } else if (idTextarea === 'text-tasca2') {
            this.configurarComptadorParaules(
                document.getElementById('text-tasca2'),
                'recompte-tasca2',
                'farciment-tasca2',
                250
            );
        }
    }

    initSeleccióTasques() {
        document.querySelectorAll('.opció-tasca').forEach(opció => {
            opció.addEventListener('click', (e) => {
                // Eliminar selecció anterior
                document.querySelectorAll('.opció-tasca').forEach(opt => {
                    opt.classList.remove('seleccionada');
                });

                // Afegir selecció a l'opció clicada
                e.currentTarget.classList.add('seleccionada');

                // Mostrar àrea d'escriptura
                const àreaEscriptura = document.getElementById('escriptura-tasca2');
                if (àreaEscriptura) {
                    àreaEscriptura.style.display = 'block';
                }

                // Actualitzar placeholder segons la tasca
                const tipusTasca = e.currentTarget.dataset.tasca;
                const textarea = document.getElementById('text-tasca2');
                if (textarea) {
                    const placeholders = {
                        article: 'Escriu el teu article sobre el millor lloc per visitar al País Valencià...',
                        carta: 'Escriu la teua carta formal de resposta a l\'ajuntament...',
                        informe: 'Escriu el teu informe sobre els avantatges del teletreball...'
                    };
                    textarea.placeholder = placeholders[tipusTasca] || 'Escriu la teua resposta ací...';
                }

                // Guardar selecció de tasca
                this.respostes.tascaSeleccionada = tipusTasca;
                this.guardarProgrés();
            });
        });
    }

    guardarProgrés() {
        const dadesProgrés = {
            seccióActual: this.seccióActual,
            tempsRestant: this.tempsRestant,
            respostes: this.respostes,
            progrés: this.progrés,
            marcaTemporal: Date.now()
        };

        localStorage.setItem('progrésc1Valencià', JSON.stringify(dadesProgrés));
    }

    carregarProgrés() {
        const dadesGuardades = localStorage.getItem('progrésc1Valencià');
        if (dadesGuardades) {
            try {
                const dades = JSON.parse(dadesGuardades);
                this.seccióActual = dades.seccióActual || 'comprensió';
                this.tempsRestant = dades.tempsRestant || this.tempsRestant;
                this.respostes = dades.respostes || {};
                this.progrés = dades.progrés || 0;

                // Restaurar respostes al formulari
                this.restaurarRespostes();
                
                // Navegar a la secció guardada
                this.navegarASecció(this.seccióActual);
                
                console.log('Progrés carregat correctament');
            } catch (error) {
                console.error('Error carregant el progrés:', error);
            }
        }
    }

    restaurarRespostes() {
        Object.keys(this.respostes).forEach(clau => {
            const valor = this.respostes[clau];
            
            // Botons de ràdio
            const ràdio = document.querySelector(`input[name="${clau}"][value="${valor}"]`);
            if (ràdio) {
                ràdio.checked = true;
            }
            
            // Inputs de text
            const inputText = document.querySelector(`input[name="${clau}"]`);
            if (inputText && inputText.type === 'text') {
                inputText.value = valor;
            }
            
            // Textareas
            const textarea = document.getElementById(clau);
            if (textarea) {
                textarea.value = valor;
                this.actualitzarRecompteParaules(clau);
            }
            
            // Selecció de tasca
            if (clau === 'tascaSeleccionada') {
                const opcióTasca = document.querySelector(`[data-tasca="${valor}"]`);
                if (opcióTasca) {
                    opcióTasca.click();
                }
            }
        });
    }

    tèCanvisNoGuardats() {
        const dadesGuardades = localStorage.getItem('progrésc1Valencià');
        if (!dadesGuardades) return Object.keys(this.respostes).length > 0;
        
        try {
            const dades = JSON.parse(dadesGuardades);
            return JSON.stringify(dades.respostes) !== JSON.stringify(this.respostes);
        } catch {
            return true;
        }
    }

    finalitzarExamen() {
        if (confirm('Estàs segur que vols finalitzar l\'examen? Aquesta acció no es pot desfer.')) {
            clearInterval(this.intervalCronòmetre);
            this.calcularResultats();
            this.mostrarResultats();
        }
    }

    calcularResultats() {
        const resultats = {
            comprensió: this.calcularPuntuacióComprensió(),
            expressió: this.calcularPuntuacióExpressió(),
            mediació: { puntuació: 0, total: 25, percentatge: 0 }, // Placeholder
            oral: { puntuació: 0, total: 25, percentatge: 0 }, // Placeholder
            global: { puntuació: 0, total: 100, qualificació: 'Incomplet' }
        };

        // Calcular puntuació global
        resultats.global.puntuació = resultats.comprensió.puntuació + resultats.expressió.puntuació + 
                                     resultats.mediació.puntuació + resultats.oral.puntuació;
        resultats.global.percentatge = (resultats.global.puntuació / resultats.global.total) * 100;

        // Determinar qualificació
        if (resultats.global.percentatge >= 90) {
            resultats.global.qualificació = 'Excel·lent';
        } else if (resultats.global.percentatge >= 80) {
            resultats.global.qualificació = 'Notable';
        } else if (resultats.global.percentatge >= 70) {
            resultats.global.qualificació = 'Bé';
        } else if (resultats.global.percentatge >= 50) {
            resultats.global.qualificació = 'Aprovat';
        } else {
            resultats.global.qualificació = 'Suspès';
        }

        this.resultats = resultats;
    }

    calcularPuntuacióComprensió() {
        let puntuació = 0;
        let total = 15; // Parts 1 i 2

        // Part 1 (Múltiple elecció)
        for (let i = 1; i <= 8; i++) {
            const respostaUsuari = this.respostes[`p${i}`];
            const respostaCorrecta = this.clausRespostes.comprensió[`p${i}`];
            if (respostaUsuari === respostaCorrecta) {
                puntuació++;
            }
        }

        // Part 2 (Espais buits)
        for (let i = 9; i <= 15; i++) {
            const respostaUsuari = this.respostes[`p${i}`]?.toLowerCase().trim();
            const respostaCorrecta = this.clausRespostes.comprensió[`p${i}`];
            if (respostaUsuari === respostaCorrecta) {
                puntuació++;
            }
        }

        return {
            puntuació: puntuació,
            total: total,
            percentatge: (puntuació / total) * 100,
            desglossament: {
                part1: this.calcularPuntuacióPart(1, 8),
                part2: this.calcularPuntuacióPart(9, 15)
            }
        };
    }

    calcularPuntuacióPart(inici, final) {
        let puntuació = 0;
        let total = final - inici + 1;

        for (let i = inici; i <= final; i++) {
            const respostaUsuari = this.respostes[`p${i}`];
            const respostaCorrecta = this.clausRespostes.comprensió[`p${i}`];
            
            if (i <= 8) {
                // Múltiple elecció - coincidència exacta
                if (respostaUsuari === respostaCorrecta) puntuació++;
            } else {
                // Espais buits - insensible a majúscules
                if (respostaUsuari?.toLowerCase().trim() === respostaCorrecta) puntuació++;
            }
        }

        return { puntuació, total, percentatge: (puntuació / total) * 100 };
    }

    calcularPuntuacióExpressió() {
        // Puntuació bàsica d'escriptura basada en el recompte de paraules i compleció
        let puntuació = 0;
        let total = 50;

        const textAssaig = this.respostes['text-assaig'] || '';
        const textTasca2 = this.respostes['text-tasca2'] || '';

        // Puntuació assaig (25 punts)
        if (textAssaig.trim().length > 0) {
            const paraulesAssaig = textAssaig.trim().split(/\s+/).length;
            if (paraulesAssaig >= 200 && paraulesAssaig <= 250) {
                puntuació += 22; // Bon recompte de paraules
            } else if (paraulesAssaig >= 180 && paraulesAssaig <= 270) {
                puntuació += 18; // Recompte acceptable
            } else if (paraulesAssaig >= 150) {
                puntuació += 12; // Massa curt/llarg però amb contingut
            }
        }

        // Puntuació tasca 2 (25 punts)
        if (textTasca2.trim().length > 0) {
            const paraulesToca2 = textTasca2.trim().split(/\s+/).length;
            if (paraulesToca2 >= 200 && paraulesToca2 <= 250) {
                puntuació += 22; // Bon recompte de paraules
            } else if (paraulesToca2 >= 180 && paraulesToca2 <= 270) {
                puntuació += 18; // Recompte acceptable
            } else if (paraulesToca2 >= 150) {
                puntuació += 12; // Massa curt/llarg però amb contingut
            }
        }

        return {
            puntuació: puntuació,
            total: total,
            percentatge: (puntuació / total) * 100,
            desglossament: {
                assaig: Math.min(25, puntuació),
                tasca2: Math.max(0, puntuació - 25)
            }
        };
    }

    mostrarResultats() {
        const modal = document.getElementById('modal-resultats');
        const cosModal = modal.querySelector('.cos-modal .resum-resultats');

        cosModal.innerHTML = `
            <div class="visió-general-resultats">
                <div class="puntuació-global">
                    <h3>Puntuació Global: ${this.resultats.global.puntuació}/${this.resultats.global.total}</h3>
                    <div class="insígnia-qualificació qualificació-${this.resultats.global.qualificació.toLowerCase()}">
                        Qualificació: ${this.resultats.global.qualificació}
                    </div>
                    <div class="percentatge">${this.resultats.global.percentatge.toFixed(1)}%</div>
                </div>
            </div>

            <div class="desglossament-habilitats">
                <div class="resultat-habilitat">
                    <h4><i class="fas fa-book-open"></i> Comprensió Lectora</h4>
                    <div class="puntuació">${this.resultats.comprensió.puntuació}/${this.resultats.comprensió.total} (${this.resultats.comprensió.percentatge.toFixed(1)}%)</div>
                    <div class="desglossament-part">
                        <span>Part 1: ${this.resultats.comprensió.desglossament.part1.puntuació}/8</span>
                        <span>Part 2: ${this.resultats.comprensió.desglossament.part2.puntuació}/7</span>
                    </div>
                </div>

                <div class="resultat-habilitat">
                    <h4><i class="fas fa-pen"></i> Expressió Escrita</h4>
                    <div class="puntuació">${this.resultats.expressió.puntuació}/${this.resultats.expressió.total} (${this.resultats.expressió.percentatge.toFixed(1)}%)</div>
                    <div class="desglossament-part">
                        <span>Assaig: ${this.resultats.expressió.desglossament.assaig}/25</span>
                        <span>Tasca 2: ${this.resultats.expressió.desglossament.tasca2}/25</span>
                    </div>
                </div>

                <div class="resultat-habilitat incomplet">
                    <h4><i class="fas fa-exchange-alt"></i> Mediació</h4>
                    <div class="puntuació">No completat</div>
                </div>

                <div class="resultat-habilitat incomplet">
                    <h4><i class="fas fa-microphone"></i> Expressió Oral</h4>
                    <div class="puntuació">No completat</div>
                </div>
            </div>

            <div class="secció-comentaris">
                <h4>Comentaris i Recomanacions</h4>
                ${this.generarComentaris()}
            </div>

            <div class="accions-resultats">
                <button class="botó-primari" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimir Resultats
                </button>
                <button class="botó-secundari" onclick="simulador.exportarResultats()">
                    <i class="fas fa-download"></i> Exportar PDF
                </button>
                <button class="botó-èxit" onclick="simulador.repetirExamen()">
                    <i class="fas fa-redo"></i> Repetir Examen
                </button>
            </div>
        `;

        modal.classList.add('actiu');
    }

    generarComentaris() {
        const comprensió = this.resultats.comprensió;
        const expressió = this.resultats.expressió;
        let comentaris = '<ul>';

        // Comentaris de comprensió
        if (comprensió.percentatge >= 80) {
            comentaris += '<li class="positiu">✅ Excel·lent comprensió lectora i coneixement del vocabulari</li>';
        } else if (comprensió.percentatge >= 60) {
            comentaris += '<li class="advertència">⚠️ Bones habilitats de lectura, però repassa vocabulari i estructures gramaticals</li>';
        } else {
            comentaris += '<li class="negatiu">❌ Centra\'t en millorar les estratègies de lectura i ampliar el vocabulari</li>';
        }

        // Comentaris d'escriptura
        if (expressió.percentatge >= 80) {
            comentaris += '<li class="positiu">✅ Fortes habilitats d\'escriptura amb gestió adequada del recompte de paraules</li>';
        } else if (expressió.percentatge >= 60) {
            comentaris += '<li class="advertència">⚠️ Practica l\'organització d\'idees i la gestió efectiva del recompte de paraules</li>';
        } else {
            comentaris += '<li class="negatiu">❌ Treballa l\'estructura d\'escriptura, vocabulari i compliment dels requisits de paraules</li>';
        }

        // Seccions incompletes
        comentaris += '<li class="neutral">📝 Completa les seccions de mediació i expressió oral per a una avaluació completa</li>';

        comentaris += '</ul>';
        return comentaris;
    }

    alternarFAB() {
        const opcionsTab = document.getElementById('opcions-fab');
        opcionsTab.classList.toggle('activa');
    }

    mostrarAjuda() {
        alert(`Ajuda per a l'Examen C1 Valencià:

Navegació:
• Utilitza les pastilles de secció per navegar entre les parts de l'examen
• El teu progrés es guarda automàticament
• El cronòmetre mostra el temps restant per a tot l'examen

Consells:
• Llegeix les instruccions atentament per a cada part
• Gestiona el teu temps de manera efectiva
• Revisa les teues respostes abans de passar a la següent secció

Dreceres de Teclat:
• Ctrl+S: Guardar progrés
• Ctrl+P: Imprimir
• Esc: Tancar modals`);
    }

    marcarPregunta() {
        // Afegir marcador visual a la pregunta actual
        alert('Pregunta marcada! (Funcionalitat disponible pròximament)');
    }

    obrirCalculadora() {
        window.open('data:text/html,<html><head><title>Calculadora</title></head><body><iframe src="https://www.google.com/search?q=calculator" width="100%" height="100%" frameborder="0"></iframe></body></html>', 'calculadora', 'width=300,height=400');
    }

    tancarResultats() {
        document.getElementById('modal-resultats').classList.remove('actiu');
    }

    exportarResultats() {
        // Crear resultats exportables
        const dadesResultats = {
            marcaTemporal: new Date().toISOString(),
            tempsEmprat: this.formatarTemps(150 * 60 - this.tempsRestant),
            ...this.resultats
        };

        const cadenaData = JSON.stringify(dadesResultats, null, 2);
        const blobData = new Blob([cadenaData], { type: 'application/json' });
        
        const enllaç = document.createElement('a');
        enllaç.href = URL.createObjectURL(blobData);
        enllaç.download = `Resultats_C1_Valencià_${new Date().toISOString().split('T')[0]}.json`;
        enllaç.click();
    }

    repetirExamen() {
        if (confirm('Estàs segur que vols repetir l\'examen? Tot el progrés es perdrà.')) {
            localStorage.removeItem('progrésc1Valencià');
            location.reload();
        }
    }

    formatarTemps(segons) {
        const hores = Math.floor(segons / 3600);
        const minuts = Math.floor((segons % 3600) / 60);
        const segs = segons % 60;
        return `${hores}h ${minuts}m ${segs}s`;
    }

    gestionarDreceresTeclat(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.guardarProgrés();
                    break;
                case 'p':
                    e.preventDefault();
                    window.print();
                    break;
            }
        }

        if (e.key === 'Escape') {
            // Tancar qualsevol modal obert
            document.querySelectorAll('.modal.actiu').forEach(modal => {
                modal.classList.remove('actiu');
            });
            
            // Tancar opcions FAB
            document.getElementById('opcions-fab')?.classList.remove('activa');
        }
    }

    reproduirSoAdvertència() {
        // Crear context d'àudio per al so d'advertència
        try {
            const contextÀudio = new (window.AudioContext || window.webkitAudioContext)();
            const oscil·lador = contextÀudio.createOscillator();
            const nodeGanancia = contextÀudio.createGain();

            oscil·lador.connect(nodeGanancia);
            nodeGanancia.connect(contextÀudio.destination);

            oscil·lador.frequency.setValueAtTime(800, contextÀudio.currentTime);
            nodeGanancia.gain.setValueAtTime(0.1, contextÀudio.currentTime);

            oscil·lador.start();
            oscil·lador.stop(contextÀudio.currentTime + 0.2);
        } catch (error) {
            console.log('Àudio no compatible o permís denegat');
        }
    }
}

// Inicialitzar simulador quan es carregui la pàgina
let simulador;

document.addEventListener('DOMContentLoaded', function() {
    simulador = new SimuladorC1Valencià();
    
    // Afegir desplaçament suau per als enllaços interns
    document.querySelectorAll('a[href^="#"]').forEach(ancoratge => {
        ancoratge.addEventListener('click', function (e) {
            e.preventDefault();
            const objectiu = document.querySelector(this.getAttribute('href'));
            if (objectiu) {
                objectiu.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Afegir eliminació d'animació de càrrega
    setTimeout(() => {
        document.body.classList.add('carregat');
    }, 100);
});

// Exposar simulador globalment per al depurat
window.simulador = simulador;

// Registre de Service Worker per a funcionalitat offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registre) {
                console.log('Registre de ServiceWorker reeixit');
            })
            .catch(function(err) {
                console.log('Registre de ServiceWorker fallit');
            });
    });
}