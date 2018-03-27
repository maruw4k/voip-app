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
            'name' => 'Marek',
            'sip_address' => 'sip:marek@wwsi.onsip.com',
            'user_id' => '2',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
            ]
    );
        DB::table('contacts')->insert(
            [
            'id' => 2,
            'name' => 'Krzesza',
            'sip_address' => 'sip:krzesza@wwsi.onsip.com',
            'user_id' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
            ]
    );
        DB::table('contacts')->insert(
            [
            'id' => 3,
            'name' => 'Marowak',
            'sip_address' => 'sip:maruw4k@wwsi.onsip.com',
            'user_id' => '1',
            'created_at' => \Carbon\Carbon::now()->toDateTimeString(),
            ]
    );
    }
}
