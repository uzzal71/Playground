package main

import "fmt"

type Payment interface {
	Pay(amount float64) error
	Refund(amount float64) error
}

// --------------------
// Stripe
// --------------------

type Stripe struct{}

func (s Stripe) Pay(amount float64) error {
	fmt.Printf("Stripe: Payment of $%.2f processed.\n", amount)
	return nil
}

func (s Stripe) Refund(amount float64) error {
	fmt.Printf("Stripe: Refund of $%.2f processed.\n", amount)
	return nil
}

// --------------------
// bKash
// --------------------

type BKash struct{}

func (b BKash) Pay(amount float64) error {
	fmt.Printf("bKash: Payment of $%.2f processed.\n", amount)
	return nil
}

func (b BKash) Refund(amount float64) error {
	fmt.Printf("bKash: Refund of $%.2f processed.\n", amount)
	return nil
}

// --------------------
// Business Logic
// --------------------

func Checkout(p Payment, amount float64) error {
	return p.Pay(amount)
}

func CancelOrder(p Payment, amount float64) error {
	return p.Refund(amount)
}

func main() {
	var gateway Payment

	gateway = Stripe{}
	Checkout(gateway, 100)
	CancelOrder(gateway, 100)

	gateway = BKash{}
	Checkout(gateway, 80)
	CancelOrder(gateway, 80)
}