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
            'sip_uri' => 'sip:marek@wwsi.onsip.com',
            'sip_login' => 'wwsi_marek',
            'sip_password' => 'jFY5tzYAA5cL5VcR',
            'sip_ws' => 'wss://edge.sip.onsip.com',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'email_verified' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
        ]);

        DB::table('users')->insert([
            'id' => 2,
            'name' => 'test',
            'sip_uri' => 'sip:maruw4k@wwsi.onsip.com',
            'sip_login' => 'testuser',
            'sip_password' => 'AKTigEPQ3YNimBj4',
            'sip_ws' => 'wss://edge.sip.onsip.com',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'email_verified' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
        ]);

        DB::table('users')->insert([
            'id' => 3,
            'name' => 'testowe',
            'sip_uri' => 'sip:testuser@192.168.0.73',
            'sip_login' => 'testuser',
            'sip_password' => 'krzeszowiec1',
            'sip_ws' => 'ws://192.168.0.73:80/mfstwebsock',
            'email' => 'testowe@example.com',
            'password' => bcrypt('password'),
            'email_verified' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
        ]);

        DB::table('users')->insert([
            'id' => 4,
            'name' => 'testowe2',
            'sip_uri' => 'sip:testuser2@192.168.0.73',
            'sip_login' => 'testuser2',
            'sip_password' => 'krzeszowiec1',
            'sip_ws' => 'ws://192.168.0.73:80/mfstwebsock',
            'email' => 'testowe2@example.com',
            'password' => bcrypt('password'),
            'email_verified' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
        ]);
    }
}
