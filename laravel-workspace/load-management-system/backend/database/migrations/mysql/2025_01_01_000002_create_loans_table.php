<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql';

    public function up(): void
    {
        Schema::connection('mysql')->create('loans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');           // References users.id in PostgreSQL
            $table->decimal('loan_amount', 15, 2);
            $table->integer('loan_term_months');
            $table->string('purpose');
            $table->decimal('monthly_income', 15, 2);
            $table->date('requested_date');
            $table->string('status')->default('APPROVED');   // Auto-approved per requirement
            $table->decimal('total_interest', 15, 2)->default(0);
            $table->decimal('total_payable', 15, 2)->default(0);
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql')->dropIfExists('loans');
    }
};
