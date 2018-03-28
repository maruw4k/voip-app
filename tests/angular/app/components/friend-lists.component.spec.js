ngDescribe({
  name: 'Test dla komponentu friend-lists',
  modules: 'app',
  element: '<friend-lists></friend-lists>',
  http: {
    get: {
      '/api/contacts': {
        data: true
      }
    }
  },
  tests: function (deps) {
    it('Jest funkcja usuwania', () => {
      var component = deps.element.isolateScope().vm
      la(typeof component.delete === 'function')
    })
  }
})
