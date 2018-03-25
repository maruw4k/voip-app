class DashboardController {
    constructor($scope, API) {
        'ngInject'

        this.API = API;
        var _this = this;
        var dataSet;
        window.$scope = $scope;

        this.info = {
            status: 'Łączenie',
            textBtn: 'Zarejestruj',
            bandwith: '(brak aktywnego połączenia)',
            mos: '(brak aktywnego połączenia)',
        };

        $scope.mos = 'niema';
        var ua;

        let sipConfig = {
            traceSip: true,
            register: false
        };

        var elements = {
            newSessionForm: document.getElementById('newConnectForm'),
            inviteButton: document.getElementById('inviteBtn'),
            messageButton: document.getElementById('chatBtn'),
            uaVideo: document.getElementById('videoChkBox'),
            uaURI: document.getElementById('addressUriInput'),
            sessionList: document.getElementById('chatList'),
            sessionTemplate: document.getElementById('session-template'),
            messageTemplate: document.getElementById('message-template')
        };

        var sessionUIs = {};

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

                ua.on('connected', function () {
                    console.log('Connected');
                    _this.info.status = 'Połączony';
                });

                ua.on('registered', function () {
                    // var subscription = ua.subscribe('sip:1111@192.168.0.17', 'presence');
                    console.log('registered');
                    _this.info.status = 'Zarejestrowany';

                });

                ua.on('invite', function (session) {
                    _this.info.status = 'Coś przychodzi';
                    createNewSessionUI(session.remoteIdentity.uri, session);
                });

                ua.on('message', function (message) {
                    if (!sessionUIs[message.remoteIdentity.uri]) {
                        createNewSessionUI(message.remoteIdentity.uri, null, message);
                    }
                });
            });

        //Pobranie listy znajomych i ustawienie tej wartości na inpucie
        let Friends = this.API.all('contacts');
        Friends.getList()
            .then((response) => {
                _this.dataSet = response.plain()
            });



        //Funkcja do przekzywania adresu sip do panelu telefonu
        this.clickContact = function (contact) {
            elements.uaURI.value = contact;

            console.log(elements.uaVideo.checked);
            console.log(elements.uaURI.value);
        };


        //Logowanie/wylogowanie z serwera SIP
        $scope.registerSIP = function () {
            if (!ua) return;
            if (ua.isRegistered()) {
                _this.info.textBtn = 'Zarejestruj';
                ua.unregister();
                _this.info.status = 'Wylogowano';
                console.log('Wylogowano');
            } else {
                _this.info.textBtn = 'Wyloguj';
                ua.register();
                _this.info.status = 'Zarejestrowano';
                console.log('Zarejestrowano');
            }
        };

        //Wysyłanie zaproszenia
        this.inviteBtnClick = function () {
            console.log('Wysyłanie zaproszenia');

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
            var ui = createNewSessionUI(uri, session);
            console.log(ui, 'UI dupa');
            console.log(session, 'session dupa');

        }


        //Funkcja otwierająca nowe okno wiadomości
        this.messageBtnClick = function () {
            console.log('Wysyłanie wiadomości');
            var uri = elements.uaURI.value;
            elements.uaURI.value = '';
            var ui = createNewSessionUI(uri);
        }




        //Funkcja otwierająca nowe okno wiadomości
        this.showStatistic = function () {

            _this.info.bandwith = 'ELO';
        }



        //Tworzenie GUI okienka rozmowy
        function createNewSessionUI(uri, session, message) {
            var tpl = elements.sessionTemplate;
            var node = tpl.cloneNode(true);
            var sessionUI = {};
            var messageNode;

            uri = session ?
                session.remoteIdentity.uri :
                SIP.Utils.normalizeTarget(uri, ua.configuration.hostport_params);
            var displayName = (session && session.remoteIdentity.displayName) || uri.user;

            if (!uri) {
                return;
            }

            // Zapisywanie danych do obiektu sessionUI by mieć późniejszy dostęp
            sessionUI.session = session;
            sessionUI.node = node;
            sessionUI.displayName = node.querySelector('.display-name');
            sessionUI.uri = node.querySelector('.uri');
            sessionUI.green = node.querySelector('.green');
            sessionUI.red = node.querySelector('.red');
            sessionUI.dtmf = node.querySelector('.dtmf');
            sessionUI.dtmfInput = node.querySelector('.dtmf input[type="text"]');
            sessionUI.video = node.querySelector('video');
            sessionUI.messages = node.querySelector('.messages');
            sessionUI.messageForm = node.querySelector('.messageForm');
            sessionUI.messageInput = node.querySelector('.messageForm input[type="text"]');
            sessionUI.renderHint = {
                remote: sessionUI.video
            };

            sessionUIs[uri] = sessionUI;

            // Aktualizacja szablonu
            node.classList.remove('template');
            sessionUI.displayName.textContent = displayName || uri.user;
            sessionUI.uri.textContent = '(' + uri + ')';

            // DOM event listeners
            sessionUI.green.addEventListener('click', function () {
                var video = elements.uaVideo.checked;
                var options = {
                    media: {
                        constraints: {
                            audio: true,
                            video: true
                        }
                    }
                };

                var session = sessionUI.session;
                if (!session) {
                    /* TODO - Invite new session */
                    /* Don't forget to enable buttons */
                    session = sessionUI.session = ua.invite(uri, options);

                    setUpListeners(session);
                } else if (session.accept && !session.startTime) { // Incoming, not connected
                    session.accept(options);

                    console.log(session, 'SESJA');

                    setInterval(function () {

                        console.log(session, 'SESJA po 333333333333333333333');







                    }, 5000);
                }
            }, false);

            sessionUI.red.addEventListener('click', function () {
                var session = sessionUI.session;
                if (!session) {
                    return;
                } else if (session.startTime) { // Connected
                    session.bye();
                } else if (session.reject) { // Incoming
                    session.reject();
                } else if (session.cancel) { // Outbound
                    session.cancel();
                }
            }, false);

            sessionUI.dtmf.addEventListener('submit', function (e) {
                e.preventDefault();

                var value = sessionUI.dtmfInput.value;
                if (value === '' || !session) return;

                sessionUI.dtmfInput.value = '';

                if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].indexOf(value) > -1) {
                    session.dtmf(value);
                }
            });

            // Initial DOM state
            if (session && !session.accept) {
                sessionUI.green.disabled = true;
                sessionUI.green.innerHTML = '...';
                sessionUI.red.innerHTML = 'Anuluj';
            } else if (!session) {
                sessionUI.red.disabled = true;
                sessionUI.green.innerHTML = 'Zadzwoń';
                sessionUI.red.innerHTML = '...';
            } else {
                sessionUI.green.innerHTML = 'Odbierz';
                sessionUI.red.innerHTML = 'Odrzuć';
            }
            sessionUI.dtmfInput.disabled = true;

            // SIP.js event listeners
            function setUpListeners(session) {
                sessionUI.red.disabled = false;

                if (session.accept) {
                    sessionUI.green.disabled = false;
                    sessionUI.green.innerHTML = 'Odbierz';
                    sessionUI.red.innerHTML = 'Odrzuć';
                } else {
                    sessionUI.green.innerHMTL = '...';
                    sessionUI.red.innerHTML = 'Anuluj';
                }

                session.on('accepted', function () {
                    sessionUI.green.disabled = true;
                    sessionUI.green.innerHTML = '...';
                    sessionUI.red.innerHTML = 'Koniec';
                    sessionUI.dtmfInput.disabled = false;

                    session.mediaHandler.render(sessionUI.renderHint);

                    console.log(session, 'session.mediaHandler. SESJA');


                    var rttMeasures = [];


                    console.log(session.mediaHandler.peerConnection, 'SESJA po 323423');

                    getStats(session.mediaHandler.peerConnection, function (result) {
                        console.log('rezultat', result);
                        document.getElementById('bandwith').innerHTML = bytesToSize(result.bandwidth.speed);
                        document.getElementById('codecsSend').innerHTML = result.audio.send.codecs.concat(result.video.send.codecs).join(', ');
                        document.getElementById('codecsRecv').innerHTML = result.audio.recv.codecs.concat(result.video.recv.codecs).join(', ');
                        document.getElementById('encryption').innerHTML = result.encryption;
                        document.getElementById('resolutionSend').innerHTML = result.resolutions.send.width + 'x' + result.resolutions.send.height;
                        document.getElementById('resolutionRecv').innerHTML = result.resolutions.recv.width + 'x' + result.resolutions.recv.height;
                        document.getElementById('sendDate').innerHTML = bytesToSize(result.audio.bytesSent + result.video.bytesSent);
                        document.getElementById('recDate').innerHTML = bytesToSize(result.audio.bytesReceived + result.video.bytesReceived);

                        for (var i in result.results) {
                            var now = result.results[i];

                            if (now.type == 'googCandidatePair') {
                                // console.log('now',now);
                                console.log('now.googRtt', now.googRtt);
                                rttMeasures.push(now.googRtt);
                                var avgRtt = average(rttMeasures);
                                console.log('avgrtt', avgRtt);

                                if (avgRtt === null) {
                                    avgRtt = 0;
                                }

                                var emodel = 0;
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

                                document.getElementById('mos').innerHTML = emodel.toString();
                                document.getElementById('mos-progress').style.width = emodel.toString() + '0%';
                            }
                        }
                    }, 1000);

                    function average(values) {
                        var sumValues = values.reduce(function (sum, value) {
                            return sum + value;
                        }, 0);
                        return (sumValues / values.length);
                    }

                    function bytesToSize(bytes) {
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

                });

                session.mediaHandler.on('addStream', function () {
                    session.mediaHandler.render(sessionUI.renderHint);
                });

                session.on('bye', function () {
                    sessionUI.green.disabled = false;
                    sessionUI.red.disabled = true;
                    sessionUI.dtmfInput.disable = true;
                    sessionUI.green.innerHTML = 'Zadzwoń';
                    sessionUI.red.innerHTML = '...';
                    delete sessionUI.session;
                });

                session.on('failed', function () {
                    sessionUI.green.disabled = false;
                    sessionUI.red.disabled = true;
                    sessionUI.dtmfInput.disable = true;
                    sessionUI.green.innerHTML = 'Zadzwoń';
                    sessionUI.red.innerHTML = '...';
                    delete sessionUI.session;
                });

                session.on('refer', function handleRefer(request) {
                    var target = request.parseHeader('refer-to').uri;
                    session.bye();

                    createNewSessionUI(target, ua.invite(target, {
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



            // Wstawianie pojedyńczej wiadomości do konwersacji
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
                sessionUI.messages.appendChild(messageNode);
                sessionUI.messages.scrollTop = sessionUI.messages.scrollHeight;
            }

            if (message) {
                appendMessage(message.body, 'friend');
            }

            ua.on('message', function (message) {
                appendMessage(message.body, 'friend');
            });


            //Wysłanie wiadomości na czacie
            sessionUI.messageForm.addEventListener('submit', function (e) {
                e.preventDefault();

                var body = sessionUI.messageInput.value;
                sessionUI.messageInput.value = '';

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
