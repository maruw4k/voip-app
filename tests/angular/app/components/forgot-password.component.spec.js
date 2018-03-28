ngDescribe({
  name: 'Test dla komponentu forgot-password',
  modules: 'app',
  inject: '$http',
  element: '<forgot-password></forgot-password>',
  http: {
    post: {
      '/api/auth/password/email': {
        data: true
      }
    }
  },
  tests: function (deps) {
    it('Powinien zawierać: email', () => {
      var inputs = deps.element.find('input')
      expect(inputs.length).toBe(1)

      var email = deps.element.find('input')[0]
      expect(email.attributes['type'].value).toBe('email')
    })

    it('Powinien popranie wysłać e-maila', () => {
      var component = deps.element.isolateScope().vm

      component.email = 'email@localhost.com'
      component.submit()

      deps.http.flush()
    })
  }
})
