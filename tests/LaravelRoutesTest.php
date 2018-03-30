<?php


class LaravelRoutesTest extends TestCase
{
    /**
     * A basic functional test example.
     *
     * @return void
     */
    public function testSprawdzenieDocelowejStrony()
    {
        $response = $this->call('GET', '/');

        $this->assertEquals(200, $response->status());
    }

    public function testSprawdzenieNiewspieranychPrzegladarek()
    {
        $this->visit('/unsupported-browser')
             ->see('update your browser')
             ->see('Internet Explorer');
    }
}
