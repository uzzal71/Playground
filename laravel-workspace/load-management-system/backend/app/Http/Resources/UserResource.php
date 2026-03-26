<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'full_name'  => $this->full_name,
            'email'      => $this->email,
            'mobile'     => $this->mobile,
            'address'    => $this->address,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
