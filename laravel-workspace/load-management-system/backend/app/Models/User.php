<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

/**
 * @OA\Schema(
 *     schema="User",
 *     required={"id", "full_name", "email", "mobile", "address"},
 *     @OA\Property(property="id",        type="integer", example=1),
 *     @OA\Property(property="full_name", type="string",  example="John Doe"),
 *     @OA\Property(property="email",     type="string",  format="email", example="john@example.com"),
 *     @OA\Property(property="mobile",    type="string",  example="+8801712345678"),
 *     @OA\Property(property="address",   type="string",  example="123 Main St, Dhaka"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    /**
     * This model reads/writes from PostgreSQL.
     */
    protected $connection = 'pgsql';

    protected $table = 'users';

    protected $fillable = [
        'full_name',
        'email',
        'mobile',
        'address',
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Automatically hash the password when setting it.
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }

    // ─── JWT Interface ───────────────────────────────────────

    /**
     * Get the identifier that will be stored in the JWT subject claim.
     */
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * Return a key-value array of custom claims to be added to the JWT.
     */
    public function getJWTCustomClaims(): array
    {
        return [
            'email'     => $this->email,
            'full_name' => $this->full_name,
        ];
    }
}