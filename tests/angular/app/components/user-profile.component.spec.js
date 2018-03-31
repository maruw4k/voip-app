ngDescribe({
    //Nazwa testu
    name: 'Test dla komponentu user-profile',
    modules: 'app',
    //Jaki moduł aplikacji
    element: '<user-profile></user-profile>',
    http: {
        //Wyślij żądanie get i sprawdź czy zwraca dane
        get: {
            '/api/users/me': {
                data: true
            }
        }
    },
    tests: function (deps) {
        //Co powinien zawierać
        it('Powinien zawierać inputy: name, email, passwords, sip_uri, sip_login, sip_password, sip_ws, sip_stun, sip_turn', () => {
            //Wyszukaj elementy input, oczekiwana liczba to 11
            var inputs = deps.element.find('input')
            //Powinno być ich 11, wtedy test zostanie zaliczony
            expect(inputs.length).toBe(11)

            //Pierwszy element inputów powinien być typu tekst
            var name = deps.element.find('input')[0]
            expect(name.attributes['type'].value).toBe('text')

            var email = deps.element.find('input')[1]
            expect(email.attributes['type'].value).toBe('email')

            var passsword = deps.element.find('input')[2]
            expect(passsword.attributes['type'].value).toBe('password')

            var passsword_confirmation = deps.element.find('input')[3]
            expect(passsword_confirmation.attributes['type'].value).toBe('password')

            var new_passsword = deps.element.find('input')[4]
            expect(new_passsword.attributes['type'].value).toBe('password')

            var sip_uri = deps.element.find('input')[5]
            expect(sip_uri.attributes['type'].value).toBe('text')

            var sip_login = deps.element.find('input')[6]
            expect(sip_login.attributes['type'].value).toBe('text')

            var sip_password = deps.element.find('input')[7]
            expect(sip_password.attributes['type'].value).toBe('password')

            var sip_ws = deps.element.find('input')[8]
            expect(sip_ws.attributes['type'].value).toBe('text')

            var sip_stun = deps.element.find('input')[9]
            expect(sip_stun.attributes['type'].value).toBe('text')

            var sip_turn = deps.element.find('input')[10]
            expect(sip_turn.attributes['type'].value).toBe('text')

        })
    }
})
