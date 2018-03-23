class FriendListsController {
  constructor ($scope, $state, $compile, DTOptionsBuilder, DTColumnBuilder, API) {
    'ngInject'
    this.API = API
    this.$state = $state
    //Do debugowania
    window.$scope = $scope;

    let Friends = this.API.all('contacts')

    Friends.getList()
      .then((response) => {
        let dataSet = response.plain()

        this.dtOptions = DTOptionsBuilder.newOptions()
          .withOption('data', dataSet)
          .withOption('createdRow', createdRow)
          .withOption('responsive', true)
          .withBootstrap()

        this.dtColumns = [
          DTColumnBuilder.newColumn('id').withTitle('ID'),
          DTColumnBuilder.newColumn('name').withTitle('Nazwa'),
          DTColumnBuilder.newColumn('sip_address').withTitle('Adres SIP'),
          DTColumnBuilder.newColumn(null).withTitle('Actions').notSortable()
            .renderWith(actionsHtml)
        ]

        this.displayTable = true
      })

    let createdRow = (row) => {
      $compile(angular.element(row).contents())($scope)
    }

    let actionsHtml = (data) => {
      return `
                <a class="btn btn-xs btn-warning" ui-sref="app.useredit({userId: ${data.id}})">
                    <i class="fa fa-edit"></i>
                </a>
                &nbsp
                <button class="btn btn-xs btn-danger" ng-click="vm.delete(${data.id})">
                    <i class="fa fa-trash-o"></i>
                </button>`
    }
  }

  delete (contactId) {
    let API = this.API
    let $state = this.$state

    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover this data!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      closeOnConfirm: false,
      showLoaderOnConfirm: true,
      html: false
    }, function () {
      API.one('contacts').one('contact', contactId).remove()
        .then(() => {
          swal({
            title: 'Deleted!',
            text: 'User Permission has been deleted.',
            type: 'success',
            confirmButtonText: 'OK',
            closeOnConfirm: true
          }, function () {
            $state.reload()
          })
        })
    })
  }

  $onInit () {}
}

export const FriendListsComponent = {
  templateUrl: './views/app/components/friend-lists/friend-lists.component.html',
  controller: FriendListsController,
  controllerAs: 'vm',
  bindings: {}
}
