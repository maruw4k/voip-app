ngDescribe({
    //Nazwa testu
    name: 'Test dla komponentu user-edit',
    //Jaki moduł aplikacji
    modules: 'app',
    //Który element będzie testowany
    element: '<user-edit></user-edit>',
    //Wyślij żądanie get i sprawdź czy zwraca dane
    http: {
        get: {
          '/api/users/roles': {
            data: true
          },
            '/api/users/show': {
                data: true
            }
        }
    },
    tests: function (deps) {
        //Co winien zawierać
        it('Powinien zawierać inputy: name, email', () => {

            //Wyszukaj elementy input
            var inputs = deps.element.find('input')
            //Oczekiwane są 2 elementy input
            expect(inputs.length).toBe(2)

            //Znajdź element input
            var name = deps.element.find('input')[0]
            //Powinien być typu text
            expect(name.attributes['type'].value).toBe('text')

            //Znajdź element email
            var email = deps.element.find('input')[1]
            //Powinien być typu email
            expect(email.attributes['type'].value).toBe('email')
        })
    }
})
