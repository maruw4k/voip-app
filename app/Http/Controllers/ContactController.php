<?php

namespace App\Http\Controllers;

use App\Contact;
use App\User;
use Illuminate\Http\Request;
use App\Http\Requests;

use Auth;
use Bican\Roles\Models\Permission;
use Bican\Roles\Models\Role;
use Hash;
use Input;
use Validator;

class ContactController extends Controller
{

    /**
     * Get all contact.
     *
     * @return JSON
     */
    public function getIndex()
    {
        $user = Auth::user();
        // $contact = Contact::all()->where('id', $user->id );
        $contacts = Contact::all();

        return response()->success(compact('contacts'));
    }

    public function deleteContact($id)
    {
        $contact = Contact::find($id);
        $contact->delete();
        return response()->success('success');
    }

    /**
     * Create new friend.
     *
     * @return JSON
     */
    public function postContacts()
    {
        $user = Auth::user();
        $contact = Contact::create([
            'name' => Input::get('name'),
            'sip_address' => Input::get('sip_address'),
            'user_id' => $user->id,
        ]);

        return response()->success(compact('contact'));
    }

    
}



