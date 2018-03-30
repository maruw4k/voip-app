<?php

use Illuminate\Foundation\Testing\DatabaseTransactions;

class JwtAuthTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test pomyślnego logowania z pomocą JWT
     */
    public function testPomyslneLogowanie()
    {
        $user = factory(App\User::class)->create([
            'password' => bcrypt('test12345'),
            'email_verified' => '1',
        ]);

        $this->post('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'test12345',
        ])
        ->seeApiSuccess()
        ->seeJsonKeyValueString('email', $user->email)
        ->seeJsonKey('token')
        ->dontSee('"password"');
    }

    /**
     * Test nieudanego logowania z pomocą JWT
     */
    public function testNieudaneLogowanie()
    {
        $user = factory(App\User::class)->create([
            'email_verified' => '1',
        ]);

        $this->post('/api/auth/login', [
            'email'    => $user->email,
            'password' => str_random(10),
        ])
        ->seeApiError(401)
        ->dontSee($user->email)
        ->dontSee('"token"');
    }

    /**
     * Test pomyślnej rejestracji
     */
    public function testPomyslnaRejestracja()
    {
        $user = factory(App\User::class)->make();

        $this->post('/api/auth/register', [
            'name'                  => $user->name,
            'email'                 => $user->email,
            'password'              => 'test15125',
            'password_confirmation' => 'test15125',
            'email_verified'        => '1',
        ])
        ->seeApiSuccess()
        ->seeJsonKeyValueString('email', $user->email)
        ->seeJsonKey('token');
    }
}
