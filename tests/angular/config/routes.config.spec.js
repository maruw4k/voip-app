ngDescribe({
  name: 'Test konfiguracji routingu',
  inject: ['$location', '$state'],
  modules: 'app',
  tests: function (deps) {
    function goTo (url) {
      deps.$location.path(url)
      deps.$rootScope.$digest()
    }
    describe('path', function () {

      describe('kiedy /login', function () {
        it('Powinien być stan logowania', function () {
          goTo('/login')
          expect(deps.$state.$current.name).toEqual('login')
        })
      })

      describe('kiedy /register', function () {
        it('Powinien być stan rejestracji', function () {
          goTo('/register')
          expect(deps.$state.$current.name).toEqual('register')
        })
      })
    })
  }
})
