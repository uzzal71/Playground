<?php

namespace App\Providers;

use App\Contracts\AuthRepositoryInterface;
use App\Contracts\LoanRepositoryInterface;
use App\Contracts\RepaymentRepositoryInterface;
use App\Repositories\AuthRepository;
use App\Repositories\LoanRepository;
use App\Repositories\RepaymentRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AuthRepositoryInterface::class, AuthRepository::class);
        $this->app->bind(LoanRepositoryInterface::class, LoanRepository::class);
        $this->app->bind(RepaymentRepositoryInterface::class, RepaymentRepository::class);
    }

    public function boot(): void
    {
        //
    }
}