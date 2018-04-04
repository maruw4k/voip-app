class DashboardController {
    constructor($scope, $timeout, API) {
        'ngInject'

        this.API = API;
        var _this = this;
        //Do łatwiejszego debugowania
        window.$scope = $scope;


        //Trzyma dane przyjaciół z bazy
        var friends;
        //Tablica do przechowywania wartości rtt z RTCP
        var rttMeasures = [];

        //Obiekt z informacjami do wyświetlenia
        this.info = {
            status: 'Łączenie',
            textBtn: 'Zarejestruj',
            bandwith: '(brak połączenia)',
            mos: '(brak połączenia)',
        };

        //User Agent klienta SIP
        var ua;
        //Obiekt trzymający sesje
        var sessionWindows = {};

        //Obiekt konfiguracyjny
        let sipConfig = {
            // uri konta sip, (puste, bo później uzupełni się wartością pobraną z bazy danych
            uri: '',
            //login konta sip, (puste, bo później uzupełni się wartością pobraną z bazy danyc
            authorizationUser: '',
            //hasło konta sip, (puste, bo później uzupełni się wartością pobraną z bazy danych
            password: '',
            //serwer websocketowy do połączenia, (puste, bo później uzupełni się wartością pobraną z bazy danyc
            wsServers: [''],
            //czy na starcie ma od razu zarejestrować
            register: true,
            //czy przychodzące i wychodzące połączenia mają być wyświetlane w konsoli
            traceSip: true,
            stunServers: [
                "stun.l.google.com:19302",
                "stun.stunprotocol.org:3478",
                "stun.voiparound.com",
                "stun.voipbuster.com",
                "stun.turnservers.com:3478"
            ],
            turnServers: []
        };

        //Obiekt z wiązaniami do elementów dom
        var elements = {
            uaVideo: document.getElementById('videoChkBox'),
            uaURI: document.getElementById('addressUriInput'),
            sessionList: document.getElementById('chatList'),
            sessionTemplate: document.getElementById('session-template')
        };


        //Zmienne do wykresu
        var dps = []; // dataPoints
        var chart = new CanvasJS.Chart("chartContainer", {
            axisY: {
                includeZero: false
            },
            data: [{
                type: "line",
                dataPoints: dps
            }]
        });
        var xVal = 0;
        var yVal = 100;

        //Rysowanie wykresu przepustowości
        this.updateChart = function (count, data) {

            count = count || 1;

            for (var j = 0; j < count; j++) {
                yVal = data / 1000;
                dps.push({
                    x: xVal,
                    y: yVal
                });
                xVal++;
            }

            if (dps.length > 10) {
                dps.shift();
            }

            chart.render();
        };
        _this.updateChart(10, 0);

        //Ustawienie statusu znajomego
        this.setGuiFriendStatus = function (friend, status) {
            if (status == 'active') {
                document.getElementById(friend).style.backgroundColor = "green";
            } else return;
        }

        //Zmiana statusów w GUI 
        this.setGuiUAStatus = function(btnText, lblText)
        {
            console.log('Zmiana w GUI');
            _this.info.textBtn = btnText;
            _this.info.status = lblText;

            //aktualizuhe wartości $scope, potrzebne do wyświetlenia w widoku
            $scope.$apply();
        }



        //Pobranie danych użytkownika z bazy danych z pomocą 
        let UserData = API.service('me', API.all('users'))
        UserData.one().get()
            .then((response) => {
                //Przypisanie pobranych wartości z bazy danych do wartości odpowiadających w pliku konfiguracyjnym 
                sipConfig.uri = response.data.sip_uri;
                sipConfig.wsServers = response.data.sip_ws;
                sipConfig.authorizationUser = response.data.sip_login;
                sipConfig.password = response.data.sip_password;
            }).then(() => {
                //Utworzenie User agenta
                ua = new SIP.UA(sipConfig);

                //Ustawienie listenera, który wykona się po połączeniu
                ua.on('connected', function () {
                    console.log('Connected');
                    _this.setGuiUAStatus('Zarejestruj','Połączony')

                });

                //Ustawienie listenera, który wykona się po zarejestrowaniu
                ua.on('registered', function () {
                    console.log('Registered');
                    _this.setGuiUAStatus('Wyloguj','Zarejestrowano')
                });

                //Ustawienie listenera, który wykona się po wyrejestrowaniu
                ua.on('unregistered', function () {
                    _this.setGuiUAStatus('Zarejestruj','Niezarejestrowano');
                });

                //Ustawienie listenera, który wykona się po nadjeściu połączenia od innego użytkownika
                ua.on('invite', function (session) {
                    console.log('Zaproszenie');
                    //Funkcja otwierająca nowe okno rozmowy
                    createNewsessionWindow(session.remoteIdentity.uri, session);
                });
                //Ustawienie listenera, który wykona się po otrzymaniu wiadomości
                ua.on('message', function (message) {
                    console.log('Wiadomość przyszła');
                    //Funkcja otwierająca nowe okno rozmowy jeśli takie jeszze nie istnieje
                    if (!sessionWindows[message.remoteIdentity.uri]) {
                        createNewsessionWindow(message.remoteIdentity.uri, null, message);
                    }
                });
            });

        //Pobranie listy znajomych i ustawienie tej wartości na inpucie
        let Friends = this.API.all('contacts');
        Friends.getList()
            .then((response) => {
                _this.friends = response.plain();

                //Użycie timeout by wykonało się kiedy angular wyrenderuje DOM
                $timeout(function () {
                    _this.setSubscription(_this.friends)
                });

            });


        //Ustawienie subskrypcji na użytkownikach i reakcje na powiadomienia, parametr friends - lista znajomych  
        this.setSubscription = function (friends) {
            //Jeśli User Agent jest niezdefiniowany, to zakończ funkcję
            if (!ua) return;
            console.log(friends, 'Znajomi');

            //Zmienna do trzymania subskrypcji
            var subscription = [];
            //Iteracja po każdym ze znajomych
            for (var j = 0; j < friends.length; j++) {
                console.log('Subskrypcja: ', friends[j].sip_address);
                var idDot = 'dot-' + friends[j].id;


                //Ustawienie subskrypcji na adres znajomego
                subscription[j] = ua.subscribe(friends[j].sip_address, 'presence');
                //Zmienia kolor kropki przy użytkowniku jeśli subskrypcja została na nim ustawiona
                document.getElementById(idDot).style.backgroundColor = "gray";

                //Nasłuchuje status użytkownika
                subscription[j].on('notify', function (notification) {
                    _this.setGuiFriendStatus(idDot, notification.request.body)
                    console.log('POWIADOMIENIE dla ', friends[j].name);
                });
            }
        }



        //Logowanie/wylogowanie z serwera SIP
        this.registerSIP = function () {
            if (!ua) return;
            if (ua.isRegistered()) {
                console.log(ua.isRegistered());
                ua.unregister();
                console.log('Wylogowano2');
            } else {
                console.log(ua.isRegistered());
                ua.register();
                console.log('Zarejestrowano2');
            }
        };

        //Wysyłanie zaproszenia
        this.inviteBtnClick = function () {

            var uri = elements.uaURI.value;

            if (!elements.uaURI.value) return;

            var session = ua.invite(uri, {
                media: {
                    constraints: {
                        audio: true,
                        video: elements.uaVideo.checked
                    },
                }
            });
            var ui = createNewsessionWindow(uri, session);
        }

        //Przekazywanie adresu sip do panelu telefonu
        this.clickContact = function (contact) {
            elements.uaURI.value = contact;

            console.log(elements.uaVideo.checked);
            console.log(elements.uaURI.value);
        };

        //Otwieranie nowego okna wiadomości
        this.messageBtnClick = function () {
            console.log('Wysyłanie wiadomości');
            var uri = elements.uaURI.value;
            elements.uaURI.value = '';
            var ui = createNewsessionWindow(uri);
        }


        //Liczenie średniej z tablicy
        this.calculateAverage = function (values) {
            var sumValues = values.reduce(function (sum, value) {
                return sum + value;
            }, 0);
            return (sumValues / values.length);
        }


        //Liczenie poziomu jakości według skali e-model, 
        //za parametr przyjmuje średni czas rtt, czyli minimalny czas wymagany do przesłania sygnału w obu kierunkach
        this.calculateEmodel = function (avgRtt) {
            var emodel = 0;
            //DO POPRAWY!!!
            // if (avgRtt === null || avgRtt) {
            //     avgRtt = 0;
            // }

            // if (avgRtt / 2 >= 500)
            //     emodel = 1;
            // else if (avgRtt / 2 >= 400)
            //     emodel = 2;
            // else if (avgRtt / 2 >= 300)
            //     emodel = 3;
            // else if (avgRtt / 2 >= 200)
            //     emodel = 4;
            // else if (avgRtt / 2 < 200)
            //     emodel = 5;
            return emodel;
        }

        //Pokazywanie statystyk
        this.showStatistic = function (result) {
            //Aktualizuje GUI odpowiednimi wartościami
            document.getElementById('bandwith').innerHTML = _this.convertBytesToUnit(result.bandwidth.speed);
            document.getElementById('codecsSend').innerHTML = result.audio.send.codecs.concat(result.video.send.codecs).join(', ');
            document.getElementById('codecsRecv').innerHTML = result.audio.recv.codecs.concat(result.video.recv.codecs).join(', ');
            document.getElementById('encryption').innerHTML = result.encryption;
            document.getElementById('resolutionSend').innerHTML = result.resolutions.send.width + 'x' + result.resolutions.send.height;
            document.getElementById('resolutionRecv').innerHTML = result.resolutions.recv.width + 'x' + result.resolutions.recv.height;
            document.getElementById('sendDate').innerHTML = _this.convertBytesToUnit(result.audio.bytesSent + result.video.bytesSent);
            document.getElementById('recDate').innerHTML = _this.convertBytesToUnit(result.audio.bytesReceived + result.video.bytesReceived);

            //Pętla pobierająca wartośći RTT i na podstawie tego liczenie wartości e-model
            for (var i in result.results) {
                var now = result.results[i];

                if (now.type == 'ssrc') {
                    //wrzuca do tablicy wartości rtt
                    rttMeasures.push(now.googRtt);
                    // liczy średną rtt
                    var avgRtt = _this.calculateAverage(rttMeasures);
                    // console.log('avgrtt', avgRtt);
                    //funkcja liczy wartość e-model
                    _this.calculateEmodel(avgRtt);
                    //wyświetlenie wartości emodel w GUI
                    document.getElementById('emodel').innerHTML = _this.calculateEmodel(avgRtt).toString();
                }
            }
        }

        //Zamiena bajty na jednostki z przedrostkami
        this.convertBytesToUnit = function (bytes) {
            var k = 1000;
            var unit = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes <= 0) {
                return '0 Bytes';
            }
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);

            if (!unit[i]) {
                return '0 Bytes';
            }

            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + unit[i];
        }


        //Tworzenie GUI okienka rozmowy
        function createNewsessionWindow(uri, session, message) {
            var tpl = elements.sessionTemplate;
            var node = tpl.cloneNode(true);
            var sessionWindow = {};
            var messageNode;

            uri = session ?
                session.remoteIdentity.uri :
                SIP.Utils.normalizeTarget(uri, ua.configuration.hostport_params);
            var displayName = (session && session.remoteIdentity.displayName) || uri.user;

            if (!uri) {
                return;
            }

            // Zapisywanie danych do obiektu sessionWindow by mieć późniejszy dostęp
            sessionWindow.session = session;
            sessionWindow.node = node;
            sessionWindow.displayName = node.querySelector('.display-name');
            sessionWindow.uri = node.querySelector('.uri');
            sessionWindow.call = node.querySelector('.accept');
            sessionWindow.reject = node.querySelector('.reject');
            sessionWindow.dtmf = node.querySelector('.dtmf');
            sessionWindow.dtmfInput = node.querySelector('.dtmf input[type="text"]');
            sessionWindow.video = node.querySelector('video');
            sessionWindow.messages = node.querySelector('.messages');
            sessionWindow.messageForm = node.querySelector('.messageForm');
            sessionWindow.messageInput = node.querySelector('.messageForm input[type="text"]');
            sessionWindow.renderHint = {
                remote: sessionWindow.video
            };

            sessionWindows[uri] = sessionWindow;

            // Aktualizacja szablonu
            node.classList.remove('template');
            sessionWindow.displayName.textContent = displayName || uri.user;
            sessionWindow.uri.textContent = '(' + uri + ')';

            // Akcja na naciśnięcie przysisku rozmowy
            sessionWindow.call.addEventListener('click', function () {
                //Pobranie wartości true/false określającej czy rozmowa będzie wideo lub audio 
                var video = elements.uaVideo.checked;
                //Obiekt konfiguracyjny przyszłego połączenia
                var options = {
                    media: {
                        constraints: {
                            audio: true,
                            video: video
                        }
                    }
                };

                //Przypisanie zmiennej session do sesji bieżącego okna
                var session = sessionWindow.session;
                //Jeśli sesja jeszcze nie istnieje, to zaproś do rozmowy
                if (!session) {
                    //Poprzez User Agenta zaproś do rozmowy
                    //ua.invite(adres_odbiorcy, parametry_połączenia);
                    session = sessionWindow.session = ua.invite(uri, options);

                    //Odpalenie funkcji, która zawiera odpowiednie akcji na rozmowę
                    setUpListeners(session);
                } else if (session.accept && !session.startTime) { // W przypadku gdy połączenie nadchodzi ale nie zaczęło się rozmowy, to odbierz
                    session.accept(options); 
                }
            }, false);

            //Przypisanie akcji do przycisku odrzucania wiadomości
            sessionWindow.reject.addEventListener('click', function () {
                var session = sessionWindow.session;
                if (!session) {
                    return;
                } else if (session.startTime) {
                    session.bye();
                } else if (session.reject) {
                    session.reject();
                } else if (session.cancel) {
                    session.cancel();
                }
            }, false);

            //Przypisanie akcji do formularza wysyłania dtfm
            sessionWindow.dtmf.addEventListener('submit', function (e) {
                e.preventDefault();

                var value = sessionWindow.dtmfInput.value;
                if (value === '' || !session) return;

                sessionWindow.dtmfInput.value = '';

                if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].indexOf(value) > -1) {
                    session.dtmf(value);
                }
            });

            // Ustawienie przycisków
            if (session && !session.accept) {
                sessionWindow.call.disabled = true;
                sessionWindow.call.innerHTML = '...';
                sessionWindow.reject.innerHTML = 'Anuluj';
            } else if (!session) {
                sessionWindow.reject.disabled = true;
                sessionWindow.call.innerHTML = 'Zadzwoń';
                sessionWindow.reject.innerHTML = '...';
            } else {
                sessionWindow.call.innerHTML = 'Odbierz';
                sessionWindow.reject.innerHTML = 'Odrzuć';
            }
            sessionWindow.dtmfInput.disabled = true;


            function setUpListeners(session) {
                sessionWindow.reject.disabled = false;

                if (session.accept) {
                    sessionWindow.call.disabled = false;
                    sessionWindow.call.innerHTML = 'Odbierz';
                    sessionWindow.reject.innerHTML = 'Odrzuć';
                } else {
                    sessionWindow.call.innerHMTL = '...';
                    sessionWindow.reject.innerHTML = 'Anuluj';
                }

                session.on('accepted', function () {
                    sessionWindow.call.disabled = true;
                    sessionWindow.call.innerHTML = '...';
                    sessionWindow.reject.innerHTML = 'Koniec';
                    sessionWindow.dtmfInput.disabled = false;
                    sessionWindow.video.className = 'on';

                    //Odpalenie okna wideo 
                    session.mediaHandler.render(sessionWindow.renderHint);

                    console.log(session, 'session.mediaHandler. SESJA');

                    //getStats(obiektRTCP, funkcja_zwrotna, interwał)
                    //Pobieranie statystyk połączenia i wyświetlenie metod do ich wyświetlania
                    getStats(session.mediaHandler.peerConnection, function (result) {
                        _this.showStatistic(result);
                        _this.updateChart(null, result.bandwidth.speed);
                    }, 1000);


                });

                session.mediaHandler.on('addStream', function () {
                    session.mediaHandler.render(sessionWindow.renderHint);
                });

                session.on('bye', function () {
                    // getStats.nomore();

                    sessionWindow.call.disabled = false;
                    sessionWindow.reject.disabled = true;
                    sessionWindow.dtmfInput.disable = true;
                    sessionWindow.call.innerHTML = 'Zadzwoń';
                    sessionWindow.reject.innerHTML = '...';
                    sessionWindow.video.className = '';
                    delete sessionWindow.session;
                });

                session.on('failed', function () {
                    // window.getStats.nomore();

                    sessionWindow.call.disabled = false;
                    sessionWindow.reject.disabled = true;
                    sessionWindow.dtmfInput.disable = true;
                    sessionWindow.call.innerHTML = 'Zadzwoń';
                    sessionWindow.reject.innerHTML = '...';
                    sessionWindow.video.className = '';
                    delete sessionWindow.session;
                });

                session.on('refer', function handleRefer(request) {
                    var target = request.parseHeader('refer-to').uri;
                    session.bye();

                    createNewsessionWindow(target, ua.invite(target, {
                        media: {
                            constraints: {
                                audio: true,
                                video: true
                            }
                        }
                    }));
                });
            }

            if (session) {
                setUpListeners(session);
            }


            // Wstawianie pojedyńczej wiadomości do listy konwersacji
            function appendMessage(body, sender) {

                //Zmienne do aktualnego czasu
                var d = new Date();
                var n = d.toLocaleTimeString();

                messageNode = document.createElement('div');

                messageNode.textContent = body;
                //Zależnie od kogo jest wiadomość, to inny widok tekstu z wiadomością
                if (sender === 'friend') {
                    messageNode.className = 'direct-chat-msg right';
                    messageNode.innerHTML = '<div class="direct-chat-info clearfix"><span class="direct-chat-name pull-right display-name"></span><span class="direct-chat-timestamp pull-left uri"> ' + n + ' </span> </div><img class="direct-chat-img" src="/img/avatar.png" alt="message user image"> <div class="direct-chat-text"> ' + body + '</div>';
                } else {
                    messageNode.className = 'direct-chat-msg';
                    messageNode.innerHTML = '  <div class="direct-chat-info clearfix"> <span class="direct-chat-name pull-left display-name">Ja</span> <span class="direct-chat-timestamp pull-right"> ' + n + ' </span></div><img class="direct-chat-img" src="/img/avatar.png" alt="message user image"><div class="direct-chat-text">' + body + ' </div>';
                }
                sessionWindow.messages.appendChild(messageNode);
                sessionWindow.messages.scrollTop = sessionWindow.messages.scrollHeight;
            }

            if (message) {
                appendMessage(message.body, 'friend');
            }

            ua.on('message', function (message) {
                appendMessage(message.body, 'friend');
            });


            //Wysłanie wiadomości na czacie
            sessionWindow.messageForm.addEventListener('submit', function (e) {
                e.preventDefault();

                var body = sessionWindow.messageInput.value;
                sessionWindow.messageInput.value = '';

                ua.message(uri, body).on('failed', function (response, cause) {
                    appendMessage('Błąd podczas wysyłania wiadomości: ' + (cause || 'Nieznany error'), 'błąd');
                });

                appendMessage(body, 'local');
            }, false);

            // Dodanie węzła do listy
            elements.sessionList.appendChild(node);
        }


    }
}

export const DashboardComponent = {
    templateUrl: './views/app/components/dashboard/dashboard.component.html',
    controller: DashboardController,
    controllerAs: 'vm',
    bindings: {}
}
