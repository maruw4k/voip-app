<?php

use Illuminate\Database\Seeder;

class ContactsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('contacts')->insert(
            [
            'id' => 1,
            'name' => 'Zosia',
            'sip_address' => 'sip:1111@192.168.0.17',
            'user_id' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
            ]
    );
        DB::table('contacts')->insert(
            [
            'id' => 2,
            'name' => 'Franek',
            'sip_address' => 'sip:marek@192.168.0.17',
            'user_id' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
            ]
    );
    }
}
