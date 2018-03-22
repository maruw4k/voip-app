class DashboardController {
  constructor ($scope) {
    'ngInject'


    $scope.onClick = function () {
      alert('Dupa')
    }


    var ua = new SIP.UA({
      uri: 'sip:testuser@192.168.43.21',
      wsServers: ['ws://192.168.43.21:80/mfstwebsock'],
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

  });

  ua.on('registered', function () {
    var subscription = ua.subscribe('sip:1111@192.168.43.21', 'presence');


      console.log('registered');

  });

  }
}

export const DashboardComponent = {
  templateUrl: './views/app/components/dashboard/dashboard.component.html',
  controller: DashboardController,
  controllerAs: 'vm',
  bindings: {}
}
