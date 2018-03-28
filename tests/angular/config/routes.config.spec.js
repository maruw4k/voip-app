ngDescribe({
  name: 'Test routes configuration',
  inject: ['$location', '$state'],
  modules: 'app',
  tests: function (deps) {
    function goTo (url) {
      deps.$location.path(url)
      deps.$rootScope.$digest()
    }
    describe('path', function () {

      describe('when /login', function () {
        it('should go to the login state', function () {
          goTo('/login')
          expect(deps.$state.$current.name).toEqual('login')
        })
      })

      describe('when /register', function () {
        it('should go to the register state', function () {
          goTo('/register')
          expect(deps.$state.$current.name).toEqual('register')
        })
      })
    })
  }
})
