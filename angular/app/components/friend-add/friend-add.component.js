class FriendAddController {
  constructor (API, $state, $stateParams) {
    'ngInject'

    this.$state = $state
    this.formSubmitted = false
    this.API = API
    this.alerts = []

    if ($stateParams.alerts) {
      this.alerts.push($stateParams.alerts)
    }
  }

  save (isValid) {
    this.$state.go(this.$state.current, {}, { alerts: 'test' })
    if (isValid) {
      let Contact = this.API.service('contacts', this.API.all('contacts'))
      let $state = this.$state

      Contact.post({
        'name': this.name,
        'sip_address': this.sip_address,
      }).then(function () {
        let alert = { type: 'success', 'title': 'Udało się!', msg: 'Znajomy został dodany.' }
        $state.go($state.current, { alerts: alert})
      }, function (response) {
        let alert = { type: 'error', 'title': 'Błąd!', msg: response.data.message }
        $state.go($state.current, { alerts: alert})
      })
    } else {
      this.formSubmitted = true
    }
  }

  $onInit () {}
}

export const FriendAddComponent = {
  templateUrl: './views/app/components/friend-add/friend-add.component.html',
  controller: FriendAddController,
  controllerAs: 'vm',
  bindings: {}
}
