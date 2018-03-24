<?php

use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('users')->insert([
            'id' => 1,
            'name' => 'admin',
            'sip_uri' => 'sip:testuser@192.168.0.17',
            'sip_login' => 'testuser',
            'sip_password' => '7770751389206',
            'sip_ws' => 'ws://192.168.0.17:80/mfstwebsock',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'email_verified' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
        ]);
    }
}
