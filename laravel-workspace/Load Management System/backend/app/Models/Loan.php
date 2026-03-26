<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @OA\Schema(
 *     schema="Loan",
 *     required={"id","user_id","loan_amount","loan_term_months","purpose","monthly_income","requested_date","status"},
 *     @OA\Property(property="id",               type="integer",  example=1),
 *     @OA\Property(property="user_id",           type="integer",  example=1),
 *     @OA\Property(property="loan_amount",       type="number",   format="double", example=50000.00),
 *     @OA\Property(property="loan_term_months",  type="integer",  example=12),
 *     @OA\Property(property="purpose",           type="string",   example="Business Expansion"),
 *     @OA\Property(property="monthly_income",    type="number",   format="double", example=25000.00),
 *     @OA\Property(property="requested_date",    type="string",   format="date",   example="2025-06-01"),
 *     @OA\Property(property="status",            type="string",   enum={"APPROVED","REJECTED","PENDING"}, example="APPROVED"),
 *     @OA\Property(property="total_interest",    type="number",   format="double", example=5000.00),
 *     @OA\Property(property="total_payable",     type="number",   format="double", example=55000.00),
 *     @OA\Property(property="created_at",        type="string",   format="date-time"),
 *     @OA\Property(property="updated_at",        type="string",   format="date-time")
 * )
 */
class Loan extends Model
{
    use HasFactory;

    protected $connection = 'mysql';

    protected $table = 'loans';

    protected $fillable = [
        'user_id',
        'loan_amount',
        'loan_term_months',
        'purpose',
        'monthly_income',
        'requested_date',
        'status',
        'total_interest',
        'total_payable',
    ];

    protected $casts = [
        'loan_amount'    => 'decimal:2',
        'monthly_income' => 'decimal:2',
        'total_interest' => 'decimal:2',
        'total_payable'  => 'decimal:2',
        'requested_date' => 'date',
    ];

    // ─── Relationships ───────────────────────────────────────

    public function repaymentSchedules(): HasMany
    {
        return $this->hasMany(RepaymentSchedule::class, 'loan_id');
    }
}