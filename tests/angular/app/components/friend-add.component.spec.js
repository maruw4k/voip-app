ngDescribe({
  name: 'Test dla komponentu friend-add',
  modules: 'app',
  element: '<friend-add></friend-add>',
  tests: function (deps) {
    it('Powinien zawierać inputy: name, sip_address ', () => {
      var inputs = deps.element.find('input')
      expect(inputs.length).toBe(2)

      var name = deps.element.find('input')[0]
      expect(name.attributes['type'].value).toBe('text')

      var sip_address = deps.element.find('input')[1]
      expect(sip_address.attributes['type'].value).toBe('text')

    })
  }
})
