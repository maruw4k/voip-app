class DashboardController {
  constructor ($scope) {
    'ngInject'


    var _this = this;
    this.info = {
      status: 'Łączenie',
      textBtn: 'Zarejestruj'
    }


    $scope.onClick = function () {
      alert('Dupa')
    }


    var ua = new SIP.UA({
      uri: 'sip:testuser@192.168.0.17',
      wsServers: ['ws://192.168.0.17:80/mfstwebsock'],
      authorizationUser: 'testuser',
      password: '7770751389206',
      traceSip: true,
      register: false,
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

//Dzwonienie
$scope.call = function () {
    $scope.status_info = 'Dzwonienie';
    simple.call('marek@wwsi.onsip.com');
    // simple.call('recipientUri.value');
}


//Zakończenie połączenia
// endButton.addEventListener("click", function (e) {
//     $scope.status_info = 'Zakończono';
//     simple.hangup();
// }, false);


  }
}

export const DashboardComponent = {
  templateUrl: './views/app/components/dashboard/dashboard.component.html',
  controller: DashboardController,
  controllerAs: 'vm',
  bindings: {}
}
