<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @OA\Schema(
 *     schema="RepaymentSchedule",
 *     required={"id","loan_id","installment_number","due_date","principal_amount","interest_amount","installment_amount","remaining_balance"},
 *     @OA\Property(property="id",                 type="integer",  example=1),
 *     @OA\Property(property="loan_id",            type="integer",  example=1),
 *     @OA\Property(property="installment_number", type="integer",  example=1),
 *     @OA\Property(property="due_date",           type="string",   format="date", example="2025-07-01"),
 *     @OA\Property(property="principal_amount",   type="number",   format="double", example=4166.67),
 *     @OA\Property(property="interest_amount",    type="number",   format="double", example=416.67),
 *     @OA\Property(property="installment_amount", type="number",   format="double", example=4583.33),
 *     @OA\Property(property="remaining_balance",  type="number",   format="double", example=45833.33),
 *     @OA\Property(property="status",             type="string",   enum={"PENDING","PAID"}, example="PENDING"),
 *     @OA\Property(property="created_at",         type="string",   format="date-time"),
 *     @OA\Property(property="updated_at",         type="string",   format="date-time")
 * )
 */
class RepaymentSchedule extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $table = 'repayment_schedules';

    protected $fillable = [
        'loan_id',
        'installment_number',
        'due_date',
        'principal_amount',
        'interest_amount',
        'installment_amount',
        'remaining_balance',
        'status',
    ];

    protected $casts = [
        'principal_amount'   => 'decimal:2',
        'interest_amount'    => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'remaining_balance'  => 'decimal:2',
        'due_date'           => 'date',
    ];

    // ─── Relationships ───────────────────────────────────────

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class, 'loan_id');
    }
}