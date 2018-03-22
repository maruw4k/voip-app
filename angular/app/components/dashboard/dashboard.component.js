class DashboardController {
    constructor($scope) {
        'ngInject'


        window.$scope = $scope;
        var _this = this;
        this.info = {
            status: 'Łączenie',
            textBtn: 'Zarejestruj'
        }

        var elements = {
            newSessionForm: document.getElementById('newConnectForm'),
            inviteButton: document.getElementById('inviteBtn'),
            messageButton: document.getElementById('chatBtn'),
            uaURI: document.getElementById('addressUriInput'),
            sessionList: document.getElementById('chatList'),
            sessionTemplate: document.getElementById('session-template'),
            messageTemplate: document.getElementById('message-template')
        };

        var sessionUIs = {};




        $scope.onClick = function () {
            alert('Dupa')
        }


        var ua = new SIP.UA({
            uri: 'sip:testuser@192.168.0.17',
            wsServers: ['ws://192.168.0.17:80/mfstwebsock'],
            authorizationUser: 'testuser',
            password: '7770751389206',
            traceSip: true,
            register: true,
            stunServers: [
                "stun.l.google.com:19302",
                "stun.stunprotocol.org:3478",
                "stun.voiparound.com",
                "stun.voipbuster.com",
                "stun.turnservers.com:3478"
            ],
        });



        ua.on('connected', function () {
            console.log('Connected');
            _this.info.status = 'Połączony';
        });

        ua.on('registered', function () {
            var subscription = ua.subscribe('sip:1111@192.168.0.17', 'presence');
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


        $scope.registerSIP = function () {
            console.log('METODAAAAAAAAAAAAAA');
            if (!ua) return;

            if (ua.isRegistered()) {
                _this.info.textBtn = 'Zarejestruj';
                ua.unregister();
                _this.info.status = 'Wylogowano';
            } else {
                _this.info.textBtn = 'Wyloguj';
                ua.register();
                _this.info.status = 'Zarejestrowano';
            }
        }

        // obiekt konfiguracyjny
        // this.options = {
        //     media: {
        //         local: {
        //             video: document.getElementById('localVideo')
        //         },
        //         remote: {
        //             video: document.getElementById('remoteVideo'),
        //             // This is necessary to do an audio/video call as opposed to just a video call
        //             audio: document.getElementById('remoteVideo')
        //         }
        //     },
        //     ua: {}
        // };

        // // Tworzenie pojedyńczej instancji   
        // this.simple = new SIP.WebRTC.Simple(this.options);

        // //Dzwonienie
        // $scope.call = function () {
        //     _this.info.status = 'Dzwonienie';
        //     _this.simple.call('marek@192.168.0.17');
        // }


        //Wysyłanie zaproszenia
        function inviteSubmit(e) {
            console.log('Zaproszenia!!!!!!');
            e.preventDefault();
            e.stopPropagation();

            console.log('Zaproszenia!!!!!!');

            // Parse config options
            // var videoConfig = video.checked;
            // console.log('Zaproszenia!!!!!!', video.checked);
            // var uri = recipientUri.value;
            // recipientUri.value = '';

            var video = true;
            var uri = 'sip:marek@192.168.0.17';

            if (!uri) return;

            // Wysyłanie zaproszenia
            var session = ua.invite(uri, {
                media: {
                    constraints: {
                        audio: true,
                        video: true
                    },
                    //         local: {
                    //             video: document.getElementById('localVideo')
                    //         },
                    //         remote: {
                    //             video: document.getElementById('remoteVideo'),
                    //             // This is necessary to do an audio/video call as opposed to just a video call
                    //             audio: document.getElementById('remoteVideo')
                }
            });

            var ui = createNewSessionUI(uri, session);
        }


        elements.inviteButton.addEventListener('click', inviteSubmit, false);
        elements.newSessionForm.addEventListener('submit', inviteSubmit, false);


        elements.messageButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Create new Session and append it to list
            // var uri = recipientUri.value;
            var uri = elements.uaURI.value;
            elements.uaURI.value = '';
            var ui = createNewSessionUI(uri);
        }, false);




        //Tworzenie GUI okienka rozmowy
        function createNewSessionUI(uri, session, message) {
            var tpl = elements.sessionTemplate;
            var node = tpl.cloneNode(true);
            var sessionUI = {};
            var messageNode;

            uri = session ?
                session.remoteIdentity.uri :
                SIP.Utils.normalizeTarget(uri, ua.configuration.hostport_params);
            // var displayName = (session && session.remoteIdentity.displayName) || uri.user;
            var displayName = (session && session.remoteIdentity.displayName) || 'użytkownik';

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
            // sessionUI.displayName.textContent = displayName || uri.user;
            // sessionUI.uri.textContent = '<' + uri + '>';
            // sessionUI.displayName.textContent = 'Ja';
            // sessionUI.uri.textContent = 'Ja@sip';

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
                sessionUI.red.innerHTML = 'Cancel';
            } else if (!session) {
                sessionUI.red.disabled = true;
                sessionUI.green.innerHTML = 'Invite';
                sessionUI.red.innerHTML = '...';
            } else {
                sessionUI.green.innerHTML = 'Accept';
                sessionUI.red.innerHTML = 'Reject';
            }
            sessionUI.dtmfInput.disabled = true;

            // SIP.js event listeners
            function setUpListeners(session) {
                sessionUI.red.disabled = false;

                if (session.accept) {
                    sessionUI.green.disabled = false;
                    sessionUI.green.innerHTML = 'Accept';
                    sessionUI.red.innerHTML = 'Reject';
                } else {
                    sessionUI.green.innerHMTL = '...';
                    sessionUI.red.innerHTML = 'Cancel';
                }

                session.on('accepted', function () {
                    sessionUI.green.disabled = true;
                    sessionUI.green.innerHTML = '...';
                    sessionUI.red.innerHTML = 'Bye';
                    sessionUI.dtmfInput.disabled = false;
                    sessionUI.video.className = 'on';

                    session.mediaHandler.render(sessionUI.renderHint);
                });

                session.mediaHandler.on('addStream', function () {
                    session.mediaHandler.render(sessionUI.renderHint);
                });

                session.on('bye', function () {
                    sessionUI.green.disabled = false;
                    sessionUI.red.disabled = true;
                    sessionUI.dtmfInput.disable = true;
                    sessionUI.green.innerHTML = 'Invite';
                    sessionUI.red.innerHTML = '...';
                    sessionUI.video.className = '';
                    delete sessionUI.session;
                });

                session.on('failed', function () {
                    sessionUI.green.disabled = false;
                    sessionUI.red.disabled = true;
                    sessionUI.dtmfInput.disable = true;
                    sessionUI.green.innerHTML = 'Invite';
                    sessionUI.red.innerHTML = '...';
                    sessionUI.video.className = '';
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

                console.log(body, 'BODY');

                messageNode.textContent = body;
                //Zależnie od kogo jest wiadomość, to inny widok tekstu z wiadomością
                if (sender === 'friend') {
                    messageNode.className = 'direct-chat-msg right';
                    messageNode.innerHTML = '<div class="direct-chat-info clearfix"><span class="direct-chat-name pull-right display-name"></span><span class="direct-chat-timestamp pull-left uri"> '+ n +' </span> </div><img class="direct-chat-img" src="/img/user3-128x128.jpg" alt="message user image"> <div class="direct-chat-text"> ' + body + '</div>';
                } else {
                    messageNode.className = 'direct-chat-msg';
                    messageNode.innerHTML = '  <div class="direct-chat-info clearfix"> <span class="direct-chat-name pull-left">Ja</span> <span class="direct-chat-timestamp pull-right"> '+ n +' </span></div><img class="direct-chat-img" src="/img/user1-128x128.jpg" alt="message user image"><div class="direct-chat-text">' + body + ' </div>';
                }
                sessionUI.messages.appendChild(messageNode);
                sessionUI.messages.scrollTop = sessionUI.messages.scrollHeight;
            }

            if (message) {
                appendMessage(message.body, 'friend');
            }

            ua.on('message', function (message) {
                if (message.remoteIdentity.uri !== uri) {
                    console.warn('unmatched message: ', message.remoteIdentity.uri, uri);
                }

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
