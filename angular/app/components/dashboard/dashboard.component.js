class DashboardController {
    constructor($scope, $timeout, API) {
        'ngInject'

        //Pomocnicze
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

        let sipConfig = {
            traceSip: true,
            register: false
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


        // let Friends = this.API.all('contacts')
        //Pobranie danych użytkownika i utworzenie agenta sip dla telefonu
        let UserData = API.service('me', API.all('users'))
        UserData.one().get()
            .then((response) => {
                sipConfig.uri = response.data.sip_uri;
                sipConfig.wsServers = response.data.sip_ws;
                sipConfig.authorizationUser = response.data.sip_login;
                sipConfig.password = response.data.sip_password;
            }).then(() => {
                ua = new SIP.UA(sipConfig);

                //Ustawienie listenerów do nasłuchiwania sygnałów
                ua.on('connected', function () {
                    console.log('Connected');
                    _this.info.status = 'Połączony';
                    _this.info.textBtn = 'Zarejestruj';
                });

                ua.on('registered', function () {
                    console.log('Registered');
                    _this.info.textBtn = 'Wyloguj';
                    _this.info.status = 'Zarejestrowano';
                    $scope.$apply();
                });

                ua.on('unregistered', function () {
                    console.log('Niezarejestrowano');
                    _this.info.textBtn = 'Zarejestruj';
                    _this.info.status = 'Niezarejestrowano';
                    $scope.$apply();
                });

                ua.on('invite', function (session) {
                    console.log('Zaproszenie');
                    createNewsessionWindow(session.remoteIdentity.uri, session);
                });

                ua.on('message', function (message) {
                    console.log('Wiadomość przyszła');
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


        //Ustawienie subskrypcji na użytkownikach i reakcje na powiadomienia
        this.setSubscription = function (friends) {
            if (!ua) return;
            console.log(friends, 'Znajomi');

            var subscription = [];
            for (var j = 0; j < friends.length; j++) {
                console.log('Subskrypcja: ', friends[j].sip_address);
                var id = 'dot-' + friends[j].id;
                document.getElementById(id).style.backgroundColor = "gray";

                subscription[j] = ua.subscribe(friends[j].sip_address, 'presence');
                subscription[j].on('notify', function (notification) {
                    document.getElementById(id).style.backgroundColor = "green";
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


        //Liczenie poziomu jakości
        this.calculateMos = function (avgRtt) {
            var emodel = 0;
            if (avgRtt === null || avgRtt) {
                avgRtt = 0;
            }

            if (avgRtt / 2 >= 500)
                emodel = 1;
            else if (avgRtt / 2 >= 400)
                emodel = 2;
            else if (avgRtt / 2 >= 300)
                emodel = 3;
            else if (avgRtt / 2 >= 200)
                emodel = 4;
            else if (avgRtt / 2 < 200)
                emodel = 5;
            return emodel;
        }

        //Pokazywanie statystyk
        this.showStatistic = function (result) {
            document.getElementById('bandwith').innerHTML = _this.bytesToSize(result.bandwidth.speed);
            document.getElementById('codecsSend').innerHTML = result.audio.send.codecs.concat(result.video.send.codecs).join(', ');
            document.getElementById('codecsRecv').innerHTML = result.audio.recv.codecs.concat(result.video.recv.codecs).join(', ');
            document.getElementById('encryption').innerHTML = result.encryption;
            document.getElementById('resolutionSend').innerHTML = result.resolutions.send.width + 'x' + result.resolutions.send.height;
            document.getElementById('resolutionRecv').innerHTML = result.resolutions.recv.width + 'x' + result.resolutions.recv.height;
            document.getElementById('sendDate').innerHTML = _this.bytesToSize(result.audio.bytesSent + result.video.bytesSent);
            document.getElementById('recDate').innerHTML = _this.bytesToSize(result.audio.bytesReceived + result.video.bytesReceived);

            for (var i in result.results) {
                var now = result.results[i];

                if (now.type == 'ssrc') {
                    console.log('now.ssrc', now.googRtt);
                    rttMeasures.push(now.googRtt);
                    var avgRtt = _this.calculateAverage(rttMeasures);
                    console.log('avgrtt', avgRtt);

                    _this.calculateMos(avgRtt);
                    document.getElementById('mos').innerHTML = _this.calculateMos(avgRtt).toString();
                    document.getElementById('mos-progress').style.width = _this.calculateMos(avgRtt).toString + '0%';
                }
            }
        }

        //Zamiena bajty na łatwe do odczytania wartości
        this.bytesToSize = function (bytes) {
            var k = 1000;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes <= 0) {
                return '0 Bytes';
            }
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);

            if (!sizes[i]) {
                return '0 Bytes';
            }

            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
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
            sessionWindow.green = node.querySelector('.green');
            sessionWindow.red = node.querySelector('.red');
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

            // Ustawienie listenerów na przyciski w oknie rozmowy
            sessionWindow.green.addEventListener('click', function () {
                var video = elements.uaVideo.checked;
                var options = {
                    media: {
                        constraints: {
                            audio: true,
                            video: true
                        }
                    }
                };

                var session = sessionWindow.session;
                if (!session) {
                    session = sessionWindow.session = ua.invite(uri, options);

                    setUpListeners(session);
                } else if (session.accept && !session.startTime) { // W przypadku gdy połączenie nadchodzi ale nie zaczęło się sesji
                    session.accept(options);

                }
            }, false);

            sessionWindow.red.addEventListener('click', function () {
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
                sessionWindow.green.disabled = true;
                sessionWindow.green.innerHTML = '...';
                sessionWindow.red.innerHTML = 'Anuluj';
            } else if (!session) {
                sessionWindow.red.disabled = true;
                sessionWindow.green.innerHTML = 'Zadzwoń';
                sessionWindow.red.innerHTML = '...';
            } else {
                sessionWindow.green.innerHTML = 'Odbierz';
                sessionWindow.red.innerHTML = 'Odrzuć';
            }
            sessionWindow.dtmfInput.disabled = true;


            function setUpListeners(session) {
                sessionWindow.red.disabled = false;

                if (session.accept) {
                    sessionWindow.green.disabled = false;
                    sessionWindow.green.innerHTML = 'Odbierz';
                    sessionWindow.red.innerHTML = 'Odrzuć';
                } else {
                    sessionWindow.green.innerHMTL = '...';
                    sessionWindow.red.innerHTML = 'Anuluj';
                }

                session.on('accepted', function () {
                    sessionWindow.green.disabled = true;
                    sessionWindow.green.innerHTML = '...';
                    sessionWindow.red.innerHTML = 'Koniec';
                    sessionWindow.dtmfInput.disabled = false;
                    sessionWindow.video.className = 'on';

                    session.mediaHandler.render(sessionWindow.renderHint);

                    console.log(session, 'session.mediaHandler. SESJA');

                    //Pobieranie statystyk połączenia i wyświetlenie ich
                    getStats(session.mediaHandler.peerConnection, function (result) {
                        _this.showStatistic(result);
                        _this.updateChart(null, result.bandwidth.speed);
                    }, 1000);


                });

                session.mediaHandler.on('addStream', function () {
                    session.mediaHandler.render(sessionWindow.renderHint);
                });

                session.on('bye', function () {
                    getStats.nomore();

                    sessionWindow.green.disabled = false;
                    sessionWindow.red.disabled = true;
                    sessionWindow.dtmfInput.disable = true;
                    sessionWindow.green.innerHTML = 'Zadzwoń';
                    sessionWindow.red.innerHTML = '...';
                    sessionWindow.video.className.remove = 'on';
                    delete sessionWindow.session;
                });

                session.on('failed', function () {
                    window.getStats.nomore();

                    sessionWindow.green.disabled = false;
                    sessionWindow.red.disabled = true;
                    sessionWindow.dtmfInput.disable = true;
                    sessionWindow.green.innerHTML = 'Zadzwoń';
                    sessionWindow.red.innerHTML = '...';
                    sessionWindow.video.className = '';
                    sessionWindow.video.className.remove = 'on';
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
                    messageNode.innerHTML = '<div class="direct-chat-info clearfix"><span class="direct-chat-name pull-right display-name"></span><span class="direct-chat-timestamp pull-left uri"> ' + n + ' </span> </div><img class="direct-chat-img" src="/img/user3-128x128.jpg" alt="message user image"> <div class="direct-chat-text"> ' + body + '</div>';
                } else {
                    messageNode.className = 'direct-chat-msg';
                    messageNode.innerHTML = '  <div class="direct-chat-info clearfix"> <span class="direct-chat-name pull-left display-name">Ja</span> <span class="direct-chat-timestamp pull-right"> ' + n + ' </span></div><img class="direct-chat-img" src="/img/user1-128x128.jpg" alt="message user image"><div class="direct-chat-text">' + body + ' </div>';
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
