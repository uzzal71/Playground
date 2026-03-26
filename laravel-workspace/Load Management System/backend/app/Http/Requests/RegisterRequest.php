<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @OA\Schema(
 *     schema="RegisterRequest",
 *     required={"full_name","email","mobile","address","password","password_confirmation"},
 *     @OA\Property(property="full_name",             type="string",  example="John Doe"),
 *     @OA\Property(property="email",                 type="string",  format="email", example="john@example.com"),
 *     @OA\Property(property="mobile",                type="string",  example="+8801712345678"),
 *     @OA\Property(property="address",               type="string",  example="123 Main St, Dhaka"),
 *     @OA\Property(property="password",              type="string",  format="password", example="SecurePass123!"),
 *     @OA\Property(property="password_confirmation", type="string",  format="password", example="SecurePass123!")
 * )
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'unique:pgsql.users,email'],
            'mobile'    => ['required', 'string', 'max:20'],
            'address'   => ['required', 'string', 'max:500'],
            'password'  => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
