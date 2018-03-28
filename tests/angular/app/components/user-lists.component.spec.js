ngDescribe({
  name: 'Test dla komponentu user-lists',
  modules: 'app',
  element: '<user-lists></user-lists>',
  http: {
    get: {
      '/api/users': {
        data: true
      }
    }
  },
  tests: function (deps) {
    it('delete jest funkcją', () => {
      var component = deps.element.isolateScope().vm
      la(typeof component.delete === 'function')
    })
  }
})
