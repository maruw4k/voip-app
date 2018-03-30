ngDescribe({
    name: 'Test konfiguracji routingu',
    //Wstrzyknij zależności dotyczące ścieżki i stanu
    inject: ['$location', '$state'],
    //Jaki moduł aplikacji
    modules: 'app',
    tests: function (deps) {
        function goTo(url) {
            deps.$location.path(url)
            deps.$rootScope.$digest()
        }
        describe('path', function () {

            //Sprawdza czy kiedy wejdziemy pod adres /login, to czy obecny stan będzie dotyczył się logowania
            describe('kiedy /login', function () {
                it('Powinien być stan logowania', function () {
                    goTo('/login')
                    expect(deps.$state.$current.name).toEqual('login')
                })
            })

            //Sprawdza czy kiedy wejdziemy pod adres /register, to czy obecny stan będzie dotyczył się rejestracji
            describe('kiedy /register', function () {
                it('Powinien być stan rejestracji', function () {
                    goTo('/register')
                    expect(deps.$state.$current.name).toEqual('register')
                })
            })
        })
    }
})
